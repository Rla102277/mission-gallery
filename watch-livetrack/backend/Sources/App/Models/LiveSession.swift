import Vapor
import Fluent

final class LiveSession: Model, Content, @unchecked Sendable {
    static let schema = "live_sessions"

    @ID(key: .id) var id: UUID?
    // The id used in /sessions/:id/* endpoints — owner-known.
    @Field(key: "owner_token") var ownerToken: String
    // The public viewer token — appears in /t/:token URLs.
    @Field(key: "public_token") var publicToken: String
    @Field(key: "title") var title: String
    @Field(key: "started_at") var startedAt: Date
    @OptionalField(key: "ended_at") var endedAt: Date?
    @Field(key: "expires_at") var expiresAt: Date

    @Children(for: \.$session) var pings: [LocationPing]

    init() {}

    init(title: String, ttlHours: Int = 24) {
        self.title = title
        self.ownerToken = LiveSession.randomToken()
        self.publicToken = LiveSession.randomToken()
        self.startedAt = Date()
        self.endedAt = nil
        self.expiresAt = Date().addingTimeInterval(TimeInterval(ttlHours) * 3600)
    }

    static func randomToken() -> String {
        var bytes = [UInt8](repeating: 0, count: 16)
        for i in 0..<bytes.count { bytes[i] = UInt8.random(in: 0...255) }
        return bytes.map { String(format: "%02x", $0) }.joined()
    }
}
