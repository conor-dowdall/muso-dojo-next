import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WAV_AUDIO_RUNTIME_CACHE_NAME } from "../src/audio/audioCachePolicy.js";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const publicDirectory = path.join(projectRoot, "public");
const audioDirectory = path.join(publicDirectory, "audio");
const serviceWorkerPath = path.join(publicDirectory, "sw.js");

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
    }),
  );

  return files.flat();
}

function toPublicUrl(filePath) {
  return `/${path.relative(publicDirectory, filePath).split(path.sep).join("/")}`;
}

function extractPrecacheManifestSource(serviceWorkerSource) {
  const firstRevisionIndex = serviceWorkerSource.indexOf("revision:");

  if (firstRevisionIndex === -1) {
    throw new Error("generated worker does not contain a precache manifest");
  }

  const manifestStart = serviceWorkerSource.lastIndexOf(
    "[",
    firstRevisionIndex,
  );

  if (manifestStart === -1) {
    throw new Error("could not locate the start of the precache manifest");
  }

  let depth = 0;
  let escaped = false;
  let quote;

  for (
    let index = manifestStart;
    index < serviceWorkerSource.length;
    index += 1
  ) {
    const character = serviceWorkerSource[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = undefined;
      }

      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
    } else if (character === "[") {
      depth += 1;
    } else if (character === "]") {
      depth -= 1;

      if (depth === 0) {
        return serviceWorkerSource.slice(manifestStart, index + 1);
      }
    }
  }

  throw new Error("could not locate the end of the precache manifest");
}

function extractPrecacheUrls(serviceWorkerSource) {
  const manifestSource = extractPrecacheManifestSource(serviceWorkerSource);

  return Array.from(
    manifestSource.matchAll(/\burl:\s*("(?:\\.|[^"\\])*")/g),
    (match) => JSON.parse(match[1]),
  );
}

const [audioFiles, serviceWorkerSource] = await Promise.all([
  listFiles(audioDirectory),
  readFile(serviceWorkerPath, "utf8"),
]);
const precacheUrls = extractPrecacheUrls(serviceWorkerSource);
const failures = [];

for (const filePath of audioFiles) {
  const url = toPublicUrl(filePath);
  const occurrences = precacheUrls.filter(
    (precacheUrl) => precacheUrl === url,
  ).length;

  if (filePath.endsWith(".ogg")) {
    if (occurrences !== 1) {
      failures.push(
        `${url} must occur exactly once in the generated worker; found ${occurrences}`,
      );
    }
  } else if (occurrences !== 0) {
    failures.push(
      `${url} must not be precached; found ${occurrences} occurrence(s)`,
    );
  }
}

if (!serviceWorkerSource.includes(WAV_AUDIO_RUNTIME_CACHE_NAME)) {
  failures.push(
    `generated worker is missing WAV runtime cache ${WAV_AUDIO_RUNTIME_CACHE_NAME}`,
  );
}

if (failures.length > 0) {
  throw new Error(
    `Service-worker audio cache verification failed:\n- ${failures.join("\n- ")}`,
  );
}

const oggCount = audioFiles.filter((filePath) =>
  filePath.endsWith(".ogg"),
).length;
console.log(
  `verified ${oggCount} precached Ogg assets, excluded ${audioFiles.length - oggCount} non-Ogg audio files, and retained WAV runtime caching`,
);
