// Polar AccessLink OAuth2 token-csere + user regisztráció.
// A frontend a /polar/callback oldalról hívja az authorization code-dal.
// A client_secret CSAK itt, szerver oldalon szerepel.
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient, getUserId } from '../_shared/auth.ts';

const POLAR_TOKEN_URL = 'https://polarremote.com/v2/oauth2/token';
const POLAR_USERS_URL = 'https://www.polaraccesslink.com/v3/users';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const userId = await getUserId(req);
    if (!userId) {
      return jsonResponse({ error: 'Nincs érvényes munkamenet.' }, 401);
    }

    const { code } = await req.json();
    if (!code) {
      return jsonResponse({ error: 'Hiányzó authorization code.' }, 400);
    }

    const clientId = Deno.env.get('POLAR_CLIENT_ID')!;
    const clientSecret = Deno.env.get('POLAR_CLIENT_SECRET')!;
    const redirectUri = Deno.env.get('POLAR_REDIRECT_URI')!;
    const basic = btoa(`${clientId}:${clientSecret}`);

    // 1) Authorization code -> access token
    const tokenRes = await fetch(POLAR_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json;charset=UTF-8',
        Authorization: `Basic ${basic}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const detail = await tokenRes.text();
      console.error('Polar token exchange failed:', tokenRes.status, detail);
      return jsonResponse({ error: 'A Polar token-csere sikertelen.' }, 502);
    }

    const tokenData = await tokenRes.json();
    const accessToken: string = tokenData.access_token;
    const polarUserId: string = String(tokenData.x_user_id);

    // 2) Felhasználó regisztrálása az AccessLinkben (409 = már regisztrált, az is rendben)
    const registerRes = await fetch(POLAR_USERS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ 'member-id': userId }),
    });

    if (!registerRes.ok && registerRes.status !== 409) {
      const detail = await registerRes.text();
      console.error('Polar user registration failed:', registerRes.status, detail);
      return jsonResponse({ error: 'A Polar felhasználó regisztrációja sikertelen.' }, 502);
    }

    // 3) Token mentése (service-role, RLS megkerülésével)
    const service = getServiceClient();
    const { error: upsertError } = await service
      .from('polar_connections')
      .upsert(
        {
          user_id: userId,
          polar_user_id: polarUserId,
          access_token: accessToken,
          member_id: userId,
          connected_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

    if (upsertError) {
      console.error('polar_connections upsert error:', upsertError);
      return jsonResponse({ error: 'A kapcsolat mentése sikertelen.' }, 500);
    }

    return jsonResponse({ connected: true });
  } catch (err) {
    console.error('polar-oauth unexpected error:', err);
    return jsonResponse({ error: 'Váratlan hiba történt.' }, 500);
  }
});
