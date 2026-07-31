import type { FMSFocusId } from '../exerciseTaxonomy/types';

/**
 * A korrekciós gyakorlatok megengedett eszközkészlete. **Csak ez a négy
 * modalitás használható**: az edzőteremben minden ügyfélnél biztosan elérhető
 * (SMR henger/labda, FMS szalag, kettlebell), illetve eszközt sem igényel.
 */
export type FMSCorrectionModality = 'smr' | 'fms_band' | 'bodyweight' | 'kettlebell';

/**
 * A modalitások a korrekciós sorrendben: oldás → mobilizálás → aktív
 * stabilizálás → terhelt megerősítés. Az `FMS_CORRECTION_EXERCISES` minden
 * tesztnél ebben a sorrendben sorolja fel a gyakorlatokat.
 */
export const FMS_CORRECTION_MODALITY_ORDER: FMSCorrectionModality[] = [
  'smr',
  'fms_band',
  'bodyweight',
  'kettlebell',
];

export const FMS_CORRECTION_MODALITY_LABELS: Record<FMSCorrectionModality, string> = {
  smr: 'SMR',
  fms_band: 'FMS szalag',
  bodyweight: 'Saját testsúly',
  kettlebell: 'Kettlebell',
};

export interface FMSCorrectionExercise {
  /** Magyar gyakorlatnév — ez kerül az edzéstervbe és a riportba is. */
  name: string;
  modality: FMSCorrectionModality;
  /** Javasolt adagolás (sorozat × ismétlés vagy idő). */
  dosage: string;
  /** Egy mondatos végrehajtási instrukció az ügyfélnek. */
  cue: string;
}

/**
 * Az FMS korrekciós gyakorlat-adatbázis: mind a 7 mozgásmintához pontosan egy
 * gyakorlat modalitásonként, a `FMS_CORRECTION_MODALITY_ORDER` sorrendjében.
 * A szerkezetet unit teszt őrzi (`fmsCorrections.test.ts`), így a riport
 * elrendezése és az edzésgenerátor kiosztása kiszámítható marad.
 */
export const FMS_CORRECTION_EXERCISES: Record<FMSFocusId, FMSCorrectionExercise[]> = {
  deep_squat: [
    {
      name: 'SMR – vádli és talpfascia hengerlés',
      modality: 'smr',
      dosage: '2 × 45 mp oldalanként',
      cue: 'Bokától térdhajlatig görgess lassan; az érzékeny pontokon maradj 20–30 mp-et, közben mély kilégzés.',
    },
    {
      name: 'Szalagos boka dorziflexió mobilizálás',
      modality: 'fms_band',
      dosage: '2 × 10 ismétlés oldalanként',
      cue: 'A szalag a boka elejét húzza hátra; a térd a lábujj felett halad előre, a sarok végig a talajon marad.',
    },
    {
      name: 'Négykézláb hintázás (quadruped rocking)',
      modality: 'bodyweight',
      dosage: '2 × 10 lassú ismétlés',
      cue: 'Semleges gerinccel told a medencét a sarok felé, és ott állj meg, ahol a hát még nem gömbölyödik.',
    },
    {
      name: 'Goblet guggolás alsó tartással',
      modality: 'kettlebell',
      dosage: '3 × 5 ismétlés, 5 mp alsó tartás',
      cue: 'A harang a mellkas előtt ellensúly; a könyök belülről nyomja szét a térdeket, a törzs függőleges marad.',
    },
  ],
  hurdle_step: [
    {
      name: 'SMR – csípőhajlító és TFL labdázás',
      modality: 'smr',
      dosage: '2 × 60 mp oldalanként',
      cue: 'Hason fekve, a csípőlapát alatt keresd meg az érzékeny pontot, majd lassan hajlítsd-nyújtsd a térdet.',
    },
    {
      name: 'Szalagos menetelés (mini-band march)',
      modality: 'fms_band',
      dosage: '2 × 12 ismétlés oldalanként',
      cue: 'A szalag a lábfej közepén feszül; az álló oldali csípő nem süllyedhet meg, a medence vízszintes marad.',
    },
    {
      name: 'Fal melletti térdemelés-tartás',
      modality: 'bodyweight',
      dosage: '3 × 20 mp oldalanként',
      cue: 'Az emelt térd derékszögben a falnak nyom, az álló láb csípője magasan marad, a bordák lezárva.',
    },
    {
      name: 'Egykezes bőrönd séta (suitcase carry)',
      modality: 'kettlebell',
      dosage: '3 × 20 m oldalanként',
      cue: 'A harang az egyik oldalon lóg; a váll egy magasságban marad, a súly nem húzhatja oldalra a csípőt.',
    },
  ],
  inline_lunge: [
    {
      name: 'SMR – négyfejű és comb oldalsó hengerlés',
      modality: 'smr',
      dosage: '2 × 45 mp oldalanként',
      cue: 'Csípőtől térd fölé görgess lassan; a térdízületet magát ne hengerezd.',
    },
    {
      name: 'Féltérdelő szalagos chop és lift',
      modality: 'fms_band',
      dosage: '2 × 8 ismétlés oldalanként',
      cue: 'A hátsó farizom feszes, a bordák lezárva; a szalag oldalra húzna — ne engedd elfordulni a törzset.',
    },
    {
      name: 'Féltérdelő csípőhajlító nyújtás medencedöntéssel',
      modality: 'bodyweight',
      dosage: '2 × 30 mp oldalanként',
      cue: 'Farizom-feszítéssel döntsd hátra a medencét, majd told előre a csípőt — a derék ne homorodjon.',
    },
    {
      name: 'Goblet split guggolás',
      modality: 'kettlebell',
      dosage: '3 × 6 ismétlés oldalanként',
      cue: 'Szűk nyomvonalon ereszkedj, a hátsó térd a csípő alá kerül; a törzs végig függőleges marad.',
    },
  ],
  shoulder_mobility: [
    {
      name: 'SMR – mellkasi gerinc hengerlés',
      modality: 'smr',
      dosage: '2 × 60 mp',
      cue: 'Hengeren keresztben, kézzel megtámasztott fejjel nyisd a mellkast; a mozgás a hátközépből jöjjön, ne a derékból.',
    },
    {
      name: 'Szalagos vállkörzés (band dislocate)',
      modality: 'fms_band',
      dosage: '2 × 10 lassú ismétlés',
      cue: 'Széles fogás, nyújtott könyök; csak addig vidd hátra a szalagot, amíg a bordák lezárva maradnak.',
    },
    {
      name: 'Oldalfekvő könyvnyitás (open book)',
      modality: 'bodyweight',
      dosage: '2 × 8 ismétlés oldalanként',
      cue: 'A behajlított felső térd a talajon marad; a forgás a mellkasból induljon, a végpontban tarts 2 mp-et.',
    },
    {
      name: 'Kettlebell arm bar',
      modality: 'kettlebell',
      dosage: '3 × 30 mp oldalanként',
      cue: 'Nyújtott karral, zárt vállban tartsd a harangot; a tekintet végig a harangon, a fordulás lassú és kontrollált.',
    },
  ],
  active_straight_leg_raise: [
    {
      name: 'SMR – combhajlító hengerlés',
      modality: 'smr',
      dosage: '2 × 45 mp oldalanként',
      cue: 'Üléscsonttól térdhajlatig görgess; az érzékeny pontnál lassan hajlítsd-nyújtsd a térdet.',
    },
    {
      name: 'Szalagos fekvő lábleengedés',
      modality: 'fms_band',
      dosage: '2 × 10 ismétlés oldalanként',
      cue: 'A szalagos láb nyújtva marad fent, az ellenoldali sarok a talajra nyomódik; csak addig engedd le, amíg a derék a talajon marad.',
    },
    {
      name: 'Hanyattfekvő 90/90 légzés sarokcsúsztatással',
      modality: 'bodyweight',
      dosage: '2 × 6 légzés + 8 csúsztatás',
      cue: 'Bordák lezárva, a medence hátradöntve marad; a láb csak addig nyúlik, amíg a derék a talajon tartható.',
    },
    {
      name: 'Egylábas kettlebell román felhúzás (könnyű súllyal)',
      modality: 'kettlebell',
      dosage: '3 × 8 ismétlés oldalanként',
      cue: 'Egyenes háttal told hátra a csípőt; a mozgás a combhajlító nyúlásáig tart, tovább nem.',
    },
  ],
  trunk_stability_pushup: [
    {
      name: 'SMR – mellizom labdázás fal mellett',
      modality: 'smr',
      dosage: '2 × 45 mp oldalanként',
      cue: 'A kulcscsont alatt keresd az érzékeny pontot, közben lassan emeld és engedd a kart.',
    },
    {
      name: 'Szalagos deadbug (anti-extenzió)',
      modality: 'fms_band',
      dosage: '3 × 8 ismétlés oldalanként',
      cue: 'A szalag a fej fölül húz; a derék végig a talajon marad, kilégzésre indul az ellentétes kar és láb.',
    },
    {
      name: 'Emelt támaszú fekvőtámasz',
      modality: 'bodyweight',
      dosage: '3 × 6 ismétlés',
      cue: 'Farizom és has feszes; a mellkas és a csípő egyszerre induljon — derékbeesés nélkül.',
    },
    {
      name: 'Féltérdelő egykezes kettlebell nyomás',
      modality: 'kettlebell',
      dosage: '3 × 6 ismétlés oldalanként',
      cue: 'Bordák lezárva, farizom feszes; a nyomás alatt a derék ne homorodjon meg.',
    },
  ],
  rotary_stability: [
    {
      name: 'SMR – oldalsó farizom labdázás',
      modality: 'smr',
      dosage: '2 × 60 mp oldalanként',
      cue: 'Falnak vagy talajnak támaszkodva keresd meg a farizom oldalsó érzékeny pontját, közben lassan forgasd a combot.',
    },
    {
      name: 'Szalagos Pallof nyomás',
      modality: 'fms_band',
      dosage: '3 × 8 ismétlés oldalanként',
      cue: 'A szalag oldalról húz; a nyomás alatt a törzs egyáltalán ne forduljon el, a csípő előre néz.',
    },
    {
      name: 'Bird dog (négykézláb átlós nyújtás)',
      modality: 'bodyweight',
      dosage: '3 × 8 ismétlés oldalanként',
      cue: 'A medence vízszintes marad; a kar és az ellenoldali láb egyszerre, lassan nyúlik ki.',
    },
    {
      name: 'Fél török felállás (half get-up)',
      modality: 'kettlebell',
      dosage: '3 × 4 ismétlés oldalanként',
      cue: 'Nyújtott kar, tekintet a harangon; a felülésnél a támaszkodó oldalon dolgozz, a törzs ne roskadjon össze.',
    },
  ],
};
