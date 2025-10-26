'use client';
import React, { useState } from 'react';
import { Article, Categorie } from '@/types';

// ✅ Import de la fonction utilitaire pour récupérer l'URL du script
const getGoogleScriptUrl = (): string => {
  if (typeof window !== 'undefined') {
    const url = localStorage.getItem('googleScriptUrl');
    return url || '';
  }
  return '';
};

interface ArticleFormProps {
  article: Article | null;
  categories: Categorie[];
  onSubmit: (data: Article) => void;
  onCancel: () => void;
}

export function ArticleForm({ article, categories, onSubmit, onCancel }: ArticleFormProps) {
  const [formData, setFormData] = useState<Article>(article || { 
    id: '', 
    numero: '', 
    categorie: '', 
    nom: '', 
    description: '', 
    image: '', 
    prixAchat: 0, 
    margePercent: 30, 
    tauxTVA: 21, 
    stock: 0, 
    emplacement: '',
    unite: 'Pièce',
    conditionnement: ''
  });

  const [uploading, setUploading] = useState(false);

  const handleChange = (field: keyof Article, value: string | number) => { 
    setFormData(prev => ({ ...prev, [field]: value })); 
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Format non supporté. Veuillez choisir une image JPEG, PNG, WebP ou GIF.');
      return;
    }

    setUploading(true);

    try {
      const scriptUrl = getGoogleScriptUrl();
      if (!scriptUrl) {
        alert('⚠️ URL du Google Script non configurée.\nAllez dans Configuration pour la définir.');
        return;
      }

      // Lire le fichier comme ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Convertir en chaîne binaire (requis par Google Apps Script)
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }

      // Appel POST vers le script avec action=uploadImage
      const response = await fetch(`${scriptUrl}?action=uploadImage`, {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
        },
        body: binary,
      });

      const result = await response.json();

      if (result.success) {
        setFormData(prev => ({ ...prev, image: result.url }));
      } else {
        alert('❌ Erreur lors de l’upload :\n' + (result.error || 'Erreur inconnue'));
      }
    } catch (err) {
      console.error('Erreur upload:', err);
      alert('⚠️ Une erreur est survenue lors de l’upload.\nVérifiez votre connexion et les permissions du script.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => { 
    if (!formData.categorie) {
      alert('Veuillez sélectionner une catégorie');
      return;
    }
    onSubmit({ 
      ...formData, 
      prixAchat: parseFloat(String(formData.prixAchat)), 
      margePercent: parseFloat(String(formData.margePercent)), 
      tauxTVA: parseFloat(String(formData.tauxTVA)), 
      stock: parseInt(String(formData.stock)) 
    }); 
  };

  const prixVenteHT = formData.prixAchat * (1 + formData.margePercent / 100);
  const prixVenteTTC = prixVenteHT * (1 + formData.tauxTVA / 100);
  const unitesDisponibles = ['Pièce', 'Kilogramme', 'Gramme', 'Pack', 'Point', 'Couleur'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
        <h3 className="text-2xl font-bold mb-4">{article ? "Modifier l'article" : 'Nouvel Article'}</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Numéro *</label>
              <input type="text" value={formData.numero} onChange={(e) => handleChange('numero', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Catégorie *</label>
              <select 
                value={formData.categorie} 
                onChange={(e) => handleChange('categorie', e.target.value)} 
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.denomination}>
                    {cat.denomination}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nom *</label>
            <input type="text" value={formData.nom} onChange={(e) => handleChange('nom', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={formData.description} onChange={(e) => handleChange('description', e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg" />
          </div>

          {/* ✅ Section Upload Image */}
          <div>
            <label className="block text-sm font-medium mb-1">Image de l'article</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-3 py-2 border rounded-lg"
              disabled={uploading}
            />
            {uploading && <p className="text-sm text-blue-600 mt-1">Upload en cours...</p>}
            {formData.image && (
              <div className="mt-2">
                <img 
                  src={formData.image} 
                  alt="Aperçu" 
                  className="max-w-32 max-h-32 object-contain border rounded shadow-sm" 
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Prix achat (€) *</label>
              <input type="number" step="0.01" value={formData.prixAchat} onChange={(e) => handleChange('prixAchat', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Marge (%) *</label>
              <input type="number" step="0.01" value={formData.margePercent} onChange={(e) => handleChange('margePercent', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">TVA (%) *</label>
              <input type="number" step="0.01" value={formData.tauxTVA} onChange={(e) => handleChange('tauxTVA', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm"><strong>Prix vente HT :</strong> {prixVenteHT.toFixed(2)} €</p>
            <p className="text-sm font-bold text-blue-800"><strong>Prix vente TTC :</strong> {prixVenteTTC.toFixed(2)} €</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Stock *</label>
              <input type="number" value={formData.stock} onChange={(e) => handleChange('stock', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Emplacement *</label>
              <input type="text" value={formData.emplacement} onChange={(e) => handleChange('emplacement', e.target.value)} placeholder="ex: A1-B2" className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unité *</label>
              <select value={formData.unite} onChange={(e) => handleChange('unite', e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                {unitesDisponibles.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Conditionnement</label>
            <input type="text" value={formData.conditionnement} onChange={(e) => handleChange('conditionnement', e.target.value)} placeholder="ex: Boîte de 10, Sachet de 500g..." className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="flex space-x-4 pt-4">
            <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">{article ? 'Modifier' : 'Créer'}</button>
            <button onClick={onCancel} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300">Annuler</button>
          </div>
        </div>
      </div>
    </div>
  );
}