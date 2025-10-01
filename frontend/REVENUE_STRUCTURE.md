# 💰 OMNILY PRO - STRUTTURA REVENUE SEPARATA

## 🎯 **DECISIONE STRATEGICA: DUE REVENUE STREAM SEPARATI**

**Data Decisione**: 1 Ottobre 2025
**Rationale**: Diversa natura business e metriche completamente diverse

---

## 🚛 **REVENUE STREAM 1: HARDWARE ORDERS**

### **📊 Dashboard**: `/admin/hardware-orders`
### **💰 Metrica**: "Revenue Hardware"

#### **🔍 Cosa Include:**
- ✅ **Setup Fees**: €299 per nuovo cliente (una tantum)
- ✅ **Hardware Z108**: €200 per unità venduta
- ✅ **Hardware Aggiuntivo**: €200 per terminali extra
- ✅ **Handling Fees**: €50 per sostituzioni in garanzia
- ✅ **Shipping Costs**: Eventuali costi spedizione

#### **📈 Esempio Calcolo:**
```
Cliente A - Setup Iniziale:
- Setup fee: €299
- Hardware Z108: €200
- TOTALE: €499

Cliente B - Hardware Aggiuntivo:
- Setup fee: €0 (già fatto)
- Hardware Z108 x2: €400
- TOTALE: €400

Cliente C - Sostituzione:
- Setup fee: €0
- Hardware: €0 (garanzia)
- Handling: €50
- TOTALE: €50

REVENUE HARDWARE TOTALE: €949
```

#### **🎯 Caratteristiche:**
- **Pagamento**: Una tantum per ordine
- **Natura**: CAPEX per il cliente
- **Tracking**: Ordini, spedizioni, consegne
- **Metriche**: Total orders, delivery rate, inventory turnover

---

## 💳 **REVENUE STREAM 2: SUBSCRIPTIONS**

### **📊 Dashboard**: `/admin/subscriptions`
### **💰 Metrica**: "MRR/ARR Abbonamenti"

#### **🔍 Cosa Include:**
- ✅ **Basic Plan**: €49/mese per organizzazione
- ✅ **Pro Plan**: €99/mese per organizzazione
- ✅ **Enterprise Plan**: €199/mese per organizzazione
- ✅ **AI Premium Add-on**: €99/mese aggiuntivo
- ✅ **Extra Locations**: Eventuali costi sedi aggiuntive

#### **📈 Esempio Calcolo:**
```
Cliente A - Basic Plan:
- Monthly: €49
- Yearly: €588

Cliente B - Pro Plan:
- Monthly: €99
- Yearly: €1.188

Cliente C - Enterprise + AI:
- Monthly: €199 + €99 = €298
- Yearly: €3.576

MRR TOTALE: €446/mese
ARR TOTALE: €5.352/anno
```

#### **🎯 Caratteristiche:**
- **Pagamento**: Ricorrente mensile/annuale
- **Natura**: OPEX per il cliente
- **Tracking**: Billing cycles, renewals, churn
- **Metriche**: MRR, ARR, churn rate, upgrade rate

---

## 📊 **DASHBOARD ANALYTICS GENERALE**

### **🎯 Nel Main Analytics Dashboard avremo:**

#### **💰 Revenue Overview:**
```
┌─────────────────────────────────┐
│ REVENUE HARDWARE (Una Tantum)  │
│ €949 (3 ordini completati)     │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ MRR ABBONAMENTI (Ricorrente)    │
│ €446/mese (3 clienti attivi)   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ ARR PROIETTATO                  │
│ €5.352/anno                     │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ TOTAL REVENUE YTD 2025          │
│ €949 + (€446 × 9 mesi) = €4.963│
└─────────────────────────────────┘
```

#### **📈 KPI Separati:**
- **Hardware KPI**: Orders, delivery rate, inventory, customer acquisition cost
- **Subscription KPI**: MRR growth, churn rate, ARPU, LTV, renewal rate

---

## 🔄 **INTEGRAZIONE TRA I DUE STREAM**

### **🎯 Customer Journey Completo:**
1. **Ordine Hardware** (€299 setup + €200 Z108) = €499 una tantum
2. **Attivazione Subscription** (€49-199/mese) = Revenue ricorrente
3. **Hardware Aggiuntivo** (€200/unità) = Revenue una tantum extra
4. **Plan Upgrade** (€49→€99/mese) = MRR growth

### **📊 Customer Lifetime Value (2025):**
```
CLV = Hardware Revenue + (MRR × Retention Months)
CLV = €499 + (€99 × 24 mesi) = €2.875
```

---

## ⚠️ **IMPORTANTE: NON MESCOLARE MAI I DUE STREAM**

### **❌ ERRORI DA EVITARE:**
- Non sommare hardware revenue con MRR
- Non calcolare ARR includendo hardware una tantum
- Non fare forecast hardware come se fosse ricorrente
- Non usare churn rate per hardware orders

### **✅ APPROCCIO CORRETTO:**
- Hardware dashboard: Focus su logistica e inventory
- Subscription dashboard: Focus su recurring revenue e retention
- Analytics generale: Mostra entrambi separatamente ma correlati

---

## 🎯 **DECISIONE FINALE**

**MANTENIAMO SEMPRE SEPARATI:**
- `/admin/hardware-orders` → Revenue Hardware
- `/admin/subscriptions` → Revenue Abbonamenti
- `/admin/analytics` → Overview di entrambi (separati)

**RATIONALE:**
- Business logic diversa
- Metriche diverse
- Gestione operativa diversa
- Forecasting diverso
- Customer value diverso

---

## 🚀 **PROIEZIONI 2025**

### **Target Q4 2025:**
- **Hardware Orders**: 50 ordini → €25.000 revenue
- **MRR**: €2.500/mese → €30.000 ARR
- **Total Business Value**: €55.000 entro fine 2025

---

**📝 Nota**: Questo documento serve come riferimento per tutto il team di sviluppo per mantenere coerenza nella gestione dei due revenue stream separati.

**Ultima Revisione**: 1 Ottobre 2025