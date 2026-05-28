import Vapor
import Fluent

struct CreateSessionRequest: Content {
    let title: String?
    let ttlHours: Int?
}

struct CreateSessionResponse: Content {
    let id: UUID
    let ownerToken: String
    let publicToken: String
    let viewerUrl: String
    let expiresAt: Date
}

struct SessionController {
    func create(req: Request) async throws -> CreateSessionResponse {
        let body = (try? req.content.decode(CreateSessionRequest.self)) ?? CreateSessionRequest(title: nil, ttlHours: nil)
        let session = LiveSession(title: body.title ?? "Workout", ttlHours: body.ttlHours ?? 24)
        try await session.save(on: req.db)

        // Build viewer URL from request host so it works in dev and prod without config.
        let scheme = req.headers.first(name: "x-forwarded-proto") ?? "http"
        let host = req.headers.first(name: "host") ?? "localhost:8080"
        let viewerUrl = "\(scheme)://\(host)/t/\(session.publicToken)"

        return CreateSessionResponse(
            id: try session.requireID(),
            ownerToken: session.ownerToken,
            publicToken: session.publicToken,
            viewerUrl: viewerUrl,
            expiresAt: session.expiresAt
        )
    }

    func ingest(req: Request) async throws -> HTTPStatus {
        let session = try await loadOwned(req: req)
        guard session.endedAt == nil else {
            throw Abort(.gone, reason: "session ended")
        }

        let batch = try req.content.decode(PingBatch.self)
        guard !batch.pings.isEmpty else { return .noContent }
        guard batch.pings.count <= 500 else {
            throw Abort(.payloadTooLarge, reason: "batch too large")
        }

        let sessionId = try session.requireID()
        try await req.db.transaction { db in
            for p in batch.pings {
                let ping = LocationPing()
                ping.$session.id = sessionId
                ping.ts = p.ts
                ping.lat = p.lat
                ping.lon = p.lon
                ping.altitude = p.alt
                ping.speed = p.spd
                ping.heading = p.hdg
                ping.horizontalAccuracy = p.acc
                try await ping.save(on: db)
            }
        }
        return .accepted
    }

    func end(req: Request) async throws -> HTTPStatus {
        let session = try await loadOwned(req: req)
        if session.endedAt == nil {
            session.endedAt = Date()
            try await session.save(on: req.db)
        }
        return .ok
    }

    private func loadOwned(req: Request) async throws -> LiveSession {
        guard let id = req.parameters.get("id", as: UUID.self) else {
            throw Abort(.badRequest, reason: "invalid session id")
        }
        guard let token = req.headers.bearerAuthorization?.token else {
            throw Abort(.unauthorized, reason: "missing bearer owner token")
        }
        guard let session = try await LiveSession.find(id, on: req.db) else {
            throw Abort(.notFound)
        }
        guard session.ownerToken == token else {
            throw Abort(.forbidden)
        }
        return session
    }
}
