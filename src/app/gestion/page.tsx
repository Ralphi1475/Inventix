'use client';
import React, { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { 
  sauvegarderArticle,
  supprimerArticle,
  sauvegarderContact,
  supprimerContact,
  enregistrerMouvement,
  sauvegarderFacture,
  sauvegarderAchat,
  modifierAchat,
  supprimerAchat,
  sauvegarderParametres,
  supprimerFacture,
  supprimerMouvement,
  sauvegarderCategorie,
  supprimerCategorie
} from '@/lib/api';
import { 
  calculerArticlesAvecPrix, 
  calculerStats 
} from '@/lib/calculations';

// Composants UI
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Articles } from '@/components/articles/Articles';
import { Clients } from '@/components/contacts/Clients';
import { Fournisseurs } from '@/components/contacts/Fournisseurs';
import { VenteClient } from '@/components/sales/VenteClient';
import { VenteComptoir } from '@/components/sales/VenteComptoir';
import { EntreesStock } from '@/components/stock/EntreesStock';
import { Factures } from '@/components/invoices/Factures';
import { Achats } from '@/components/purchases/Achats';
import { ParametresSociete } from '@/components/settings/ParametresSociete';
import { NavItem } from '@/components/layout/NavItem';
import { Categories } from '@/components/categories/Categories';

// Icônes
import { Plus, Package, Users, TrendingUp, ShoppingCart, FileText, BarChart3, Settings, Search, Edit2, Trash2, Minus, X } from 'lucide-react';

export default function GestionApp() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  const {
    loading,
    articles,
    clients,
    fournisseurs,
    mouvements,
    factures,
    achats,
    categories,
    parametres,
    setArticles,
    setClients,
    setFournisseurs,
    setCategories,
    rechargerDonnees
  } = useData();

  const articlesAvecPrix = useMemo(() => {
    return calculerArticlesAvecPrix(articles);
  }, [articles]);

  const stats = useMemo(() => {
    return calculerStats(articles, articlesAvecPrix, mouvements, clients);
  }, [articles, articlesAvecPrix, mouvements, clients]);

  // Wrappers pour adapter les signatures de l'API
  const handleSaveArticle = async (article: any, action: 'create' | 'update') => {
    await sauvegarderArticle(article, action === 'update');
  };

const handleSaveContact = async (contact: any, action: 'create' | 'update') => {
  try {
    await sauvegarderContact(contact, action === 'update');
    await rechargerDonnees(); // ✅ Recharger après sauvegarde
  } catch (error) {
    console.error('❌ Erreur sauvegarde contact:', error);
    throw error;
  }
};


  const handleDeleteArticle = async (id: string) => {
    await supprimerArticle(id);
  };

		const handleDeleteContact = async (id: string) => {
		try {
			await supprimerContact(id);
			await rechargerDonnees(); // ✅ Recharger les données
		} catch (error) {
			console.error('❌ Erreur suppression contact:', error);
			throw error;
		}
		};
const handleEnregistrerMouvement = async (mouvement: any): Promise<boolean> => {
  try {
    await enregistrerMouvement(mouvement, articlesAvecPrix);
    await rechargerDonnees(); // ✅ Recharger après chaque mouvement
    return true;
  } catch (error) {
    console.error('❌ Erreur enregistrement mouvement:', error);
    return false;
  }
};
const handleSaveFacture = async (facture: any) => {
  try {
    await sauvegarderFacture(facture);
    await rechargerDonnees(); // ✅ Recharger après sauvegarde facture
  } catch (error) {
    console.error('❌ Erreur sauvegarde facture:', error);
    throw error;
  }
};

  const handleSaveAchat = async (achat: any, fournisseurs: any[]) => {
    await sauvegarderAchat(achat, fournisseurs);
  };

  const handleModifierAchat = async (achat: any, fournisseurs: any[]) => {
    await modifierAchat(achat, fournisseurs);
  };

  const handleDeleteAchat = async (id: string) => {
    await supprimerAchat(id);
  };

  const handleDeleteFacture = async (id: string) => {
    await supprimerFacture(id);
  };

  const handleDeleteMouvement = async (id: string) => {
    await supprimerMouvement(id);
  };

  const handleSaveCategorie = async (categorie: any, isUpdate: boolean) => {
    await sauvegarderCategorie(categorie, isUpdate);
  };

  const handleDeleteCategorie = async (id: string) => {
    await supprimerCategorie(id);
  };

  // ✅ FONCTION CORRIGÉE : Gestion d'erreur + Rechargement des données
const handleSaveParametres = async (params: any): Promise<boolean> => {
  try {
    console.log('💾 Sauvegarde des paramètres...', params);
    await sauvegarderParametres(params);
    console.log('✅ Paramètres sauvegardés avec succès');
    
    // ✅ Recharger les données pour mettre à jour l'interface
    await rechargerDonnees();
    
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde des paramètres:', error);
    alert('Erreur lors de la sauvegarde des paramètres. Veuillez réessayer.');
    return false;
  }
};

  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard':
        return <Dashboard stats={stats} mouvements={mouvements} articles={articlesAvecPrix} clients={clients} fournisseurs={fournisseurs} achats={achats} />;
      case 'articles':
        return <Articles articles={articlesAvecPrix} categories={categories} setArticles={setArticles} onSave={handleSaveArticle} onDelete={handleDeleteArticle} onRefresh={rechargerDonnees} />;
	case 'clients':
		return <Clients 
			contacts={clients} 
			setClients={setClients} 
			onSave={handleSaveContact} 
			onDelete={handleDeleteContact}
			onRefresh={rechargerDonnees} // ✅ Important !
		/>;
	  case 'fournisseurs':
		return <Fournisseurs 
			contacts={fournisseurs} 
			setFournisseurs={setFournisseurs} 
			onSave={handleSaveContact} 
		onDelete={handleDeleteContact}
			onRefresh={rechargerDonnees} // ✅ Important !
		/>;
      case 'vente-client':
		return <VenteClient 
			articles={articlesAvecPrix} 
			clients={clients} 
			onVente={handleEnregistrerMouvement}  // ✅ Bon wrapper
			setArticles={setArticles} 
			onSaveArticle={handleSaveArticle} 
			sauvegarderFacture={handleSaveFacture}
			parametres={parametres} 
			onRefresh={rechargerDonnees}
		/>;
      case 'vente-comptoir':
		return <VenteComptoir 
			articles={articlesAvecPrix} 
			clients={clients} 
			onVente={handleEnregistrerMouvement}  // ✅ Bon wrapper
			setArticles={setArticles} 
		    onSaveArticle={handleSaveArticle} 
			sauvegarderFacture={handleSaveFacture}
			onRefresh={rechargerDonnees}
		/>;
      case 'entrees':
		return <EntreesStock 
			articles={articlesAvecPrix} 
			fournisseurs={fournisseurs} 
			onEntree={handleEnregistrerMouvement}  // ✅ Bon wrapper
			setArticles={setArticles} 
			onSaveArticle={handleSaveArticle} 
		/>;
      case 'factures':
        return (
          <Factures 
            factures={factures} 
            mouvements={mouvements} 
            articles={articlesAvecPrix} 
            clients={clients} 
            parametres={parametres}
            onDeleteFacture={handleDeleteFacture}
            onDeleteMouvement={handleDeleteMouvement}
            onUpdateArticle={(article) => handleSaveArticle(article, 'update')}
            onRefresh={rechargerDonnees}
          />
        );
      case 'achats':
        return <Achats 
          achats={achats} 
          fournisseurs={fournisseurs} 
          sauvegarderAchat={handleSaveAchat} 
          modifierAchat={handleModifierAchat} 
          supprimerAchat={handleDeleteAchat} 
        />;
      case 'categories':
        return <Categories 
          categories={categories} 
          setCategories={setCategories} 
          onSave={handleSaveCategorie}
          onDelete={handleDeleteCategorie} 
        />;
      case 'parametres':
        return <ParametresSociete parametres={parametres} onSave={handleSaveParametres} />;
      default:
        return <Dashboard stats={stats} mouvements={mouvements} articles={articlesAvecPrix} clients={clients} fournisseurs={fournisseurs} achats={achats} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-black">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col md:flex-row overflow-hidden">
      <div className="w-64 bg-blue-900 text-white p-4 hidden md:block overflow-y-auto">
        <h1 className="text-2xl font-bold mb-8">Inventix</h1>
        <nav className="space-y-2">
          <NavItem icon={<BarChart3 size={20} />} label="Dashboard" active={currentPage === 'dashboard'} onClick={() => setCurrentPage('dashboard')} />
          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-blue-300">CATALOGUE</div>
          <NavItem icon={<Package size={20} />} label="Articles" active={currentPage === 'articles'} onClick={() => setCurrentPage('articles')} />
          <NavItem icon={<Users size={20} />} label="Clients" active={currentPage === 'clients'} onClick={() => setCurrentPage('clients')} />
          <NavItem icon={<Users size={20} />} label="Fournisseurs" active={currentPage === 'fournisseurs'} onClick={() => setCurrentPage('fournisseurs')} />
          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-blue-300">VENTES</div>
          <NavItem icon={<ShoppingCart size={20} />} label="Vente Client" active={currentPage === 'vente-client'} onClick={() => setCurrentPage('vente-client')} />
          <NavItem icon={<ShoppingCart size={20} />} label="Vente Comptoir" active={currentPage === 'vente-comptoir'} onClick={() => setCurrentPage('vente-comptoir')} />
          <NavItem icon={<FileText size={20} />} label="Factures" active={currentPage === 'factures'} onClick={() => setCurrentPage('factures')} />
          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-blue-300">STOCK</div>
          <NavItem icon={<TrendingUp size={20} />} label="Entrées Stock" active={currentPage === 'entrees'} onClick={() => setCurrentPage('entrees')} />
          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-blue-300">PARAMÈTRES</div>
          <NavItem icon={<ShoppingCart size={20} />} label="Achats / Frais" active={currentPage === 'achats'} onClick={() => setCurrentPage('achats')} />
          <NavItem icon={<Package size={20} />} label="Catégories" active={currentPage === 'categories'} onClick={() => setCurrentPage('categories')} />
          <NavItem icon={<Settings size={20} />} label="Ma Société" active={currentPage === 'parametres'} onClick={() => setCurrentPage('parametres')} />
          <NavItem icon={<Settings size={20} />} label="Configuration" active={currentPage === 'config'} onClick={() => setCurrentPage('config')} />
        </nav>
      </div>
<div className="md:hidden fixed bottom-0 left-0 right-0 bg-blue-900 text-white flex justify-around p-3 z-50 shadow-lg border-t-2 border-blue-800 overflow-x-auto">
  <button 
    onClick={() => setCurrentPage('dashboard')} 
    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${currentPage === 'dashboard' ? 'bg-blue-700' : ''}`}
  >
    <BarChart3 size={24} />
  </button>
  <button 
    onClick={() => setCurrentPage('articles')} 
    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${currentPage === 'articles' ? 'bg-blue-700' : ''}`}
  >
    <Package size={24} />
  </button>
  <button 
    onClick={() => setCurrentPage('vente-client')} 
    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${currentPage === 'vente-client' ? 'bg-blue-700' : ''}`}
  >
    <TrendingUp size={24} />
  </button>
  <button 
    onClick={() => setCurrentPage('vente-comptoir')} 
    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${currentPage === 'vente-comptoir' ? 'bg-blue-700' : ''}`}
  >
    <ShoppingCart size={24} />
  </button>
  <button 
    onClick={() => setCurrentPage('clients')} 
    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${currentPage === 'clients' ? 'bg-blue-700' : ''}`}
  >
    <Users size={24} />
  </button>
  <button 
    onClick={() => setCurrentPage('factures')} 
    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${currentPage === 'factures' ? 'bg-blue-700' : ''}`}
  >
    <FileText size={24} />
  </button>
  <button 
    onClick={() => setCurrentPage('parametres')} 
    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${currentPage === 'parametres' ? 'bg-blue-700' : ''}`}
  >
    <Settings size={24} />
  </button>
</div>
      <div className="flex-1 p-3 md:p-8 pb-20 md:pb-8 overflow-y-auto overflow-x-hidden">
        {renderPage()}
      </div>
    </div>
  );
}
