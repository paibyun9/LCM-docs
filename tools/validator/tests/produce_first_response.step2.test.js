const path = require("path");

const modPath = path.resolve(
  __dirname,
  "../../../lcm-server/index.js"
);

const { produceFirstResponse } = require(modPath);

test("produceFirstResponse attaches step2 options with exactly 3 items", async () => {
  const res = await produceFirstResponse({
    input: { user_message: "환불 가능해?" },
    lang: "ko",
  });

  expect(res.ok).toBe(true);
  expect(res.step2).toBeTruthy();
  expect(Array.isArray(res.step2.options)).toBe(true);
  expect(res.step2.options).toHaveLength(3);
});