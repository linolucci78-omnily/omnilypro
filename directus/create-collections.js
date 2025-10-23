/**
 * Script per creare automaticamente le collections del Website Builder su Directus
 *
 * IMPORTANTE: Prima di eseguire questo script:
 * 1. Crea un nuovo API token con permessi ADMIN
 * 2. Aggiorna il token qui sotto
 */

const DIRECTUS_URL = 'https://omnilypro-directus.onrender.com';
const DIRECTUS_TOKEN = '0NqIorw0InV52DxGGUZFYXI06NYLh-hX'; // Token ADMIN

// ============================================
// COLLECTION: page_sections
// ============================================

const pageSectionsCollection = {
  collection: 'page_sections',
  meta: {
    collection: 'page_sections',
    icon: 'view_agenda',
    note: 'Sezioni delle pagine del sito',
    display_template: '{{section_name}} ({{section_type}})',
    hidden: false,
    singleton: false,
    translations: null,
    archive_field: null,
    archive_app_filter: true,
    archive_value: null,
    unarchive_value: null,
    sort_field: 'sort_order',
  },
  schema: {
    name: 'page_sections',
  },
  fields: [
    // 1. Relazione con page
    {
      field: 'page_id',
      type: 'integer',
      meta: {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        required: true,
        options: {
          template: '{{page_name}}',
        },
        display: 'related-values',
        display_options: {
          template: '{{page_name}}',
        },
      },
      schema: {
        is_nullable: false,
      },
    },

    // 2. Tipo sezione
    {
      field: 'section_type',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        required: true,
        options: {
          choices: [
            { text: 'Hero', value: 'hero' },
            { text: 'Chi Siamo', value: 'about' },
            { text: 'Servizi', value: 'services' },
            { text: 'Menu Ristorante', value: 'menu_food' },
            { text: 'Gallery', value: 'gallery' },
            { text: 'Recensioni', value: 'testimonials' },
            { text: 'Orari', value: 'hours' },
            { text: 'Form Contatto', value: 'contact_form' },
            { text: 'Footer', value: 'footer' },
          ],
        },
      },
      schema: {
        is_nullable: false,
      },
    },

    // 3. Nome sezione
    {
      field: 'section_name',
      type: 'string',
      meta: {
        interface: 'input',
        required: true,
        width: 'half',
        options: {
          placeholder: 'Hero Homepage',
        },
      },
      schema: {
        is_nullable: false,
      },
    },

    // 4. Titolo sezione
    {
      field: 'section_title',
      type: 'string',
      meta: {
        interface: 'input',
        width: 'full',
        options: {
          placeholder: 'Benvenuti nel nostro ristorante',
        },
      },
    },

    // 5. Sottotitolo
    {
      field: 'section_subtitle',
      type: 'text',
      meta: {
        interface: 'input-multiline',
        options: {
          placeholder: 'Dal 1985 portiamo la tradizione sulla tua tavola',
        },
      },
    },

    // 6. Ordine
    {
      field: 'sort_order',
      type: 'integer',
      meta: {
        interface: 'input',
        required: true,
        width: 'half',
        options: {
          placeholder: '1',
        },
      },
      schema: {
        default_value: 1,
        is_nullable: false,
      },
    },

    // 7. Visibile
    {
      field: 'visible',
      type: 'boolean',
      meta: {
        interface: 'boolean',
        width: 'half',
      },
      schema: {
        default_value: true,
      },
    },

    // 8. Background color
    {
      field: 'background_color',
      type: 'string',
      meta: {
        interface: 'input',
        width: 'half',
        options: {
          placeholder: '#ffffff',
        },
      },
      schema: {
        default_value: '#ffffff',
      },
    },

    // 9. Background image
    {
      field: 'background_image',
      type: 'uuid',
      meta: {
        interface: 'file-image',
        special: ['file'],
        width: 'full',
      },
    },

    // 10. Layout style
    {
      field: 'layout_style',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        width: 'half',
        options: {
          choices: [
            { text: 'Centrato', value: 'centered' },
            { text: 'Allineato Sinistra', value: 'left_aligned' },
            { text: 'Split 50/50', value: 'split_50_50' },
            { text: 'Griglia 2 Colonne', value: 'grid_2_cols' },
            { text: 'Griglia 3 Colonne', value: 'grid_3_cols' },
          ],
        },
      },
      schema: {
        default_value: 'centered',
      },
    },

    // 11. Padding top
    {
      field: 'padding_top',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        width: 'half',
        options: {
          choices: [
            { text: 'Nessuno', value: 'none' },
            { text: 'Piccolo', value: 'small' },
            { text: 'Medio', value: 'medium' },
            { text: 'Grande', value: 'large' },
          ],
        },
      },
      schema: {
        default_value: 'medium',
      },
    },

    // 12. Padding bottom
    {
      field: 'padding_bottom',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        width: 'half',
        options: {
          choices: [
            { text: 'Nessuno', value: 'none' },
            { text: 'Piccolo', value: 'small' },
            { text: 'Medio', value: 'medium' },
            { text: 'Grande', value: 'large' },
          ],
        },
      },
      schema: {
        default_value: 'medium',
      },
    },

    // 13. Text align
    {
      field: 'text_align',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        width: 'half',
        options: {
          choices: [
            { text: 'Sinistra', value: 'left' },
            { text: 'Centro', value: 'center' },
            { text: 'Destra', value: 'right' },
          ],
        },
      },
      schema: {
        default_value: 'left',
      },
    },

    // 14. Created at
    {
      field: 'created_at',
      type: 'timestamp',
      meta: {
        interface: 'datetime',
        special: ['date-created'],
        readonly: true,
        width: 'half',
      },
    },

    // 15. Updated at
    {
      field: 'updated_at',
      type: 'timestamp',
      meta: {
        interface: 'datetime',
        special: ['date-updated'],
        readonly: true,
        width: 'half',
      },
    },
  ],
};

// ============================================
// COLLECTION: section_components
// ============================================

const sectionComponentsCollection = {
  collection: 'section_components',
  meta: {
    collection: 'section_components',
    icon: 'widgets',
    note: 'Componenti modificabili delle sezioni',
    display_template: '{{component_label}} ({{component_type}})',
    hidden: false,
    singleton: false,
    sort_field: 'sort_order',
  },
  schema: {
    name: 'section_components',
  },
  fields: [
    // 1. Relazione con section
    {
      field: 'section_id',
      type: 'integer',
      meta: {
        interface: 'select-dropdown-m2o',
        special: ['m2o'],
        required: true,
        options: {
          template: '{{section_name}}',
        },
      },
      schema: {
        is_nullable: false,
      },
    },

    // 2. Tipo componente
    {
      field: 'component_type',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        required: true,
        width: 'half',
        options: {
          choices: [
            { text: 'Titolo', value: 'heading' },
            { text: 'Testo', value: 'text' },
            { text: 'Testo Ricco', value: 'rich_text' },
            { text: 'Immagine', value: 'image' },
            { text: 'Bottone', value: 'button' },
            { text: 'Item Menu', value: 'menu_item' },
            { text: 'Item con Prezzo', value: 'price_item' },
            { text: 'Recensione', value: 'testimonial' },
            { text: 'Info Contatto', value: 'contact_info' },
            { text: 'Orario Giorno', value: 'hours_day' },
          ],
        },
      },
      schema: {
        is_nullable: false,
      },
    },

    // 3. Label componente
    {
      field: 'component_label',
      type: 'string',
      meta: {
        interface: 'input',
        required: true,
        width: 'half',
        options: {
          placeholder: 'Titolo Principale',
        },
      },
      schema: {
        is_nullable: false,
      },
    },

    // 4. Contenuto testo
    {
      field: 'content_text',
      type: 'text',
      meta: {
        interface: 'input-multiline',
        width: 'full',
        options: {
          placeholder: 'Inserisci il testo...',
        },
      },
    },

    // 5. Contenuto rich text
    {
      field: 'content_rich_text',
      type: 'text',
      meta: {
        interface: 'input-rich-text-html',
        width: 'full',
      },
    },

    // 6. Immagine
    {
      field: 'content_image',
      type: 'uuid',
      meta: {
        interface: 'file-image',
        special: ['file'],
        width: 'half',
      },
    },

    // 7. Alt text immagine
    {
      field: 'image_alt_text',
      type: 'string',
      meta: {
        interface: 'input',
        width: 'half',
        options: {
          placeholder: 'Descrizione immagine per SEO',
        },
      },
    },

    // 8. Link URL
    {
      field: 'content_link_url',
      type: 'string',
      meta: {
        interface: 'input',
        width: 'half',
        options: {
          placeholder: '/menu o https://...',
        },
      },
    },

    // 9. Link text
    {
      field: 'content_link_text',
      type: 'string',
      meta: {
        interface: 'input',
        width: 'half',
        options: {
          placeholder: 'Scopri di più',
        },
      },
    },

    // 10. Stile bottone
    {
      field: 'button_style',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        width: 'half',
        options: {
          choices: [
            { text: 'Primario', value: 'primary' },
            { text: 'Secondario', value: 'secondary' },
            { text: 'Outline', value: 'outline' },
          ],
        },
      },
      schema: {
        default_value: 'primary',
      },
    },

    // 11. Nome item
    {
      field: 'item_name',
      type: 'string',
      meta: {
        interface: 'input',
        width: 'half',
        options: {
          placeholder: 'Margherita, Taglio Donna',
        },
      },
    },

    // 12. Descrizione item
    {
      field: 'item_description',
      type: 'text',
      meta: {
        interface: 'input-multiline',
        width: 'full',
      },
    },

    // 13. Prezzo item
    {
      field: 'item_price',
      type: 'decimal',
      meta: {
        interface: 'input',
        width: 'half',
        options: {
          placeholder: '12.50',
        },
      },
      schema: {
        numeric_precision: 10,
        numeric_scale: 2,
      },
    },

    // 14. Immagine item
    {
      field: 'item_image',
      type: 'uuid',
      meta: {
        interface: 'file-image',
        special: ['file'],
        width: 'half',
      },
    },

    // 15. Autore testimonial
    {
      field: 'testimonial_author',
      type: 'string',
      meta: {
        interface: 'input',
        width: 'half',
        options: {
          placeholder: 'Mario Rossi',
        },
      },
    },

    // 16. Rating testimonial
    {
      field: 'testimonial_rating',
      type: 'integer',
      meta: {
        interface: 'input',
        width: 'half',
        options: {
          placeholder: '5',
        },
      },
      schema: {
        default_value: 5,
      },
    },

    // 17. Ordine
    {
      field: 'sort_order',
      type: 'integer',
      meta: {
        interface: 'input',
        width: 'half',
      },
      schema: {
        default_value: 1,
      },
    },

    // 18. Visibile
    {
      field: 'visible',
      type: 'boolean',
      meta: {
        interface: 'boolean',
        width: 'half',
      },
      schema: {
        default_value: true,
      },
    },

    // 19. Created at
    {
      field: 'created_at',
      type: 'timestamp',
      meta: {
        interface: 'datetime',
        special: ['date-created'],
        readonly: true,
        width: 'half',
      },
    },

    // 20. Updated at
    {
      field: 'updated_at',
      type: 'timestamp',
      meta: {
        interface: 'datetime',
        special: ['date-updated'],
        readonly: true,
        width: 'half',
      },
    },
  ],
};

// ============================================
// FUNZIONI DI CREAZIONE
// ============================================

async function createCollection(collectionData) {
  console.log(`\n📦 Creazione collection: ${collectionData.collection}...`);

  // 1. Crea la collection
  const createCollectionResponse = await fetch(`${DIRECTUS_URL}/collections`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      collection: collectionData.collection,
      meta: collectionData.meta,
      schema: collectionData.schema,
    }),
  });

  if (!createCollectionResponse.ok) {
    const error = await createCollectionResponse.text();
    throw new Error(`Errore creazione collection: ${error}`);
  }

  console.log(`✅ Collection ${collectionData.collection} creata!`);

  // 2. Crea i campi
  for (const field of collectionData.fields) {
    console.log(`  📝 Creazione campo: ${field.field}...`);

    const createFieldResponse = await fetch(`${DIRECTUS_URL}/fields/${collectionData.collection}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(field),
    });

    if (!createFieldResponse.ok) {
      const error = await createFieldResponse.text();
      console.error(`  ❌ Errore campo ${field.field}: ${error}`);
    } else {
      console.log(`  ✅ Campo ${field.field} creato!`);
    }
  }
}

async function createRelation(collectionName, field, relatedCollection) {
  console.log(`\n🔗 Creazione relazione ${collectionName}.${field} → ${relatedCollection}...`);

  const response = await fetch(`${DIRECTUS_URL}/relations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      collection: collectionName,
      field: field,
      related_collection: relatedCollection,
      meta: {
        many_collection: collectionName,
        many_field: field,
        one_collection: relatedCollection,
        one_field: null,
        junction_field: null,
      },
      schema: {
        on_delete: 'CASCADE',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`❌ Errore creazione relazione: ${error}`);
  } else {
    console.log(`✅ Relazione creata!`);
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('🚀 Inizio creazione collections Website Builder...\n');
  console.log(`📍 URL: ${DIRECTUS_URL}`);
  console.log(`🔑 Token: ${DIRECTUS_TOKEN.substring(0, 10)}...`);

  try {
    // Crea page_sections
    await createCollection(pageSectionsCollection);

    // Crea section_components
    await createCollection(sectionComponentsCollection);

    // Crea relazioni
    await createRelation('page_sections', 'page_id', 'website_pages');
    await createRelation('section_components', 'section_id', 'page_sections');

    console.log('\n\n🎉 TUTTE LE COLLECTIONS SONO STATE CREATE CON SUCCESSO! 🎉\n');
    console.log('✅ page_sections (15 campi)');
    console.log('✅ section_components (20 campi)');
    console.log('✅ Relazioni configurate');
    console.log('\n🔗 Apri Directus Admin: ' + DIRECTUS_URL + '/admin');

  } catch (error) {
    console.error('\n❌ ERRORE:', error.message);
    console.error('\n⚠️ Controlla che:');
    console.error('  1. Il token API abbia permessi ADMIN');
    console.error('  2. Directus sia raggiungibile');
    console.error('  3. Le collections non esistano già');
  }
}

// Esegui lo script
main();
