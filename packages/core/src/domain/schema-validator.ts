import { StikSoundError } from "./errors";
import { LIMITS } from "./limits";
import type { ProjectManifest } from "./types";

const ASSET_PATH_PATTERN = /^assets\/[A-Za-z0-9._-]+$/;
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const ALLOWED_IMAGE_FORMATS = new Set(["png", "jpeg", "webp", "gif", "mp4", "mov", "webm"]);
const ALLOWED_AUDIO_FORMATS = new Set(["mp3", "wav", "ogg", "m4a", "aac"]);
const ALLOWED_PROFILES = new Set([
  "video-mp4",
  "video-webm-alpha",
  "sound-bundle",
  "standard-webp",
  "native-sound-sticker"
]);

export function assertSafeAssetPath(filePath: string): void {
  if (typeof filePath !== "string" || filePath.length === 0) {
    throw new StikSoundError("package-invalid", "Asset path is empty.");
  }
  if (filePath.includes("..") || filePath.includes("\\") || filePath.startsWith("/")) {
    throw new StikSoundError("package-invalid", `Unsafe asset path: ${filePath}`);
  }
  if (/^[A-Za-z]:/.test(filePath)) {
    throw new StikSoundError("package-invalid", `Drive letter in asset path: ${filePath}`);
  }
  if (!ASSET_PATH_PATTERN.test(filePath)) {
    throw new StikSoundError("package-invalid", `Asset path must match assets/<name>: ${filePath}`);
  }
}

export function assertSafeZipEntryPath(entryPath: string): void {
  if (typeof entryPath !== "string" || entryPath.length === 0) {
    throw new StikSoundError("package-invalid", "Empty zip entry path.");
  }
  if (entryPath.includes("\\") || entryPath.startsWith("/") || /^[A-Za-z]:/.test(entryPath)) {
    throw new StikSoundError("package-invalid", `Illegal zip entry path: ${entryPath}`);
  }
  const segments = entryPath.split("/");
  if (segments.some((s) => s === "" || s === "." || s === "..")) {
    throw new StikSoundError("package-invalid", `Path traversal in zip entry: ${entryPath}`);
  }
  if (entryPath === "manifest.json" || entryPath === "sticker.webp" || entryPath === "sound.ogg") return;
  if (segments.length === 2 && segments[0] === "assets" && ASSET_PATH_PATTERN.test(entryPath)) return;
  throw new StikSoundError("package-invalid", `Disallowed zip entry path: ${entryPath}`);
}

export function sanitizeExportName(projectName: string): string {
  const safe = projectName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[<>:"/\\|?*\x00-\x1f.]+/g, "")
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return safe.length > 0 ? safe : "stiksound";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertAllowedKeys(obj: Record<string, unknown>, allowed: readonly string[], label: string): void {
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) {
      throw new StikSoundError("package-invalid", `Unexpected property '${key}' in ${label}.`);
    }
  }
}

export function validateProjectManifest(raw: unknown): ProjectManifest {
  if (!isPlainObject(raw)) {
    throw new StikSoundError("package-invalid", "Manifest must be a JSON object.");
  }
  assertAllowedKeys(
    raw,
    ["schema_version", "project", "stickers", "audios", "associations", "active_association_id", "export", "bundle"],
    "root"
  );

  if (raw.schema_version !== "1.0") {
    throw new StikSoundError("package-invalid", `Unsupported schema_version: ${String(raw.schema_version)}`);
  }

  if (!isPlainObject(raw.project)) {
    throw new StikSoundError("package-invalid", "Missing project object.");
  }
  assertAllowedKeys(raw.project, ["id", "name", "created_at", "updated_at"], "project");
  if (typeof raw.project.id !== "string" || raw.project.id.length < 4 || raw.project.id.length > 64) {
    throw new StikSoundError("package-invalid", "Invalid project.id.");
  }
  if (typeof raw.project.name !== "string" || raw.project.name.length < 1 || raw.project.name.length > 80) {
    throw new StikSoundError("package-invalid", "Invalid project.name.");
  }
  if (typeof raw.project.created_at !== "string" || typeof raw.project.updated_at !== "string") {
    throw new StikSoundError("package-invalid", "Invalid project timestamps.");
  }

  if (!Array.isArray(raw.stickers) || raw.stickers.length > 30) {
    throw new StikSoundError("package-invalid", "Invalid stickers array.");
  }
  if (!Array.isArray(raw.audios) || raw.audios.length > 30) {
    throw new StikSoundError("package-invalid", "Invalid audios array.");
  }
  if (!Array.isArray(raw.associations) || raw.associations.length > 30) {
    throw new StikSoundError("package-invalid", "Invalid associations array.");
  }

  const stickerIds = new Set<string>();
  for (const s of raw.stickers) {
    if (!isPlainObject(s)) throw new StikSoundError("package-invalid", "Invalid sticker item.");
    assertAllowedKeys(
      s,
      ["id", "file", "source_name", "format", "width", "height", "has_alpha", "animated", "edit"],
      "sticker"
    );
    if (typeof s.id !== "string" || s.id.length < 4 || s.id.length > 64) {
      throw new StikSoundError("package-invalid", "Invalid sticker.id.");
    }
    assertSafeAssetPath(String(s.file));
    if (typeof s.source_name !== "string" || s.source_name.length > 255) {
      throw new StikSoundError("package-invalid", "Invalid sticker.source_name.");
    }
    if (typeof s.format !== "string" || !ALLOWED_IMAGE_FORMATS.has(s.format)) {
      throw new StikSoundError("package-invalid", `Unsupported sticker.format: ${String(s.format)}`);
    }
    if (
      typeof s.width !== "number" ||
      !Number.isInteger(s.width) ||
      s.width < 1 ||
      s.width > LIMITS.MAX_IMAGE_DIMENSION ||
      typeof s.height !== "number" ||
      !Number.isInteger(s.height) ||
      s.height < 1 ||
      s.height > LIMITS.MAX_IMAGE_DIMENSION
    ) {
      throw new StikSoundError("package-invalid", "Invalid sticker dimensions.");
    }
    if (typeof s.has_alpha !== "boolean" || typeof s.animated !== "boolean") {
      throw new StikSoundError("package-invalid", "Invalid sticker boolean flags.");
    }
    if (!isPlainObject(s.edit)) {
      throw new StikSoundError("package-invalid", "Missing sticker.edit.");
    }
    assertAllowedKeys(
      s.edit,
      ["fit", "offset_x", "offset_y", "scale", "stroke", "matte_color", "crop_x", "crop_y"],
      "stickerEdit"
    );
    if (s.edit.fit !== "contain") {
      throw new StikSoundError("package-invalid", "Invalid sticker.edit.fit.");
    }
    if (s.edit.matte_color !== undefined && (typeof s.edit.matte_color !== "string" || !HEX_COLOR_PATTERN.test(s.edit.matte_color))) {
      throw new StikSoundError("package-invalid", "Invalid sticker.edit.matte_color.");
    }
    if (s.edit.crop_x !== undefined && (typeof s.edit.crop_x !== "number" || s.edit.crop_x < 0 || s.edit.crop_x > 1)) {
      throw new StikSoundError("package-invalid", "Invalid sticker.edit.crop_x.");
    }
    if (s.edit.crop_y !== undefined && (typeof s.edit.crop_y !== "number" || s.edit.crop_y < 0 || s.edit.crop_y > 1)) {
      throw new StikSoundError("package-invalid", "Invalid sticker.edit.crop_y.");
    }
    stickerIds.add(s.id);
  }

  const audioIds = new Set<string>();
  for (const a of raw.audios) {
    if (!isPlainObject(a)) throw new StikSoundError("package-invalid", "Invalid audio item.");
    assertAllowedKeys(
      a,
      ["id", "file", "source_name", "format", "duration_ms", "sample_rate", "channels", "source"],
      "audio"
    );
    if (typeof a.id !== "string" || a.id.length < 4 || a.id.length > 64) {
      throw new StikSoundError("package-invalid", "Invalid audio.id.");
    }
    assertSafeAssetPath(String(a.file));
    if (typeof a.source_name !== "string" || a.source_name.length > 255) {
      throw new StikSoundError("package-invalid", "Invalid audio.source_name.");
    }
    if (typeof a.format !== "string" || !ALLOWED_AUDIO_FORMATS.has(a.format)) {
      throw new StikSoundError("package-invalid", `Unsupported audio.format: ${String(a.format)}`);
    }
    if (
      typeof a.duration_ms !== "number" ||
      !Number.isInteger(a.duration_ms) ||
      a.duration_ms < LIMITS.MIN_AUDIO_DURATION_MS ||
      a.duration_ms > LIMITS.MAX_AUDIO_DURATION_MS
    ) {
      throw new StikSoundError("package-invalid", "Invalid audio.duration_ms.");
    }
    if (
      typeof a.sample_rate !== "number" ||
      !Number.isInteger(a.sample_rate) ||
      a.sample_rate < 8000 ||
      a.sample_rate > 192000
    ) {
      throw new StikSoundError("package-invalid", "Invalid audio.sample_rate.");
    }
    if (typeof a.channels !== "number" || !Number.isInteger(a.channels) || a.channels < 1 || a.channels > 8) {
      throw new StikSoundError("package-invalid", "Invalid audio.channels.");
    }
    if (!isPlainObject(a.source)) {
      throw new StikSoundError("package-invalid", "Missing audio.source.");
    }
    assertAllowedKeys(a.source, ["type", "page_url", "media_url", "title"], "audioSource");
    if (a.source.type !== "local" && a.source.type !== "myinstants" && a.source.type !== "video-track") {
      throw new StikSoundError("package-invalid", "Invalid audio.source.type.");
    }
    if (a.source.type === "myinstants" && typeof a.source.media_url !== "string") {
      throw new StikSoundError("package-invalid", "MyInstants source requires media_url.");
    }
    audioIds.add(a.id);
  }

  for (const asc of raw.associations) {
    if (!isPlainObject(asc)) throw new StikSoundError("package-invalid", "Invalid association item.");
    assertAllowedKeys(
      asc,
      ["id", "sticker_id", "audio_id", "start_ms", "end_ms", "volume", "fade_in_ms", "fade_out_ms"],
      "association"
    );
    if (typeof asc.sticker_id !== "string" || !stickerIds.has(asc.sticker_id)) {
      throw new StikSoundError("package-invalid", "Association references missing sticker_id.");
    }
    if (typeof asc.audio_id !== "string" || !audioIds.has(asc.audio_id)) {
      throw new StikSoundError("package-invalid", "Association references missing audio_id.");
    }
    if (
      typeof asc.start_ms !== "number" ||
      !Number.isInteger(asc.start_ms) ||
      asc.start_ms < 0 ||
      typeof asc.end_ms !== "number" ||
      !Number.isInteger(asc.end_ms) ||
      asc.end_ms < 1 ||
      asc.end_ms <= asc.start_ms
    ) {
      throw new StikSoundError("package-invalid", "Invalid association trim range.");
    }
    if (typeof asc.volume !== "number" || asc.volume < 0 || asc.volume > 1) {
      throw new StikSoundError("package-invalid", "Invalid association volume.");
    }
  }

  if (!isPlainObject(raw.export)) {
    throw new StikSoundError("package-invalid", "Missing export object.");
  }
  assertAllowedKeys(raw.export, ["profile", "target"], "export");
  if (typeof raw.export.profile !== "string" || !ALLOWED_PROFILES.has(raw.export.profile)) {
    throw new StikSoundError("package-invalid", "Invalid export.profile.");
  }
  if (raw.export.target !== "whatsapp") {
    throw new StikSoundError("package-invalid", "Invalid export.target.");
  }

  if (raw.bundle !== undefined) {
    if (!isPlainObject(raw.bundle)) {
      throw new StikSoundError("package-invalid", "Invalid bundle block.");
    }
    if (raw.bundle.whatsapp_native !== false) {
      throw new StikSoundError("package-invalid", "bundle.whatsapp_native must be false.");
    }
  }

  return raw as unknown as ProjectManifest;
}
