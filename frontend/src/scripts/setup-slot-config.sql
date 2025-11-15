-- Setup Slot Machine Configuration for Sapori & Colori
-- Execute this in Supabase SQL Editor

INSERT INTO slot_machine_config (
  organization_id,
  name,
  symbols,
  winning_combinations,
  max_spins_per_day,
  is_active
) VALUES (
  'c06a8dcf-b209-40b1-92a5-c80facf2eb29',
  'Slot Machine Fortuna',
  '[{"symbol":"🍒","weight":30},{"symbol":"🍋","weight":25},{"symbol":"🍊","weight":20},{"symbol":"🍉","weight":15},{"symbol":"⭐","weight":5},{"symbol":"💎","weight":3},{"symbol":"7️⃣","weight":2}]'::jsonb,
  '[{"pattern":"jackpot","symbols":["7️⃣"],"prize":{"type":"points","value":1000,"label":"JACKPOT! 1000 Punti"},"probability":1},{"pattern":"three_match","symbols":["💎"],"prize":{"type":"points","value":500,"label":"Tre Diamanti! 500 Punti"},"probability":3},{"pattern":"three_match","symbols":["⭐"],"prize":{"type":"points","value":300,"label":"Tre Stelle! 300 Punti"},"probability":5},{"pattern":"three_match","prize":{"type":"points","value":100,"label":"Tre uguali! 100 Punti"},"probability":15},{"pattern":"two_match","prize":{"type":"points","value":20,"label":"Due uguali! 20 Punti"},"probability":30},{"pattern":"any_diamond","prize":{"type":"points","value":50,"label":"Diamante! 50 Punti"},"probability":10}]'::jsonb,
  3,
  true
);
