-- Teszt súlyadat létrehozása az első felhasználóhoz (amelyik létezik)
-- Először megkeressük az első felhasználót
SELECT id, email FROM auth.users LIMIT 1;

-- Majd létrehozunk egy teszt súlyadatot 
INSERT INTO user_weights (user_id, weight, date, created_at) 
SELECT id, 85.5, CURRENT_DATE, NOW() 
FROM auth.users 
LIMIT 1;

-- Ellenőrizzük az eredményt
SELECT uw.*, u.email 
FROM user_weights uw 
JOIN auth.users u ON u.id = uw.user_id 
ORDER BY uw.created_at DESC 
LIMIT 5;
