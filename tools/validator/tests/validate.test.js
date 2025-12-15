const { execSync } = require("child_process");
const fs = require("fs");

function run(input, output) {
  fs.writeFileSync("tmp.input.json", JSON.stringify(input, null, 2));
  fs.writeFileSync("tmp.output.json", JSON.stringify(output, null, 2));
  return execSync("node validate.js tmp.input.json tmp.output.json", { stdio: "pipe" }).toString();
}

test("PASS: minimal valid", () => {
  const out = run(
    { user_message: "환불 가능해?", facts: {}, intent_hint: "refund_check" },
    { judgement: "eligible", message: "확인했습니다.", next_actions: [{ label: "공식 절차 안내" }], disclosure: "(※ 안내만...)" }
  );
  expect(out).toMatch("PASS");
});

test("REJECT: user_message > 500", () => {
  const long = "a".repeat(501);
  expect(() => run(
    { user_message: long },
    { judgement: "unknown", message: "확인 필요", next_actions: [], disclosure: "(※ 안내만...)" }
  )).toThrow();
});

test("REJECT: forbidden input field", () => {
  expect(() => run(
    { user_message: "환불", policy_text: "secret" },
    { judgement: "unknown", message: "확인 필요", next_actions: [], disclosure: "(※ 안내만...)" }
  )).toThrow();
});

test("REJECT: next_actions > 2", () => {
  expect(() => run(
    { user_message: "환불" },
    { judgement: "unknown", message: "확인 필요", next_actions: [{},{},{}], disclosure: "(※ 안내만...)" }
  )).toThrow();
});

test("REJECT: gate leak in message", () => {
  expect(() => run(
    { user_message: "환불" },
    { judgement: "blocked", message: "Gate 2에서 차단됩니다", next_actions: [], disclosure: "(※ 안내만...)" }
  )).toThrow();
});
