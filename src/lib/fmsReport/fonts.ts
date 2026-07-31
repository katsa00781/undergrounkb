/**
 * Manrope betöltése a PDF-hez.
 *
 * A jsPDF beépített fontjai (Helvetica, Times…) cp1252/WinAnsi kódolásúak, ami
 * NEM tartalmazza az `ő` (U+0151) és `ű` (U+0171) karaktereket — magyar szöveg
 * ezekkel olvashatatlan lenne. Ezért Unicode TTF-et ágyazunk be.
 *
 * A public/fonts/ alatti fájlok a Manrope variable fontból (google/fonts)
 * instance-olt, latin + latin-extended-A tartományra szűkített statikus
 * változatok. A jsPDF nem subsetel, a teljes TTF bekerül a PDF-be — ezért
 * fontos, hogy már a forrás is szűk legyen (~48 KB / súly).
 */

export interface ReportFonts {
  regular: string;
  bold: string;
}

export const REPORT_FONT_FAMILY = 'Manrope';

const FONT_FILES = {
  regular: 'Manrope-Regular.ttf',
  bold: 'Manrope-Bold.ttf',
} as const;

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  // Darabolva, mert a String.fromCharCode(...bytes) nagy tömbnél
  // "Maximum call stack size exceeded"-del elszáll.
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

async function fetchFontAsBase64(fileName: string): Promise<string> {
  const response = await fetch(`${import.meta.env.BASE_URL ?? '/'}fonts/${fileName}`);

  if (!response.ok) {
    throw new Error(`A(z) ${fileName} betűtípus betöltése sikertelen (HTTP ${response.status})`);
  }

  return arrayBufferToBase64(await response.arrayBuffer());
}

// Modulszintű memoizálás: a második PDF már nem tölt újra.
let fontsPromise: Promise<ReportFonts> | null = null;

export function loadReportFonts(): Promise<ReportFonts> {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      fetchFontAsBase64(FONT_FILES.regular),
      fetchFontAsBase64(FONT_FILES.bold),
    ])
      .then(([regular, bold]) => ({ regular, bold }))
      .catch(error => {
        // Sikertelen betöltésnél engedjük az újrapróbálkozást.
        fontsPromise = null;
        throw error;
      });
  }

  return fontsPromise;
}

/** A betöltött fontok regisztrálása egy jsPDF dokumentumba. */
export function registerReportFonts(
  doc: {
    addFileToVFS: (fileName: string, data: string) => void;
    addFont: (fileName: string, fontName: string, fontStyle: string) => void;
  },
  fonts: ReportFonts,
): void {
  doc.addFileToVFS(FONT_FILES.regular, fonts.regular);
  doc.addFont(FONT_FILES.regular, REPORT_FONT_FAMILY, 'normal');
  doc.addFileToVFS(FONT_FILES.bold, fonts.bold);
  doc.addFont(FONT_FILES.bold, REPORT_FONT_FAMILY, 'bold');
}
