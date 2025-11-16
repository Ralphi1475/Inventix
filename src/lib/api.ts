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

export const chargerDonnees = async () => {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    console.log('📡 Chargement des données depuis Supabase...');
    console.log('👤 Chargement des données pour:', userEmail);
    
    const startTime = Date.now();

    // ✅ NOUVEAU : Récupérer tous les emails accessibles (mes données + celles partagées)
    const accessibleEmails = await getAllAccessibleEmails();
    console.log('📧 Données accessibles pour:', accessibleEmails);

    // ✅ Modifier toutes les requêtes pour utiliser .in('user_email', accessibleEmails)
    const [articlesRaw, contactsRaw, mouvementsRaw, facturesRaw, achatsRaw, categoriesRaw, parametresRaw] = await Promise.all([
      supabase.from('articles').select('*').in('user_email', accessibleEmails),
      supabase.from('contacts').select('*').in('user_email', accessibleEmails),
      supabase.from('mouvements').select('*').in('user_email', accessibleEmails),
      supabase.from('factures').select('*').in('user_email', accessibleEmails),
      supabase.from('achats').select('*').in('user_email', accessibleEmails),
      supabase.from('categories').select('*').in('user_email', accessibleEmails),
      supabase.from('parametres').select('*').in('user_email', accessibleEmails),
    ]);

    if (articlesRaw.error) throw articlesRaw.error;
    if (contactsRaw.error) throw contactsRaw.error;
    if (mouvementsRaw.error) throw mouvementsRaw.error;
    if (facturesRaw.error) throw facturesRaw.error;
    if (achatsRaw.error) throw achatsRaw.error;
    if (categoriesRaw.error) throw categoriesRaw.error;
    if (parametresRaw.error) throw parametresRaw.error;

    const articles: Article[] = articlesRaw.data ? articlesRaw.data.map(article => ({
      ...toCamelCase(article),
      prixVenteHT: article.prix_achat * (1 + (article.marge_percent || 0) / 100),
      prixVenteTTC: article.prix_achat * (1 + (article.marge_percent || 0) / 100) * (1 + (article.taux_tva || 0) / 100)
    })) : [];

    const contacts: Contact[] = contactsRaw.data ? contactsRaw.data.map(toCamelCase) : [];
    const mouvements: Mouvement[] = mouvementsRaw.data ? mouvementsRaw.data.map(toCamelCase) : [];
    const factures = facturesRaw.data ? facturesRaw.data.map(toCamelCase) : [];
    
    const achats = achatsRaw.data ? achatsRaw.data.map(achat => {
      const achatConverted = toCamelCase(achat);
      const fournisseur = contacts.find(c => c.id === achatConverted.fournisseurId);
      return {
        ...achatConverted,
        nomFournisseur: fournisseur?.societe || 'Non défini'
      };
    }) : [];
    
    const categories = categoriesRaw.data ? categoriesRaw.data.map(toCamelCase) : [];
    const parametres = parametresRaw.data?.[0] ? toCamelCase(parametresRaw.data[0]) : null;

    const endTime = Date.now();
    console.log(`✅ Données chargées depuis Supabase en ${endTime - startTime}ms`);
    console.log(`📊 Stats: ${articles.length} articles, ${contacts.length} contacts, ${mouvements.length} mouvements`);

    return { articles, clients: contacts, contacts, mouvements, factures, achats, categories, parametres };
  } catch (error) {
    console.error('❌ Erreur lors du chargement des données:', error);
    throw error;
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

export async function chargerCategories(): Promise<Categorie[]> {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_email', userEmail)
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
import { AuthorizedUser, UserPermissions } from '@/types';

// ============================================================================
// GESTION DES ACCÈS PARTAGÉS
// ============================================================================

/**
 * Récupérer tous les emails autorisés (le mien + ceux que j'ai autorisés)
 */
export const getAuthorizedEmails = async (): Promise<string[]> => {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) return [];

    // Récupérer les emails que j'ai autorisés
    const { data: authorized, error } = await supabase
      .from('authorized_users')
      .select('authorized_email')
      .eq('owner_email', userEmail);

    if (error) throw error;

    const authorizedEmails = authorized?.map(a => a.authorized_email) || [];
    
    // Inclure mon propre email
    return [userEmail, ...authorizedEmails];
  } catch (error) {
    console.error('❌ Erreur récupération emails autorisés:', error);
    return [getCurrentUserEmail() || ''];
  }
};

/**
 * Récupérer les propriétaires qui m'ont donné accès
 */
export const getOwnersWhoAuthorizedMe = async (): Promise<string[]> => {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) return [];

    const { data: owners, error } = await supabase
      .from('authorized_users')
      .select('owner_email')
      .eq('authorized_email', userEmail);

    if (error) throw error;

    return owners?.map(o => o.owner_email) || [];
  } catch (error) {
    console.error('❌ Erreur récupération propriétaires:', error);
    return [];
  }
};

/**
 * Récupérer tous les emails accessibles (mes données + celles partagées avec moi)
 */
export const getAllAccessibleEmails = async (): Promise<string[]> => {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) return [];

    const [myAuthorized, ownersWhoAuthorizedMe] = await Promise.all([
      getAuthorizedEmails(),
      getOwnersWhoAuthorizedMe()
    ]);

    // Combiner et dédupliquer
    const allEmails = [...new Set([...myAuthorized, ...ownersWhoAuthorizedMe])];
    
    console.log('📧 Emails accessibles:', allEmails);
    return allEmails;
  } catch (error) {
    console.error('❌ Erreur récupération emails accessibles:', error);
    return [getCurrentUserEmail() || ''];
  }
};

/**
 * Récupérer la liste des utilisateurs autorisés
 */
export const getAuthorizedUsers = async (): Promise<AuthorizedUser[]> => {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const { data, error } = await supabase
      .from('authorized_users')
      .select('*')
      .eq('owner_email', userEmail)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const users: AuthorizedUser[] = (data || []).map(toCamelCase);
    console.log('✅ Utilisateurs autorisés chargés:', users.length);
    return users;
  } catch (error) {
    console.error('❌ Erreur chargement utilisateurs autorisés:', error);
    throw error;
  }
};

/**
 * Ajouter un utilisateur autorisé
 */
export const addAuthorizedUser = async (
  authorizedEmail: string, 
  accessLevel: 'read' | 'write'
): Promise<void> => {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    // Vérifier que l'email n'est pas le sien
    if (authorizedEmail.toLowerCase() === userEmail.toLowerCase()) {
      throw new Error('Vous ne pouvez pas vous ajouter vous-même');
    }

    const userData = toSnakeCase({
      ownerEmail: userEmail,
      authorizedEmail: authorizedEmail.toLowerCase().trim(),
      accessLevel
    });

    const { error } = await supabase
      .from('authorized_users')
      .insert([userData]);

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Cet utilisateur a déjà accès à vos données');
      }
      throw error;
    }

    console.log('✅ Utilisateur autorisé ajouté:', authorizedEmail);
  } catch (error) {
    console.error('❌ Erreur ajout utilisateur autorisé:', error);
    throw error;
  }
};

/**
 * Modifier le niveau d'accès d'un utilisateur
 */
export const updateAuthorizedUser = async (
  id: string, 
  accessLevel: 'read' | 'write'
): Promise<void> => {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const { error } = await supabase
      .from('authorized_users')
      .update({ access_level: accessLevel })
      .eq('id', id)
      .eq('owner_email', userEmail);

    if (error) throw error;

    console.log('✅ Niveau d\'accès modifié:', id);
  } catch (error) {
    console.error('❌ Erreur modification accès:', error);
    throw error;
  }
};

/**
 * Supprimer un utilisateur autorisé
 */
export const removeAuthorizedUser = async (id: string): Promise<void> => {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) throw new Error('Utilisateur non connecté');

    const { error } = await supabase
      .from('authorized_users')
      .delete()
      .eq('id', id)
      .eq('owner_email', userEmail);

    if (error) throw error;

    console.log('✅ Utilisateur autorisé supprimé:', id);
  } catch (error) {
    console.error('❌ Erreur suppression utilisateur autorisé:', error);
    throw error;
  }
};

/**
 * Vérifier les permissions de l'utilisateur actuel
 */
export const getUserPermissions = async (): Promise<UserPermissions> => {
  try {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) {
      return {
        isOwner: false,
        hasWriteAccess: false,
        hasReadAccess: false,
        accessLevel: 'read'
      };
    }

    // Vérifier si l'utilisateur a des autorisations reçues
    const { data, error } = await supabase
      .from('authorized_users')
      .select('access_level, owner_email')
      .eq('authorized_email', userEmail)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('❌ Erreur vérification permissions:', error);
    }

    const isOwner = !data; // Si pas de données, c'est qu'il consulte ses propres données
    const hasWriteAccess = isOwner || data?.access_level === 'write';
    const hasReadAccess = true; // Si on est ici, on a au moins lecture
    const accessLevel: 'read' | 'write' | 'owner' = isOwner ? 'owner' : (data?.access_level || 'read');

    return {
      isOwner,
      hasWriteAccess,
      hasReadAccess,
      accessLevel
    };
  } catch (error) {
    console.error('❌ Erreur récupération permissions:', error);
    return {
      isOwner: true, // Par défaut, on considère qu'il consulte ses données
      hasWriteAccess: true,
      hasReadAccess: true,
      accessLevel: 'owner'
    };
  }
};