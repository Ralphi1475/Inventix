// /src/lib/api.ts
import { Article, Contact, Mouvement, Parametres, FactureResume, Categorie } from '@/types';
import { supabase } from './supabase';

// ============================================================================
// FONCTIONS DE CONVERSION ENTRE camelCase ET snake_case
// ============================================================================

const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};

const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};

// ============================================================================
// CHARGEMENT DES DONNÉES
// ============================================================================

export const chargerDonnees = async (forceRefresh: boolean = false) => {
  console.log('📡 Chargement des données depuis Supabase...');
  const startTime = Date.now();

  try {
    // Chargement parallèle de toutes les données
    const [
      { data: articlesRaw, error: articlesError },
      { data: contactsRaw, error: contactsError },
      { data: achatsRaw, error: achatsError },
      { data: mouvementsRaw, error: mouvementsError },
      { data: facturesRaw, error: facturesError },
      { data: parametresRaw, error: parametresError },
      { data: categoriesRaw, error: categoriesError }
    ] = await Promise.all([
      supabase.from('articles').select('*').order('nom'),
      supabase.from('contacts').select('*').order('societe'),
      supabase.from('achats').select('*').order('date_achat', { ascending: false }),
      supabase.from('mouvements').select('*').order('date', { ascending: false }),
      supabase.from('factures').select('*').order('date', { ascending: false }),
      supabase.from('parametres').select('*'),
      supabase.from('categories').select('*').order('denomination')
    ]);

    // Gestion des erreurs
    if (articlesError) throw articlesError;
    if (contactsError) throw contactsError;
    if (achatsError) throw achatsError;
    if (mouvementsError) throw mouvementsError;
    if (facturesError) throw facturesError;
    if (parametresError) throw parametresError;
    if (categoriesError) throw categoriesError;

    // Conversion en camelCase et typage
    const articles: Article[] = articlesRaw ? articlesRaw.map(article => ({
      ...toCamelCase(article),
      prixVenteHT: article.prix_achat * (1 + (article.marge_percent || 0) / 100),
      prixVenteTTC: article.prix_achat * (1 + (article.marge_percent || 0) / 100) * (1 + (article.taux_tva || 0) / 100)
    })) : [];

    const contacts: Contact[] = contactsRaw ? toCamelCase(contactsRaw) : [];
    const clients = contacts.filter(c => c.type === 'client');
    const fournisseurs = contacts.filter(c => c.type === 'fournisseur');

    const achats = achatsRaw ? toCamelCase(achatsRaw) : [];
    const mouvements: Mouvement[] = mouvementsRaw ? toCamelCase(mouvementsRaw) : [];
    const factures: FactureResume[] = facturesRaw ? toCamelCase(facturesRaw) : [];
    
    // Conversion des paramètres en objet
    const parametres: Parametres = parametresRaw ? parametresRaw.reduce((acc, param) => {
      acc[param.cle as keyof Parametres] = param.valeur || '';
      return acc;
    }, {} as Parametres) : {} as Parametres;

    const categories: Categorie[] = categoriesRaw ? toCamelCase(categoriesRaw) : [];

    const loadTime = Date.now() - startTime;
    console.log(`✅ Données chargées depuis Supabase en ${loadTime}ms`);

    return {
      articles,
      clients,
      fournisseurs,
      achats,
      mouvements,
      factures,
      parametres,
      categories
    };
  } catch (error) {
    console.error('❌ Erreur chargement données:', error);
    throw error;
  }
};

// ============================================================================
// ARTICLES
// ============================================================================

export const sauvegarderArticle = async (article: Article, isUpdate: boolean = false) => {
  try {
    const articleData = toSnakeCase({
      id: article.id,
      numero: article.numero,
      categorie: article.categorie,
      nom: article.nom,
      description: article.description,
      image: article.image,
      prixAchat: article.prixAchat,
      margePercent: article.margePercent,
      tauxTva: article.tauxTVA,
      stock: article.stock,
      emplacement: article.emplacement,
      unite: article.unite,
      conditionnement: article.conditionnement
    });

    if (isUpdate) {
      const { error } = await supabase
        .from('articles')
        .update(articleData)
        .eq('id', article.id);
      
      if (error) throw error;
      console.log('✅ Article modifié:', article.nom);
    } else {
      const { error } = await supabase
        .from('articles')
        .insert([articleData]);
      
      if (error) throw error;
      console.log('✅ Article créé:', article.nom);
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Erreur sauvegarde article:', error);
    throw error;
  }
};

export const supprimerArticle = async (id: string) => {
  try {
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    console.log('✅ Article supprimé:', id);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur suppression article:', error);
    throw error;
  }
};

// ============================================================================
// CONTACTS (Clients & Fournisseurs)
// ============================================================================

export const sauvegarderContact = async (contact: Contact, isUpdate: boolean = false) => {
  try {
    const contactData = toSnakeCase(contact);

    if (isUpdate) {
      const { error } = await supabase
        .from('contacts')
        .update(contactData)
        .eq('id', contact.id);
      
      if (error) throw error;
      console.log('✅ Contact modifié:', contact.societe);
    } else {
      const { error } = await supabase
        .from('contacts')
        .insert([contactData]);
      
      if (error) throw error;
      console.log('✅ Contact créé:', contact.societe);
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Erreur sauvegarde contact:', error);
    throw error;
  }
};

export const supprimerContact = async (id: string) => {
  try {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    console.log('✅ Contact supprimé:', id);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur suppression contact:', error);
    throw error;
  }
};

// ============================================================================
// MOUVEMENTS
// ============================================================================

export const sauvegarderMouvement = async (mouvement: Mouvement) => {
  try {
    const mouvementData = toSnakeCase(mouvement);

    const { error } = await supabase
      .from('mouvements')
      .insert([mouvementData]);
    
    if (error) throw error;
    console.log('✅ Mouvement enregistré');
    return true;
  } catch (error) {
    console.error('❌ Erreur sauvegarde mouvement:', error);
    throw error;
  }
};

// Alias pour compatibilité avec l'ancien code
export const enregistrerMouvement = sauvegarderMouvement;

export const supprimerMouvement = async (mouvementId: string) => {
  try {
    const { error } = await supabase
      .from('mouvements')
      .delete()
      .eq('id', mouvementId);
    
    if (error) throw error;
    console.log('✅ Mouvement supprimé:', mouvementId);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur suppression mouvement:', error);
    throw error;
  }
};

// ============================================================================
// FACTURES
// ============================================================================

export const sauvegarderFacture = async (facture: any) => {
  try {
    const factureData = toSnakeCase({
      id: facture.id || String(Date.now()),
      reference: facture.reference,
      date: facture.date,
      client: facture.client,
      modePaiement: facture.modePaiement,
      montant: facture.montant,
      emplacement: facture.emplacement || '',
      commentaire: facture.commentaire || ''
    });

    const { error } = await supabase
      .from('factures')
      .insert([factureData]);
    
    if (error) throw error;
    console.log('✅ Facture sauvegardée:', facture.reference);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur sauvegarde facture:', error);
    throw error;
  }
};

export const supprimerFacture = async (factureId: string) => {
  try {
    const { error } = await supabase
      .from('factures')
      .delete()
      .eq('id', factureId);
    
    if (error) throw error;
    console.log('✅ Facture supprimée:', factureId);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur suppression facture:', error);
    throw error;
  }
};

// ============================================================================
// ACHATS
// ============================================================================

export const sauvegarderAchat = async (achat: any, fournisseurs: Contact[]) => {
  try {
    const fournisseur = fournisseurs.find((f: Contact) => f.id === achat.fournisseurId);
    const nomFournisseur = fournisseur?.societe || '';
    
    const achatData = toSnakeCase({
      id: achat.id,
      reference: achat.reference,
      dateAchat: achat.date_achat,
      dateEcheance: achat.date_echeance || '',
      datePaiement: achat.date_paiement || '',
      fournisseurId: achat.fournisseurId,
      modePaiement: achat.modePaiement,
      montantHtva: achat.montantHTVA,
      montantTtc: achat.montantTTC,
      description: achat.description || '',
      categorie: achat.categorie,
      nomFournisseur: nomFournisseur
    });

    const { error } = await supabase
      .from('achats')
      .insert([achatData]);
    
    if (error) throw error;
    console.log('✅ Achat sauvegardé:', achat.reference);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur sauvegarde achat:', error);
    throw error;
  }
};

export const modifierAchat = async (achat: any, fournisseurs: Contact[]) => {
  try {
    const fournisseur = fournisseurs.find((f: Contact) => f.id === achat.fournisseurId);
    const nomFournisseur = fournisseur?.societe || '';
    
    const achatData = toSnakeCase({
      reference: achat.reference,
      dateAchat: achat.date_achat,
      dateEcheance: achat.date_echeance || '',
      datePaiement: achat.date_paiement || '',
      fournisseurId: achat.fournisseurId,
      modePaiement: achat.modePaiement,
      montantHtva: achat.montantHTVA,
      montantTtc: achat.montantTTC,
      description: achat.description || '',
      categorie: achat.categorie,
      nomFournisseur: nomFournisseur
    });

    const { error } = await supabase
      .from('achats')
      .update(achatData)
      .eq('id', achat.id);
    
    if (error) throw error;
    console.log('✅ Achat modifié:', achat.reference);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur modification achat:', error);
    throw error;
  }
};

export const supprimerAchat = async (id: string) => {
  try {
    const { error } = await supabase
      .from('achats')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    console.log('✅ Achat supprimé:', id);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur suppression achat:', error);
    throw error;
  }
};

// ============================================================================
// PARAMÈTRES
// ============================================================================

export const sauvegarderParametres = async (params: Parametres) => {
  try {
    const updates = Object.entries(params).map(([cle, valeur]) => ({
      cle,
      valeur: valeur || ''
    }));

    const { error } = await supabase
      .from('parametres')
      .upsert(updates, { onConflict: 'cle' });
    
    if (error) throw error;
    console.log('✅ Paramètres sauvegardés');
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur sauvegarde paramètres:', error);
    throw error;
  }
};

// ============================================================================
// CATÉGORIES
// ============================================================================

export async function chargerCategories(): Promise<Categorie[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('denomination');
    
    if (error) throw error;
    
    return data ? toCamelCase(data) : [];
  } catch (error) {
    console.error('❌ Erreur chargement catégories:', error);
    throw error;
  }
}

export async function sauvegarderCategorie(categorie: Categorie, isUpdate: boolean = false): Promise<void> {
  try {
    const categorieData = toSnakeCase(categorie);

    if (isUpdate) {
      const { error } = await supabase
        .from('categories')
        .update(categorieData)
        .eq('id', categorie.id);
      
      if (error) throw error;
      console.log('✅ Catégorie modifiée:', categorie.denomination);
    } else {
      const { error } = await supabase
        .from('categories')
        .insert([categorieData]);
      
      if (error) throw error;
      console.log('✅ Catégorie créée:', categorie.denomination);
    }
  } catch (error) {
    console.error('❌ Erreur sauvegarde catégorie:', error);
    throw error;
  }
}

export async function supprimerCategorie(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    console.log('✅ Catégorie supprimée:', id);
  } catch (error) {
    console.error('❌ Erreur suppression catégorie:', error);
    throw error;
  }
}

// ============================================================================
// UPLOAD D'IMAGES
// ============================================================================

export const uploadImage = async (file: File): Promise<string> => {
  try {
    console.log('📤 Upload image:', file.name, file.size, 'bytes');
    
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur upload');
    }

    const result = await response.json();

    if (result.success) {
      console.log('✅ Image uploadée:', result.url);
      return result.url;
    } else {
      throw new Error(result.error || 'Erreur upload');
    }
  } catch (error) {
    console.error('❌ Erreur uploadImage:', error);
    throw error;
  }
};

// ============================================================================
// FONCTIONS UTILITAIRES (compatibilité)
// ============================================================================

// Ces fonctions ne sont plus nécessaires avec Supabase mais sont gardées pour compatibilité
export const clearCache = (): void => {
  console.log('ℹ️ Cache non utilisé avec Supabase');
};

const invalidateCache = (): void => {
  // Non nécessaire avec Supabase
};
