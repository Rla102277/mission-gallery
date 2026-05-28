import Vapor
import Fluent
import FluentSQLiteDriver

public func configure(_ app: Application) throws {
    let dbPath = Environment.get("LIVETRACK_DB") ?? "livetrack.sqlite"
    app.databases.use(.sqlite(.file(dbPath)), as: .sqlite)

    app.migrations.add(CreateLiveSession())
    app.migrations.add(CreateLocationPing())
    try app.autoMigrate().wait()

    app.middleware.use(FileMiddleware(publicDirectory: app.directory.publicDirectory))

    // Body size limit — pings are tiny, but allow batches.
    app.routes.defaultMaxBodySize = "256kb"

    try routes(app)
}
