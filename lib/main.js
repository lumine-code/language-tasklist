exports.activate = function () {};

exports.consumeHyperlinkInjection = (hyperlink) => {
  return hyperlink.addInjectionPoint("text.tasklist", {
    types: ["text"],
  });
};

exports.consumeTodoInjection = (todo) => {
  return todo.addInjectionPoint("text.tasklist", {
    types: ["text"],
  });
};
