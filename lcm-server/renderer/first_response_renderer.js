// lcm-server/renderer/first_response_renderer.js
// Day-4: First Response Rendering Engine (Step 1 + Step 2)
// Rule: state-driven, domain-agnostic, deterministic, no generalities, no gate words.

"use strict";

// -----------------------------
// Step 1) State declarations
// -----------------------------
const KO_STATE_DECLARATIONS = {
  S1_MIN_FACTS_REQUEST: "{category} 환불·반품을 도와드리겠습니다.",
  S2_PRESENT_CHOICES: "확인 결과를 바탕으로, 다음 단계 중 하나로 진행할 수 있습니다."
};

const EN_STATE_DECLARATIONS = {
  S1_MIN_FACTS_REQUEST: "I can help you with {category} returns/refunds.",
  S2_PRESENT_CHOICES: "Based on what we’ve confirmed, we can proceed with one of the following next steps."
};

// -----------------------------
// Step 2) Domain-agnostic templates
// -----------------------------
function renderFirstResponse(input) {
  const lang = input?.lang === "en" ? "en" : "ko";
  const state_id = input?.state_id;
  const category = input?.category_text || (lang === "en" ? "this item" : "해당 상품");
  const disclosure =
    input?.disclosure ||
    (lang === "en"
      ? "(※ Guidance only. You must submit the return/refund request directly on the platform.)"
      : "(※ 안내만 가능하며, 실제 환불/반품은 해당 플랫폼에서 직접 진행하셔야 합니다.)");

  const lines = [];

  // (A) State declaration
  lines.push(renderStateDeclaration({ lang, state_id, category }));

  // (B) State body
  if (state_id === "S1_MIN_FACTS_REQUEST") {
    // Minimal facts request (no generalities)
    const factsNeeded = Array.isArray(input?.facts_needed) ? input.facts_needed : [];
    if (factsNeeded.length === 0) {
      throw new Error("facts_needed required for S1_MIN_FACTS_REQUEST");
    }

    lines.push(""); // spacer
    lines.push(lang === "en" ? "To make an accurate decision, please share only:" : "정확한 판단을 위해 아래만 알려주세요:");
    lines.push(...factsNeeded.map((t) => `• ${String(t)}`));
    lines.push("");
    lines.push(lang === "en" ? "Once confirmed, I’ll tell you whether it’s eligible and what to do next." : "확인되는 즉시 가능 여부를 판단해 드리겠습니다.");
  } else if (state_id === "S2_PRESENT_CHOICES") {
    // Present up to 2 choices (Day-4 constraint)
    const choices = Array.isArray(input?.choices) ? input.choices : [];
    if (choices.length === 0) throw new Error("choices required for S2_PRESENT_CHOICES");
    if (choices.length > 2) throw new Error("choices must be <= 2 for Day-4 renderer");

    lines.push("");
    lines.push(lang === "en" ? "Choose one:" : "다음 중 선택해 주세요:");
    choices.forEach((c, idx) => {
      const title = String(c?.title || "");
      if (!title) throw new Error("each choice.title is required");
      lines.push(`${idx + 1}. ${title}`);
    });
  } else {
    throw new Error(`Unknown state_id: ${state_id}`);
  }

  // (C) Non-Negotiable disclosure (always)
  lines.push("");
  lines.push(disclosure);

  const text = lines.join("\n").trim();

  // Safety checks: never leak internal words
  assertNoGateWords(text);

  return { text, state_id, lang };
}

function renderStateDeclaration({ lang, state_id, category }) {
  const map = lang === "en" ? EN_STATE_DECLARATIONS : KO_STATE_DECLARATIONS;
  const tpl = map[state_id];
  if (!tpl) throw new Error(`No state declaration for ${state_id}`);
  return tpl.replace("{category}", category);
}

function assertNoGateWords(text) {
  // "Gate", "게이트", "Gate 2" 등 내부 단어 금지
  const banned = [/gate\s*\d*/i, /게이트/];
  for (const rx of banned) {
    if (rx.test(text)) throw new Error("Gate word leak detected");
  }
}

module.exports = {
  renderFirstResponse,
  _internal: { renderStateDeclaration, assertNoGateWords }
};
