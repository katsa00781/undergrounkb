# FMS riport e-mail küldés — beállítási útmutató

Ez a leírás végigvezet azon, hogyan élesítsd az FMS riport e-mailben küldését a
saját Gmail fiókodból. Két rész van: **A) Google oldal** (alkalmazásjelszó) és
**B) Supabase oldal** (secretek + függvény deploy). Együtt kb. 15 perc.

---

## Hogyan működik?

```text
Böngésző (admin)                    Supabase Edge Function            Gmail
─────────────────                   ──────────────────────            ─────
1. PDF generálás  ──── base64 ────► 2. Ki vagy? (JWT)
   (jsPDF, kliens)                     Admin vagy? (profiles.role)
                                       │
                                       └─ 3. SMTP 465 + TLS ────────► 4. Levél
                                          csatolmánnyal                  kimegy
```

**Miért nem a böngészőből megy közvetlenül?** Mert akkor a Gmail jelszavad
bekerülne a JavaScript bundle-be, ahol bárki kiolvashatná. Az Edge Function
szerver oldalon fut, a jelszó csak ott létezik.

**Miért nem EmailJS?** Az EmailJS (amit a meghívók használnak) csatolmányt csak
fizetős csomagon támogat, és kliens oldalról küld — erre a funkcióra nem jó.

---

## A) Google beállítás

Alkalmazásjelszó (*App Password*) kell: egy 16 karakteres, kizárólag ennek az
alkalmazásnak szóló jelszó. Nem jár le, külön visszavonható, és **nem** a fiókod
fő jelszava.

### A1. Kapcsold be a 2-lépcsős azonosítást

Alkalmazásjelszót **csak bekapcsolt 2FA mellett** lehet létrehozni — ha ez
kimarad, a következő lépésben nem fogod megtalálni a menüpontot.

1. Nyisd meg: <https://myaccount.google.com/security>
2. „Bejelentkezés a Google-fiókba" blokk → **2-lépcsős azonosítás**
3. Kövesd a varázslót (telefonszám vagy authenticator app)

### A2. Hozz létre alkalmazásjelszót

1. Nyisd meg közvetlenül: <https://myaccount.google.com/apppasswords>
   (a Google elrejtette a menüből — ez a link viszont működik)
2. Adj neki nevet, pl. `UG Kettlebell Pro riport`
3. Kattints a **Létrehozás** gombra

Kapsz egy ilyen jelszót: `abcd efgh ijkl mnop`

> **A szóközöket hagyd ki**, amikor beírod: `abcdefghijklmnop`
>
> A jelszó **csak egyszer** jelenik meg. Ha bezárod az ablakot, nem tudod
> visszanézni — újat kell generálni (a régit közben töröld).

### A3. Ha nem éred el az alkalmazásjelszavakat

| Amit látsz | Miért | Mit tegyél |
|------------|-------|------------|
| „Ez a beállítás nem érhető el a fiókodhoz" | Nincs bekapcsolva a 2FA | Vissza az A1-hez |
| Üres oldal / átirányítás Workspace fióknál | Az adminisztrátor letiltotta | Kérd az admint, hogy engedélyezze, vagy válts Resendre (lásd lentebb) |
| Csak biztonsági kulccsal (passkey) lépsz be | A Google ilyenkor néha korlátozza | Adj hozzá egy második 2FA módot (pl. authenticator app) |

---

## B) Supabase beállítás

### B0. Előfeltételek

```bash
# Bejelentkezés (böngészőt nyit, hozzáférési tokent kér)
npx supabase login
```

A projekt referenciája: **`iipcpjczjjkwwifwzmut`**

Az alábbi parancsokban ezért mindenhol szerepel a `--project-ref`. Így nem kell
`supabase link`-elned, és nem kér adatbázis-jelszót.

### B1. Secretek beállítása

Válaszd a kettő közül az egyiket.

**1. lehetőség — parancssorból.**

> **Kacsacsőrt (`<`, `>`) soha ne gépelj be** — a shell ezeket fájl-átirányításnak
> értelmezi, és a parancs némán rossz dolgot csinál. Az alábbi minta ezért
> bekéri a jelszót, így nem is kerül a shell history-ba:

```bash
read -rs "?Gmail alkalmazásjelszó (16 karakter, szóköz nélkül): " GMAIL_APP_PASSWORD

npx supabase secrets set \
  --project-ref iipcpjczjjkwwifwzmut \
  EMAIL_TRANSPORT=smtp \
  GMAIL_USER=sajat.cimed@gmail.com \
  GMAIL_APP_PASSWORD="$GMAIL_APP_PASSWORD" \
  FMS_REPORT_FROM_NAME="UG Kettlebell Pro"

unset GMAIL_APP_PASSWORD
```

A `read -rs "?..."` zsh-szintaxis. Ha `bash`-ben vagy (a promptod `bash-3.2$`),
akkor `read -rs -p "Gmail alkalmazásjelszó: " GMAIL_APP_PASSWORD` a helyes forma.

**2. lehetőség — Dashboardról** (nem kerül a history-ba):

1. Nyisd meg: <https://supabase.com/dashboard/project/iipcpjczjjkwwifwzmut/settings/functions>
2. **Edge Function Secrets** → **Add new secret**
3. Vidd fel egyesével az alábbiakat

### A secretek jelentése

| Név | Kötelező | Érték / leírás |
|-----|----------|----------------|
| `EMAIL_TRANSPORT` | nem | `smtp` (ez az alapértelmezés) vagy `resend` |
| `GMAIL_USER` | igen | A küldő Gmail cím, pl. `edzo@gmail.com` |
| `GMAIL_APP_PASSWORD` | igen | Az A2-ben kapott 16 karakter, **szóközök nélkül** |
| `FMS_REPORT_FROM_NAME` | nem | A feladó megjelenített neve (alapértelmezés: `UG Kettlebell Pro`). **Csak ASCII** — ékezetes név elrontja a fejlécet, lásd a hibaelhárítást |
| `SMTP_HOST` | nem | Más szolgáltatóhoz; alapértelmezés `smtp.gmail.com` |
| `SMTP_PORT` | nem | Alapértelmezés `465` — **ne írd át 587-re**, lásd a korlátokat |

A `SUPABASE_URL`, `SUPABASE_ANON_KEY` és `SUPABASE_SERVICE_ROLE_KEY` értékeket a
Supabase automatikusan beinjektálja. **Ezeket ne állítsd be kézzel.**

### B2. Ellenőrizd, hogy megvannak-e

```bash
npx supabase secrets list --project-ref iipcpjczjjkwwifwzmut
```

Az értékek helyett hash-t látsz — ez normális. Csak azt ellenőrizd, hogy mind a
négy név szerepel a listában.

### B3. A függvény deployolása

```bash
npx supabase functions deploy send-fms-report \
  --project-ref iipcpjczjjkwwifwzmut
```

Ha Docker-hibát kapsz (nem fut a Docker Desktop), kerüld meg:

```bash
npx supabase functions deploy send-fms-report \
  --project-ref iipcpjczjjkwwifwzmut \
  --use-api
```

Sikeres deploy után a függvény itt látszik:
<https://supabase.com/dashboard/project/iipcpjczjjkwwifwzmut/functions>

> **A JWT-ellenőrzést hagyd bekapcsolva.** A `config.toml`-ban nincs
> `[functions.send-fms-report]` blokk, így a `verify_jwt` alapból `true` — az app
> a bejelentkezett munkamenet tokenjével hív, tehát ez így helyes. A függvény
> ezen felül még azt is ellenőrzi, hogy a hívó `admin`-e a `profiles` táblában.

---

## C) Végponttól végpontig teszt

1. Indítsd az appot (`npm run dev`), és jelentkezz be **adminként**.
2. Bal oldali menü → **FMS Eredmények**.
3. Válassz egy felmért személyt.
4. Előbb a **PDF letöltése** gombbal nézd meg a riportot — ha ez működik, a
   generálás rendben (ez még nem érinti az e-mailt).
5. **Küldés e-mailben** → a címzett mezőbe **először a saját címedet** írd.
6. Küldés. Sikernél zöld visszajelzést kapsz: „A riport elküldve."

Amit a megérkezett levélben nézz meg:

- A csatolmány megnyílik és olvasható (`fms-riport-<nev>-<datum>.pdf`)
- Az ékezetek jók a tárgyban és a szövegben is (`ő`, `ű`, `á`)
- A feladó a te Gmail címed
- A **Válasz** gomb a te címedre válaszol

---

## Hibaelhárítás

Először mindig a naplót nézd. **Nem a CLI-vel**: a `supabase functions logs`
alparancs a telepített v2.24.3-ban még nem létezik, és a request-log amúgy sem
tartalmazza a `console.error` üzeneteket — csak a státuszkódot. A stack trace a
Dashboard **Logs** fülén van:

<https://supabase.com/dashboard/project/iipcpjczjjkwwifwzmut/functions/send-fms-report/logs>

Parancssorból a Management API adja ugyanezt (a `function_logs` tábla a
console-kimenet, a `function_edge_logs` a kérések):

```bash
SBT=$(security find-generic-password -s "Supabase CLI" -a access-token -w \
  | sed 's/^go-keyring-base64://' | base64 -d)

curl -s -G "https://api.supabase.com/v1/projects/iipcpjczjjkwwifwzmut/analytics/endpoints/logs.all" \
  --data-urlencode "sql=select t.timestamp, t.event_message, m.level from function_logs t cross join unnest(t.metadata) as m order by t.timestamp desc limit 50" \
  --data-urlencode "iso_timestamp_start=$(date -u -v-3H +%Y-%m-%dT%H:%M:%SZ)" \
  -H "Authorization: Bearer $SBT"
```

| Hibaüzenet az appban | Ok | Megoldás |
|----------------------|-----|----------|
| `Nincs érvényes munkamenet.` | Lejárt a bejelentkezés | Jelentkezz be újra |
| `Nincs jogosultságod riportot küldeni.` | A `profiles.role` nem `admin` | Ellenőrizd a szerepkörödet a Felhasználók oldalon |
| `Érvénytelen címzett e-mail cím.` | Elgépelt cím | Javítsd a mezőben |
| `A PDF csatolmány túl nagy.` | >5 MB (nagyon valószínűtlen) | Nézd meg, nem sérült-e a generálás |
| `Az e-mail küldése sikertelen.` | SMTP hiba — a részlet a naplóban van | Lásd a következő táblázatot |

Amit a naplóban láthatsz:

| Napló részlet | Ok | Megoldás |
|---------------|-----|----------|
| `Hiányzó környezeti változó: GMAIL_USER` | Nincs beállítva a secret | Vissza a B1-hez, majd **deployolj újra** |
| `535 5.7.8 Username and Password not accepted` | Rossz alkalmazásjelszó, vagy a fiók fő jelszavát írtad be | Generálj újat (A2), szóközök nélkül másold |
| `534 5.7.9 Application-specific password required` | Sima jelszót adtál meg | Alkalmazásjelszó kell (A2) |
| Időtúllépés, nincs válasz | Rossz port (587) | `SMTP_PORT=465`, lásd a korlátokat |
| `Ismeretlen EMAIL_TRANSPORT érték` | Elgépelt transport név | `smtp` vagy `resend` |
| `TypeError: Cannot read properties of undefined (reading 'catch')` | A denomailer `close()`-a `undefined`-ot ad vissza, nem Promise-t — a `finally` ág emiatt a **sikeres** küldést is hibává írta felül | Javítva 2026-08-01-én (`try/catch` a `close()` körül). Ha visszatér: a levél valószínűleg **kiment**, nézd meg a postaládát |

### Ha csatolmány helyett a nyers forrást kapod

Tünet: a levél megérkezik, de a kliens nem csatolmányt mutat, hanem kiírja az egész
MIME-forrást szövegként (`--attachment100`, `Content-Type: ...`, hosszú base64 blokk).

**Ez nem a csatolmánnyal van baj** — a PDF rész végig szabályos. A `Subject` fejléc
romlik el, és idő előtt lezárja a fejléc-blokkot, amitől a `Content-Type:
multipart/mixed` is törzsszöveggé válik; a kliens így nem tudja, hogy csatolmányos
üzenetet kapott. Felismerhető arról, hogy a forrásban a `From:` előtti sor egy
**vezető szóköz nélküli folytatósor**.

Oka a denomailer `quotedPrintableEncodeInline`-ja:

```ts
if (hasNonAsciiCharacters(data) || data.startsWith("=?")) {
  return `=?utf-8?Q?${quotedPrintableEncode(data)}?=`;
}
return data;
```

A `quotedPrintableEncode` **törzs**-kódoló: 74 karakterenként `=\r\n` soft line
breaket szúr be. Törzsben helyes, fejlécben viszont vezető whitespace nélküli
sortörés — az RFC 5322 szerint a folytatósornak WSP-vel kell kezdődnie.

Javítva 2026-08-01-én (v6): a `mailer.ts` `encodeHeaderValue`-ja úgy építi a
fejléc-értéket, hogy a fenti `if` **egyik ága se** illeszkedjen, tehát a `return
data`-ra fusson — saját base64 („B") encoded-word, **egyetlen vezető szóközzel**
(így nincs nem-ASCII karakter, és nem `=?`-tel kezdődik). A címzettnél ezért nem
küldünk megjelenített nevet: ott a `parseSingleEmail` `name.trim()`-el, ami levágná
a védő szóközt. Ugyanezért a **`FMS_REPORT_FROM_NAME` legyen ASCII** (ékezet nélkül).

Ellenőrzés a forrásban: a `Subject:` értéke szóközzel kezdődik, `=?utf-8?B?...?=`
egységekből áll, egyikben sincs szóköz, és mind 75 karakter alatt van.

> **Fontos:** a secretek megváltoztatása után **deployold újra a függvényt**,
> különben a régi értékekkel fut tovább.

---

## Korlátok, amiket érdemes tudni

- **A Gmail felülírja a feladót.** Bármit is állítasz be, a `From` a hitelesített
  fiók lesz. Ezért a függvény a `Reply-To`-t is a `GMAIL_USER`-re állítja, hogy a
  válasz biztosan hozzád érkezzen.
- **Port 465, nem 587.** A Supabase Edge Functions kimenő SMTP-t csak a 465-ös
  porton enged, implicit TLS-sel. A 25 és az 587 blokkolt, tehát STARTTLS nem
  használható.
- **Napi limit.** Személyes Gmail kb. 500 címzett/nap, Google Workspace kb. 2000.
  Egy edzői gyakorlathoz ez bőven elég.
- **Csatolmány méret.** A Gmail 25 MB-ot enged; a függvény ennél szigorúbb és
  ~5 MB fölött elutasít. Egy FMS riport tipikusan **25–30 KB**.
- **Spam mappa.** Az első pár levél landolhat a spamben, mert egy „szokatlan"
  alkalmazás küldi a fiókod nevében. Jelöld be nem-spamként.

---

## Kulcscsere / visszavonás

Ha az alkalmazásjelszó kiszivárgott vagy leváltanád:

1. <https://myaccount.google.com/apppasswords> → a régi jelszó mellett **Törlés**
2. Generálj újat (A2)
3. Frissítsd a secretet, majd deployolj újra:

```bash
read -rs "?Új alkalmazásjelszó: " GMAIL_APP_PASSWORD
npx supabase secrets set --project-ref iipcpjczjjkwwifwzmut \
  GMAIL_APP_PASSWORD="$GMAIL_APP_PASSWORD"
unset GMAIL_APP_PASSWORD
npx supabase functions deploy send-fms-report --project-ref iipcpjczjjkwwifwzmut
```

A régi jelszó a törlés pillanatában érvénytelen lesz — a Google fiókod fő jelszava
és a többi alkalmazásjelszó változatlan marad.

---

## Váltás Resendre (ha a Gmail nem járható)

Például Google Workspace tiltás esetén. A transport kódmódosítás nélkül cserélhető:

```bash
npx supabase secrets set --project-ref iipcpjczjjkwwifwzmut \
  EMAIL_TRANSPORT=resend \
  RESEND_API_KEY=re_xxxxxxxx \
  RESEND_FROM="UG Kettlebell Pro <riport@sajat-domain.hu>"

npx supabase functions deploy send-fms-report --project-ref iipcpjczjjkwwifwzmut
```

A Resendnél a küldő domaint hitelesíteni kell (SPF és DKIM DNS rekordok) — ezért
ehhez saját domain kell, `@gmail.com` címmel nem működik.

---

## Kapcsolódó fájlok

- `supabase/functions/send-fms-report/index.ts` — jogosultság-ellenőrzés, validáció
- `supabase/functions/send-fms-report/mailer.ts` — SMTP / Resend transport
- `src/lib/fmsReportEmail.ts` — kliens oldali hívás és hibakezelés
- `src/components/fms/SendFMSReportDialog.tsx` — a küldés űrlap
