import Foundation
import HealthKit
import CoreLocation
import Combine

// Drives an HKWorkoutSession purely to keep the app + GPS alive during a workout.
// We never call workoutBuilder.finishWorkout, so nothing is written to HealthKit —
// Apple's Workout app remains the owner of the user's HK record.
@MainActor
final class WorkoutSessionManager: NSObject, ObservableObject {
    enum State: Equatable {
        case idle
        case starting
        case running(viewerUrl: String)
        case ending
        case error(String)
    }

    @Published private(set) var state: State = .idle
    @Published private(set) var lastFix: CLLocation?
    @Published private(set) var pendingCount: Int = 0

    private let healthStore = HKHealthStore()
    private var workoutSession: HKWorkoutSession?
    private var workoutBuilder: HKLiveWorkoutBuilder?

    private let locationManager = CLLocationManager()
    private let client = LiveTrackClient()

    private var sessionId: UUID?
    private var ownerToken: String?
    private var buffer: [PingPayload] = []
    private var flushTask: Task<Void, Never>?
    private var lastSampleAt: Date = .distantPast

    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.activityType = .fitness
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
    }

    func start(title: String) {
        guard case .idle = state else { return }
        state = .starting

        Task {
            do {
                try await requestPermissions()
                let response = try await client.createSession(title: title)
                self.sessionId = response.id
                self.ownerToken = response.ownerToken
                try startWorkout()
                locationManager.startUpdatingLocation()
                startFlushLoop()
                state = .running(viewerUrl: response.viewerUrl)
            } catch {
                state = .error(error.localizedDescription)
            }
        }
    }

    func stop() {
        guard case .running = state else { return }
        state = .ending
        locationManager.stopUpdatingLocation()
        flushTask?.cancel()
        flushTask = nil

        if let session = workoutSession {
            session.end()
        }
        workoutSession = nil
        workoutBuilder = nil

        Task {
            // Flush remaining pings, then mark session ended.
            await flush()
            if let id = sessionId, let token = ownerToken {
                try? await client.endSession(sessionId: id, ownerToken: token)
            }
            sessionId = nil
            ownerToken = nil
            buffer.removeAll()
            pendingCount = 0
            state = .idle
        }
    }

    // MARK: HealthKit

    private func requestPermissions() async throws {
        let types: Set<HKSampleType> = []
        // We don't need to read/write any specific samples; HKWorkoutSession itself
        // requires HealthKit availability. Calling requestAuthorization with the
        // workoutType ensures the runtime gives us a session.
        let toShare: Set<HKSampleType> = [HKObjectType.workoutType()]
        try await healthStore.requestAuthorization(toShare: toShare, read: types)
    }

    private func startWorkout() throws {
        let config = HKWorkoutConfiguration()
        config.activityType = .other            // Generic; Apple Workout app picks its own.
        config.locationType = .outdoor

        let session = try HKWorkoutSession(healthStore: healthStore, configuration: config)
        let builder = session.associatedWorkoutBuilder()
        builder.dataSource = HKLiveWorkoutDataSource(healthStore: healthStore, workoutConfiguration: config)
        session.delegate = self
        builder.delegate = self

        let start = Date()
        session.startActivity(with: start)
        builder.beginCollection(withStart: start) { _, _ in }

        self.workoutSession = session
        self.workoutBuilder = builder
    }

    // MARK: Ping buffer

    private func startFlushLoop() {
        flushTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: UInt64(LiveTrackConfig.flushInterval * 1_000_000_000))
                await self?.flush()
            }
        }
    }

    private func flush() async {
        guard !buffer.isEmpty,
              let id = sessionId,
              let token = ownerToken else { return }
        let toSend = Array(buffer.prefix(LiveTrackConfig.maxBatchSize))
        do {
            try await client.upload(batch: PingBatch(pings: toSend),
                                    sessionId: id, ownerToken: token)
            buffer.removeFirst(toSend.count)
            pendingCount = buffer.count
        } catch {
            // Keep buffer; will retry next tick. Cap size so we don't grow unbounded.
            if buffer.count > 2000 {
                buffer.removeFirst(buffer.count - 2000)
            }
            pendingCount = buffer.count
        }
    }
}

extension WorkoutSessionManager: CLLocationManagerDelegate {
    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        Task { @MainActor in
            for loc in locations {
                // Throttle to configured cadence and drop low-quality fixes.
                guard loc.horizontalAccuracy > 0, loc.horizontalAccuracy < 50 else { continue }
                guard loc.timestamp.timeIntervalSince(lastSampleAt) >= LiveTrackConfig.pingCadence else { continue }
                lastSampleAt = loc.timestamp
                lastFix = loc
                let payload = PingPayload(
                    ts: loc.timestamp,
                    lat: loc.coordinate.latitude,
                    lon: loc.coordinate.longitude,
                    alt: loc.verticalAccuracy >= 0 ? loc.altitude : nil,
                    spd: loc.speed >= 0 ? loc.speed : nil,
                    hdg: loc.course >= 0 ? loc.course : nil,
                    acc: loc.horizontalAccuracy
                )
                buffer.append(payload)
                pendingCount = buffer.count
            }
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        Task { @MainActor in
            self.state = .error(error.localizedDescription)
        }
    }
}

extension WorkoutSessionManager: HKWorkoutSessionDelegate, HKLiveWorkoutBuilderDelegate {
    nonisolated func workoutSession(_ workoutSession: HKWorkoutSession,
                        didChangeTo toState: HKWorkoutSessionState,
                        from fromState: HKWorkoutSessionState,
                        date: Date) {}
    nonisolated func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
        Task { @MainActor in self.state = .error(error.localizedDescription) }
    }
    nonisolated func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder,
                        didCollectDataOf collectedTypes: Set<HKSampleType>) {}
    nonisolated func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}
}
