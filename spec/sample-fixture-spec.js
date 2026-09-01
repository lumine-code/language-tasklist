const path = require("path");

describe("Tasklist sample fixtures", () => {
  beforeEach(async () => {
    lumine.config.set("editor.useTreeSitterParsers", true);
    await lumine.packages.activatePackage("language-tasklist");
  });

  it("parses sample.tasklist without error", async () => {
    const editor = await lumine.workspace.open(path.join(__dirname, "fixtures", "sample.tasklist"));
    const languageMode = editor.getBuffer().getLanguageMode();
    await languageMode.ready;

    expect(editor.getGrammar().scopeName).toBe("text.tasklist");
    expect(languageMode.tree.rootNode.hasError).toBe(false);
    expect(languageMode.tree.rootNode.descendantsOfType("task").length).toBeGreaterThan(0);
    expect(languageMode.tree.rootNode.descendantsOfType("bold").length).toBeGreaterThan(0);
  });
});
