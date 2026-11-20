#!/usr/bin/env node
/**
 * Backend convention refactor:
 * keep complete C# signatures on one line when the result is <= 180 chars.
 *
 * Usage:
 *   node backend/tools/one-line-signatures.mjs
 *   node backend/tools/one-line-signatures.mjs --check
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = (() => {
  const rootArg = process.argv.find((arg) => arg.startsWith("--root="));
  if (rootArg) return path.resolve(rootArg.slice("--root=".length));
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
})();
const MAX_LINE = 400;
const CHECK = process.argv.includes("--check");
const SKIP_DIRS = new Set(["bin", "obj", "Migrations", ".git", ".vs"]);

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path.join(directory, entry.name), files);
    } else if (entry.isFile() && entry.name.endsWith(".cs")) {
      files.push(path.join(directory, entry.name));
    }
  }
  return files;
}

function isSignatureStart(line) {
  const text = line.trim();
  if (!text || text.startsWith("//") || text.startsWith("/*") || text.startsWith("[")) return false;
  if (text.endsWith(";") || text.endsWith("}")) return false;
  if (!text.includes("(")) return false;
  if (text.includes("=") && text.indexOf("=") < text.indexOf("(")) return false;

  if (/^(public|private|protected|internal)\b/.test(text)) return true;
  if (/^(record|class|struct|interface)\b/.test(text)) return true;

  // Interface members and other declarations without an access modifier:
  // return type + method name + opening parenthesis.
  if (
    /^(?:[A-Za-z_][\w<>,\[\]?.]*\s+)+[A-Za-z_]\w*(?:<[^>]*>)?\s*\(/.test(text) &&
    !/^(if|for|foreach|while|switch|catch|using|lock|return|throw|await|new|var|else|do|try|finally|yield)\b/.test(text)
  ) {
    return true;
  }

  return false;
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

function cleanSignature(parts) {
  let joined = parts.map((part) => part.trim()).join(" ");
  joined = joined.replace(/\s*\(\s*/g, "(").replace(/\s*\)/g, ")");
  joined = joined.replace(/\s*,\s*/g, ", ");
  return joined.replace(/\s+/g, " ");
}

let changedFiles = 0;
let changedSignatures = 0;

const files = walk(ROOT);
const scannedFiles = files.length;

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  const newline = original.includes("\r\n") ? "\r\n" : "\n";
  const lines = original.split(/\r?\n/);
  const output = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!isSignatureStart(line) || parenDelta(line) <= 0) {
      output.push(line);
      continue;
    }

    const parts = [line];
    let depth = parenDelta(line);
    let next = index + 1;
    let hasComment = line.includes("//") || line.includes("/*");

    while (depth > 0 && next < lines.length && parts.length < 40) {
      const candidate = lines[next];
      if (candidate.includes("//") || candidate.includes("/*")) {
        hasComment = true;
        break;
      }
      parts.push(candidate);
      depth += parenDelta(candidate);
      next++;
    }

    if (hasComment || depth !== 0) {
      output.push(line);
      continue;
    }

    const indent = line.match(/^\s*/)?.[0] ?? "";
    const joined = `${indent}${cleanSignature(parts)}`;
    if (joined.length > MAX_LINE) {
      output.push(line);
      continue;
    }

    output.push(joined);
    changedSignatures++;
    index = next - 1;
  }

  const result = output.join(newline);
  if (result !== original) {
    changedFiles++;
    if (CHECK) {
      console.log(`needs formatting: ${path.relative(process.cwd(), file)}`);
    } else {
      fs.writeFileSync(file, result, "utf8");
    }
  }
}

console.log(
  CHECK
    ? `scanned ${scannedFiles} files; ${changedFiles} files need formatting, ${changedSignatures} signatures`
    : `scanned ${scannedFiles} files; formatted ${changedFiles} files, ${changedSignatures} signatures`,
);

if (CHECK && changedFiles > 0) process.exitCode = 1;
