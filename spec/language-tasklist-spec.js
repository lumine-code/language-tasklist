const path = require("path");

describe("language-tasklist", () => {
  let editor;
  let languageMode;
  let grammar;
  const packagePath = (name) => path.resolve(__dirname, "..", "..", name);

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

  const rootNode = () =>
    editor.getSyntaxNodeAtBufferPosition([0, 0], (node) => node.parent == null);

  beforeEach(async () => {
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

  it("accepts empty documents, leading blank lines and NUL task content", async () => {
    for (const source of ["", "\n", " \t\n\n☐ task\n", "☐ a\0b\n"]) {
      await setUp(source);
      expect(languageMode.tree.rootNode.hasError).toBe(false);
      if (source.includes("\0")) {
        expect(languageMode.tree.rootNode.descendantsOfType("inline")[0].text).toBe("a\0b");
      }
    }
  });

  it("keeps whitespace before a header colon outside its title scope", async () => {
    await setUp("Header a :\n");
    const header = rootNode().descendantsOfType("header")[0];
    expect(header.childForFieldName("title").text).toBe("Header a");
    expect(header.childForFieldName("colon").text).toBe(":");
    expect(scopesAt("Header a")).toContain("text.header.tasklist");
    expect(scopesAt(" :")).not.toContain("text.header.tasklist");
    expect(scopesAt(":")).toContain("punctuation.definition.symbol.header.tasklist");
  });

  it("keeps nonfinal title colons separate from the final header delimiter", async () => {
    await setUp("");
    for (const source of ["a::", "a: :"]) {
      editor.setText(`${source}\n  Child::\n    ☐ nested\nSibling:\n`);
      await languageMode.atTransactionEnd();
      const root = rootNode();
      expect(root.hasError).toBe(false);
      const header = root.descendantsOfType("header")[0];
      expect(header.childForFieldName("title").text).toBe("a:");
      expect(header.childForFieldName("colon").text).toBe(":");
      expect(header.childForFieldName("colon").startPosition.column).toBe(source.lastIndexOf(":"));
      expect(scopesAt("a:", 1)).toContain("text.header.tasklist");
      expect(scopesAt("a:", 1)).not.toContain("punctuation.definition.symbol.header.tasklist");
      const finalScope = editor
        .scopeDescriptorForBufferPosition([0, source.length - 1])
        .getScopesArray();
      expect(finalScope).toContain("punctuation.definition.symbol.header.tasklist");
      expect(finalScope).not.toContain("text.header.tasklist");
      if (source === "a: :") {
        expect(editor.scopeDescriptorForBufferPosition([0, 2]).getScopesArray()).not.toContain(
          "text.header.tasklist",
        );
      }
      const parent = root.namedChild(0);
      expect(parent.type).toBe("layout_group");
      const child = parent.childForFieldName("body").namedChild(0);
      expect(child.type).toBe("layout_group");
      expect(
        child.childForFieldName("owner").descendantsOfType("header")[0].childForFieldName("title")
          .text,
      ).toBe("Child:");
      expect(child.childForFieldName("body").descendantsOfType("task").length).toBe(1);
      expect(editor.isFoldableAtBufferRow(0)).toBe(true);
      expect(editor.isFoldableAtBufferRow(1)).toBe(true);
      expect(editor.isFoldableAtBufferRow(2)).toBe(false);
      editor.unfoldAll();
      editor.foldBufferRow(0);
      expect(foldedBufferRanges()).toEqual([[0, 2]]);
      editor.unfoldAll();
      editor.foldBufferRow(1);
      expect(foldedBufferRanges()).toEqual([[1, 2]]);
      editor.unfoldAll();
    }
  });

  it("updates title colon scopes and header folding after incremental colon edits", async () => {
    await setUp("a::\n  Child::\n    ☐ nested\nSibling:\n");
    const replace = async (start, end, text) => {
      editor.setTextInBufferRange(
        [
          [0, start],
          [0, end],
        ],
        text,
      );
      await languageMode.atGrammarSettlement();
      expect(rootNode().hasError).toBe(false);
      expect(rootNode().descendantsOfType("task").length).toBe(1);
      expect(editor.isFoldableAtBufferRow(1)).toBe(true);
    };
    await replace(2, 2, " ");
    let header = rootNode().descendantsOfType("header")[0];
    expect(header.childForFieldName("title").text).toBe("a:");
    expect(header.childForFieldName("colon").startPosition.column).toBe(3);
    expect(editor.scopeDescriptorForBufferPosition([0, 2]).getScopesArray()).not.toContain(
      "text.header.tasklist",
    );
    expect(editor.isFoldableAtBufferRow(0)).toBe(true);

    await replace(2, 3, "");
    await replace(2, 3, "");
    header = rootNode().descendantsOfType("header")[0];
    expect(header.childForFieldName("title").text).toBe("a");
    expect(header.childForFieldName("colon").startPosition.column).toBe(1);
    await replace(1, 2, "");
    expect(rootNode().namedChild(0).childForFieldName("owner").descendantsOfType("header")).toEqual(
      [],
    );
    expect(scopesAt("a")).not.toContain("text.header.tasklist");
    expect(editor.isFoldableAtBufferRow(0)).toBe(false);

    await replace(1, 1, ": :");
    header = rootNode().descendantsOfType("header")[0];
    expect(header.childForFieldName("title").text).toBe("a:");
    expect(header.childForFieldName("colon").startPosition.column).toBe(3);
    expect(scopesAt("a:", 1)).toContain("text.header.tasklist");
    expect(editor.scopeDescriptorForBufferPosition([0, 3]).getScopesArray()).toContain(
      "punctuation.definition.symbol.header.tasklist",
    );
    expect(editor.isFoldableAtBufferRow(0)).toBe(true);
  });

  it("updates formatting after adding and removing a previously missing closer", async () => {
    await setUp("*a *b\nAfter\n");
    expect(rootNode().descendantsOfType("bold").length).toBe(0);
    editor.setTextInBufferRange(
      [
        [0, 5],
        [0, 5],
      ],
      "*",
    );
    await languageMode.atTransactionEnd();
    expect(
      rootNode()
        .descendantsOfType("bold")
        .map((node) => node.text),
    ).toEqual(["*a *b*"]);
    expect(scopesAt("*a")).toContain("markup.bold.format.tasklist");
    editor.setTextInBufferRange(
      [
        [0, 5],
        [0, 6],
      ],
      "",
    );
    await languageMode.atTransactionEnd();
    expect(rootNode().descendantsOfType("bold").length).toBe(0);
    expect(scopesAt("*a")).not.toContain("markup.bold.format.tasklist");
  });

  it("parses every line form without assigning hierarchy to chapters", async () => {
    await setUp(
      "# Chapter\n  ## indented text\nHeader:\n▷ urgent\n☐ pending\n✔ finished\n✘ rejected\n• note\nplain text\n",
    );

    const root = rootNode();
    expect(editor.languageMode.tree.rootNode.hasError).toBe(false);
    expect(root.descendantsOfType("chapter").length).toBe(1);
    expect(root.descendantsOfType("header").length).toBe(1);
    expect(root.descendantsOfType("task").length).toBe(4);
    expect(root.descendantsOfType("note").length).toBe(1);
    expect(root.descendantsOfType("text_line").length).toBe(2);
  });

  it("preserves line precedence and ASCII-space boundaries", async () => {
    await setUp("☐ task:\n• note:\n# Chapter:\n :\n###   \nHeader:\t\n");

    const lines = rootNode().descendantsOfType("line");
    expect(lines.map((line) => line.namedChild(0).type)).toEqual([
      "task",
      "note",
      "chapter",
      "header",
      "chapter",
      "text_line",
    ]);
    expect(editor.languageMode.tree.rootNode.hasError).toBe(false);
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
    await lumine.packages.activatePackage(packagePath("language-hyperlink"));
    await lumine.packages.activatePackage(packagePath("language-todo"));
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

  it("folds chapters and nested headers without folding task or prose groups", async () => {
    await setUp(
      "# Parent\nHeader:\n  Child:\n    ☐ task\n      ☐ nested task\n  Sibling:\n## Subchapter\ntext\n# Empty\nPlain\n  indented\n☐ task\n  ☐ nested\n",
    );

    expect(editor.languageMode.tree.rootNode.hasError).toBe(false);
    for (const row of [0, 1, 2, 6, 8]) expect(editor.isFoldableAtBufferRow(row)).toBe(true);
    for (const row of [3, 4, 5, 7, 9, 10, 11, 12]) {
      expect(editor.isFoldableAtBufferRow(row)).toBe(false);
    }

    editor.foldBufferRow(0);
    expect(foldedBufferRanges()).toEqual([[0, 7]]);
    editor.unfoldAll();
    editor.foldBufferRow(1);
    expect(foldedBufferRanges()).toEqual([[1, 5]]);
    editor.unfoldAll();
    editor.foldBufferRow(2);
    expect(foldedBufferRanges()).toEqual([[2, 4]]);
    editor.unfoldAll();
    editor.foldBufferRow(6);
    expect(foldedBufferRanges()).toEqual([[6, 7]]);
    editor.unfoldAll();
    editor.foldBufferRow(8);
    expect(foldedBufferRanges()).toEqual([[8, 12]]);
  });

  it("exposes nested chapter and header symbols with distinct icons while excluding tasks", async () => {
    await setUp(
      "# Parent\nHeader:\n  Child:\n    ☐ task\n      ☐ nested task\n  Sibling:\n## Subchapter\ntext\n# Empty\n☐ task outside\n :\n###   \n",
    );
    const groups = await editor.getGrammarQueryCaptureGroups("tagsQuery");
    const captures = groups.flatMap((group) => group.captures);
    const names = captures.filter((capture) => capture.name === "name");
    const entries = captures
      .filter((capture) => capture.name === "definition.heading")
      .map((capture) => ({
        name: names.find(
          (name) =>
            name.node.startIndex >= capture.node.startIndex &&
            name.node.endIndex <= capture.node.endIndex,
        ).node.text,
        icon: capture.setProperties["symbol.icon"],
        start: capture.node.startIndex,
        end: capture.node.endIndex,
        children: [],
      }))
      .sort((left, right) => left.start - right.start || right.end - left.end);
    expect(entries.map(({ name, icon }) => [name, icon])).toEqual([
      ["Parent", "book"],
      ["Header", "bookmark"],
      ["Child", "bookmark"],
      ["Sibling", "bookmark"],
      ["Subchapter", "book"],
      ["Empty", "book"],
    ]);
    const roots = [];
    const stack = [];
    for (const entry of entries) {
      while (stack.length > 0 && entry.start >= stack.at(-1).end) stack.pop();
      (stack.at(-1)?.children ?? roots).push(entry);
      stack.push(entry);
    }
    const simplify = (items) =>
      items.map((item) => ({ name: item.name, children: simplify(item.children) }));

    expect(simplify(roots)).toEqual([
      {
        name: "Parent",
        children: [
          {
            name: "Header",
            children: [
              { name: "Child", children: [] },
              { name: "Sibling", children: [] },
            ],
          },
          { name: "Subchapter", children: [] },
        ],
      },
      { name: "Empty", children: [] },
    ]);
  });
});
