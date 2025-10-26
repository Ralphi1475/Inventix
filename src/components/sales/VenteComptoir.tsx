'use client';
import React, { useState, useMemo } from 'react';
import { Plus, Search, Minus, X } from 'lucide-react';
import { Article, Contact, LignePanier } from '@/types';

interface VenteComptoirProps {
  articles: Article[];
  clients: Contact[];
  onVente: (mouvement: any) => Promise<boolean>;
  setArticles: React.Dispatch<React.SetStateAction<Article[]>>;
  onSaveArticle: (article: Article, action: 'create' | 'update') => Promise<void>;
  sauvegarderFacture: (facture: any) => Promise<void>;
}

export function VenteComptoir({ 
  articles, 
  clients, 
  onVente, 
  setArticles, 
  onSaveArticle, 
  sauvegarderFacture 
}: VenteComptoirProps) {
  const [panier, setPanier] = useState<LignePanier[]>([]);
  const [modePaiement, setModePaiement] = useState('especes');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateVente, setDateVente] = useState(new Date().toISOString().split('T')[0]);
  const [emplacement, setEmplacement] = useState('');

  const clientComptoir = clients.find((c: Contact) => c.societe === 'VENTE COMPTOIR');
  if (!clientComptoir) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Le client "VENTE COMPTOIR" n'existe pas. Veuillez le créer dans la section Clients.</p>
      </div>
    );
  }

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
          const newQte = Math.round((p.quantite + delta) * 100) / 100;
          return newQte > 0 ? { ...p, quantite: newQte } : p;
        }
        return p;
      }).filter(p => p.quantite > 0)
    );
  };

  const retirerDuPanier = (articleNumero: string) => {
    setPanier(prevPanier => prevPanier.filter(p => p.article.numero !== articleNumero));
  };

  const modifierPrix = (articleNumero: string, nouveauPrix: number) => {
    setPanier(prevPanier => 
      prevPanier.map(p => 
        p.article.numero === articleNumero 
          ? { ...p, prixUnitairePersonnalise: nouveauPrix } 
          : p
      )
    );
  };

  const totalHT = panier.reduce((sum, p) => {
    const prixTTC = p.prixUnitairePersonnalise ?? p.article.prixVenteTTC!;
    const tauxTVA = p.article.tauxTVA || 21;
    const prixHT = prixTTC / (1 + tauxTVA / 100);
    return sum + (prixHT * p.quantite);
  }, 0);

  const totalTVA = panier.reduce((sum, p) => {
    const prixTTC = p.prixUnitairePersonnalise ?? p.article.prixVenteTTC!;
    const tauxTVA = p.article.tauxTVA || 21;
    const prixHT = prixTTC / (1 + tauxTVA / 100);
    return sum + ((prixHT * tauxTVA / 100) * p.quantite);
  }, 0);

  const totalAvantReduction = totalHT + totalTVA;
  const reduction = modePaiement === 'sumup' ? totalAvantReduction * 0.02 : 0;
  const totalTTC = totalAvantReduction - reduction;

  const validerVente = async () => {
    if (panier.length === 0) {
      alert('Le panier est vide');
      return;
    }
    if (!dateVente) {
      alert('Veuillez sélectionner une date');
      return;
    }
    if (!emplacement.trim()) {
      alert('Veuillez indiquer un emplacement de vente');
      return;
    }
    setLoading(true);
    try {
      const reference = 'VC' + Date.now();
      // ✅ Formater la date en DD/MM/YYYY HH:MM:SS
      const [year, month, day] = dateVente.split('-');
      const date = `${day}/${month}/${year} 00:00:00`;
      
      for (const ligne of panier) {
        await onVente({
          date,
          type: 'venteComptoir',
          articleId: ligne.article.id,
          quantite: ligne.quantite,
          clientId: clientComptoir.id,
          reference,
          modePaiement,
          nomArticle: ligne.article.nom,
          prixUnitaire: ligne.prixUnitairePersonnalise ?? ligne.article.prixVenteTTC,
          emplacement,
          nomClient: 'VENTE COMPTOIR'
        });
        const newStock = ligne.article.stock - ligne.quantite;
        const updatedArticle = { ...ligne.article, stock: newStock };
        setArticles(prev => prev.map((a: Article) => a.id === ligne.article.id ? updatedArticle : a));
        await onSaveArticle(updatedArticle, 'update');
      }
      await sauvegarderFacture({
        id: String(Date.now()),
        reference,
        date,
        client: 'VENTE COMPTOIR',
        modePaiement,
        montant: totalTTC,
        emplacement
      });
      alert('Vente comptoir enregistrée avec succès !');
      setPanier([]);
      setDateVente(new Date().toISOString().split('T')[0]);
      setEmplacement('');
    } catch (error) {
      console.error('Erreur lors de la vente:', error);
      alert('Erreur lors de la validation de la vente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Vente Comptoir</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date de vente</label>
                <input 
                  type="date" 
                  value={dateVente}
                  onChange={(e) => setDateVente(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Emplacement *</label>
                <input 
                  type="text" 
                  value={emplacement}
                  onChange={(e) => setEmplacement(e.target.value)}
                  placeholder="ex: Marché, Salon, Boutique..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {articlesFiltr.map((article: Article) => (
                <div 
                  key={article.numero} 
                  className="border rounded-lg p-3 hover:bg-blue-50 cursor-pointer transition"
                  onClick={() => ajouterAuPanier(article)}
                >
                  <p className="font-medium text-sm">{article.nom}</p>
                  <p className="text-xs text-black mb-1">{article.numero}</p>
                  <p className="text-blue-600 font-bold text-lg">{article.prixVenteTTC?.toFixed(2)} €</p>
                  <p className="text-xs text-black">Stock: {article.stock}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-xl font-bold mb-4">Panier</h3>
          {panier.length === 0 ? (
            <p className="text-black text-center py-8">Panier vide</p>
          ) : (
            <>
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {panier.map((ligne) => (
                  <div key={ligne.article.numero} className="border-b pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{ligne.article.nom}</p>
                      </div>
                      <button 
                        onClick={() => retirerDuPanier(ligne.article.numero)} 
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
                              modifierPrix(ligne.article.numero, newPrix);
                            }
                          }}
                          className="w-full text-sm font-bold border rounded px-2 py-1"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-gray-600">Quantité</label>
                        <div className="flex items-center space-x-1">
                          <button 
                            onClick={() => modifierQuantite(ligne.article.numero, -1)} 
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
                                    p.article.numero === ligne.article.numero 
                                      ? { ...p, quantite: newQte } 
                                      : p
                                  )
                                );
                              }
                            }}
                            className="w-14 text-center text-sm font-bold border rounded px-1 py-1"
                          />
                          <button 
                            onClick={() => modifierQuantite(ligne.article.numero, 1)} 
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
                <div className="pt-4">
                  <label className="block text-sm font-medium mb-2">Mode de paiement</label>
                  <select value={modePaiement} onChange={(e) => setModePaiement(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                    <option value="especes">Espèces</option>
                    <option value="carte">Carte bancaire</option>
                    <option value="virement">Virement</option>
                    <option value="cheque">Chèque</option>
                    <option value="sumup">SumUp</option>
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