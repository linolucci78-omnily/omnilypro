/**
 * Script per ricreare i template email da zero
 * Cancella e ricrea tutti i template globali
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Carica .env se disponibile
const envFiles = ['.env.local', '.env'];
for (const envFile of envFiles) {
  try {
    const envContent = fs.readFileSync(envFile, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        if (key && values.length > 0) {
          process.env[key.trim()] = values.join('=').trim();
        }
      }
    });
    break;
  } catch (err) {
    // File non trovato, prova il prossimo
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Configura VITE_SUPABASE_URL e una chiave Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const templates = [
  {
    template_type: 'receipt',
    name: 'Scontrino Standard',
    description: 'Template di base per invio scontrino via email',
    subject: '{{store_name}} - Scontrino #{{receipt_number}}',
    variables: ['store_name', 'receipt_number', 'items_html', 'total', 'timestamp'],
    is_active: true,
    html_body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="background: #3b82f6; color: white; padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0 0 10px 0; font-size: 24px;">{{store_name}}</h1>
      <p style="margin: 0; font-size: 16px; opacity: 0.9;">Scontrino #{{receipt_number}}</p>
    </div>
    <div style="padding: 30px 20px;">
      <p style="color: #333; line-height: 1.6;">Gentile cliente,</p>
      <p style="color: #333; line-height: 1.6;">Grazie per il tuo acquisto! Ecco il dettaglio del tuo scontrino:</p>
      <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
        {{items_html}}
      </div>
      <div style="font-size: 24px; font-weight: bold; color: #3b82f6; text-align: right; margin-top: 20px;">
        Totale: €{{total}}
      </div>
      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        📅 Data: {{timestamp}}<br>
        📍 Negozio: {{store_name}}
      </p>
    </div>
    <div style="background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666;">
      Grazie per aver scelto {{store_name}}!<br>
      Powered by Omnily PRO
    </div>
  </div>
</body>
</html>`
  },
  {
    template_type: 'receipt',
    name: 'Scontrino Digitale',
    description: 'Template moderno per scontrino digitale',
    subject: 'Grazie per il tuo acquisto - {{store_name}}',
    variables: ['store_name', 'customer_name', 'receipt_number', 'items_html', 'total', 'timestamp'],
    is_active: true,
    html_body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center;">
      <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">{{store_name}}</h1>
      <p style="margin: 0; font-size: 16px; opacity: 0.9;">🎉 Acquisto completato con successo!</p>
    </div>
    <div style="padding: 30px 20px;">
      <p style="color: #333; line-height: 1.8; font-size: 16px;">Ciao <strong>{{customer_name}}</strong>,</p>
      <p style="color: #333; line-height: 1.8;">Grazie per il tuo acquisto! Ecco il riepilogo del tuo ordine:</p>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
        <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Scontrino #{{receipt_number}}</p>
        {{items_html}}
      </div>
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 5px 0; font-size: 14px; opacity: 0.9;">Totale pagato</p>
        <p style="margin: 0; font-size: 32px; font-weight: bold;">€{{total}}</p>
      </div>
      <p style="margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
        📅 {{timestamp}}
      </p>
    </div>
    <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e9ecef;">
      Hai domande? Contattaci su <a href="mailto:support@omnilypro.com" style="color: #667eea; text-decoration: none;">support@omnilypro.com</a><br>
      <p style="margin: 10px 0 0 0;">Powered by <strong>Omnily PRO</strong></p>
    </div>
  </div>
</body>
</html>`
  },
  {
    template_type: 'birthday',
    name: 'Auguri Compleanno',
    description: 'Template per auguri di compleanno con sconto',
    subject: '🎉 Buon Compleanno {{customer_name}}! Un regalo speciale per te',
    variables: ['customer_name', 'store_name', 'discount_code', 'discount_amount'],
    is_active: true,
    html_body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; background-color: #fff3cd; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); padding: 40px 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 48px;">🎂</h1>
      <h2 style="margin: 10px 0 0 0; font-size: 28px; color: #333;">Buon Compleanno!</h2>
    </div>
    <div style="padding: 30px 20px; text-align: center;">
      <p style="font-size: 18px; color: #333; line-height: 1.6;">Caro <strong>{{customer_name}}</strong>,</p>
      <p style="font-size: 16px; color: #666; line-height: 1.8;">
        Tutto il team di {{store_name}} ti augura un fantastico compleanno! 🎉
      </p>
      <p style="font-size: 16px; color: #666; line-height: 1.8;">
        Per festeggiare insieme a te, abbiamo preparato un regalo speciale:
      </p>
      <div style="background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); padding: 30px; border-radius: 8px; margin: 30px 0;">
        <p style="margin: 0 0 10px 0; font-size: 20px; font-weight: bold; color: #333;">Sconto {{discount_amount}}%</p>
        <p style="margin: 0; font-size: 14px; color: #666;">Usa il codice:</p>
        <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #333; font-family: monospace; letter-spacing: 2px;">{{discount_code}}</p>
      </div>
      <p style="font-size: 14px; color: #999;">Valido per 30 giorni dal tuo compleanno</p>
    </div>
    <div style="background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666;">
      Con affetto, il team di {{store_name}}<br>
      Powered by Omnily PRO
    </div>
  </div>
</body>
</html>`
  },
  {
    template_type: 'promo',
    name: 'Promozione Speciale',
    description: 'Template per promozioni e offerte speciali',
    subject: '🔥 Offerta Speciale da {{store_name}} - Solo per te!',
    variables: ['customer_name', 'store_name', 'promo_title', 'promo_description', 'promo_code', 'valid_until'],
    is_active: true,
    html_body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 40px 20px; text-align: center;">
      <h1 style="margin: 0 0 10px 0; font-size: 32px; font-weight: 700;">🔥 OFFERTA SPECIALE</h1>
      <p style="margin: 0; font-size: 16px; opacity: 0.9;">Non perdere questa occasione!</p>
    </div>
    <div style="padding: 30px 20px;">
      <p style="font-size: 16px; color: #333;">Ciao <strong>{{customer_name}}</strong>,</p>
      <h2 style="color: #ef4444; font-size: 24px; margin: 20px 0;">{{promo_title}}</h2>
      <p style="font-size: 16px; color: #666; line-height: 1.8;">{{promo_description}}</p>
      <div style="background: #fef2f2; border: 2px dashed #ef4444; padding: 30px; border-radius: 8px; margin: 30px 0; text-align: center;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Codice Promozionale</p>
        <p style="margin: 0; font-size: 36px; font-weight: bold; color: #ef4444; font-family: monospace; letter-spacing: 3px;">{{promo_code}}</p>
        <p style="margin: 15px 0 0 0; font-size: 14px; color: #999;">⏰ Valido fino al {{valid_until}}</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="#" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">Acquista Ora</a>
      </div>
    </div>
    <div style="background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666;">
      {{store_name}} - I tuoi preferiti a portata di mano<br>
      Powered by Omnily PRO
    </div>
  </div>
</body>
</html>`
  }
];

async function recreateTemplates() {
  console.log('🔄 Ricreazione template email...\n');

  try {
    // 1. Cancella tutti i template globali esistenti
    console.log('🗑️  Cancellazione template esistenti...');
    const { error: deleteError } = await supabase
      .from('email_templates')
      .delete()
      .is('organization_id', null);

    if (deleteError) {
      console.error('❌ Errore cancellazione:', deleteError.message);
      throw deleteError;
    }
    console.log('✅ Template esistenti cancellati\n');

    // 2. Crea i nuovi template
    console.log('📝 Creazione nuovi template...\n');

    for (const template of templates) {
      console.log(`   Creando: ${template.name}...`);

      const { data, error } = await supabase
        .from('email_templates')
        .insert([{
          organization_id: null,
          template_type: template.template_type,
          name: template.name,
          description: template.description,
          subject: template.subject,
          html_body: template.html_body,
          text_body: null,
          variables: template.variables,
          is_active: template.is_active,
          allowed_plans: ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'],
          created_by: 'Admin',
          usage_count: 0
        }])
        .select();

      if (error) {
        console.error(`   ❌ Errore: ${error.message}`);
        throw error;
      }

      console.log(`   ✅ ${template.name} creato (ID: ${data[0].id})`);
    }

    console.log('\n🎉 COMPLETATO!');
    console.log(`✅ Creati ${templates.length} template con successo`);
    console.log('\n📋 Template creati:');
    templates.forEach(t => {
      console.log(`   - ${t.name} (${t.template_type})`);
    });

  } catch (error) {
    console.error('\n❌ Errore:', error.message);
    process.exit(1);
  }
}

recreateTemplates();
