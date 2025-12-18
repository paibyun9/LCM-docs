// lcm-server/step2/step2_options_generator.js
// Day-6: Step 2 Options Generator
// Contract: ALWAYS return exactly 3 options.
// Domain-agnostic, deterministic, no promises, no acting on behalf of user.

function normalizeLang(lang) {
  const s = String(lang || "ko").trim().toLowerCase();
  return s.startsWith("en") ? "en" : "ko";
}

function optionLabels(lang) {
  const L = normalizeLang(lang);
  if (L === "en") {
    return {
      opt1: "Guide the official process",
      opt2: "Draft a message to the seller/support",
      opt3: "Ask a follow-up question",
    };
  }
  return {
    opt1: "공식 절차 안내",
    opt2: "판매자/고객센터 메시지 초안",
    opt3: "추가 질문하기",
  };
}

/**
 * @param {object} params
 * @param {object} params.ctx - context (may include user_message etc.)
 * @param {string} params.lang - "ko" | "en"
 * @returns {{ options: Array<{id:string,label:string}> }}
 */
function generateStep2Options({ ctx = {}, lang = "ko" } = {}) {
  const labels = optionLabels(lang);

  // Contract: Always 3 options, fixed order.
  const options = [
    { id: "opt_official_flow", label: labels.opt1 },
    { id: "opt_draft_message", label: labels.opt2 },
    { id: "opt_followup", label: labels.opt3 },
  ];

  return { options };
}

module.exports = { generateStep2Options, _internal: { normalizeLang, optionLabels } };