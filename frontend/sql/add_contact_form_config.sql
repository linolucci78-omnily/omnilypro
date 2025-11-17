-- Add Contact Form Configuration Fields
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_contact_form_email TEXT,
ADD COLUMN IF NOT EXISTS website_contact_form_subject TEXT DEFAULT 'Nuovo messaggio dal sito web',
ADD COLUMN IF NOT EXISTS website_contact_form_success_message TEXT DEFAULT 'Grazie per averci contattato! Ti risponderemo il prima possibile.';
