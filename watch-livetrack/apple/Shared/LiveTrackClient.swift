import Foundation

enum LiveTrackClientError: Error {
    case http(Int)
    case noData
}

actor LiveTrackClient {
    private let session: URLSession
    private let decoder = LiveTrackAPI.iso8601JSONDecoder()
    private let encoder = LiveTrackAPI.iso8601JSONEncoder()

    init(session: URLSession = .shared) {
        self.session = session
    }

    func createSession(title: String, ttlHours: Int = LiveTrackConfig.defaultTTLHours) async throws -> CreateSessionResponse {
        var req = URLRequest(url: LiveTrackConfig.baseURL.appendingPathComponent("sessions"))
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try encoder.encode(CreateSessionRequest(title: title, ttlHours: ttlHours))
        let (data, resp) = try await session.data(for: req)
        try Self.check(resp)
        return try decoder.decode(CreateSessionResponse.self, from: data)
    }

    func upload(batch: PingBatch, sessionId: UUID, ownerToken: String) async throws {
        var req = URLRequest(url: LiveTrackConfig.baseURL
            .appendingPathComponent("sessions")
            .appendingPathComponent(sessionId.uuidString)
            .appendingPathComponent("pings"))
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(ownerToken)", forHTTPHeaderField: "Authorization")
        req.httpBody = try encoder.encode(batch)
        let (_, resp) = try await session.data(for: req)
        try Self.check(resp)
    }

    func endSession(sessionId: UUID, ownerToken: String) async throws {
        var req = URLRequest(url: LiveTrackConfig.baseURL
            .appendingPathComponent("sessions")
            .appendingPathComponent(sessionId.uuidString)
            .appendingPathComponent("end"))
        req.httpMethod = "POST"
        req.setValue("Bearer \(ownerToken)", forHTTPHeaderField: "Authorization")
        let (_, resp) = try await session.data(for: req)
        try Self.check(resp)
    }

    private static func check(_ resp: URLResponse) throws {
        guard let http = resp as? HTTPURLResponse else { return }
        guard (200..<300).contains(http.statusCode) else {
            throw LiveTrackClientError.http(http.statusCode)
        }
    }
}
