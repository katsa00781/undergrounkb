# 📧 EmailJS beállítási útmutató

## 1. EmailJS fiók létrehozása

1. **Menj az EmailJS weboldalra**: https://www.emailjs.com/
2. **Regisztrálj** ingyenes fiókot
3. **Erősítsd meg** az email címedet

## 2. Email Service beállítása

1. **Dashboard → Email Services**
2. **Add New Service**
3. **Válaszd a Gmail/Outlook/Yahoo-t** (ami a tiedé)
4. **Kövesd az instrukciókat** a kapcsolódáshoz
5. **Jegyezd fel a Service ID-t**

## 3. Email Template létrehozása

1. **Dashboard → Email Templates**
2. **Create New Template**
3. **Template neve**: `template_invite`
4. **Template tartalma**:

```html
Szia {{to_name}}!

{{message}}

Kattints a linkre a regisztrációhoz:
{{invite_url}}

Üdvözlettel,
{{from_name}}
```

5. **Save Template**
6. **Jegyezd fel a Template ID-t**

## 4. Public Key beszerzése

1. **Dashboard → Account → General**
2. **Másolj ki a Public Key-t**

## 5. Konfiguráció frissítése

Írd át a `src/lib/emailService.ts` fájlban:

```typescript
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_xxxxxxx', // Itt a te service ID-d
  TEMPLATE_ID: 'template_xxxxxx', // Itt a te template ID-d  
  PUBLIC_KEY: 'xxxxxxxxxxxxxxx', // Itt a te public key-ed
};
```

## 6. Tesztelés

1. **Frissítsd a browser-t**
2. **Menj a `/users` oldalra**
3. **Küldj egy invite-ot**
4. **Ellenőrizd az email-t**

---

## Környezeti változók (.env)

Opcionálisan létrehozhatsz `.env` fájlt:

```bash
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxx  
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxx
```

Majd a kódban:

```typescript
const EMAILJS_CONFIG = {
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
};
```
