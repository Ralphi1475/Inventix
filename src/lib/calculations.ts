import { Article, Mouvement, Contact } from '@/types';

/**
 * Calcule les prix de vente (HT et TTC) pour chaque article
 */
export const calculerArticlesAvecPrix = (articles: Article[]) => {
  return articles.map(art => {
    const prixVenteHT = art.prixAchat * (1 + art.margePercent / 100);
    const montantTVA = prixVenteHT * (art.tauxTVA / 100);
    const prixVenteTTC = prixVenteHT + montantTVA;
    return { ...art, prixVenteHT, prixVenteTTC };
  });
};

/**
 * Calcule les statistiques du dashboard :
 * - Total ventes (TTC)
 * - Total achats (coût d'achat)
 * - Valeur du stock (coût d'achat × quantité)
 * - Nombre d'articles, clients, etc.
 */
export const calculerStats = (articles: Article[], articlesAvecPrix: Article[], mouvements: Mouvement[], clients: Contact[]) => {
  const totalVentes = mouvements
    .filter(m => m.type === 'vente')
    .reduce((sum, m) => {
      const article = articlesAvecPrix.find(a => a.id === m.articleId);
      return sum + (article ? article.prixVenteTTC! * m.quantite : 0);
    }, 0);

  const totalAchats = mouvements
    .filter(m => m.type === 'entree')
    .reduce((sum, m) => {
      const article = articles.find(a => a.id === m.articleId);
      return sum + (article ? article.prixAchat * m.quantite : 0);
    }, 0);

  const valeurStock = articles.reduce((sum, art) => sum + (art.prixAchat * art.stock), 0);

  return {
    totalVentes: totalVentes.toFixed(2),
    totalAchats: totalAchats.toFixed(2),
    valeurStock: valeurStock.toFixed(2),
    nombreArticles: articles.length,
    nombreClients: clients.length,
    articlesFaibleStock: articles.filter(a => a.stock < 10).length
  };
};