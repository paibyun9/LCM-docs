const path = require("path");

const { renderFirstResponse } = require(path.resolve(
  __dirname,
  "../../../lcm-server/renderer/first_response_renderer.js"
));

test("S1_MIN_FACTS_REQUEST (ko): asks minimal facts + disclosure + wait(last line)", () => {
  const out = renderFirstResponse({
    lang: "ko",
    state_id: "S1_MIN_FACTS_REQUEST",
    category_text: "의류",
    facts_required: [
      { key: "received_date", ko: "수령일", en: "Delivery date" },
      { key: "tag_attached", ko: "태그 부착 여부", en: "Tag attached?" }
    ]
  });

  expect(out.text).toContain("의류 환불·반품을 도와드리겠습니다.");
  expect(out.text).toContain("정확한 판단을 위해 아래만 알려주세요:");
  expect(out.text).toContain("• 수령일");
  expect(out.text).toContain("• 태그 부착 여부");
  expect(out.text).toMatch(/\(※ 안내만 가능/);
  expect(out.text).not.toMatch(/Gate/i);
  expect(out.text).not.toMatch(/게이트/);

  // Step 4 must be the last line
  const lastLine = out.text.trim().split("\n").slice(-1)[0];
  expect(lastLine).toBe("준비되시면 위 정보를 알려주세요.");
});

test("S2_PRESENT_CHOICES (ko): shows max 2 choices + disclosure + wait(last line)", () => {
  const out = renderFirstResponse({
    lang: "ko",
    state_id: "S2_PRESENT_CHOICES",
    category_text: "전자제품",
    choices: [
      { id: "A1", title: "공식 환불 절차 안내" },
      { id: "A2", title: "판매자 요청 문장 작성" }
    ]
  });

  expect(out.text).toContain("다음 중 하나를 선택해 주세요:");
  expect(out.text).toContain("1. 공식 환불 절차 안내");
  expect(out.text).toContain("2. 판매자 요청 문장 작성");
  expect(out.text).toMatch(/\(※ 안내만 가능/);

  const lastLine = out.text.trim().split("\n").slice(-1)[0];
  expect(lastLine).toBe("준비되시면 번호(1 또는 2)를 알려주세요.");
});

test("S2_PRESENT_CHOICES rejects >2 choices (Day-4 constraint)", () => {
  expect(() =>
    renderFirstResponse({
      lang: "ko",
      state_id: "S2_PRESENT_CHOICES",
      category_text: "중고 전자제품",
      choices: [
        { id: "A1", title: "옵션1" },
        { id: "A2", title: "옵션2" },
        { id: "A3", title: "옵션3" }
      ]
    })
  ).toThrow();
});

test("rejects gate word leak", () => {
  expect(() =>
    renderFirstResponse({
      lang: "ko",
      state_id: "S2_PRESENT_CHOICES",
      category_text: "의류",
      choices: [{ id: "A1", title: "Gate 2에서 차단됩니다" }]
    })
  ).toThrow();
});
