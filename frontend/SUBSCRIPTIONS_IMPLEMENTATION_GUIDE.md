# Subscriptions System - Implementation Guide

## ✅ Completed Components

### Phase 1: Database & Backend (DONE)
- `database/migrations/040_create_subscriptions_system.sql` - Complete database schema
- `src/types/subscription.ts` - All TypeScript types
- `src/services/subscriptionsService.ts` - Full service layer with validation

### Phase 2a: UI Components (DONE)
- `src/components/SubscriptionsPanel.tsx` - Main panel with 3 tabs
- `src/components/SubscriptionsPanel.css` - Complete styling

## 🚧 Components To Implement

### 1. SellSubscriptionModal

Modal for selling subscriptions to customers at POS.

**Location**: `src/components/SellSubscriptionModal.tsx`

**Props**:
```typescript
interface SellSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  templates: SubscriptionTemplate[];
  onSuccess: (subscription: CustomerSubscription) => void;
  printService?: any;
}
```

**Flow**:
1. Select customer (search existing or create new)
2. Select subscription template from list
3. Show template details (price, duration, limits)
4. Confirm payment method
5. Create subscription via `subscriptionsService.createSubscription()`
6. Print voucher with QR code
7. Show success message

**Key Features**:
- Customer search/create
- Template selection cards
- Payment method selector (cash, card, wallet)
- Price confirmation
- QR code generation for subscription code
- Print integration

### 2. ValidateSubscriptionModal

Modal for validating and using subscriptions at POS.

**Location**: `src/components/ValidateSubscriptionModal.tsx`

**Props**:
```typescript
interface ValidateSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onSuccess: () => void;
  printService?: any;
}
```

**Flow**:
1. Scan QR code or enter subscription code manually
2. Call `subscriptionsService.validateSubscription()`
3. Show subscription details and status
4. If valid, show "Use Subscription" button
5. Select item/service being used
6. Confirm usage via `subscriptionsService.useSubscription()`
7. Update usage counter
8. Print receipt (optional)

**Key Features**:
- QR code scanner integration
- Manual code input
- Validation status display (valid/invalid with reason)
- Remaining uses counter
- Item/service selection
- Usage confirmation

### 3. CreateTemplateModal

Modal for admin to create subscription templates.

**Location**: `src/components/CreateTemplateModal.tsx`

**Props**:
```typescript
interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onSuccess: (template: SubscriptionTemplate) => void;
}
```

**Form Fields**:
```typescript
{
  // Basic Info
  name: string;                    // "Pizza Settimanale"
  description: string;             // "1 pizza al giorno per 7 giorni"

  // Type & Duration
  subscription_type: SubscriptionType;  // daily_item, daily_multiple, etc.
  duration_type: DurationType;          // days, weeks, months, years
  duration_value: number;               // 7, 1, 3, etc.

  // Limits
  daily_limit?: number;            // max uses per day
  weekly_limit?: number;           // max uses per week
  total_limit?: number;            // max total uses

  // Item Restrictions
  included_categories: string[];   // ["pizze", "bevande"]
  excluded_categories: string[];   // ["alcool"]
  max_price_per_item?: number;     // max price per item

  // Time Restrictions
  allowed_hours?: {start: string, end: string};  // "18:00" - "22:00"
  allowed_days?: AllowedDay[];     // ["monday", "tuesday", ...]

  // Pricing
  price: number;                   // 35.00
  original_price?: number;         // 49.00 (for showing savings)

  // Settings
  auto_renewable: boolean;
  renewable_manually: boolean;
  visibility: SubscriptionVisibility;  // public, hidden, vip_only

  // UI
  color?: string;                  // #FF6B6B
  badge_text?: string;             // "BEST VALUE"
  image_url?: string;
}
```

**Flow**:
1. Multi-step wizard form
2. Step 1: Basic info (name, description, type)
3. Step 2: Duration and limits
4. Step 3: Item restrictions (categories, prices)
5. Step 4: Time restrictions (hours, days)
6. Step 5: Pricing and settings
7. Preview template
8. Create via `subscriptionsService.createTemplate()`

### 4. Print Support

Add to `src/services/printService.ts`:

```typescript
/**
 * Print subscription voucher/card
 */
async printSubscriptionVoucher(data: {
  subscription_code: string;
  customer_name: string;
  template_name: string;
  start_date: string;
  end_date: string;
  daily_limit?: number;
  total_limit?: number;
  organizationName: string;
}): Promise<boolean> {
  if (!this.isInitialized) {
    console.error('Printer not initialized');
    return false;
  }

  try {
    const lines: string[] = [
      '',
      this.centerText('🎫 ABBONAMENTO 🎫'),
      this.centerText(data.organizationName),
      this.createSeparatorLine(),
      '',
      `Codice: ${data.subscription_code}`,
      `Cliente: ${data.customer_name}`,
      `Abbonamento: ${data.template_name}`,
      '',
      this.createSeparatorLine(),
      `Valido da: ${this.formatDateTime(new Date(data.start_date))}`,
      `Valido fino: ${this.formatDateTime(new Date(data.end_date))}`,
      '',
    ];

    if (data.daily_limit) {
      lines.push(`Limite giornaliero: ${data.daily_limit} utilizzi`);
    }

    if (data.total_limit) {
      lines.push(`Limite totale: ${data.total_limit} utilizzi`);
    }

    lines.push('');
    lines.push(this.createSeparatorLine());
    lines.push(this.centerText('Presenta questo voucher'));
    lines.push(this.centerText('per utilizzare l\'abbonamento'));
    lines.push('');

    const headerText = lines.join('\n');

    return new Promise((resolve) => {
      (window as any).omnilySubPrintHandler = (result: any) => {
        if (result.success) {
          // Print QR code
          const qrData = `SUB:${data.subscription_code}`;

          (window as any).omnilySubQRHandler = (qrResult: any) => {
            if (qrResult.success) {
              console.log('Subscription voucher printed successfully');
              resolve(true);
            } else {
              console.error('QR code print failed:', qrResult.error);
              resolve(false);
            }
          };

          (window as any).OmnilyPOS.printQRCode(qrData, 'omnilySubQRHandler');
        } else {
          console.error('Subscription voucher print failed:', result.error);
          resolve(false);
        }
      };

      (window as any).OmnilyPOS.printText(headerText, 'omnilySubPrintHandler');
    });
  } catch (error) {
    console.error('Print error:', error);
    return false;
  }
}

/**
 * Print subscription usage receipt
 */
async printSubscriptionUsage(data: {
  subscription_code: string;
  customer_name: string;
  template_name: string;
  item_name: string;
  remaining_daily?: number;
  remaining_total?: number;
  cashier: string;
  organizationName: string;
}): Promise<boolean> {
  if (!this.isInitialized) {
    console.error('Printer not initialized');
    return false;
  }

  try {
    const lines: string[] = [
      '',
      this.centerText('UTILIZZO ABBONAMENTO'),
      this.centerText(data.organizationName),
      this.createSeparatorLine(),
      '',
      `Ricevuta: ${Date.now()}`,
      `Data: ${this.formatDateTime(new Date())}`,
      `Cassiere: ${data.cashier}`,
      '',
      this.createSeparatorLine(),
      `Codice: ${data.subscription_code}`,
      `Cliente: ${data.customer_name}`,
      `Abbonamento: ${data.template_name}`,
      '',
      this.createSeparatorLine(),
      'ARTICOLO UTILIZZATO',
      `${data.item_name}`,
      '',
      this.createSeparatorLine(),
    ];

    if (data.remaining_daily !== undefined) {
      lines.push(`Utilizzi rimanenti oggi: ${data.remaining_daily}`);
    }

    if (data.remaining_total !== undefined) {
      lines.push(`Utilizzi rimanenti totali: ${data.remaining_total}`);
    }

    lines.push('');
    lines.push(this.centerText('Grazie!'));
    lines.push('');

    const receiptText = lines.join('\n');

    return new Promise((resolve) => {
      (window as any).omnilySubUsagePrintHandler = (result: any) => {
        if (result.success) {
          console.log('Subscription usage receipt printed');
          resolve(true);
        } else {
          console.error('Receipt print failed:', result.error);
          resolve(false);
        }
      };

      (window as any).OmnilyPOS.printText(receiptText, 'omnilySubUsagePrintHandler');
    });
  } catch (error) {
    console.error('Print error:', error);
    return false;
  }
}
```

## 🔗 Integration Steps

### 1. Add to OrganizationsDashboard

In `src/components/OrganizationsDashboard.tsx`:

```typescript
// Add import
import SubscriptionsPanel from './SubscriptionsPanel';

// Add state
const [showSubscriptionsPanel, setShowSubscriptionsPanel] = useState(false);

// Add to render
<SubscriptionsPanel
  isOpen={showSubscriptionsPanel}
  onClose={() => setShowSubscriptionsPanel(false)}
  organizationId={currentOrganization?.id || ''}
  organizationName={currentOrganization?.name || ''}
  printService={printService}
/>

// Add menu item in dashboard
<button
  className="feature-card"
  onClick={() => setShowSubscriptionsPanel(true)}
>
  <Package size={32} />
  <h3>Abbonamenti</h3>
  <p>Gestisci abbonamenti e subscription</p>
</button>
```

### 2. Run Database Migration

In Supabase SQL Editor:
```sql
-- Run the migration
\i frontend/database/migrations/040_create_subscriptions_system.sql
```

### 3. Test Data (Optional)

Create sample templates for testing:

```sql
-- Sample: Pizzeria - Pizza Settimanale
INSERT INTO subscription_templates (
  organization_id,
  name,
  description,
  subscription_type,
  duration_type,
  duration_value,
  daily_limit,
  included_categories,
  price,
  original_price,
  is_active
) VALUES (
  'your-org-id',
  'Pizza Settimanale',
  '1 pizza al giorno per 7 giorni',
  'daily_item',
  'weeks',
  1,
  1,
  '["pizze"]'::jsonb,
  35.00,
  49.00,
  true
);

-- Sample: Bar - Coffee Club
INSERT INTO subscription_templates (
  organization_id,
  name,
  description,
  subscription_type,
  duration_type,
  duration_value,
  daily_limit,
  included_items,
  price,
  original_price,
  is_active
) VALUES (
  'your-org-id',
  'Coffee Lover',
  '3 caffè al giorno per 1 mese',
  'daily_multiple',
  'months',
  1,
  3,
  '[{"name": "Caffè Espresso"}, {"name": "Cappuccino"}]'::jsonb,
  90.00,
  135.00,
  true
);
```

## 📝 Testing Checklist

### Template Management
- [ ] Create new template
- [ ] Edit existing template
- [ ] Delete template (should fail if active subscriptions)
- [ ] View template list
- [ ] Filter templates

### Subscription Sales
- [ ] Sell subscription to existing customer
- [ ] Sell subscription to new customer
- [ ] Print voucher with QR code
- [ ] Verify subscription code generation

### Subscription Usage
- [ ] Validate subscription by QR code
- [ ] Validate subscription by manual code entry
- [ ] Use subscription (deduct usage)
- [ ] Check daily limit enforcement
- [ ] Check total limit enforcement
- [ ] Check category restrictions
- [ ] Check time restrictions
- [ ] Print usage receipt

### Statistics
- [ ] View active subscriptions count
- [ ] View total revenue
- [ ] View total usages
- [ ] View expiring subscriptions

### Edge Cases
- [ ] Try to use expired subscription
- [ ] Try to use paused subscription
- [ ] Try to use cancelled subscription
- [ ] Try to exceed daily limit
- [ ] Try to exceed total limit
- [ ] Try to use on restricted day/time
- [ ] Try to use wrong category item

## 🎨 UI/UX Considerations

1. **Colors**: Purple gradient theme (#667eea → #764ba2)
2. **Icons**: Package icon for subscriptions
3. **Status Badges**: Green (active), Orange (paused), Gray (expired), Red (cancelled)
4. **Responsive**: Works on desktop (600px) and mobile (100vw)
5. **Animations**: Smooth transitions and hover effects

## 🚀 Future Enhancements

1. **Auto-Renewal**: Automatic subscription renewal with payment
2. **Email Notifications**: Send expiry reminders
3. **Customer App**: Let customers view their subscriptions
4. **Usage Analytics**: Detailed usage reports and trends
5. **Referral System**: Discount for referring friends
6. **Family Plans**: Multiple users on single subscription
7. **Pause Feature**: Allow temporary pause (vacation mode)
8. **Transfer Feature**: Transfer subscription to another customer

## 📚 Resources

- Service: `src/services/subscriptionsService.ts`
- Types: `src/types/subscription.ts`
- Database: `database/migrations/040_create_subscriptions_system.sql`
- Examples: See examples in this guide

---

Generated for Omnily PRO - Universal Subscriptions System
