// lcm-server/index.js
// Engine-level Single Exit Gate (no HTTP/res)
// All outward results MUST pass through Guard.

const { enforceGuard } = require("./gate/enforce_guard");
const { renderFirstResponse } = require("./renderer/first_response_renderer");

/**
 * Extract user message from input in a tolerant way.
 * (So Guard can always see the true user intent.)
 */
function extractUserMessage(input) {
  if (!input) return "";
  if (typeof input === "string") return input;

  // common keys
  return String(
    input.user_message ??
      input.userMessage ??
      input.message ??
      input.text ??
      input.query ??
      ""
  ).trim();
}

/**
 * Produce First Response with enforced Guard.
 * Returns a stable response object suitable for SDK/CLI/server wrappers.
 *
 * input: whatever your renderer expects
 * ctx: { route, request_id, user_id, ... } (optional)
 * lang: "ko" | "en"
 */
async function produceFirstResponse({ input, ctx = {}, lang = "ko" }) {
  // 1) draft 생성
  const draft = await renderFirstResponse(input, lang);

  // 2) Guard가 사용자 의도를 볼 수 있게 ctx에 user_message를 강제 주입
  const mergedCtx = {
    ...ctx,
    user_message: extractUserMessage(input),
  };

  // 3) 단일 Exit Gate 강제 통과
  const decision = await enforceGuard({ draft, ctx: mergedCtx, lang });

  // 4) blocked면 차단 응답 반환 (표준 포맷)
  if (decision?.blocked) {
    return {
      ok: false,
      blocked: true,
      reason_code: decision.reason_code || null,
      message: decision.message || "I can’t help with that request.",
    };
  }

  // 5) 통과면 결과 반환
  return {
    ok: true,
    blocked: false,
    result: decision?.output ?? draft,
  };
}

module.exports = { produceFirstResponse };