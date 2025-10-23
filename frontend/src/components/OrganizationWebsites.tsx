import { useEffect, useState } from 'react';
import { directusClient } from '../lib/directus';
import type { DirectusWebsite } from '../lib/directus';
import { Globe, Edit, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';

interface OrganizationWebsitesProps {
  organizationId: string;
  organizationName: string;
}

export default function OrganizationWebsites({
  organizationId,
  organizationName
}: OrganizationWebsitesProps) {
  const [websites, setWebsites] = useState<DirectusWebsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWebsites();
  }, [organizationId]);

  const loadWebsites = async () => {
    try {
      setLoading(true);
      const data = await directusClient.getOrganizationWebsites(organizationId);
      setWebsites(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore caricamento siti');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (website: DirectusWebsite) => {
    try {
      const newStatus = !website.published;
      await directusClient.togglePublish(website.id, newStatus);
      await loadWebsites();
    } catch (err) {
      alert('Errore aggiornamento stato: ' + (err instanceof Error ? err.message : 'Errore'));
    }
  };

  const handleDelete = async (website: DirectusWebsite) => {
    if (!confirm(`Eliminare il sito "${website.domain || website.site_name}"?`)) {
      return;
    }

    try {
      await directusClient.deleteWebsite(website.id);
      await loadWebsites();
    } catch (err) {
      alert('Errore eliminazione: ' + (err instanceof Error ? err.message : 'Errore'));
    }
  };

  const getPublicUrl = (domain: string | null, siteName: string) => {
    if (domain) {
      return `https://${domain}`;
    }
    const baseUrl = import.meta.env.VITE_PUBLIC_SITES_URL || 'https://omnilypro.com';
    return `https://${siteName.toLowerCase().replace(/\s+/g, '-')}.${baseUrl.replace('https://', '')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p className="font-semibold">Errore</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Siti Web - {organizationName}
        </h3>
        <p className="text-sm text-gray-600">Gestisci i siti web dell'organizzazione</p>
      </div>

      {/* Lista siti */}
      {websites.length > 0 ? (
        <div className="space-y-3">
          {websites.map((website) => {
            const publicUrl = getPublicUrl(website.domain, website.site_name);
            const isPublished = website.published;

            return (
              <div
                key={website.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* URL e stato */}
                    <div className="flex items-center gap-2">
                      <Globe size={18} className="text-gray-400" />
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {website.domain || website.site_name}
                      </a>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          isPublished
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {isPublished ? '🟢 Pubblicato' : '⚫ Bozza'}
                      </span>
                    </div>

                    {/* Nome sito */}
                    <p className="text-sm text-gray-600 mt-2">
                      {website.site_name}
                    </p>

                    {/* Date */}
                    <p className="text-xs text-gray-400 mt-1">
                      Creato: {new Date(website.created_at).toLocaleDateString('it-IT')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Visualizza */}
                    {isPublished && (
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Visualizza sito"
                      >
                        <ExternalLink size={18} />
                      </a>
                    )}

                    {/* Pubblica/Depubblica */}
                    <button
                      onClick={() => handleTogglePublish(website)}
                      className={`p-2 rounded-lg ${
                        isPublished
                          ? 'text-orange-600 hover:bg-orange-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={isPublished ? 'Depubblica' : 'Pubblica'}
                    >
                      {isPublished ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>

                    {/* Modifica */}
                    <button
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Modifica contenuto"
                    >
                      <Edit size={18} />
                    </button>

                    {/* Elimina */}
                    <button
                      onClick={() => handleDelete(website)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Elimina"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Globe size={48} className="mx-auto text-gray-300" />
          <p className="text-gray-600 mt-4">Nessun sito web creato</p>
          <p className="text-sm text-gray-500 mt-1">
            Crea il primo sito scegliendo un template
          </p>
        </div>
      )}
    </div>
  );
}
