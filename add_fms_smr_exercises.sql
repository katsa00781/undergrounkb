-- FMS korrekciós és SMR gyakorlatok hozzáadása
-- Ez a script hozzáadja az FMS korrekciós gyakorlatokat és SMR (Self-Myofascial Release) gyakorlatokat

-- FMS korrekciós gyakorlatok
INSERT INTO public.exercises (name, description, instructions, category, movement_pattern, difficulty, is_active) VALUES

-- 1. Deep Squat korrekciós gyakorlatok
('Assisted deep squat with band', 'Kapaszkodva mély guggolás szalaggal segítve', 'Fogd meg a szalagot vagy rögzített pontot, lassan ereszkedj mély guggolásba. A szalag segít az egyensúly megtartásában.', 'mobility_flexibility', 'mobilization', 2, true),
('Goblet squat hold', 'Súllyal (vagy nehezebb tárggyal) mély tartás', 'Fogj egy súlyt (vagy vízes palackot) a mellkashoz, guggolj le mélyre és tartsd a pozíciót 30-60 másodpercig.', 'mobility_flexibility', 'knee_dominant_bilateral', 3, true),
('Ankle dorsiflexion mobilization', 'Bokamobilizáció falnál vagy szalaggal', 'Állj a faltól egy lépésnyire, térd előre nyomása a fal felé. Érezd a boka hátsó részének nyúlását.', 'mobility_flexibility', 'mobilization', 1, true),
('Quadruped rocking', 'Négykézláb hintázás hátra-előre', 'Négykézlábban hintázz hátra a sarkaid felé, majd vissza előre. Érezd a csípő és boka mobilitását.', 'mobility_flexibility', 'mobilization', 2, true),
('Overhead squat with dowel', 'Bot fej fölött guggolás', 'Tartsd egy botot (vagy törölközőt) fej fölött, végezz mély guggolást megtartva a kar pozíciót.', 'mobility_flexibility', 'knee_dominant_bilateral', 4, true),

-- 2. Hurdle Step korrekciós gyakorlatok
('Mini-band march', 'Gumikarika a bokán, térdemelés', 'Tegyél egy mini szalagot a bokádra, végezz kontrollált térdemelést egyensúlyozva.', 'mobility_flexibility', 'knee_dominant_unilateral', 2, true),
('Single-leg deadlift (unloaded)', 'Testsúlyos egy lábas döntés', 'Állj egy lábon, dőlj előre, nyújtsd ki a másik lábat hátra. Kontrollált mozgás mindvégig.', 'mobility_flexibility', 'hip_dominant_unilateral', 3, true),
('Heel-to-wall march', 'Falhoz állva, térdemelés kontrollal', 'Állj háttal a falnak, sarkak érintik a falat. Emelj térdet anélkül, hogy hátradőlnél.', 'mobility_flexibility', 'knee_dominant_unilateral', 2, true),
('Assisted step-over', 'Szalaggal segített akadálylépés', 'Használj szalagot egyensúly megtartására, lépj át egy képzeletbeli akadályon kontrolláltan.', 'mobility_flexibility', 'knee_dominant_unilateral', 2, true),
('Standing hip flexor mobilization', 'Aktív csípőhajlítás', 'Állva emeld a térdet mellkas felé, tartsd, majd lassan engedd le. Aktív mozgástartomány fejlesztése.', 'mobility_flexibility', 'mobilization', 1, true),

-- 3. In-line Lunge korrekciós gyakorlatok
('Split squat hold', 'Statikus kitörés tartás', 'Állj kitörés pozícióba, ereszkedj le és tartsd a pozíciót. Fókuszálj az egyensúlyra és stabilitásra.', 'mobility_flexibility', 'knee_dominant_unilateral', 3, true),
('Assisted in-line lunge with band', 'Szalaggal segített kitörés', 'Végezz kitörést egy vonalon, szalag segít az egyensúly megtartásában.', 'mobility_flexibility', 'knee_dominant_unilateral', 3, true),
('Half kneeling chop/lift with band', 'Fél térdelésből átlós húzás', 'Fél térdelő pozícióban végezz átlós húzó mozgást szalaggal. Törzs stabilitás fejlesztése.', 'mobility_flexibility', 'stability_anti_rotation', 3, true),
('Ankle dorsiflexion mobilization (front leg)', 'Elöl lévő boka mobilizálása', 'Kitörés pozícióban az elöl lévő láb bokáját mobilitáld előre-hátra mozgással.', 'mobility_flexibility', 'mobilization', 2, true),
('Hip flexor stretch (rear leg)', 'Hátul lévő csípő hajlító nyújtás', 'Kitörés pozícióban a hátsó láb csípőhajlítóját nyújtsd medence előretolással.', 'mobility_flexibility', 'mobilization', 2, true),

-- 4. Shoulder Mobility korrekciós gyakorlatok
('Thread the needle', 'Négykézláb törzsátforgatás', 'Négykézlábban az egyik kart vezeted a másik kar alatt keresztül, forgatva a törzsöt.', 'mobility_flexibility', 'upper_body_mobility', 2, true),
('Open book stretch', 'Oldalfekvésben karok nyitása', 'Oldalfekvésben az felső kart nyisd ki, követve a tekintetedet. Gerinc rotáció.', 'mobility_flexibility', 'upper_body_mobility', 2, true),
('Wall slides', 'Falnál lassú karcsúsztatás overhead', 'Háttal a falnak, karok a falon, lassan csúsztasd fel-le a karokat megtartva a fal kontaktust.', 'mobility_flexibility', 'upper_body_mobility', 2, true),
('Banded shoulder dislocates', 'Szalaggal váll átforgatás', 'Széles fogással tartsd a szalagot, vezeted körbe a fejed fölött hátra, majd vissza.', 'mobility_flexibility', 'upper_body_mobility', 3, true),
('Quadruped thoracic rotation', 'Négykézláb könyök felnyitás', 'Négykézlábban az egyik kezet a fejed mögé, könyöködet nyitsd fel és forgasd a törzsöt.', 'mobility_flexibility', 'upper_body_mobility', 2, true),

-- 5. Active Straight Leg Raise korrekciós gyakorlatok
('Single leg lowering with band', 'Hanyatt, egyik láb szalagban', 'Hanyatt fekve egyik láb szalagban, kontrolláltan engedd le a másikat és emeld vissza.', 'mobility_flexibility', 'aslr_correction_first', 3, true),
('Assisted straight leg raise', 'Passzív + aktív kombináció', 'Segítséggel emeld a lábat, majd aktívan tartsd és engedd le kontrolláltan.', 'mobility_flexibility', 'aslr_correction_first', 2, true),
('Half kneeling hip flexor stretch', 'Ellenoldali csípő nyújtása', 'Fél térdelésben a hátsó láb csípőhajlítóját nyújtsd, medence előretolással.', 'mobility_flexibility', 'mobilization', 2, true),
('Toe touch progression', 'Fokozatos előrehajlás', 'Állva fokozatosan hajolj előre a lábujjaid felé, csak addig, amíg kényelmes.', 'mobility_flexibility', 'mobilization', 2, true),
('Cook hip lift', 'Egyik láb emelve, híd pozíció', 'Hanyatt fekve az egyik térd mellkashoz húzva, híd a másik lábbal.', 'mobility_flexibility', 'hip_dominant_unilateral', 3, true),

-- 6. Trunk Stability Push-up korrekciós gyakorlatok
('Plank hold', 'Statikus alkartámasz', 'Alkartámaszon tartsd egyenesen a tested, core aktiválva, légzés egyenletesen.', 'mobility_flexibility', 'stability_anti_extension', 2, true),
('Push-up plus', 'Scapula protrakció–retrakció fekvőtámaszban', 'Fekvőtámasz pozícióban a lapockákat összehúzod és széthúzod extra mozgással.', 'mobility_flexibility', 'horizontal_push_bilateral', 3, true),
('Dead bug', 'Hanyatt, ellentétes kar-láb nyújtás', 'Hanyatt fekve ellentétes kar és láb nyújtása, core stabilan tartva.', 'mobility_flexibility', 'stability_anti_extension', 2, true),
('Tall plank shoulder taps', 'Tenyérrel váll érintése plankben', 'Plank pozícióban felváltva érintsd meg az ellentétes vállat, core stabil.', 'mobility_flexibility', 'stability_anti_rotation', 3, true),
('Quadruped hover (bear hold)', 'Térdek pár centire a talajtól', 'Négykézlábban emeld a térdeket 2-3 cm-re a talajtól, tartsd a pozíciót.', 'mobility_flexibility', 'stability_anti_extension', 3, true),

-- 7. Rotary Stability korrekciós gyakorlatok
('Bird dog', 'Négykézláb, ellentétes kar-láb nyújtás', 'Négykézlábban nyújtsd ki az ellentétes kart és lábat, stabilitás megtartása.', 'mobility_flexibility', 'stability_anti_rotation', 2, true),
('Side plank variations', 'Oldalsó plank tartások', 'Oldalsó plank különböző variációkban: térden, lábon, időtartam változtatással.', 'mobility_flexibility', 'stability_anti_flexion', 3, true),
('Dead bug (rotary)', 'Stabil törzs, végtag mozgás', 'Hanyatt fekve váltakozó kar-láb mozgások, törzs stabilan tartva.', 'mobility_flexibility', 'stability_anti_rotation', 2, true),
('Pallof press with band', 'Antirotációs gyakorlat szalaggal', 'Szalagot tartva mellkas előtt, nyújtsd ki anélkül, hogy a törzs elfordulna.', 'mobility_flexibility', 'stability_anti_rotation', 3, true),
('Quadruped diagonals', 'Könyök-térd érintés, majd nyújtás', 'Négykézlábban ellentétes könyök és térd összeérintése, majd nyújtás.', 'mobility_flexibility', 'stability_anti_rotation', 2, true),

-- Clearing tesztek
('Shoulder clearing - Thread the needle', 'Váll tisztító mozgás', 'Négykézláb pozícióban az egyik kart vezeted keresztül a másik alatt, váll mobilitás tesztelése.', 'mobility_flexibility', 'upper_body_mobility', 1, true),
('Wall slides (clearing)', 'Váll tisztító gyakorlat falnál', 'Háttal a falnak állva karcsúsztatás a falon, váll funkció ellenőrzése.', 'mobility_flexibility', 'upper_body_mobility', 1, true),
('Banded external rotation', 'Szalaggal külső rotáció', 'Szalaggal váll külső rotációs mozgás, vállöv stabilitás tesztelése.', 'mobility_flexibility', 'upper_body_mobility', 2, true),
('Cat-camel', 'Macska-teve gerinc mozgás', 'Négykézlábban gerinc flexió és extenzió váltakozva, gerinc mobilitás.', 'mobility_flexibility', 'mobilization', 1, true),
('Child''s pose hold', 'Gyermek póz tartás', 'Térdre ülve előrehajlás, karok kinyújtva, relaxáló pozíció tartása.', 'mobility_flexibility', 'mobilization', 1, true);

-- SMR (Self-Myofascial Release) henger gyakorlatok
INSERT INTO public.exercises (name, description, instructions, category, movement_pattern, difficulty, is_active) VALUES

-- Alsó végtag SMR gyakorlatok
('SMR - Vádli (Gastrocnemius & Soleus)', 'Vádli izom hengerezése', 'Ülő helyzetben egyik láb a hengeren. Lassan gurítsd a hengert a saroktól a térdhajlatig. 30-60 másodperc.', 'recovery', 'mobilization', 1, true),
('SMR - Szárkapocsi izom (Peroneus)', 'Szárkapocsi izom hengerezése', 'Oldalfekvésben a lábszár külső része a hengeren. Lassú gördítés a boka és térd között.', 'recovery', 'mobilization', 2, true),
('SMR - Comb hátsó (Hamstring)', 'Comb hátsó izom hengerezése', 'Ülésben a comb hátsó része a hengeren. Lassan gurítsd a térdhajlattól a farpofáig.', 'recovery', 'mobilization', 2, true),
('SMR - IT szalag (Iliotibial band)', 'IT szalag hengerezése', 'Oldalfekvésben a külső comb a hengeren. Gördítés a csípőtől a térdig. Óvatos nyomás!', 'recovery', 'mobilization', 3, true),
('SMR - Comb elülső (Quadriceps)', 'Comb elülső izom hengerezése', 'Hason fekve a comb elülső része a hengeren. Gördítés a csípőtől a térdig.', 'recovery', 'mobilization', 2, true),
('SMR - Adduktor (belső comb)', 'Belső comb hengerezése', 'Hason fekve egyik láb oldalra nyitva a hengeren. Gördítés a térd és csípő között.', 'recovery', 'mobilization', 2, true),

-- Csípő és farizmok SMR
('SMR - Gluteus (farizom)', 'Farizom hengerezése', 'Ülésben a hengeren egyik farpofa. Azonos oldali boka az ellenoldali térdre téve. Gördítés a keresztcsonttól az oldalsó rész felé.', 'recovery', 'mobilization', 2, true),
('SMR - Piriformis', 'Piriformis izom hengerezése', 'Mint a gluteus, de hangsúly az oldalsó, mélyebb részre. Célzott nyomás a piriformis izmra.', 'recovery', 'mobilization', 3, true),

-- Hát SMR
('SMR - Alsó hát (Lumbalis)', 'Alsó hát hengerezése', 'Fekvésben henger a derékrész alatt. Finom, rövidebb mozgások. ÓVATOSAN!', 'recovery', 'mobilization', 2, true),
('SMR - Középső hát (Thoracic)', 'Középső hát hengerezése', 'Hanyatt fekve henger a lapockák alatt. Gördítés a lapocka alsó végétől a vállöv felé.', 'recovery', 'mobilization', 2, true),
('SMR - Felső hát / Lapocka környéke', 'Felső hát hengerezése', 'Kisebb mozgások, célzott területkezelés a felső háton és lapocka körül.', 'recovery', 'mobilization', 2, true),

-- Mellkas és vállöv SMR
('SMR - Mellizom', 'Mellizom hengerezése', 'Oldalfekvésben kar nyújtva oldalra. Gördítés a váll és mellkas találkozásánál.', 'recovery', 'mobilization', 2, true),
('SMR - Latissimus dorsi', 'Latissimus hengerezése', 'Oldalfekvésben henger a hónalj alatt. Gördítés a hónaljtól a bordákig.', 'recovery', 'mobilization', 2, true),

-- Nyak SMR (óvatosan)
('SMR - Nyak (óvatosan)', 'Nyak hengerezése', 'Kisebb labda vagy puhább henger ajánlott. Fekvésben fejtámasz alatt a henger, finom oldalirányú mozgás.', 'recovery', 'mobilization', 1, true);
