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
      from: `${fromName} <${user}>`,
      to: `${options.toName} <${options.toEmail}>`,
      replyTo: user,
      subject: options.subject,
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
    // A denomailer a Gmail kapcsolatbontásánál dobhat vagy beragadhat;
    // a küldés sikerét ez már nem befolyásolja.
    await client.close().catch(() => {});
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
