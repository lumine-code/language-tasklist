const path = require("path");

describe("Tasklist sample fixtures", () => {
  beforeEach(async () => {
    await lumine.packages.activatePackage("language-tasklist");
  });

  it("parses sample.tasklist without error", async () => {
    const editor = await lumine.workspace.open(path.join(__dirname, "fixtures", "sample.tasklist"));
    const languageMode = editor.getBuffer().getLanguageMode();
    await languageMode.ready;

    expect(editor.getGrammar().scopeName).toBe("text.tasklist");
    expect(editor.languageMode.tree.rootNode.hasError).toBe(false);
    const root = editor.getSyntaxNodeAtBufferPosition([0, 0], (node) => node.parent == null);
    expect(root.descendantsOfType("task").length).toBeGreaterThan(0);
    expect(root.descendantsOfType("bold").length).toBeGreaterThan(0);
  });
});
