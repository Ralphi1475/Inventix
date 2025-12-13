// ============================================================================
// API Functions - Chargement des données depuis Supabase
// Fichier: src/lib/api-supabase.ts
// ============================================================================

import { supabase } from './supabase';
import type { Article, Contact, Mouvement, FactureResume, Parametres, Categorie } from '@/types';

/**
 * Récupérer l'organization_id depuis le localStorage
 */
function getCurrentOrganizationId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('current_organization_id');
}

/**
 * Récupérer l'email de l'utilisateur depuis le localStorage
 */
function getCurrentUserEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('user_email');
}

/**
 * Charger TOUTES les données depuis Supabase
 */
export async function chargerDonneesSupabase() {
  console.log('🔄 Chargement des données depuis Supabase...');
  const startTime = performance.now();

  try {
    const organizationId = getCurrentOrganizationId();
    const userEmail = getCurrentUserEmail();

    if (!organizationId) {
      console.warn('⚠️ Aucune organisation sélectionnée');
      return {
        articles: [],
        clients: [],
        fournisseurs: [],
        mouvements: [],
        factures: [],
        achats: [],
        parametres: {
          societe_nom: '',
          societe_adresse: '',
          societe_code_postal: '',
          societe_ville: '',
          societe_pays: 'Belgique',
          societe_telephone: '',
          societe_email: '',
          societe_tva: '',
          societe_iban: ''
        }
      };
    }

    console.log('📊 Organization ID:', organizationId);

    // Charger toutes les données en parallèle
    const [
      articlesResult,
      contactsResult,
      mouvementsResult,
      facturesResult,
      achatsResult,
      parametresResult
    ] = await Promise.all([
      supabase.from('articles').select('*').eq('organization_id', organizationId),
      supabase.from('contacts').select('*').eq('organization_id', organizationId),
      supabase.from('mouvements').select('*').eq('organization_id', organizationId),
      supabase.from('factures').select('*').eq('organization_id', organizationId),
      supabase.from('achats').select('*').eq('organization_id', organizationId),
      supabase.from('parametres').select('*').eq('organization_id', organizationId).limit(1)
    ]);

    // Vérifier les erreurs
    if (articlesResult.error) console.error('❌ Erreur articles:', articlesResult.error);
    if (contactsResult.error) console.error('❌ Erreur contacts:', contactsResult.error);
    if (mouvementsResult.error) console.error('❌ Erreur mouvements:', mouvementsResult.error);
    if (facturesResult.error) console.error('❌ Erreur factures:', facturesResult.error);
    if (achatsResult.error) console.error('❌ Erreur achats:', achatsResult.error);
    if (parametresResult.error) console.error('❌ Erreur paramètres:', parametresResult.error);

    // Convertir les données Supabase vers le format de l'app
    const articles = (articlesResult.data || []).map(mapArticle);
    const contacts = (contactsResult.data || []).map(mapContact);
    const clients = contacts.filter(c => c.type === 'client');
    const fournisseurs = contacts.filter(c => c.type === 'fournisseur');
    const mouvements = (mouvementsResult.data || []).map(mapMouvement);
    const factures = (facturesResult.data || []).map(mapFacture);
    const achats = achatsResult.data || [];
    
    const parametresData = parametresResult.data?.[0];
    const parametres: Parametres = {
      societe_nom: parametresData?.societe_nom || '',
      societe_adresse: parametresData?.societe_adresse || '',
      societe_code_postal: parametresData?.societe_code_postal || '',
      societe_ville: parametresData?.societe_ville || '',
      societe_pays: parametresData?.societe_pays || 'Belgique',
      societe_telephone: parametresData?.societe_telephone || '',
      societe_email: parametresData?.societe_email || '',
      societe_tva: parametresData?.societe_tva || '',
      societe_iban: parametresData?.societe_iban || ''
    };

    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`✅ Données Supabase chargées en ${duration}s:`);
    console.log(`   - ${articles.length} articles`);
    console.log(`   - ${clients.length} clients`);
    console.log(`   - ${fournisseurs.length} fournisseurs`);
    console.log(`   - ${mouvements.length} mouvements`);
    console.log(`   - ${factures.length} factures`);
    console.log(`   - ${achats.length} achats`);

    return {
      articles,
      clients,
      fournisseurs,
      mouvements,
      factures,
      achats,
      parametres
    };

  } catch (error) {
    console.error('❌ Erreur chargement Supabase:', error);
    throw error;
  }
}

/**
 * Charger les catégories depuis Supabase
 */
export async function chargerCategoriesSupabase(): Promise<Categorie[]> {
  try {
    const organizationId = getCurrentOrganizationId();
    
    if (!organizationId) {
      console.warn('⚠️ Aucune organisation sélectionnée pour les catégories');
      return [];
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('organization_id', organizationId);

    if (error) {
      console.error('❌ Erreur chargement catégories:', error);
      return [];
    }

    return (data || []).map(cat => ({
      id: cat.id,
      denomination: cat.denomination,
      type: cat.type || 'produit'
    }));

  } catch (error) {
    console.error('❌ Erreur:', error);
    return [];
  }
}

// ============================================================================
// Fonctions de mapping Supabase → Format App
// ============================================================================

function mapArticle(row: any): Article {
  return {
    id: row.id,
    numero: row.numero || '',
    categorie: row.categorie || '',
    nom: row.nom,
    description: row.description || '',
    image: row.image || '',
    prixAchat: parseFloat(row.prix_achat) || 0,
    margePercent: parseFloat(row.marge_percent) || 0,
    tauxTva: parseFloat(row.taux_tva) || 21,
    stock: parseInt(row.stock) || 0,
    emplacement: row.emplacement || '',
    unite: row.unite || 'Pièce',
    conditionnement: row.conditionnement || ''
  };
}

function mapContact(row: any): Contact {
  return {
    id: row.id,
    type: row.type,
    societe: row.societe || '',
    nom: row.nom || '',
    prenom: row.prenom || '',
    adresse: row.adresse || '',
    codePostal: row.code_postal || '',
    ville: row.ville || '',
    pays: row.pays || 'Belgique',
    mobile: row.mobile || '',
    numeroTVA: row.numero_tva || '',
    numeroCompte: row.numero_compte || '',
    email: row.email || ''
  };
}

function mapMouvement(row: any): Mouvement {
  return {
    id: row.id,
    date: row.date,
    type: row.type,
    articleId: row.article_id || '',
    quantite: parseFloat(row.quantite) || 0,
    clientId: row.client_id || '',
    fournisseurId: row.fournisseur_id || '',
    reference: row.reference || '',
    modePaiement: row.mode_paiement || '',
    nomArticle: row.nom_article || '',
    prixUnitaire: parseFloat(row.prix_unitaire) || 0,
    emplacement: row.emplacement || '',
    nomClient: row.nom_client || '',
    commentaire: row.commentaire || ''
  };
}

function mapFacture(row: any): FactureResume {
  return {
    id: row.id,
    reference: row.reference,
    date: row.date,
    client: row.client || '',
    modePaiement: row.mode_paiement || '',
    montant: parseFloat(row.montant) || 0,
    emplacement: row.emplacement || '',
    commentaire: row.commentaire || ''
  };
}