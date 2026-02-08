 'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Minus, X, ArrowLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Article, Contact, LignePanier, Mouvement, FactureResume } from '@/types';
import { 
  chargerDonnees, 
  enregistrerMouvement, 
  supprimerMouvement, 
  sauvegarderFacture, 
  sauvegarderArticle,
  supprimerFacture
} from '@/lib/api';

export default function EditFacturePage() {
  const router = useRouter();
  const params = useParams<{ reference: string }>();
  const reference = params.reference;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [clients, setClients] = useState<Contact[]>([]);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [factures, setFactures] = useState<FactureResume[]>([]);
  const [panier, setPanier] = useState<LignePanier[]>([]);
  const [clientSelectionne, setClientSelectionne] = useState<Contact | null>(null);
  const [modePaiement, setModePaiement] = useState('especes');
  const [emplacement, setEmplacement] = useState('');
  const [commentaire, setCommentaire] = useState(''); // ✅ Ajouté
  const [searchTerm, setSearchTerm] = useState('');
  const [dateVente, setDateVente] = useState('');

  // Charger les données initiales
  useEffect(() => {
    const charger = async () => {
      try {
        const data = await chargerDonnees();
        setArticles(data.articles);
        setClients(data.clients);
        setMouvements(data.mouvements);
        setFactures(data.factures);

        // Trouver la facture
        const facture = data.factures.find(f => f.reference === reference);
        if (!facture) {
          alert('Facture non trouvée');
          router.back();
          return;
        }

        // Charger les mouvements associés
        const lignes = data.mouvements.filter(m => m.reference === reference);
        if (lignes.length === 0) {
          alert('Aucun mouvement trouvé pour cette facture');
          router.back();
          return;
        }

        // Déterminer le client
        const clientId = lignes[0].clientId;
        const client = data.clients.find(c => c.id === clientId);
        setClientSelectionne(client || null);

        // Mettre à jour les états
        setModePaiement(facture.modePaiement || 'especes');
        setEmplacement(facture.emplacement || '');
        setCommentaire(facture.commentaire || ''); // ✅ Initialisé
        setDateVente(facture.date.split(' ')[0].split('/').reverse().join('-')); // YYYY-MM-DD

        // Construire le panier
        const nouveauPanier: LignePanier[] = [];
        for (const ligne of lignes) {
          const article = data.articles.find(a => a.id === ligne.articleId);
          if (article) {
            nouveauPanier.push({
              article,
              quantite: parseFloat(ligne.quantite.toString()) || 1,
              prixUnitairePersonnalise: ligne.prixUnitaire ? parseFloat(ligne.prixUnitaire.toString()) : undefined
            });
          }
        }
        setPanier(nouveauPanier);
      } catch (error) {
        console.error('Erreur au chargement:', error);
        alert('Erreur lors du chargement de la facture');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, [reference, router]);

  const articlesFiltr = useMemo(() => {
    return articles.filter(a => {
      const nom = String(a.nom ?? '').toLowerCase();
      const numero = String(a.numero ?? '').toLowerCase();
      const search = searchTerm.toLowerCase();
      return nom.includes(search) || numero.includes(search);
    });
  }, [articles, searchTerm]);

  const ajouterAuPanier = (article: Article) => {
    setPanier(prev => {
      const existant = prev.find(p => p.article.id === article.id);
      if (existant) {
        return prev.map(p => 
          p.article.id === article.id ? { ...p, quantite: p.quantite + 1 } : p
        );
      } else {
        return [...prev, { article, quantite: 1 }];
      }
    });
  };

  const modifierQuantite = (articleId: string, delta: number) => {
    setPanier(prev => 
      prev.map(p => {
        if (p.article.id === articleId) {
          const newQte = Math.round((p.quantite + delta) * 100) / 100;
          return newQte > 0 ? { ...p, quantite: newQte } : p;
        }
        return p;
      }).filter(p => p.quantite > 0)
    );
  };

  const retirerDuPanier = (articleId: string) => {
    setPanier(prev => prev.filter(p => p.article.id !== articleId));
  };

  const modifierPrix = (articleId: string, nouveauPrix: number) => {
    setPanier(prev => 
      prev.map(p => 
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

  const sauvegarderModifications = async () => {
    if (!clientSelectionne) {
      alert('Client manquant');
      return;
    }
    if (panier.length === 0) {
      alert('Le panier est vide');
      return;
    }

    setSaving(true);
    try {
      // 1. Supprimer les anciens mouvements
      const anciensMouvements = mouvements.filter(m => m.reference === reference);
      for (const m of anciensMouvements) {
        // Remettre le stock
        const article = articles.find(a => a.id === m.articleId);
        if (article && m.type === 'vente') {
          const newStock = article.stock + parseFloat(m.quantite.toString() || '0');
          await sauvegarderArticle({ ...article, stock: newStock }, true);
          setArticles(prev => prev.map(a => a.id === article.id ? { ...a, stock: newStock } : a));
        }
        await supprimerMouvement(m.id);
      }

      // 2. Supprimer l'ancienne facture
      const ancienneFacture = factures.find(f => f.reference === reference);
      if (ancienneFacture) {
        await supprimerFacture(ancienneFacture.id);
      }

      // 3. Créer les nouveaux mouvements
      const newDate = `${dateVente.split('-').reverse().join('/')} 00:00:00`;
      const nomClient = clientSelectionne.societe || `${clientSelectionne.nom} ${clientSelectionne.prenom}`.trim() || 'Client';

      for (const ligne of panier) {
        await enregistrerMouvement({
          id: String(Date.now() + Math.random()),
          date: newDate,
          type: 'vente',
          articleId: ligne.article.id,
          quantite: ligne.quantite,
          clientId: clientSelectionne.id,
          reference,
          modePaiement,
          nomArticle: ligne.article.nom,
          prixUnitaire: ligne.prixUnitairePersonnalise ?? ligne.article.prixVenteTTC,
          emplacement,
          nomClient,
          commentaire // ✅ Passé à chaque mouvement
        }, articles);

        // Mettre à jour le stock
        const newStock = ligne.article.stock - ligne.quantite;
        await sauvegarderArticle({ ...ligne.article, stock: newStock }, true);
        setArticles(prev => prev.map(a => a.id === ligne.article.id ? { ...a, stock: newStock } : a));
      }

      // 4. Créer la nouvelle facture
      await sauvegarderFacture({
        id: ancienneFacture?.id || String(Date.now()),
        reference,
        date: newDate,
        client: nomClient,
        modePaiement,
        montant: totalTTC,
        emplacement,
        commentaire // ✅ Passé à la facture
      });

      alert('Facture mise à jour avec succès !');
      router.push('/gestion');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement de la facture...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <button 
        onClick={() => router.back()}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft size={18} />
        <span>Retour aux factures</span>
      </button>

      <h2 className="text-3xl font-bold mb-6">Modifier la facture {reference}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Client</label>
                <select 
                  value={clientSelectionne?.id || ''} 
                  onChange={(e) => setClientSelectionne(clients.find(c => c.id === e.target.value) || null)}
                  className="w-full px-3 py-2 border rounded-lg"
                  disabled
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.societe} - {c.nom} {c.prenom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input 
                  type="date" 
                  value={dateVente}
                  onChange={(e) => setDateVente(e.target.value)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {articlesFiltr.map(article => (
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
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
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

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-xl font-bold mb-4">Panier</h3>
          {panier.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Panier vide</p>
          ) : (
            <>
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {panier.map(ligne => (
                  <div key={ligne.article.id} className="border-b pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 flex-1">
                        {ligne.article.image && (
                          <img 
                            src={ligne.article.image} 
                            alt={ligne.article.nom}
                            className="w-10 h-10 object-cover rounded border"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
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
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val >= 0) {
                              modifierPrix(ligne.article.id, val);
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
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val > 0) {
                                setPanier(prev => 
                                  prev.map(p => 
                                    p.article.id === ligne.article.id 
                                      ? { ...p, quantite: val } 
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
                  <select 
                    value={modePaiement} 
                    onChange={(e) => setModePaiement(e.target.value)} 
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="especes">Espèces</option>
                    <option value="carte">Carte bancaire</option>
                    <option value="virement">Virement</option>
                    <option value="cheque">Chèque</option>
                    <option value="sumup">SumUp</option>
                    <option value="en_attente">En attente</option>
                  </select>
                </div>
                <div className="pt-2">
                  <label className="block text-sm font-medium mb-2">Emplacement</label>
                  <input 
                    type="text" 
                    value={emplacement}
                    onChange={(e) => setEmplacement(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="ex: Marché, Boutique..."
                  />
                </div>
                {/* ✅ Champ commentaire */}
                <div className="pt-2">
                  <label className="block text-sm font-medium mb-2">Commentaire</label>
                  <textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                    placeholder="Ajoutez un commentaire pour la facture..."
                  />
                </div>
                <button 
                  onClick={sauvegarderModifications} 
                  disabled={saving}
                  className={`w-full py-3 rounded-lg font-bold mt-4 flex items-center justify-center space-x-2 ${
                    saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <span>Enregistrer les modifications</span>
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