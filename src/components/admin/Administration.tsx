// src/components/admin/Administration.tsx
'use client';

import { useRouter } from 'next/navigation';

export default function Administration({ userEmail }: { userEmail: string }) {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Administration — Super Root</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Gestion globale</h2>
        
        <div className="space-y-3">
          <button
            onClick={() => router.push('/creer-societe')}
            className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200"
          >
            ➕ Créer une nouvelle société
          </button>
          
          {/* Tu pourras ajouter ici : liste des utilisateurs, suppression globale, stats, etc. */}
        </div>
      </div>
    </div>
  );
}