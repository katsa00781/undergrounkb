-- SMR (Self-Myofascial Release) henger gyakorlatok hozzáadása
-- Másold ki és futtasd le a Supabase SQL Editor-ban az FMS gyakorlatok után

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
