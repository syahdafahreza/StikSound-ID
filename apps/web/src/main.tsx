import React from "react";
import { createRoot } from "react-dom/client";
import type { ExportArtifact, LocaleCode } from "@stiksound/core";
import { WebMediaEngine } from "@stiksound/media-web";
import {
  StikSoundMinimalApp,
  type ShareOutcome,
  type ShellBridge,
  type UiLabels
} from "@stiksound/ui";
import "../../../packages/ui/src/styles.css";
import "./mobile.css";

/**
 * StikSound web / PWA shell, aimed at iPhone Safari ("Add to Home Screen").
 *
 * Differences from the Chrome extension shell:
 * - No MyInstants links: a plain web page cannot read myinstants.com (no CORS headers),
 *   and routing it through a proxy would break the "nothing leaves your device" promise.
 * - Output goes through the system share sheet (WhatsApp, Save Video, Save to Files)
 *   because iOS has no way to put a video file on the clipboard from a web page.
 * - No transparent WebM: Safari cannot encode VP9 with alpha.
 */

const isTouch = window.matchMedia?.("(pointer: coarse)").matches ?? false;

function toFile(artifact: ExportArtifact): File {
  return new File([artifact.bytes.slice().buffer], artifact.fileName, { type: artifact.mimeType });
}

function canShareFile(file: File): boolean {
  try {
    return typeof navigator.share === "function" && navigator.canShare?.({ files: [file] }) === true;
  } catch {
    return false;
  }
}

function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

async function shareFile(file: File): Promise<ShareOutcome | "unsupported"> {
  if (!canShareFile(file)) return "unsupported";
  try {
    await navigator.share({ files: [file] });
    return "shared";
  } catch (err) {
    const name = (err as DOMException | undefined)?.name;
    if (name === "AbortError") return "cancelled";
    // Safari only allows share() right after a tap. Encoding takes a few seconds,
    // so the first attempt can expire; the UI then asks for one more tap.
    if (name === "NotAllowedError") return "needs-tap";
    throw err;
  }
}

/** On phones, saving goes through the share sheet when it can (Save Video / Save to Files). */
async function saveFile(file: File): Promise<void> {
  if (isTouch) {
    const outcome = await shareFile(file);
    if (outcome === "shared" || outcome === "cancelled") return;
  }
  downloadFile(file);
}

const shell: ShellBridge = {
  async shareArtifact(artifact) {
    const file = toFile(artifact);
    const outcome = await shareFile(file);
    if (outcome === "unsupported") {
      downloadFile(file);
      return "shared";
    }
    return outcome;
  },
  async saveArtifact(artifact) {
    await saveFile(toFile(artifact));
  },
  async saveProjectZip(zipBytes, suggestedName) {
    await saveFile(new File([zipBytes.slice().buffer], suggestedName, { type: "application/zip" }));
  }
};

const webLabels: Record<LocaleCode, Partial<UiLabels>> = {
  es: {
    exportTooltip: "Crear el video y compartirlo",
    exportDisabledMissingAudio: "Agrega un audio (MP3, M4A, WAV)",
    audioPickBtn: "🎵 Elegir audio (MP3, M4A, WAV)",
    copyAgainBtn: "Compartir",
    downloadTooltip: "Guardar",
    downloadBtnLabel: "Guardar",
    downloadChooseFormat: "Elige qué guardar:",
    downloadFmtMp4: "Video MP4 (5s / 10s)",
    exportSuccessVideo: "Listo. Si no elegiste dónde guardarlo, búscalo en Archivos → Descargas.",
    aboutRights:
      "Versión web. Todo se procesa en tu teléfono; nada se sube a internet. Para usar un sonido de MyInstants, descárgalo primero desde Safari y luego elígelo con el botón de audio. El video dura como máximo 5 o 10 segundos, según el botón de la barra (por defecto, 10).",
    ...(isTouch
      ? {
          stickerDropTitle: "Toca para elegir tu sticker",
          stickerDropHint: "Foto, GIF o video corto desde Fotos o Archivos",
          hoverCropHint: "Arrastra para encuadrar"
        }
      : { stickerDropHint: "Arrastra o haz clic: PNG, GIF, WebP, JPG o video corto (MP4, MOV)" })
  },
  en: {
    exportTooltip: "Make the video and share it",
    exportDisabledMissingAudio: "Add a sound (MP3, M4A, WAV)",
    audioPickBtn: "🎵 Choose sound (MP3, M4A, WAV)",
    copyAgainBtn: "Share",
    downloadTooltip: "Save",
    downloadBtnLabel: "Save",
    downloadChooseFormat: "Choose what to save:",
    downloadFmtMp4: "MP4 video (5s / 10s)",
    exportSuccessVideo: "Done. If you didn't pick a place, look in Files → Downloads.",
    aboutRights:
      "Web version. Everything runs on your phone; nothing is uploaded. To use a MyInstants sound, download it in Safari first, then pick it with the sound button. The video is at most 5 or 10 seconds, chosen with the bar button (10 by default).",
    ...(isTouch
      ? {
          stickerDropTitle: "Tap to choose your sticker",
          stickerDropHint: "Photo, GIF or short video from Photos or Files",
          hoverCropHint: "Drag to frame"
        }
      : { stickerDropHint: "Drop or click: PNG, GIF, WebP, JPG or a short video (MP4, MOV)" })
  },
  id: {
    exportTooltip: "Buat video dan bagikan",
    exportDisabledMissingAudio: "Tambahkan suara (MP3, M4A, WAV)",
    audioPickBtn: "🎵 Pilih suara (MP3, M4A, WAV)",
    copyAgainBtn: "Bagikan",
    downloadTooltip: "Simpan",
    downloadBtnLabel: "Simpan",
    downloadChooseFormat: "Pilih yang ingin disimpan:",
    downloadFmtMp4: "Video MP4 (5d / 10d)",
    exportSuccessVideo: "Selesai. Jika Anda tidak memilih lokasi, cari di File → Unduhan.",
    aboutRights:
      "Versi web. Semuanya berjalan di ponsel Anda; tidak ada yang diunggah. Untuk menggunakan suara MyInstants, unduh di Safari terlebih dahulu, lalu pilih dengan tombol suara. Video berdurasi maksimal 5 atau 10 detik, dipilih melalui tombol di bilah (10 secara default).",
    ...(isTouch
      ? {
          stickerDropTitle: "Ketuk untuk memilih stiker Anda",
          stickerDropHint: "Foto, GIF, atau video pendek dari Foto atau File",
          hoverCropHint: "Seret untuk membingkai"
        }
      : { stickerDropHint: "Jatuhkan atau klik: PNG, GIF, WebP, JPG, atau video pendek (MP4, MOV)" })
  }
};

const navLang = navigator.language.toLowerCase();
const locale: LocaleCode = navLang.startsWith("es") ? "es" : navLang.startsWith("id") ? "id" : "en";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StikSoundMinimalApp
      engine={new WebMediaEngine()}
      providers={[]}
      shell={shell}
      initialLocale={locale}
      platform={{ transparentVideo: false, myInstantsUrl: false, videoStickers: true }}
      labelOverrides={webLabels}
    />
  </React.StrictMode>
);

if ("serviceWorker" in navigator && import.meta.env.PROD && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => undefined);
  });
}
