'use client';
import React, { useState } from 'react';
import { Contact } from '@/types';

interface ContactFormProps {
  contact: Contact | null;
  type: string;
  onSubmit: (data: Contact) => void;
  onCancel: () => void;
}

export function ContactForm({ contact, type, onSubmit, onCancel }: ContactFormProps) {
  const [formData, setFormData] = useState<Contact>(contact || { 
    id: '', 
    type: type, 
    societe: '', 
    nom: '', 
    prenom: '', 
    adresse: '', 
    codePostal: '', 
    ville: '', 
    pays: 'Belgique', 
    mobile: '', 
    numeroTVA: '', 
    numeroCompte: '', 
    email: '' 
  });

  const handleChange = (field: keyof Contact, value: string) => { 
    setFormData(prev => ({ ...prev, [field]: value })); 
  };

  const handleSubmit = () => { 
    onSubmit({
      ...formData,
      id: formData.id || String(Date.now()),
      type: type
    }); 
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
        <h3 className="text-2xl font-bold mb-4">
          {contact ? 'Modifier' : 'Nouveau'} {type === 'client' ? 'Client' : 'Fournisseur'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Société *</label>
            <input type="text" value={formData.societe} onChange={(e) => handleChange('societe', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom</label>
              <input type="text" value={formData.nom} onChange={(e) => handleChange('nom', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Prénom</label>
              <input type="text" value={formData.prenom} onChange={(e) => handleChange('prenom', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Adresse</label>
            <input type="text" value={formData.adresse} onChange={(e) => handleChange('adresse', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Code Postal</label>
              <input type="text" value={formData.codePostal} onChange={(e) => handleChange('codePostal', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ville</label>
              <input type="text" value={formData.ville} onChange={(e) => handleChange('ville', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pays</label>
              <input type="text" value={formData.pays} onChange={(e) => handleChange('pays', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mobile</label>
              <input type="tel" value={formData.mobile} onChange={(e) => handleChange('mobile', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Numéro TVA</label>
              <input type="text" value={formData.numeroTVA} onChange={(e) => handleChange('numeroTVA', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Numéro de Compte</label>
              <input type="text" value={formData.numeroCompte} onChange={(e) => handleChange('numeroCompte', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="flex space-x-4 pt-4">
            <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
              {contact ? 'Modifier' : 'Créer'}
            </button>
            <button onClick={onCancel} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300">
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}