#!/usr/bin/env node
/**
 * Join short multi-line argument lists in command features and repositories.
 *
 * Usage:
 *   node backend/tools/one-line-calls.mjs
 *   node backend/tools/one-line-calls.mjs --check
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MAX_LINE = 400;
const CHECK = process.argv.includes("--check");
const TARGETS = [
  path.join(ROOT, "Application", "Features"),
  path.join(ROOT, "Infrastructure", "Repositories"),
];

function walk(directory, files = []) {
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!["bin", "obj", "Migrations"].includes(entry.name)) walk(path.join(directory, entry.name), files);
    } else if (entry.isFile() && entry.name.endsWith(".cs")) {
      files.push(path.join(directory, entry.name));
    }
  }
  return files;
}

function parenDelta(text) {
  let delta = 0;
  let quote = null;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "/" && text[i + 1] === "/") break;
    if (char === "(") delta++;
    if (char === ")") delta--;
  }
  return delta;
}

function clean(parts) {
  let joined = parts.map((part) => part.trim()).join(" ");
  joined = joined.replace(/\s*\(\s*/g, "(").replace(/\s*\)/g, ")");
  joined = joined.replace(/\s*,\s*/g, ", ");
  return joined.replace(/\s+/g, " ");
}

let changedFiles = 0;
let changedCalls = 0;
const files = TARGETS.flatMap((target) => walk(target));

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const newline = original.includes("\r\n") ? "\r\n" : "\n";
  const lines = original.split(/\r?\n/);
  const output = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const text = line.trim();
    if (!text || text.startsWith("//") || text.startsWith("/*") || text.startsWith("[")) {
      output.push(line);
      continue;
    }
    if (parenDelta(line) <= 0 || text.includes("{") || text.includes("}")) {
      output.push(line);
      continue;
    }

    const parts = [line];
    let depth = parenDelta(line);
    let next = index + 1;
    let blocked = false;

    while (depth > 0 && next < lines.length && parts.length < 30) {
      const part = lines[next];
      if (part.includes("//") || part.includes("/*") || part.includes("{") || part.includes("}")) {
        blocked = true;
        break;
      }
      parts.push(part);
      depth += parenDelta(part);
      next++;
    }

    if (blocked || depth !== 0) {
      output.push(line);
      continue;
    }

    const indent = line.match(/^\s*/)?.[0] ?? "";
    const joined = `${indent}${clean(parts)}`;
    if (joined.length > MAX_LINE) {
      output.push(line);
      continue;
    }

    output.push(joined);
    changedCalls++;
    index = next - 1;
  }

  const result = output.join(newline);
  if (result !== original) {
    changedFiles++;
    if (CHECK) console.log(`needs formatting: ${path.relative(process.cwd(), file)}`);
    else fs.writeFileSync(file, result, "utf8");
  }
}

console.log(
  CHECK
    ? `scanned ${files.length} files; ${changedFiles} files need formatting, ${changedCalls} argument lists`
    : `scanned ${files.length} files; formatted ${changedFiles} files, ${changedCalls} argument lists`,
);

if (CHECK && changedFiles > 0) process.exitCode = 1;
