export type StikSoundErrorCode =
  | "unsupported-image"
  | "unsupported-video"
  | "unsupported-audio"
  | "unsupported-codec"
  | "encode-failed"
  | "file-too-large"
  | "url-rejected"
  | "remote-unavailable"
  | "trim-out-of-range"
  | "sticker-too-large"
  | "package-invalid"
  | "export-unsupported";

export type LocaleCode = "es" | "en" | "id";

export interface LocalizedErrorCopy {
  title: string;
  action: string;
}

export const ERROR_CATALOG: Record<StikSoundErrorCode, Record<LocaleCode, LocalizedErrorCopy>> = {
  "unsupported-image": {
    es: {
      title: "Este archivo no es una imagen compatible (usa PNG, WebP, JPG o GIF).",
      action: "Pega otra imagen con Ctrl+V/Cmd+V o arrastra un PNG o GIF."
    },
    en: {
      title: "This file is not a supported image (use PNG, WebP, JPG, or GIF).",
      action: "Paste another image or drop a PNG or GIF file."
    },
    id: {
      title: "File ini bukan gambar yang didukung (gunakan PNG, WebP, JPG, atau GIF).",
      action: "Tempel gambar lain atau jatuhkan file PNG atau GIF."
    }
  },
  "unsupported-audio": {
    es: {
      title: "No se pudo leer este audio o el formato no es compatible.",
      action: "Usa un archivo MP3, WAV, OGG, M4A o pega un enlace válido de MyInstants."
    },
    en: {
      title: "Could not decode this audio or the format is unsupported.",
      action: "Use an MP3, WAV, OGG, M4A file or paste a valid MyInstants link."
    },
    id: {
      title: "Tidak dapat mendekode audio ini atau formatnya tidak didukung.",
      action: "Gunakan file MP3, WAV, OGG, M4A atau tempel tautan MyInstants yang valid."
    }
  },
  "unsupported-codec": {
    es: {
      title: "Este navegador no puede codificar el video o audio con los códecs disponibles.",
      action: "Descarga el paquete .stiksound.zip y ábrelo en la app de escritorio StikSound."
    },
    en: {
      title: "This browser build cannot encode this clip with its available codecs.",
      action: "Download the .stiksound.zip package and open it in the StikSound desktop app."
    },
    id: {
      title: "Browser ini tidak dapat mengenkode klip dengan kodek yang tersedia.",
      action: "Unduh paket .stiksound.zip dan buka di aplikasi desktop StikSound."
    }
  },
  "encode-failed": {
    es: {
      title: "Ocurrió un error al generar el archivo final.",
      action: "Intenta cambiar el formato de salida en ⋯ o reintenta con otro archivo."
    },
    en: {
      title: "Failed while encoding the output file.",
      action: "Try switching the export format in ⋯ or retry with another input."
    },
    id: {
      title: "Gagal saat mengenkode file keluaran.",
      action: "Coba ubah format ekspor di ⋯ atau coba lagi dengan input lain."
    }
  },
  "unsupported-video": {
    es: {
      title: "Este video no se pudo abrir aquí.",
      action: "Prueba con un video MP4 o uno grabado con la cámara del teléfono."
    },
    en: {
      title: "This video could not be opened here.",
      action: "Try an MP4 video or one recorded with your phone camera."
    },
    id: {
      title: "Video ini tidak dapat dibuka di sini.",
      action: "Coba video MP4 atau video yang direkam dengan kamera ponsel Anda."
    }
  },
  "file-too-large": {
    es: {
      title: "El archivo supera el límite permitido (20 MB imagen / 100 MB o 60 s video / 25 MB o 3 min audio).",
      action: "Usa un archivo más liviano o recórtalo previamente."
    },
    en: {
      title: "File exceeds the allowed size or duration limit (20 MB image / 100 MB or 60 s video / 25 MB or 3 min audio).",
      action: "Use a smaller file or trim it externally first."
    },
    id: {
      title: "File melebihi batas ukuran atau durasi yang diizinkan (20 MB gambar / 100 MB atau 60 d video / 25 MB atau 3 mnt audio).",
      action: "Gunakan file yang lebih kecil atau potong terlebih dahulu."
    }
  },
  "url-rejected": {
    es: {
      title: "Enlace rechazado por seguridad: solo se permiten URLs HTTPS de MyInstants.",
      action: "Copia el enlace directo de myinstants.com e inténtalo de nuevo."
    },
    en: {
      title: "URL rejected by security policy: only HTTPS MyInstants links are allowed.",
      action: "Copy a valid myinstants.com link and try again."
    },
    id: {
      title: "URL ditolak oleh kebijakan keamanan: hanya tautan HTTPS MyInstants yang diizinkan.",
      action: "Salin tautan myinstants.com yang valid dan coba lagi."
    }
  },
  "remote-unavailable": {
    es: {
      title: "No se pudo obtener el sonido desde MyInstants.",
      action: "Verifica tu conexión o que el sonido siga disponible, o usa un audio local."
    },
    en: {
      title: "Could not retrieve the sound from MyInstants.",
      action: "Check your connection or that the sound still exists, or drop a local audio file."
    },
    id: {
      title: "Tidak dapat mengambil suara dari MyInstants.",
      action: "Periksa koneksi Anda atau pastikan suara masih tersedia, atau jatuhkan file audio lokal."
    }
  },
  "trim-out-of-range": {
    es: {
      title: "El fragmento seleccionado debe durar entre 0.1 s y el máximo elegido (5 s o 10 s).",
      action: "Ajusta la barra de tiempo para que la selección quepa en 5 o 10 segundos."
    },
    en: {
      title: "The selected audio range must be between 0.1 s and the selected maximum (5 s or 10 s).",
      action: "Adjust the timeline so the selection fits within 5 or 10 seconds."
    },
    id: {
      title: "Rentang audio yang dipilih harus antara 0.1 d dan maksimal yang dipilih (5 d atau 10 d).",
      action: "Sesuaikan linimasa agar pilihan muat dalam 5 atau 10 detik."
    }
  },
  "sticker-too-large": {
    es: {
      title: "El sticker WebP supera el límite de 100 KB requerido por WhatsApp.",
      action: "Exporta como video (5 s o 10 s) o usa una imagen más simple."
    },
    en: {
      title: "The WebP sticker could not fit under WhatsApp's 100 KB limit.",
      action: "Export as a 5s or 10s video or try a simpler image."
    },
    id: {
      title: "Stiker WebP tidak dapat muat di bawah batas 100 KB WhatsApp.",
      action: "Ekspor sebagai video 5d atau 10d atau coba gambar yang lebih sederhana."
    }
  },
  "package-invalid": {
    es: {
      title: "El paquete .stiksound.zip es inválido o contiene rutas inseguras.",
      action: "Verifica que sea un proyecto exportado por StikSound sin alteraciones."
    },
    en: {
      title: "The .stiksound.zip package is invalid or contains unsafe paths.",
      action: "Ensure this is an unmodified StikSound project package."
    },
    id: {
      title: "Paket .stiksound.zip tidak valid atau berisi jalur yang tidak aman.",
      action: "Pastikan ini adalah paket proyek StikSound yang tidak dimodifikasi."
    }
  },
  "export-unsupported": {
    es: {
      title: "La exportación nativa directa a WhatsApp aún no está disponible.",
      action: "El MP4 es un video, no un sticker: pegarlo o compartirlo en el chat lo envía como video. Solo en algunas cuentas de la beta de Android, no documentada de forma oficial, se puede probar Crear sticker eligiendo el video en la galería; la duración y el audio los decide WhatsApp."
    },
    en: {
      title: "Direct native WhatsApp sticker export is not supported yet.",
      action: "The MP4 is a video, not a sticker: pasting or sharing it in the chat sends it as a video. Only on some Android beta accounts, which are not officially documented, can you try Create sticker and pick the video from the gallery; WhatsApp decides the duration and audio."
    },
    id: {
      title: "Ekspor stiker WhatsApp asli secara langsung belum didukung.",
      action: "MP4 adalah video, bukan stiker: menempelkan atau membagikannya di obrolan akan mengirimkannya sebagai video. Hanya pada beberapa akun beta Android, yang tidak didokumentasikan secara resmi, Anda dapat mencoba Buat stiker dan memilih video dari galeri; WhatsApp yang menentukan durasi dan audionya."
    }
  }
};

export class StikSoundError extends Error {
  public readonly code: StikSoundErrorCode;
  public readonly detail?: string;

  constructor(code: StikSoundErrorCode, detail?: string) {
    super(detail ? `${code}: ${detail}` : code);
    this.name = "StikSoundError";
    this.code = code;
    this.detail = detail;
  }

  public getLocalized(locale: LocaleCode): LocalizedErrorCopy {
    return ERROR_CATALOG[this.code][locale];
  }
}

export function formatError(err: unknown, locale: LocaleCode): LocalizedErrorCopy & { code: StikSoundErrorCode } {
  if (err instanceof StikSoundError) {
    return { code: err.code, ...err.getLocalized(locale) };
  }
  return {
    code: "encode-failed",
    ...ERROR_CATALOG["encode-failed"][locale]
  };
}
