// FMS riport küldése PDF csatolmánnyal, az edző saját Gmail fiókjából.
// A PDF a böngészőben készül (src/lib/fmsReport/pdf.ts), ide base64-ként érkezik.
// Az SMTP jelszó CSAK itt, szerver oldalon szerepel.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient, getUserId } from '../_shared/auth.ts';
import { sendMailWithAttachment } from './mailer.ts';

// ~5 MB PDF base64-ként. A Gmail 25 MB-ot enged, de a riport néhány száz KB.
const MAX_PDF_BASE64_LENGTH = 7_000_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RequestBody {
  recipientEmail?: unknown;
  recipientName?: unknown;
  subject?: unknown;
  bodyText?: unknown;
  pdfBase64?: unknown;
  filename?: unknown;
}

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Csak ASCII fájlnév megy ki, hogy az SMTP header-kódolás ne rontsa el. */
function sanitizeFilename(value: string): string {
  const cleaned = value.replace(/[^A-Za-z0-9._-]/g, '-').replace(/-+/g, '-').slice(0, 120);
  return cleaned.toLowerCase().endsWith('.pdf') ? cleaned : `${cleaned || 'fms-riport'}.pdf`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const userId = await getUserId(req);
    if (!userId) {
      return jsonResponse({ error: 'Nincs érvényes munkamenet.' }, 401);
    }

    // Admin ellenőrzés: enélkül bármelyik bejelentkezett felhasználó
    // levélküldő relayként használhatná az edző Gmail fiókját.
    const service = getServiceClient();
    const { data: profile, error: profileError } = await service
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return jsonResponse({ error: 'Nincs jogosultságod riportot küldeni.' }, 403);
    }

    const body = (await req.json()) as RequestBody;

    const recipientEmail = asTrimmedString(body.recipientEmail);
    const recipientName = asTrimmedString(body.recipientName) || recipientEmail;
    const subject = asTrimmedString(body.subject);
    const bodyText = asTrimmedString(body.bodyText);
    const pdfBase64 = typeof body.pdfBase64 === 'string' ? body.pdfBase64 : '';
    const filename = sanitizeFilename(asTrimmedString(body.filename) || 'fms-riport.pdf');

    if (!EMAIL_PATTERN.test(recipientEmail)) {
      return jsonResponse({ error: 'Érvénytelen címzett e-mail cím.' }, 400);
    }
    if (!subject) {
      return jsonResponse({ error: 'Hiányzó tárgy.' }, 400);
    }
    if (!bodyText) {
      return jsonResponse({ error: 'Hiányzó levélszöveg.' }, 400);
    }
    if (!pdfBase64) {
      return jsonResponse({ error: 'Hiányzó PDF csatolmány.' }, 400);
    }
    if (pdfBase64.length > MAX_PDF_BASE64_LENGTH) {
      return jsonResponse({ error: 'A PDF csatolmány túl nagy.' }, 413);
    }

    await sendMailWithAttachment({
      toEmail: recipientEmail,
      toName: recipientName,
      subject,
      text: bodyText,
      attachment: {
        filename,
        contentBase64: pdfBase64,
        contentType: 'application/pdf',
      },
    });

    return jsonResponse({ ok: true });
  } catch (err) {
    console.error('send-fms-report error:', err);
    return jsonResponse({ error: 'Az e-mail küldése sikertelen.' }, 502);
  }
});
