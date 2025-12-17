// lcm-server/guards/non_negotiable_guard.cjs
// Day-5: Non-Negotiable Rule Guard
// Rule: Guidance-only. Never execute/approve on behalf of user. Block bypass/unofficial routes.
// Deterministic, domain-agnostic, no gate words.

function assertNoGateWords(text) {
  const banned = [/gate\s*\d*/i, /게이트/];
  for (const rx of banned) {
    if (rx.test(String(text))) throw new Error("Gate word leak detected");
  }
}

function makeError(messageKo, messageEn, lang = "ko") {
  const L = String(lang || "ko").toLowerCase().startsWith("en") ? "en" : "ko";
  const msg = L === "en" ? messageEn : messageKo;
  assertNoGateWords(msg);
  const err = new Error(msg);
  err.code = "NON_NEGOTIABLE_BLOCK";
  return err;
}

function checkNonNegotiable(user_message, lang = "ko") {
  const msg = String(user_message || "").trim();
  if (!msg) return { ok: true };

  // 1) 대신 실행/대신 신청/대신 처리
  const executionPatterns = [
    /내\s*대신/i,
    /대신.*(환불|반품|취소).*(신청|처리|접수|진행).*(해줘|해주세요|해\s*줘)/i,
    /(환불|반품|취소).*(대신).*(신청|처리|접수|진행).*(해줘|해주세요|해\s*줘)/i,
    /you\s*(submit|file|process|approve)\s*(it|this)\s*for\s*me/i
  ];

  // 2) 확정/보장/승인/100% 가능 “단정” 요구 (LCM은 판단·안내만)
  const guaranteePatterns = [
    /(확정|보장|단정).*(환불|반품|취소)/i,
    /(환불|반품|취소).*(확정|보장|단정)/i,
    /100%\s*(가능|확정|보장)/i,
    /(무조건|무조건적으로).*(환불|반품|취소)/i
  ];

  // 3) 우회/비공식/계정 접근
  const bypassPatterns = [
    /우회|비공식/i,
    /(계정|아이디|비번|비밀번호|password)\s*(알려|공유|입력|제공)/i,
    /로그인\s*해서\s*해/i,
    /hack|bypass|unofficial/i
  ];

  if (executionPatterns.some((rx) => rx.test(msg))) {
    throw makeError(
      "저는 환불/반품을 대신 신청하거나 처리할 수 없습니다. 대신 공식 절차 안내 또는 판매자 메시지 초안 작성은 도와드릴게요.",
      "I can’t submit or process refunds/returns on your behalf. I can guide the official flow or draft a seller message for you.",
      lang
    );
  }

  if (guaranteePatterns.some((rx) => rx.test(msg))) {
    throw makeError(
      "저는 결과를 보장하거나 확정할 수 없습니다. 다만 기준에 따라 가능 여부를 판단하고, 다음 행동(공식 절차/요청 문장)을 안내해 드릴게요.",
      "I can’t guarantee or confirm outcomes. I can assess eligibility by the policy criteria and guide the next step (official flow / message draft).",
      lang
    );
  }

  if (bypassPatterns.some((rx) => rx.test(msg))) {
    throw makeError(
      "비공식/우회 경로 또는 계정 접근이 필요한 요청은 도와드릴 수 없습니다. 대신 공식 절차로 진행할 수 있게 안내해 드릴게요.",
      "I can’t help with bypass/unofficial routes or anything requiring account access. I can guide you through the official process instead.",
      lang
    );
  }

  return { ok: true };
}

module.exports = { checkNonNegotiable, _internal: { assertNoGateWords } };
