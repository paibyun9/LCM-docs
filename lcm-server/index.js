// lcm-server/index.js
const { enforceGuard } = require("./gate/enforce_guard");
const { renderFirstResponse } = require("./renderer/first_response_renderer");
const { generateStep2Options } = require("./step2/step2_options_generator");

async function produceFirstResponse({ input = {}, ctx = {}, lang = "ko" } = {}) {
  // ctx에 user_message 주입 (guard/exit-gate 판단용)
  const mergedCtx = {
    ...ctx,
    user_message: input?.user_message,
  };

  // 1) draft 생성
  const draft = await renderFirstResponse(input);

  // 2) 단일 Guard/Exit 경로 통과
  const decision = await enforceGuard({
    draft,
    ctx: mergedCtx,
    lang,
  });

  // 3) blocked면 표준 포맷 반환
  if (decision.blocked) {
    return {
      ok: false,
      blocked: true,
      reason_code: decision.reason_code,
      message: decision.message,
    };
  }

  // 4) Step 2 옵션 (항상 3개)
  const step2 = generateStep2Options({ ctx: mergedCtx, lang });

  return {
    ok: true,
    blocked: false,
    result: decision.output ?? draft,
    step2,
  };
}

module.exports = { produceFirstResponse };