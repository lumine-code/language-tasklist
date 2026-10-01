; Annotation candidates are filtered by the target grammar.
((text) @injection.owner @injection.content
  (#set! injection.language "hyperlink")
  (#set! injection.language-scope "none"))

((text) @injection.owner @injection.content
  (#set! injection.language "todo")
  (#set! injection.language-scope "none"))
