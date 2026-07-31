import { supabase } from '../config/supabase';
import type { FMSReportModel } from './fmsReport/types';

export interface SendFMSReportPayload {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyText: string;
  /** A PDF base64-ben, data URI prefix nélkül. */
  pdfBase64: string;
  filename: string;
}

/** 2026-07-31 → 2026. 07. 31. */
function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return year && month && day ? `${year}. ${month}. ${day}.` : isoDate;
}

/**
 * Az e-mail alapértelmezett tárgya és szövege. Tiszta függvény, hogy a dialógus
 * elő tudja tölteni vele az űrlapot (a felhasználó szabadon átírhatja).
 */
export function buildDefaultEmailContent(model: FMSReportModel): { subject: string; bodyText: string } {
  const date = formatDate(model.assessmentDate);
  const signature = model.trainerName ? `\n\n${model.trainerName}\nUG Kettlebell Pro` : '\n\nUG Kettlebell Pro';

  const correctionLine = model.corrections.length > 0
    ? `A riportban megtalálod a javasolt korrekciós fókuszokat is (${model.corrections.length} mozgásminta).`
    : 'A felmérés egyik mozgásmintájánál sem volt szükség korrekciós javaslatra.';

  // A fájdalom-jelzés nem maradhat csak a PDF-ben: a levélben is látszódnia
  // kell, mert orvosi kivizsgálásra vonatkozó javaslat.
  const painLine = model.hasPainFlag
    ? 'Fontos: a felmérés során legalább egy mozgásmintánál fájdalom jelentkezett, '
      + 'ezért orvosi kivizsgálás javasolt. A részleteket a riport elején találod.\n\n'
    : '';

  // Az értékelést indokló tételek (0/1 pontos minta, oldalkülönbség) nélkül a
  // levél a jó összpontszám alapján azt sugallná, hogy minden rendben van.
  const reasonBlock = model.risk.reasons.length > 0
    ? `Kiemelt megállapítások:\n${model.risk.reasons.map(reason => `- ${reason}`).join('\n')}\n\n`
    : '';

  return {
    subject: `FMS felmérés eredménye – ${model.clientName} (${date})`,
    bodyText:
      `Kedves ${model.clientName}!\n\n`
      + `Mellékelten küldöm a ${date} napon készült FMS (Functional Movement Screen) felmérésed részletes riportját.\n\n`
      + `Összpontszám: ${model.totalScore} / ${model.maxScore}\n`
      + `Értékelés: ${model.risk.label}\n`
      + `${model.risk.summary}\n\n`
      + reasonBlock
      + painLine
      + `${correctionLine}\n\n`
      + `Ha bármi kérdésed van az eredményekkel kapcsolatban, keress bátran.`
      + signature,
  };
}

/**
 * A Supabase functions.invoke non-2xx válasznál általános hibaüzenetet ad, a
 * választörzset pedig az `error.context` Response-ban hagyja. Innen szedjük ki
 * az Edge Function magyar hibaüzenetét.
 */
async function extractFunctionError(error: unknown): Promise<string | null> {
  const context = (error as { context?: unknown })?.context;

  if (context instanceof Response) {
    try {
      const parsed = await context.clone().json();
      if (parsed && typeof parsed.error === 'string') {
        return parsed.error;
      }
    } catch {
      // Nem JSON válasz — essünk vissza az általános üzenetre.
    }
  }

  return null;
}

export async function sendFMSReportEmail(payload: SendFMSReportPayload): Promise<void> {
  const { data, error } = await supabase.functions.invoke('send-fms-report', {
    body: payload,
  });

  if (error) {
    const detail = await extractFunctionError(error);
    throw new Error(detail ?? error.message ?? 'Az e-mail küldése sikertelen.');
  }

  if (data?.error) {
    throw new Error(data.error);
  }
}
