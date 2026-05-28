import XCTVapor
@testable import App

final class AppTests: XCTestCase {
    func makeApp() throws -> Application {
        let app = Application(.testing)
        try configure(app)
        return app
    }

    func testFullLifecycle() async throws {
        let app = try makeApp()
        defer { app.shutdown() }

        // 1) Create session
        var ownerToken = ""
        var publicToken = ""
        var sessionId = ""
        try await app.test(.POST, "sessions",
            beforeRequest: { req in
                try req.content.encode(CreateSessionRequest(title: "Test Run", ttlHours: 1))
            },
            afterResponse: { res async in
                XCTAssertEqual(res.status, .ok)
                let body = try? res.content.decode(CreateSessionResponse.self)
                XCTAssertNotNil(body)
                ownerToken = body?.ownerToken ?? ""
                publicToken = body?.publicToken ?? ""
                sessionId = body?.id.uuidString ?? ""
                XCTAssertFalse(ownerToken.isEmpty)
                XCTAssertFalse(publicToken.isEmpty)
            }
        )

        // 2) Ingest a ping with owner bearer
        try await app.test(.POST, "sessions/\(sessionId)/pings",
            beforeRequest: { req in
                req.headers.bearerAuthorization = .init(token: ownerToken)
                let batch = PingBatch(pings: [
                    PingPayload(ts: Date(), lat: 37.7749, lon: -122.4194,
                                alt: 50, spd: 2.5, hdg: 90, acc: 5)
                ])
                try req.content.encode(batch)
            },
            afterResponse: { res async in
                XCTAssertEqual(res.status, .accepted)
            }
        )

        // 3) Reject ingest with wrong token
        try await app.test(.POST, "sessions/\(sessionId)/pings",
            beforeRequest: { req in
                req.headers.bearerAuthorization = .init(token: "wrong")
                try req.content.encode(PingBatch(pings: []))
            },
            afterResponse: { res async in
                XCTAssertEqual(res.status, .forbidden)
            }
        )

        // 4) Public read returns the ping
        try await app.test(.GET, "t/\(publicToken)/pings",
            afterResponse: { res async in
                XCTAssertEqual(res.status, .ok)
                let body = try? res.content.decode(TrackPings.self)
                XCTAssertEqual(body?.pings.count, 1)
            }
        )

        // 5) End the session
        try await app.test(.POST, "sessions/\(sessionId)/end",
            beforeRequest: { req in
                req.headers.bearerAuthorization = .init(token: ownerToken)
            },
            afterResponse: { res async in
                XCTAssertEqual(res.status, .ok)
            }
        )

        // 6) Further ingest is rejected
        try await app.test(.POST, "sessions/\(sessionId)/pings",
            beforeRequest: { req in
                req.headers.bearerAuthorization = .init(token: ownerToken)
                try req.content.encode(PingBatch(pings: [
                    PingPayload(ts: Date(), lat: 0, lon: 0, alt: nil, spd: nil, hdg: nil, acc: nil)
                ]))
            },
            afterResponse: { res async in
                XCTAssertEqual(res.status, .gone)
            }
        )
    }
}
