'use client';
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { Categorie } from '@/types';

interface CategoriesProps {
  categories: Categorie[];
  setCategories: (categories: Categorie[]) => void;
  onSave: (categorie: Categorie, isUpdate: boolean) => Promise<void>; // Ajoutez isUpdate
  onDelete: (id: string) => Promise<void>;
}

export function Categories({ categories, setCategories, onSave, onDelete }: CategoriesProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingCategorie, setEditingCategorie] = useState<Categorie | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Categorie>({
    id: '',
    denomination: ''
	type: 'produit' // ✅ ajout du type
  });

  const filteredCategories = categories.filter(cat =>
    cat.denomination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openForm = (categorie: Categorie | null = null) => {
    if (categorie) {
      setFormData(categorie);
      setEditingCategorie(categorie);
    } else {
      setFormData({
        id: String(Date.now()),
        denomination: ''
		type: 'produit' // ✅ valeur par défaut à la création
      });
      setEditingCategorie(null);
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCategorie(null);
    setFormData({ id: '', denomination: '' });
  };

const handleSubmit = async () => {
  if (!formData.denomination.trim()) {
    alert('Veuillez saisir une dénomination');
    return;
  }

  try {
    const isUpdate = editingCategorie !== null; // Déterminer si c'est une modification
    await onSave(formData, isUpdate); // Passer le paramètre
    
    if (isUpdate) {
      setCategories(categories.map(c => c.id === formData.id ? formData : c));
    } else {
      setCategories([...categories, formData]);
    }
    
    closeForm();
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    alert('Erreur lors de la sauvegarde de la catégorie');
  }
};

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        await onDelete(id);
        setCategories(categories.filter(c => c.id !== id));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la catégorie');
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Catégories</h2>
        <button 
          onClick={() => openForm()} 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>Nouvelle Catégorie</span>
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher une catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Tableau des catégories */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Dénomination</th>
                <th className="p-3 text-left w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={2} className="p-8 text-center text-gray-500">
                    Aucune catégorie trouvée
                  </td>
                </tr>
              ) : (
                filteredCategories.map((categorie) => (
                  <tr key={categorie.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{categorie.denomination}</td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openForm(categorie)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(categorie.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formulaire modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">
              {editingCategorie ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Dénomination *</label>
                <input
                  type="text"
                  value={formData.denomination}
                  onChange={(e) => setFormData({ ...formData, denomination: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ex: Pochettes, Sacs, Accessoires..."
                />
              </div>
			    <div>
    <label className="block text-sm font-medium mb-1">Type *</label>
    <select
      value={formData.type}
      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'produit' | 'achat' })}
      className="w-full px-3 py-2 border rounded-lg"
    >
      <option value="produit">Catégorie de produit</option>
      <option value="achat">Catégorie d'achat</option>
    </select>
  </div>

  <div className="flex space-x-4 pt-4">
    <button
      onClick={handleSubmit}
      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
    >
      {editingCategorie ? 'Modifier' : 'Créer'}
    </button>
    <button
      onClick={closeForm}
      className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
    >
      Annuler
    </button>
  </div>
</div>
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingCategorie ? 'Modifier' : 'Créer'}
                </button>
                <button
                  onClick={closeForm}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}