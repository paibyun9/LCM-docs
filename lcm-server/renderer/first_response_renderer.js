// lcm-server/renderer/first_response_renderer.js
// Day-4: First Response Rendering Engine (Step 3)
// Rule: state-driven, domain-agnostic, deterministic, no generalities, no gate words.
// Output = 4-Step Golden Sequence:
// 1) State declaration + empathy-lite (no fluff)
// 2) Minimal facts OR structured choices (state-driven)
// 3) Non-negotiable disclosure (always)
// 4) Wait / next prompt

const KO_STATE_DECLARATIONS = {
  S1_MIN_FACTS_REQUEST: "{category} 환불·반품을 도와드리겠습니다.",
  S2_PRESENT_CHOICES: "{category} 환불·반품 진행 방식을 선택해 주세요.",
  S_ERROR_HANDLING: "확인을 위해 더 구체적인 정보가 필요합니다."
};

const EN_STATE_DECLARATIONS = {
  S1_MIN_FACTS_REQUEST: "I can help with {category} refunds/returns.",
  S2_PRESENT_CHOICES: "Please choose how you'd like to proceed for this {category} refund/return.",
  S_ERROR_HANDLING: "I need a bit more specific information to verify."
};

const DISCLOSURE = {
  ko: "(※ 안내만 가능하며, 실제 환불/반품은 해당 플랫폼에서 직접 진행하셔야 합니다.)",
  en: "(※ Guidance only. You must submit the return/refund request directly on the platform.)"
};

// ---- Guards (헌법 기반) ----

function assertNoGateWords(text) {
  const banned = [/gate\s*\d*/i, /게이트/];
  for (const rx of banned) {
    if (rx.test(text)) throw new Error("Gate word leak detected");
  }
}

// “일반론/정책용어”를 최소 수준으로만 막는다 (지나친 필터링 금지)
function assertNoGeneralities(text) {
  // 예: "보통", "대체로", "일반적으로" 같은 말은 LCM 스타일 위반
  const banned = [/보통/g, /대체로/g, /일반적으로/g, /generally/gi, /usually/gi];
  for (const rx of banned) {
    if (rx.test(text)) throw new Error("Generality detected");
  }
}

// ---- Core renderers ----

function renderStateDeclaration({ lang, state_id, category }) {
  const map = lang === "en" ? EN_STATE_DECLARATIONS : KO_STATE_DECLARATIONS;
  const tpl = map[state_id];
  if (!tpl) throw new Error(`No state declaration for ${state_id}`);
  return tpl.replace("{category}", category);
}

function renderFactsRequest({ lang, facts }) {
  // facts: [{ key, ko, en }]
  if (!Array.isArray(facts) || facts.length === 0) {
    throw new Error("facts_required must be a non-empty array in S1_MIN_FACTS_REQUEST");
  }

  if (lang === "en") {
    return [
      "To verify, please share only:",
      ...facts.map((f) => `• ${f.en}`),
      "Once confirmed, I’ll 판단 and propose the next step."
    ];
  }

  return [
    "정확한 판단을 위해 아래만 알려주세요:",
    ...facts.map((f) => `• ${f.ko}`),
    "확인되는 즉시 가능 여부를 판단해 드리겠습니다."
  ];
}

function normalizeChoices({ choices, max = 2 }) {
  // Day-4 헌법/validator 기준: choices는 최대 2개 (과다 선택지 금지)
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new Error("choices must be a non-empty array in S2_PRESENT_CHOICES");
  }
  if (choices.length > max) throw new Error("choices > 2 not allowed in Day-4 renderer");
  return choices;
}

function renderChoices({ lang, choices }) {
  const c = normalizeChoices({ choices, max: 2 });

  if (lang === "en") {
    return [
      "Choose one:",
      ...c.map((x, i) => `${i + 1}. ${x.title}`),
      "Reply with 1 or 2."
    ];
  }

  return [
    "다음 중 하나를 선택해 주세요:",
    ...c.map((x, i) => `${i + 1}. ${x.title}`),
    "원하시는 번호(1 또는 2)를 알려주세요."
  ];
}

function renderErrorHandling({ lang }) {
  if (lang === "en") {
    return [
      "Example: “I bought it on Apr 1 and it’s unopened.”",
      "Please tell me again in that format."
    ];
  }
  return [
    "예: “구매일은 4월 1일이고, 아직 개봉 안 했어요”",
    "이 형식으로 다시 알려주시겠어요?"
  ];
}

function renderWait({ lang, state_id }) {
  // 상태에 따라 대기 문장만 아주 미세 조정
  if (lang === "en") {
    if (state_id === "S1_MIN_FACTS_REQUEST") return ["When you're ready, reply with those details."];
    if (state_id === "S2_PRESENT_CHOICES") return ["When you're ready, reply with 1 or 2."];
    return ["When you're ready, reply with the details."];
  }
  if (state_id === "S1_MIN_FACTS_REQUEST") return ["준비되시면 위 정보를 알려주세요."];
  if (state_id === "S2_PRESENT_CHOICES") return ["준비되시면 번호(1 또는 2)를 알려주세요."];
  return ["준비되시면 정보를 알려주세요."];
}

// ---- Golden Sequence orchestrator ----

function renderGoldenSequence(input) {
  const { lang, state_id, category_text } = input;
  const category = category_text || (lang === "en" ? "this item" : "해당 상품");

  const lines = [];

  // Step 1 — state declaration
  lines.push(renderStateDeclaration({ lang, state_id, category }));
  lines.push("");

  // Step 2 — state-driven body
  if (state_id === "S1_MIN_FACTS_REQUEST") {
    lines.push(...renderFactsRequest({ lang, facts: input.facts_required }));
  } else if (state_id === "S2_PRESENT_CHOICES") {
    lines.push(...renderChoices({ lang, choices: input.choices }));
  } else if (state_id === "S_ERROR_HANDLING") {
    lines.push(...renderErrorHandling({ lang }));
  } else {
    throw new Error(`Unsupported state_id: ${state_id}`);
  }

  // Step 3 — disclosure (always)
  lines.push("");
  lines.push(DISCLOSURE[lang] || DISCLOSURE.ko);

  // Step 4 — wait
  lines.push(...renderWait({ lang, state_id }));

  const text = lines.join("\n").trim();

  // Guards
  assertNoGateWords(text);
  assertNoGeneralities(text);

  return { text, state_id, lang };
}

// Backward compatible API name
function renderFirstResponse(input) {
  return renderGoldenSequence(input);
}

module.exports = {
  renderFirstResponse,
  renderGoldenSequence,
  _internal: {
    renderStateDeclaration,
    renderFactsRequest,
    renderChoices,
    normalizeChoices,
    assertNoGateWords,
    assertNoGeneralities
  }
};
