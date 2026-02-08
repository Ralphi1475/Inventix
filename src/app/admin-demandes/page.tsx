'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { SUPER_ROOT_EMAILS } from '@/lib/constants';
import { Mail, Calendar, Phone, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function AdminDemandes() {
  const [demandes, setDemandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAccessAndLoad();
  }, []);

  const checkAccessAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
		if (!user) {
		alert('Vous devez être connecté');
		router.push('/login');
		return;
		}
		if (!SUPER_ROOT_EMAILS.includes(user.email)) {
		alert('Accès réservé au Super Root');
		router.push('/gestion');
		return;
		}

    loadDemandes();
  };

  const loadDemandes = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('demandes_societes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erreur chargement demandes:', error);
    } else {
      setDemandes(data || []);
    }
    
    setLoading(false);
  };

  const handleUpdateStatut = async (id: string, newStatut: string) => {
    const { error } = await supabase
      .from('demandes_societes')
      .update({ statut: newStatut })
      .eq('id', id);

    if (error) {
      alert('Erreur lors de la mise à jour');
    } else {
      loadDemandes();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Demandes de création de société</h1>
          <button
            onClick={() => router.push('/gestion')}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            ← Retour
          </button>
        </div>

        {demandes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Aucune demande pour le moment
          </div>
        ) : (
          <div className="space-y-4">
            {demandes.map((d) => (
              <div key={d.id} className="bg-white p-6 rounded-lg shadow border hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{d.nom_societe}</h3>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-400" />
                        <span>{d.user_email}</span>
                      </div>
                      
                      {d.telephone && (
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-gray-400" />
                          <span>{d.telephone}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span>{new Date(d.created_at).toLocaleString('fr-FR')}</span>
                      </div>
                    </div>

                    {d.description && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-700">{d.description}</p>
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      d.statut === 'approuvee' 
                        ? 'bg-green-100 text-green-700'
                        : d.statut === 'rejetee'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {d.statut === 'approuvee' && <CheckCircle size={16} />}
                      {d.statut === 'rejetee' && <XCircle size={16} />}
                      {d.statut === 'en_attente' && <Clock size={16} />}
                      {d.statut === 'approuvee' ? 'Approuvée' : 
                       d.statut === 'rejetee' ? 'Rejetée' : 
                       'En attente'}
                    </span>
                  </div>
                </div>

                {d.statut === 'en_attente' && (
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <button
                      onClick={() => handleUpdateStatut(d.id, 'approuvee')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      ✓ Approuver
                    </button>
                    <button
                      onClick={() => handleUpdateStatut(d.id, 'rejetee')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      ✗ Rejeter
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}