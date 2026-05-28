import Fluent

struct CreateLiveSession: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("live_sessions")
            .id()
            .field("owner_token", .string, .required)
            .field("public_token", .string, .required)
            .field("title", .string, .required)
            .field("started_at", .datetime, .required)
            .field("ended_at", .datetime)
            .field("expires_at", .datetime, .required)
            .unique(on: "owner_token")
            .unique(on: "public_token")
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema("live_sessions").delete()
    }
}

struct CreateLocationPing: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("location_pings")
            .id()
            .field("session_id", .uuid, .required, .references("live_sessions", "id", onDelete: .cascade))
            .field("ts", .datetime, .required)
            .field("lat", .double, .required)
            .field("lon", .double, .required)
            .field("alt_m", .double)
            .field("speed_mps", .double)
            .field("heading_deg", .double)
            .field("h_acc_m", .double)
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema("location_pings").delete()
    }
}
