# language-tasklist

Syntax highlighting for tasklist files.

Provides a grammar for `*.todo` and `*.tasklist` files with Unicode tick symbols.

## Features

- **Grammars**: provides Tree-sitter grammars.
- **Unicode ticks**: multiple task states using Unicode symbols.
- **Chapters and headers**: support for `#` chapters and `:` headers.
- **Text formatting**: support for `~text~`, `*text*`, `_text_`, `$text$` and `` `text` ``.
- **Folding**: folds visually indented groups without changing task semantics.
- **Symbols**: lists chapters and headers by name in symbol navigation.
- **Annotations**: highlights hyperlinks and TODO annotations in active text.

## Installation

To install `language-tasklist` search for it in the Install pane of the Lumine settings, or run the command `lumine --install lumine-code/language-tasklist`.

## Usage

A task is a single line consisting of a tick and text. Unicode characters represent ticks:

| Symbol | Code     | Name   | Description                  |
| ------ | -------- | ------ | ---------------------------- |
| `▷`    | `U+25B7` | `high` | high priority pending task   |
| `☐`    | `U+2610` | `todo` | normal priority pending task |
| `✔`    | `U+2714` | `done` | done/completed task          |
| `✘`    | `U+2718` | `fail` | failed/rejected task         |
| `•`    | `U+2022` | `info` | notes line                   |

- Lines starting with `#` are chapters (multilevel supported).
- Non-tick lines ending with `:` are headers.
- Two space indentation is recommended.

## Services

- `hyperlink.injection`: consumed to highlight hyperlinks in active tasklist text.
- `todo.injection`: consumed to highlight TODO annotations in active tasklist text.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
