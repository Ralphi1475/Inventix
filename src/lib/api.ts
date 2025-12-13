// /src/lib/api.ts
import type {
  AuthorizedUser,
  CreateAuthorizedUserRequest,
  UpdateAuthorizedUserRequest,
  AuthorizedUserResponse,
  AuthorizedUsersListResponse,
} from '@/types/authorized-users';
import { Article, Contact, Mouvement, Parametres, FactureResume, Categorie } from '@/types';
import { supabase, getCurrentUserEmail } from './supabase';

// ============================================================================
// FONCTIONS DE CONVERSION ENTRE camelCase ET snake_case
// ============================================================================

const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      // ✅ Gestion correcte des acronymes comme TVA, IBAN, etc.
      const snakeKey = key
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2') // TVANumero -> TVA_Numero
        .replace(/([a-z\d])([A-Z])/g, '$1_$2')     // numeroTVA -> numero_TVA
        .toLowerCase();                             // numero_TVA -> numero_tva
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
// CHARGEMENT DES DONNÉES (filtré par utilisateur)
// ============================================================================

function getCurrentOrganizationId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('current_organization_id');
}

export const chargerDonnees = async () => {
  console.log('🔄 Chargement des données depuis Supabase...');
  const startTime = performance.now();

  try {
    const organizationId = getCurrentOrganizationId();

    if (!organizationId) {
      console.warn('⚠️ Aucune organisation sélectionnée');
      return {
        articles: [],
        clients: [],
        fournisseurs: [],
        mouvements: [],
        factures: [],
        achats: [],
        categories: [],
        parametres: {
          societeNom: '',
          societeAdresse: '',
          societeCodePostal: '',
          societeVille: '',
          societePays: 'Belgique',
          societeTelephone: '',
          societeEmail: '',
          societeTva: '',
          societeIban: ''
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
      categoriesResult,
      parametresResult
    ] = await Promise.all([
      supabase.from('articles').select('*').eq('organization_id', organizationId),
      supabase.from('contacts').select('*').eq('organization_id', organizationId),
      supabase.from('mouvements').select('*').eq('organization_id', organizationId),
      supabase.from('factures').select('*').eq('organization_id', organizationId),
      supabase.from('achats').select('*').eq('organization_id', organizationId),
      supabase.from('categories').select('*').eq('organization_id', organizationId),
      supabase.from('parametres').select('*').eq('organization_id', organizationId).limit(1)
    ]);

    // Vérifier les erreurs
    if (articlesResult.error) console.error('❌ Erreur articles:', articlesResult.error);
    if (contactsResult.error) console.error('❌ Erreur contacts:', contactsResult.error);
    if (mouvementsResult.error) console.error('❌ Erreur mouvements:', mouvementsResult.error);
    if (facturesResult.error) console.error('❌ Erreur factures:', facturesResult.error);
    if (achatsResult.error) console.error('❌ Erreur achats:', achatsResult.error);
    if (categoriesResult.error) console.error('❌ Erreur catégories:', categoriesResult.error);
    if (parametresResult.error) console.error('❌ Erreur paramètres:', parametresResult.error);

    // Convertir les données
    const articles: Article[] = (articlesResult.data || []).map(article => ({
      ...toCamelCase(article),
      prixVenteHT: article.prix_achat * (1 + (article.marge_percent || 0) / 100),
      prixVenteTTC: article.prix_achat * (1 + (article.marge_percent || 0) / 100) * (1 + (article.taux_tva || 0) / 100)
    }));

    const contacts: Contact[] = (contactsResult.data || []).map(toCamelCase);
    const clients = contacts.filter(contact => contact.type === 'client');
    const fournisseurs = contacts.filter(contact => contact.type === 'fournisseur');
    const mouvements: Mouvement[] = (mouvementsResult.data || []).map(toCamelCase);
    const factures = (facturesResult.data || []).map(toCamelCase);
    
    const achats = (achatsResult.data || []).map(achat => {
      const achatConverted = toCamelCase(achat);
      const fournisseur = contacts.find(c => c.id === achatConverted.fournisseurId);
      return {
        ...achatConverted,
        nomFournisseur: fournisseur?.societe || 'Non défini'
      };
    });

    const categories = (categoriesResult.data || []).map(toCamelCase);
    
    const parametresData = parametresResult.data?.[0];
    const parametres = parametresData ? toCamelCase(parametresData) : {
      societeNom: '',
      societeAdresse: '',
      societeCodePostal: '',
      societeVille: '',
      societePays: 'Belgique',
      societeTelephone: '',
      societeEmail: '',
      societeTva: '',
      societeIban: ''
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
      categories,
      parametres
    };

  } catch (error) {
    console.error('❌ Erreur chargement Supabase:', error);
    throw error;
  }
};

export const chargerCategories = async (): Promise<Categorie[]> => {
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

    return (data || []).map(cat => toCamelCase(cat));

  } catch (error) {
    console.error('❌ Erreur:', error);
    return [];
  }
};
// ============================================================================
// ARTICLES
// ============================================================================

export const sauvegarderArticle = async (article: Article, isUpdate: boolean = false) => {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const articleData = toSnakeCase({
      id: article.id,
      numero: article.numero,
      categorie: article.categorie,
      nom: article.nom,
      description: article.description,
      image: article.image,
      prixAchat: article.prixAchat,
      margePercent: article.margePercent,
      tauxTva: article.tauxTva,
      stock: article.stock,
      emplacement: article.emplacement,
      unite: article.unite,
      conditionnement: article.conditionnement,
      userEmail: userEmail  // ✅ Ajout automatique de l'email
    });

    if (isUpdate) {
      const { error } = await supabase
        .from('articles')
        .update(articleData)
        .eq('id', article.id)
        .eq('user_email', userEmail);  // ✅ Sécurité supplémentaire
      
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
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id)
      .eq('user_email', userEmail);  // ✅ Ne peut supprimer que ses propres articles
    
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
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const contactData = toSnakeCase({
      ...contact,
      userEmail: userEmail  // ✅ Ajout automatique de l'email
    });

    if (isUpdate) {
      const { error } = await supabase
        .from('contacts')
        .update(contactData)
        .eq('id', contact.id)
        .eq('user_email', userEmail);
      
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
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('user_email', userEmail);
    
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

export const enregistrerMouvement = async (mouvement: Mouvement, articles: Article[]) => {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    // ✅ Générer un ID unique si non fourni
    const mouvementId = mouvement.id || `mvt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Trouver l'article pour récupérer son nom
    const article = articles.find(a => a.id === mouvement.articleId);
    
    const mouvementData = toSnakeCase({
      id: mouvementId,
      date: mouvement.date,
      type: mouvement.type,
      articleId: mouvement.articleId,
      quantite: mouvement.quantite,
      clientId: mouvement.clientId || null,
      fournisseurId: mouvement.fournisseurId || null,
      reference: mouvement.reference,
      modePaiement: mouvement.modePaiement || null,
      nomArticle: article?.nom || '',
      prixUnitaire: mouvement.prixUnitaire || 0,
      emplacement: mouvement.emplacement || '',
      nomClient: mouvement.nomClient || '',
      commentaire: mouvement.commentaire || '',
      userEmail: userEmail
    });

    const { error } = await supabase
      .from('mouvements')
      .insert([mouvementData]);
    
    if (error) throw error;
    
    console.log('✅ Mouvement enregistré:', mouvementId);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur sauvegarde mouvement:', error);
    throw error;
  }
};

export const supprimerMouvement = async (id: string) => {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const { error } = await supabase
      .from('mouvements')
      .delete()
      .eq('id', id)
      .eq('user_email', userEmail);
    
    if (error) throw error;
    console.log('✅ Mouvement supprimé:', id);
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
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const factureData = toSnakeCase({
      id: facture.id || String(Date.now()),
      reference: facture.reference,
      date: facture.date,
      client: facture.client,
      modePaiement: facture.modePaiement,
      montant: facture.montant,
      emplacement: facture.emplacement || '',
      commentaire: facture.commentaire || '',
      userEmail: userEmail  // ✅ Ajout automatique de l'email
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
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const { error } = await supabase
      .from('factures')
      .delete()
      .eq('id', factureId)
      .eq('user_email', userEmail);
    
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
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

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
      nomFournisseur: nomFournisseur,
      userEmail: userEmail  // ✅ Ajout automatique de l'email
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
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

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
      .eq('id', achat.id)
      .eq('user_email', userEmail);
    
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
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const { error } = await supabase
      .from('achats')
      .delete()
      .eq('id', id)
      .eq('user_email', userEmail);
    
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
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const parametresData = toSnakeCase({
      ...params,
      userEmail: userEmail
    });

    // Upsert basé sur user_email (une seule ligne par utilisateur)
    const { error } = await supabase
      .from('parametres')
      .upsert([parametresData], { onConflict: 'user_email' });
    
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

export async function chargerCategories(type?: 'produit' | 'achat'): Promise<Categorie[]> {
  try {
	const { data: { session } } = await supabase.auth.getSession();
	const userEmail = session?.user?.email;
	if (!userEmail) throw new Error('Utilisateur non connecté');

    let query = supabase
      .from('categories')
      .select('*')
      .eq('user_email', userEmail);

    // ✅ N'ajoute le filtre que si `type` est spécifié
    if (type) {
      query = query.eq('type', type);
    }

    query = query.order('denomination');
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data ? toCamelCase(data) : [];
  } catch (error) {
    console.error(`❌ Erreur chargement catégories${type ? ` (${type})` : ''}:`, error);
    throw error;
  }
}

export async function sauvegarderCategorie(categorie: Categorie, isUpdate: boolean = false): Promise<void> {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const categorieData = toSnakeCase({
      ...categorie,
      userEmail: userEmail  // ✅ Ajout automatique de l'email
    });

    if (isUpdate) {
      const { error } = await supabase
        .from('categories')
        .update(categorieData)
        .eq('id', categorie.id)
        .eq('user_email', userEmail);
      
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
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_email', userEmail);
    
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
// ============================================================================
// GESTION DES UTILISATEURS AUTORISÉS - PARTAGE D'ACCÈS
// ============================================================================

/**
 * Récupère tous les emails qui ont accès aux données de l'utilisateur courant
 * (l'utilisateur lui-même + tous les utilisateurs qu'il a autorisés)
 */
export async function getAllAccessibleEmails(): Promise<string[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userEmail = session?.user?.email;
    if (!userEmail) return [];

    const { data, error } = await supabase
      .from('authorized_users')
      .select('authorized_email')
      .eq('owner_email', userEmail);

    if (error) {
      console.error('❌ Erreur lors de la récupération des emails autorisés:', error);
      return [userEmail];
    }

    const authorizedEmails = data?.map((row) => row.authorized_email) || [];
    const allEmails = [userEmail, ...authorizedEmails];
    
    console.log('📧 Emails accessibles:', allEmails);
    return allEmails;
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
    const userEmail = getCurrentUserEmail();
    return userEmail ? [userEmail] : [];
  }
}

/**
 * Récupère tous les emails des propriétaires de données auxquels l'utilisateur courant a accès
 * (l'utilisateur lui-même + tous les propriétaires qui l'ont autorisé)
 */
export async function getAllAccessibleOwnerEmails(userEmail: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('authorized_users')
      .select('owner_email')
      .eq('authorized_email', userEmail);

    if (error) {
      console.error('❌ Erreur lors de la récupération des propriétaires:', error);
      return [userEmail];
    }

    const ownerEmails = data?.map((row) => row.owner_email) || [];
    const allEmails = [userEmail, ...ownerEmails];
    
    console.log('👥 Propriétaires accessibles:', allEmails);
    return allEmails;
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
    return [userEmail];
  }
}

/**
 * Lister les utilisateurs autorisés
 */
export async function getAuthorizedUsers(userEmail: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('authorized_users')
      .select('*')
      .eq('owner_email', userEmail)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: 'Erreur lors de la récupération des utilisateurs' };
  }
}

/**
 * Ajouter un utilisateur autorisé
 */
export async function addAuthorizedUser(
  userEmail: string,
  request: { authorized_email: string; access_level: 'read' | 'write' }
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    // Validation
    if (!request.authorized_email || !request.authorized_email.includes('@')) {
      return { success: false, error: 'Email invalide' };
    }

    if (request.authorized_email.toLowerCase() === userEmail.toLowerCase()) {
      return { success: false, error: 'Vous ne pouvez pas vous autoriser vous-même' };
    }

    if (!['read', 'write'].includes(request.access_level)) {
      return { success: false, error: "Niveau d'accès invalide" };
    }

    // Insertion
    const { data, error } = await supabase
      .from('authorized_users')
      .insert({
        owner_email: userEmail,
        authorized_email: request.authorized_email.toLowerCase(),
        access_level: request.access_level,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Cet utilisateur est déjà autorisé' };
      }
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Erreur lors de l'ajout de l'utilisateur" };
  }
}

/**
 * Modifier le niveau d'accès
 */
export async function updateAuthorizedUser(
  userEmail: string,
  request: { id: string; access_level: 'read' | 'write' }
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    if (!['read', 'write'].includes(request.access_level)) {
      return { success: false, error: "Niveau d'accès invalide" };
    }

    const { data, error } = await supabase
      .from('authorized_users')
      .update({
        access_level: request.access_level,
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.id)
      .eq('owner_email', userEmail)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Erreur lors de la modification' };
  }
}

/**
 * Supprimer un utilisateur autorisé
 */
export async function deleteAuthorizedUser(
  userEmail: string,
  authorizedUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('authorized_users')
      .delete()
      .eq('id', authorizedUserId)
      .eq('owner_email', userEmail);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Erreur lors de la suppression' };
  }
}

/**
 * Vérifier le niveau d'accès d'un utilisateur
 */
export async function checkUserAccess(
  ownerEmail: string,
  authorizedEmail: string
): Promise<'none' | 'read' | 'write'> {
  try {
    if (ownerEmail.toLowerCase() === authorizedEmail.toLowerCase()) {
      return 'write';
    }

    const { data, error } = await supabase
      .from('authorized_users')
      .select('access_level')
      .eq('owner_email', ownerEmail)
      .eq('authorized_email', authorizedEmail)
      .single();

    if (error || !data) {
      return 'none';
    }

    return data.access_level;
  } catch (error) {
    return 'none';
  }
}
export {
  getUserOrganizations,
  createOrganization,
  updateOrganization,
  addUserToOrganization,
  updateUserOrganizationAccess,
  removeUserFromOrganization,
  getOrganizationUsers,
} from './api-organizations';