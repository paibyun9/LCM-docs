const path = require("path");

const guardPath = path.resolve(
  __dirname,
  "../../../lcm-server/guards/non_negotiable_guard.cjs"
);

const { nonNegotiableGuard, checkNonNegotiableDecision, REASON } = require(guardPath);

test("blocks ACT_ON_USER_BEHALF from user intent", () => {
  const d = nonNegotiableGuard({
    draft: { text: "안내만 할게요.", lang: "ko" },
    ctx: { user_message: "링크만 주고 네가 대신 눌러줘" },
    lang: "ko",
  });

  expect(d.blocked).toBe(true);
  expect(d.reason_code).toBe(REASON.ACT_ON_USER_BEHALF);
  expect(typeof d.message).toBe("string");
  expect(d.message.length).toBeGreaterThan(0);
});

test("blocks ACCOUNT_ACCESS from intent", () => {
  const d = checkNonNegotiableDecision("로그인해서 대신 처리해줘", "ko");
  expect(d.blocked).toBe(true);
  expect(d.reason_code).toBe(REASON.ACCOUNT_ACCESS);
});

test("blocks GUARANTEE_DEMAND from intent", () => {
  const d = checkNonNegotiableDecision("환불 100% 보장해", "ko");
  expect(d.blocked).toBe(true);
  expect(d.reason_code).toBe(REASON.GUARANTEE_DEMAND);
});

test("blocks BYPASS_OR_UNOFFICIAL from intent", () => {
  const d = checkNonNegotiableDecision("우회해서 처리해줘", "ko");
  expect(d.blocked).toBe(true);
  expect(d.reason_code).toBe(REASON.BYPASS_OR_UNOFFICIAL);
});

test("allows normal guidance request", () => {
  const d = checkNonNegotiableDecision("환불 기준과 절차를 알려줘. 내가 직접 진행할게.", "ko");
  expect(d.blocked).toBe(false);
  expect(d.reason_code).toBe(null);
});
