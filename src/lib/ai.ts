import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export async function generateProductionInsights(data: any): Promise<string> {
  if (!apiKey) {
    return "Veuillez configurer `VITE_GEMINI_API_KEY` dans votre fichier `.env` pour activer l'assistant IA.";
  }

  const prompt = `
Vous êtes un expert en analyse de données de production industrielle (Manufacturing Execution System - MES).
Analysez les données de production suivantes et fournissez un rapport concis en français.
Mettez en évidence:
1. Les tendances clés de la production.
2. Les éventuels goulots d'étranglement ou points faibles (ex: rebuts élevés, temps d'arrêt).
3. 2 ou 3 recommandations actionnables pour améliorer l'efficacité.

Données de production actuelles:
${JSON.stringify(data, null, 2)}

Veuillez formater votre réponse en Markdown avec des puces et du texte en gras pour faciliter la lecture. Ne saluez pas, donnez juste l'analyse.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "Impossible de générer des insights pour le moment.";
  } catch (error: any) {
    console.error("Erreur Gemini:", error);
    if (error.message && (error.message.includes('429') || error.message.includes('Quota exceeded'))) {
      return "Le quota de l'assistant IA est temporairement dépassé (limite atteinte). Veuillez patienter quelques secondes avant de réessayer.";
    }
    return "Une erreur s'est produite lors de la communication avec l'assistant IA: " + error.message;
  }
}

export async function generateDailyExecutiveDigest(params: {
  todayProd: number;
  targetProd: number;
  totalScrap: number;
  wasteRate: string;
  machines: any[];
  stops: any[];
  activeOrders: any[];
}): Promise<string> {
  if (!apiKey) {
    // Return structured offline rule-based summary if API key is missing
    const { todayProd, targetProd, totalScrap, wasteRate, machines, stops } = params;
    const diff = targetProd > 0 ? Math.round(((todayProd - targetProd) / targetProd) * 100) : 0;
    const activeMachinesCount = machines.filter(m => m.status === 'Active' || m.status === 'RUNNING').length;

    return `### 📋 Synthèse Exécutive du Jour\n\n` +
      `* **Volume Produit :** **${todayProd.toLocaleString()} unités** sur un objectif de ${targetProd.toLocaleString()} (${diff >= 0 ? '+' : ''}${diff}%).\n` +
      `* **Taux de Rebut :** **${wasteRate}%** (${totalScrap.toLocaleString()} unités perdues). ${Number(wasteRate) > 3.0 ? '⚠️ *Dépassement du seuil cible de 3%*.' : '✅ *Conforme aux objectifs qualité*.'}\n` +
      `* **Lignes en Opération :** **${activeMachinesCount}/${machines.length} machines** actives.\n` +
      `* **Arrêts Enregistrés :** ${stops.length} incident(s) signalé(s) ce jour.\n\n` +
      `### 💡 Priorités de l'équipe suivante :\n` +
      `1. Réapprovisionner les bobines Jumbo pour les ordres à priorité Haute.\n` +
      `2. Contrôler le réglage des couteaux sur les lignes ayant dépassé 3% de rebut.\n` +
      `3. Clôturer les ordres dont le métrage requis a été validé par le contrôle qualité.`;
  }

  const prompt = `
Vous êtes le Directeur des Opérations IA d'une usine de transformation (rubans adhésifs, films, emballage).
Rédigez un BRIEFING EXÉCUTIF DU JOUR percutant, structuré et professionnel pour le Directeur Général et les Chefs d'Équipe.

Données consolidées de la journée :
- Production Conforme : ${params.todayProd} unités
- Objectif Journalier : ${params.targetProd} unités
- Quantité de Rebut / Déchets : ${params.totalScrap} unités
- Taux de Déchet : ${params.wasteRate}% (Objectif < 3.0%)
- Machines : ${JSON.stringify(params.machines.map(m => ({ nom: m.name, statut: m.status })))}
- Arrêts Machines : ${JSON.stringify(params.stops.slice(0, 5))}
- Ordres en cours : ${params.activeOrders.length}

Structure requise en Markdown :
1. **Synthèse de la Production** (Performance globale, écart vs cible).
2. **Disponibilité & Arrêts Clés** (Causes des pannes majeures ou micro-arrêts).
3. **Analyse Qualité & Rebuts** (Anomalies éventuelles).
4. **3 Actions Prioritaires Immédiates** pour le prochain quart (shift).

Soyez précis, chiffres à l'appui, sans flatterie inutile.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Synthèse journalière générée avec succès.";
  } catch (error: any) {
    console.error("Gemini Digest Error:", error);
    // Fallback to local structured generator on network / key issue
    return generateDailyExecutiveDigest({ ...params, targetProd: params.targetProd || 10000 });
  }
}

export async function askAssistant(question: string, contextData: any, history: {role: string, content: string}[] = []): Promise<string> {
  if (!apiKey) {
    // Offline contextual Q&A handler
    const q = question.toLowerCase();
    if (q.includes('ordre') || q.includes('of')) {
      const openCount = contextData?.orders?.length || 0;
      return `Il y a actuellement **${openCount} ordre(s) de fabrication** actifs dans le système.`;
    }
    if (q.includes('machine')) {
      const macList = contextData?.machines?.map((m: any) => `- **${m.name}** : ${m.status}`).join('\n') || 'Aucune machine';
      return `Voici l'état actuel de vos machines :\n${macList}`;
    }
    if (q.includes('déchet') || q.includes('rebut')) {
      const scrap = contextData?.production_entries?.reduce((s: number, e: any) => s + (e.scrap_quantity || 0), 0) || 0;
      return `Le volume total de déchets enregistré récemment est de **${scrap} unités**.`;
    }
    return "Pour poser des questions complexes et obtenir des analyses prédictives avancées, configurez `VITE_GEMINI_API_KEY` dans votre fichier `.env`.";
  }

  const prompt = `
Vous êtes l'assistant IA officiel de FactoryFlow TN (Manufacturing Execution System).
Répondez aux questions des responsables d'usine et opérateurs avec précision, concision et professionnalisme.

RÈGLES STRICTES :
1. Basez vos réponses UNIQUEMENT sur les données fournies dans le contexte ci-dessous. N'inventez jamais de statistiques imaginaires.
2. Dans la liste "orders", "quantity_planned" représente la quantité restante à produire.
3. Donnez des réponses directes en Markdown (gras, listes à puces).

Contexte usine (JSON) :
${JSON.stringify(contextData, null, 2)}

Historique :
${JSON.stringify(history, null, 2)}

Question : ${question}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || "Je n'ai pas pu traiter votre demande.";
  } catch (error: any) {
    console.error("Erreur Gemini (Chat):", error);
    return "Une erreur technique s'est produite: " + error.message;
  }
}

export async function scheduleOrders(
  pendingOrders: any[],
  machines: any[],
  articles: any[]
): Promise<any> {
  if (!apiKey) {
    throw new Error("L'IA n'est pas configurée. Ajoutez la clé API.");
  }

  const prompt = `
Vous êtes un optimiseur de production IA (Manufacturing Execution System).
Je vous donne une liste d'ordres de fabrication (OF) en attente, une liste de machines disponibles et un dictionnaire d'articles.
Votre tâche est de planifier ces OF sur les machines pour optimiser l'efficacité. Regroupez les articles similaires (ex: même modèle, couleur, format) sur la même machine pour minimiser les temps de changement. Répartissez la charge équitablement.

Ordres (JSON): ${JSON.stringify(pendingOrders, null, 2)}
Machines (JSON): ${JSON.stringify(machines, null, 2)}
Articles (JSON): ${JSON.stringify(articles, null, 2)}

Répondez UNIQUEMENT avec un objet JSON valide contenant une propriété "schedule" qui est un tableau.
Chaque élément du tableau "schedule" doit avoir:
- "of_id": l'ID de l'ordre
- "machine_id": l'ID de la machine assignée
- "planned_start_date": une date ISO pour le début
- "planned_end_date": une date ISO pour la fin estimée
- "rationale": une courte phrase expliquant pourquoi cette machine a été choisie.

Ne répondez qu'avec le JSON, rien d'autre.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    let text = response.text || "{}";
    if (text.startsWith('```json')) {
      text = text.replace('```json', '').replace('```', '');
    }
    if (text.startsWith('```')) {
      text = text.replace('```', '').replace('```', '');
    }

    return JSON.parse(text);
  } catch (error: any) {
    console.error("Erreur Gemini (Schedule):", error);
    throw new Error("Erreur technique lors de la planification: " + error.message);
  }
}
