/**
 * Script per creare un sito di esempio: PIZZERIA "DA MARIO"
 *
 * Crea:
 * - 1 Sito web per la pizzeria
 * - 1 Pagina Homepage
 * - 5 Sezioni (Hero, About, Menu, Gallery, Footer)
 * - ~15 Componenti modificabili dal cliente
 */

const DIRECTUS_URL = 'https://omnilypro-directus.onrender.com';
const DIRECTUS_TOKEN = '0NqIorw0InV52DxGGUZFYXI06NYLh-hX';

async function apiRequest(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${DIRECTUS_URL}${endpoint}`, options);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${error}`);
  }

  return response.json();
}

async function createRestaurantWebsite() {
  console.log('\n🍕 CREAZIONE PIZZERIA "DA MARIO"...\n');

  // 1. CREA IL SITO
  console.log('📦 1. Creazione sito web...');
  const website = await apiRequest('/items/organizations_websites', 'POST', {
    organization_id: 'org_pizzeria_mario',
    site_name: 'Pizzeria Da Mario',
    domain: 'damario.omnilypro.com',
    published: true,
  });
  const websiteId = website.data.id;
  console.log(`✅ Sito creato con ID: ${websiteId}`);

  // 2. CREA LA HOMEPAGE
  console.log('\n📄 2. Creazione homepage...');
  const homepage = await apiRequest('/items/website_pages', 'POST', {
    website_id: websiteId,
    page_name: 'Home',
    slug: 'home',
    title: 'Pizzeria Da Mario - Le migliori pizze dal 1985',
    meta_description: 'Pizzeria tradizionale napoletana. Pizze cotte nel forno a legna, ingredienti freschi e ricette autentiche.',
    is_homepage: true,
    published: true,
    sort_order: 1,
  });
  const pageId = homepage.data.id;
  console.log(`✅ Homepage creata con ID: ${pageId}`);

  // 3. SEZIONE HERO
  console.log('\n🎨 3. Creazione sezione HERO...');
  const heroSection = await apiRequest('/items/page_sections', 'POST', {
    page_id: pageId,
    section_type: 'hero',
    section_name: 'Hero Homepage',
    section_title: 'Benvenuti da Mario',
    section_subtitle: 'Dal 1985 portiamo la tradizione napoletana sulla tua tavola',
    sort_order: 1,
    visible: true,
    background_color: '#1a1a1a',
    layout_style: 'centered',
    padding_top: 'large',
    padding_bottom: 'large',
    text_align: 'center',
  });
  const heroSectionId = heroSection.data.id;
  console.log(`✅ Sezione Hero creata con ID: ${heroSectionId}`);

  // Componenti Hero
  console.log('  📝 Aggiunta componenti Hero...');

  await apiRequest('/items/section_components', 'POST', {
    section_id: heroSectionId,
    component_type: 'heading',
    component_label: 'Titolo Principale Hero',
    content_text: 'Le Migliori Pizze di Napoli',
    sort_order: 1,
    visible: true,
  });

  await apiRequest('/items/section_components', 'POST', {
    section_id: heroSectionId,
    component_type: 'text',
    component_label: 'Sottotitolo Hero',
    content_text: 'Ingredienti freschi, forno a legna, ricette tradizionali tramandate da generazioni',
    sort_order: 2,
    visible: true,
  });

  await apiRequest('/items/section_components', 'POST', {
    section_id: heroSectionId,
    component_type: 'button',
    component_label: 'Bottone Prenota',
    content_link_text: 'Prenota un Tavolo',
    content_link_url: '#contact',
    button_style: 'primary',
    sort_order: 3,
    visible: true,
  });

  console.log('  ✅ 3 componenti Hero aggiunti');

  // 4. SEZIONE CHI SIAMO
  console.log('\n🏠 4. Creazione sezione CHI SIAMO...');
  const aboutSection = await apiRequest('/items/page_sections', 'POST', {
    page_id: pageId,
    section_type: 'about',
    section_name: 'Chi Siamo',
    section_title: 'La Nostra Storia',
    section_subtitle: 'Una tradizione di famiglia dal 1985',
    sort_order: 2,
    visible: true,
    background_color: '#ffffff',
    layout_style: 'split_50_50',
    padding_top: 'large',
    padding_bottom: 'large',
    text_align: 'left',
  });
  const aboutSectionId = aboutSection.data.id;
  console.log(`✅ Sezione Chi Siamo creata con ID: ${aboutSectionId}`);

  await apiRequest('/items/section_components', 'POST', {
    section_id: aboutSectionId,
    component_type: 'rich_text',
    component_label: 'Storia della Pizzeria',
    content_rich_text: '<p>La <strong>Pizzeria Da Mario</strong> nasce nel 1985 dal sogno di Mario Esposito, maestro pizzaiolo napoletano con oltre 40 anni di esperienza.</p><p>Oggi, insieme ai suoi figli, continua a preparare pizze autentiche seguendo le ricette tradizionali e utilizzando solo ingredienti di prima qualità: farina tipo 00, pomodoro San Marzano DOP, mozzarella di bufala campana e olio extravergine d\'oliva.</p><p>Il nostro forno a legna, costruito con mattoni refrattari originali di Napoli, cuoce le pizze a 485°C regalando quella croccantezza unica che ci contraddistingue.</p>',
    sort_order: 1,
    visible: true,
  });

  console.log('  ✅ 1 componente Chi Siamo aggiunto');

  // 5. SEZIONE MENU
  console.log('\n🍕 5. Creazione sezione MENU...');
  const menuSection = await apiRequest('/items/page_sections', 'POST', {
    page_id: pageId,
    section_type: 'menu_food',
    section_name: 'Menu Pizze',
    section_title: 'Il Nostro Menu',
    section_subtitle: 'Pizze tradizionali napoletane cotte nel forno a legna',
    sort_order: 3,
    visible: true,
    background_color: '#f8f8f8',
    layout_style: 'grid_2_cols',
    padding_top: 'xlarge',
    padding_bottom: 'xlarge',
    text_align: 'left',
  });
  const menuSectionId = menuSection.data.id;
  console.log(`✅ Sezione Menu creata con ID: ${menuSectionId}`);

  // Pizze del Menu
  const pizze = [
    {
      name: 'Margherita',
      description: 'Pomodoro San Marzano DOP, mozzarella fior di latte, basilico fresco, olio EVO',
      price: 7.50,
    },
    {
      name: 'Marinara',
      description: 'Pomodoro San Marzano DOP, aglio, origano, olio EVO',
      price: 6.00,
    },
    {
      name: 'Diavola',
      description: 'Pomodoro, mozzarella, salame piccante, olio piccante',
      price: 9.00,
    },
    {
      name: 'Quattro Formaggi',
      description: 'Mozzarella, gorgonzola, parmigiano, provola affumicata',
      price: 10.00,
    },
    {
      name: 'Capricciosa',
      description: 'Pomodoro, mozzarella, prosciutto cotto, funghi, carciofi, olive',
      price: 11.00,
    },
    {
      name: 'Bufalina',
      description: 'Pomodoro, mozzarella di bufala campana DOP, basilico, olio EVO',
      price: 12.00,
    },
    {
      name: 'Salsiccia e Friarielli',
      description: 'Mozzarella, salsiccia napoletana, friarielli, olio EVO',
      price: 11.50,
    },
    {
      name: 'Ortolana',
      description: 'Pomodoro, mozzarella, melanzane, zucchine, peperoni, verdure di stagione',
      price: 10.50,
    },
  ];

  console.log('  📝 Aggiunta pizze al menu...');
  for (let i = 0; i < pizze.length; i++) {
    await apiRequest('/items/section_components', 'POST', {
      section_id: menuSectionId,
      component_type: 'menu_item',
      component_label: `Pizza ${pizze[i].name}`,
      item_name: pizze[i].name,
      item_description: pizze[i].description,
      item_price: pizze[i].price,
      sort_order: i + 1,
      visible: true,
    });
  }
  console.log(`  ✅ ${pizze.length} pizze aggiunte al menu`);

  // 6. SEZIONE RECENSIONI
  console.log('\n⭐ 6. Creazione sezione RECENSIONI...');
  const testimonialsSection = await apiRequest('/items/page_sections', 'POST', {
    page_id: pageId,
    section_type: 'testimonials',
    section_name: 'Recensioni Clienti',
    section_title: 'Cosa Dicono i Nostri Clienti',
    section_subtitle: 'Oltre 500 recensioni a 5 stelle',
    sort_order: 4,
    visible: true,
    background_color: '#ffffff',
    layout_style: 'grid_3_cols',
    padding_top: 'large',
    padding_bottom: 'large',
    text_align: 'center',
  });
  const testimonialsSectionId = testimonialsSection.data.id;
  console.log(`✅ Sezione Recensioni creata con ID: ${testimonialsSectionId}`);

  const recensioni = [
    {
      author: 'Giuseppe R.',
      text: 'La migliore pizza di tutta la città! Impasto perfetto, ingredienti di qualità. Ci torno sempre!',
      rating: 5,
    },
    {
      author: 'Maria L.',
      text: 'Atmosfera familiare e pizza napoletana autentica. Mario è un vero maestro pizzaiolo!',
      rating: 5,
    },
    {
      author: 'Luca M.',
      text: 'Ho provato la Bufalina ed è stata una vera esperienza. Prodotti freschi e cottura perfetta!',
      rating: 5,
    },
  ];

  console.log('  📝 Aggiunta recensioni...');
  for (let i = 0; i < recensioni.length; i++) {
    await apiRequest('/items/section_components', 'POST', {
      section_id: testimonialsSectionId,
      component_type: 'testimonial',
      component_label: `Recensione ${recensioni[i].author}`,
      content_text: recensioni[i].text,
      testimonial_author: recensioni[i].author,
      testimonial_rating: recensioni[i].rating,
      sort_order: i + 1,
      visible: true,
    });
  }
  console.log(`  ✅ ${recensioni.length} recensioni aggiunte`);

  // 7. SEZIONE FOOTER/CONTATTI
  console.log('\n📞 7. Creazione sezione CONTATTI (Footer)...');
  const footerSection = await apiRequest('/items/page_sections', 'POST', {
    page_id: pageId,
    section_type: 'footer',
    section_name: 'Footer Contatti',
    section_title: 'Vieni a Trovarci',
    section_subtitle: 'Siamo aperti tutti i giorni',
    sort_order: 5,
    visible: true,
    background_color: '#1a1a1a',
    layout_style: 'grid_3_cols',
    padding_top: 'large',
    padding_bottom: 'large',
    text_align: 'center',
  });
  const footerSectionId = footerSection.data.id;
  console.log(`✅ Sezione Footer creata con ID: ${footerSectionId}`);

  console.log('  📝 Aggiunta info contatto...');

  await apiRequest('/items/section_components', 'POST', {
    section_id: footerSectionId,
    component_type: 'contact_info',
    component_label: 'Indirizzo',
    content_text: 'Via Napoli 123\n80100 Napoli (NA)',
    sort_order: 1,
    visible: true,
  });

  await apiRequest('/items/section_components', 'POST', {
    section_id: footerSectionId,
    component_type: 'contact_info',
    component_label: 'Telefono',
    content_text: '+39 081 123 4567',
    content_link_url: 'tel:+390811234567',
    sort_order: 2,
    visible: true,
  });

  await apiRequest('/items/section_components', 'POST', {
    section_id: footerSectionId,
    component_type: 'contact_info',
    component_label: 'Email',
    content_text: 'info@pizzeriadamario.it',
    content_link_url: 'mailto:info@pizzeriadamario.it',
    sort_order: 3,
    visible: true,
  });

  await apiRequest('/items/section_components', 'POST', {
    section_id: footerSectionId,
    component_type: 'text',
    component_label: 'Orari Apertura',
    content_text: 'Martedì - Domenica: 12:00 - 15:00 / 19:00 - 23:30\nLunedì: Chiuso',
    sort_order: 4,
    visible: true,
  });

  console.log('  ✅ 4 info contatto aggiunte');

  // RIEPILOGO FINALE
  console.log('\n\n═══════════════════════════════════════');
  console.log('🎉 PIZZERIA "DA MARIO" CREATA CON SUCCESSO! 🎉');
  console.log('═══════════════════════════════════════\n');
  console.log(`✅ Sito: ${website.data.site_name}`);
  console.log(`✅ Domain: ${website.data.domain}`);
  console.log(`✅ Homepage: ${homepage.data.slug}`);
  console.log('\n📋 SEZIONI CREATE:');
  console.log('  1. 🎨 Hero (3 componenti)');
  console.log('  2. 🏠 Chi Siamo (1 componente)');
  console.log('  3. 🍕 Menu (8 pizze)');
  console.log('  4. ⭐ Recensioni (3 recensioni)');
  console.log('  5. 📞 Footer/Contatti (4 info)');
  console.log('\n📊 TOTALE: 19 componenti modificabili dal cliente!\n');
  console.log('🔗 Testa le API:');
  console.log(`   curl -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \\`);
  console.log(`   "${DIRECTUS_URL}/items/website_pages/${pageId}?fields=*,sections.*,sections.components.*"`);
  console.log('\n🌐 Apri Directus Admin:');
  console.log(`   ${DIRECTUS_URL}/admin\n`);
}

// ESEGUI
createRestaurantWebsite().catch(error => {
  console.error('\n❌ ERRORE:', error.message);
});
