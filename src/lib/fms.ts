import { supabase } from '../config/supabase';
import { notifyDataChanged } from '../utils/dataRefresh';

export interface FMSAssessment {
  id: string;
  user_id: string;
  /** A felmérés napja (DATE oszlop, DB default CURRENT_DATE). */
  date: string;
  /**
   * A 7 **beszámított** pontszám. Az oldalanként mért teszteknél ez a gyengébb
   * oldal pontja, pozitív clearing teszt esetén pedig 0 — a levezetést a
   * `lib/fmsScoring.ts` végzi. A `total_score` generált oszlop ezekre épül.
   */
  deep_squat: number;
  hurdle_step: number;
  inline_lunge: number;
  shoulder_mobility: number;
  active_straight_leg_raise: number;
  trunk_stability_pushup: number;
  rotary_stability: number;
  /**
   * Nyers oldalankénti pontok. A 2026-08-01 előtti felméréseknél `null`:
   * a beszámított pontból nem következik visszamenőleg, melyik oldal volt a
   * gyengébb, ezért nem találjuk ki.
   */
  hurdle_step_left?: number | null;
  hurdle_step_right?: number | null;
  inline_lunge_left?: number | null;
  inline_lunge_right?: number | null;
  shoulder_mobility_left?: number | null;
  shoulder_mobility_right?: number | null;
  active_straight_leg_raise_left?: number | null;
  active_straight_leg_raise_right?: number | null;
  rotary_stability_left?: number | null;
  rotary_stability_right?: number | null;
  /** Clearing (fájdalom-provokációs) tesztek: true = fájdalom. */
  sm_clearing?: boolean;
  tspu_clearing?: boolean;
  rs_clearing?: boolean;
  /** A DB generált oszlopa (a 7 pontszám összege). */
  total_score?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FMSAssessmentSubject {
  userId: string;
  displayName: string;
  fullName: string | null;
  email: string | null;
  latestAssessmentDate: string | null;
  latestAssessmentCreatedAt: string | null;
  latestTotalScore: number | null;
  /**
   * A legutóbbi felmérés teljes sora. A lista kártyáján az értékelés nem
   * származtatható az összpontszámból (egy 1 pontos vagy aszimmetrikus minta 18
   * pont mellett is korrekciót indokol), ezért a nyers pontszámok is kellenek.
   */
  latestAssessment: FMSAssessment | null;
}

/** A `date` és a `total_score` a DB-ből jön (default, illetve generált oszlop). */
export type FMSAssessmentInput =
  Omit<FMSAssessment, 'id' | 'created_at' | 'updated_at' | 'total_score' | 'date'> & { date?: string };

export async function createFMSAssessment(assessment: FMSAssessmentInput) {

  try {
    // Create a copy of the assessment object for the database operation
    const assessmentToInsert = { ...assessment };

    const { data, error } = await supabase
      .from('fms_assessments')
      .insert(assessmentToInsert)
      .select()
      .single();

    if (error) {
      console.error('Error inserting FMS assessment:', error);
      throw error;
    }

    notifyDataChanged('fms');
    return data as FMSAssessment;
  } catch (error) {
    console.error('Exception in createFMSAssessment:', error);
    throw error;
  }
}

export async function getLatestFMSAssessment(userId: string) {
  try {

    const { data, error } = await supabase
      .from('fms_assessments')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching latest FMS assessment:', error);
      throw error;
    }

    return data as FMSAssessment | null;
  } catch (error) {
    console.error('Exception in getLatestFMSAssessment:', error);
    throw error;
  }
}

export async function getFMSAssessmentById(id: string) {
  try {
    const { data, error } = await supabase
      .from('fms_assessments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching FMS assessment by id:', error);
      throw error;
    }

    return data as FMSAssessment | null;
  } catch (error) {
    console.error('Exception in getFMSAssessmentById:', error);
    throw error;
  }
}

export async function getFMSAssessments(userId: string) {
  try {

    const { data, error } = await supabase
      .from('fms_assessments')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching FMS assessments:', error);
      throw error;
    }

    return data as FMSAssessment[];
  } catch (error) {
    console.error('Exception in getFMSAssessments:', error);
    throw error;
  }
}

export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .order('email');

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    // A `full_name` szándékosan nyersen (akár null-ként) jön vissza: a hívónak
    // tudnia kell, van-e valódi neve az alanynak, vagy csak e-mail címünk van.
    // A megjelenítéshez a `name` mezőben adjuk a visszaesésekkel képzett nevet.
    const formattedData = data.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      name: user.full_name || user.email || `User ${user.id.slice(0, 8)}...`,
    }));

    return formattedData;
  } catch (error) {
    console.error('Exception in getAllUsers:', error);
    throw error;
  }
}

export async function listFMSAssessmentSubjects(): Promise<FMSAssessmentSubject[]> {
  try {
    const { data: assessments, error: assessmentsError } = await supabase
      .from('fms_assessments')
      // Teljes sor: a lista kártyáján megjelenő értékeléshez a nyers
      // oldalankénti pontok és a clearing tesztek is kellenek.
      .select('*')
      .order('created_at', { ascending: false });

    if (assessmentsError) {
      console.error('Error fetching FMS assessment subjects:', assessmentsError);
      throw assessmentsError;
    }

    const latestByUserId = new Map<string, FMSAssessment>();

    for (const assessment of assessments || []) {
      if (!assessment.user_id || latestByUserId.has(assessment.user_id)) {
        continue;
      }

      latestByUserId.set(assessment.user_id, assessment as FMSAssessment);
    }

    const userIds = Array.from(latestByUserId.keys());
    if (userIds.length === 0) {
      return [];
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching FMS subject profiles:', profilesError);
      throw profilesError;
    }

    const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));

    return userIds
      .map((userId) => {
        const profile = profileMap.get(userId);
        const latestAssessment = latestByUserId.get(userId) ?? null;
        const displayName = profile?.full_name || profile?.email || `FMS alany ${userId.slice(0, 8)}`;

        return {
          userId,
          displayName,
          fullName: profile?.full_name || null,
          email: profile?.email || null,
          latestAssessmentDate: latestAssessment?.date || null,
          latestAssessmentCreatedAt: latestAssessment?.created_at || null,
          // ?? és nem ||: a 0 összpontszám (minden teszt fájdalmas) érvényes érték.
          latestTotalScore: latestAssessment?.total_score ?? null,
          latestAssessment,
        } satisfies FMSAssessmentSubject;
      })
      .sort((left, right) => left.displayName.localeCompare(right.displayName, 'hu'));
  } catch (error) {
    console.error('Exception in listFMSAssessmentSubjects:', error);
    throw error;
  }
}

/**
 * A `listFMSAssessmentSubjects` egy-profilos változata: a riport oldalnak csak
 * a felmért személy nevére és e-mail címére van szüksége, nem a teljes listára.
 */
export async function getFMSAssessmentSubject(userId: string): Promise<FMSAssessmentSubject | null> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching FMS subject profile:', profileError);
      throw profileError;
    }

    const latest = await getLatestFMSAssessment(userId);

    if (!profile && !latest) {
      return null;
    }

    return {
      userId,
      displayName: profile?.full_name || profile?.email || `FMS alany ${userId.slice(0, 8)}`,
      fullName: profile?.full_name || null,
      email: profile?.email || null,
      latestAssessmentDate: latest?.date ?? null,
      latestAssessmentCreatedAt: latest?.created_at ?? null,
      latestTotalScore: latest?.total_score ?? null,
      latestAssessment: latest ?? null,
    };
  } catch (error) {
    console.error('Exception in getFMSAssessmentSubject:', error);
    throw error;
  }
}