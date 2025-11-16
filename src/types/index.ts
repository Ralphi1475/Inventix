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
  articleId: string;
  quantite: number;
  clientId?: string;
  fournisseurId?: string;
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
  societe_nom: string;
  societe_adresse: string;
  societe_code_postal: string;
  societe_ville: string;
  societe_pays: string;
  societe_telephone: string;
  societe_email: string;
  societe_tva: string;
  societe_iban: string;
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