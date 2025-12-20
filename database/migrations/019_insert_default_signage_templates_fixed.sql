-- Migration: Insert Default Signage Templates
-- Description: Pre-built templates for different use cases

-- Full Screen Image Template
INSERT INTO signage_templates (
    organization_id,
    name,
    description,
    category,
    is_public,
    is_premium,
    layout_config,
    default_content
) VALUES (
    NULL, -- Global template
    'Immagine Full Screen',
    'Mostra un immagine a tutto schermo',
    'basic',
    TRUE,
    FALSE,
    '{"zones": [{"id": "main-image", "type": "image", "x": 0, "y": 0, "width": 100, "height": 100}]}'::jsonb,
    '{"zones": [{"id": "main-image", "type": "image", "content": "", "style": {}}]}'::jsonb
);

-- Headline + Image Template
INSERT INTO signage_templates (
    organization_id,
    name,
    description,
    category,
    is_public,
    is_premium,
    layout_config,
    default_content
) VALUES (
    NULL,
    'Titolo + Immagine',
    'Titolo sopra con immagine sotto',
    'promo',
    TRUE,
    FALSE,
    '{"zones": [{"id": "headline", "type": "text", "x": 0, "y": 0, "width": 100, "height": 20}, {"id": "main-image", "type": "image", "x": 0, "y": 20, "width": 100, "height": 80}]}'::jsonb,
    '{"zones": [{"id": "headline", "type": "text", "content": "Il tuo titolo qui", "style": {"fontSize": "3rem", "fontWeight": "bold", "textAlign": "center", "color": "#ffffff", "backgroundColor": "#7c3aed", "padding": "2rem"}}, {"id": "main-image", "type": "image", "content": "", "style": {}}]}'::jsonb
);

-- 50/50 Split Template
INSERT INTO signage_templates (
    organization_id,
    name,
    description,
    category,
    is_public,
    is_premium,
    layout_config,
    default_content
) VALUES (
    NULL,
    'Split 50/50',
    'Immagine a sinistra, testo a destra',
    'promo',
    TRUE,
    FALSE,
    '{"zones": [{"id": "left-image", "type": "image", "x": 0, "y": 0, "width": 50, "height": 100}, {"id": "right-text", "type": "text", "x": 50, "y": 0, "width": 50, "height": 100}]}'::jsonb,
    '{"zones": [{"id": "left-image", "type": "image", "content": "", "style": {}}, {"id": "right-text", "type": "text", "content": "Il tuo messaggio qui\n\nAggiungi dettagli sulla tua promozione", "style": {"fontSize": "2rem", "color": "#1f2937", "backgroundColor": "#f3f4f6", "padding": "3rem", "display": "flex", "alignItems": "center", "justifyContent": "center"}}]}'::jsonb
);

-- Video Full Screen Template
INSERT INTO signage_templates (
    organization_id,
    name,
    description,
    category,
    is_public,
    is_premium,
    layout_config,
    default_content
) VALUES (
    NULL,
    'Video Full Screen',
    'Mostra un video a tutto schermo',
    'basic',
    TRUE,
    FALSE,
    '{"zones": [{"id": "main-video", "type": "video", "x": 0, "y": 0, "width": 100, "height": 100}]}'::jsonb,
    '{"zones": [{"id": "main-video", "type": "video", "content": "", "style": {}}]}'::jsonb
);

-- Announcement Template
INSERT INTO signage_templates (
    organization_id,
    name,
    description,
    category,
    is_public,
    is_premium,
    layout_config,
    default_content
) VALUES (
    NULL,
    'Annuncio',
    'Testo centrato per annunci importanti',
    'announcement',
    TRUE,
    FALSE,
    '{"zones": [{"id": "announcement-text", "type": "text", "x": 10, "y": 30, "width": 80, "height": 40}]}'::jsonb,
    '{"zones": [{"id": "announcement-text", "type": "text", "content": "Il tuo annuncio importante", "style": {"fontSize": "4rem", "fontWeight": "bold", "textAlign": "center", "color": "#ffffff", "backgroundColor": "#7c3aed", "padding": "3rem", "borderRadius": "1rem", "boxShadow": "0 10px 40px rgba(0,0,0,0.2)"}}]}'::jsonb
);

-- Menu Board Template
INSERT INTO signage_templates (
    organization_id,
    name,
    description,
    category,
    is_public,
    is_premium,
    layout_config,
    default_content
) VALUES (
    NULL,
    'Menu Ristorante',
    'Layout per menu con titolo e contenuto',
    'menu',
    TRUE,
    TRUE,
    '{"zones": [{"id": "menu-header", "type": "text", "x": 0, "y": 0, "width": 100, "height": 15}, {"id": "menu-content", "type": "text", "x": 5, "y": 20, "width": 90, "height": 75}]}'::jsonb,
    '{"zones": [{"id": "menu-header", "type": "text", "content": "MENU DEL GIORNO", "style": {"fontSize": "3.5rem", "fontWeight": "bold", "textAlign": "center", "color": "#ffffff", "backgroundColor": "#1f2937", "padding": "2rem"}}, {"id": "menu-content", "type": "text", "content": "Primo: Pasta al pomodoro - €12\nSecondo: Tagliata di manzo - €18\nContorno: Insalata mista - €5\nDolce: Tiramisu - €6", "style": {"fontSize": "2.5rem", "lineHeight": "1.8", "color": "#1f2937", "backgroundColor": "#ffffff", "padding": "2rem", "borderRadius": "1rem"}}]}'::jsonb
);
