import Vapor
import Fluent

struct TrackMeta: Content {
    let title: String
    let startedAt: Date
    let endedAt: Date?
    let expired: Bool
}

struct TrackPings: Content {
    let pings: [PingPayload]
    let endedAt: Date?
}

struct TrackController {
    func viewer(req: Request) async throws -> Response {
        // Just serve the static viewer; JS reads :token from the URL.
        _ = try await loadPublic(req: req)
        let path = req.application.directory.publicDirectory + "track.html"
        return req.fileio.streamFile(at: path)
    }

    func meta(req: Request) async throws -> TrackMeta {
        let session = try await loadPublic(req: req)
        return TrackMeta(
            title: session.title,
            startedAt: session.startedAt,
            endedAt: session.endedAt,
            expired: session.expiresAt < Date()
        )
    }

    func pings(req: Request) async throws -> TrackPings {
        let session = try await loadPublic(req: req)
        let sinceParam = req.query[String.self, at: "since"]
        let since = sinceParam.flatMap { ISO8601DateFormatter().date(from: $0) }

        var query = LocationPing.query(on: req.db)
            .filter(\.$session.$id == (try session.requireID()))
            .sort(\.$ts, .ascending)
            .limit(2000)
        if let since {
            query = query.filter(\.$ts > since)
        }
        let rows = try await query.all()
        let payloads = rows.map {
            PingPayload(ts: $0.ts, lat: $0.lat, lon: $0.lon,
                        alt: $0.altitude, spd: $0.speed,
                        hdg: $0.heading, acc: $0.horizontalAccuracy)
        }
        return TrackPings(pings: payloads, endedAt: session.endedAt)
    }

    private func loadPublic(req: Request) async throws -> LiveSession {
        guard let token = req.parameters.get("token") else {
            throw Abort(.badRequest)
        }
        guard let session = try await LiveSession.query(on: req.db)
            .filter(\.$publicToken == token)
            .first()
        else {
            throw Abort(.notFound)
        }
        if session.expiresAt < Date() {
            throw Abort(.gone, reason: "link expired")
        }
        return session
    }
}
