import Vapor

func routes(_ app: Application) throws {
    app.get("health") { _ in "ok" }

    let sessions = SessionController()
    app.post("sessions", use: sessions.create)
    app.post("sessions", ":id", "pings", use: sessions.ingest)
    app.post("sessions", ":id", "end", use: sessions.end)

    let track = TrackController()
    app.get("t", ":token", use: track.viewer)
    app.get("t", ":token", "pings", use: track.pings)
    app.get("t", ":token", "meta", use: track.meta)
}
