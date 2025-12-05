# Omny Assistant - Quick Reference Guide

## At a Glance

| Component | Location | Purpose | Language |
|-----------|----------|---------|----------|
| **Frontend UI** | `frontend/src/components/OmnyAssistant/` | Chat & Voice Interface | TypeScript/React |
| **AI Service** | `frontend/src/services/aiService.ts` | Frontend-Backend Bridge | TypeScript |
| **Backend Function** | `supabase/functions/omny-chat/index.ts` | Claude Integration + Tools | TypeScript/Deno |
| **Rewards Generator** | `supabase/functions/generate-ai-rewards/index.ts` | AI Reward Creation | TypeScript/Deno |
| **Admin Dashboard** | `frontend/src/components/Admin/Omny/` | Token Management | TypeScript/React |
| **Analytics Service** | `frontend/src/services/analyticsService.ts` | Business Intelligence | TypeScript |

---

## Key Files Map

### Frontend (React)
```
frontend/src/
├── components/
│   ├── OmnyAssistant/
│   │   ├── OmnyAssistant.tsx (276 lines) *** MAIN ***
│   │   ├── TalkingAvatar.tsx
│   │   └── OmnyAssistant.css
│   └── Admin/
│       ├── Omny/AdminOmnyDashboard.tsx
│       ├── AnalyticsDashboard.tsx
│       └── AdminAIRewardsPanel.tsx
└── services/
    ├── aiService.ts (252 lines) *** MAIN ***
    ├── analyticsService.ts (725 lines)
    ├── omnyService.ts (OMNY token ops)
    └── aiRewardsService.ts
```

### Backend (Supabase/Deno)
```
supabase/functions/
├── omny-chat/ (597 lines) *** MAIN ***
│   └── index.ts
└── generate-ai-rewards/
    └── index.ts
```

---

## 6 AI Tools Available

```
1. send_push_notification     → Segment users, prepare notifications
2. get_sales_analytics        → Revenue, transactions, avg ticket
3. get_customer_info          → Single customer profile lookup
4. search_customers           → Find customers by name/email/tier
5. get_top_customers          → Top performers by points or spending
6. assign_bonus_points        → Award points to customer
```

**How to invoke:** Just describe what you want in natural Italian, e.g.:
- "Mostrami i dati di vendita degli ultimi 7 giorni"
- "Chi sono i miei clienti VIP?"
- "Regala 100 punti a Marco Rossi"

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER INPUT                                                   │
│ "Analizza le vendite di oggi"                                  │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND (OmnyAssistant.tsx)                                 │
│ - Captures text/voice input                                     │
│ - Calls aiService.sendMessage(userMessage)                      │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. AI SERVICE (aiService.ts)                                    │
│ - Gets user from Supabase.auth                                  │
│ - Gets organization_id                                          │
│ - Prepares message history (last 10)                            │
│ - Calls supabase.functions.invoke('omny-chat', {...})          │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. EDGE FUNCTION (omny-chat/index.ts)                           │
│ - Gets ANTHROPIC_API_KEY from api_keys table                    │
│ - Builds system prompt + 6 tool definitions                     │
│ - Calls Claude API (claude-sonnet-4-5)                          │
│ - Checks stop_reason (tool_use or end_turn)                     │
└────────────┬────────────────────────────────────────────────────┘
             │
         ┌───┴───────────────────┐
         │                       │
         ▼                       ▼
   ┌───────────────┐     ┌──────────────────┐
   │ Tool Used?    │     │ Plain Text?      │
   │ Execute tool  │     │ Return message   │
   │ function      │     │                  │
   └───────┬───────┘     └────────┬─────────┘
           │                      │
           └──────────┬───────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. RETURN TO FRONTEND                                           │
│ { content, role, timestamp, tool_use (optional) }              │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. FRONTEND DISPLAY                                             │
│ - Format tool results with emojis/markdown                      │
│ - Speak response if voice mode enabled                          │
│ - Add to message history                                        │
│ - Display in chat UI                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Configuration Checklist

- [ ] Anthropic API Key in `api_keys` table (base64 encoded)
- [ ] Table with organization_id set
- [ ] is_active = true
- [ ] OMNY token contract address set in .env
- [ ] Supabase functions deployed
- [ ] User has organization membership in organization_members
- [ ] CORS enabled on edge functions

---

## Testing Commands

### Test Chat Function Directly
```bash
curl -X POST https://[PROJECT-ID].supabase.co/functions/v1/omny-chat \
  -H "Authorization: Bearer [YOUR-AUTH-TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Ciao"}],
    "organizationId": "[ORG-ID]"
  }'
```

### Check API Key
```sql
SELECT key_name, is_active FROM api_keys 
WHERE key_name = 'ANTHROPIC_API_KEY';
```

### View Recent Tool Usage
```sql
SELECT organization_id, created_at, COUNT(*) 
FROM ai_rewards_usage
GROUP BY organization_id, created_at
ORDER BY created_at DESC
LIMIT 10;
```

---

## Key Code Snippets

### Send Message (Frontend)
```typescript
// frontend/src/services/aiService.ts
async sendMessage(message: string): Promise<AIMessage> {
  const { data: { user } } = await supabase.auth.getUser()
  const { data: orgMembers } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
  
  const { data } = await supabase.functions.invoke('omny-chat', {
    body: {
      messages: apiMessages,
      organizationId: orgMembers?.[0]?.organization_id
    }
  })
  return formatResponse(data)
}
```

### Define Tools (Backend)
```typescript
// supabase/functions/omny-chat/index.ts
const tools = [
  {
    name: "get_sales_analytics",
    description: "Recupera dati di vendita reali...",
    input_schema: {
      type: "object",
      properties: {
        date_range: { type: "string", enum: ["today", "yesterday", "last_7_days", "last_30_days"] },
        metrics: { type: "array", items: { type: "string", enum: ["revenue", "transactions", "avg_ticket"] } }
      },
      required: ["date_range", "metrics"]
    }
  },
  // ... 5 more tools
]
```

### Execute Tool (Backend)
```typescript
// supabase/functions/omny-chat/index.ts
async function getSalesAnalytics(input: any, supabaseClient: any, organizationId: string | null) {
  const { date_range, metrics } = input
  
  // Calculate date range
  const startDate = new Date()
  switch(date_range) {
    case 'today': startDate.setHours(0, 0, 0, 0); break;
    case 'yesterday': startDate.setDate(startDate.getDate() - 1); break;
    // ...
  }
  
  // Query transactions
  const { data: transactions } = await supabaseClient
    .from('transactions')
    .select('amount, created_at')
    .eq('organization_id', organizationId)
    .gte('created_at', startDate.toISOString())
  
  // Calculate metrics
  const result: any = {}
  if (metrics.includes('revenue')) {
    result.revenue = `€${total.toFixed(2)}`
  }
  
  return { success: true, date_range, period: "...", data: result }
}
```

---

## Common Issues & Solutions

### Issue: "Anthropic API key not found"
**Solution:** 
1. Check `api_keys` table for `ANTHROPIC_API_KEY` record
2. Verify `is_active = true`
3. Check if key is base64 encoded correctly

### Issue: Function returns error 400
**Solution:**
1. Check organization_id is provided
2. Verify user is authenticated
3. Check user has organization membership
4. Review Supabase function logs

### Issue: Voice mode not working
**Solution:**
1. Check browser supports Web Speech API (Chrome, Firefox, Safari)
2. Verify Italian language selected (`it-IT`)
3. Check browser permissions for microphone
4. Test with `navigator.mediaDevices.enumerateDevices()`

### Issue: Tool not executing
**Solution:**
1. Check Claude response has `stop_reason: "tool_use"`
2. Verify tool name matches exactly (case-sensitive)
3. Check input parameters match schema
4. Review backend logs for execution errors

---

## Performance Tips

1. **Message History**: Limited to last 10 messages to save tokens
2. **Caching**: Analytics results cached when possible
3. **Rate Limiting**: Consider implementing token-based limits
4. **Batch Queries**: Combine multiple data fetches when possible
5. **Index Optimization**: Ensure indexes on organization_id, created_at

---

## Security Best Practices

1. **API Key**: Never expose in frontend, keep in api_keys table
2. **Organization Filtering**: All queries must filter by organization_id
3. **RLS Policies**: Enable Row-Level Security on all tables
4. **CORS**: Restrict origins in production (not just *)
5. **Rate Limiting**: Prevent abuse with request throttling
6. **Audit Logging**: Log all tool executions with user/timestamp

---

## Monitoring & Logging

### Frontend (Browser Console)
```javascript
// Check demo mode
localStorage.getItem('OMNY_DEMO_MODE')

// Enable/disable demo
localStorage.setItem('OMNY_DEMO_MODE', 'true')
localStorage.removeItem('OMNY_DEMO_MODE')
```

### Backend (Supabase Logs)
- View edge function logs in Supabase dashboard
- Check for errors in omny-chat function
- Monitor API calls to Anthropic

### Database Monitoring
```sql
-- Last 10 AI chat uses
SELECT * FROM ai_rewards_usage ORDER BY created_at DESC LIMIT 10;

-- API key status
SELECT * FROM api_keys WHERE key_name = 'ANTHROPIC_API_KEY';

-- Recent customer searches
SELECT * FROM customers WHERE organization_id = '[ORG-ID]' LIMIT 5;
```

---

## Useful Links

- Claude API Docs: https://docs.anthropic.com/
- Tool Use Guide: https://docs.anthropic.com/claude/docs/tool-use
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- Anthropic Python SDK: https://github.com/anthropics/anthropic-sdk-python

---

**Last Updated**: December 4, 2024
