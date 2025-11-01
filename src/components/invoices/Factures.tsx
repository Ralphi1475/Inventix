'use client';
import React, { useState, useMemo } from 'react';
import { FileText, Trash2, Edit, X, Plus } from 'lucide-react';
import { Article, Contact, Mouvement, FactureResume } from '@/types';

// ✅ Fonction pour formater une date en DD/MM/YYYY
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateStr)) {
    return dateStr.split(' ')[0];
  }
  
  if (dateStr.includes('T')) {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  
  return dateStr;
}

// ✅ Convertir DD/MM/YYYY en YYYY-MM-DD pour l'input date
function dateToInputFormat(dateStr: string): string {
  if (!dateStr) return '';
  
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr.split('T')[0];
  }
  
  return dateStr;
}

// ✅ Fonction pour obtenir les couleurs selon le mode de paiement
function getPaymentColor(mode: string): string {
  switch(mode?.toLowerCase()) {
    case 'especes':
      return 'bg-green-100 text-green-800';
    case 'carte':
      return 'bg-blue-100 text-blue-800';
    case 'virement':
    case 'cheque':
      return 'bg-orange-100 text-orange-800';
    case 'sumup':
      return 'bg-purple-100 text-purple-800';
    case 'en_attente':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

interface FacturesProps {
  factures: FactureResume[];
  mouvements: Mouvement[];
  articles: Article[];
  clients: Contact[];
  parametres: any;
  onDeleteFacture?: (reference: string) => Promise<void>;
  onDeleteMouvement?: (id: string) => Promise<void>;
  onUpdateArticle?: (article: Article) => Promise<void>;
  onUpdateMouvement?: (mouvement: Mouvement) => Promise<void>; // ✅ Nouveau
  onCreateMouvement?: (mouvement: Omit<Mouvement, 'id'>) => Promise<void>; // ✅ Nouveau
  onUpdateFacture?: (facture: FactureResume) => Promise<void>; // ✅ Nouveau
  onRefresh?: () => Promise<void>;
}

// ✅ Interface pour une ligne de facture en cours de modification
interface LigneFacture {
  mouvementId?: string;
  articleId: string;
  quantite: number;
  prixUnitaireHT: number;
  tauxTVA: number;
  nomArticle: string;
}

export function Factures({ 
  factures, 
  mouvements, 
  articles, 
  clients, 
  parametres,
  onDeleteFacture,
  onDeleteMouvement,
  onUpdateArticle,
  onUpdateMouvement,
  onCreateMouvement,
  onUpdateFacture,
  onRefresh
}: FacturesProps) {
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [factureEnModification, setFactureEnModification] = useState<string | null>(null);
  const [lignesModifiees, setLignesModifiees] = useState<LigneFacture[]>([]);
  const [clientModifie, setClientModifie] = useState('');
  const [dateModifiee, setDateModifiee] = useState('');
  const [modePaiementModifie, setModePaiementModifie] = useState('');
  const [emplacementModifie, setEmplacementModifie] = useState('');
  
  console.log('🔍 Vérification des props:');
  console.log('onUpdateMouvement existe?', !!onUpdateMouvement);
  console.log('onUpdateFacture existe?', !!onUpdateFacture);
  console.log('onCreateMouvement existe?', !!onCreateMouvement);
  
  const facturesFiltrees = useMemo(() => {
    let filtered = [...factures];
    if (dateDebut) filtered = filtered.filter(f => f.date >= dateDebut);
    if (dateFin) filtered = filtered.filter(f => f.date <= dateFin);
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [factures, dateDebut, dateFin]);

  const totalAffiche = facturesFiltrees.reduce((sum, f) => sum + f.montant, 0);

  // ✅ Ouvrir le modal de modification
  const ouvrirModificationFacture = (reference: string) => {
    const facture = factures.find(f => f.reference === reference);
    if (!facture) return;

    const lignesVente = mouvements.filter(m => m.reference === reference && (m.type === 'vente' || m.type === 'venteComptoir'));
    
    const lignes: LigneFacture[] = lignesVente.map(mvt => {
      const article = articles.find(a => a.id === mvt.articleId);
      return {
        mouvementId: mvt.id,
        articleId: mvt.articleId,
        quantite: parseFloat(mvt.quantite.toString()) || 0,
        prixUnitaireHT: article?.prixVenteHT || 0,
        tauxTVA: article?.tauxTVA || 0,
        nomArticle: article?.nom || mvt.nomArticle || 'Article inconnu'
      };
    });

    setLignesModifiees(lignes);
    setClientModifie(lignesVente[0]?.clientId || '');
    setDateModifiee(dateToInputFormat(lignesVente[0]?.date || facture.date));
    setModePaiementModifie(facture.modePaiement);
    setEmplacementModifie(facture.emplacement || '');
    setFactureEnModification(reference);
  };

  // ✅ Fermer le modal
  const fermerModification = () => {
    setFactureEnModification(null);
    setLignesModifiees([]);
  };

  // ✅ Modifier une ligne
  const modifierLigne = (index: number, champ: keyof LigneFacture, valeur: any) => {
    const nouvelles = [...lignesModifiees];
    nouvelles[index] = { ...nouvelles[index], [champ]: valeur };
    setLignesModifiees(nouvelles);
  };

  // ✅ Ajouter une ligne
  const ajouterLigne = () => {
    setLignesModifiees([
      ...lignesModifiees,
      {
        articleId: '',
        quantite: 1,
        prixUnitaireHT: 0,
        tauxTVA: 0,
        nomArticle: ''
      }
    ]);
  };

  // ✅ Supprimer une ligne
  const supprimerLigne = (index: number) => {
    setLignesModifiees(lignesModifiees.filter((_, i) => i !== index));
  };

  // ✅ Changer l'article d'une ligne
  const changerArticle = (index: number, articleId: string) => {
    const article = articles.find(a => a.id === articleId);
    if (article) {
      modifierLigne(index, 'articleId', articleId);
      modifierLigne(index, 'prixUnitaireHT', article.prixVenteHT || 0);
      modifierLigne(index, 'tauxTVA', article.tauxTVA || 0);
      modifierLigne(index, 'nomArticle', article.nom);
    }
  };

  // ✅ Calculer le total
  const calculerTotal = () => {
    let totalHT = 0;
    let totalTVA = 0;
    
    lignesModifiees.forEach(ligne => {
      const montantHT = ligne.prixUnitaireHT * ligne.quantite;
      const montantTVA = montantHT * (ligne.tauxTVA / 100);
      totalHT += montantHT;
      totalTVA += montantTVA;
    });

    const totalTTC = totalHT + totalTVA;
    const reduction = modePaiementModifie === 'sumup' ? totalTTC * 0.02 : 0;
    
    return {
      totalHT,
      totalTVA,
      totalTTC,
      reduction,
      totalFinal: totalTTC - reduction
    };
  };

  // ✅ Sauvegarder les modifications
  const sauvegarderModifications = async () => {
    if (!factureEnModification || !onUpdateMouvement || !onCreateMouvement || !onDeleteMouvement || !onUpdateArticle || !onUpdateFacture) {
      alert('Fonctions de mise à jour non disponibles');
      return;
    }

    const confirmation = window.confirm('Voulez-vous vraiment enregistrer ces modifications ?');
    if (!confirmation) return;

    try {
      console.log('💾 Début de la sauvegarde des modifications...');
      
      const facture = factures.find(f => f.reference === factureEnModification);
      if (!facture) throw new Error('Facture introuvable');

      const anciensMovements = mouvements.filter(m => m.reference === factureEnModification);
      
      // 1. Remettre le stock des anciens mouvements
      for (const mvt of anciensMovements) {
        const article = articles.find(a => a.id === mvt.articleId);
        if (article) {
          const quantite = parseFloat(mvt.quantite.toString()) || 0;
          await onUpdateArticle({ ...article, stock: article.stock + quantite });
        }
      }

      // 2. Supprimer les anciens mouvements
      for (const mvt of anciensMovements) {
        await onDeleteMouvement(mvt.id);
      }

      // 3. Créer les nouveaux mouvements et déduire le stock
      const client = clients.find(c => c.id === clientModifie);
      const dateFormatee = dateModifiee.split('-').reverse().join('/');
      
      for (const ligne of lignesModifiees) {
        if (!ligne.articleId || ligne.quantite <= 0) continue;

        const article = articles.find(a => a.id === ligne.articleId);
        if (!article) continue;

        // Déduire le stock
        await onUpdateArticle({ ...article, stock: article.stock - ligne.quantite });

        // Créer le mouvement
        await onCreateMouvement({
          date: dateFormatee,
          type: 'vente',
          articleId: ligne.articleId,
          quantite: ligne.quantite,
          clientId: clientModifie,
          reference: factureEnModification,
          modePaiement: modePaiementModifie,
          nomArticle: ligne.nomArticle,
          prixUnitaire: ligne.prixUnitaireHT,
          emplacement: emplacementModifie,
          nomClient: client?.societe || client?.nom || ''
        });
      }

      // 4. Mettre à jour la facture
      const totaux = calculerTotal();
      await onUpdateFacture({
        ...facture,
        date: dateFormatee,
        client: client?.societe || client?.nom || '',
        modePaiement: modePaiementModifie,
        montant: totaux.totalFinal,
        emplacement: emplacementModifie
      });

      // 5. Recharger les données
      if (onRefresh) {
        await onRefresh();
      }

      alert('Facture modifiée avec succès !');
      fermerModification();
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      alert(`Erreur: ${error}`);
    }
  };

  const supprimerFactureEtMouvements = async (reference: string) => {
    const confirmation = window.confirm(
      `Êtes-vous sûr de vouloir supprimer la facture ${reference} ?\n\n` +
      `Cette action supprimera également tous les mouvements associés et remettra le stock des articles.`
    );

    if (!confirmation) return;

    try {
      console.log('🗑️ Début de la suppression de la facture:', reference);
      
      const mouvementsAssocies = mouvements.filter(m => m.reference === reference);
      console.log('📦 Mouvements associés trouvés:', mouvementsAssocies.length);
      
      for (const mouvement of mouvementsAssocies) {
        if (mouvement.type === 'vente' || mouvement.type === 'venteComptoir') {
          const article = articles.find(a => a.id === mouvement.articleId);
          if (article && onUpdateArticle) {
            const quantite = parseFloat(mouvement.quantite.toString()) || 0;
            const nouveauStock = article.stock + quantite;
            console.log(`📈 Remise stock ${article.nom}: ${article.stock} + ${quantite} = ${nouveauStock}`);
            await onUpdateArticle({ ...article, stock: nouveauStock });
          }
        }
      }

      if (onDeleteMouvement) {
        for (const mouvement of mouvementsAssocies) {
          console.log('🗑️ Suppression mouvement:', mouvement.id);
          await onDeleteMouvement(mouvement.id);
        }
      }

      const facture = factures.find(f => f.reference === reference);
      if (facture && onDeleteFacture) {
        console.log('🗑️ Suppression facture ID:', facture.id);
        await onDeleteFacture(facture.id);
      }

      if (onRefresh) {
        console.log('🔄 Rechargement des données...');
        await onRefresh();
      }

      alert('Facture supprimée avec succès !');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      alert(`Erreur lors de la suppression de la facture: ${error}`);
    }
  };

  const genererFactureDetail = (reference: string) => {
    const lignesVente = mouvements.filter(m => m.reference === reference && (m.type === 'vente' || m.type === 'venteComptoir'));
    
    if (lignesVente.length === 0) {
      alert('Aucun mouvement trouvé pour cette facture');
      return;
    }

    const facture = factures.find(f => f.reference === reference);
    if (!facture) {
      alert('Facture non trouvée');
      return;
    }

    const client = clients.find(c => c.id === lignesVente[0].clientId);
    const modePaiement = facture.modePaiement;

    let totalHT = 0;
    let totalTVA = 0;
    lignesVente.forEach(ligne => {
      const article = articles.find(a => a.id === ligne.articleId);
      if (article) {
        const quantite = parseFloat(ligne.quantite.toString()) || 0;
        const prixHT = article.prixVenteHT || 0;
        const tauxTVA = article.tauxTVA || 0;
        
        totalHT += prixHT * quantite;
        totalTVA += (prixHT * tauxTVA / 100) * quantite;
      }
    });

    const totalAvantReduction = totalHT + totalTVA;
    const reduction = modePaiement === 'sumup' ? totalAvantReduction * 0.02 : 0;
    const totalFinal = totalAvantReduction - reduction;

    const dateFacture = formatDate(lignesVente[0].date);

    let factureHTML = `
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f5f5f5; }
          .total-row { font-weight: bold; }
          .reduction { color: green; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
          @media print {
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h2>${parametres.societe_nom || 'Votre Société'}</h2>
            <p>${parametres.societe_adresse || ''}</p>
            <p>${parametres.societe_code_postal || ''} ${parametres.societe_ville || ''}</p>
            <p>TVA: ${parametres.societe_tva || ''}</p>
          </div>
          <div style="text-align: right;">
            <h1>FACTURE</h1>
            <p><strong>N° ${reference}</strong></p>
            <p>Date: ${dateFacture}</p>
          </div>
        </div>
        <div class="info">
          <h3>Client:</h3>
          <p><strong>${client?.societe || ''}</strong></p>
          <p>${client?.nom || ''} ${client?.prenom || ''}</p>
          <p>${client?.adresse || ''}</p>
          <p>${client?.codePostal || ''} ${client?.ville || ''}</p>
          ${client?.numeroTVA ? `<p>TVA: ${client.numeroTVA}</p>` : ''}
        </div>
        <table>
          <thead>
            <tr>
              <th>Article</th>
              <th style="text-align: right;">Quantité</th>
              <th style="text-align: right;">Prix Unit. HT</th>
              <th style="text-align: center;">TVA</th>
              <th style="text-align: right;">Total TTC</th>
            </tr>
          </thead>
          <tbody>
    `;

    lignesVente.forEach(ligne => {
      const article = articles.find(a => a.id === ligne.articleId);
      if (article) {
        const quantite = parseFloat(ligne.quantite.toString()) || 0;
        const prixHT = article.prixVenteHT || 0;
        const prixTTC = article.prixVenteTTC || 0;
        const totalLigne = prixTTC * quantite;
        
        factureHTML += `
          <tr>
            <td>${article.nom}</td>
            <td style="text-align: right;">${quantite % 1 === 0 ? quantite : quantite.toFixed(2)}</td>
            <td style="text-align: right;">${prixHT.toFixed(2)} €</td>
            <td style="text-align: center;">${article.tauxTVA}%</td>
            <td style="text-align: right;">${totalLigne.toFixed(2)} €</td>
          </tr>
        `;
      }
    });

    factureHTML += `
          </tbody>
        </table>
        <div style="text-align: right; font-size: 16px;">
          <div style="margin-bottom: 5px;">Total HTVA: ${totalHT.toFixed(2)} €</div>
          <div style="margin-bottom: 5px;">TVA: ${totalTVA.toFixed(2)} €</div>
          <div style="margin-bottom: 10px;">Total TTC: ${totalAvantReduction.toFixed(2)} €</div>
    `;

    if (reduction > 0) {
      factureHTML += `
          <div class="reduction" style="margin-bottom: 10px;">Réduction SumUp (2%): -${reduction.toFixed(2)} €</div>
      `;
    }

    factureHTML += `
          <div class="total-row" style="margin-top: 10px; padding-top: 10px; border-top: 2px solid #333; font-size: 18px;">
            Total à payer: ${totalFinal.toFixed(2)} €
          </div>
        </div>
        <div class="footer">
          <p><strong>Mode de paiement:</strong> ${modePaiement === 'sumup' ? 'SumUp (2% de réduction appliquée)' : 
            modePaiement === 'especes' ? 'Espèces' :
            modePaiement === 'carte' ? 'Carte bancaire' :
            modePaiement === 'virement' ? 'Virement' :
            modePaiement === 'cheque' ? 'Chèque' :
            modePaiement === 'en_attente' ? 'En attente' :
            modePaiement
          }</p>
          ${facture.emplacement ? `<p><strong>Lieu de vente:</strong> ${facture.emplacement}</p>` : ''}
        </div>
        <div style="margin-top: 40px; text-align: center; font-size: 11px; color: #999;">
          <p>${parametres.societe_nom || ''} - ${parametres.societe_email || ''} - ${parametres.societe_telephone || ''}</p>
          <p>IBAN: ${parametres.societe_iban || ''}</p>
        </div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(factureHTML);
      win.document.close();
      win.focus();
    } else {
      alert("Impossible d'ouvrir la fenêtre. Vérifiez que les pop-ups ne sont pas bloquées.");
    }
  };

  const totaux = factureEnModification ? calculerTotal() : null;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Factures [VERSION 2.0]</h2>
      
      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-xl font-bold mb-4">Filtrer les factures</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date de début</label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date de fin</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-6">
        <p className="font-bold">Total des factures affichées : <span className="text-green-800">{totalAffiche.toFixed(2)} €</span></p>
      </div>

      {/* Tableau des factures */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Référence</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Client</th>
              <th className="p-3 text-left">Mode de paiement</th>
              <th className="p-3 text-left">Montant</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {facturesFiltrees.map(facture => (
              <tr key={facture.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-mono">{facture.reference}</td>
                <td className="p-3">{formatDate(facture.date)}</td>
                <td className="p-3">{facture.client}</td>
                <td className="p-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentColor(facture.modePaiement)}`}>
                    {facture.modePaiement === 'especes' ? 'Espèces' :
                     facture.modePaiement === 'carte' ? 'Carte bancaire' :
                     facture.modePaiement === 'virement' ? 'Virement' :
                     facture.modePaiement === 'cheque' ? 'Chèque' :
                     facture.modePaiement === 'sumup' ? 'SumUp' :
                     facture.modePaiement === 'en_attente' ? 'En attente' :
                     facture.modePaiement || 'Non spécifié'}
                  </span>
                </td>
                <td className="p-3 font-bold">{facture.montant.toFixed(2)} €</td>
				<td className="p-3">
				<div className="flex items-center space-x-2">
				{/* 🔴 TEST - SI VOUS VOYEZ CE TEXTE, LE FICHIER EST À JOUR */}
				<span className="bg-red-500 text-white px-2 py-1 text-xs">VERSION TEST</span>
    
				{/* Bouton Voir */}
				<button 
				onClick={() => genererFactureDetail(facture.reference)} 
				className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition"
				title="Prévisualiser la facture"
				>
                      <FileText size={18} />
                      <span className="text-sm">Voir</span>
                    </button>
                    
                    {/* ✅ Bouton Modifier */}
                    {onUpdateMouvement && onUpdateFacture && (
                      <button 
						onClick={() => {
						console.log('🔍 Clic sur Modifier');
						console.log('Props:', {
						onUpdateMouvement: !!onUpdateMouvement,
						onUpdateFacture: !!onUpdateFacture,
						onCreateMouvement: !!onCreateMouvement
						});
    
						if (!onUpdateMouvement || !onUpdateFacture || !onCreateMouvement) {
						alert('⚠️ Fonctions manquantes!\n\nonUpdateMouvement: ' + !!onUpdateMouvement + '\nonUpdateFacture: ' + !!onUpdateFacture + '\nonCreateMouvement: ' + !!onCreateMouvement);
						return;
						}
    
						ouvrirModificationFacture(facture.reference);
						}}
						className="flex items-center space-x-1 text-orange-600 hover:text-orange-800 hover:bg-orange-50 px-2 py-1 rounded transition"
						title="Modifier la facture"
						>
								<Edit size={18} />
								<span className="text-sm">Modifier</span>
							</button>
                    )}
                    
                    {/* Bouton Supprimer */}
                    {onDeleteFacture && onDeleteMouvement && (
                      <button 
                        onClick={() => supprimerFactureEtMouvements(facture.reference)}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition"
                        title="Supprimer la facture"
                      >
                        <Trash2 size={18} />
                        <span className="text-sm">Supprimer</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ MODAL DE MODIFICATION */}
      {factureEnModification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl my-8">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
              <h3 className="text-xl font-bold">Modifier la facture {factureEnModification}</h3>
              <button onClick={fermerModification} className="text-white hover:text-gray-200">
                <X size={24} />
              </button>
            </div>

            {/* Corps du modal */}
            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Informations générales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Client</label>
                  <select
                    value={clientModifie}
                    onChange={(e) => setClientModifie(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.societe || `${c.nom} ${c.prenom}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={dateModifiee}
                    onChange={(e) => setDateModifiee(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mode de paiement</label>
                  <select
                    value={modePaiementModifie}
                    onChange={(e) => setModePaiementModifie(e.target.value)}
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
                <div>
                  <label className="block text-sm font-medium mb-1">Emplacement</label>
                  <input
                    type="text"
                    value={emplacementModifie}
                    onChange={(e) => setEmplacementModifie(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ex: Boutique, Marché..."
                  />
                </div>
              </div>

              {/* Lignes de la facture */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-lg font-bold">Articles</h4>
                  <button
                    onClick={ajouterLigne}
                    className="flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
                  >
                    <Plus size={18} />
                    <span>Ajouter une ligne</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left border">Article</th>
                        <th className="p-2 text-right border">Quantité</th>
                        <th className="p-2 text-right border">Prix HT</th>
                        <th className="p-2 text-center border">TVA</th>
                        <th className="p-2 text-right border">Total TTC</th>
                        <th className="p-2 border">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lignesModifiees.map((ligne, index) => {
                        const montantHT = ligne.prixUnitaireHT * ligne.quantite;
                        const montantTVA = montantHT * (ligne.tauxTVA / 100);
                        const totalTTC = montantHT + montantTVA;
                        
                        return (
                          <tr key={index} className="border-b">
                            <td className="p-2 border">
                              <select
                                value={ligne.articleId}
                                onChange={(e) => changerArticle(index, e.target.value)}
                                className="w-full px-2 py-1 border rounded"
                              >
                                <option value="">Sélectionner...</option>
                                {articles.map(a => (
                                  <option key={a.id} value={a.id}>{a.nom}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2 border">
                              <input
                                type="number"
                                step="0.01"
                                value={ligne.quantite}
                                onChange={(e) => modifierLigne(index, 'quantite', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 border rounded text-right"
                              />
                            </td>
                            <td className="p-2 border">
                              <input
                                type="number"
                                step="0.01"
                                value={ligne.prixUnitaireHT}
                                onChange={(e) => modifierLigne(index, 'prixUnitaireHT', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 border rounded text-right"
                              />
                            </td>
                            <td className="p-2 border text-center">{ligne.tauxTVA}%</td>
                            <td className="p-2 border text-right font-bold">{totalTTC.toFixed(2)} €</td>
                            <td className="p-2 border text-center">
                              <button
                                onClick={() => supprimerLigne(index)}
                                className="text-red-600 hover:text-red-800"
                                title="Supprimer cette ligne"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totaux */}
              {totaux && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <span>Total HT:</span>
                        <span className="font-bold">{totaux.totalHT.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TVA:</span>
                        <span className="font-bold">{totaux.totalTVA.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total TTC:</span>
                        <span className="font-bold">{totaux.totalTTC.toFixed(2)} €</span>
                      </div>
                      {totaux.reduction > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Réduction SumUp (2%):</span>
                          <span className="font-bold">-{totaux.reduction.toFixed(2)} €</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg border-t-2 border-gray-300 pt-2">
                        <span className="font-bold">Total à payer:</span>
                        <span className="font-bold text-blue-600">{totaux.totalFinal.toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={fermerModification}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Annuler
              </button>
              <button
                onClick={sauvegarderModifications}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}