const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");

// Exercise the real admin functions with an isolated, in-memory state.
// No authentication bypass, network requests, or database writes.
const html = fs.readFileSync("admin/index.html", "utf8");
const source = html.slice(
  html.indexOf("function normalizeStories("),
  html.indexOf("let storyPickerTarget=null;"),
);
const escapeSource = html.match(/^function esc\(s\).*$/m)[0];
const body = { innerHTML: "" };
const context = vm.createContext({
  STATE: {},
  document: { getElementById: () => body },
  setPanel: () => {},
  confirm: () => true,
  TIA: { photoUrl: () => "/test-image.jpg" },
});
vm.runInContext(source + "\n" + escapeSource, context);
vm.runInContext(`
  STATE.stories=normalizeStories({});
  createNewStory();
  updateStoryField(STATE.stories[0].id, "title", "Photographer's Story");
  addStoryBlock(STATE.stories[0].id, "text");
  updateStoryBlock(STATE.stories[0].id, 0, "html", "<p>Example</p>");
  addStoryBlock(STATE.stories[0].id, "image");
`, context);
assert.equal(context.STATE.stories.length, 1);
assert.equal(context.STATE.stories[0].blocks.length, 2);
assert.equal(context.STATE.stories[0].blocks[0].html, "<p>Example</p>");
assert.match(body.innerHTML, /Photographer&#39;s Story/);
vm.runInContext(`
  removeStoryBlock(STATE.stories[0].id, 1);
`, context);
assert.equal(context.STATE.stories[0].blocks.length, 1);
vm.runInContext("deleteStory(STATE.stories[0].id)", context);
assert.equal(context.STATE.stories.length, 0);
assert.match(body.innerHTML, /No stories yet/);
vm.runInContext(`
  STATE.stories=normalizeStories({ legacy: { title: "Existing" } });
`, context);
assert.equal(context.STATE.stories[0].id, "legacy");
assert.equal(context.STATE.stories[0].title, "Existing");
console.log("Stories normalization, create/edit/blocks/delete, and text escaping passed.");
