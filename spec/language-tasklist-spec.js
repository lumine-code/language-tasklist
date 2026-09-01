describe("language-tasklist", () => {
  let editor;
  let languageMode;
  let grammar;

  const setUp = async (text) => {
    editor = await lumine.workspace.open();
    editor.setGrammar(grammar);
    editor.setText(text);
    languageMode = editor.getBuffer().getLanguageMode();
    await languageMode.ready;
    await languageMode.atTransactionEnd();
  };

  const scopesAt = (needle, offset = 0) => {
    const index = editor.getText().indexOf(needle);
    expect(index).not.toBe(-1);
    const point = editor.getBuffer().positionForCharacterIndex(index + offset);
    return editor.scopeDescriptorForBufferPosition(point).getScopesArray();
  };

  const foldedBufferRanges = () =>
    editor.displayLayer.foldRangesSnapshot().map((range) => [range.start.row, range.end.row]);

  beforeEach(async () => {
    lumine.config.set("editor.useTreeSitterParsers", true);
    await lumine.packages.activatePackage("language-tasklist");
    grammar = lumine.grammars.grammarForScopeName("text.tasklist");
  });

  it("registers only the Tree-sitter tasklist grammar", () => {
    expect(grammar).toBeTruthy();
    expect(grammar.name).toBe("Tasklist");
    expect(grammar.constructor.name).toBe("TreeSitterGrammar");
  });

  it("selects the tasklist grammar for .tasklist and .todo files", () => {
    expect(lumine.grammars.selectGrammar("notes.tasklist", "")).toBe(grammar);
    expect(lumine.grammars.selectGrammar("notes.todo", "")).toBe(grammar);
  });

  it("parses every line form without assigning hierarchy to chapters", async () => {
    await setUp(
      "# Chapter\n  ## indented text\nHeader:\n▷ urgent\n☐ pending\n✔ finished\n✘ rejected\n• note\nplain text\n",
    );

    const root = languageMode.tree.rootNode;
    expect(root.hasError).toBe(false);
    expect(root.descendantsOfType("chapter").length).toBe(1);
    expect(root.descendantsOfType("header").length).toBe(1);
    expect(root.descendantsOfType("task").length).toBe(4);
    expect(root.descendantsOfType("note").length).toBe(1);
    expect(root.descendantsOfType("text_line").length).toBe(2);
  });

  it("preserves line precedence and ASCII-space boundaries", async () => {
    await setUp("☐ task:\n• note:\n# Chapter:\n :\n###   \nHeader:\t\n");

    const lines = languageMode.tree.rootNode.descendantsOfType("line");
    expect(lines.map((line) => line.namedChild(0).type)).toEqual([
      "task",
      "note",
      "chapter",
      "header",
      "chapter",
      "text_line",
    ]);
    expect(languageMode.tree.rootNode.hasError).toBe(false);
  });

  it("applies stable scopes to line markers and contents", async () => {
    await setUp(
      "▷ urgent item\n☐ pending item\n✔ finished item\n✘ rejected item\n• informational note\n# Chapter title\nHeader title:\n",
    );

    for (const [needle, scope] of [
      ["▷", "punctuation.definition.tick.high.task.tasklist"],
      ["☐", "punctuation.definition.tick.todo.task.tasklist"],
      ["✔", "punctuation.definition.tick.done.task.tasklist"],
      ["✘", "punctuation.definition.tick.fail.task.tasklist"],
      ["•", "punctuation.definition.tick.info.task.tasklist"],
      ["urgent item", "text.high.task.tasklist"],
      ["pending item", "text.todo.task.tasklist"],
      ["finished item", "text.done.task.tasklist"],
      ["rejected item", "text.fail.task.tasklist"],
      ["informational note", "text.info.task.tasklist"],
      ["#", "punctuation.definition.symbol.chapter.tasklist"],
      ["Chapter title", "text.chapter.tasklist"],
      ["Header title", "text.header.tasklist"],
      [":", "punctuation.definition.symbol.header.tasklist"],
    ]) {
      expect(scopesAt(needle)).toContain(scope);
    }
  });

  it("keeps indentation, separators, and trailing spaces outside task text", async () => {
    await setUp("  ☐ todo  \n");

    const scopesAtColumn = (column) =>
      editor.scopeDescriptorForBufferPosition([0, column]).getScopesArray();
    expect(scopesAtColumn(0)).not.toContain("text.todo.task.tasklist");
    expect(scopesAtColumn(2)).toContain("punctuation.definition.tick.todo.task.tasklist");
    expect(scopesAtColumn(3)).not.toContain("text.todo.task.tasklist");
    expect(scopesAtColumn(4)).toContain("text.todo.task.tasklist");
    expect(scopesAtColumn(9)).not.toContain("text.todo.task.tasklist");
  });

  it("highlights the five opaque inline formats", async () => {
    await setUp("☐ ~strike~ *bold* _italic_ $math$ `raw` ~~ ** __ $$ ``\n");

    for (const [needle, scope] of [
      ["~strike~", "markup.strike.format.tasklist"],
      ["*bold*", "markup.bold.format.tasklist"],
      ["_italic_", "markup.italic.format.tasklist"],
      ["$math$", "markup.math.format.tasklist"],
      ["`raw`", "markup.raw.format.tasklist"],
      ["~~", "markup.strike.format.tasklist"],
      ["**", "markup.bold.format.tasklist"],
      ["__", "markup.italic.format.tasklist"],
      ["$$", "markup.math.format.tasklist"],
      ["``", "markup.raw.format.tasklist"],
    ]) {
      expect(scopesAt(needle)).toContain(scope);
    }
  });

  it("keeps done, failed, and formatted contents opaque to nested highlighting", async () => {
    await lumine.packages.activatePackage("language-hyperlink");
    await lumine.packages.activatePackage("language-todo");
    await setUp(
      "☐ active TODO https://example.com\n☐ *TODO https://formatted.example*\n✔ done TODO https://done.example *bold*\n✘ failed FIXME https://failed.example _italic_\n",
    );

    await conditionPromise(() =>
      scopesAt("https://example.com").some((scope) => scope.includes("markup.underline.link")),
    );

    expect(scopesAt("active TODO", 7)).toContain("storage.type.class.todo");
    expect(scopesAt("https://example.com")).toContain("markup.underline.link.hyperlink");

    for (const [needle, offset] of [
      ["TODO https://formatted.example", 0],
      ["done TODO", 5],
      ["https://done.example", 0],
      ["failed FIXME", 7],
      ["https://failed.example", 0],
    ]) {
      const scopes = scopesAt(needle, offset);
      expect(scopes.some((scope) => scope.includes("storage.type.class"))).toBe(false);
      expect(scopes.some((scope) => scope.includes("markup.underline.link"))).toBe(false);
    }

    expect(scopesAt("*TODO https://formatted.example*")).toContain("markup.bold.format.tasklist");
    expect(scopesAt("*bold*")).not.toContain("markup.bold.format.tasklist");
    expect(scopesAt("_italic_")).not.toContain("markup.italic.format.tasklist");
  });

  it("indents after every nonempty line whose last non-whitespace character is a colon", async () => {
    await setUp("");

    for (const text of [
      "Header:",
      "Header:   ",
      "☐ task:",
      "# Chapter:",
      "• note:",
      "plain text:",
    ]) {
      editor.setText(text);
      await languageMode.atTransactionEnd();
      editor.setCursorBufferPosition([0, Infinity]);
      editor.getLastSelection().insertText("\n", {
        autoIndent: true,
        autoIndentNewline: true,
      });
      await languageMode.atTransactionEnd();
      expect(editor.lineTextForBufferRow(1)).toBe("  ");
    }

    for (const text of [":", "☐ no colon", "Header:\t", "☐ task:\t"]) {
      editor.setText(text);
      await languageMode.atTransactionEnd();
      editor.setCursorBufferPosition([0, Infinity]);
      editor.getLastSelection().insertText("\n", {
        autoIndent: true,
        autoIndentNewline: true,
      });
      await languageMode.atTransactionEnd();
      expect(editor.lineTextForBufferRow(1)).toBe("");
    }
  });

  it("folds visual indentation without changing line semantics", async () => {
    await setUp(
      "Parent\n  child\n    grandchild\nSibling\n\tTabbed child\nAfter\nBlank group\n\n  child after blank\nEnd\nTrailing group\n  child\n\n\nFinal\n",
    );

    expect(languageMode.tree.rootNode.hasError).toBe(false);
    for (const row of [0, 1, 3, 6, 10]) expect(editor.isFoldableAtBufferRow(row)).toBe(true);
    for (const row of [2, 4, 5, 7, 8, 9, 11, 12, 13, 14]) {
      expect(editor.isFoldableAtBufferRow(row)).toBe(false);
    }

    editor.foldBufferRow(0);
    expect(foldedBufferRanges()).toEqual([[0, 2]]);
    editor.unfoldAll();
    editor.foldBufferRow(3);
    expect(foldedBufferRanges()).toEqual([[3, 4]]);
    editor.unfoldAll();
    editor.foldBufferRow(6);
    expect(foldedBufferRanges()).toEqual([[6, 8]]);
    editor.unfoldAll();
    editor.foldBufferRow(10);
    expect(foldedBufferRanges()).toEqual([[10, 11]]);
  });
});
