# 📝 Istruzioni per aggiornare Edge Function `generate-ai-rewards`

## Dove trovarla
La Edge Function è deployata su Supabase Dashboard:
- Vai su: https://supabase.com/dashboard/project/sjvatdnvewohvswfrdiv/functions
- Cerca: `generate-ai-rewards`

## Modifica da fare

Nel file `index.ts` della Edge Function, **aggiorna il prompt** inviato a Claude per includere le query di ricerca immagini.

### TROVA questa sezione nel prompt:

```typescript
const systemPrompt = `
Sei un esperto di loyalty programs e gamification per ${businessType}.
Genera ${rewardsCount} rewards ottimali basati sul contesto fornito.
...
`
```

### AGGIUNGI questa parte nel prompt:

```typescript
const systemPrompt = `
Sei un esperto di loyalty programs e gamification per ${businessType}.
Genera ${rewardsCount} rewards ottimali basati sul contesto fornito.

PER OGNI REWARD, INCLUDI ANCHE:
- imageSearchQuery: Una query ottimale in INGLESE per cercare la foto perfetta su Unsplash
  La query deve essere descrittiva, professionale e specifica.

ESEMPI di imageSearchQuery corrette:
- Per "Pizza Margherita Gratis": "margherita pizza italian restaurant wood fired oven"
- Per "Caffè Espresso Omaggio": "espresso coffee cup on wooden table cafe"
- Per "Sconto 20% Totale": "discount sale shopping twenty percent off"
- Per "Dessert del Giorno": "italian dessert tiramisu restaurant plated"
- Per "Aperitivo Gratis": "aperitif drinks sunset italian aperitivo"

REGOLE per imageSearchQuery:
1. Sempre in INGLESE
2. Descrittiva (3-6 parole)
3. Specifica al prodotto/servizio
4. Include contesto (es. "restaurant", "cafe", "shop")
5. Evita parole generiche come "free" o "discount" da sole

Rispondi in JSON:
{
  "rewards": [
    {
      "name": "...",
      "type": "...",
      "value": ...,
      "points_required": ...,
      "description": "...",
      "emoji": "...",
      "imageSearchQuery": "english descriptive query here",  // ✨ NUOVO CAMPO
      "required_tier": "..."
    }
  ],
  "reasoning": "..."
}
`
```

## Esempio output atteso dalla Edge Function:

```json
{
  "success": true,
  "rewards": [
    {
      "name": "Pizza Margherita Gratis",
      "type": "freeProduct",
      "value": 0,
      "points_required": 150,
      "description": "Una pizza Margherita classica in omaggio",
      "emoji": "🍕",
      "imageSearchQuery": "margherita pizza italian restaurant",
      "required_tier": "Bronze"
    },
    {
      "name": "Caffè Espresso Omaggio",
      "type": "freeProduct",
      "value": 0,
      "points_required": 50,
      "description": "Un caffè espresso italiano",
      "emoji": "☕",
      "imageSearchQuery": "espresso coffee cup on table",
      "required_tier": null
    }
  ],
  "reasoning": "..."
}
```

## Testing

Dopo aver modificato e ri-deployato la Edge Function, testa chiamandola:

```bash
curl -X POST \
  https://sjvatdnvewohvswfrdiv.supabase.co/functions/v1/generate-ai-rewards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessContext": {...},
    "organizationId": "...",
    "rewardsCount": 3
  }'
```

Verifica che la risposta includa il campo `imageSearchQuery` per ogni reward.

## ✅ Quando è pronto

Dopo aver aggiornato la Edge Function, il frontend automaticamente:
1. Riceverà le rewards con `imageSearchQuery`
2. Cercherà le immagini su Unsplash
3. Mostrerà le preview con immagini
4. Salverà i rewards con `image_url` nel database

---

**Nota:** Se non hai accesso alla Edge Function o preferisci non modificarla ora, il sistema funzionerà comunque! Semplicemente non avrà le immagini automatiche finché non aggiungi il campo `imageSearchQuery`.
