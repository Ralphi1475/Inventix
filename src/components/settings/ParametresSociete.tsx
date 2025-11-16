'use client';
import React, { useState, useEffect } from 'react';  // ✅ Ajouter useEffect

interface ParametresSocieteProps {
  parametres: any;
  onSave: (params: any) => Promise<boolean>;
}

export function ParametresSociete({ parametres, onSave }: ParametresSocieteProps) {
  console.log('🏢 ParametresSociete - Props reçues:', { parametres });
  
  const [formData, setFormData] = useState(parametres || {});
  
  console.log('📝 FormData actuel:', formData);  // ✅ AJOUTER CE LOG

useEffect(() => {
  console.log('🔄 useEffect déclenché, parametres:', parametres);
  if (parametres) {
    console.log('✅ Mise à jour du formulaire avec:', parametres);
    // ✅ Convertir camelCase → snake_case
    setFormData({
      id: parametres.id || '',
      societe_nom: parametres.societeNom || '',
      societe_adresse: parametres.societeAdresse || '',
      societe_code_postal: parametres.societeCodePostal || '',
      societe_ville: parametres.societeVille || '',
      societe_pays: parametres.societePays || '',
      societe_telephone: parametres.societeTelephone || '',
      societe_email: parametres.societeEmail || '',
      societe_tva: parametres.societeTva || '',
      societe_iban: parametres.societeIban || '',
      user_email: parametres.userEmail || ''
    });
  }
}, [parametres]);

  const handleChange = (cle: string, valeur: string) => {
    setFormData({ ...formData, [cle]: valeur });
  };

  const handleSave = async () => {
    const success = await onSave(formData);
    if (success) {
      alert('Paramètres sauvegardés avec succès !');
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Paramètres de la Société</h2>
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom de la société</label>
            <input type="text" value={formData.societe_nom} onChange={(e) => handleChange('societe_nom', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Adresse</label>
            <input type="text" value={formData.societe_adresse} onChange={(e) => handleChange('societe_adresse', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Code postal</label>
              <input type="text" value={formData.societe_code_postal} onChange={(e) => handleChange('societe_code_postal', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ville</label>
              <input type="text" value={formData.societe_ville} onChange={(e) => handleChange('societe_ville', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pays</label>
            <input type="text" value={formData.societe_pays} onChange={(e) => handleChange('societe_pays', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Téléphone</label>
              <input type="text" value={formData.societe_telephone} onChange={(e) => handleChange('societe_telephone', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" value={formData.societe_email} onChange={(e) => handleChange('societe_email', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Numéro TVA</label>
              <input type="text" value={formData.societe_tva} onChange={(e) => handleChange('societe_tva', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">IBAN</label>
              <input type="text" value={formData.societe_iban} onChange={(e) => handleChange('societe_iban', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <button onClick={handleSave} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold mt-6">
            Sauvegarder les paramètres
          </button>
        </div>
      </div>
    </div>
  );
}