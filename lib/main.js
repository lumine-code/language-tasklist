exports.activate = function () {};

exports.consumeHyperlinkInjection = (hyperlink) => {
  hyperlink.addInjectionPoint("text.tasklist", {
    types: ["text"],
  });
};

exports.consumeTodoInjection = (todo) => {
  todo.addInjectionPoint("text.tasklist", {
    types: ["text"],
  });
};
