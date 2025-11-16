'use client';
import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { Article, Categorie } from '@/types';
import { ArticleForm } from './ArticleForm';

interface ArticlesProps {
  articles: Article[];
  categories: Categorie[];
  setArticles: React.Dispatch<React.SetStateAction<Article[]>>;
  onSave: (article: Article, action: 'create' | 'update') => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function Articles({ articles, categories, setArticles, onSave, onDelete, onRefresh }: ArticlesProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
    const categoriesProduits = useMemo(() => {
    return categories.filter(cat => cat.type === 'produit');
  }, [categories]);

  const filteredArticles = useMemo(() => {
    if (!Array.isArray(articles)) return [];
    return articles.filter(art => {
      const nom = String(art.nom ?? '').toLowerCase().trim();
      const numero = String(art.numero ?? '').toLowerCase().trim();
      const search = String(searchTerm).toLowerCase().trim();
      const matchSearch = nom.includes(search) || numero.includes(search);
      const matchCategorie = !filterCategorie || String(art.categorie ?? '') === filterCategorie;
      return matchSearch && matchCategorie;
    });
  }, [articles, searchTerm, filterCategorie]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Erreur lors du refresh:', error);
      alert('Erreur lors du rechargement des données');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmit = async (formData: Article) => {
    if (editingArticle) {
      const updatedArticles = articles.map(a => a.id === editingArticle.id ? { ...formData, id: a.id } : a);
      setArticles(updatedArticles);
      await onSave({ ...formData, id: editingArticle.id }, 'update');
    } else {
      const newArticle = { ...formData, id: String(Date.now()) };
      setArticles([...articles, newArticle]);
      await onSave(newArticle, 'create');
    }
    setShowForm(false);
    setEditingArticle(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      setArticles(articles.filter(a => a.id !== id));
      await onDelete(id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Articles</h2>
        <div className="flex space-x-2">
          <button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Actualisation...' : 'Actualiser'}</span>
          </button>
          <button 
            onClick={() => { setShowForm(true); setEditingArticle(null); }} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
          >
            <Plus size={20} />
            <span>Nouvel Article</span>
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
          </div>
          <select value={filterCategorie} onChange={(e) => setFilterCategorie(e.target.value)} className="px-4 py-2 border rounded-lg">
           <option value="">Toutes les catégories</option>
            {/* ✅ Utiliser categoriesProduits ici */}
            {categoriesProduits.map(cat => (
              <option key={cat.id} value={cat.denomination}>
                {cat.denomination}
              </option>)}
          </select>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Image</th> {/* ✅ Nouvelle colonne */}
                <th className="p-3 text-left">N°</th>
                <th className="p-3 text-left">Catégorie</th>
                <th className="p-3 text-left">Nom</th>
                <th className="p-3 text-left">Prix Achat</th>
                <th className="p-3 text-left">Prix Vente TTC</th>
                <th className="p-3 text-left">Unité</th>
                <th className="p-3 text-left">Stock</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.map(article => (
                <tr key={article.id} className="border-b hover:bg-gray-50">
                  {/* ✅ Cellule image */}
                  <td className="p-3">
                    {article.image ? (
                      <img 
                        src={article.image} 
                        alt={article.nom} 
                        className="w-12 h-12 object-contain rounded border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center text-gray-400">
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </td>
                  <td className="p-3 font-mono">{article.numero}</td>
                  <td className="p-3"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{article.categorie}</span></td>
                  <td className="p-3 font-medium">{article.nom}</td>
                  <td className="p-3">{article.prixAchat.toFixed(2)} €</td>
                  <td className="p-3 font-bold">{(article.prixVenteTTC ?? 0).toFixed(2)} €</td>
                  <td className="p-3 text-sm">{article.unite}</td>
                  <td className="p-3"><span className={`font-bold ${article.stock < 10 ? 'text-red-600' : 'text-green-600'}`}>{article.stock}</span></td>
                  <td className="p-3">
                    <div className="flex space-x-2">
                      <button onClick={() => { setEditingArticle(article); setShowForm(true); }} className="text-blue-600 hover:text-blue-800"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(article.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showForm && (
        <ArticleForm 
          article={editingArticle} 
          categories={categoriesProduits} 
          onSubmit={handleSubmit} 
          onCancel={() => { setShowForm(false); setEditingArticle(null); }} 
        />
      )}
    </div>
  );
}