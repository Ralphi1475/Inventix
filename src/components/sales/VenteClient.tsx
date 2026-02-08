'use client';
import React, { useState, useMemo } from 'react';
import { Plus, Search, Minus, X } from 'lucide-react';
import { Article, Contact, LignePanier } from '@/types';

interface VenteClientProps {
  articles: Article[];
  clients: Contact[];
  onVente: (mouvement: any) => Promise<boolean>;
  setArticles: React.Dispatch<React.SetStateAction<Article[]>>;
  onSaveArticle: (article: Article, action: 'create' | 'update') => Promise<void>;
  sauvegarderFacture: (facture: any) => Promise<void>;
  parametres: any;
  onRefresh?: () => Promise<void>;
}

export function VenteClient({ 
  articles, 
  clients, 
  onVente, 
  setArticles, 
  onSaveArticle, 
  sauvegarderFacture, 
  parametres,
  onRefresh  
}: VenteClientProps) {
  const [panier, setPanier] = useState<LignePanier[]>([]);
  const [clientSelectionne, setClientSelectionne] = useState<Contact | null>(null);
  const [modePaiement, setModePaiement] = useState('especes');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategorie, setSelectedCategorie] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [dateVente, setDateVente] = useState(new Date().toISOString().split('T')[0]);
  const [commentaire, setCommentaire] = useState('');

  // Extraire les catégories uniques
  const categories = useMemo(() => {
    const cats = articles
      .map(a => a.categorie)
      .filter((cat): cat is string => !!cat);
    return Array.from(new Set(cats)).sort();
  }, [articles]);

  // Filtrer articles : par recherche ET catégorie
  const articlesFiltr = useMemo(() => {
    if (!Array.isArray(articles)) return [];
    return articles.filter(a => {
      const nom = String(a.nom ?? '').toLowerCase().trim();
      const numero = String(a.numero ?? '').toLowerCase().trim();
      const search = String(searchTerm).toLowerCase().trim();
      const matchesSearch = nom.includes(search) || numero.includes(search);
      const matchesCategorie = selectedCategorie ? a.categorie === selectedCategorie : true;
      return matchesSearch && matchesCategorie;
    });
  }, [articles, searchTerm, selectedCategorie]);

  const ajouterAuPanier = (article: Article) => {
    setPanier(prevPanier => {
      const existant = prevPanier.find(p => p.article.id === article.id);
      if (existant) {
        return prevPanier.map(p => 
          p.article.id === article.id ? { ...p, quantite: p.quantite + 1 } : p
        );
      } else {
        return [...prevPanier, { article, quantite: 1 }];
      }
    });
  };

  const modifierQuantite = (articleId: string, delta: number) => {
    setPanier(prevPanier => 
      prevPanier.map(p => {
        if (p.article.id === articleId) {
          const newQte = Math.round((p.quantite + delta) * 100) / 100;
          return newQte > 0 ? { ...p, quantite: newQte } : p;
        }
        return p;
      }).filter(p => p.quantite > 0)
    );
  };

  const retirerDuPanier = (articleId: string) => {
    setPanier(prevPanier => prevPanier.filter(p => p.article.id !== articleId));
  };

  const modifierPrix = (articleId: string, nouveauPrix: number) => {
    setPanier(prevPanier => 
      prevPanier.map(p => 
        p.article.id === articleId 
          ? { ...p, prixUnitairePersonnalise: nouveauPrix } 
          : p
      )
    );
  };

  const totalHT = panier.reduce((sum, p) => {
    const prixTTC = p.prixUnitairePersonnalise ?? p.article.prixVenteTTC!;
    const tauxTva = p.article.tauxTva || 21;
    const prixHT = prixTTC / (1 + tauxTva / 100);
    return sum + (prixHT * p.quantite);
  }, 0);

  const totalTVA = panier.reduce((sum, p) => {
    const prixTTC = p.prixUnitairePersonnalise ?? p.article.prixVenteTTC!;
    const tauxTva = p.article.tauxTva || 21;
    const prixHT = prixTTC / (1 + tauxTva / 100);
    return sum + ((prixHT * tauxTva / 100) * p.quantite);
  }, 0);

  const totalAvantReduction = totalHT + totalTVA;
  const reduction = modePaiement === 'sumup' ? totalAvantReduction * 0.02 : 0;
  const totalTTC = totalAvantReduction - reduction;

  const validerVente = async () => {
    if (!clientSelectionne) {
      alert('Veuillez sélectionner un client');
      return;
    }
    if (panier.length === 0) {
      alert('Le panier est vide');
      return;
    }
    if (!dateVente) {
      alert('Veuillez sélectionner une date');
      return;
    }
    setLoading(true);
    try {
      const reference = 'V' + Date.now();
      const [year, month, day] = dateVente.split('-');
      const date = `${day}/${month}/${year} 00:00:00`;
      
      for (const ligne of panier) {
        await onVente({
          date,
          type: 'vente',
          articleId: ligne.article.id,
          quantite: ligne.quantite,
          clientId: clientSelectionne.id,
          reference,
          modePaiement,
          nomArticle: ligne.article.nom,
          prixUnitaire: ligne.prixUnitairePersonnalise ?? ligne.article.prixVenteTTC,
          emplacement: '',
          commentaire,
          nomClient: clientSelectionne.societe || `${clientSelectionne.nom} ${clientSelectionne.prenom}`.trim()
        });
        const newStock = ligne.article.stock - ligne.quantite;
        const updatedArticle = { ...ligne.article, stock: newStock };
        setArticles(prev => prev.map((a: Article) => a.id === ligne.article.id ? updatedArticle : a));
        await onSaveArticle(updatedArticle, 'update');
      }
      const nomClient = clientSelectionne.societe || `${clientSelectionne.nom} ${clientSelectionne.prenom}`.trim() || 'Client';
      await sauvegarderFacture({
        id: String(Date.now()),
        reference,
        date,
        client: nomClient,
        modePaiement,
        montant: totalTTC,
        emplacement: '',
        commentaire
      });
      if (onRefresh) {
        await onRefresh();
      }
      alert('Vente enregistrée avec succès !');
      setPanier([]);
      setClientSelectionne(null);
      setDateVente(new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error('Erreur lors de la vente:', error);
      alert('Erreur lors de la validation de la vente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Vente Client</h2>
      
      {/* ✅ CHANGÉ : grid-cols-2 au lieu de grid-cols-3 pour 50/50 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ========== SECTION ARTICLES (50%) ========== */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Client</label>
                <select 
                  value={clientSelectionne?.id || ''} 
                  onChange={(e) => setClientSelectionne(clients.find((c: Contact) => c.id === e.target.value) || null)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((c: Contact) => (
                    <option key={c.id} value={c.id}>{c.societe} - {c.nom} {c.prenom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date de vente</label>
                <input 
                  type="date" 
                  value={dateVente}
                  onChange={(e) => setDateVente(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Commentaire</label>
              <textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Commentaire optionnel..."
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
              />
            </div>

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

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Filtrer par catégorie</label>
              <select 
                value={selectedCategorie}
                onChange={(e) => setSelectedCategorie(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Toutes les catégories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ Affichage du nombre d'articles */}
            <div className="mb-2 text-sm text-gray-600">
              {articlesFiltr.length} article{articlesFiltr.length > 1 ? 's' : ''} trouvé{articlesFiltr.length > 1 ? 's' : ''}
            </div>

            {/* ✅ Articles en UNE COLONNE avec scroll vertical */}
            <div key={`articles-${selectedCategorie}-${searchTerm}`} className="space-y-3 max-h-96 overflow-y-auto">
              {articlesFiltr.map((article: Article) => (
                <div 
                  key={article.id} 
                  className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition flex gap-3" 
                  onClick={() => ajouterAuPanier(article)}
                >
                  {article.image && (
                    <div className="flex-shrink-0">
                      <img 
                        src={article.image} 
                        alt={article.nom}
                        className="w-16 h-16 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{article.nom}</p>
                    <p className="text-sm text-gray-600">{article.numero}</p>
                    <p className="text-blue-600 font-bold">{article.prixVenteTTC?.toFixed(2)} €</p>
                    <p className="text-xs text-gray-500">Stock: {article.stock}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========== SECTION PANIER (50%) ========== */}
        {/* ✅ CHANGÉ : flex flex-col h-[calc(100vh-12rem)] pour occuper toute la hauteur */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-col h-[calc(100vh-12rem)]">
          <h3 className="text-xl font-bold mb-4">Panier</h3>
          
          {panier.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Panier vide</p>
          ) : (
            <>
              {/* ✅ Liste des articles - prend tout l'espace disponible */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {panier.map((ligne) => (
                  <div key={ligne.article.id} className="border-b pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 flex-1">
                        {ligne.article.image && (
                          <img 
                            src={ligne.article.image} 
                            alt={ligne.article.nom}
                            className="w-10 h-10 object-cover rounded border"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <p className="font-medium text-sm">{ligne.article.nom}</p>
                      </div>
                      <button 
                        onClick={() => retirerDuPanier(ligne.article.id)} 
                        className="p-1 hover:bg-red-100 text-red-600 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <div>
                        <label className="text-xs text-gray-600">Prix unit.</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          value={ligne.prixUnitairePersonnalise ?? ligne.article.prixVenteTTC}
                          onChange={(e) => {
                            const newPrix = parseFloat(e.target.value) || 0;
                            if (newPrix >= 0) {
                              modifierPrix(ligne.article.id, newPrix);
                            }
                          }}
                          className="w-full text-sm font-bold border rounded px-2 py-1"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-gray-600">Quantité</label>
                        <div className="flex items-center space-x-1">
                          <button 
                            onClick={() => modifierQuantite(ligne.article.id, -1)} 
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Minus size={14} />
                          </button>
                          <input 
                            type="number" 
                            step="0.01" 
                            min="0.01"
                            value={ligne.quantite}
                            onChange={(e) => {
                              const newQte = parseFloat(e.target.value) || 0;
                              if (newQte > 0) {
                                setPanier(prevPanier => 
                                  prevPanier.map(p => 
                                    p.article.id === ligne.article.id 
                                      ? { ...p, quantite: newQte } 
                                      : p
                                  )
                                );
                              }
                            }}
                            className="w-14 text-center text-sm font-bold border rounded px-1 py-1"
                          />
                          <button 
                            onClick={() => modifierQuantite(ligne.article.id, 1)} 
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-right text-gray-600 mt-1">
                      Total: {((ligne.prixUnitairePersonnalise ?? ligne.article.prixVenteTTC!) * ligne.quantite).toFixed(2)} €
                    </p>
                  </div>
                ))}
              </div>

              {/* ✅ FOOTER STICKY - Totaux + Bouton en bas */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total HT</span>
                  <span>{totalHT.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>TVA</span>
                  <span>{totalTVA.toFixed(2)} €</span>
                </div>
                {reduction > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Réduction SumUp (2%)</span>
                    <span>- {reduction.toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total à payer</span>
                  <span>{totalTTC.toFixed(2)} €</span>
                </div>
                <div className="pt-2">
                  <label className="block text-sm font-medium mb-2">Mode de paiement</label>
                  <select value={modePaiement} onChange={(e) => setModePaiement(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                    <option value="especes">Espèces</option>
                    <option value="carte">Carte bancaire</option>
                    <option value="virement">Virement</option>
                    <option value="cheque">Chèque</option>
                    <option value="sumup">SumUp</option>
                    <option value="en_attente">En attente</option>
                  </select>
                </div>
                <button 
                  onClick={validerVente} 
                  disabled={loading}
                  className={`w-full py-3 rounded-lg font-bold mt-4 flex items-center justify-center space-x-2 ${
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
                    <span>Valider la vente</span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
