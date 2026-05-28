import SwiftUI

@main
struct LiveTrackWatchApp: App {
    @StateObject private var manager = WorkoutSessionManager()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(manager)
        }
    }
}
