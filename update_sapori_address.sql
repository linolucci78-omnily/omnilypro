-- Aggiorna indirizzo completo per Sapori e Colori
UPDATE organizations
SET address = 'Via Bagaladi 7, 00132 Roma'
WHERE id = 'c06a8dcf-b209-40b1-92a5-c80facf2eb29';

-- Verifica
SELECT name, address, phone, email
FROM organizations
WHERE id = 'c06a8dcf-b209-40b1-92a5-c80facf2eb29';
