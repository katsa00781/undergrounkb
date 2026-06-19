// Polar AccessLink edzés-szinkron: új edzések lekérése transaction-ön keresztül,
// majd mentés a cardio_sessions táblába (idempotens, polar_exercise_id ütközésre).
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient, getUserId } from '../_shared/auth.ts';

const API_BASE = 'https://www.polaraccesslink.com/v3';

// ISO 8601 időtartam (pl. "PT1H30M15S") -> másodperc
function parseIsoDuration(value: string | undefined | null): number | null {
  if (!value) return null;
  const m = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/);
  if (!m) return null;
  const [, h, min, s] = m;
  return (Number(h) || 0) * 3600 + (Number(min) || 0) * 60 + Math.round(Number(s) || 0);
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

    const service = getServiceClient();
    const { data: conn, error: connError } = await service
      .from('polar_connections')
      .select('polar_user_id, access_token')
      .eq('user_id', userId)
      .single();

    if (connError || !conn) {
      return jsonResponse({ error: 'Nincs összekötött Polar fiók.' }, 400);
    }

    const token = conn.access_token as string;
    const polarUserId = conn.polar_user_id as string;
    const authHeaders = {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 1) Transaction létrehozása
    const txRes = await fetch(
      `${API_BASE}/users/${polarUserId}/exercise-transactions`,
      { method: 'POST', headers: authHeaders },
    );

    if (txRes.status === 204) {
      await service
        .from('polar_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('user_id', userId);
      return jsonResponse({ imported: 0, message: 'Nincs új edzés.' });
    }

    if (!txRes.ok) {
      const detail = await txRes.text();
      console.error('Polar transaction create failed:', txRes.status, detail);
      return jsonResponse({ error: 'A Polar szinkron indítása sikertelen.' }, 502);
    }

    const tx = await txRes.json();
    const resourceUri: string = tx['resource-uri'];

    // 2) Új edzés URL-ek listája
    const listRes = await fetch(resourceUri, { headers: authHeaders });
    const list = await listRes.json();
    const exerciseUrls: string[] = list.exercises ?? [];

    let imported = 0;

    for (const url of exerciseUrls) {
      // 3) Edzés összegzés
      const exRes = await fetch(url, { headers: authHeaders });
      if (!exRes.ok) continue;
      const ex = await exRes.json();

      // 4) Pulzuszónák (best-effort)
      let hrZones: unknown = null;
      const zonesRes = await fetch(`${url}/heart-rate-zones`, { headers: authHeaders });
      if (zonesRes.ok) {
        const zonesData = await zonesRes.json();
        hrZones = zonesData.zone ?? zonesData;
      }

      const polarExerciseId = String(ex.id);
      const trainingLoad = ex['training-load'] ?? ex['cardio-load'] ?? null;

      const { error: upsertError } = await service
        .from('cardio_sessions')
        .upsert(
          {
            user_id: userId,
            polar_exercise_id: polarExerciseId,
            source: 'polar',
            start_time: ex['start-time'] ?? null,
            duration_seconds: parseIsoDuration(ex.duration),
            sport: ex.sport ?? ex['detailed-sport-info'] ?? null,
            calories: ex.calories ?? null,
            hr_avg: ex['heart-rate']?.average ?? null,
            hr_max: ex['heart-rate']?.maximum ?? null,
            training_load: trainingLoad,
            hr_zones: hrZones,
            raw: ex,
          },
          { onConflict: 'polar_exercise_id' },
        );

      if (upsertError) {
        console.error('cardio_sessions upsert error:', upsertError);
        continue;
      }
      imported += 1;
    }

    // 5) Transaction commit
    await fetch(resourceUri, { method: 'PUT', headers: authHeaders });

    await service
      .from('polar_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', userId);

    return jsonResponse({ imported });
  } catch (err) {
    console.error('polar-sync unexpected error:', err);
    return jsonResponse({ error: 'Váratlan hiba történt a szinkron során.' }, 500);
  }
});
