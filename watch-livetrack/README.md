# watch-livetrack

A Strava Beacon–style live tracker that runs on Apple Watch alongside the native Workout app, streaming GPS pings to a backend and exposing a tokenized public URL friends can open on any phone.

## Pieces

- `backend/` — Swift + Vapor server. Stores live sessions, ingests location pings, serves the public viewer page.
- `apple/WatchApp/` — watchOS sources. Runs `HKWorkoutSession` (not saved to HealthKit) + `CLLocationManager` to stream pings.
- `apple/iOSApp/` — iOS companion sources. Generates shareable links, lists past sessions, manages backend URL.
- `apple/Shared/` — Codable models shared between watch / iOS / backend payloads.

## Design notes

- Concurrent with Apple Workout: the watch starts its own `HKWorkoutSession` in `.other` activity type purely to keep GPS + the app alive. We **do not** call `workoutBuilder.finishWorkout`, so nothing is written to HealthKit — Apple's Workout app owns the user-facing HK record.
- Tokenized public URL: each session gets a 128-bit random token. Anyone with `/t/<token>` sees the live map. Tokens auto-expire `expiresInHours` after the workout ends (default 24h).
- Pings are batched on the watch (5s cadence, flushed every 15s or on network availability) to save battery.

## Running the backend locally

```bash
cd backend
swift run
# server listens on http://localhost:8080
# public viewer: http://localhost:8080/t/<token>
```

## Assembling the Apple side

The Apple sources are provided as standalone Swift files because Xcode project files don't round-trip well through generated tooling. To turn them into a working app:

1. In Xcode: **File → New → Project → Multiplatform App** named `LiveTrack`.
2. Add a **Watch App** target named `LiveTrackWatch`.
3. Drag the contents of `apple/WatchApp/` into the watch target.
4. Drag the contents of `apple/iOSApp/` into the iOS target.
5. Drag `apple/Shared/` into both targets (check "Add to both").
6. In **Signing & Capabilities** for the watch target, enable **HealthKit** and **Background Modes → Location updates**.
7. In `Info.plist` for both targets add:
   - `NSLocationWhenInUseUsageDescription` — "Used to share your live workout location."
   - `NSLocationAlwaysAndWhenInUseUsageDescription` — same.
   - `NSHealthShareUsageDescription` / `NSHealthUpdateUsageDescription` — "Used to keep GPS active during workouts."
8. Set the backend base URL in `apple/Shared/Config.swift` before building.

## Roadmap

- [ ] Auth on iOS (Sign in with Apple) so sessions are owned by a user account.
- [ ] Push to specific contacts when a session starts.
- [ ] Recap page (route, splits) after expiry.
- [ ] Live websocket fan-out instead of polling.
