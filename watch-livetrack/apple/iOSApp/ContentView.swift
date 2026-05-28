import SwiftUI

struct ContentView: View {
    @AppStorage("backendBaseURL") private var backendBaseURL: String = "http://localhost:8080"
    @State private var testTitle: String = "Test Run"
    @State private var lastLink: String?
    @State private var error: String?
    @State private var isBusy = false

    private let client = LiveTrackClient()

    var body: some View {
        NavigationStack {
            Form {
                Section("Backend") {
                    TextField("Base URL", text: $backendBaseURL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)
                    Text("Used by both the iPhone app and the paired Watch app.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Section("Try it") {
                    TextField("Title", text: $testTitle)
                    Button {
                        Task { await createTestSession() }
                    } label: {
                        if isBusy { ProgressView() } else { Text("Create a test viewer link") }
                    }
                    .disabled(isBusy)

                    if let lastLink {
                        Link(destination: URL(string: lastLink)!) {
                            Text(lastLink).font(.footnote).lineLimit(2)
                        }
                        ShareLink(item: URL(string: lastLink)!) {
                            Label("Share link", systemImage: "square.and.arrow.up")
                        }
                    }
                    if let error {
                        Text(error).foregroundStyle(.red).font(.footnote)
                    }
                }

                Section("How it works") {
                    Label("Start Apple's Workout app as normal.", systemImage: "1.circle")
                    Label("On the Watch, open LiveTrack and tap Start beacon.", systemImage: "2.circle")
                    Label("Share the viewer link with anyone — no login needed.", systemImage: "3.circle")
                    Label("Link expires automatically after the workout ends.", systemImage: "clock")
                }
            }
            .navigationTitle("LiveTrack")
        }
    }

    private func createTestSession() async {
        isBusy = true
        defer { isBusy = false }
        error = nil
        do {
            let res = try await client.createSession(title: testTitle)
            lastLink = res.viewerUrl
        } catch {
            self.error = "\(error)"
        }
    }
}

#Preview {
    ContentView()
}
