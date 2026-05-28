import Foundation

enum LiveTrackConfig {
    // Set to your backend's public origin before shipping. Override at runtime via UserDefaults("backendBaseURL") if you want.
    static var baseURL: URL {
        if let s = UserDefaults.standard.string(forKey: "backendBaseURL"),
           let u = URL(string: s) {
            return u
        }
        return URL(string: "http://localhost:8080")!
    }

    static let pingCadence: TimeInterval = 5        // seconds between samples
    static let flushInterval: TimeInterval = 15     // seconds between uploads
    static let maxBatchSize = 200
    static let defaultTTLHours = 24
}
