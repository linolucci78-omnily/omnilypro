import { useEffect, useState } from 'react';
import { strapiClient } from '../lib/strapi';
import type { WebsiteTemplate } from '../lib/strapi';
import { Plus, Edit, Trash2, Eye, Globe } from 'lucide-react';

interface TemplateLibraryProps {
  onSelectTemplate?: (template: WebsiteTemplate) => void;
}

export default function TemplateLibrary({ onSelectTemplate }: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<WebsiteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadTemplates();
  }, [selectedCategory]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const filters = selectedCategory !== 'all' 
        ? { category: selectedCategory, is_active: true }
        : { is_active: true };
      
      const data = await strapiClient.getTemplates(filters);
      setTemplates(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore caricamento template');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'all', label: 'Tutti' },
    { value: 'ristorante', label: '🍕 Ristorante' },
    { value: 'bar', label: '☕ Bar' },
    { value: 'negozio', label: '🛍️ Negozio' },
    { value: 'servizi', label: '🔧 Servizi' },
    { value: 'generico', label: '📄 Generico' },
  ];

  const getTierBadge = (tier: string) => {
    const styles = {
      free: 'bg-green-100 text-green-800 border-green-200',
      basic: 'bg-blue-100 text-blue-800 border-blue-200',
      premium: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return styles[tier as keyof typeof styles] || styles.free;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p className="font-semibold">Errore</p>
        <p className="text-sm">{error}</p>
        <button 
          onClick={loadTemplates}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Template Siti Web</h2>
          <p className="text-gray-600 mt-1">Scegli un template per il tuo cliente</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus size={20} />
          Nuovo Template
        </button>
      </div>

      {/* Filtri categoria */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-4 py-2 rounded-lg border whitespace-nowrap transition-colors ${
              selectedCategory === cat.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid template */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => {
          const imageUrl = template.attributes.preview_image?.data?.attributes?.url;
          const fullImageUrl = imageUrl?.startsWith('http') 
            ? imageUrl 
            : `${import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337'}${imageUrl}`;

          return (
            <div
              key={template.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Preview Image */}
              <div className="aspect-video bg-gray-100 relative">
                {imageUrl ? (
                  <img
                    src={fullImageUrl}
                    alt={template.attributes.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Globe size={48} className="text-gray-300" />
                  </div>
                )}
                
                {/* Tier Badge */}
                <span
                  className={`absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full border ${getTierBadge(
                    template.attributes.price_tier
                  )}`}
                >
                  {template.attributes.price_tier.toUpperCase()}
                </span>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900">
                  {template.attributes.name}
                </h3>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                  {template.attributes.description}
                </p>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  {template.attributes.demo_url && (
                    <a
                      href={template.attributes.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      <Eye size={16} />
                      Anteprima
                    </a>
                  )}
                  <button
                    onClick={() => onSelectTemplate?.(template)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus size={16} />
                    Usa
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {templates.length === 0 && (
        <div className="text-center py-12">
          <Globe size={48} className="mx-auto text-gray-300" />
          <p className="text-gray-600 mt-4">Nessun template trovato</p>
        </div>
      )}
    </div>
  );
}
