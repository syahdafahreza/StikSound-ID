import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EXPORT_PROFILES,
  LIMITS,
  ProjectController,
  computeSquareCrop,
  createProject,
  formatError,
  isVideoFormat,
  resetProject,
  stickerMimeType,
  type ExportArtifact,
  type ExportProfileId,
  type LocaleCode,
  type MediaEngine,
  type ProjectWorkspaceState,
  type SoundProvider
} from "@stiksound/core";
import enLocale from "../locales/en.json";
import esLocale from "../locales/es.json";
import idLocale from "../locales/id.json";
import { TimelineTrimBar } from "./TimelineTrimBar";

export type ShareOutcome = "shared" | "cancelled" | "needs-tap";

export interface ShellBridge {
  saveArtifact(artifact: ExportArtifact): Promise<string | void>;
  copyArtifactToClipboard?(artifact: ExportArtifact): Promise<void>;
  /**
   * Mobile web: hand the video to the OS share sheet (WhatsApp, Save Video, Files).
   * Return "needs-tap" when the browser refused because the user gesture expired.
   */
  shareArtifact?(artifact: ExportArtifact): Promise<ShareOutcome>;
  saveProjectZip?(zipBytes: Uint8Array, suggestedName: string): Promise<void>;
  openProjectZip?(): Promise<Uint8Array | null>;
}

export interface PlatformOptions {
  /** Offer transparent WebM output. Mobile Safari cannot encode it. Default true. */
  transparentVideo?: boolean;
  /** Show the MyInstants URL field. Plain web pages are blocked by CORS. Default true. */
  myInstantsUrl?: boolean;
  /** Offer short video clips (MP4/MOV/WebM) in the sticker picker. Needs the web media engine. Default false. */
  videoStickers?: boolean;
}

const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif";
const VIDEO_ACCEPT = "video/mp4,video/quicktime,video/webm,.mp4,.mov,.m4v,.webm";

export type UiLabels = typeof esLocale;

export interface StikSoundMinimalAppProps {
  engine: MediaEngine;
  providers?: SoundProvider[];
  shell: ShellBridge;
  initialLocale?: LocaleCode;
  initialState?: ProjectWorkspaceState;
  platform?: PlatformOptions;
  labelOverrides?: Partial<Record<LocaleCode, Partial<UiLabels>>>;
}

const LOCALES: Record<LocaleCode, UiLabels> = { es: esLocale, en: enLocale, id: idLocale };

function audioMimeType(format: string): string {
  switch (format) {
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    case "ogg":
      return "audio/ogg";
    case "m4a":
      return "audio/mp4";
    case "aac":
      return "audio/aac";
    default:
      return "audio/mpeg";
  }
}

export const StikSoundMinimalApp: React.FC<StikSoundMinimalAppProps> = ({
  engine,
  providers = [],
  shell,
  initialLocale = "es",
  initialState,
  platform,
  labelOverrides
}) => {
  const allowTransparent = platform?.transparentVideo !== false;
  const allowMyInstantsUrl = platform?.myInstantsUrl !== false;
  const allowVideoStickers = platform?.videoStickers === true;
  const controller = useMemo(() => new ProjectController(engine, providers), [engine, providers]);
  const [locale, setLocale] = useState<LocaleCode>(initialLocale);
  const [project, setProject] = useState<ProjectWorkspaceState>(() => initialState ?? createProject());
  const [urlInput, setUrlInput] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [readyArtifact, setReadyArtifact] = useState<ExportArtifact | null>(null);
  const [maxDurationMs, setMaxDurationMs] = useState<5000 | 10000>(10_000);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stickerFileInputRef = useRef<HTMLInputElement>(null);
  const projectZipInputRef = useRef<HTMLInputElement>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const playbackTimerRef = useRef<number | null>(null);

  const copy: UiLabels = useMemo(
    () => ({ ...LOCALES[locale], ...labelOverrides?.[locale] }),
    [locale, labelOverrides]
  );
  const sticker = project.manifest.stickers[0];
  const audio = project.manifest.audios[0];
  const assoc = project.manifest.associations[0];
  const activeProfile = project.manifest.export.profile;
  const profileDef = EXPORT_PROFILES[activeProfile];
  const effectiveMaxAudioMs = profileDef.requiresAudio
    ? Math.min(maxDurationMs, profileDef.maxAudioMs)
    : maxDurationMs;
  const stickerIsVideo = Boolean(sticker) && isVideoFormat(sticker!.format);
  // Sound taken from the clip itself: the trim window also picks which part of the clip is used.
  const audioFromVideo = audio?.source.type === "video-track";
  const videoOffsetMs = stickerIsVideo && audioFromVideo ? assoc?.start_ms ?? 0 : 0;

  const stickerFile = sticker?.file;
  const stickerFormat = sticker?.format;
  const stickerPreviewUrl = useMemo(() => {
    if (!stickerFile || !stickerFormat) return null;
    const bytes = project.assets.get(stickerFile);
    if (!bytes || typeof URL.createObjectURL !== "function") return null;
    const blob = new Blob([bytes.slice().buffer], { type: stickerMimeType(stickerFormat) });
    return URL.createObjectURL(blob);
  }, [stickerFile, stickerFormat, project.assets]);

  // Keep the looping preview clip on the chosen 5 s window.
  useEffect(() => {
    const el = previewVideoRef.current;
    if (!el || !stickerIsVideo) return;
    const startSec = videoOffsetMs / 1000;
    const endSec = startSec + Math.max(0.1, ((assoc?.end_ms ?? 0) - (assoc?.start_ms ?? 0)) / 1000 || 5);
    const onTime = () => {
      if (el.currentTime < startSec - 0.05 || el.currentTime >= endSec) el.currentTime = startSec;
    };
    el.currentTime = startSec;
    el.addEventListener("timeupdate", onTime);
    return () => el.removeEventListener("timeupdate", onTime);
  }, [stickerIsVideo, videoOffsetMs, assoc?.start_ms, assoc?.end_ms, stickerPreviewUrl]);

  const readyVideoUrl = useMemo(() => {
    if (!readyArtifact || typeof URL.createObjectURL !== "function") return null;
    const blob = new Blob([readyArtifact.bytes.slice().buffer], { type: readyArtifact.mimeType });
    return URL.createObjectURL(blob);
  }, [readyArtifact]);

  useEffect(() => {
    return () => {
      if (stickerPreviewUrl && typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(stickerPreviewUrl);
      }
    };
  }, [stickerPreviewUrl]);

  useEffect(() => {
    return () => {
      if (readyVideoUrl && typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(readyVideoUrl);
      }
    };
  }, [readyVideoUrl]);

  const stopPlayback = useCallback(() => {
    if (playbackTimerRef.current !== null) {
      window.clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.src = "";
      audioElRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => stopPlayback, [stopPlayback]);

  const handleError = useCallback(
    (err: unknown) => {
      const localized = formatError(err, locale);
      setErrorMessage(`${localized.title} ${localized.action}`);
      setStatusMessage(null);
    },
    [locale]
  );

  const importStickerBytes = useCallback(
    async (bytes: Uint8Array, name: string) => {
      setIsBusy(true);
      setErrorMessage(null);
      setStatusMessage(null);
      setReadyArtifact(null);
      setDownloadMenuOpen(false);
      try {
        const next = await controller.importSticker(project, bytes, name, effectiveMaxAudioMs);
        setProject(next);
        const nextAudio = next.manifest.audios[0];
        const peaks = next.waveformPeaks;
        if (nextAudio?.source.type === "video-track" && peaks && peaks.maxs.every((v) => v === 0)) {
          setStatusMessage(copy.videoSilentToast);
        }
      } catch (err) {
        handleError(err);
      } finally {
        setIsBusy(false);
      }
    },
    [controller, project, effectiveMaxAudioMs, handleError, copy]
  );

  const importAudioBytes = useCallback(
    async (bytes: Uint8Array, name: string) => {
      stopPlayback();
      setIsBusy(true);
      setErrorMessage(null);
      setStatusMessage(null);
      setReadyArtifact(null);
      setDownloadMenuOpen(false);
      try {
        const next = await controller.importAudioFile(
          project,
          bytes,
          name,
          { type: "local" },
          effectiveMaxAudioMs
        );
        setProject(next);
      } catch (err) {
        handleError(err);
      } finally {
        setIsBusy(false);
      }
    },
    [controller, project, effectiveMaxAudioMs, handleError, stopPlayback]
  );

  const importMyInstantsUrl = useCallback(
    async (rawUrl: string) => {
      stopPlayback();
      setIsBusy(true);
      setErrorMessage(null);
      setStatusMessage(null);
      setReadyArtifact(null);
      setDownloadMenuOpen(false);
      try {
        const next = await controller.importAudioUrl(project, rawUrl, effectiveMaxAudioMs);
        setProject(next);
        setUrlInput("");
      } catch (err) {
        handleError(err);
      } finally {
        setIsBusy(false);
      }
    },
    [controller, project, effectiveMaxAudioMs, handleError, stopPlayback]
  );

  const handleGlobalPaste = useCallback(
    async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      const candidates: Array<{ file: File; rank: number }> = [];
      const rankImage = (mime: string, name: string): number => {
        const m = mime.toLowerCase();
        const n = name.toLowerCase();
        if (m === "image/gif" || n.endsWith(".gif")) return 3;
        if (m === "image/webp" || n.endsWith(".webp")) return 2;
        return 1;
      };

      const files = e.clipboardData?.files;
      if (files) {
        for (let i = 0; i < files.length; i++) {
          const f = files[i]!;
          if (f.type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(f.name)) {
            candidates.push({ file: f, rank: rankImage(f.type, f.name) });
          }
        }
      }

      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i]!;
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              candidates.push({ file, rank: rankImage(item.type || file.type, file.name) });
            }
          }
        }
      }

      if (candidates.length > 0) {
        candidates.sort((a, b) => b.rank - a.rank);
        const best = candidates[0]!.file;
        e.preventDefault();
        await importStickerBytes(new Uint8Array(await best.arrayBuffer()), best.name || "pasted.png");
        return;
      }
      const text = e.clipboardData?.getData("text/plain")?.trim();
      if (allowMyInstantsUrl && text && /^https?:\/\//i.test(text)) {
        e.preventDefault();
        setUrlInput(text);
        await importMyInstantsUrl(text);
      }
    },
    [importStickerBytes, importMyInstantsUrl, allowMyInstantsUrl]
  );

  useEffect(() => {
    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [handleGlobalPaste]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
      return;
    }
    if (!audio || !assoc) return;
    const bytes = project.assets.get(audio.file);
    if (!bytes || typeof Audio === "undefined" || typeof URL.createObjectURL !== "function") return;

    const blob = new Blob([bytes.slice().buffer], { type: audioMimeType(audio.format) });
    const url = URL.createObjectURL(blob);
    const el = new Audio(url);
    el.currentTime = assoc.start_ms / 1000;
    audioElRef.current = el;
    setIsPlaying(true);
    // Restart the (muted) preview clip so picture and sound line up.
    if (previewVideoRef.current) {
      previewVideoRef.current.currentTime = videoOffsetMs / 1000;
      previewVideoRef.current.play().catch(() => undefined);
    }

    const playDur = Math.max(100, assoc.end_ms - assoc.start_ms);
    playbackTimerRef.current = window.setTimeout(() => {
      URL.revokeObjectURL(url);
      stopPlayback();
    }, playDur);

    el.play().catch(() => {
      URL.revokeObjectURL(url);
      stopPlayback();
    });
  }, [isPlaying, stopPlayback, audio, assoc, project.assets, videoOffsetMs]);

  const handleResetAll = () => {
    stopPlayback();
    setProject((prev) => resetProject(prev));
    setReadyArtifact(null);
    setDownloadMenuOpen(false);
    setMenuOpen(false);
    setUrlInput("");
    setErrorMessage(null);
    setStatusMessage(null);
  };

  const trimValid =
    !profileDef.requiresAudio ||
    (assoc !== undefined &&
      assoc.end_ms - assoc.start_ms >= LIMITS.MIN_TRIM_DURATION_MS &&
      assoc.end_ms - assoc.start_ms <= effectiveMaxAudioMs);
  const canExport = Boolean(sticker) && (!profileDef.requiresAudio || Boolean(audio)) && trimValid && !isBusy;

  let exportDisabledReason = copy.exportTooltip;
  if (!sticker) exportDisabledReason = copy.exportDisabledMissingSticker;
  else if (profileDef.requiresAudio && !audio) exportDisabledReason = copy.exportDisabledMissingAudio;
  else if (!trimValid) {
    exportDisabledReason = copy.exportDisabledTrim.replace("10.0", (effectiveMaxAudioMs / 1000).toFixed(1));
  }

  const copyArtifactNow = async (artifact: ExportArtifact) => {
    if (shell.shareArtifact) {
      const outcome = await shell.shareArtifact(artifact);
      setStatusMessage(outcome === "needs-tap" ? copy.shareReadyToast : null);
      return;
    }
    if (shell.copyArtifactToClipboard) {
      await shell.copyArtifactToClipboard(artifact);
      setStatusMessage(copy.copiedReadyToast);
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
      try {
        const blob = new Blob([artifact.bytes.slice().buffer], { type: artifact.mimeType });
        await navigator.clipboard.write([new ClipboardItem({ [artifact.mimeType]: blob })]);
      } catch {
        // Fallback if browser restricts video MIME in ClipboardItem
      }
    }
    setStatusMessage(copy.copiedReadyToast);
  };

  // Arrow (➔): encodes the current video and copies it. Pasting it in a chat sends a video, not a sticker.
  const handlePreviewAndCopyArrow = async () => {
    if (!canExport) return;
    stopPlayback();
    setDownloadMenuOpen(false);
    setMenuOpen(false);
    setIsBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const compatibleProfile: ExportProfileId =
        activeProfile === "video-webm-alpha" && allowTransparent ? "video-webm-alpha" : "video-mp4";
      const artifact =
        readyArtifact ?? (await controller.exportProject(project, compatibleProfile, maxDurationMs));
      setReadyArtifact(artifact);
      await copyArtifactNow(artifact);
    } catch (err) {
      handleError(err);
    } finally {
      setIsBusy(false);
    }
  };

  // Download format selection (⬇): exports the chosen format & saves to disk
  const handleDownloadWithFormat = async (formatProfile: ExportProfileId) => {
    if (!sticker || isBusy) return;
    const def = EXPORT_PROFILES[formatProfile];
    if (def.requiresAudio && (!audio || !trimValid)) return;

    stopPlayback();
    setDownloadMenuOpen(false);
    setMenuOpen(false);
    setIsBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const artifact = await controller.exportProject(project, formatProfile, maxDurationMs);
      await shell.saveArtifact(artifact);
      setStatusMessage(
        artifact.profile === "sound-bundle"
          ? copy.exportSuccessBundle
          : artifact.profile === "standard-webp"
            ? copy.exportSuccessWebp
            : copy.exportSuccessVideo
      );
    } catch (err) {
      handleError(err);
    } finally {
      setIsBusy(false);
    }
  };

  const handleRangeChange = (startMs: number, endMs: number) => {
    setReadyArtifact(null);
    try {
      setProject((prev) =>
        controller.updateAudioEdit(prev, { start_ms: startMs, end_ms: endMs }, effectiveMaxAudioMs)
      );
      setErrorMessage(null);
    } catch (err) {
      handleError(err);
    }
  };

  const handleMaxDurationChange = (nextMax: 5000 | 10000) => {
    if (nextMax === maxDurationMs) return;
    stopPlayback();
    setReadyArtifact(null);
    setMaxDurationMs(nextMax);
    setErrorMessage(null);
    if (audio && assoc) {
      const selected = assoc.end_ms - assoc.start_ms;
      if (nextMax < selected) {
        const nextEnd = Math.min(audio.duration_ms, assoc.start_ms + nextMax);
        setProject((prev) =>
          controller.updateAudioEdit(prev, { start_ms: assoc.start_ms, end_ms: nextEnd }, nextMax)
        );
      } else if (nextMax === 10_000 && selected === 5_000 && audio.duration_ms > 5_000) {
        const targetWindow = Math.min(nextMax, audio.duration_ms);
        const nextStart = Math.max(0, Math.min(assoc.start_ms, audio.duration_ms - targetWindow));
        setProject((prev) =>
          controller.updateAudioEdit(
            prev,
            { start_ms: nextStart, end_ms: nextStart + targetWindow },
            nextMax
          )
        );
      }
    }
  };

  const selectTransparentMode = () => {
    setReadyArtifact(null);
    setProject((prev) => controller.setExportProfile(prev, "video-webm-alpha"));
  };

  const selectSolidMatte = (hex: string) => {
    setReadyArtifact(null);
    setProject((prev) => {
      const withProfile = controller.setExportProfile(prev, "video-mp4");
      return controller.updateStickerEdit(withProfile, { matte_color: hex });
    });
  };

  // Zero-click hover cropping when image is not already 1:1.
  // Pointer events cover the mouse (hover) and touch (finger drag, see .crop-enabled CSS).
  const canCrop = Boolean(sticker) && sticker!.width !== sticker!.height;
  const handleStagePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!sticker || sticker.width === sticker.height) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setReadyArtifact(null);
    setProject((prev) =>
      controller.updateStickerEdit(prev, {
        crop_x: Number(nx.toFixed(3)),
        crop_y: Number(ny.toFixed(3))
      })
    );
  };

  const isTransparentSelected = allowTransparent && activeProfile === "video-webm-alpha";
  const currentMatte = sticker?.edit.matte_color ?? LIMITS.DEFAULT_MATTE_COLOR;
  const cropX = sticker?.edit.crop_x ?? 0.5;
  const cropY = sticker?.edit.crop_y ?? 0.5;
  const squareMeta = sticker ? computeSquareCrop(sticker.width, sticker.height, cropX, cropY) : null;
  const stageBgStyle =
    sticker && !isTransparentSelected && (activeProfile === "video-mp4" || !sticker.has_alpha)
      ? { backgroundImage: "none", backgroundColor: currentMatte }
      : undefined;

  return (
    <div className="stik-shell" data-testid="stiksound-minimal-app">
      <header className="stik-top-corners">
        <button
          type="button"
          data-testid="reset-all-btn"
          className="stik-corner-btn stik-reset-btn"
          title={copy.resetTooltip}
          aria-label={copy.resetTooltip}
          onClick={handleResetAll}
        >
          ✕
        </button>

        <div className="stik-right-actions">
          <button
            type="button"
            data-testid="overflow-menu-btn"
            className="stik-corner-btn stik-menu-btn"
            aria-label="Menu"
            onClick={() => {
              setDownloadMenuOpen(false);
              setMenuOpen((o) => !o);
            }}
          >
            ⋯
          </button>

          <button
            type="button"
            data-testid="download-btn"
            className={`stik-corner-btn stik-download-btn ${sticker && !isBusy ? "ready" : "disabled"}`}
            disabled={!sticker || isBusy}
            title={sticker ? copy.downloadTooltip : exportDisabledReason}
            aria-label={copy.downloadTooltip}
            onClick={() => {
              setMenuOpen(false);
              setDownloadMenuOpen((o) => !o);
            }}
          >
            ⬇
          </button>

          <button
            type="button"
            data-testid="export-ok-btn"
            className={`stik-corner-btn stik-ok-btn ${canExport ? "ready" : "disabled"}`}
            disabled={!canExport}
            title={exportDisabledReason}
            aria-label={exportDisabledReason}
            onClick={handlePreviewAndCopyArrow}
          >
            {isBusy ? "…" : "➔"}
          </button>
        </div>
      </header>

      {downloadMenuOpen && sticker && (
        <div className="stik-popover" data-testid="download-format-picker">
          <div className="stik-popover-label">{copy.downloadChooseFormat}</div>
          <div className="stik-popover-actions">
            <button
              type="button"
              data-testid="download-fmt-video-mp4"
              disabled={!audio || !trimValid}
              onClick={() => handleDownloadWithFormat("video-mp4")}
            >
              {copy.downloadFmtMp4}
            </button>
            {allowTransparent && (
              <button
                type="button"
                data-testid="download-fmt-video-webm-alpha"
                disabled={!audio || !trimValid}
                onClick={() => handleDownloadWithFormat("video-webm-alpha")}
              >
                {copy.downloadFmtWebm}
              </button>
            )}
            <button
              type="button"
              data-testid="download-fmt-sound-bundle"
              disabled={!audio || !trimValid}
              onClick={() => handleDownloadWithFormat("sound-bundle")}
            >
              {copy.downloadFmtBundle}
            </button>
            <button
              type="button"
              data-testid="download-fmt-standard-webp"
              onClick={() => handleDownloadWithFormat("standard-webp")}
            >
              {copy.downloadFmtWebp}
            </button>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="stik-popover" data-testid="overflow-menu">
          <div className="stik-popover-actions">
            <button
              type="button"
              onClick={async () => {
                setMenuOpen(false);
                if (shell.openProjectZip) {
                  const zipBytes = await shell.openProjectZip();
                  if (zipBytes) {
                    setReadyArtifact(null);
                    const opened = await controller.openProject(zipBytes);
                    const openedAssoc = opened.manifest.associations[0];
                    if (openedAssoc && openedAssoc.end_ms - openedAssoc.start_ms > 5_000) {
                      setMaxDurationMs(10_000);
                    }
                    setProject(opened);
                  }
                } else {
                  projectZipInputRef.current?.click();
                }
              }}
            >
              {copy.menuOpenProject}
            </button>
            <button
              type="button"
              onClick={async () => {
                setMenuOpen(false);
                try {
                  const zipBytes = await controller.saveProject(project);
                  if (shell.saveProjectZip) {
                    await shell.saveProjectZip(zipBytes, `${project.manifest.project.name}.stiksound.zip`);
                  }
                } catch (err) {
                  handleError(err);
                }
              }}
            >
              {copy.menuSaveProject}
            </button>
            <button type="button" onClick={() => setLocale((l) => (l === "es" ? "en" : l === "en" ? "id" : "es"))}>
              {copy.menuLanguage}: {locale.toUpperCase()}
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setAboutOpen(true);
              }}
            >
              {copy.menuAbout}
            </button>
          </div>
        </div>
      )}

      <input
        ref={stickerFileInputRef}
        type="file"
        accept={allowVideoStickers ? `${IMAGE_ACCEPT},${VIDEO_ACCEPT}` : IMAGE_ACCEPT}
        style={{ display: "none" }}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) await importStickerBytes(new Uint8Array(await f.arrayBuffer()), f.name);
          e.target.value = "";
        }}
      />
      <input
        ref={projectZipInputRef}
        type="file"
        accept=".zip,.stiksound.zip"
        style={{ display: "none" }}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) {
            try {
              setReadyArtifact(null);
              setProject(await controller.openProject(new Uint8Array(await f.arrayBuffer())));
            } catch (err) {
              handleError(err);
            }
          }
          e.target.value = "";
        }}
      />

      {readyArtifact ? (
        <main className="stik-preview-ready-card" data-testid="video-preview-ready">
          {readyVideoUrl ? (
            <video
              src={readyVideoUrl}
              controls
              autoPlay
              loop
              playsInline
              className="stik-ready-video"
            />
          ) : (
            <div className="stik-sticker-fallback">{readyArtifact.fileName}</div>
          )}
          <div className="stik-ready-actions">
            <button
              type="button"
              data-testid="copy-again-btn"
              className="stik-pill-btn stik-pill-accent"
              onClick={() => copyArtifactNow(readyArtifact)}
            >
              {copy.copyAgainBtn}
            </button>
            <button
              type="button"
              data-testid="preview-download-btn"
              className="stik-pill-btn"
              onClick={() => setDownloadMenuOpen((o) => !o)}
            >
              ⬇ {copy.downloadBtnLabel}
            </button>
            <button
              type="button"
              data-testid="back-to-edit-btn"
              className="stik-pill-btn"
              onClick={() => setReadyArtifact(null)}
            >
              {copy.backToEditBtn}
            </button>
          </div>
        </main>
      ) : (
        <main
          data-testid="sticker-zone"
          className={`stik-sticker-stage ${sticker ? "has-sticker" : "empty"}${canCrop ? " crop-enabled" : ""}`}
          style={stageBgStyle}
          onPointerMove={handleStagePointerMove}
          onDragOver={(e) => e.preventDefault()}
          onDrop={async (e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (!f) return;
            if (f.type.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac)$/i.test(f.name)) {
              await importAudioBytes(new Uint8Array(await f.arrayBuffer()), f.name);
            } else {
              await importStickerBytes(new Uint8Array(await f.arrayBuffer()), f.name);
            }
          }}
          onClick={() => {
            if (!sticker) stickerFileInputRef.current?.click();
            else if (audio) togglePlay();
          }}
        >
          {!sticker ? (
            <div className="stik-empty-sticker">
              <div className="stik-plus-icon">+</div>
              <p className="stik-empty-title">{copy.stickerDropTitle}</p>
              <p className="stik-empty-hint">{copy.stickerDropHint}</p>
            </div>
          ) : (
            <div className="stik-preview-box">
              {stickerPreviewUrl && stickerIsVideo ? (
                <video
                  ref={(el) => {
                    previewVideoRef.current = el;
                    // React does not write the muted attribute; iOS needs it to autoplay inline.
                    if (el) {
                      el.muted = true;
                      el.defaultMuted = true;
                      el.setAttribute("muted", "");
                    }
                  }}
                  data-testid="sticker-preview-video"
                  src={stickerPreviewUrl}
                  className="stik-sticker-img"
                  muted
                  autoPlay
                  loop
                  playsInline
                  aria-label={sticker.source_name}
                  style={{
                    objectFit: "cover",
                    objectPosition: `${Math.round(cropX * 100)}% ${Math.round(cropY * 100)}%`
                  }}
                />
              ) : stickerPreviewUrl ? (
                <img
                  src={stickerPreviewUrl}
                  alt={sticker.source_name}
                  className="stik-sticker-img"
                  style={{
                    objectFit: "cover",
                    objectPosition: `${Math.round(cropX * 100)}% ${Math.round(cropY * 100)}%`
                  }}
                />
              ) : (
                <div data-testid="sticker-loaded-badge" className="stik-sticker-fallback">
                  {sticker.source_name}
                </div>
              )}
              {squareMeta && (
                <span data-testid="resolution-pill" className="stik-res-badge">
                  1:1 · {squareMeta.outputSize}×{squareMeta.outputSize}
                  {sticker.width !== sticker.height ? ` · ${copy.hoverCropHint}` : ""}
                </span>
              )}
              {audio && (
                <span className="stik-speaker-badge" aria-label="Audio attached">
                  🔊
                </span>
              )}
            </div>
          )}
        </main>
      )}

      {!readyArtifact && sticker && sticker.has_alpha && (
        <div className="stik-transparency-bar" data-testid="transparency-picker">
          <span className="stik-trans-label">{copy.transparencyLabel}</span>
          {allowTransparent && (
            <button
              type="button"
              data-testid="matte-transparent-btn"
              className={`stik-trans-chip ${isTransparentSelected ? "active" : ""}`}
              onClick={selectTransparentMode}
            >
              {copy.modeTransparent}
            </button>
          )}
          <button
            type="button"
            data-testid="matte-white-btn"
            className={`stik-trans-chip ${!isTransparentSelected && currentMatte === "#FFFFFF" ? "active" : ""}`}
            onClick={() => selectSolidMatte("#FFFFFF")}
          >
            {copy.modeWhite}
          </button>
          <button
            type="button"
            data-testid="matte-black-btn"
            className={`stik-trans-chip ${!isTransparentSelected && currentMatte === "#000000" ? "active" : ""}`}
            onClick={() => selectSolidMatte("#000000")}
          >
            {copy.modeBlack}
          </button>
          <label className="stik-color-chip" title={copy.modeCustom}>
            <input
              type="color"
              data-testid="matte-custom-input"
              value={currentMatte}
              onChange={(e) => selectSolidMatte(e.target.value.toUpperCase())}
            />
          </label>
        </div>
      )}

      {(errorMessage || statusMessage) && (
        <div
          data-testid={errorMessage ? "error-banner" : "status-banner"}
          className={`stik-toast ${errorMessage ? "error" : "success"}`}
        >
          {errorMessage ?? statusMessage}
        </div>
      )}

      <TimelineTrimBar
        hasAudio={Boolean(audio)}
        durationMs={audio?.duration_ms ?? 0}
        startMs={assoc?.start_ms ?? 0}
        endMs={assoc?.end_ms ?? 0}
        maxWindowMs={effectiveMaxAudioMs}
        peaks={project.waveformPeaks}
        isPlaying={isPlaying}
        isBusy={isBusy}
        showUrlInput={allowMyInstantsUrl}
        urlInput={urlInput}
        onUrlInputChange={setUrlInput}
        onSubmitUrl={importMyInstantsUrl}
        onSelectAudioFile={async (f) => importAudioBytes(new Uint8Array(await f.arrayBuffer()), f.name)}
        onChangeRange={handleRangeChange}
        onChangeMaxWindowMs={handleMaxDurationChange}
        onTogglePlay={togglePlay}
        labels={{
          placeholder: copy.audioInputPlaceholder,
          pickBtn: copy.audioPickBtn,
          play: copy.playPreview,
          stop: copy.stopPreview,
          maxDurationAria: copy.maxDurationAria
        }}
      />

      {aboutOpen && (
        <div className="stik-modal-backdrop" onClick={() => setAboutOpen(false)}>
          <div className="stik-modal" onClick={(e) => e.stopPropagation()}>
            <h3>StikSound v1.0</h3>
            <p>{copy.aboutRights}</p>
            <button type="button" onClick={() => setAboutOpen(false)}>
              {copy.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
