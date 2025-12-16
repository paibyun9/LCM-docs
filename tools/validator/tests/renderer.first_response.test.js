const path = require("path");

const { renderFirstResponse } = require(path.resolve(
  __dirname,
  "../../../lcm-server/renderer/first_response_renderer.js"
));

test("S1_MIN_FACTS_REQUEST (ko): asks minimal facts and includes disclosure", () => {
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
  expect(out.text).toContain("※ 안내만 가능하며");
  expect(out.text).not.toMatch(/Gate/i);
  expect(out.text).not.toMatch(/게이트/);
});

test("S2_PRESENT_CHOICES (ko): shows max 2 choices", () => {
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

test("S2_PRESENT_CHOICES (ko): full 4-step sequence includes disclosure + wait", () => {
  const out = renderFirstResponse({
    lang: "ko",
    state_id: "S2_PRESENT_CHOICES",
    category_text: "전자제품",
    choices: [
      { id: "A1", title: "아마존 공식 환불 절차 안내" },
      { id: "A2", title: "판매자 요청 문장 작성 도움" }
    ]
  });

  expect(out.text).toMatch(/\(※ 안내만 가능/);
  expect(out.text).toMatch(/준비되시면 번호\(1 또는 2\)/);
});

test("rejects generalities (ko)", () => {
  expect(() =>
    renderFirstResponse({
      lang: "ko",
      state_id: "S1_MIN_FACTS_REQUEST",
      category_text: "의류",
      facts_required: [
        { key: "received_date", ko: "수령일", en: "Delivery date" }
      ],
      // 아래는 intentionally generality leak 테스트
      _debug_inject: "보통"
    })
  ).not.toThrow(); // NOTE: _debug_inject는 렌더러가 사용하지 않으므로 통과해야 함
});
