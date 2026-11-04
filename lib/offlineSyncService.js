/**
 * SERVICE DE FILE D'ATTENTE DE SYNCHRONISATION HORS-LIGNE (OFFLINE-FIRST SYNC QUEUE)
 * FacturX — Résilience Réseau, Rejeu Automatique & Cohérence avec Supabase
 */

const STORAGE_KEY_QUEUE = "facturx_offline_sync_queue_v1";

// Récupérer la file d'attente brute depuis localStorage
export function getPendingQueue() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("[OfflineSync] Erreur lecture file d'attente:", err);
    return [];
  }
}

// Obtenir le nombre d'actions en attente
export function getPendingCount() {
  return getPendingQueue().length;
}

// Sauvegarder la file d'attente
function saveQueue(queue) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(queue));
    notifySubscribers();
  } catch (err) {
    console.error("[OfflineSync] Erreur sauvegarde file d'attente:", err);
  }
}

// Enregistrer une nouvelle mutation en file d'attente hors-ligne
export function enqueueOfflineAction(type, payload, companyId = null) {
  const queue = getPendingQueue();
  const action = {
    id: `sync_act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    payload,
    companyId,
    timestamp: new Date().toISOString(),
    retryCount: 0,
    status: "pending",
  };

  queue.push(action);
  saveQueue(queue);
  console.log(`[OfflineSync] Action enfilée [${type}] ID: ${action.id} (Total en attente: ${queue.length})`);
  return action;
}

// Retirer une action traitée avec succès
export function removeActionFromQueue(actionId) {
  const queue = getPendingQueue();
  const filtered = queue.filter((item) => item.id !== actionId);
  saveQueue(filtered);
}

// Vider l'intégralité de la file d'attente
export function clearPendingQueue() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_QUEUE);
  notifySubscribers();
}

// Système de notification d'événements pour l'interface React
const subscribers = new Set();

function notifySubscribers() {
  const status = {
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    pendingCount: getPendingCount(),
    queue: getPendingQueue(),
  };
  subscribers.forEach((cb) => {
    try {
      cb(status);
    } catch (e) {
      console.warn("[OfflineSync] Erreur callback subscriber:", e);
    }
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("facturx_offline_status", { detail: status }));
  }
}

export function subscribeToSyncStatus(callback) {
  subscribers.add(callback);
  // Appel initial
  callback({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    pendingCount: getPendingCount(),
    queue: getPendingQueue(),
  });

  return () => {
    subscribers.delete(callback);
  };
}

let isProcessingQueue = false;

/**
 * Rejoue toutes les actions en attente vers Supabase de manière séquentielle (FIFO)
 * @param {Object} apiServices - Références vers les fonctions d'API Supabase
 * @returns {Promise<{ success: boolean, processedCount: number, errors: Array }>}
 */
export async function processSyncQueue(apiServices) {
  if (isProcessingQueue) {
    console.log("[OfflineSync] Traitement de file d'attente déjà en cours...");
    return { success: true, processedCount: 0, errors: [] };
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    console.log("[OfflineSync] Navigateur actuellement hors-ligne. Rejeu différé.");
    return { success: false, processedCount: 0, errors: ["Offline"] };
  }

  const queue = getPendingQueue();
  if (queue.length === 0) {
    return { success: true, processedCount: 0, errors: [] };
  }

  isProcessingQueue = true;
  console.log(`[OfflineSync] 🚀 Démarrage du rejeu de synchronisation : ${queue.length} action(s) à traiter...`);

  let processedCount = 0;
  const errors = [];

  for (const action of [...queue]) {
    try {
      const { type, payload, companyId } = action;

      switch (type) {
        // --- CLIENTS ---
        case "CREATE_CLIENT":
          if (apiServices.apiCreateClient) {
            await apiServices.apiCreateClient(payload, companyId);
          }
          break;

        case "UPDATE_CLIENT":
          if (apiServices.apiUpdateClient) {
            const targetId = payload.id || payload.name;
            await apiServices.apiUpdateClient(targetId, payload);
          }
          break;

        case "DELETE_CLIENT":
          if (apiServices.apiDeleteClient) {
            await apiServices.apiDeleteClient(payload.id || payload.name);
          }
          break;

        // --- FACTURES ---
        case "CREATE_INVOICE":
          if (apiServices.apiCreateInvoice) {
            await apiServices.apiCreateInvoice(payload, companyId);
          }
          break;

        case "UPDATE_INVOICE":
          if (apiServices.apiUpdateInvoice) {
            await apiServices.apiUpdateInvoice(payload.id, payload);
          }
          break;

        case "UPDATE_INVOICE_STATUS":
          if (apiServices.apiUpdateInvoiceStatus) {
            await apiServices.apiUpdateInvoiceStatus(payload.id, payload.status);
          }
          break;

        case "ADD_INVOICE_REMINDER":
          if (apiServices.apiAddInvoiceReminder) {
            await apiServices.apiAddInvoiceReminder(payload.id, payload.reminder);
          }
          break;

        case "DELETE_INVOICE":
          if (apiServices.apiDeleteInvoice) {
            await apiServices.apiDeleteInvoice(payload.id);
          }
          break;

        // --- DEVIS ---
        case "CREATE_QUOTE":
          if (apiServices.apiCreateQuote) {
            await apiServices.apiCreateQuote(payload, companyId);
          }
          break;

        case "UPDATE_QUOTE_STATUS":
          if (apiServices.apiUpdateQuoteStatus) {
            await apiServices.apiUpdateQuoteStatus(payload.id, payload.status, payload.extraData);
          }
          break;

        case "DELETE_QUOTE":
          if (apiServices.apiDeleteQuote) {
            await apiServices.apiDeleteQuote(payload.id);
          }
          break;

        // --- PAIEMENTS ---
        case "CREATE_PAYMENT":
          if (apiServices.apiCreatePayment) {
            await apiServices.apiCreatePayment(payload, companyId);
          }
          break;

        case "UPDATE_PAYMENT":
          if (apiServices.apiUpdatePayment) {
            await apiServices.apiUpdatePayment(payload.id, payload);
          }
          break;

        case "DELETE_PAYMENT":
          if (apiServices.apiDeletePayment) {
            await apiServices.apiDeletePayment(payload.id);
          }
          break;

        // --- ENTREPRISE ---
        case "UPSERT_COMPANY":
          if (apiServices.upsertCompanyProfile) {
            await apiServices.upsertCompanyProfile(payload);
          }
          break;

        default:
          console.warn(`[OfflineSync] Type d'action non supporté ou inconnu : ${type}`);
          throw new Error(`Action non reconnue: ${type}`);
      }

      // Si l'exécution réussit sans lever d'exception, retirer de la file d'attente
      removeActionFromQueue(action.id);
      processedCount++;
      console.log(`[OfflineSync] ✅ Action [${type}] (${action.id}) synchronisée avec succès avec Supabase.`);
    } catch (err) {
      console.error(`[OfflineSync] ❌ Échec synchronisation action [${action.type}] :`, err);
      errors.push({ actionId: action.id, error: err.message });

      // Si erreur réseau (déconnexion survenue en cours de traitement), interrompre la boucle
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        console.warn("[OfflineSync] Perte de connexion réseau détectée pendant la synchronisation.");
        break;
      }
    }
  }

  isProcessingQueue = false;
  notifySubscribers();

  return {
    success: errors.length === 0,
    processedCount,
    errors,
  };
}

/**
 * Initialise les écouteurs réseau (online / offline) et lance la synchronisation au retour du réseau
 */
export function initOfflineSync(apiServices, onStatusChange = null) {
  if (typeof window === "undefined") return () => {};

  if (onStatusChange) {
    subscribers.add(onStatusChange);
  }

  const handleOnline = async () => {
    console.log("[OfflineSync] 🌐 Connexion Internet rétablie ! Lancement de la synchronisation automatique...");
    notifySubscribers();
    await processSyncQueue(apiServices);
  };

  const handleOffline = () => {
    console.log("[OfflineSync] 📡 Perte de connexion Internet. Bascule automatique en mode Hors-Ligne.");
    notifySubscribers();
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Tentative immédiate si des actions étaient en attente lors du chargement
  if (navigator.onLine && getPendingCount() > 0) {
    processSyncQueue(apiServices).catch((err) => {
      console.warn("[OfflineSync] Tentative de rejeu au démarrage échouée:", err);
    });
  }

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
    if (onStatusChange) {
      subscribers.delete(onStatusChange);
    }
  };
}
