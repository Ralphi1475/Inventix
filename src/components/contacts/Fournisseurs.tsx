'use client';
import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Contact } from '@/types';
import { ContactForm } from './ContactForm';

interface FournisseursProps {
  contacts: Contact[]; // tous les contacts
  setFournisseurs: React.Dispatch<React.SetStateAction<Contact[]>>;
  onSave: (contact: Contact, action: 'create' | 'update') => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

export function Fournisseurs({ contacts, setFournisseurs, onSave, onDelete, onRefresh }: FournisseursProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ Filtrer uniquement les fournisseurs
  const fournisseursFiltres = useMemo(() => {
    return contacts.filter(contact => contact.type === 'fournisseur');
  }, [contacts]);

  const handleSubmit = async (formData: Contact) => {
    try {
      setLoading(true);
      
      if (editingContact) {
        await onSave({ ...formData, id: editingContact.id }, 'update');
      } else {
        const newContact = { ...formData, id: String(Date.now()), type: 'fournisseur' };
        await onSave(newContact, 'create');
      }
      
      if (onRefresh) await onRefresh();
      
      setShowForm(false);
      setEditingContact(null);
    } catch (error) {
      console.error('❌ Erreur sauvegarde fournisseur:', error);
      alert('Erreur lors de la sauvegarde du fournisseur');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
      try {
        setLoading(true);
        await onDelete(id);
        if (onRefresh) await onRefresh();
      } catch (error) {
        console.error('❌ Erreur suppression fournisseur:', error);
        alert('Erreur lors de la suppression du fournisseur');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl md:text-3xl font-bold">Fournisseurs</h2>
        <button 
          onClick={() => { setShowForm(true); setEditingContact(null); }} 
          className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg flex items-center justify-center md:space-x-2 hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          <Plus size={20} />
          <span className="hidden md:inline ml-2">Nouveau Fournisseur</span>
        </button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Société</th>
                <th className="p-3 text-left">Nom</th>
                <th className="p-3 text-left">Ville</th>
                <th className="p-3 text-left">Téléphone</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fournisseursFiltres.map(contact => (
                <tr key={contact.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{contact.societe}</td>
                  <td className="p-3">{contact.nom} {contact.prenom}</td>
                  <td className="p-3">{contact.ville}</td>
                  <td className="p-3">{contact.mobile}</td>
                  <td className="p-3">{contact.email}</td>
                  <td className="p-3">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => { setEditingContact(contact); setShowForm(true); }} 
                        className="text-blue-600 hover:text-blue-800"
                        disabled={loading}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(contact.id)} 
                        className="text-red-600 hover:text-red-800"
                        disabled={loading}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showForm && (
        <ContactForm 
          contact={editingContact} 
          type="fournisseur" 
          onSubmit={handleSubmit} 
          onCancel={() => { setShowForm(false); setEditingContact(null); }}
          loading={loading}
        />
      )}
    </div>
  );
}