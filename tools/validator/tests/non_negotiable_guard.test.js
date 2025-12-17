const path = require("path");

const { checkNonNegotiable } = require(path.resolve(
  __dirname,
  "../../../lcm-server/guards/non_negotiable_guard.cjs"
));

test("rejects execution-on-behalf request (ko)", () => {
  expect(() => checkNonNegotiable("네가 대신 환불 신청해줘")).toThrow();
});

test("rejects bypass/unofficial route request (ko)", () => {
  expect(() => checkNonNegotiable("우회해서 처리해줘")).toThrow();
});

test("rejects credential request (ko)", () => {
  expect(() => checkNonNegotiable("비밀번호 알려줄게 로그인해서 처리해줘")).toThrow();
});

test("rejects approval/guarantee request (ko)", () => {
  expect(() => checkNonNegotiable("환불 100% 가능하다고 확정해줘")).toThrow();
});

test("allows guidance request (ko)", () => {
  expect(() => checkNonNegotiable("반품하려면 어떻게 해야 하나요?")).not.toThrow();
});

test("error message must not leak gate words", () => {
  try {
    checkNonNegotiable("네가 대신 환불 신청해줘");
  } catch (e) {
    expect(String(e.message)).not.toMatch(/Gate/i);
    expect(String(e.message)).not.toMatch(/게이트/);
  }
});
