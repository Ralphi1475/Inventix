// src/app/creer-societe/page.tsx
'use client';

import { useState, useEffect } from 'react'; // ✅ useEffect doit être importé
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { createOrganization } from '@/lib/api';
import { SUPER_ROOT_EMAIL } from '@/lib/constants'; // ✅ Import de la constante

export default function CreerSocietePage() {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // ✅ Vérification d'accès Super Root au montage du composant
useEffect(() => {
  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== SUPER_ROOT_EMAIL) {
      alert('Accès réservé au Super Root');
      router.push('/gestion');
    }
  };
  checkAccess();
}, [router]); // ✅ router dans les dépendances pour éviter les warnings

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email || user.email !== SUPER_ROOT_EMAIL) {
      setError('Accès refusé');
      setLoading(false);
      return;
    }

    const result = await createOrganization(user.email, {
      name: nom.trim(),
      description: description.trim() || null,
    });

    if (result.success) {
      alert('Société créée avec succès !');
      router.push('/gestion');
    } else {
      setError(result.error || 'Erreur lors de la création');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          🔐 Création de société (Super Root)
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Nom de la société *</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Description (optionnel)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Création en cours...' : 'Créer la société'}
          </button>
        </form>

        <button
          onClick={() => router.push('/gestion')}
          className="mt-4 w-full text-center text-gray-600 hover:text-gray-800"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}