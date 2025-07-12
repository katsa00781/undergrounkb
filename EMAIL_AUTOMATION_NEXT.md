# 📧 EMAIL AUTOMATIZÁLÁS - KÖVETKEZŐ LÉPÉS

## Email Service Provider opciók:

### 1. **Supabase Edge Functions + SendGrid**
```typescript
// edge-function/send-invite.ts
import { createClient } from '@supabase/supabase-js'
import sgMail from '@sendgrid/mail'

export async function sendInviteEmail(email: string, inviteToken: string) {
  const msg = {
    to: email,
    from: 'noreply@yourdomain.com',
    subject: 'Meghívó a UG KettleBell Pro rendszerbe',
    html: `
      <h1>Meghívást kaptál!</h1>
      <p>Kattints a linkre a regisztrációhoz:</p>
      <a href="${process.env.SITE_URL}/invite/${inviteToken}">
        Regisztráció
      </a>
    `
  }
  
  await sgMail.send(msg)
}
```

### 2. **Resend.com integráció**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvite(email: string, token: string) {
  await resend.emails.send({
    from: 'noreply@yourdomain.com',
    to: email,
    subject: 'Meghívó',
    html: `<a href="https://yourdomain.com/invite/${token}">Regisztrálj itt</a>`
  });
}
```

### 3. **EmailJS (frontend megoldás)**
```typescript
import emailjs from 'emailjs-com';

export function sendInviteEmail(email: string, inviteUrl: string) {
  return emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
    to_email: email,
    invite_url: inviteUrl,
    from_name: 'UG KettleBell Pro'
  });
}
```

## 🔧 Implementáció:

1. **Válassz email service-t** (Resend ajánlott)
2. **API key beszerzése**
3. **Email template készítése**
4. **Frontend integrálás**

---

**Jelenleg a manual link küldés tökéletesen működik!** 📋
