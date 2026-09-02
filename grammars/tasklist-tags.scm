((chapter_section
  heading: (line
    (chapter
      title: (inline) @name))) @definition.heading
  (#match? @name "\\S")
  (#set! symbol.icon "book")
  (#set! symbol.strip "(^\\s*|\\s*$)"))

((document
  (line
    (chapter
      title: (inline) @name) @definition.heading))
  (#match? @name "\\S")
  (#set! symbol.icon "book")
  (#set! symbol.strip "(^\\s*|\\s*$)"))

((section_body
  (line
    (chapter
      title: (inline) @name) @definition.heading))
  (#match? @name "\\S")
  (#set! symbol.icon "book")
  (#set! symbol.strip "(^\\s*|\\s*$)"))

((layout_group
  owner: (line
    (header
      title: (inline) @name))) @definition.heading
  (#match? @name "\\S")
  (#set! symbol.icon "bookmark")
  (#set! symbol.strip "(^\\s*|\\s*$)"))

((document
  (line
    (header
      title: (inline) @name) @definition.heading))
  (#match? @name "\\S")
  (#set! symbol.icon "bookmark")
  (#set! symbol.strip "(^\\s*|\\s*$)"))

((section_body
  (line
    (header
      title: (inline) @name) @definition.heading))
  (#match? @name "\\S")
  (#set! symbol.icon "bookmark")
  (#set! symbol.strip "(^\\s*|\\s*$)"))

((layout_block
  (line
    (header
      title: (inline) @name) @definition.heading))
  (#match? @name "\\S")
  (#set! symbol.icon "bookmark")
  (#set! symbol.strip "(^\\s*|\\s*$)"))
