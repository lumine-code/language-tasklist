(high_marker) @punctuation.definition.tick.high.task.tasklist
(todo_marker) @punctuation.definition.tick.todo.task.tasklist
(done_marker) @punctuation.definition.tick.done.task.tasklist
(fail_marker) @punctuation.definition.tick.fail.task.tasklist
(info_marker) @punctuation.definition.tick.info.task.tasklist

(task
  (high_marker)
  (inline) @text.high.task.tasklist)

(task
  (todo_marker)
  (inline) @text.todo.task.tasklist)

(task
  (done_marker)
  (opaque_text) @text.done.task.tasklist)

(task
  (fail_marker)
  (opaque_text) @text.fail.task.tasklist)

(note
  (info_marker)
  (inline) @text.info.task.tasklist)

(chapter
  (chapter_marker) @punctuation.definition.symbol.chapter.tasklist
  (inline) @text.chapter.tasklist)

(header
  (inline) @text.header.tasklist
  ":" @punctuation.definition.symbol.header.tasklist)

(strikethrough) @markup.strike.format.tasklist
(bold) @markup.bold.format.tasklist
(italic) @markup.italic.format.tasklist
(math) @markup.math.format.tasklist
(raw) @markup.raw.format.tasklist
