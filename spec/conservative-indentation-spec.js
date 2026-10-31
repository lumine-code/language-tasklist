describe("Conservative tasklist indentation", () => {
  let editor;

  beforeEach(async () => {
    await lumine.packages.activatePackage("language-tasklist");
    editor = await lumine.workspace.open();
    editor.setGrammar(lumine.grammars.grammarForScopeName("text.tasklist"));
    editor.update({ tabLength: 4, softTabs: true });
    await editor.whenGrammarSettled();
  });

  afterEach(() => editor?.destroy());

  for (const [name, source, row, columns] of [
    ["a header", "Project:", 0, 4],
    ["a task with a colon", "☐ Remember:", 0, 0],
    ["a note with a colon", "• Note:", 0, 0],
    ["a chapter with a colon", "# Chapter:", 0, 0],
    ["a nested task", "Project:\n    ☐ Task", 1, 4],
  ]) {
    it(`keeps the intended level after ${name}`, async () => {
      editor.setText(source);
      await editor.whenGrammarSettled();
      editor.setCursorBufferPosition([row, Infinity]);
      editor.insertText("\n", { autoIndent: true, autoIndentNewline: true });
      await editor.whenGrammarSettled();
      expect(editor.lineTextForBufferRow(row + 1)).toBe(" ".repeat(columns));
      expect(editor.getCursorBufferPosition().column).toBe(columns);
    });
  }
});
