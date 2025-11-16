'use client';
import React, { useState, useMemo } from 'react';
import { StatCard } from './StatCard';
import { Article, Mouvement, Contact } from '@/types';
import { X, TrendingUp } from 'lucide-react';

// 🔧 Fonction de correction : soustrait 1 jour à la date de la Sheet
function correctSheetDate(dateStr: string): string {
  if (!dateStr) return '';

  // Cas 1 : format "DD/MM/YYYY HH:MM:SS" ou "DD/MM/YYYY"
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateStr)) {
    const [day, month, year] = dateStr.split(' ')[0].split('/');
    const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    date.setDate(date.getDate() + 0);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Cas 2 : format ISO (ex. "2025-04-01T00:00:00.000Z")
  if (dateStr.includes('T')) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 0);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Cas 3 : déjà au format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 0);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Fallback (ne devrait pas arriver)
  return dateStr.substring(0, 10);
}

// 🔧 Fonction pour affichage DD/MM/YYYY à partir de la date corrigée
function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

interface DashboardProps {
  stats: any;
  mouvements: Mouvement[];
  articles: Article[];
  clients: Contact[];
  fournisseurs: Contact[];
  achats?: any[];
}

export function Dashboard({ stats, mouvements, articles, clients, fournisseurs, achats = [] }: DashboardProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedMouvementType, setSelectedMouvementType] = useState<'all' | 'ventes' | 'achats'>('all');
  const [showVentesModal, setShowVentesModal] = useState(false); // ✅ Nouveau state pour le modal

  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
  
  const months = [
    { value: 'all', label: 'Année complète' },
    { value: '01', label: 'Janvier' },
    { value: '02', label: 'Février' },
    { value: '03', label: 'Mars' },
    { value: '04', label: 'Avril' },
    { value: '05', label: 'Mai' },
    { value: '06', label: 'Juin' },
    { value: '07', label: 'Juillet' },
    { value: '08', label: 'Août' },
    { value: '09', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' },
  ];

  const filteredData = useMemo(() => {
    // ✅ Calcul des bornes de la période sélectionnée
    const startDate = selectedMonth === 'all' 
      ? `${selectedYear}-01-01` 
      : `${selectedYear}-${selectedMonth}-01`;
    
    const endDate = selectedMonth === 'all'
      ? `${selectedYear}-12-31`
      : (() => {
          const year = selectedYear;
          const month = parseInt(selectedMonth);
          const lastDay = new Date(year, month, 0).getDate();
          return `${year}-${selectedMonth}-${lastDay.toString().padStart(2, '0')}`;
        })();

    // ✅ Filtrer les ventes avec correction de date
    const ventesFiltered = mouvements.filter(m => {
      if (m.type !== 'vente' && m.type !== 'venteComptoir') return false;
      const correctedDate = correctSheetDate(m.date);
      return correctedDate >= startDate && correctedDate <= endDate;
    });

    // ✅ Filtrer les achats
	const achatsFiltered = achats.filter(a => {
	if (!a.dateAchat) return false;  // ✅ CHANGÉ
	const correctedDate = correctSheetDate(a.dateAchat);  // ✅ CHANGÉ
	return correctedDate >= startDate && correctedDate <= endDate;
	});

    // Calculs financiers
    let totalVentes = 0;
    let coutAchatVentes = 0;

    ventesFiltered.forEach(vente => {
      const article = articles.find(a => a.id === vente.articleId);
      if (article) {
        const prixVenteTTC = article.prixVenteTTC || 0;
        const prixAchat = article.prixAchat || 0;
        const quantite = parseFloat(vente.quantite?.toString() || '0') || 0;
        
        totalVentes += prixVenteTTC * quantite;
        coutAchatVentes += prixAchat * quantite;
      }
    });

    const totalAchats = achatsFiltered.reduce((sum, a) => sum + (parseFloat(a.montantTtc) || 0), 0);  // ✅ CHANGÉ
    const beneficeBrut = totalVentes - coutAchatVentes;
    const beneficeNet = beneficeBrut - totalAchats;

    // ✅ Calculer les quantités vendues par article
    const ventesParArticle = new Map<string, { nom: string; quantite: number; montantTTC: number }>();
    
    ventesFiltered.forEach(vente => {
      const article = articles.find(a => a.id === vente.articleId);
      if (article) {
        const quantite = parseFloat(vente.quantite?.toString() || '0') || 0;
        const montantTTC = (article.prixVenteTTC || 0) * quantite;
        
        if (ventesParArticle.has(article.id)) {
          const existing = ventesParArticle.get(article.id)!;
          existing.quantite += quantite;
          existing.montantTTC += montantTTC;
        } else {
          ventesParArticle.set(article.id, {
            nom: article.nom,
            quantite,
            montantTTC
          });
        }
      }
    });

    // Convertir en tableau et trier par quantité décroissante
    const ventesParArticleArray = Array.from(ventesParArticle.values())
      .sort((a, b) => b.quantite - a.quantite);

    // ✅ Combiner ventes et achats pour l'affichage des mouvements
    const allMouvements = [
      ...ventesFiltered.map(v => ({
        ...v,
        mouvementType: 'vente' as const,
        dateCorrected: correctSheetDate(v.date)
      })),
		...achatsFiltered.map(a => ({
		id: a.id,
		date: a.dateAchat,  // ✅ CHANGÉ
		mouvementType: 'achat' as const,
		dateCorrected: correctSheetDate(a.dateAchat),  // ✅ CHANGÉ
		description: a.description,
		montantTTC: a.montantTtc,  // ✅ CHANGÉ (gardé montantTTC pour le nouveau objet)
		nomFournisseur: a.nomFournisseur,
		categorie: a.categorie
		}))
    ].sort((a, b) => a.dateCorrected.localeCompare(b.dateCorrected));

    return {
      totalVentes,
      totalAchats,
      coutAchatVentes,
      beneficeBrut,
      beneficeNet,
      nombreVentes: ventesFiltered.length,
      nombreAchats: achatsFiltered.length,
      mouvementsFiltered: ventesFiltered,
      allMouvements,
      ventesParArticleArray // ✅ Nouveau : statistiques par article
    };
  }, [selectedYear, selectedMonth, mouvements, achats, articles]);

  const getBeneficeColor = (value: number) => {
    if (value > 0) return 'green';
    if (value < 0) return 'red';
    return 'gray';
  };

  // ✅ Filtrer les mouvements à afficher selon le type sélectionné
  const mouvementsToDisplay = useMemo(() => {
    if (selectedMouvementType === 'ventes') {
      return filteredData.allMouvements.filter(m => m.mouvementType === 'vente');
    } else if (selectedMouvementType === 'achats') {
      return filteredData.allMouvements.filter(m => m.mouvementType === 'achat');
    } else {
      return filteredData.allMouvements;
    }
  }, [filteredData.allMouvements, selectedMouvementType]);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Dashboard</h2>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Année</label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Période</label>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Ventes Totales" 
          value={`${filteredData.totalVentes.toFixed(2)} €`} 
          color="green" 
          subtitle={`${filteredData.nombreVentes} vente(s)`}
        />
        <StatCard 
          title="Achats / Frais" 
          value={`${filteredData.totalAchats.toFixed(2)} €`} 
          color="red" 
          subtitle={`${filteredData.nombreAchats} achat(s)`}
        />
        <StatCard 
          title="Marge Brute" 
          value={`${filteredData.beneficeBrut.toFixed(2)} €`} 
          color={getBeneficeColor(filteredData.beneficeBrut)}
          subtitle="Ventes - Coût marchandises"
        />
        <StatCard 
          title="Résultat Net" 
          value={`${filteredData.beneficeNet.toFixed(2)} €`} 
          color={getBeneficeColor(filteredData.beneficeNet)}
          subtitle="Après déduction frais"
        />
      </div>

      <div className={`${
        filteredData.beneficeNet > 0 ? 'bg-green-100 border-green-500' : 
        filteredData.beneficeNet < 0 ? 'bg-red-100 border-red-500' : 
        'bg-gray-100 border-gray-500'
      } border-l-4 rounded-lg p-4 mb-6`}>
        <p className="font-bold text-lg">
          {filteredData.beneficeNet > 0 ? '✅ Bénéfice' : 
           filteredData.beneficeNet < 0 ? '⚠️ Perte' : 
           '➖ Équilibre'}
        </p>
        <p className="text-sm mt-1">
          {filteredData.beneficeNet > 0 
            ? `Vous avez réalisé un bénéfice de ${filteredData.beneficeNet.toFixed(2)} € sur cette période.`
            : filteredData.beneficeNet < 0
            ? `Vous avez une perte de ${Math.abs(filteredData.beneficeNet).toFixed(2)} € sur cette période.`
            : 'Vos revenus et dépenses sont équilibrés sur cette période.'}
        </p>
        <div className="mt-3 text-sm">
          <p>• Coût des marchandises vendues : {filteredData.coutAchatVentes.toFixed(2)} €</p>
          <p>• Marge commerciale : {filteredData.beneficeBrut.toFixed(2)} €</p>
          <p>• Frais généraux : {filteredData.totalAchats.toFixed(2)} €</p>
        </div>
      </div>

      {/* ✅ Bouton pour afficher les ventes par article */}
      <div className="mb-6">
        <button
          onClick={() => setShowVentesModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <TrendingUp size={20} />
          <span>Voir les quantités vendues par article</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">
            Derniers Mouvements 
            {selectedMonth !== 'all' && ` - ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
            {selectedMonth === 'all' && ` - ${selectedYear}`}
          </h3>
          <select 
            value={selectedMouvementType} 
            onChange={(e) => setSelectedMouvementType(e.target.value as 'all' | 'ventes' | 'achats')}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Tous les mouvements</option>
            <option value="ventes">Ventes uniquement</option>
            <option value="achats">Achats uniquement</option>
          </select>
        </div>
        
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto border rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Description</th>
                <th className="p-3 text-left">Quantité</th>
                <th className="p-3 text-left">Montant</th>
                <th className="p-3 text-left">Contact</th>
              </tr>
            </thead>
            <tbody>
              {mouvementsToDisplay.reverse().map((mouv: any) => {
                const dateAffichage = formatDisplayDate(mouv.dateCorrected);
                
                if (mouv.mouvementType === 'vente') {
                  const article = articles.find(a => a.id === mouv.articleId);
                  const contact = clients.find(c => c.id === mouv.clientId);
                  const quantite = parseFloat(mouv.quantite?.toString() || '0') || 0;
                  const montant = article ? (article.prixVenteTTC || 0) * quantite : 0;
                  
                  return (
                    <tr key={`vente-${mouv.id}`} className="border-b hover:bg-gray-50">
                      <td className="p-3">{dateAffichage}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          {mouv.type}
                        </span>
                      </td>
                      <td className="p-3">{article?.nom || '-'}</td>
                      <td className="p-3">{quantite % 1 === 0 ? quantite : quantite.toFixed(2)}</td>
                      <td className="p-3 font-semibold text-green-600">{montant.toFixed(2)} €</td>
                      <td className="p-3">{contact?.societe || contact?.nom || '-'}</td>
                    </tr>
                  );
                } else {
                  return (
                    <tr key={`achat-${mouv.id}`} className="border-b hover:bg-gray-50">
                      <td className="p-3">{dateAffichage}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                          Achat
                        </span>
                      </td>
                      <td className="p-3">{mouv.description || mouv.categorie || '-'}</td>
                      <td className="p-3">-</td>
                      <td className="p-3 font-semibold text-red-600">{(parseFloat(mouv.montantTTC) || 0).toFixed(2)} €</td>
                      <td className="p-3">{mouv.nomFournisseur || '-'}</td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ Modal pour afficher les ventes par article */}
      {showVentesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                Quantités vendues par article
                {selectedMonth !== 'all' && ` - ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
                {selectedMonth === 'all' && ` - ${selectedYear}`}
              </h2>
              <button
                onClick={() => setShowVentesModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {filteredData.ventesParArticleArray.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucune vente sur cette période</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-left">Article</th>
                        <th className="p-3 text-right">Quantité vendue</th>
                        <th className="p-3 text-right">Montant TTC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.ventesParArticleArray.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3">{item.nom}</td>
                          <td className="p-3 text-right font-semibold">
                            {item.quantite % 1 === 0 ? item.quantite : item.quantite.toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-semibold text-green-600">
                            {item.montantTTC.toFixed(2)} €
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100 font-bold">
                        <td className="p-3">TOTAL</td>
                        <td className="p-3 text-right">
                          {filteredData.ventesParArticleArray.reduce((sum, item) => sum + item.quantite, 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-green-600">
                          {filteredData.ventesParArticleArray.reduce((sum, item) => sum + item.montantTTC, 0).toFixed(2)} €
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}