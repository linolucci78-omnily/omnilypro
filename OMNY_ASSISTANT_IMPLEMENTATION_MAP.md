# Omny Assistant Implementation Map - OMNILY PRO

## Executive Summary

The **Omny Assistant** is a sophisticated AI-powered chatbot system integrated into OMNILY PRO, powered by Claude (Anthropic API). It implements the **Model Context Protocol (MCP)** with tool use capabilities to enable sales analytics, customer management, and business operations directly through conversational AI.

**Key Technology Stack:**
- **Frontend**: React + TypeScript (TailwindCSS)
- **Backend**: Supabase Edge Functions (Deno)
- **AI Model**: Claude 3.5 Sonnet (`claude-sonnet-4-5`)
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth + Role-Based Access
- **Blockchain**: Polygon Network (OMNY Token)

---

## 1. FRONTEND IMPLEMENTATION

### 1.1 Main Omny Assistant Component

**File**: `/Users/pasqualelucci/omnilypro-clean/frontend/src/components/OmnyAssistant/OmnyAssistant.tsx`

**Key Features:**
- Dual-mode interface: Chat & Voice
- Real-time message streaming
- Speech recognition (Italian language support)
- Text-to-speech synthesis
- Voice mode with talking avatar
- Message history management
- Tool use response formatting
- Demo mode fallback

**Voice Capabilities:**
```typescript
// Speech Recognition (Italian)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
recognition.lang = 'it-IT'

// Speech Synthesis
const voices = window.speechSynthesis.getVoices()
const italianVoice = voices.find(v => v.lang === 'it-IT' && v.name.includes('Google'))
```

**Components:**
- `OmnyAssistant.tsx` - Main wrapper (276 lines)
- `TalkingAvatar` - Avatar animation component
- `OmnyAssistant.css` - Styling

### 1.2 AI Service Integration

**File**: `/Users/pasqualelucci/omnilypro-clean/frontend/src/services/aiService.ts`

**Core Class**: `AIService`

**Methods:**
```typescript
async sendMessage(message: string, history: AIMessage[] = []): Promise<AIMessage>
setDemoMode(enabled: boolean): void
getDemoMode(): boolean
private async getMockResponse(userMessage: string): Promise<AIMessage>
```

**Message Flow:**
1. User input → `sendMessage()`
2. Get current organization from Supabase Auth
3. Prepare message history (last 10 messages)
4. Invoke Supabase Function: `omny-chat`
5. Handle tool_use responses with formatted output
6. Fallback to mock responses if API fails

**Tool Response Handling:**
The service formats tool results into user-friendly messages:
- `send_push_notification` → Push notification details
- `get_sales_analytics` → Sales data with emojis
- `get_customer_info` → Customer profile details
- `search_customers` → Customer list results
- `get_top_customers` → Top performers ranking
- `assign_bonus_points` → Point assignment confirmation

**Demo Mode:**
- Hardcoded responses for development/testing
- Simulates network delay (1500ms)
- Pattern-based responses for: "analizza", "campagna", "ciao"

---

## 2. BACKEND IMPLEMENTATION

### 2.1 Omny Chat Edge Function

**File**: `/Users/pasqualelucci/omnilypro-clean/supabase/functions/omny-chat/index.ts` (597 lines)

**Runtime**: Deno (TypeScript)

**Architecture:**
```
Request → Auth Check → Get API Key → System Prompt → Tools Definition 
→ Claude API Call → Check stop_reason → Execute Tool OR Return Response
```

#### 2.1.1 System Prompt

**Identity**: "Sei Omny, assistente AI per OMNILY PRO"

**Tone Guidelines:**
- Professional but friendly
- Concise and direct
- Max 2-3 sentences (except for complex requests)
- Minimal emoji usage (1-2 max)
- Always respond in Italian

**Behavioral Rules:**
- Short and actionable responses
- Propose concrete actions in list format
- Avoid lengthy explanations
- Go straight to the point
- Target audience: business owners/managers

#### 2.1.2 Tool Definitions (6 Total)

**1. send_push_notification**
```typescript
{
  name: "send_push_notification",
  description: "Invia una notifica push ai clienti. Usa questo quando l'utente chiede di inviare notifiche o messaggi ai clienti.",
  input_schema: {
    properties: {
      title: { type: "string", description: "Titolo della notifica (max 50 caratteri)" },
      message: { type: "string", description: "Testo del messaggio (max 200 caratteri)" },
      target: {
        type: "string",
        enum: ["all", "tier_gold", "tier_silver", "tier_bronze", "inactive_30d"],
        description: "Segmento di clienti target"
      }
    },
    required: ["title", "message", "target"]
  }
}
```

**2. get_sales_analytics**
```typescript
{
  name: "get_sales_analytics",
  description: "Recupera dati di vendita reali dal database. Usa questo quando l'utente chiede analisi, statistiche o dati di vendita.",
  input_schema: {
    properties: {
      date_range: {
        type: "string",
        enum: ["today", "yesterday", "last_7_days", "last_30_days"],
        description: "Periodo di analisi"
      },
      metrics: {
        type: "array",
        items: {
          type: "string",
          enum: ["revenue", "transactions", "avg_ticket", "top_products"]
        },
        description: "Metriche da recuperare"
      }
    },
    required: ["date_range", "metrics"]
  }
}
```

**3. get_customer_info**
```typescript
{
  name: "get_customer_info",
  description: "Recupera informazioni dettagliate su un cliente specifico.",
  input_schema: {
    properties: {
      customer_id: { type: "string", description: "ID del cliente o email" }
    },
    required: ["customer_id"]
  }
}
```

**4. search_customers**
```typescript
{
  name: "search_customers",
  description: "Cerca clienti nel database. Usa quando l'utente vuole trovare clienti per nome, email, tier o stato.",
  input_schema: {
    properties: {
      query: { type: "string", description: "Testo di ricerca (nome o email)" },
      tier: {
        type: "string",
        enum: ["gold", "silver", "bronze", ""],
        description: "Filtra per tier (opzionale)"
      },
      inactive_days: { type: "number", description: "Trova clienti inattivi da X giorni (opzionale)" },
      limit: { type: "number", description: "Numero massimo di risultati (default 10)" }
    },
    required: []
  }
}
```

**5. get_top_customers**
```typescript
{
  name: "get_top_customers",
  description: "Recupera i migliori clienti per punti o spesa. Usa quando l'utente chiede i top clienti.",
  input_schema: {
    properties: {
      metric: {
        type: "string",
        enum: ["points", "spending"],
        description: "Ordina per punti o spesa totale"
      },
      limit: { type: "number", description: "Numero di clienti da mostrare (default 10)" }
    },
    required: ["metric"]
  }
}
```

**6. assign_bonus_points**
```typescript
{
  name: "assign_bonus_points",
  description: "Assegna punti bonus a un cliente. Usa quando l'utente vuole dare punti extra a qualcuno.",
  input_schema: {
    properties: {
      customer_id: { type: "string", description: "ID del cliente" },
      points: { type: "number", description: "Numero di punti da assegnare" },
      reason: { type: "string", description: "Motivo dell'assegnazione" }
    },
    required: ["customer_id", "points", "reason"]
  }
}
```

#### 2.1.3 Tool Execution Functions

**Pattern**: `async function toolName(input: any, supabaseClient: any, organizationId: string | null)`

**Execution Order** (in `executeTool()`):
1. Route to appropriate handler
2. Query database based on tool parameters
3. Format results
4. Return structured response with success flag

**Key Implementation Details:**

**sendPushNotification()**
- Segments customers by tier or inactivity
- Counts target users
- Returns prepared notification (no actual send)
- Requires confirmation flag: `requires_confirmation: true`
- Database queries: `customers` table

**getSalesAnalytics()**
- Date range calculation (today/yesterday/last_7_days/last_30_days)
- Aggregates `transactions` table
- Calculates: revenue, transaction count, avg_ticket
- Returns formatted: `€1,234.56` format
- Time-based filtering: `gte('created_at', startDate)`

**getCustomerInfo()**
- Lookup by ID or email
- Returns: name, email, phone, points, tier, total_spent, visits, last_visit
- Handles not found: `{ success: false, error: 'Cliente non trovato' }`
- Single query to `customers` table

**searchCustomers()**
- ILIKE pattern matching: `first_name.ilike.%${query}%`
- Optional tier filtering
- Optional inactive days filter (< last_visit date)
- Limit parameter (default 10)
- Returns: count + customer array with basic info

**getTopCustomers()**
- Order by points or total_spent (DESC)
- Returns top N customers with full profile
- Limit parameter (default 10)
- Useful for VIP identification

**assignBonusPoints()**
- Get current customer points
- Calculate new total: `customer.points + input.points`
- Update customer points
- Log transaction with type: 'bonus'
- Transaction fields: customer_id, organization_id, type, points, description, created_at

#### 2.1.4 API Integration

**Endpoint**: `https://api.anthropic.com/v1/messages`

**Request Structure**:
```typescript
{
  model: 'claude-sonnet-4-5',
  max_tokens: 1024,
  system: systemPrompt,
  tools: tools[],
  messages: [{ role: 'user' | 'assistant', content: string }]
}
```

**Response Handling**:
- Check `stop_reason`:
  - `'tool_use'` → Extract tool call, execute, return result
  - `'end_turn'` → Extract text response, return to user
- Tool use object structure: `{ id, type: 'tool_use', name, input }`
- Text response: `content.find(block => block.type === 'text').text`

#### 2.1.5 Error Handling

**API Key Retrieval**:
- Query `api_keys` table
- Filter: `key_name = 'ANTHROPIC_API_KEY'` AND `is_active = true`
- Decode: Try atob() if not already sk- format
- Error: "Anthropic API key not found"

**Request Validation**:
- Check `organizationId` provided
- Check API key exists and is active
- Check AI rewards limit via RPC: `check_ai_rewards_limit()`

**Response Errors**:
- Log `data.error` from Claude API
- Return 400 with error message
- CORS headers: `Access-Control-Allow-Origin: *`

---

### 2.2 AI Rewards Generation Function

**File**: `/Users/pasqualelucci/omnilypro-clean/supabase/functions/generate-ai-rewards/index.ts`

**Purpose**: Generate AI-powered loyalty rewards using Claude

**Key Features:**
- Business context awareness
- Smart reward generation (8+ per request)
- Deduplication against existing rewards
- Token usage tracking
- Plan limit enforcement

**Process Flow**:
1. Receive business context (organization, tiers, points config, products)
2. Get Anthropic API key from database
3. Check AI rewards limit (RPC call)
4. Build intelligent prompt with business context
5. Call Claude API with prompt
6. Parse generated rewards
7. Save to database + track usage
8. Return generated rewards

**Claude Integration**:
```typescript
model: 'claude-sonnet-4-5'
max_tokens: 4096
prompt: buildPrompt(businessContext, customInstructions, rewardsCount, existingRewards)
```

---

## 3. ADMIN DASHBOARD IMPLEMENTATION

### 3.1 Admin Omny Dashboard

**File**: `/Users/pasqualelucci/omnilypro-clean/frontend/src/components/Admin/Omny/AdminOmnyDashboard.tsx`

**Purpose**: Centralized OMNY token management and monitoring

**Features:**
- Global token statistics
- Blockchain network status
- Organization wallet overview
- Recent activity feed
- System health monitoring

**Components**:
- Stats Grid: Supply, Holders, Transactions, Market Cap
- Organizations Table: Company list with wallet addresses
- Recent Activity: Mint/Burn operations feed
- System Health: RPC status, Smart Contract verification, Gas tracker

**Blockchain Integration**:
- Network: Polygon Mainnet
- Monitored metrics: Total Supply, Total Holders, Transactions, Market Cap
- Mock data flow for UI development

**Styling**: `AdminOmnyDashboard.css` with grid layouts and status indicators

### 3.2 Analytics Dashboard

**File**: `/Users/pasqualelucci/omnilypro-clean/frontend/src/components/Admin/AnalyticsDashboard.tsx`
**Service**: `/Users/pasqualelucci/omnilypro-clean/frontend/src/services/analyticsService.ts`

**Comprehensive Analytics Suite**:

#### Metrics Provided:
- **KPIs**: Revenue, Active Customers, Transactions, Avg Ticket, Points Distribution, Retention Rate, Customer LTV
- **Top Products**: Best-selling rewards with sales and revenue
- **Category Revenue**: Revenue breakdown by product category
- **Campaign Performance**: Email campaign metrics (open rate, click rate, conversion rate)
- **Revenue Chart**: Daily revenue trend (last 30 days)
- **Customer Segmentation**: VIP, Regular, Occasional, At Risk customers

#### AI Insights Features:
- **Anomaly Detection**: Revenue drops, low retention, low redemption, customer loss
- **Smart Recommendations**: Actionable business suggestions based on metrics
- **Predictions**: Next month revenue, customer growth, churn risk, growth rate

**Database Queries**:
```typescript
// KPIs
FROM customers (active, retention, LTV)
FROM reward_redemptions (redeemed count)

// Top Products
FROM reward_redemptions (with reward join for names)

// Revenue
FROM customer_activities (transactions aggregated by date)

// Customer Segmentation
FROM customers (sorted by total_spent, segmented into tiers)

// Campaign Performance
FROM email_campaigns (open rates, click rates)
```

---

## 4. DATABASE SCHEMA

### 4.1 Core Tables

**customers**
```sql
- id: UUID
- organization_id: UUID (FK)
- first_name: TEXT
- last_name: TEXT
- email: VARCHAR
- phone: VARCHAR
- points: INTEGER
- tier: VARCHAR (bronze, silver, gold)
- total_spent: DECIMAL
- visit_count: INTEGER
- last_visit: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**transactions**
```sql
- id: UUID
- organization_id: UUID (FK)
- customer_id: UUID (FK customers)
- amount: DECIMAL
- type: VARCHAR (purchase, bonus, refund)
- description: TEXT
- created_at: TIMESTAMP
```

**customer_activities**
```sql
- id: UUID
- organization_id: UUID (FK)
- customer_id: UUID (FK customers)
- activity_type: VARCHAR (transaction, login, purchase)
- monetary_value: DECIMAL
- created_at: TIMESTAMP
```

**email_campaigns**
```sql
- id: UUID
- organization_id: UUID (FK)
- subject: TEXT
- campaign_type: VARCHAR
- recipients_count: INTEGER
- opened_count: INTEGER
- clicked_count: INTEGER
- created_at: TIMESTAMP
```

**reward_redemptions**
```sql
- id: UUID
- organization_id: UUID (FK)
- customer_id: UUID (FK customers)
- reward_id: UUID (FK rewards)
- redeemed_by: UUID
- used_at: TIMESTAMP
- created_at: TIMESTAMP
```

**rewards**
```sql
- id: UUID
- organization_id: UUID (FK)
- name: TEXT
- points_required: INTEGER
- value: DECIMAL
- description: TEXT
```

**api_keys**
```sql
- id: UUID
- organization_id: UUID (FK, nullable)
- key_name: VARCHAR (ANTHROPIC_API_KEY)
- key_value: TEXT (base64 encoded)
- is_active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### 4.2 Key Features

**Organization Filtering**:
- All queries filtered by `organization_id`
- Multi-tenant support
- Null organizationId → global API key usage

**Timestamps**:
- created_at: Immutable creation timestamp
- updated_at: Last modification timestamp
- last_visit: Customer last interaction

---

## 5. AUTHENTICATION & AUTHORIZATION

**Auth Flow**:
1. User logs in via Supabase Auth
2. Session token in Authorization header
3. Edge functions receive Authorization header
4. Create Supabase client with authenticated user
5. RLS policies enforce row-level security
6. Organization membership verified via `organization_members` table

**API Key Management**:
- Stored in `api_keys` table
- Base64 encoded before storage
- Associated with organization (nullable for global keys)
- Active flag for enable/disable

---

## 6. CLAUDE INTEGRATION DETAILS

### 6.1 Model Specification

**Model**: `claude-sonnet-4-5`
- **Context Window**: 200K tokens
- **Max Output**: 4096 tokens (omny-chat), variable (generate-ai-rewards)
- **Cost**: ~$3 per million tokens (from code comments)
- **Latency**: Optimized for real-time chat

### 6.2 Tool Use Implementation

**Claude Tool Use Protocol**:
```
1. User Request
   ↓
2. System Prompt + Tool Definitions sent to Claude
   ↓
3. Claude determines if tool needed (stop_reason: "tool_use")
   ↓
4. Returns tool_use block with name + input parameters
   ↓
5. Backend executes tool function
   ↓
6. Tool result formatted and returned to user
   ↓
7. Frontend formats response with emojis/markdown
```

**Tool Use Response Example**:
```json
{
  "role": "assistant",
  "content": [
    { "type": "text", "text": "Ti mostro i dati di vendita:" },
    { "type": "tool_use", "id": "t_1234", "name": "get_sales_analytics", 
      "input": { "date_range": "last_7_days", "metrics": ["revenue", "transactions"] }
    }
  ],
  "stop_reason": "tool_use"
}
```

---

## 7. VOICE INTEGRATION

**Technologies Used**:
- **Web Speech API**: Speech Recognition
- **Speech Synthesis API**: Text-to-Speech
- **Browser Support**: Chrome, Firefox, Safari, Edge

**Features**:
- Italian language support (`it-IT`)
- Automatic voice listening after speaking
- Voice indicator with waveform animation
- Fallback when API unavailable

**Configuration**:
```typescript
recognition.continuous = false  // Single utterance
recognition.interimResults = false  // Only final results
utterance.rate = 1.0  // Normal speed
utterance.pitch = 1.0  // Normal pitch
```

---

## 8. FILE STRUCTURE SUMMARY

```
omnilypro-clean/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── OmnyAssistant/
│       │   │   ├── OmnyAssistant.tsx          (Main component)
│       │   │   ├── TalkingAvatar.tsx          (Avatar component)
│       │   │   └── OmnyAssistant.css          (Styling)
│       │   └── Admin/
│       │       ├── Omny/
│       │       │   ├── AdminOmnyDashboard.tsx (Token management)
│       │       │   └── AdminOmnyDashboard.css
│       │       └── AnalyticsDashboard.tsx     (Analytics)
│       └── services/
│           ├── aiService.ts                    (Main AI integration)
│           ├── omnyService.ts                  (OMNY token handling)
│           ├── analyticsService.ts            (Analytics data)
│           └── aiRewardsService.ts            (AI rewards integration)
│
├── supabase/
│   └── functions/
│       ├── omny-chat/
│       │   └── index.ts                        (Main chat function - 597 lines)
│       ├── generate-ai-rewards/
│       │   └── index.ts                        (Reward generation)
│       └── [other functions...]
│
└── database/
    └── migrations/
        ├── 20240115000000_firebase_notifications.sql
        ├── 20241124_create_wallet_system_SIMPLE.sql
        └── [other migrations...]
```

---

## 9. USAGE FLOW

### 9.1 Chat Interaction Flow

```
User Input
    ↓
OmnyAssistant.tsx captures message
    ↓
Calls aiService.sendMessage()
    ↓
aiService.sendMessage():
  1. Get user from supabase.auth.getUser()
  2. Fetch organization_id from organization_members table
  3. Prepare message history (last 10 messages)
  4. Call supabase.functions.invoke('omny-chat')
    ↓
omny-chat function:
  1. Get ANTHROPIC_API_KEY from api_keys table
  2. Build system prompt + tool definitions
  3. Call Claude API with messages + tools
  4. Receive stop_reason: 'tool_use' or 'end_turn'
    ↓
If tool_use:
  1. executeTool() routes to handler
  2. Handler queries database based on tool parameters
  3. Return structured result
  4. Return to frontend with tool_use metadata
    ↓
If end_turn:
  1. Extract text response
  2. Return to frontend
    ↓
Frontend handles response:
  1. If tool_use: Format result with emojis/markdown
  2. If text: Display message
  3. If voiceMode: Speak response via TTS
  4. Add to message history
```

### 9.2 Admin Access Flow

```
Admin User
    ↓
AdminLayout or SuperAdminControlCenter
    ↓
AdminOmnyDashboard + AnalyticsDashboard
    ↓
analyticsService methods:
  - getKPIs() → Revenue, Customers, Transactions
  - getTopProducts() → Best rewards
  - getCategoryRevenue() → Revenue by category
  - getCampaignPerformance() → Email metrics
  - getRevenueChart() → Daily trend
  - getCustomerSegmentation() → VIP/Regular/At Risk
  - getAnomalies() → Alert detection
  - getSmartRecommendations() → AI suggestions
```

---

## 10. CONFIGURATION & ENVIRONMENT

### Required Environment Variables

**Frontend** (`.env`):
```
VITE_SUPABASE_URL=https://sjvatdnvewohvswfrdiv.supabase.co
VITE_SUPABASE_ANON_KEY=[supabase-anon-key]
VITE_OMNY_CONTRACT_ADDRESS=0xe62CCDc664993336bB400B725Fb9C0A8Cd1895f4
```

**Backend** (Supabase Secrets):
```
SUPABASE_URL=https://sjvatdnvewohvswfrdiv.supabase.co
SUPABASE_ANON_KEY=[anon-key]
```

**API Keys** (Database `api_keys` table):
```
key_name: 'ANTHROPIC_API_KEY'
key_value: [base64-encoded-api-key]
is_active: true
```

---

## 11. FEATURE LIMITS & PRICING

**Free Tier**: Limited AI rewards generation
**Pro Tier**: Unlimited Omny Assistant access
**Enterprise Tier**: Full customization + dedicated support

**AI Rewards Limits**:
- Checked via RPC: `check_ai_rewards_limit(org_id)`
- Limits vary by plan_id
- Enforced at function level with 403 response

---

## 12. SECURITY CONSIDERATIONS

**API Key Protection**:
- Base64 encoded in database
- Decoded at function runtime only
- Never logged or exposed to frontend
- Verified to start with `sk-` format

**Row-Level Security**:
- All queries filtered by organization_id
- User organization verified via auth header
- RLS policies on all sensitive tables

**CORS Configuration**:
- All Supabase functions allow CORS
- Origin: `*` (consider restricting in production)

---

## 13. TESTING & DEMO MODE

**Frontend Demo Mode**:
```typescript
// aiService.ts
if (this.isDemoMode) {
    return this.getMockResponse(message)  // Hardcoded responses
}
```

**Mock Responses**:
- Analyzes token data
- Proposes marketing campaigns
- Friendly greeting
- Generic responses for unknown queries

**Disabling Demo**:
```typescript
localStorage.removeItem('OMNY_DEMO_MODE')
```

---

## 14. FUTURE ENHANCEMENT OPPORTUNITIES

1. **Multi-language Support**: Extend beyond Italian
2. **Streaming Responses**: Real-time token streaming to frontend
3. **Persistent Chat History**: Save conversations to database
4. **Custom Tool Definitions**: Allow per-organization tool customization
5. **Advanced Segmentation**: ML-based customer clustering
6. **Predictive Analytics**: Churn prediction models
7. **Real Push Notifications**: Integrate OneSignal for actual sending
8. **Tool Execution Confirmation**: User approval flow for sensitive operations
9. **Audit Logging**: Track all tool executions with user/timestamp
10. **Rate Limiting**: Prevent abuse with token-based rate limits

---

## 15. QUICK START FOR DEVELOPERS

### To Enable Omny Assistant:

1. **Set Anthropic API Key**:
   - Go to Admin Panel → System Settings
   - Add API key via AdminAIRewardsPanel
   - Key is stored in `api_keys` table

2. **Test Chat Function**:
   ```bash
   curl -X POST https://[project-id].supabase.co/functions/v1/omny-chat \
     -H "Authorization: Bearer [token]" \
     -H "Content-Type: application/json" \
     -d '{"messages": [{"role": "user", "content": "Ciao"}], "organizationId": "[org-id]"}'
   ```

3. **Access from Frontend**:
   - Click Sparkles icon on any page
   - Chat interface appears
   - Type message or toggle voice mode

4. **Monitor Usage**:
   - Check `ai_rewards_usage` table for generation calls
   - Check `api_keys` table for configuration status
   - Review logs in Supabase edge function logs

---

## 16. REFERENCES

- **Claude API Docs**: https://docs.anthropic.com/
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Web Speech API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- **React Documentation**: https://react.dev/
- **Polygon Network**: https://polygon.technology/

---

**Document Version**: 1.0  
**Last Updated**: December 4, 2024  
**Maintainer**: OMNILY PRO Development Team

