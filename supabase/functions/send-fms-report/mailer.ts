// E-mail küldés csatolmánnyal, cserélhető transporttal.
//
// Alapértelmezés: Gmail SMTP App Password-del. A Supabase Edge Functions a
// 465-ös porton enged kimenő SMTP-t implicit TLS-sel — a 25 és az 587 blokkolt,
// tehát STARTTLS-t NEM használhatunk.
//
// A transportot az EMAIL_TRANSPORT secret választja ki, hogy szolgáltatót
// kódmódosítás nélkül lehessen váltani.

import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

export interface MailAttachment {
  filename: string;
  /** Base64 tartalom, data URI prefix nélkül. */
  contentBase64: string;
  contentType: string;
}

export interface SendMailOptions {
  toEmail: string;
  toName: string;
  subject: string;
  text: string;
  attachment: MailAttachment;
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Hiányzó környezeti változó: ${name}`);
  }
  return value;
}

/** Egyetlen RFC 2047 encoded-word base64 ("B") kódolással. */
function toEncodedWord(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `=?utf-8?B?${btoa(binary)}?=`;
}

/**
 * Ékezetes fejléc-érték kódolása RFC 2047 szerint, a denomailer megkerülésével.
 *
 * MIÉRT KELL EZ — a denomailer `quotedPrintableEncodeInline`-ja:
 *
 *   if (hasNonAsciiCharacters(data) || data.startsWith("=?")) {
 *     return `=?utf-8?Q?${quotedPrintableEncode(data)}?=`;
 *   }
 *   return data;
 *
 * Itt a `quotedPrintableEncode` egy **törzs**-kódoló, amit fejlécre használnak:
 * minden 74 karakter után beszúr egy `=\r\n` soft line breaket. A törzsben ez
 * helyes, a fejlécben viszont vezető whitespace nélküli sortörés — az RFC 5322
 * szerint a folytatósornak WSP-vel kell kezdődnie, e nélkül a parser **lezárja a
 * fejléc-blokkot**. Következmény: a `Content-Type: multipart/mixed` már
 * törzsszöveg lett, a kliens nem látott csatolmányt, csak nyers forrást.
 * (Ráadásul a Q-kódolása a szóközt sem escape-eli, ami önmagában is érvénytelen
 * encoded-wordöt ad.)
 *
 * A KIÚT: a fenti `if` mindkét feltételét el kell kerülni, hogy a `return data`
 * ágra fussunk, és az érték érintetlenül kerüljön a fejlécbe. Ezért
 *   - saját base64 („B") encoded-wordöt építünk (tiszta ASCII → nincs nem-ASCII),
 *   - és **egyetlen vezető szóközzel** kezdjük, hogy a `startsWith("=?")` se
 *     illeszkedjen. A fejléc eleji whitespace szabályos és minden parser eldobja.
 *
 * Így nincs se dupla kódolás, se hajtogatás. A sor hosszabb lesz a javasolt
 * 78 karakternél, de bőven a kötelező 998-as korlát alatt marad.
 *
 * Biztonsági mellékhatás: a `CR`/`LF` a nem-ASCII mintára illeszkedik, tehát
 * base64-be kerül — fejléc-injektálásra (`\r\nBcc: ...`) ez az út lezárul.
 */
function encodeHeaderValue(value: string): string {
  if (!/[^\x20-\x7E]/.test(value)) {
    // Tiszta ASCII: a denomailer változatlanul átengedi — kivéve, ha `=?`-tel
    // kezdődne, mert azt szándékosan újracsomagolja. Ilyenkor is kell a szóköz.
    return value.startsWith('=?') ? ` ${value}` : value;
  }

  const encoder = new TextEncoder();
  // 45 bájt → 60 base64 karakter; a `=?utf-8?B??=` keret 12, összesen 72 < 75,
  // ami az RFC 2047 encoded-word hosszkorlátja.
  const MAX_CHUNK_BYTES = 45;

  const words: string[] = [];
  let chunk = '';

  // Kódpontonként lépkedünk, nem bájtonként: egy többbájtos karakter soha nem
  // törhet ketté két encoded-word között, mert mindegyiknek önmagában
  // dekódolhatónak kell lennie.
  for (const char of value) {
    if (encoder.encode(chunk + char).length > MAX_CHUNK_BYTES) {
      words.push(toEncodedWord(encoder.encode(chunk)));
      chunk = '';
    }
    chunk += char;
  }
  if (chunk) words.push(toEncodedWord(encoder.encode(chunk)));

  // A szomszédos encoded-wordök közti whitespace a dekódolásnál eltűnik.
  // A vezető szóköz kötelező: e nélkül a denomailer újracsomagolná (lásd fent).
  return ` ${words.join(' ')}`;
}

async function sendViaSmtp(options: SendMailOptions): Promise<void> {
  const user = requireEnv('GMAIL_USER');
  const password = requireEnv('GMAIL_APP_PASSWORD');
  const fromName = Deno.env.get('FMS_REPORT_FROM_NAME') ?? 'UG Kettlebell Pro';

  const client = new SMTPClient({
    connection: {
      hostname: Deno.env.get('SMTP_HOST') ?? 'smtp.gmail.com',
      port: Number(Deno.env.get('SMTP_PORT') ?? 465),
      // Implicit TLS. STARTTLS (587) nem működik Edge Functions-ből.
      tls: true,
      auth: { username: user, password },
    },
    // Serverless környezetben nincs értelme pool-nak: minden hívás új izolátum.
    pool: false,
  });

  try {
    await client.send({
      // A Gmail a From-ot úgyis a hitelesített fiókra írja át, ezért nem
      // próbálunk más feladót beállítani.
      // A feladó nevénél ASCII-t várunk (lásd FMS_REPORT_FROM_NAME a doc-ban):
      // a megjelenített név a `parseSingleEmail`-en megy át, ami `name.trim()`-el,
      // tehát a vezető szóközös trükk itt NEM működne.
      from: `${fromName} <${user}>`,
      // Ugyanezért a címzettnél nem küldünk megjelenített nevet — egy ékezetes
      // név itt megint elrontaná a fejlécet. A törzs amúgy is névvel szólít meg.
      to: options.toEmail,
      replyTo: user,
      subject: encodeHeaderValue(options.subject),
      content: options.text,
      attachments: [
        {
          filename: options.attachment.filename,
          encoding: 'base64',
          content: options.attachment.contentBase64,
          contentType: options.attachment.contentType,
        },
      ],
    });
  } finally {
    // A denomailer a Gmail kapcsolatbontásánál dobhat vagy beragadhat; a küldés
    // sikerét ez már nem befolyásolja, ezért minden hibát elnyelünk.
    //
    // FONTOS: a `close()` ebben a verzióban NEM Promise-t ad vissza, hanem
    // `undefined`-ot, ezért `.catch()`-et hívni rá `TypeError`-t dob — és mivel
    // ez a `finally` ágban van, a MÁR SIKERES küldést is hibává írta felül.
    // A `try/catch` + `await` mindhárom esetet lefedi (undefined, dobás, reject).
    try {
      await client.close();
    } catch {
      // szándékosan üres
    }
  }
}

async function sendViaResend(options: SendMailOptions): Promise<void> {
  const apiKey = requireEnv('RESEND_API_KEY');
  const from = requireEnv('RESEND_FROM');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [options.toEmail],
      subject: options.subject,
      text: options.text,
      attachments: [
        {
          filename: options.attachment.filename,
          content: options.attachment.contentBase64,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend hiba (${response.status}): ${await response.text()}`);
  }
}

export function sendMailWithAttachment(options: SendMailOptions): Promise<void> {
  const transport = (Deno.env.get('EMAIL_TRANSPORT') ?? 'smtp').toLowerCase();

  switch (transport) {
    case 'resend':
      return sendViaResend(options);
    case 'smtp':
      return sendViaSmtp(options);
    default:
      return Promise.reject(new Error(`Ismeretlen EMAIL_TRANSPORT érték: ${transport}`));
  }
}
