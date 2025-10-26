'use client';
import React, { useState, useMemo } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { Article, Contact, Mouvement, FactureResume } from '@/types';

// ✅ Fonction pour formater une date en DD/MM/YYYY
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Cas 1 : format "DD/MM/YYYY HH:MM:SS" ou "DD/MM/YYYY"
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateStr)) {
    return dateStr.split(' ')[0]; // Retourne juste la partie date
  }
  
  // Cas 2 : format ISO (ex. "2025-04-01T00:00:00.000Z")
  if (dateStr.includes('T')) {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  // Cas 3 : format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
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
  onDeleteFacture?: (reference: string) => Promise<void>; // ✅ Nouvelle prop
  onDeleteMouvement?: (id: string) => Promise<void>; // ✅ Nouvelle prop
  onUpdateArticle?: (article: Article) => Promise<void>; // ✅ Nouvelle prop
  onRefresh?: () => Promise<void>; // ✅ Nouvelle prop pour recharger les données
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
  onRefresh
}: FacturesProps) {
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const facturesFiltrees = useMemo(() => {
    let filtered = [...factures];
    if (dateDebut) filtered = filtered.filter(f => f.date >= dateDebut);
    if (dateFin) filtered = filtered.filter(f => f.date <= dateFin);
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [factures, dateDebut, dateFin]);

  const totalAffiche = facturesFiltrees.reduce((sum, f) => sum + f.montant, 0);

// ✅ Fonction de suppression corrigée
const supprimerFactureEtMouvements = async (reference: string) => {
  const confirmation = window.confirm(
    `Êtes-vous sûr de vouloir supprimer la facture ${reference} ?\n\n` +
    `Cette action supprimera également tous les mouvements associés et remettra le stock des articles.`
  );

  if (!confirmation) return;

  try {
    console.log('🗑️ Début de la suppression de la facture:', reference);
    
    // 1. Récupérer les mouvements associés
    const mouvementsAssocies = mouvements.filter(m => m.reference === reference);
    console.log('📦 Mouvements associés trouvés:', mouvementsAssocies.length);
    
    // 2. Remettre le stock pour chaque mouvement de vente
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

    // 3. Supprimer tous les mouvements associés
    if (onDeleteMouvement) {
      for (const mouvement of mouvementsAssocies) {
        console.log('🗑️ Suppression mouvement:', mouvement.id);
        await onDeleteMouvement(mouvement.id);
      }
    }

    // 4. Trouver et supprimer la facture
    const facture = factures.find(f => f.reference === reference);
    if (facture && onDeleteFacture) {
      console.log('🗑️ Suppression facture ID:', facture.id);
      await onDeleteFacture(facture.id);
    }

    // 5. Recharger les données
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

    // ✅ Calcul correct avec quantités décimales
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

    // ✅ Formater la date pour l'affichage
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

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Factures</h2>
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
      <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-6">
        <p className="font-bold">Total des factures affichées : <span className="text-green-800">{totalAffiche.toFixed(2)} €</span></p>
      </div>
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
                  {/* ✅ Badge coloré selon le mode de paiement */}
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
                    {/* ✅ Bouton Voir */}
                    <button 
                      onClick={() => genererFactureDetail(facture.reference)} 
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition"
                      title="Prévisualiser la facture"
                    >
                      <FileText size={18} />
                      <span className="text-sm">Voir</span>
                    </button>
                    
					{/* ✅ Bouton Supprimer */}
						{onDeleteFacture && onDeleteMouvement && (
						<button 
						onClick={() => supprimerFactureEtMouvements(facture.reference)}  // ✅ Changez ici
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
    </div>
  );
}