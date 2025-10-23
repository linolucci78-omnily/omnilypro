# Struttura Completa Website Builder per Attività Locali

## 🎯 Target Clienti
- Ristoranti, Pizzerie, Bar
- Parrucchieri, Barbieri, Centri Estetici
- Palestre, Personal Trainer
- Panetterie, Pasticcerie
- Negozi Alimentari
- Negozi locali
- Qualsiasi attività che vuole **fidelizzare i clienti**

---

## 📊 Architettura Database

```
organizations_websites (Sito)
  ↓
website_pages (Pagine: Home, Chi Siamo, Menu, Contatti, ecc.)
  ↓
page_sections (Sezioni: Hero, Gallery, Menu, Orari, Form, ecc.)
  ↓
section_components (Contenuti modificabili dal cliente)
```

---

# COLLECTION 1: `organizations_websites`

**Già creata ✅**

Rappresenta il sito web dell'attività.

### Campi:
- `id` - Auto
- `organization_id` - ID organizzazione
- `site_name` - Nome del sito
- `domain` - Dominio custom
- `published` - Pubblicato
- `created_at` - Data creazione

---

# COLLECTION 2: `website_pages`

**Già creata ✅**

Le pagine del sito.

### Campi:
- `id` - Auto
- `website_id` - Relazione M2O a organizations_websites
- `page_name` - Nome pagina
- `slug` - URL slug
- `title` - SEO Title
- `meta_description` - Meta description
- `is_homepage` - È homepage?
- `published` - Pubblicata
- `sort_order` - Ordine menu
- `created_at`
- `updated_at`

---

# COLLECTION 3: `page_sections`

**DA CREARE ORA**

Le sezioni che compongono ogni pagina.

## CAMPI DA CREARE:

### 1. Relazioni e Info Base

#### `page_id` (M2O)
- **Type**: Many to One
- **Related Collection**: `website_pages`
- **Required**: ✅ Sì

#### `section_type` (String - Dropdown)
- **Type**: String
- **Interface**: Dropdown
- **Choices**:
  - `hero` → Hero/Banner principale
  - `about` → Chi Siamo
  - `services` → Servizi/Prodotti
  - `menu_food` → Menu Ristorante
  - `menu_prices` → Listino Prezzi
  - `gallery` → Galleria Foto
  - `team` → Il Nostro Team
  - `testimonials` → Recensioni Clienti
  - `features` → Caratteristiche/Vantaggi
  - `hours` → Orari Apertura
  - `location` → Dove Siamo (Mappa)
  - `contact_form` → Form Contatto
  - `booking_form` → Form Prenotazione
  - `cta` → Call to Action
  - `promotions` → Offerte/Promozioni
  - `newsletter` → Iscrizione Newsletter
  - `social` → Social Media
  - `footer` → Footer
  - `custom` → Sezione Custom
- **Required**: ✅ Sì

#### `section_name` (String)
- **Type**: String
- **Interface**: Input
- **Placeholder**: "Hero Homepage", "Menu Pizze"
- **Required**: ✅ Sì
- **Note**: Nome interno, non visibile al pubblico

#### `section_title` (String)
- **Type**: String
- **Interface**: Input
- **Placeholder**: "Benvenuti nel nostro ristorante"
- **Note**: Titolo visibile nella sezione (modificabile dal cliente)

#### `section_subtitle` (Text)
- **Type**: Text
- **Interface**: Textarea
- **Placeholder**: "Dal 1985 portiamo la tradizione sulla tua tavola"
- **Note**: Sottotitolo/descrizione (modificabile dal cliente)

#### `sort_order` (Integer)
- **Type**: Integer
- **Default**: 1
- **Required**: ✅ Sì

#### `visible` (Boolean)
- **Type**: Boolean
- **Interface**: Toggle
- **Default**: true

---

### 2. Background e Stile

#### `background_type` (String - Dropdown)
- **Choices**:
  - `none` → Trasparente
  - `solid` → Colore solido
  - `gradient` → Gradiente
  - `image` → Immagine
  - `video` → Video
  - `pattern` → Pattern
- **Default**: `solid`

#### `background_color` (String)
- **Placeholder**: "#ffffff" o "bg-white"
- **Default**: "#ffffff"

#### `background_image` (File/Image)
- **Type**: File (o UUID per Directus Files)
- **Interface**: Image

#### `background_video_url` (String)
- **Placeholder**: "https://youtube.com/..." o URL video

#### `background_gradient` (String)
- **Interface**: Textarea
- **Placeholder**: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"

#### `background_overlay` (Boolean)
- **Default**: false
- **Note**: Overlay scuro sull'immagine di sfondo

#### `background_overlay_opacity` (Integer)
- **Default**: 50
- **Note**: Opacità overlay (0-100)

---

### 3. Layout e Spacing

#### `container_width` (String - Dropdown)
- **Choices**:
  - `full` → Full width (100%)
  - `wide` → Wide (1400px)
  - `normal` → Normal (1200px)
  - `narrow` → Narrow (900px)
  - `extra_narrow` → Extra Narrow (700px)
- **Default**: `normal`

#### `padding_top` (String - Dropdown)
- **Choices**:
  - `none` → 0
  - `small` → 2rem
  - `medium` → 4rem
  - `large` → 6rem
  - `xlarge` → 8rem
  - `xxlarge` → 12rem
- **Default**: `medium`

#### `padding_bottom` (String - Dropdown)
- **Choices**: (stesso di padding_top)
- **Default**: `medium`

#### `full_height` (Boolean)
- **Default**: false
- **Note**: Sezione a schermo intero (100vh)

#### `layout_style` (String - Dropdown)
- **Choices**:
  - `centered` → Centrato
  - `left_aligned` → Sinistra
  - `right_aligned` → Destra
  - `split_50_50` → Split 50/50
  - `split_60_40` → Split 60/40 sinistra
  - `split_40_60` → Split 40/60 destra
  - `split_70_30` → Split 70/30
  - `grid_2_cols` → Griglia 2 colonne
  - `grid_3_cols` → Griglia 3 colonne
  - `grid_4_cols` → Griglia 4 colonne
  - `masonry` → Masonry layout
- **Default**: `centered`

---

### 4. Tipografia e Colori

#### `text_align` (String - Dropdown)
- **Choices**:
  - `left` → Sinistra
  - `center` → Centro
  - `right` → Destra
- **Default**: `left`

#### `text_color` (String)
- **Placeholder**: "#000000" o "text-gray-900"
- **Default**: "#000000"

#### `heading_size` (String - Dropdown)
- **Choices**:
  - `small` → Small
  - `medium` → Medium
  - `large` → Large
  - `xlarge` → Extra Large
  - `xxlarge` → XXL
- **Default**: `large`

#### `heading_color` (String)
- **Default**: "#000000"

#### `font_family` (String - Dropdown)
- **Choices**:
  - `default` → Default
  - `serif` → Serif (elegante)
  - `sans` → Sans-serif (moderno)
  - `mono` → Monospace
  - `display` → Display (decorativo)
- **Default**: `default`

---

### 5. Animazioni ed Effetti

#### `animation_type` (String - Dropdown)
- **Choices**:
  - `none` → Nessuna
  - `fade_in` → Fade In
  - `fade_up` → Fade Up
  - `fade_down` → Fade Down
  - `slide_up` → Slide Up
  - `slide_left` → Slide Left
  - `slide_right` → Slide Right
  - `zoom_in` → Zoom In
  - `zoom_out` → Zoom Out
  - `bounce` → Bounce
  - `flip` → Flip
- **Default**: `fade_in`

#### `animation_delay` (Integer)
- **Default**: 0
- **Note**: Millisecondi

#### `animation_duration` (Integer)
- **Default**: 600
- **Note**: Millisecondi

#### `enable_parallax` (Boolean)
- **Default**: false

#### `parallax_speed` (Integer)
- **Default**: 50
- **Note**: Velocità parallax (0-100)

---

### 6. Interattività per Attività Locali

#### `enable_booking` (Boolean)
- **Default**: false
- **Note**: Mostra bottone prenotazione

#### `booking_button_text` (String)
- **Placeholder**: "Prenota Ora", "Prenota un Tavolo"
- **Default**: "Prenota"

#### `booking_url` (String)
- **Placeholder**: URL form prenotazione o link esterno

#### `enable_menu_download` (Boolean)
- **Default**: false
- **Note**: Per ristoranti - scarica menu PDF

#### `menu_pdf_file` (File)
- **Type**: File
- **Note**: File PDF del menu

#### `show_phone_cta` (Boolean)
- **Default**: false
- **Note**: Mostra bottone "Chiama Ora"

#### `phone_number` (String)
- **Placeholder**: "+39 123 456 7890"

#### `show_whatsapp_cta` (Boolean)
- **Default**: false

#### `whatsapp_number` (String)
- **Placeholder**: "+39 123 456 7890"

#### `show_directions_cta` (Boolean)
- **Default**: false
- **Note**: Link a Google Maps

#### `google_maps_url` (String)
- **Placeholder**: Link Google Maps

---

### 7. SEO e Tecnico

#### `custom_id` (String)
- **Placeholder**: "hero-section", "menu-section"
- **Note**: ID HTML per anchor links

#### `css_classes` (String)
- **Placeholder**: "custom-hero bg-gradient"
- **Note**: Classi CSS custom

#### `custom_css` (Text)
- **Interface**: Code (CSS)
- **Note**: CSS personalizzato per questa sezione

#### `custom_js` (Text)
- **Interface**: Code (JavaScript)
- **Note**: JavaScript personalizzato

#### `schema_markup` (JSON)
- **Type**: JSON
- **Note**: Schema.org markup per SEO

---

### 8. Impostazioni Avanzate

#### `settings` (JSON)
- **Type**: JSON
- **Note**: Configurazioni extra come:
  ```json
  {
    "columns": 3,
    "image_aspect_ratio": "16:9",
    "gallery_lightbox": true,
    "autoplay": true,
    "loop": true,
    "show_navigation": true,
    "items_per_row": 4,
    "enable_filter": true,
    "filter_categories": ["Pizze", "Pasta", "Dolci"]
  }
  ```

---

### 9. Contenuto Specifico per Ristoranti/Bar

#### `show_allergens` (Boolean)
- **Default**: false
- **Note**: Mostra allergeni nei menu

#### `allergens_text` (Text)
- **Note**: Testo allergeni/disclaimer

---

### 10. Sistema

#### `created_at` (Timestamp)
- **On Create**: Save Current Date/Time

#### `updated_at` (Timestamp)
- **On Create**: Save Current Date/Time
- **On Update**: Save Current Date/Time

#### `created_by` (User - M2O)
- **Related Collection**: directus_users
- **Note**: Chi ha creato la sezione

---

# COLLECTION 4: `section_components`

**I CONTENUTI MODIFICABILI DAL CLIENTE**

Questa è la collection più importante! Ogni componente è un pezzo di contenuto che il cliente può modificare.

## CAMPI DA CREARE:

### 1. Relazioni

#### `section_id` (M2O)
- **Type**: Many to One
- **Related Collection**: `page_sections`
- **Required**: ✅ Sì

---

### 2. Tipo Componente

#### `component_type` (String - Dropdown)
- **Choices**:
  - `text` → Testo semplice
  - `rich_text` → Testo ricco (HTML)
  - `heading` → Titolo/Heading
  - `paragraph` → Paragrafo
  - `image` → Immagine singola
  - `image_gallery` → Galleria immagini
  - `video` → Video
  - `button` → Bottone/CTA
  - `icon` → Icona
  - `icon_text` → Icona + Testo
  - `list` → Lista puntata
  - `table` → Tabella
  - `menu_item` → Item menu ristorante
  - `price_item` → Item con prezzo
  - `team_member` → Membro team
  - `testimonial` → Recensione
  - `feature_card` → Card caratteristica
  - `service_card` → Card servizio
  - `product_card` → Card prodotto
  - `hours_table` → Tabella orari
  - `contact_info` → Info contatto
  - `social_links` → Link social
  - `map` → Mappa
  - `form_field` → Campo form
  - `divider` → Separatore
  - `spacer` → Spaziatore
  - `html` → HTML custom
- **Required**: ✅ Sì

#### `component_label` (String)
- **Placeholder**: "Titolo Principale", "Descrizione Servizio"
- **Required**: ✅ Sì
- **Note**: Label per il cliente (cosa sta modificando)

---

### 3. Contenuti Testuali

#### `content_text` (Text)
- **Interface**: Textarea
- **Note**: Testo breve

#### `content_rich_text` (Text)
- **Interface**: WYSIWYG / Rich Text Editor
- **Note**: Testo con formattazione HTML

#### `content_html` (Text)
- **Interface**: Code (HTML)
- **Note**: HTML custom

---

### 4. Contenuti Media

#### `content_image` (File)
- **Type**: File/Image
- **Interface**: Image

#### `content_images` (Files - O2M)
- **Type**: One to Many
- **Related Collection**: `directus_files`
- **Note**: Galleria multiple immagini

#### `image_alt_text` (String)
- **Note**: Alt text per SEO

#### `content_video_url` (String)
- **Placeholder**: URL YouTube, Vimeo, o file

#### `content_icon` (String)
- **Placeholder**: "fa-phone", "heroicon-mail"
- **Note**: Nome icona (Font Awesome, Heroicons, ecc.)

---

### 5. Link e CTA

#### `content_link_url` (String)
- **Placeholder**: "/menu", "https://...", "#contact"

#### `content_link_text` (String)
- **Placeholder**: "Scopri di più", "Prenota ora"

#### `link_target` (String - Dropdown)
- **Choices**:
  - `_self` → Stessa finestra
  - `_blank` → Nuova finestra
- **Default**: `_self`

#### `button_style` (String - Dropdown)
- **Choices**:
  - `primary` → Primario
  - `secondary` → Secondario
  - `outline` → Outline
  - `ghost` → Ghost
  - `link` → Solo testo
- **Default**: `primary`

#### `button_size` (String - Dropdown)
- **Choices**:
  - `small` → Small
  - `medium` → Medium
  - `large` → Large
- **Default**: `medium`

---

### 6. Contenuti Specifici (Menu, Prezzi, Team)

#### `item_name` (String)
- **Placeholder**: "Margherita", "Taglio Donna"
- **Note**: Nome prodotto/servizio

#### `item_description` (Text)
- **Note**: Descrizione prodotto

#### `item_price` (Decimal)
- **Type**: Decimal
- **Note**: Prezzo

#### `item_price_label` (String)
- **Placeholder**: "€", "da €", "a partire da €"
- **Default**: "€"

#### `item_currency` (String)
- **Default**: "EUR"

#### `item_ingredients` (Text)
- **Note**: Ingredienti (per menu ristorante)

#### `item_allergens` (String)
- **Note**: Allergeni

#### `item_tags` (Tags)
- **Interface**: Tags
- **Note**: Tag filtrabili (es: "Vegetariano", "Piccante", "Gluten-free")

#### `item_image` (File)
- **Note**: Immagine prodotto/piatto

#### `item_popular` (Boolean)
- **Default**: false
- **Note**: Evidenzia come "Popolare" o "Best Seller"

---

### 7. Team Member (Per sezioni Team/Staff)

#### `person_name` (String)
- **Note**: Nome persona

#### `person_role` (String)
- **Placeholder**: "Chef", "Parrucchiere Senior"

#### `person_bio` (Text)
- **Note**: Biografia breve

#### `person_photo` (File)
- **Note**: Foto profilo

#### `person_email` (String)

#### `person_phone` (String)

#### `person_social_links` (JSON)
- **Note**: Link social della persona

---

### 8. Recensione/Testimonial

#### `testimonial_text` (Text)
- **Note**: Testo recensione

#### `testimonial_author` (String)
- **Note**: Nome cliente

#### `testimonial_role` (String)
- **Placeholder**: "Cliente dal 2020"

#### `testimonial_rating` (Integer)
- **Default**: 5
- **Note**: Stelle (1-5)

#### `testimonial_photo` (File)
- **Note**: Foto cliente

---

### 9. Orari Apertura

#### `day_name` (String - Dropdown)
- **Choices**: Lunedì, Martedì, Mercoledì, Giovedì, Venerdì, Sabato, Domenica

#### `opening_time` (String)
- **Placeholder**: "09:00"

#### `closing_time` (String)
- **Placeholder**: "18:00"

#### `is_closed` (Boolean)
- **Default**: false
- **Note**: Giorno di chiusura

#### `special_hours_note` (String)
- **Placeholder**: "Pausa pranzo 13:00-15:00"

---

### 10. Info Contatto

#### `contact_type` (String - Dropdown)
- **Choices**:
  - `phone` → Telefono
  - `email` → Email
  - `address` → Indirizzo
  - `whatsapp` → WhatsApp
  - `social` → Social Media

#### `contact_label` (String)
- **Placeholder**: "Telefono", "Email"

#### `contact_value` (String)
- **Placeholder**: "+39 123...", "info@...", "Via..."

#### `contact_icon` (String)

---

### 11. Layout e Stile

#### `width` (String - Dropdown)
- **Choices**:
  - `full` → 100%
  - `half` → 50%
  - `third` → 33%
  - `quarter` → 25%
  - `two_thirds` → 66%
  - `auto` → Auto
- **Default**: `full`

#### `alignment` (String - Dropdown)
- **Choices**: left, center, right
- **Default**: `left`

#### `text_color` (String)

#### `background_color` (String)

#### `border_radius` (String - Dropdown)
- **Choices**: none, small, medium, large, full
- **Default**: `medium`

#### `shadow` (String - Dropdown)
- **Choices**: none, small, medium, large
- **Default**: `none`

---

### 12. Ordine e Visibilità

#### `sort_order` (Integer)
- **Default**: 1

#### `visible` (Boolean)
- **Default**: true

#### `visible_on_mobile` (Boolean)
- **Default**: true

#### `visible_on_tablet` (Boolean)
- **Default**: true

#### `visible_on_desktop` (Boolean)
- **Default**: true

---

### 13. Animazioni

#### `animation_type` (String - Dropdown)
- **Choices**: (stesso di page_sections)
- **Default**: `fade_in`

#### `animation_delay` (Integer)
- **Default**: 0

---

### 14. Metadati e Custom

#### `custom_classes` (String)

#### `custom_attributes` (JSON)
- **Note**: Attributi HTML custom

#### `settings` (JSON)
- **Note**: Configurazioni extra

---

### 15. Sistema

#### `created_at` (Timestamp)
- **On Create**: Save Current Date/Time

#### `updated_at` (Timestamp)
- **On Create**: Save Current Date/Time
- **On Update**: Save Current Date/Time

#### `editable_by_client` (Boolean)
- **Default**: true
- **Note**: Se false, solo tu puoi modificarlo

#### `help_text` (String)
- **Note**: Aiuto per il cliente su cosa inserire

---

# COLLECTION 5: `website_templates` (OPZIONALE MA CONSIGLIATA)

Template predefiniti per velocizzare la creazione.

## CAMPI:

#### `template_name` (String)
- **Example**: "Ristorante Italiano", "Parrucchiere Moderno"

#### `template_category` (String - Dropdown)
- **Choices**: restaurant, salon, gym, bakery, shop, generic

#### `template_description` (Text)

#### `template_thumbnail` (File)

#### `template_data` (JSON)
- **Note**: Configurazione completa del template

#### `is_active` (Boolean)

#### `sort_order` (Integer)

---

# ESEMPI DI SEZIONI PER DIVERSI TIPI DI ATTIVITÀ

## 🍕 RISTORANTE

### Homepage:
1. **Hero** - Foto piatto principale + CTA "Prenota"
2. **About** - Storia del ristorante
3. **Menu Highlights** - Piatti speciali
4. **Gallery** - Foto piatti e locale
5. **Testimonials** - Recensioni
6. **Hours** - Orari apertura
7. **Location** - Mappa + indirizzo
8. **Footer**

### Pagina Menu:
1. **Hero Menu** - Foto cucina
2. **Menu Section** - Antipasti (con items, prezzi, allergeni)
3. **Menu Section** - Primi
4. **Menu Section** - Secondi
5. **Menu Section** - Dolci
6. **Menu Section** - Bevande
7. **CTA** - Prenota un tavolo

---

## ✂️ PARRUCCHIERE

### Homepage:
1. **Hero** - Foto salone + CTA "Prenota"
2. **About** - Chi siamo
3. **Services** - Servizi con prezzi
4. **Team** - Il nostro staff
5. **Gallery** - Before/After
6. **Testimonials**
7. **Hours** - Orari
8. **Booking Form**
9. **Footer**

---

## 🏋️ PALESTRA

### Homepage:
1. **Hero** - Video palestra
2. **About** - La nostra missione
3. **Services** - Corsi e abbonamenti
4. **Features** - Attrezzature
5. **Team** - Personal trainer
6. **Hours** - Orari corsi
7. **Pricing** - Listino abbonamenti
8. **CTA** - Prova gratuita
9. **Footer**

---

## 🥖 PANETTERIA

### Homepage:
1. **Hero** - Foto pane appena sfornato
2. **About** - Tradizione artigianale
3. **Products** - I nostri prodotti
4. **Gallery** - Foto prodotti
5. **Daily Specials** - Specialità del giorno
6. **Hours** - Orari
7. **Location**
8. **Footer**

---

# INTEGRAZIONE CON CRM OMNILYPRO

## Campi Aggiuntivi per Fidelizzazione:

### In `section_components` aggiungi:

#### `enable_loyalty_points` (Boolean)
- **Note**: Mostra punti fedeltà per questo prodotto/servizio

#### `loyalty_points` (Integer)
- **Note**: Punti assegnati

#### `requires_login` (Boolean)
- **Note**: Richiede login cliente per accedere

#### `crm_product_id` (String)
- **Note**: Collega al prodotto nel CRM OmnilyPro

#### `crm_service_id` (String)
- **Note**: Collega al servizio nel CRM

#### `enable_booking_integration` (Boolean)
- **Note**: Integra con sistema prenotazioni CRM

---

# API ENDPOINTS FINALI

```javascript
// Ottenere sito completo con tutte le sezioni e componenti
GET /items/organizations_websites/:id?fields=*,pages.*,pages.sections.*,pages.sections.components.*

// Solo pagine pubblicate con sezioni visibili
GET /items/website_pages?filter[website_id][_eq]=1&filter[published][_eq]=true&fields=*,sections.*&filter[sections][visible][_eq]=true&sort=sort_order

// Componenti modificabili da un cliente specifico
GET /items/section_components?filter[editable_by_client][_eq]=true&filter[section_id][_eq]=5
```

---

# SUMMARY

## Collections Create:
1. ✅ `organizations_websites` (già fatto)
2. ✅ `website_pages` (già fatto)
3. 🔄 `page_sections` (da creare con 50+ campi)
4. 🔄 `section_components` (da creare con 80+ campi)
5. 📦 `website_templates` (opzionale)

## Totale Campi: ~150 campi
## Flessibilità: MASSIMA ✅
## Professionalità: ALTA ✅
## Adatto per attività locali: PERFETTO ✅

---

**Questo è un sistema COMPLETO e PROFESSIONALE per creare siti web per qualsiasi attività locale!** 🚀

Vuoi che inizi a creare le collections su Directus passo passo? O preferisci che semplifichi qualcosa?
