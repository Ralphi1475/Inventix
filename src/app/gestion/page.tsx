'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  chargerDonnees,
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
  supprimerMouvement
} from '@/lib/api';
import { 
  calculerArticlesAvecPrix, 
  calculerStats 
} from '@/lib/calculations';
import { 
  Article, 
  Contact, 
  Mouvement, 
  Parametres, 
  FactureResume 
} from '@/types';

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
import { Categorie } from '@/types';
import { chargerCategories,sauvegarderCategorie,supprimerCategorie
} from '@/lib/api';

// Icônes
import { Plus, Package, Users, TrendingUp, ShoppingCart, FileText, BarChart3, Settings, Search, Edit2, Trash2, Minus, X } from 'lucide-react';

export default function GestionApp() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [clients, setClients] = useState<Contact[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Contact[]>([]);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [factures, setFactures] = useState<FactureResume[]>([]);
  const [achats, setAchats] = useState<any[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [parametres, setParametres] = useState<Parametres>({
    societe_nom: '',
    societe_adresse: '',
    societe_code_postal: '',
    societe_ville: '',
    societe_pays: 'Belgique',
    societe_telephone: '',
    societe_email: '',
    societe_tva: '',
    societe_iban: ''
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await chargerDonnees();
        const cats = await chargerCategories();
        setArticles(data.articles);
        setClients(data.clients);
        setFournisseurs(data.fournisseurs);
        setMouvements(data.mouvements);
        setFactures(data.factures);
        setAchats(data.achats);
        setParametres(data.parametres);
        setCategories(cats);
      } catch (err) {
        console.error('❌ Erreur chargement:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const articlesAvecPrix = useMemo(() => {
    return calculerArticlesAvecPrix(articles);
  }, [articles]);

  const stats = useMemo(() => {
    return calculerStats(articles, articlesAvecPrix, mouvements, clients);
  }, [articles, articlesAvecPrix, mouvements, clients]);

  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard':
        return <Dashboard stats={stats} mouvements={mouvements} articles={articlesAvecPrix} clients={clients} fournisseurs={fournisseurs} achats={achats} />;
      case 'articles':
        return <Articles articles={articlesAvecPrix} categories={categories} setArticles={setArticles} onSave={sauvegarderArticle} onDelete={supprimerArticle} onRefresh={rechargerDonnees} />;
      case 'clients':
        return <Clients contacts={clients} setClients={setClients} onSave={sauvegarderContact} onDelete={supprimerContact} />;
      case 'fournisseurs':
        return <Fournisseurs contacts={fournisseurs} setFournisseurs={setFournisseurs} onSave={sauvegarderContact} onDelete={supprimerContact} />;
      case 'vente-client':
        return <VenteClient 
          articles={articlesAvecPrix} 
          clients={clients} 
          onVente={enregistrerMouvement} 
          setArticles={setArticles} 
          onSaveArticle={sauvegarderArticle} 
          sauvegarderFacture={sauvegarderFacture}
          parametres={parametres} 
        />;
      case 'vente-comptoir':
        return <VenteComptoir 
          articles={articlesAvecPrix} 
          clients={clients} 
          onVente={enregistrerMouvement} 
          setArticles={setArticles} 
          onSaveArticle={sauvegarderArticle} 
          sauvegarderFacture={sauvegarderFacture}
        />;
      case 'entrees':
        return <EntreesStock 
          articles={articlesAvecPrix} 
          fournisseurs={fournisseurs} 
          onEntree={enregistrerMouvement} 
          setArticles={setArticles} 
          onSaveArticle={sauvegarderArticle} 
        />;
	  case 'factures':
	  return (
		  <Factures 
		  factures={factures} 
		  mouvements={mouvements} 
		  articles={articlesAvecPrix} 
		  clients={clients} 
		  parametres={parametres}
		  onDeleteFacture={supprimerFacture}
		  onDeleteMouvement={supprimerMouvement}
		  onUpdateArticle={(article) => sauvegarderArticle(article, 'update')}
		  onRefresh={rechargerDonnees}
		  />
	  );
      case 'achats':
        return <Achats 
          achats={achats} 
          fournisseurs={fournisseurs} 
          sauvegarderAchat={sauvegarderAchat} 
          modifierAchat={modifierAchat} 
          supprimerAchat={supprimerAchat} 
        />;
      case 'categories':
        return <Categories 
          categories={categories} 
          setCategories={setCategories} 
          onSave={(cat, isUpdate) => sauvegarderCategorie(cat, isUpdate)}
          onDelete={supprimerCategorie} 
        />;
      case 'parametres':
        return <ParametresSociete parametres={parametres} onSave={sauvegarderParametres} />;
      default:
        return <Dashboard stats={stats} mouvements={mouvements} articles={articlesAvecPrix} clients={clients} fournisseurs={fournisseurs} achats={achats} />;
    }
  };

  const rechargerDonnees = async () => {
    try {
      const data = await chargerDonnees();
      const cats = await chargerCategories();
      setArticles(data.articles);
      setClients(data.clients);
      setFournisseurs(data.fournisseurs);
      setMouvements(data.mouvements);
      setFactures(data.factures);
      setAchats(data.achats);
      setParametres(data.parametres);
      setCategories(cats);
    } catch (err) {
      console.error('❌ Erreur rechargement:', err);
      throw err;
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
    <div className="min-h-screen bg-gray-50 flex">
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-blue-900 text-white flex justify-around p-2 z-50">
        <button onClick={() => setCurrentPage('dashboard')} className="p-2"><BarChart3 size={24} /></button>
        <button onClick={() => setCurrentPage('articles')} className="p-2"><Package size={24} /></button>
        <button onClick={() => setCurrentPage('vente-comptoir')} className="p-2"><ShoppingCart size={24} /></button>
        <button onClick={() => setCurrentPage('clients')} className="p-2"><Users size={24} /></button>
        <button onClick={() => setCurrentPage('factures')} className="p-2"><FileText size={24} /></button>
      </div>
      <div className="flex-1 p-4 md:p-8 mb-16 md:mb-0 overflow-auto">
        {renderPage()}
      </div>
    </div>
  );
}