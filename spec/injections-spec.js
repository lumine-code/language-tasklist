const fs = require("fs");
const path = require("path");

const packagePath = (name) => {
  const sibling = path.resolve(__dirname, "..", "..", name);
  return fs.existsSync(sibling) ? sibling : name;
};

describe("Tasklist static annotations", () => {
  let editor;

  beforeEach(async () => {
    for (const name of ["language-tasklist", "language-hyperlink", "language-todo"]) {
      await lumine.packages.activatePackage(packagePath(name));
    }
    editor = await lumine.workspace.open();
    editor.setGrammar(lumine.grammars.grammarForScopeName("text.tasklist"));
  });

  afterEach(async () => {
    editor?.destroy();
    await lumine.packages.enablePackage("language-todo");
  });

  const annotationLayers = () =>
    editor.languageMode
      .getAllInjectionLayers()
      .filter((layer) => ["text.todo", "text.hyperlink"].includes(layer.grammar.scopeName));

  async function setText(text) {
    editor.setText(text);
    await editor.languageMode.ready;
    await editor.languageMode.atGrammarSettlement();
  }

  it("filters ordinary text and keeps completed and formatted task text opaque", async () => {
    await setText(
      [
        "☐ ordinary text",
        "☐ TODO visit https://example.com/active",
        "✔ TODO https://example.com/completed",
        "☐ `TODO https://example.com/raw`",
      ].join("\n"),
    );
    const layers = annotationLayers();
    expect(layers.map((layer) => layer.grammar.scopeName).sort()).toEqual([
      "text.hyperlink",
      "text.todo",
    ]);
    for (const layer of layers) {
      expect(layer.getCurrentRanges().every((range) => range.start.row === 1)).toBe(true);
    }
    expect(editor.scopeDescriptorForBufferPosition([1, 2]).getScopesArray()).toContain(
      "storage.type.class.todo",
    );
  });

  it("removes disabled annotations and restores them without reactivating the host", async () => {
    await setText("☐ TODO finish this task");
    const host = lumine.packages.getActivePackage("language-tasklist");
    expect(annotationLayers().map((layer) => layer.grammar.scopeName)).toEqual(["text.todo"]);
    await lumine.packages.disablePackage("language-todo");
    await editor.languageMode.atGrammarSettlement();
    expect(annotationLayers()).toEqual([]);
    await lumine.packages.enablePackage("language-todo");
    await editor.languageMode.atGrammarSettlement();
    expect(annotationLayers().map((layer) => layer.grammar.scopeName)).toEqual(["text.todo"]);
    expect(lumine.packages.getActivePackage("language-tasklist")).toBe(host);
  });
});
