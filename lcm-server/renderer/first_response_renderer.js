// lcm-server/renderer/first_response_renderer.js
// Day-4: First Response Rendering Engine (Step 3)
// Rule: state-driven, domain-agnostic, deterministic, no generalities, no gate words.

const DEFAULT_DISCLOSURE = {
  ko: "(※ 안내만 가능하며, 실제 환불/반품은 해당 플랫폼에서 직접 진행하셔야 합니다.)",
  en: "(※ Guidance only. You must submit the return/refund request directly on the platform.)"
};

const KO_STATE_DECLARATIONS = {
  S1_MIN_FACTS_REQUEST: "{category} 환불·반품을 도와드리겠습니다.",
  S2_PRESENT_CHOICES: "{category} 환불·반품 진행 방식을 선택해 주세요."
};

const EN_STATE_DECLARATIONS = {
  S1_MIN_FACTS_REQUEST: "I can help with your {category} refund/return.",
  S2_PRESENT_CHOICES: "Please choose how you'd like to proceed with your {category} refund/return."
};

function normalizeLang(lang) {
  return lang === "en" ? "en" : "ko";
}

function renderStateDeclaration({ lang, state_id, category }) {
  const map = lang === "en" ? EN_STATE_DECLARATIONS : KO_STATE_DECLARATIONS;
  const tpl = map[state_id];
  if (!tpl) throw new Error(`No state declaration for ${state_id}`);
  return tpl.replace("{category}", category);
}

function assertNoGateWords(text) {
  const banned = [/gate\s*\d*/i, /게이트/];
  for (const rx of banned) {
    if (rx.test(text)) throw new Error("Gate word leak detected");
  }
}

function assertMaxChoices(choices, max) {
  if (!Array.isArray(choices)) throw new Error("choices must be an array");
  if (choices.length > max) throw new Error(`choices must be <= ${max}`);
}

function renderFactsRequest({ lang, facts }) {
  // facts: [{ key, ko, en }]
  if (!Array.isArray(facts) || facts.length === 0) {
    throw new Error("facts_required must be a non-empty array in S1_MIN_FACTS_REQUEST");
  }

  const lines = [];
  if (lang === "en") {
    lines.push("To make a precise decision, please share only:");
    for (const f of facts) lines.push(`• ${f.en}`);
    lines.push("Once confirmed, I’ll tell you whether it’s eligible.");
  } else {
    lines.push("정확한 판단을 위해 아래만 알려주세요:");
    for (const f of facts) lines.push(`• ${f.ko}`);
    lines.push("확인되는 즉시 가능 여부를 판단해 드리겠습니다.");
  }
  return lines.join("\n");
}

function renderChoices({ lang, choices }) {
  assertMaxChoices(choices, 2);

  const lines = [];
  if (lang === "en") {
    lines.push("Please choose one:");
  } else {
    lines.push("다음 중 하나를 선택해 주세요:");
  }

  choices.forEach((c, idx) => {
    lines.push(`${idx + 1}. ${c.title}`);
  });

  if (lang === "en") {
    lines.push("Reply with 1 or 2.");
  } else {
    lines.push("원하시는 번호(1 또는 2)를 알려주세요.");
  }

  return lines.join("\n");
}

/**
 * Step 3 핵심:
 * - 모든 출력의 "마지막 줄"을 엔진 규칙으로 강제한다.
 * - state_id에 따라 wait prompt 문구를 결정한다.
 */
function renderWaitPrompt({ lang, state_id }) {
  const KO = {
    S1_MIN_FACTS_REQUEST: "준비되시면 위 정보를 알려주세요.",
    S2_PRESENT_CHOICES: "준비되시면 번호(1 또는 2)를 알려주세요."
  };
  const EN = {
    S1_MIN_FACTS_REQUEST: "When you're ready, please share the details above.",
    S2_PRESENT_CHOICES: "When you're ready, reply with 1 or 2."
  };

  const map = lang === "en" ? EN : KO;
  const text = map[state_id];
  if (!text) throw new Error(`No wait prompt for ${state_id}`);
  return text;
}

function renderGoldenSequence({ lang, state_id, category_text, facts_required, choices, disclosure }) {
  const category = category_text || (lang === "en" ? "Item" : "상품");
  const out = [];

  // Step 1 — State Declaration
  out.push(renderStateDeclaration({ lang, state_id, category }));

  // Step 2 — Facts request OR Choices
  if (state_id === "S1_MIN_FACTS_REQUEST") {
    out.push(renderFactsRequest({ lang, facts: facts_required }));
  } else if (state_id === "S2_PRESENT_CHOICES") {
    out.push(renderChoices({ lang, choices }));
  } else {
    throw new Error(`Unsupported state_id: ${state_id}`);
  }

  // Step 3 — Non-Negotiable disclosure (always present)
  const d = disclosure || DEFAULT_DISCLOSURE[lang];
  out.push(d);

  // Step 4 — Wait prompt (always last line, rule-enforced)
  out.push(renderWaitPrompt({ lang, state_id }));

  const text = out.join("\n");

  // Safety checks
  assertNoGateWords(text);

  return text;
}

function renderFirstResponse(input) {
  const lang = normalizeLang(input.lang);
  const state_id = input.state_id;

  const text = renderGoldenSequence({
    lang,
    state_id,
    category_text: input.category_text,
    facts_required: input.facts_required,
    choices: input.choices,
    disclosure: input.disclosure
  });

  return { text, state_id, lang };
}

module.exports = {
  renderFirstResponse,
  _internal: { renderStateDeclaration, renderWaitPrompt, assertNoGateWords }
};
