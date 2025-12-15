const Ajv = require("ajv");
const fs = require("fs");

const ajv = new Ajv({ allErrors: true });

const inputSchema = JSON.parse(fs.readFileSync(__dirname + "/schemas/input.schema.json", "utf8"));
const outputSchema = JSON.parse(fs.readFileSync(__dirname + "/schemas/output.schema.json", "utf8"));

const validateInput = ajv.compile(inputSchema);
const validateOutput = ajv.compile(outputSchema);

const FORBIDDEN_INPUT_FIELDS = ["policy_text", "vendor_policy_text", "gate", "gates"];
const GATE_LEAK_REGEX = /\bGate\s*\d+|\bGate\b|\bGATE\b/g;

function reject(code, detail) {
  console.error(`REJECT[${code}] ${detail}`);
  process.exit(1);
}

function validateForbiddenFields(obj) {
  for (const k of FORBIDDEN_INPUT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      reject("INPUT_FORBIDDEN_FIELD", `forbidden field present: ${k}`);
    }
  }
}

function validateNoGateLeak(text) {
  if (typeof text === "string" && text.match(GATE_LEAK_REGEX)) {
    reject("OUTPUT_GATE_LEAK", `gate keyword detected in message/text`);
  }
}

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.log("Usage: node validate.js <input.json> <output.json>");
  process.exit(0);
}

const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const output = JSON.parse(fs.readFileSync(outputPath, "utf8"));

if (!validateInput(input)) reject("INPUT_SCHEMA", JSON.stringify(validateInput.errors));
validateForbiddenFields(input);

if (!validateOutput(output)) reject("OUTPUT_SCHEMA", JSON.stringify(validateOutput.errors));
validateNoGateLeak(output.message);

if (Array.isArray(output.next_actions)) {
  for (const a of output.next_actions) validateNoGateLeak(a?.label || a?.text || "");
}

console.log("PASS: contract validation succeeded");
