import SwiftUI

struct RootView: View {
    @EnvironmentObject var manager: WorkoutSessionManager
    @State private var title: String = "Workout"

    var body: some View {
        VStack(spacing: 8) {
            switch manager.state {
            case .idle:
                Text("LiveTrack")
                    .font(.headline)
                Button {
                    manager.start(title: title)
                } label: {
                    Label("Start beacon", systemImage: "dot.radiowaves.left.and.right")
                }
                .buttonStyle(.borderedProminent)
                .tint(.green)

                Text("Start Apple's Workout app first, then start the beacon.")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)

            case .starting:
                ProgressView("Starting…")

            case .running(let viewerUrl):
                Text("Live").foregroundStyle(.green).font(.caption.weight(.bold))
                if let fix = manager.lastFix {
                    Text(String(format: "%.5f, %.5f", fix.coordinate.latitude, fix.coordinate.longitude))
                        .font(.caption2.monospacedDigit())
                        .foregroundStyle(.secondary)
                } else {
                    Text("acquiring GPS…").font(.caption2).foregroundStyle(.secondary)
                }
                Text("Queued: \(manager.pendingCount)")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                Text(viewerUrl)
                    .font(.caption2)
                    .lineLimit(2)
                    .truncationMode(.middle)
                Button(role: .destructive) {
                    manager.stop()
                } label: {
                    Label("End beacon", systemImage: "stop.fill")
                }

            case .ending:
                ProgressView("Ending…")

            case .error(let msg):
                Text("Error").foregroundStyle(.red).font(.headline)
                Text(msg).font(.caption2).multilineTextAlignment(.center)
                Button("Reset") { /* state will reset on next start */ }
            }
        }
        .padding(.horizontal, 8)
    }
}
