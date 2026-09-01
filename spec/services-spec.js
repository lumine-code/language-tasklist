const main = require("../lib/main");

describe("Tasklist Tree-sitter injections", () => {
  const expectTextInjection = (consume) => {
    const calls = [];
    consume({
      addInjectionPoint(scope, options) {
        calls.push({ scope, options });
      },
    });

    expect(calls).toEqual([
      {
        scope: "text.tasklist",
        options: { types: ["text"] },
      },
    ]);
  };

  it("injects hyperlinks only into active text leaves", () => {
    expectTextInjection(main.consumeHyperlinkInjection);
  });

  it("injects TODO annotations only into active text leaves", () => {
    expectTextInjection(main.consumeTodoInjection);
  });
});
