'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import OrganizationSelector from '@/components/organizations/OrganizationSelector';
import { Building2, Send } from 'lucide-react';

export default function SelectOrganizationPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDemande, setShowDemande] = useState(false);
  const [nomSociete, setNomSociete] = useState('');
  const [description, setDescription] = useState('');
  const [telephone, setTelephone] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
      setLoading(false);
    };
    loadUser();
  }, []);

  const handleOrganizationSelected = () => {
    window.location.href = '/gestion';
  };

  const handleDemandeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMessage('');

    try {
      const response = await fetch('/api/demande-societe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          nomSociete,
          description,
          telephone
        })
      });

      if (response.ok) {
        setMessage('✅ Demande envoyée ! Vous serez contacté prochainement.');
        setNomSociete('');
        setDescription('');
        setTelephone('');
        setTimeout(() => setShowDemande(false), 3000);
      } else {
        setMessage('❌ Erreur lors de l\'envoi');
      }
    } catch (error) {
      setMessage('❌ Erreur réseau');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Vous devez être connecté</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <OrganizationSelector 
          userEmail={userEmail} 
          onSelect={handleOrganizationSelected}
        />

        <div className="mt-6">
          {!showDemande ? (
            <button
              onClick={() => setShowDemande(true)}
              className="w-full flex items-center justify-center gap-2 p-4 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Building2 size={20} />
              <span className="font-medium">Demander la création d'une société</span>
            </button>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">Demande de création de société</h3>
              
              {message && (
                <div className={`mb-4 p-3 rounded ${message.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleDemandeSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Nom de la société *</label>
                  <input
                    type="text"
                    value={nomSociete}
                    onChange={(e) => setNomSociete(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                    disabled={sending}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Description / Activité</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                    disabled={sending}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Téléphone (optionnel)</label>
                  <input
                    type="tel"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={sending}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Send size={18} />
                    {sending ? 'Envoi...' : 'Envoyer la demande'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDemande(false)}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                    disabled={sending}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}