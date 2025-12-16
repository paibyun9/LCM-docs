// lcm-server/renderer/first_response_renderer.js
// Day-4 Step-4: Template-driven, domain-agnostic first response renderer
// Rules: state-driven, deterministic, no generalities, no gate words, max 2 choices.

const fs = require("fs");
const path = require("path");

const DEFAULT_TEMPLATE_PATH = path.resolve(__dirname, "./templates/first_response.v1.json");

const DEFAULT_DISCLOSURE = {
  ko: "(※ 안내만 가능하며, 실제 환불/반품은 해당 플랫폼에서 직접 진행하셔야 합니다.)",
  en: "(※ Guidance only. You must submit the return/refund request directly on the platform.)"
};

function assertNoGateWords(text) {
  const banned = [/gate\s*\d*/i, /게이트/];
  for (const rx of banned) {
    if (rx.test(text)) throw new Error("Gate word leak detected");
  }
}

function assertNoGeneralities(text) {
  // 최소한만 강제: “보통/일반적으로/대체로” 같은 일반론 금지
  const banned = [/보통/g, /일반적으로/g, /대체로/g];
  for (const rx of banned) {
    if (rx.test(text)) throw new Error("Generality leak detected");
  }
}

function loadTemplate(templatePath = DEFAULT_TEMPLATE_PATH) {
  const raw = fs.readFileSync(templatePath, "utf-8");
  const t = JSON.parse(raw);

  // ultra-minimal validation (fail fast)
  if (!t || !t.copy || !t.copy.ko || !t.copy.en) throw new Error("Invalid template: missing copy.ko/copy.en");
  if (!t.copy.ko.state_declaration || !t.copy.en.state_declaration) throw new Error("Invalid template: missing state_declaration");
  return t;
}

function fmt(s, vars) {
  return String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}

function renderStateDeclaration({ tpl, lang, state_id, category }) {
  const map = tpl.copy[lang]?.state_declaration || {};
  const s = map[state_id];
  if (!s) throw new Error(`No state declaration for ${state_id}`);
  return fmt(s, { category });
}

function renderFactsRequest({ tpl, lang, facts_required }) {
  // facts_required: [{ key, ko, en }]
  if (!Array.isArray(facts_required) || facts_required.length === 0) {
    throw new Error("facts_required must be a non-empty array in S1_MIN_FACTS_REQUEST");
  }

  const lines = [];
  lines.push(tpl.copy[lang].facts_intro);

  for (const f of facts_required) {
    const label = lang === "en" ? f.en : f.ko;
    if (!label) throw new Error("facts_required item missing label");
    lines.push(`• ${label}`);
  }

  lines.push(tpl.copy[lang].facts_outro);
  return lines.join("\n");
}

function renderChoices({ tpl, lang, choices }) {
  if (!Array.isArray(choices) || choices.length === 0) throw new Error("choices must be a non-empty array in S2_PRESENT_CHOICES");
  if (choices.length > 2) throw new Error("Day-4 constraint: choices must be <= 2");

  const lines = [];
  lines.push(tpl.copy[lang].choices_intro);

  const lineTpl = tpl.copy[lang].choice_line;
  for (let i = 0; i < choices.length; i++) {
    lines.push(fmt(lineTpl, { n: String(i + 1), title: choices[i].title }));
  }
  return lines.join("\n");
}

function renderWaitPrompt({ tpl, lang, state_id, facts_required, choices }) {
  // 마지막 줄은 항상 “대기(액션 유도)” 문장
  let hint = "";

  if (state_id === "S1_MIN_FACTS_REQUEST") {
    hint = lang === "en" ? "the details above" : "위 정보를";
  } else if (state_id === "S2_PRESENT_CHOICES") {
    // 1 또는 2 같은 형태 강제
    hint = lang === "en" ? "option 1 or 2" : "번호(1 또는 2)를";
  } else {
    hint = lang === "en" ? "your response" : "답변을";
  }

  return fmt(tpl.copy[lang].wait_prompt, { hint });
}

function renderGoldenSequence({ tpl, lang, state_id, category_text, facts_required, choices, disclosure }) {
  const category = category_text || (lang === "en" ? "this item" : "해당 상품");
  const disc = disclosure || DEFAULT_DISCLOSURE[lang];

  const parts = [];

  // Step 1: 상태 선언
  parts.push(renderStateDeclaration({ tpl, lang, state_id, category }));

  // Step 2: 최소 질문 / 선택지
  if (state_id === "S1_MIN_FACTS_REQUEST") {
    parts.push(renderFactsRequest({ tpl, lang, facts_required }));
  } else if (state_id === "S2_PRESENT_CHOICES") {
    parts.push(renderChoices({ tpl, lang, choices }));
  } else {
    throw new Error(`Unsupported state_id: ${state_id}`);
  }

  // Step 3: Non-Negotiable disclosure
  parts.push(disc);

  // Step 4: 대기/다음 행동 유도 (항상 마지막 줄)
  parts.push(renderWaitPrompt({ tpl, lang, state_id, facts_required, choices }));

  const text = parts.join("\n\n");

  assertNoGateWords(text);
  assertNoGeneralities(text);

  return { text, state_id, lang };
}

/**
 * renderFirstResponse(params)
 * - lang: "ko" | "en"
 * - state_id: "S1_MIN_FACTS_REQUEST" | "S2_PRESENT_CHOICES"
 * - category_text: string
 * - facts_required: [{key, ko, en}] (S1)
 * - choices: [{id, title}] (S2)
 * - disclosure?: string
 * - template_path?: string (optional; test/debug only)
 */
function renderFirstResponse(params) {
  const lang = params.lang === "en" ? "en" : "ko";
  const tpl = loadTemplate(params.template_path);
  return renderGoldenSequence({ tpl, lang, ...params });
}

module.exports = {
  renderFirstResponse,
  _internal: { loadTemplate, assertNoGateWords, assertNoGeneralities }
};
