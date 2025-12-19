// lcm-server/step4/question_queue_engine.js
// Day-7 Skeleton: Step 4 Question Queue Engine
// Goal: deterministic, one-question-at-a-time, pure-ish utilities (no side effects)

function normalizeLang(lang) {
  const s = String(lang || "ko").trim().toLowerCase();
  return s.startsWith("en") ? "en" : "ko";
}

function assertValidQuestions(questions) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("questions must be a non-empty array");
  }
  const ids = new Set();
  for (const q of questions) {
    if (!q || typeof q !== "object") throw new Error("each question must be an object");
    if (!q.id || typeof q.id !== "string") throw new Error("question.id must be a string");
    if (ids.has(q.id)) throw new Error(`duplicate question id: ${q.id}`);
    ids.add(q.id);

    if (!q.text || typeof q.text !== "string") throw new Error("question.text must be a string");
    if (typeof q.required !== "boolean") throw new Error("question.required must be boolean");
  }
}

// ctx = { answers: { [id]: any } }
function initStep4Context() {
  return { answers: {} };
}

function applyAnswer(ctx, { id, value }) {
  const next = ctx && typeof ctx === "object" ? ctx : initStep4Context();
  const answers = { ...(next.answers || {}) };
  answers[String(id)] = value;
  return { ...next, answers };
}

// 핵심: 아직 답 안한 질문 중 "가장 앞" 1개만 반환
function getNextQuestion({ questions, ctx }) {
  assertValidQuestions(questions);

  const answers = (ctx && ctx.answers) || {};
  const next = questions.find((q) => !(q.id in answers));
  if (!next) return { done: true, question: null };

  return {
    done: false,
    question: { id: next.id, text: next.text, required: next.required }
  };
}

// (선택) 모두 답했는지 검사
function isDone({ questions, ctx }) {
  const r = getNextQuestion({ questions, ctx });
  return r.done;
}

module.exports = {
  initStep4Context,
  applyAnswer,
  getNextQuestion,
  isDone,
  _internal: { normalizeLang, assertValidQuestions }
};