'use client';
import { Search } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Plus, Minus, X } from 'lucide-react';
import { Article, Contact, LignePanier } from '@/types';

interface EntreesStockProps {
  articles: Article[];
  fournisseurs: Contact[];
  onEntree: (mouvement: any) => Promise<boolean>;
  setArticles: React.Dispatch<React.SetStateAction<Article[]>>; // ✅
  onSaveArticle: (article: Article, action: 'create' | 'update') => Promise<void>;
}

export function EntreesStock({ articles, fournisseurs, onEntree, setArticles, onSaveArticle }: EntreesStockProps) {
  const [panier, setPanier] = useState<LignePanier[]>([]);
  const [fournisseurSelectionne, setFournisseurSelectionne] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const articlesFiltr = useMemo(() => {
    if (!Array.isArray(articles)) return [];
    return articles.filter(a => {
      const nom = String(a.nom ?? '').toLowerCase().trim();
      const numero = String(a.numero ?? '').toLowerCase().trim();
      const search = String(searchTerm).toLowerCase().trim();
      return nom.includes(search) || numero.includes(search);
    });
  }, [articles, searchTerm]);

  const ajouterAuPanier = (article: Article) => {
    setPanier(prevPanier => {
      const existant = prevPanier.find(p => p.article.numero === article.numero);
      if (existant) {
        return prevPanier.map(p => 
          p.article.numero === article.numero ? { ...p, quantite: p.quantite + 1 } : p
        );
      } else {
        return [...prevPanier, { article, quantite: 1 }];
      }
    });
  };

  const modifierQuantite = (articleNumero: string, delta: number) => {
    setPanier(prevPanier => 
      prevPanier.map(p => {
        if (p.article.numero === articleNumero) {
          const newQte = p.quantite + delta;
          return newQte > 0 ? { ...p, quantite: newQte } : p;
        }
        return p;
      }).filter(p => p.quantite > 0)
    );
  };

  const retirerDuPanier = (articleNumero: string) => {
    setPanier(prevPanier => prevPanier.filter(p => p.article.numero !== articleNumero));
  };

  const validerEntree = async () => {
    if (!fournisseurSelectionne) {
      alert('Veuillez sélectionner un fournisseur');
      return;
    }
    if (panier.length === 0) {
      alert('Aucun article sélectionné');
      return;
    }
    setLoading(true);
    try {
      const reference = 'E' + Date.now();
      const date = new Date().toLocaleDateString('fr-FR');
      for (const ligne of panier) {
        await onEntree({
          date,
          type: 'entree',
          articleId: ligne.article.id,
          quantite: ligne.quantite,
          fournisseurId: fournisseurSelectionne.id,
          reference,
          modePaiement: ''
        });
        const newStock = ligne.article.stock + ligne.quantite;
        const updatedArticle = { ...ligne.article, stock: newStock };
        setArticles(prev => prev.map((a: Article) => a.id === ligne.article.id ? updatedArticle : a));
        await onSaveArticle(updatedArticle, 'update');
      }
      alert('Entrée de stock enregistrée avec succès !');
      setPanier([]);
      setFournisseurSelectionne(null);
    } catch (error) {
      console.error('Erreur lors de l\'entrée de stock:', error);
      alert('Erreur lors de la validation de l\'entrée');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Entrées de Stock</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <label className="block text-sm font-medium mb-2">Fournisseur</label>
            <select 
                    value={fournisseurSelectionne?.id || ''} 
                    onChange={(e) => setFournisseurSelectionne(fournisseurs.find((f: Contact) => f.id === e.target.value) || null)}
                    className="w-full px-3 py-2 border rounded-lg"> {/* ✅ Le ">" est ici */}
                    <option value="">Sélectionner un fournisseur</option>
                    {fournisseurs.map((f: Contact) => (
                    <option key={f.id} value={f.id}>{f.societe}</option>
                    ))}
            </select>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Rechercher un article..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg" 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {articlesFiltr.map((article: Article) => (
                <div key={article.numero} className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer" onClick={() => ajouterAuPanier(article)}>
                  <p className="font-medium">{article.nom}</p>
                  <p className="text-sm text-black">{article.numero}</p>
                  <p className="text-xs text-black">Stock actuel: {article.stock}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-xl font-bold mb-4">Articles à recevoir</h3>
          {panier.length === 0 ? (
            <p className="text-black text-center py-8">Aucun article</p>
          ) : (
            <>
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {panier.map((ligne) => (
                  <div key={ligne.article.numero} className="flex items-center justify-between border-b pb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{ligne.article.nom}</p>
                      <p className="text-xs text-black">Stock: {ligne.article.stock}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => modifierQuantite(ligne.article.numero, -1)} className="p-1 hover:bg-gray-100 rounded"><Minus size={16} /></button>
                      <span className="font-bold">+{ligne.quantite}</span>
                      <button onClick={() => modifierQuantite(ligne.article.numero, 1)} className="p-1 hover:bg-gray-100 rounded"><Plus size={16} /></button>
                      <button onClick={() => retirerDuPanier(ligne.article.numero)} className="p-1 hover:bg-red-100 text-red-600 rounded"><X size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={validerEntree} 
                disabled={loading}
                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center space-x-2 ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Traitement en cours...</span>
                  </>
                ) : (
                  <span>Valider l'entrée</span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
