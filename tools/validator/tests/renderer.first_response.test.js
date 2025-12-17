const path = require("path");
const fs = require("fs");

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

  expect(out.text).toContain("의류");
  expect(out.text).toContain("정확한 판단을 위해");
  expect(out.text).toContain("• 수령일");
  expect(out.text).toContain("• 태그 부착 여부");
  expect(out.text).toMatch(/\(※ 안내만 가능/);

  const lastLine = out.text.trim().split("\n").slice(-1)[0];
  expect(lastLine).toBe("준비되시면 위 정보를 알려주세요.");

  expect(out.text).not.toMatch(/Gate/i);
  expect(out.text).not.toMatch(/게이트/);
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

  expect(out.text).not.toMatch(/Gate/i);
  expect(out.text).not.toMatch(/게이트/);
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

test("template_path override works (domain-agnostic rendering)", () => {
  const tmp = path.resolve(__dirname, "tmp.first_response.template.json");

  // ✅ 렌더러가 받아들일 수 있는 형태로 작성:
  // - state_declarations: { ko: {...}, en: {...} }
  // - non_negotiable: nnr_line/disclosure는 "ko/en에서 문자열로 resolve 가능"해야 함
  // - wait_prompt: { ko:{STATE:... , DEFAULT:...}, en:{...} }
  fs.writeFileSync(tmp, JSON.stringify({
    version: "tmp",
    state_declarations: {
      ko: {
        S1_MIN_FACTS_REQUEST: "TMP:{category} OK",
        S2_PRESENT_CHOICES: "TMP_CHOICE:{category}",
        DEFAULT: "TMP_DEFAULT"
      },
      en: {
        S1_MIN_FACTS_REQUEST: "TMP:{category} OK",
        S2_PRESENT_CHOICES: "TMP_CHOICE:{category}",
        DEFAULT: "TMP_DEFAULT"
      }
    },
    facts_request: {
      ko: { intro: "TMP_INTRO", outro: "TMP_OUTRO" },
      en: { intro: "TMP_INTRO", outro: "TMP_OUTRO" }
    },
    choices: {
      ko: { header: "TMP_CH_HEADER", prompt: "TMP_CH_PROMPT" },
      en: { header: "TMP_CH_HEADER", prompt: "TMP_CH_PROMPT" }
    },
    non_negotiable: {
      // 가장 호환성 높은 형태: { nnr_line: {ko:"",en:""}, disclosure:{ko:"",en:""} }
      nnr_line: { ko: "TMP_NNR", en: "TMP_NNR" },
      disclosure: { ko: "TMP_DISCLOSURE", en: "TMP_DISCLOSURE" }
    },
    wait_prompt: {
      ko: { S1_MIN_FACTS_REQUEST: "TMP_WAIT", DEFAULT: "TMP_WAIT_DEFAULT" },
      en: { S1_MIN_FACTS_REQUEST: "TMP_WAIT", DEFAULT: "TMP_WAIT_DEFAULT" }
    }
  }, null, 2));

  const out = renderFirstResponse({
    lang: "ko",
    state_id: "S1_MIN_FACTS_REQUEST",
    category_text: "의류",
    facts_required: [{ key: "received_date", ko: "수령일", en: "Delivery date" }],
    template_path: tmp
  });

  expect(out.text).toContain("TMP:의류 OK");
  expect(out.text).toContain("TMP_INTRO");
  expect(out.text).toContain("TMP_NNR");
  expect(out.text).toContain("TMP_DISCLOSURE");

  const lastLine = out.text.trim().split("\n").slice(-1)[0];
  expect(lastLine).toBe("TMP_WAIT");

  expect(out.text).not.toMatch(/Gate/i);
  expect(out.text).not.toMatch(/게이트/);

  // cleanup
  fs.unlinkSync(tmp);
});
