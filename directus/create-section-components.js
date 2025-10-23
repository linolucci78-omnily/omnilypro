/**
 * Script per creare solo la collection section_components
 */

const DIRECTUS_URL = 'https://omnilypro-directus.onrender.com';
const DIRECTUS_TOKEN = '0NqIorw0InV52DxGGUZFYXI06NYLh-hX';

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

async function createRelation() {
  console.log(`\n🔗 Creazione relazione section_components.section_id → page_sections...`);

  const response = await fetch(`${DIRECTUS_URL}/relations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      collection: 'section_components',
      field: 'section_id',
      related_collection: 'page_sections',
      meta: {
        many_collection: 'section_components',
        many_field: 'section_id',
        one_collection: 'page_sections',
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

async function main() {
  console.log('🚀 Creazione collection section_components...\n');
  console.log(`📍 URL: ${DIRECTUS_URL}`);

  try {
    // Crea section_components
    await createCollection(sectionComponentsCollection);

    // Crea relazione
    await createRelation();

    console.log('\n\n🎉 COLLECTION CREATA CON SUCCESSO! 🎉\n');
    console.log('✅ section_components (20 campi)');
    console.log('✅ Relazione con page_sections');
    console.log('\n🔗 Apri Directus Admin: ' + DIRECTUS_URL + '/admin');

  } catch (error) {
    console.error('\n❌ ERRORE:', error.message);
  }
}

main();
