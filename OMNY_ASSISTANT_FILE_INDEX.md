# Omny Assistant Implementation - Complete File Index

## Core Implementation Files

### Frontend Components

| File | Path | Lines | Purpose |
|------|------|-------|---------|
| OmnyAssistant.tsx | `/frontend/src/components/OmnyAssistant/OmnyAssistant.tsx` | 276 | Main chatbot component with voice support |
| TalkingAvatar.tsx | `/frontend/src/components/OmnyAssistant/TalkingAvatar.tsx` | ? | Avatar animation for voice mode |
| OmnyAssistant.css | `/frontend/src/components/OmnyAssistant/OmnyAssistant.css` | ? | Chat UI styling |

### Frontend Services

| File | Path | Lines | Purpose |
|------|------|-------|---------|
| aiService.ts | `/frontend/src/services/aiService.ts` | 252 | Main AI integration service (Message routing) |
| analyticsService.ts | `/frontend/src/services/analyticsService.ts` | 725 | Business analytics and insights |
| aiRewardsService.ts | `/frontend/src/services/aiRewardsService.ts` | ? | AI rewards generation integration |
| omnyService.ts | `/frontend/src/services/omnyService.ts` | 142 | OMNY token blockchain operations |

### Frontend Admin Dashboard

| File | Path | Lines | Purpose |
|------|------|-------|---------|
| AdminOmnyDashboard.tsx | `/frontend/src/components/Admin/Omny/AdminOmnyDashboard.tsx` | 239 | Token management dashboard |
| AdminOmnyDashboard.css | `/frontend/src/components/Admin/Omny/AdminOmnyDashboard.css` | ? | Dashboard styling |
| AnalyticsDashboard.tsx | `/frontend/src/components/Admin/AnalyticsDashboard.tsx` | ? | Business intelligence dashboard |
| AdminAIRewardsPanel.tsx | `/frontend/src/components/Admin/AdminAIRewardsPanel.tsx` | 100+ | API key management and usage monitoring |

### Backend Edge Functions

| File | Path | Lines | Purpose |
|------|------|-------|---------|
| omny-chat/index.ts | `/supabase/functions/omny-chat/index.ts` | 597 | Main Claude API integration + 6 tools |
| generate-ai-rewards/index.ts | `/supabase/functions/generate-ai-rewards/index.ts` | ? | AI reward generation (separate Claude call) |

### Database Migrations

| File | Path | Purpose |
|------|------|---------|
| 20240115000000_firebase_notifications.sql | `/supabase/migrations/` | Notification system setup |
| 20240115000001_firebase_notifications_fixed.sql | `/supabase/migrations/` | Notification fixes |
| 20240115000002_fix_device_tokens_rls.sql | `/supabase/migrations/` | Device tokens RLS |
| 20241124_create_wallet_system.sql | `/supabase/migrations/` | OMNY wallet/token system |
| 20241124_create_wallet_system_FIXED.sql | `/supabase/migrations/` | Wallet system fixes |
| 20241124_create_wallet_system_SIMPLE.sql | `/supabase/migrations/` | Simplified wallet system |

### Documentation (Created)

| File | Path | Purpose |
|------|------|---------|
| OMNY_ASSISTANT_IMPLEMENTATION_MAP.md | `/` | Complete technical documentation (24KB) |
| OMNY_ASSISTANT_QUICK_REFERENCE.md | `/` | Quick reference guide |
| OMNY_ASSISTANT_FILE_INDEX.md | `/` | This file |

---

## Database Tables Used

### Core Business Tables

```sql
-- Customers and Loyalty
customers
├── id (UUID)
├── organization_id (FK)
├── first_name, last_name
├── email, phone
├── points (loyalty points)
├── tier (bronze, silver, gold)
├── total_spent (lifetime value)
├── visit_count
├── last_visit
└── timestamps

-- Transactions and Activities
transactions
├── id (UUID)
├── organization_id, customer_id
├── amount (monetary)
├── type (purchase, bonus, refund)
└── timestamps

customer_activities
├── activity_type (transaction, login, purchase)
├── monetary_value
└── timestamps

-- Rewards Management
rewards
├── id (UUID)
├── organization_id
├── name, description
├── points_required
└── value (euro amount)

reward_redemptions
├── id (UUID)
├── organization_id, customer_id, reward_id
├── redeemed_by
└── used_at, created_at
```

### System Tables

```sql
-- API Keys and Configuration
api_keys
├── id (UUID)
├── organization_id (nullable for global)
├── key_name ('ANTHROPIC_API_KEY')
├── key_value (base64 encoded)
├── is_active (boolean)
└── timestamps

-- Email and Notifications
email_campaigns
├── id (UUID)
├── organization_id
├── subject, campaign_type
├── recipients_count
├── opened_count, clicked_count
└── timestamps

-- Usage Tracking
ai_rewards_usage
├── organization_id
├── tokens_used
├── generated_at
└── [other tracking fields]
```

---

## Key Integration Points

### Authentication Flow
```
User Login
  ↓
Supabase Auth (JWT)
  ↓
Authorization Header in API Calls
  ↓
Edge Functions Verify Token
  ↓
RLS Policies Enforce Org Access
```

### API Endpoints
```
POST /functions/v1/omny-chat
  Input: { messages: [], organizationId: string }
  Output: { content: string, tool_use?: {name, result} }

POST /functions/v1/generate-ai-rewards
  Input: { businessContext, organizationId, rewardsCount }
  Output: { rewards: GeneratedReward[] }
```

### External APIs
```
https://api.anthropic.com/v1/messages (Claude API)
  Model: claude-sonnet-4-5
  Max Tokens: 1024 (chat) / 4096 (rewards)
  Authentication: x-api-key header
```

---

## Configuration Files

### Environment Variables

#### Frontend (.env / .env.local)
```
VITE_SUPABASE_URL=https://sjvatdnvewohvswfrdiv.supabase.co
VITE_SUPABASE_ANON_KEY=[key]
VITE_OMNY_CONTRACT_ADDRESS=0xe62CCDc664993336bB400B725Fb9C0A8Cd1895f4
```

#### Backend (Supabase Secrets)
```
SUPABASE_URL=https://sjvatdnvewohvswfrdiv.supabase.co
SUPABASE_ANON_KEY=[key]
```

#### Database
```
api_keys table:
  key_name: 'ANTHROPIC_API_KEY'
  key_value: [base64 encoded]
  is_active: true
```

---

## File Size and Statistics

```
OmnyAssistant.tsx          ~10 KB    (276 lines)
aiService.ts               ~9 KB     (252 lines)
omny-chat/index.ts         ~20 KB    (597 lines)
analyticsService.ts        ~25 KB    (725 lines)
AdminOmnyDashboard.tsx     ~12 KB    (239 lines)
AdminAIRewardsPanel.tsx    ~15 KB    (100+ lines)
---
TOTAL Implementation       ~91 KB

OMNY_ASSISTANT_IMPLEMENTATION_MAP.md  ~24 KB (Comprehensive docs)
OMNY_ASSISTANT_QUICK_REFERENCE.md     ~12 KB (Quick guide)
```

---

## Frontend Project Structure

```
frontend/
├── public/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── assets/
│   ├── components/
│   │   ├── OmnyAssistant/
│   │   │   ├── OmnyAssistant.tsx          *** MAIN CHAT UI ***
│   │   │   ├── TalkingAvatar.tsx
│   │   │   └── OmnyAssistant.css
│   │   ├── Admin/
│   │   │   ├── AdminLayout.tsx            (Wraps admin components)
│   │   │   ├── AdminAIRewardsPanel.tsx    (API key management)
│   │   │   ├── AnalyticsDashboard.tsx     (Analytics display)
│   │   │   ├── Omny/
│   │   │   │   ├── AdminOmnyDashboard.tsx (Token dashboard)
│   │   │   │   └── AdminOmnyDashboard.css
│   │   │   └── [other admin components...]
│   │   └── [other components...]
│   ├── contexts/
│   ├── hooks/
│   │   └── useOmnyBalance.ts              (Balance tracking)
│   ├── lib/
│   │   └── supabase.ts                    (Supabase client)
│   ├── services/
│   │   ├── aiService.ts                   *** MAIN AI SERVICE ***
│   │   ├── analyticsService.ts            (Analytics logic)
│   │   ├── aiRewardsService.ts            (Rewards logic)
│   │   ├── omnyService.ts                 (Token operations)
│   │   └── [other services...]
│   └── styles/
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Backend Project Structure

```
supabase/
├── migrations/
│   ├── [date]_create_tables.sql
│   ├── [date]_firebase_notifications.sql
│   ├── [date]_create_wallet_system.sql
│   └── [other migrations...]
├── functions/
│   ├── omny-chat/
│   │   └── index.ts                       *** MAIN BACKEND ***
│   ├── generate-ai-rewards/
│   │   └── index.ts
│   ├── send-email/
│   ├── send-push-notification/
│   ├── manage-api-keys/
│   └── [other functions...]
└── config/
    └── [function configs]
```

---

## Claude Tool Definitions Location

**File**: `/supabase/functions/omny-chat/index.ts`
**Line Range**: ~89-218

**Tools Defined**:
1. `send_push_notification` (lines ~90-111)
2. `get_sales_analytics` (lines ~113-134)
3. `get_customer_info` (lines ~136-149)
4. `search_customers` (lines ~150-176)
5. `get_top_customers` (lines ~177-195)
6. `assign_bonus_points` (lines ~196-217)

**Tool Execution Functions** (lines ~314-597):
- `executeTool()` - Router (line ~314)
- `sendPushNotification()` - (line ~341)
- `getSalesAnalytics()` - (line ~386)
- `getCustomerInfo()` - (line ~449)
- `searchCustomers()` - (line ~487)
- `getTopCustomers()` - (line ~529)
- `assignBonusPoints()` - (line ~555)

---

## Data Models

### AIMessage (Frontend)
```typescript
interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  tool_use?: ToolUseData
}
```

### AnalyticsKPI (Analytics Service)
```typescript
interface AnalyticsKPI {
  totalRevenue: number
  revenueChange: number
  activeCustomers: number
  customersChange: number
  totalTransactions: number
  transactionsChange: number
  averageTicket: number
  ticketChange: number
  pointsDistributed: number
  pointsChange: number
  rewardsRedeemed: number
  rewardsChange: number
  retentionRate: number
  retentionChange: number
  customerLTV: number
  ltvChange: number
}
```

### GeneratedReward (AI Rewards)
```typescript
interface GeneratedReward {
  name: string
  type: 'discount' | 'freeProduct' | 'cashback' | 'giftCard'
  value: string | number
  points_required: number
  required_tier?: string
  description: string
  emoji?: string
  imageSearchQuery?: string
}
```

---

## NPM Dependencies

### Frontend Key Dependencies
```json
{
  "react": "^18.x",
  "typescript": "^5.x",
  "@supabase/supabase-js": "^2.7.1",
  "lucide-react": "[version]",
  "ethers": "[version]"
}
```

### Backend (Deno Imports)
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
```

---

## Testing & Validation

### Frontend Testing
- Component: `OmnyAssistant.tsx` - UI testing
- Service: `aiService.ts` - Message flow testing
- Mock mode: `getMockResponse()` - Demo responses

### Backend Testing
- Function: `omny-chat/index.ts` - CORS preflight handling
- Error cases: API key missing, org not found
- Tool execution: Each tool has error handling

### Database Testing
- Check API key: `SELECT * FROM api_keys WHERE key_name = 'ANTHROPIC_API_KEY'`
- Check usage: `SELECT * FROM ai_rewards_usage ORDER BY created_at DESC`
- Test queries: Run sample tool functions with test data

---

## Deployment Checklist

- [ ] API key configured in `api_keys` table
- [ ] Supabase functions deployed (`omny-chat`, `generate-ai-rewards`)
- [ ] Frontend environment variables set
- [ ] Database migrations applied
- [ ] RLS policies enabled
- [ ] CORS configuration in place
- [ ] Anthropic API key accessible to functions
- [ ] Test chat function with curl/Postman
- [ ] Monitor logs for errors
- [ ] Verify response times and token usage

---

## Support & References

### Documentation Files in Project
- `/CLAUDEded.md` - Project roadmap and milestones
- `/GEMINI.md` - Alternative AI integration docs
- `/AI_REWARDS_IMAGES_SETUP.md` - Image setup guide
- `/EDGE_FUNCTION_UPDATE_INSTRUCTIONS.md` - Function deployment
- `/CUSTOMER_APP.md` - Customer app documentation

### External Resources
- Claude API: https://docs.anthropic.com/
- Supabase: https://supabase.com/docs/
- Anthropic: https://www.anthropic.com/
- Web Speech API: https://developer.mozilla.org/docs/Web/API/Web_Speech_API

---

**Document Created**: December 4, 2024
**Scope**: Complete Omny Assistant Implementation in OMNILY PRO
**Status**: Production Ready
