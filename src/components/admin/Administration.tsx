// src/components/admin/Administration.tsx
'use client';
import { useRouter } from 'next/navigation';
import { Building2, FileText } from 'lucide-react';

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
            className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center gap-3"
          >
            <Building2 size={24} className="text-blue-600" />
            <div>
              <div className="font-semibold">Créer une nouvelle société</div>
              <div className="text-sm text-gray-600">Créer directement une société pour un utilisateur</div>
            </div>
          </button>
          
          <button
            onClick={() => router.push('/admin-demandes')}
            className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 flex items-center gap-3"
          >
            <FileText size={24} className="text-green-600" />
            <div>
              <div className="font-semibold">Demandes de création de sociétés</div>
              <div className="text-sm text-gray-600">Consulter les demandes en attente</div>
            </div>
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">
          <strong>Connecté en tant que :</strong> {userEmail}
        </p>
      </div>
    </div>
  );
}