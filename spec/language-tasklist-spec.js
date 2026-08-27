describe("language-tasklist", () => {
  beforeEach(async () => {
    await lumine.packages.activatePackage("language-tasklist");
  });

  it("loads the tasklist grammar", () => {
    const grammar = lumine.grammars.grammarForScopeName("text.tasklist");
    expect(grammar).toBeTruthy();
    expect(grammar.name).toBe("Tasklist");
  });

  it("selects the tasklist grammar for .tasklist and .todo files", () => {
    expect(lumine.grammars.selectGrammar("notes.tasklist", "").scopeName).toBe("text.tasklist");
    expect(lumine.grammars.selectGrammar("notes.todo", "").scopeName).toBe("text.tasklist");
  });

  it("tokenizes task lines by tick state", () => {
    const grammar = lumine.grammars.grammarForScopeName("text.tasklist");

    const done = grammar.tokenizeLine("✔ finished task").tokens;
    expect(done[0].scopes).toContain("tick.done.task.tasklist");

    const todo = grammar.tokenizeLine("☐ pending task").tokens;
    expect(todo[0].scopes).toContain("tick.todo.task.tasklist");

    const fail = grammar.tokenizeLine("✘ rejected task").tokens;
    expect(fail[0].scopes).toContain("tick.fail.task.tasklist");
  });

  it("tokenizes chapters and headers", () => {
    const grammar = lumine.grammars.grammarForScopeName("text.tasklist");

    const chapter = grammar.tokenizeLine("# Chapter").tokens;
    expect(chapter[0].scopes).toContain("symbol.chapter.tasklist");

    const header = grammar.tokenizeLine("Header:").tokens;
    const scopes = header.flatMap((token) => token.scopes);
    expect(scopes).toContain("symbol.header.tasklist");
  });

  // The per-grammar settings live in the `grammar` namespace; under the
  // legacy `editor` one nothing reads them.
  describe("scoped settings", () => {
    it("indents the tasks under a header", async () => {
      const editor = await lumine.workspace.open("notes.tasklist");
      expect(editor.getGrammar().scopeName).toBe("text.tasklist");

      editor.setText("Header:\n☐ pending task");
      editor.autoIndentBufferRows(0, editor.getLineCount() - 1);
      expect(editor.lineTextForBufferRow(1)).toBe("  ☐ pending task");
    });
  });
});
