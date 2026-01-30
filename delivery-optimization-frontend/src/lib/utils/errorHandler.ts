/**
 * Gestionnaire d'erreurs centralisé pour le frontend
 */

export type ErrorType = 'network' | 'api' | 'validation' | 'unknown';

export interface AppError {
  message: string;
  type: ErrorType;
  details?: any;
  statusCode?: number;
}

/**
 * Affiche une notification d'erreur à l'utilisateur
 */
export function showErrorNotification(error: AppError) {
  console.error(`[${error.type.toUpperCase()}] ${error.message}`, error.details);

  // Dynamically import to avoid issues in server components
  if (typeof window !== 'undefined') {
    import('@/components/ui/Toast').then(({ showToast }) => {
      showToast(error.message, 'error', 6000);
    });
  }
}

/**
 * Transforme une erreur brute en AppError
 */
export function parseError(error: unknown): AppError {
  // Erreur réseau (fetch failed)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: 'Impossible de se connecter au serveur. Vérifiez que l\'API est démarrée.',
      type: 'network',
      details: error.message
    };
  }

  // Erreur HTTP avec réponse
  if (error && typeof error === 'object' && 'status' in error) {
    const httpError = error as { status: number; message?: string; body?: any };

    let message = 'Une erreur est survenue';

    switch (httpError.status) {
      case 400:
        message = 'Requête invalide. Vérifiez les données envoyées.';
        break;
      case 404:
        message = 'Ressource non trouvée.';
        break;
      case 500:
        message = 'Erreur serveur. Vérifiez les logs du backend.';
        break;
      case 503:
        message = 'Service temporairement indisponible.';
        break;
    }

    return {
      message,
      type: 'api',
      statusCode: httpError.status,
      details: httpError.body
    };
  }

  // Erreur générique
  return {
    message: error instanceof Error ? error.message : 'Erreur inconnue',
    type: 'unknown',
    details: error
  };
}

/**
 * Wrapper pour les appels API avec gestion d'erreurs
 */
export async function handleApiCall<T>(
  apiCall: () => Promise<T>,
  options?: {
    showNotification?: boolean;
    fallbackValue?: T;
  }
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error) {
    const appError = parseError(error);

    if (options?.showNotification !== false) {
      showErrorNotification(appError);
    }

    if (options?.fallbackValue !== undefined) {
      return options.fallbackValue;
    }

    return null;
  }
}
