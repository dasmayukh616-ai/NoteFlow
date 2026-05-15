#!/usr/bin/env node

import { execSync } from "node:child_process";

const LEGACY_SURFACE_PATTERNS = [
  /^src\/app\//,
  /^src\/components\//,
  /^src\/hooks\//,
  /^src\/lib\//,
  /^public\//,
  /^next\.config\.ts$/,
  /^src\/middleware\.ts$/,
];

const PARITY_ALLOWED_PATTERNS = [
  // Allow only route handlers under api/v1, not arbitrary files.
  /^src\/app\/api\/v1\/[a-z0-9-]+(?:\/[a-z0-9-]+)*\/route\.ts$/,
  // Allow only typed parity adapter modules in src/lib/parity-api.
  /^src\/lib\/parity-api\/[a-z0-9-]+\.ts$/,
  /^src\/lib\/parity-api\/README\.md$/,
];

function runGit(command) {
  return execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function normalizePath(filePath) {
  return filePath.replace(/\\/g, "/");
}

function parseChangedFiles(raw) {
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(normalizePath);
}

function changedFilesFromGit() {
  const baseRef = process.env.FREEZE_BASE_REF?.trim();
  if (baseRef) {
    try {
      const raw = runGit(`git diff --name-only --diff-filter=ACMR ${baseRef}...HEAD`);
      return parseChangedFiles(raw);
    } catch {
      return [];
    }
  }

  const tracked = (() => {
    try {
      return parseChangedFiles(
        runGit("git diff --name-only --diff-filter=ACMR HEAD"),
      );
    } catch {
      return [];
    }
  })();

  const untracked = (() => {
    try {
      return parseChangedFiles(runGit("git ls-files --others --exclude-standard"));
    } catch {
      return [];
    }
  })();

  return [...new Set([...tracked, ...untracked])];
}

function isLegacySurface(filePath) {
  return LEGACY_SURFACE_PATTERNS.some((pattern) => pattern.test(filePath));
}

function isParityAllowed(filePath) {
  return PARITY_ALLOWED_PATTERNS.some((pattern) => pattern.test(filePath));
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const changedFiles = changedFilesFromGit();
const blockedFiles = changedFiles.filter(
  (filePath) => isLegacySurface(filePath) && !isParityAllowed(filePath),
);

if (blockedFiles.length === 0) {
  console.log("Next.js freeze guard passed.");
  process.exit(0);
}

const bypassEnabled = process.env.NEXT_FREEZE_BYPASS === "1";
const bypassReason = process.env.NEXT_FREEZE_BYPASS_REASON?.trim();

if (bypassEnabled) {
  if (!bypassReason) {
    fail(
      "NEXT_FREEZE_BYPASS was set, but NEXT_FREEZE_BYPASS_REASON is missing. Add a short reason.",
    );
  }

  console.log(
    `Next.js freeze guard bypassed with reason: ${bypassReason}\nAffected files:\n${blockedFiles.map((file) => `- ${file}`).join("\n")}`,
  );
  process.exit(0);
}

fail(
  [
    "Next.js parity freeze violation detected.",
    "",
    "Blocked legacy frontend files changed:",
    ...blockedFiles.map((file) => `- ${file}`),
    "",
    "Allowed during freeze by default:",
    "- src/app/api/v1/**/route.ts",
    "- src/lib/parity-api/*.ts",
    "- src/lib/parity-api/README.md",
    "",
    "If this change is an intentional freeze exception, set:",
    "- NEXT_FREEZE_BYPASS=1",
    "- NEXT_FREEZE_BYPASS_REASON=\"<why this legacy change is required>\"",
  ].join("\n"),
);
