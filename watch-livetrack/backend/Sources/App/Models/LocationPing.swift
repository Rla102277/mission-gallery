import Vapor
import Fluent

final class LocationPing: Model, Content, @unchecked Sendable {
    static let schema = "location_pings"

    @ID(key: .id) var id: UUID?
    @Parent(key: "session_id") var session: LiveSession
    @Field(key: "ts") var ts: Date
    @Field(key: "lat") var lat: Double
    @Field(key: "lon") var lon: Double
    @OptionalField(key: "alt_m") var altitude: Double?
    @OptionalField(key: "speed_mps") var speed: Double?
    @OptionalField(key: "heading_deg") var heading: Double?
    @OptionalField(key: "h_acc_m") var horizontalAccuracy: Double?

    init() {}
}

// Wire payload posted by the watch — kept minimal to save bytes.
struct PingPayload: Content {
    let ts: Date
    let lat: Double
    let lon: Double
    let alt: Double?
    let spd: Double?
    let hdg: Double?
    let acc: Double?
}

struct PingBatch: Content {
    let pings: [PingPayload]
}
