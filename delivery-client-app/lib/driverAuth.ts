// Service d'authentification pour les livreurs

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export interface DriverLoginRequest {
  email: string;
  password: string;
}

export interface DriverRegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  vehicleType: string;
  licensePlate?: string;
}

export interface DriverInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  licensePlate?: string;
  status: "AVAILABLE" | "BUSY" | "OFFLINE";
}

export interface DriverAuthResponse {
  token: string;
  driver: DriverInfo;
}

class DriverAuthService {
  private readonly STORAGE_KEY = "driver_auth";

  /**
   * Inscription d'un nouveau livreur
   */
  async register(data: DriverRegisterRequest): Promise<DriverAuthResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/driver/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(error.message || `Erreur d'inscription: ${response.status}`);
    }

    const result: DriverAuthResponse = await response.json();
    this.saveAuth(result);
    return result;
  }

  /**
   * Connexion d'un livreur
   */
  async login(data: DriverLoginRequest): Promise<DriverAuthResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/driver/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(error.message || `Erreur de connexion: ${response.status}`);
    }

    const result: DriverAuthResponse = await response.json();
    this.saveAuth(result);
    return result;
  }

  /**
   * Déconnexion
   */
  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Vérifier si le livreur est connecté
   */
  isAuthenticated(): boolean {
    return this.getAuth() !== null;
  }

  /**
   * Récupérer les informations d'authentification
   */
  getAuth(): DriverAuthResponse | null {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  /**
   * Récupérer le token
   */
  getToken(): string | null {
    const auth = this.getAuth();
    return auth?.token || null;
  }

  /**
   * Récupérer les infos du livreur
   */
  getDriver(): DriverInfo | null {
    const auth = this.getAuth();
    return auth?.driver || null;
  }

  /**
   * Sauvegarder l'authentification
   */
  private saveAuth(auth: DriverAuthResponse) {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(auth));
    }
  }
}

// Export singleton
export const driverAuth = new DriverAuthService();
