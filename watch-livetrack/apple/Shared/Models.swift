import Foundation

// Mirrors the backend wire types so the same file can be added to both Apple targets.

struct PingPayload: Codable {
    let ts: Date
    let lat: Double
    let lon: Double
    let alt: Double?
    let spd: Double?
    let hdg: Double?
    let acc: Double?
}

struct PingBatch: Codable {
    let pings: [PingPayload]
}

struct CreateSessionRequest: Codable {
    let title: String?
    let ttlHours: Int?
}

struct CreateSessionResponse: Codable {
    let id: UUID
    let ownerToken: String
    let publicToken: String
    let viewerUrl: String
    let expiresAt: Date
}

struct TrackMeta: Codable {
    let title: String
    let startedAt: Date
    let endedAt: Date?
    let expired: Bool
}

enum LiveTrackAPI {
    static func iso8601JSONDecoder() -> JSONDecoder {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }
    static func iso8601JSONEncoder() -> JSONEncoder {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .iso8601
        return e
    }
}
