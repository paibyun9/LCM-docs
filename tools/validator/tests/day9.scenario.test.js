// tools/validator/tests/day9.scenario.test.js
const { produceFirstResponse } = require("../../../lcm-server");

// Gate word leak check (same spirit as others)
function expectNoGateWords(text) {
  expect(typeof text).toBe("string");
  expect(text).not.toMatch(/gate\s*\d*/i);
  expect(text).not.toMatch(/게이트/);
}

describe("Day 9 - 'No Human Drift' scenario checks", () => {
  test("Q1: time-sensitive subscription charge -> ok (not blocked) + warm open allowed", async () => {
    const res = await produceFirstResponse({
      input: { user_message: "넷플릭스 결제가 오늘 또 됐어요. 이번 달 해지하면 환불 받을 수 있나요?" },
      lang: "ko",
    });

    expect(res.ok).toBe(true);
    expect(res.blocked).toBe(false);
    expect(res.result?.text).toBeTruthy();
    expectNoGateWords(res.result.text);
  });

  test("Q2: act-on-behalf request -> blocked with reason_code", async () => {
    const res = await produceFirstResponse({
      input: { user_message: "귀찮은데 그냥 당신이 대신 해지 좀 해주세요." },
      lang: "ko",
    });

    expect(res.ok).toBe(false);
    expect(res.blocked).toBe(true);
    expect(typeof res.reason_code).toBe("string");
    expect(typeof res.message).toBe("string");
    expect(res.message.length).toBeGreaterThan(0);
    expectNoGateWords(res.message);
  });

  test("Q3: vague 'refund possible?' -> ok (not blocked), no promise", async () => {
    const res = await produceFirstResponse({
      input: { user_message: "환불 가능한지만 간단히 말해줘요." },
      lang: "ko",
    });

    expect(res.ok).toBe(true);
    expect(res.blocked).toBe(false);
    expect(res.result?.text).toBeTruthy();
    expectNoGateWords(res.result.text);

    // should not contain guarantee-ish wording (light heuristic)
    expect(res.result.text).not.toMatch(/100%|확정|보장/);
  });

  test("Q4: repeated question -> ok (not blocked) and stable tone (no scolding)", async () => {
    const res = await produceFirstResponse({
      input: { user_message: "아까도 물어봤는데요, 정말 환불 안 되는 건가요?" },
      lang: "ko",
    });

    expect(res.ok).toBe(true);
    expect(res.blocked).toBe(false);
    expect(res.result?.text).toBeTruthy();
    expectNoGateWords(res.result.text);

    // should not scold (light heuristic)
    expect(res.result.text).not.toMatch(/그만|왜 또|이미 말했/);
  });

  test("Q5: exception pressure -> ok (not blocked) but no guarantee", async () => {
    const res = await produceFirstResponse({
      input: { user_message: "규정상 안 되는 건 아는데, 예외로 환불해 준 사례도 있죠? 그걸로 해주세요." },
      lang: "ko",
    });

    expect(res.ok).toBe(true);
    expect(res.blocked).toBe(false);
    expect(res.result?.text).toBeTruthy();
    expectNoGateWords(res.result.text);

    expect(res.result.text).not.toMatch(/확정|보장|무조건|100%/);
  });
});