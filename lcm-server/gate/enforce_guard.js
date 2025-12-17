// lcm-server/gate/enforce_guard.js
const { nonNegotiableGuard } = require("../guards/non_negotiable_guard.cjs");

/**
 * Pure Exit Gate (engine-level):
 * - HTTP/res 없이도 사용 가능
 * - 모든 "최종 출력"은 여기서 guard를 강제 통과해야 함
 */
async function enforceGuard({ draft, ctx = {}, lang = "ko" }) {
  // nonNegotiableGuard는 동기여도/비동기여도 상관없게 await
  const decision = await nonNegotiableGuard({ draft, ctx, lang });

  // decision 표준:
  // { blocked: boolean, reason_code, message, output }
  return decision;
}

module.exports = { enforceGuard };