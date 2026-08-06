# language-tasklist

Syntax highlighting for tasklist files.

Provides a grammar for `*.todo` and `*.tasklist` files with Unicode tick symbols.

## Features

- **Grammars**: provides TextMate grammars maintained here.
- **Unicode ticks**: multiple task states using Unicode symbols.
- **Chapters & headers**: support for `#` chapters and `:` headers.
- **Text formatting**: support for `~text~`, `*text*`, `_text_`, `$text$` and `` `text` ``.

## Installation

To install `language-tasklist` search for _language-tasklist_ in the Install pane of the Lumine settings or run `lumine --install lumine-code/language-tasklist`.

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

## Customization

The style can be adjusted in the user's `styles.css` file, e.g. add line-through to done and fail tasks:

```css
.syntax--tasklist {
  &.syntax--done,
  &.syntax--fail {
    &.syntax--text {
      text-decoration: line-through;
    }
  }
}
```

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
