export interface Article {
  id: string;
  numero: string;
  categorie: string;
  nom: string;
  description: string;
  image: string;
  prixAchat: number;
  margePercent: number;
  tauxTva: number;
  stock: number;
  emplacement: string;
  prixVenteTTC?: number;
  prixVenteHT?: number;
  unite: string;
  conditionnement: string;
}

export interface Contact {
  id: string;
  type: string;
  societe: string;
  nom: string;
  prenom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  pays: string;
  mobile: string;
  numeroTVA: string;
  numeroCompte: string;
  email: string;
}

export interface Mouvement {
  id: string;
  date: string;
  type: 'entree' | 'vente' | 'venteComptoir';
  article_id?: string;     // ✅ Nouveau (snake_case)
  quantite: number;
  client_id?: string;      // ✅ Nouveau (snake_case)
  fournisseur_id?: string; // ✅ Nouveau (snake_case)
  reference: string;
  modePaiement?: string;
  nomArticle?: string;
  prixUnitaire?: number;
  emplacement?: string;
  nomClient?: string;
  rectDate?: string;
  colonne6?: string;
  commentaire?: string;
}

export interface Parametres {
  societeNom: string;
  societeAdresse: string;
  societeCodePostal: string;
  societeVille: string;
  societePays: string;
  societeTelephone: string;
  societeEmail: string;
  societeTva: string;
  societeIban: string;
  id?: string;
  userEmail?: string;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Achat {
  id: string;
  reference: string;
  dateAchat: string;
  dateEcheance?: string;
  datePaiement?: string;
  fournisseurId: string;
  modePaiement?: string;
  montantHtva: number;   // ✅ Pas HTVA
  montantTtc: number;    // ✅ Pas TTC
  description?: string;
  categorie: string;
  nomFournisseur?: string;
}

export interface LignePanier {
  article: Article;
  quantite: number;
  prixUnitairePersonnalise?: number;
}

export interface FactureResume {
  id: string;
  reference: string;
  date: string;
  client: string;
  modePaiement: string;
  montant: number;
  emplacement?: string;
  commentaire?: string;
}

export interface Categorie {
  id: string;
  denomination: string;
  createdAt?: string;
  updatedAt?: string;
  userEmail?: string;
  type: 'produit' | 'achat'; // ✅ ajout de la propriété 'type'
}

export interface AuthorizedUser {
  id: string;
  ownerEmail: string;
  authorizedEmail: string;
  accessLevel: 'read' | 'write';
  createdAt: string;
  updatedAt: string;
}

export interface UserPermissions {
  isOwner: boolean;
  hasWriteAccess: boolean;
  hasReadAccess: boolean;
  accessLevel: 'read' | 'write' | 'owner';
}