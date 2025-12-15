import React, { useState } from 'react'
import { Tv, Image, Play, Calendar, BarChart3, Layout } from 'lucide-react'
import MediaLibrary from '../../components/Admin/Signage/MediaLibrary'
import PlaylistManager from '../../components/Admin/Signage/PlaylistManager'
import SlideBuilder from '../../components/Admin/Signage/SlideBuilder'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const SignageCMSPage: React.FC = () => {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<'media' | 'slides' | 'playlists' | 'schedules' | 'analytics'>('media')
    const [userOrgId, setUserOrgId] = useState<string | null>(null)

    // Load user's organization
    React.useEffect(() => {
        const loadOrg = async () => {
            if (!user) return

            const { data } = await supabase
                .from('organization_users')
                .select('org_id')
                .eq('user_id', user.id)
                .limit(1)
                .single()

            if (data) {
                setUserOrgId(data.org_id)
            }
        }

        loadOrg()
    }, [user])

    if (!userOrgId) {
        return <div className="p-8">Caricamento...</div>
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <header className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-800">
                            <Tv className="text-purple-600" size={32} />
                            Digital Signage CMS
                        </h1>
                        <p className="text-slate-500 mt-2">Sistema completo per la gestione dei contenuti sui tuoi display</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('media')}
                        className={`px-6 py-3 font-semibold transition-all relative ${
                            activeTab === 'media'
                                ? 'text-purple-600'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Image size={20} />
                            Media Library
                        </div>
                        {activeTab === 'media' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('slides')}
                        className={`px-6 py-3 font-semibold transition-all relative ${
                            activeTab === 'slides'
                                ? 'text-purple-600'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Layout size={20} />
                            Slide
                        </div>
                        {activeTab === 'slides' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('playlists')}
                        className={`px-6 py-3 font-semibold transition-all relative ${
                            activeTab === 'playlists'
                                ? 'text-purple-600'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Play size={20} />
                            Playlist
                        </div>
                        {activeTab === 'playlists' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('schedules')}
                        className={`px-6 py-3 font-semibold transition-all relative ${
                            activeTab === 'schedules'
                                ? 'text-purple-600'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Calendar size={20} />
                            Programmazione
                        </div>
                        {activeTab === 'schedules' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-6 py-3 font-semibold transition-all relative ${
                            activeTab === 'analytics'
                                ? 'text-purple-600'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <BarChart3 size={20} />
                            Analytics
                        </div>
                        {activeTab === 'analytics' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
                        )}
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="mt-6">
                {activeTab === 'media' && <MediaLibrary organizationId={userOrgId} />}

                {activeTab === 'slides' && <SlideBuilder organizationId={userOrgId} />}

                {activeTab === 'playlists' && <PlaylistManager organizationId={userOrgId} />}

                {activeTab === 'schedules' && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Programmazione (Coming Soon)</h3>
                        <p className="text-gray-600 mb-4">Pianifica quando mostrare le tue playlist su ogni display</p>
                        <ul className="text-left max-w-md mx-auto space-y-2 text-gray-700">
                            <li>• Orari specifici (es. menù colazione 7-11)</li>
                            <li>• Giorni della settimana</li>
                            <li>• Range di date</li>
                            <li>• Priorità automatica</li>
                        </ul>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <BarChart3 size={64} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Analytics (Coming Soon)</h3>
                        <p className="text-gray-600 mb-4">Monitora le performance dei tuoi contenuti</p>
                        <ul className="text-left max-w-md mx-auto space-y-2 text-gray-700">
                            <li>• Visualizzazioni per slide</li>
                            <li>• Tempo di visualizzazione</li>
                            <li>• Display attivi/inattivi</li>
                            <li>• Report esportabili</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SignageCMSPage
