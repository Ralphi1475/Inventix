'use client';
import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { Contact } from '@/types';

interface AchatsProps {
  achats: any[];
  fournisseurs: Contact[];
  sauvegarderAchat: (achat: any, fournisseurs: Contact[]) => Promise<void>;
  modifierAchat: (achat: any, fournisseurs: Contact[]) => Promise<void>;
  supprimerAchat: (id: string) => Promise<void>;
}

export function Achats({ achats, fournisseurs, sauvegarderAchat, modifierAchat, supprimerAchat }: AchatsProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingAchat, setEditingAchat] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [formData, setFormData] = useState<any>({
    id: '',
    reference: '',
    dateAchat: '',
    dateEcheance: '',
    datePaiement: '',
    fournisseurId: '',
    modePaiement: '',
    montantHtva: 0,
    montantTtc: 0,
    description: '',
    categorie: ''
  });

  const categories = ['Loyers', 'Matiere premiere', 'Administratif'];
  const modesPaiement = ['Espèces', 'Carte bancaire', 'Virement', 'Chèque'];

  const filteredAchats = useMemo(() => {
    let filtered = [...achats];
    
    if (searchTerm) {
      filtered = filtered.filter(a => 
        (a.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.reference || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterCategorie) {
      filtered = filtered.filter(a => a.categorie === filterCategorie);
    }
    
    if (dateDebut) {
      filtered = filtered.filter(a => a.dateAchat >= dateDebut);
    }
    if (dateFin) {
      filtered = filtered.filter(a => a.dateAchat <= dateFin);
    }
    
    return filtered.sort((a, b) => new Date(b.dateAchat).getTime() - new Date(a.dateAchat).getTime());
  }, [achats, searchTerm, filterCategorie, dateDebut, dateFin]);

  const totalTTC = useMemo(() => {
    return filteredAchats.reduce((sum, achat) => sum + (achat.montantTtc || 0), 0);
  }, [filteredAchats]);

  const openForm = (achat: any = null) => {
    if (achat) {
      setFormData(achat);
      setEditingAchat(achat);
    } else {
      setFormData({
        id: '',
        reference: 'A' + Date.now(),
        dateAchat: new Date().toISOString().split('T')[0],
        dateEcheance: '',
        datePaiement: '',
        fournisseurId: '',
        modePaiement: '',
        montantHtva: 0,
        montantTtc: 0,
        description: '',
        categorie: ''
      });
      setEditingAchat(null);
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingAchat(null);
    setFormData({
      id: '',
      reference: '',
      dateAchat: '',
      dateEcheance: '',
      datePaiement: '',
      fournisseurId: '',
      modePaiement: '',
      montantHtva: 0,
      montantTtc: 0,
      description: '',
      categorie: ''
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    if (!formData.reference || !formData.dateAchat || !formData.fournisseurId || !formData.categorie) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    const achat = {
      id: formData.id || String(Date.now()),
      reference: formData.reference,
      dateAchat: formData.dateAchat,
      dateEcheance: formData.dateEcheance,
      datePaiement: formData.datePaiement,
      fournisseurId: formData.fournisseurId,
      modePaiement: formData.modePaiement,
      montantHtva: parseFloat(formData.montantHtva) || 0,
      montantTtc: parseFloat(formData.montantTtc) || 0,
      description: formData.description,
      categorie: formData.categorie
    };

    try {
      if (editingAchat && editingAchat.id) {
        await modifierAchat(achat, fournisseurs);
      } else {
        await sauvegarderAchat(achat, fournisseurs);
      }
      closeForm();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'achat:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet achat ?')) {
      await supprimerAchat(id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Achats / Frais</h2>
        <button onClick={() => openForm()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700">
          <Plus size={20} />
          <span>Nouvel Achat</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher par référence ou description..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg" 
            />
          </div>
          <select 
            value={filterCategorie} 
            onChange={(e) => setFilterCategorie(e.target.value)} 
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">Toutes les catégories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <div>
            <input 
              type="date" 
              placeholder="Date début"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg" 
            />
          </div>
          <div>
            <input 
              type="date" 
              placeholder="Date fin"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg" 
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-700">Total des achats affichés :</span>
          <span className="text-2xl font-bold text-blue-600">{totalTTC.toFixed(2)} €</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">{filteredAchats.length} achat(s) trouvé(s)</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Référence</th>
                <th className="p-3 text-left">Date achat</th>
                <th className="p-3 text-left">Fournisseur</th>
                <th className="p-3 text-left">Catégorie</th>
                <th className="p-3 text-left">Montant TTC</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAchats.map((achat: any) => (
                <tr key={achat.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono">{achat.reference}</td>
                  <td className="p-3">{achat.dateAchat}</td>
                  <td className="p-3">{achat.nomFournisseur || 'Non défini'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      achat.categorie === 'Loyers' ? 'bg-green-100 text-green-800' :
                      achat.categorie === 'Matiere premiere' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {achat.categorie}
                    </span>
                  </td>
                  <td className="p-3 font-bold">{(achat.montantTtc || 0).toFixed(2)} €</td>
                  <td className="p-3">
                    <div className="flex space-x-2">
                      <button onClick={() => openForm(achat)} className="text-blue-600 hover:text-blue-800"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(achat.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">{editingAchat ? 'Modifier l\'achat' : 'Nouvel achat'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Référence *</label>
                  <input type="text" value={formData.reference} onChange={(e) => handleChange('reference', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date achat *</label>
                  <input type="date" value={formData.dateAchat} onChange={(e) => handleChange('dateAchat', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date échéance</label>
                  <input type="date" value={formData.dateEcheance} onChange={(e) => handleChange('dateEcheance', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date paiement</label>
                  <input type="date" value={formData.datePaiement} onChange={(e) => handleChange('datePaiement', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fournisseur *</label>
                <select value={formData.fournisseurId} onChange={(e) => handleChange('fournisseurId', e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Sélectionner un fournisseur</option>
                  {fournisseurs.map((f) => (
                    <option key={f.id} value={f.id}>{f.societe}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mode de paiement</label>
                <select value={formData.modePaiement} onChange={(e) => handleChange('modePaiement', e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Choisir...</option>
                  {modesPaiement.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Montant HTVA *</label>
                  <input type="number" step="0.01" value={formData.montantHtva} onChange={(e) => handleChange('montantHtva', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Montant TTC *</label>
                  <input type="number" step="0.01" value={formData.montantTtc} onChange={(e) => handleChange('montantTtc', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Catégorie *</label>
                <select value={formData.categorie} onChange={(e) => handleChange('categorie', e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Choisir...</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={formData.description} rows={3} onChange={(e) => handleChange('description', e.target.value)} className="w-full px-3 py-2 border rounded-lg"></textarea>
              </div>
              <div className="flex space-x-4 pt-4">
                <button onClick={handleSubmit} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">{editingAchat ? 'Modifier' : 'Créer'}</button>
                <button onClick={closeForm} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300">Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}