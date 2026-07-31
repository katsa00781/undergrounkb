import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { inflateSync } from 'node:zlib';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildFMSReportModel } from '@/lib/fmsReport/buildReportModel';
import { FMS_TEST_ORDER } from '@/lib/fmsReport/constants';
import { generateFMSReportPdf, type GeneratedReportPdf } from '@/lib/fmsReport/pdf';
import type { FMSAssessment } from '@/lib/fms';
import { makeFMSAssessment, makeFMSDraft, makeSidedFMSAssessment } from './fixtures';

/**
 * A PDF generálás böngészőre készült, de node alatt is lefuttatható, ha a
 * betűtípusokat lemezről szolgáljuk ki. Ez a smoke teszt a legtörékenyebb
 * dolgot őrzi: hogy a magyar `ő`/`ű` valóban beágyazott glyphként kerül a
 * PDF-be, és nem a jsPDF cp1252-es alapfontjával (ami ezeket nem ismeri).
 */
const originalFetch = globalThis.fetch;

let pdf: GeneratedReportPdf;
let raw: string;

const model = buildFMSReportModel({
  assessment: makeFMSAssessment({
    date: '2026-07-31',
    deep_squat: 1,
    shoulder_mobility: 2,
    trunk_stability_pushup: 0,
    total_score: undefined,
    notes: 'Erős törzs, de a bokamobilitás szűk. Növelni kell a guggolás mélységét.',
  }),
  clientName: 'Kovács Ödön',
  clientEmail: 'odon@example.com',
  trainerName: 'Edző Béla',
});

/** A ToUnicode CMap-ekben szereplő Unicode kódpontok kigyűjtése. */
function extractToUnicodeCodepoints(pdfBuffer: Buffer): Set<number> {
  const codepoints = new Set<number>();

  for (const match of pdfBuffer.toString('latin1').matchAll(/stream\r?\n/g)) {
    const start = match.index! + match[0].length;
    const end = pdfBuffer.indexOf('endstream', start);
    if (end < 0) continue;

    const chunk = pdfBuffer.subarray(start, end);
    let data: Buffer;
    try {
      data = inflateSync(chunk);
    } catch {
      data = chunk;
    }

    const text = data.toString('latin1');
    if (!text.includes('beginbfchar') && !text.includes('beginbfrange')) continue;

    for (const pair of text.matchAll(/<[0-9A-Fa-f]{4}>\s*<([0-9A-Fa-f]{4})>/g)) {
      codepoints.add(parseInt(pair[1], 16));
    }
  }

  return codepoints;
}

beforeAll(async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const fileName = input.toString().split('/').pop() ?? '';
    const buffer = await readFile(path.resolve(__dirname, '../../../public/fonts', fileName));

    return {
      ok: true,
      status: 200,
      arrayBuffer: async () =>
        buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    } as Response;
  }) as typeof fetch;

  pdf = await generateFMSReportPdf(model);
  raw = Buffer.from(pdf.base64, 'base64').toString('latin1');
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

describe('generateFMSReportPdf', () => {
  it('érvényes PDF-et állít elő', async () => {
    const head = new Uint8Array(await pdf.blob.arrayBuffer()).subarray(0, 5);

    expect(String.fromCharCode(...head)).toBe('%PDF-');
    expect(pdf.blob.type).toBe('application/pdf');
    expect(pdf.blob.size).toBeGreaterThan(1000);
  });

  it('beágyazza a Manrope-ot mindkét súlyban, Unicode kódolással', () => {
    // Két FontFile2 stream = a regular és a bold TTF is beágyazva. Ez bizonyítja,
    // hogy nem a jsPDF beépített (cp1252-es) alapfontját használjuk.
    expect(raw.match(/FontFile2/g)).toHaveLength(2);
    expect(raw).toContain('/BaseFont /Manrope');
    // Identity-H = Unicode-képes kódolás, nem WinAnsi.
    expect(raw).toContain('Identity-H');
    // ToUnicode CMap nélkül a PDF-ben nem lehetne keresni és másolni.
    expect(raw).toContain('ToUnicode');
  });

  it('a magyar ő/ű valódi beágyazott glyphként kerül a PDF-be', () => {
    // Ha az `ő` (U+0151) és az `ű` (U+0171) megjelenik a ToUnicode leképezésben,
    // a szöveg tényleg ezekkel a karakterekkel került be, nem helyettesítő jelként.
    const mapped = extractToUnicodeCodepoints(Buffer.from(pdf.base64, 'base64'));

    expect(mapped.has(0x0151)).toBe(true); // ő
    expect(mapped.has(0x0171)).toBe(true); // ű
    expect(mapped.has(0x00e9)).toBe(true); // é
    expect(mapped.has(0x00f3)).toBe(true); // ó
  });

  it('ASCII fájlnevet ad, ékezet nélkül', () => {
    expect(pdf.filename).toBe('fms-riport-kovacs-odon-2026-07-31.pdf');
    expect(pdf.filename).toMatch(/^[a-z0-9.-]+$/);
  });

  it('a riport mérete e-mail csatolmánynak alkalmas marad', () => {
    expect(pdf.blob.size).toBeLessThan(300 * 1024);
  });

  it('oldalankénti pontokkal és pozitív clearing teszttel is legenerálja', async () => {
    // Ez a modell futtatja a „Bal / Jobb" oszlopot, az aszimmetria-dobozt és a
    // fájdalom-figyelmeztetés clearing-sorát is.
    const sided = buildFMSReportModel({
      assessment: makeSidedFMSAssessment(
        makeFMSDraft({
          shoulder_mobility_left: 1,
          shoulder_mobility_right: 3,
          hurdle_step_left: 2,
          hurdle_step_right: 3,
          rs_clearing: true,
        }),
      ),
      clientName: 'Kovács Ödön',
      clientEmail: null,
      trainerName: 'Edző Béla',
    });

    expect(sided.asymmetricRows).toHaveLength(2);
    expect(sided.positiveClearingTests).toHaveLength(1);
    expect(sided.hasPainFlag).toBe(true);

    const sidedPdf = await generateFMSReportPdf(sided);
    const head = new Uint8Array(await sidedPdf.blob.arrayBuffer()).subarray(0, 5);

    expect(String.fromCharCode(...head)).toBe('%PDF-');
    expect(sidedPdf.blob.size).toBeLessThan(300 * 1024);
  });

  it('a legrosszabb esetet (mind a 7 minta bukott) is legenerálja, több oldalon', async () => {
    // 7 korrekciós kártya × 4 gyakorlat — ez a leghosszabb lehetséges riport,
    // itt kell működnie a kártyák oldaltörésének.
    const worstCase = buildFMSReportModel({
      assessment: makeFMSAssessment(
        Object.fromEntries(FMS_TEST_ORDER.map(testId => [testId, 1])) as Partial<FMSAssessment>,
      ),
      clientName: 'Teszt Elek',
      clientEmail: null,
      trainerName: null,
    });

    expect(worstCase.corrections).toHaveLength(FMS_TEST_ORDER.length);

    const worstCasePdf = await generateFMSReportPdf(worstCase);
    const worstCaseRaw = Buffer.from(worstCasePdf.base64, 'base64').toString('latin1');

    expect(worstCasePdf.blob.size).toBeGreaterThan(pdf.blob.size);
    expect(worstCasePdf.blob.size).toBeLessThan(300 * 1024);
    // Több oldal → a korrekciós kártyák nem csúsztak le a lap aljáról.
    expect((worstCaseRaw.match(/\/Type \/Page[^s]/g) ?? []).length).toBeGreaterThan(1);
  });
});
