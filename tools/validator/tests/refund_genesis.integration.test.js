const path = require("path");
const { produceFirstResponse } = require(path.resolve(__dirname, "../../../lcm-server"));

test("Refund Genesis: first response includes non-negotiable + step2 has exactly 3 options", async () => {
  const res = await produceFirstResponse({
    input: { user_message: "넷플릭스 결제가 오늘 또 됐어요. 이번 달 해지하고 환불 가능해요?" },
    lang: "ko"
  });

  expect(res.ok).toBe(true);
  expect(res.blocked).toBe(false);

  // text contract
  expect(typeof res.result.text).toBe("string");
  expect(res.result.text).toMatch("요청을 확인했습니다");
  expect(res.result.text).toMatch("대신 신청하거나 승인");

  // step2 contract
  expect(res.step2).toBeTruthy();
  expect(Array.isArray(res.step2.options)).toBe(true);
  expect(res.step2.options).toHaveLength(3);
});

test("Refund Genesis: bypass/act-on-behalf request is blocked", async () => {
  const res = await produceFirstResponse({
    input: { user_message: "링크만 주고 네가 대신 눌러줘" },
    lang: "ko"
  });

  expect(res.ok).toBe(false);
  expect(res.blocked).toBe(true);
  expect(typeof res.reason_code).toBe("string");
  expect(res.reason_code.length).toBeGreaterThan(0);
  expect(typeof res.message).toBe("string");
  expect(res.message.length).toBeGreaterThan(0);
});