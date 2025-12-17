// lcm-server/renderer/first_response_renderer.js
// Day-4: First Response Rendering Engine (template-driven)
// Rule: state-driven, domain-agnostic, deterministic, no generalities, no gate words.

const fs = require("fs");
const path = require("path");

function normalizeLang(lang) {
  const s = String(lang || "ko").trim().toLowerCase();
  if (s.startsWith("en")) return "en";
  return "ko";
}

function assertNoGateWords(text) {
  const banned = [/gate\s*\d*/i, /게이트/];
  for (const rx of banned) {
    if (rx.test(String(text))) throw new Error("Gate word leak detected");
  }
}

/**
 * Resolve template section that may be:
 * - string
 * - { ko: ..., en: ... }
 * - { ko: {...}, en: {...} }
 * - { ... } (already language-free object)
 */
function resolveLangValue(node, lang) {
  const L = normalizeLang(lang);
  if (node == null) return null;
  if (typeof node === "string") return node;

  // if it looks like a language map: { ko: X, en: Y }
  if (typeof node === "object" && (Object.prototype.hasOwnProperty.call(node, "ko") || Object.prototype.hasOwnProperty.call(node, "en"))) {
    return node[L] ?? node.ko ?? node.en ?? null;
  }

  // otherwise treat it as already language-free object
  return node;
}

function loadTemplate(template_path) {
  const p = template_path
    ? path.resolve(template_path)
    : path.resolve(__dirname, "templates/first_response.v1.json");

  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw);
}

function fmt(str, vars) {
  return String(str).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}

function normalizeLines(x) {
  if (x == null) return [];
  if (Array.isArray(x)) return x.map(String);
  return [String(x)];
}

/** -----------------------
 *  Step 1: State declaration
 *  ----------------------- */
function renderStateDeclaration({ tpl, lang, state_id, category }) {
  const L = normalizeLang(lang);

  const sd = (tpl && tpl.state_declarations) || {};
  if (!sd || typeof sd !== "object") {
    throw new Error("state_declarations must be an object in template");
  }

  // support both shapes:
  // A) { S1: "...", DEFAULT: "..." }
  // B) { ko: {S1:"..."}, en:{...} }
  const map =
    (sd[L] || sd.ko || sd.en) && typeof (sd[L] || sd.ko || sd.en) === "object"
      ? (sd[L] || sd.ko || sd.en)
      : sd;

  const raw = map[state_id] ?? map.DEFAULT;
  if (!raw) {
    throw new Error(`No state declaration template for state_id=${state_id} lang=${L}`);
  }

  const line = fmt(raw, { category });
  assertNoGateWords(line);
  return [line];
}

/** -----------------------
 *  Step 2: Minimal facts request
 *  ----------------------- */
function renderFactsRequest({ tpl, lang, state_id, facts_required }) {
  if (state_id !== "S1_MIN_FACTS_REQUEST") return [];

  if (!Array.isArray(facts_required) || facts_required.length === 0) {
    throw new Error("facts_required must be a non-empty array in S1_MIN_FACTS_REQUEST");
  }

  const L = normalizeLang(lang);
  const frNode = tpl?.facts_request ?? null;
  const fr = resolveLangValue(frNode, lang) || {};

  // allow:
  // facts_request: { intro, outro }
  // OR facts_request: { ko:{intro,outro}, en:{...} } (handled by resolveLangValue)
  const intro = fr.intro || (L === "en" ? "To decide correctly, please share only:" : "정확한 판단을 위해 아래만 알려주세요:");
  const outro = fr.outro || (L === "en" ? "Once confirmed, I’ll judge eligibility immediately." : "확인되는 즉시 가능 여부를 판단해 드리겠습니다.");

  const lines = [intro];
  for (const f of facts_required) {
    const label = L === "en" ? f.en : f.ko;
    lines.push(`• ${label}`);
  }
  lines.push(outro);

  lines.forEach(assertNoGateWords);
  return lines;
}

/** -----------------------
 *  Step 2b: Choices (max 2)
 *  ----------------------- */
function renderChoices({ tpl, lang, state_id, choices }) {
  if (state_id !== "S2_PRESENT_CHOICES") return [];

  if (!Array.isArray(choices)) throw new Error("choices must be an array in S2_PRESENT_CHOICES");
  if (choices.length > 2) throw new Error("choices must be <= 2 (Day-4 constraint)");

  const L = normalizeLang(lang);
  const chNode = tpl?.choices ?? null;
  const ch = resolveLangValue(chNode, lang) || {};

  const header = ch.header || (L === "en" ? "Choose one:" : "다음 중 하나를 선택해 주세요:");
  const prompt = ch.prompt || (L === "en" ? "Reply with 1 or 2." : "원하시는 번호(1 또는 2)를 알려주세요.");

  const lines = [header];
  choices.forEach((c, i) => lines.push(`${i + 1}. ${c.title}`));
  lines.push(prompt);

  lines.forEach(assertNoGateWords);
  return lines;
}


/** -----------------------
 *  Step 3: Non-negotiable disclosure
 *  ----------------------- */
function pickLangString(value, L) {
  // value can be: "string" OR { ko: "…", en: "…" }
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const v = value[L] || value.ko || value.en;
    if (typeof v === "string") return v;
  }
  return null;
}

function renderNonNegotiable({ tpl, lang }) {
  const L = normalizeLang(lang);
  const nn = (tpl && tpl.non_negotiable) || {};

  const fallbackNnr = (L === "en")
    ? "※ I can’t submit or approve refunds/returns on your behalf."
    : "※ 저는 환불/반품을 대신 신청하거나 승인할 수 없습니다.";

  const fallbackDisclosure = (L === "en")
    ? "(※ Guidance only. You must submit the return/refund request directly on the platform.)"
    : "(※ 안내만 가능하며, 실제 환불/반품은 해당 플랫폼에서 직접 진행하셔야 합니다.)";

  const nnrLine = pickLangString(nn.nnr_line, L) || fallbackNnr;
  const disclosure = pickLangString(nn.disclosure, L) || fallbackDisclosure;

  // 이제 여기서는 항상 string 보장됨
  assertNoGateWords(nnrLine);
  assertNoGateWords(disclosure);
  return [nnrLine, disclosure];
}

/** -----------------------
 *  Step 4: Wait prompt (must be last line)
 *  ----------------------- */
function renderWait({ tpl, lang, state_id }) {
  const L = normalizeLang(lang);
  const wpNode = tpl?.wait_prompt ?? null;
  const wp = resolveLangValue(wpNode, lang);

  // allow:
  // wait_prompt: "TMP_WAIT"  (string)
  // wait_prompt: { DEFAULT:"...", S1_MIN_FACTS_REQUEST:"..." } (state map)
  // wait_prompt: { ko:{DEFAULT:"..."}, en:{...} } (handled by resolveLangValue)
  let line = null;

  if (typeof wp === "string") {
    line = wp;
  } else if (wp && typeof wp === "object") {
    line = wp[state_id] ?? wp.DEFAULT ?? null;
  }

  if (!line) {
    line =
      L === "en"
        ? "When ready, reply with the next detail."
        : "준비되시면 위 정보를 알려주세요.";
  }

  assertNoGateWords(line);
  return [line];
}

// Public API
function renderFirstResponse({
  lang = "ko",
  state_id,
  category_text,
  facts_required,
  choices,
  template_path
}) {
  const tpl = loadTemplate(template_path);
  const L = normalizeLang(lang);
  const category = category_text || (L === "en" ? "Return/Refund" : "환불·반품");

  const lines = [
    ...renderStateDeclaration({ tpl, lang: L, state_id, category }),
    ...renderFactsRequest({ tpl, lang: L, state_id, facts_required }),
    ...renderChoices({ tpl, lang: L, state_id, choices }),
    ...renderNonNegotiable({ tpl, lang: L }),
    ...renderWait({ tpl, lang: L, state_id })
  ];

  // final safety
  const text = lines.join("\n");
  assertNoGateWords(text);

  return { text, state_id, lang: L };
}

module.exports = {
  renderFirstResponse,
  _internal: { normalizeLang, loadTemplate, assertNoGateWords, resolveLangValue }
};
