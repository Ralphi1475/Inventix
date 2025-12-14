'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDemandes() {
  const [demandes, setDemandes] = useState<any[]>([]);

  useEffect(() => {
    loadDemandes();
  }, []);

  const loadDemandes = async () => {
    const { data } = await supabase
      .from('demandes_societes')
      .select('*')
      .order('created_at', { ascending: false });
    
    setDemandes(data || []);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Demandes de création de société</h1>
      <div className="space-y-4">
        {demandes.map((d) => (
          <div key={d.id} className="bg-white p-4 rounded-lg shadow border">
            <div className="font-bold">{d.nom_societe}</div>
            <div className="text-sm text-gray-600">{d.user_email}</div>
            <div className="text-sm mt-2">{d.description}</div>
            {d.telephone && <div className="text-sm">📞 {d.telephone}</div>}
            <div className="text-xs text-gray-400 mt-2">
              {new Date(d.created_at).toLocaleString('fr-FR')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}