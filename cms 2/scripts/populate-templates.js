/**
 * Script per popolare i template nel database Strapi
 * Crea i 5 template base per il Website Builder
 *
 * Uso: node scripts/populate-templates.js
 */

const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_API_TOKEN || '';

const templates = [
  {
    nome: 'Restaurant Classic',
    slug: 'restaurant-classic',
    categoria: 'ristorante',
    descrizione: 'Template elegante per ristoranti, pizzerie e trattorie. Include sezioni per menu, gallery foto piatti, recensioni clienti e prenotazioni.',
    editable_fields: {
      hero: ['title', 'subtitle', 'cta_text', 'image_url'],
      menu: ['title', 'items'],
      gallery: ['title', 'images'],
      about: ['title', 'text'],
      contact: ['phone', 'email', 'address'],
      hours: ['schedule'],
      reviews: ['items']
    },
    contenuto_default: {
      hero: {
        title: 'Il Gusto della Tradizione',
        subtitle: 'Scopri i sapori autentici della cucina italiana',
        cta_text: 'Prenota un tavolo',
        image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920'
      },
      menu: {
        title: 'Il Nostro Menu',
        items: [
          {
            nome: 'Margherita',
            descrizione: 'Pomodoro, mozzarella, basilico fresco',
            prezzo: 8.50,
            categoria: 'Pizze',
            foto: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600'
          },
          {
            nome: 'Carbonara',
            descrizione: 'Guanciale, uovo, pecorino romano, pepe nero',
            prezzo: 12.00,
            categoria: 'Primi Piatti',
            foto: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600'
          },
          {
            nome: 'Tiramisù',
            descrizione: 'Savoiardi, mascarpone, caffè, cacao',
            prezzo: 6.00,
            categoria: 'Dolci',
            foto: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600'
          }
        ]
      },
      gallery: {
        title: 'La Nostra Atmosfera',
        images: [
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
          'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
          'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
          'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800'
        ]
      },
      about: {
        title: 'La Nostra Storia',
        text: 'Dal 1985 portiamo avanti la tradizione culinaria italiana con passione e dedizione. Ogni piatto è preparato con ingredienti freschi e di stagione, seguendo ricette tramandate di generazione in generazione.'
      },
      contact: {
        phone: '+39 06 1234567',
        email: 'info@ristorante.com',
        address: 'Via Roma 123, Roma'
      },
      hours: {
        schedule: [
          { day: 'Lunedì-Venerdì', hours: '12:00 - 15:00, 19:00 - 23:00' },
          { day: 'Sabato-Domenica', hours: '12:00 - 23:00' },
          { day: 'Martedì', hours: 'Chiuso' }
        ]
      }
    },
    component_path: '/templates/RestaurantClassic',
    is_active: true,
    version: '1.0.0'
  },
  {
    nome: 'Cafe Modern',
    slug: 'cafe-modern',
    categoria: 'bar',
    descrizione: 'Design moderno e fresco per bar, caffetterie e bistrot. Perfetto per mostrare le specialità e creare un\'atmosfera accogliente.',
    editable_fields: {
      hero: ['title', 'subtitle', 'cta_text', 'image_url'],
      menu: ['title', 'items'],
      gallery: ['title', 'images'],
      about: ['title', 'text'],
      contact: ['phone', 'email', 'address']
    },
    contenuto_default: {
      hero: {
        title: 'Il Tuo Momento di Pausa',
        subtitle: 'Caffè artigianale e dolci freschi ogni giorno',
        cta_text: 'Scopri il Menu',
        image_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1920'
      },
      menu: {
        title: 'Le Nostre Specialità',
        items: [
          {
            nome: 'Cappuccino',
            descrizione: 'Espresso con latte montato e cacao',
            prezzo: 1.80,
            categoria: 'Bevande Calde',
            foto: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600'
          },
          {
            nome: 'Croissant Artigianale',
            descrizione: 'Sfoglia artigianale con burro francese',
            prezzo: 2.50,
            categoria: 'Dolci',
            foto: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600'
          }
        ]
      },
      gallery: {
        title: 'Il Nostro Locale',
        images: [
          'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
          'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800',
          'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800'
        ]
      },
      about: {
        title: 'Chi Siamo',
        text: 'Siamo appassionati di caffè e ospitalità. Il nostro locale è il posto perfetto per una colazione veloce, un pranzo leggero o semplicemente per rilassarsi con un buon libro.'
      },
      contact: {
        phone: '+39 06 7654321',
        email: 'info@cafe.com',
        address: 'Piazza Centrale 45, Milano'
      }
    },
    component_path: '/templates/CafeModern',
    is_active: true,
    version: '1.0.0'
  },
  {
    nome: 'Retail Modern',
    slug: 'retail-modern',
    categoria: 'negozio',
    descrizione: 'Template versatile per negozi e boutique. Ideale per mostrare prodotti, promozioni e facilitare il contatto con i clienti.',
    editable_fields: {
      hero: ['title', 'subtitle', 'cta_text', 'image_url'],
      prodotti: ['title', 'items'],
      servizi: ['title', 'items'],
      about: ['title', 'text'],
      contact: ['phone', 'email', 'address', 'social']
    },
    contenuto_default: {
      hero: {
        title: 'Scopri le Ultime Tendenze',
        subtitle: 'Qualità e stile per ogni occasione',
        cta_text: 'Esplora i Prodotti',
        image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920'
      },
      prodotti: {
        title: 'I Nostri Prodotti',
        items: [
          {
            nome: 'Collezione Primavera 2025',
            descrizione: 'Nuovi arrivi per la stagione',
            prezzo: 89.90,
            foto: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600'
          }
        ]
      },
      servizi: {
        title: 'I Nostri Servizi',
        items: [
          { icon: 'Truck', title: 'Consegna Gratuita', descrizione: 'Su ordini sopra €50' },
          { icon: 'RefreshCw', title: 'Reso Facile', descrizione: '30 giorni per cambiare idea' },
          { icon: 'Award', title: 'Garanzia', descrizione: '2 anni su tutti i prodotti' }
        ]
      },
      about: {
        title: 'Chi Siamo',
        text: 'Da oltre 20 anni selezioniamo i migliori prodotti per offrire ai nostri clienti qualità, stile e convenienza.'
      },
      contact: {
        phone: '+39 06 9876543',
        email: 'info@negozio.com',
        address: 'Via Moda 78, Milano',
        social: {
          facebook: 'negozio',
          instagram: '@negozio'
        }
      }
    },
    component_path: '/templates/RetailModern',
    is_active: true,
    version: '1.0.0'
  },
  {
    nome: 'Beauty & Wellness',
    slug: 'beauty-wellness',
    categoria: 'beauty',
    descrizione: 'Elegante e rilassante per centri estetici, parrucchieri e spa. Include prenotazioni, listino trattamenti e gallery.',
    editable_fields: {
      hero: ['title', 'subtitle', 'cta_text', 'image_url'],
      servizi: ['title', 'items'],
      team: ['title', 'members'],
      gallery: ['title', 'images'],
      contact: ['phone', 'email', 'address', 'booking_link']
    },
    contenuto_default: {
      hero: {
        title: 'Il Tuo Benessere, La Nostra Passione',
        subtitle: 'Trattamenti personalizzati per la tua bellezza',
        cta_text: 'Prenota Ora',
        image_url: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=1920'
      },
      servizi: {
        title: 'I Nostri Trattamenti',
        items: [
          {
            nome: 'Taglio e Piega',
            descrizione: 'Consulenza personalizzata e styling professionale',
            prezzo: 45.00,
            durata: '60 min',
            foto: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600'
          },
          {
            nome: 'Trattamento Viso',
            descrizione: 'Pulizia profonda e idratazione',
            prezzo: 65.00,
            durata: '75 min',
            foto: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600'
          }
        ]
      },
      team: {
        title: 'Il Nostro Team',
        members: [
          {
            nome: 'Giulia Rossi',
            ruolo: 'Hair Stylist Senior',
            foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
            bio: 'Specializzata in colorazioni e tecniche avanzate'
          }
        ]
      },
      gallery: {
        title: 'I Nostri Lavori',
        images: [
          'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
          'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800'
        ]
      },
      contact: {
        phone: '+39 06 5551234',
        email: 'info@beautycenter.com',
        address: 'Via Eleganza 12, Roma',
        booking_link: 'https://prenota.omnilypro.com'
      }
    },
    component_path: '/templates/BeautyWellness',
    is_active: true,
    version: '1.0.0'
  },
  {
    nome: 'Services Professional',
    slug: 'services-professional',
    categoria: 'servizi',
    descrizione: 'Template professionale per studi professionali, consulenti e aziende di servizi. Design pulito e orientato alla conversione.',
    editable_fields: {
      hero: ['title', 'subtitle', 'cta_text', 'image_url'],
      servizi: ['title', 'items'],
      why_us: ['title', 'reasons'],
      contact: ['phone', 'email', 'address', 'form_enabled']
    },
    contenuto_default: {
      hero: {
        title: 'Soluzioni Professionali per la Tua Attività',
        subtitle: 'Esperienza, competenza e risultati garantiti',
        cta_text: 'Richiedi Consulenza',
        image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920'
      },
      servizi: {
        title: 'I Nostri Servizi',
        items: [
          {
            icon: 'Briefcase',
            nome: 'Consulenza Strategica',
            descrizione: 'Analisi approfondita e piani d\'azione personalizzati',
            features: ['Analisi di mercato', 'Piano strategico', 'Follow-up mensile']
          },
          {
            icon: 'TrendingUp',
            nome: 'Ottimizzazione Processi',
            descrizione: 'Miglioriamo l\'efficienza della tua organizzazione',
            features: ['Audit completo', 'Implementazione', 'Training del team']
          }
        ]
      },
      why_us: {
        title: 'Perché Sceglierci',
        reasons: [
          { icon: 'Award', title: '15+ Anni di Esperienza', descrizione: 'Leader nel settore' },
          { icon: 'Users', title: '500+ Clienti Soddisfatti', descrizione: 'Testimonianze verificate' },
          { icon: 'CheckCircle', title: 'Risultati Garantiti', descrizione: 'O rimborsati' }
        ]
      },
      contact: {
        phone: '+39 06 1112233',
        email: 'info@servizi.com',
        address: 'Via Business 89, Milano',
        form_enabled: true
      }
    },
    component_path: '/templates/ServicesProfessional',
    is_active: true,
    version: '1.0.0'
  }
];

async function populateTemplates() {
  if (!API_TOKEN) {
    console.error('❌ Errore: API_TOKEN non trovato');
    console.log('💡 Usa: STRAPI_API_TOKEN=your_token node scripts/populate-templates.js');
    process.exit(1);
  }

  console.log('🚀 Inizio popolamento template...\n');

  for (const template of templates) {
    try {
      console.log(`📝 Creazione template: ${template.nome}...`);

      const response = await fetch(`${STRAPI_URL}/api/website-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({ data: template }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error(`   ❌ Errore: ${error.error?.message || response.statusText}`);
        continue;
      }

      const result = await response.json();
      console.log(`   ✅ Template "${template.nome}" creato con ID: ${result.data.id}`);

    } catch (error) {
      console.error(`   ❌ Errore nella creazione: ${error.message}`);
    }
  }

  console.log('\n✨ Popolamento completato!');
  console.log('🔗 Verifica su: http://localhost:1337/admin/content-manager/collection-types/api::website-template.website-template');
}

populateTemplates();
