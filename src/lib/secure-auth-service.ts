/**
 * Service d'authentification sécurisée avec JWT
 * Conforme OWASP et GDPR
 */

import { EncryptionService, SecureStorage, SecureCookie, AuditLog } from './encryption-service';
import { createClient } from '@supabase/supabase-js';

// Initialiser Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'elder' | 'servant' | 'publisher' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  assemblyId: string;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
  };
  lastLogin?: Date;
  twoFactorEnabled?: boolean;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Service d'authentification sécurisée
 */
export class SecureAuthService {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_KEY = 'auth_user';
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 heures

  /**
   * S'authentifier avec email et mot de passe
   * @param email Email de l'utilisateur
   * @param password Mot de passe (JAMAIS stocké)
   */
  static async signIn(email: string, password: string): Promise<AuthToken> {
    try {
      // Validation des entrées
      if (!this.validateEmail(email)) {
        throw new Error('Email invalide');
      }
      if (!this.validatePassword(password)) {
        throw new Error('Mot de passe invalide');
      }

      // Appel à Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        AuditLog.log('LOGIN_FAILED', email, { reason: error.message });
        throw error;
      }

      // Créer un token custom sécurisé
      const token = EncryptionService.createToken(
        {
          userId: data.user?.id,
          email: data.user?.email,
          role: 'publisher' // À récupérer du profil utilisateur
        },
        24 // 24 heures
      );

      // Sauvegarder les tokens de manière sécurisée
      SecureStorage.setItem(this.TOKEN_KEY, token);
      if (data.session?.refresh_token) {
        SecureStorage.setItem(this.REFRESH_TOKEN_KEY, data.session.refresh_token);
      }

      // Sauvegarder les infos utilisateur
      const userInfo = {
        id: data.user?.id,
        email: data.user?.email,
        role: 'publisher',
        lastLogin: new Date()
      };
      SecureStorage.setItem(this.USER_KEY, userInfo);

      // Log l'action
      AuditLog.log('LOGIN_SUCCESS', data.user?.email!, {
        userId: data.user?.id,
        loginTime: new Date()
      });

      return {
        accessToken: token,
        refreshToken: data.session?.refresh_token || '',
        expiresIn: 24 * 60 * 60
      };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  static async signUp(email: string, password: string, firstName: string, lastName: string): Promise<{ user: any; needsConfirmation: boolean }> {
    try {
      // Validation des entrées
      if (!this.validateEmail(email)) {
        throw new Error('Email invalide');
      }
      if (!this.validatePassword(password)) {
        throw new Error('Mot de passe faible. Min 12 caractères avec majuscules, minuscules, chiffres et symboles.');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (error) {
        AuditLog.log('SIGNUP_FAILED', email, { reason: error.message });
        throw error;
      }

      // Log l'action
      AuditLog.log('SIGNUP_SUCCESS', email, {
        firstName,
        lastName,
        needsEmailConfirmation: !data.user?.email_confirmed_at
      });

      return {
        user: data.user,
        needsConfirmation: !data.user?.email_confirmed_at
      };
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      throw error;
    }
  }

  /**
   * Se déconnecter
   */
  static async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();

      // Récupérer l'email avant suppression
      const user = SecureStorage.getItem(this.USER_KEY);

      // Supprimer les tokens et infos utilisateur
      SecureStorage.removeItem(this.TOKEN_KEY);
      SecureStorage.removeItem(this.REFRESH_TOKEN_KEY);
      SecureStorage.removeItem(this.USER_KEY);

      // Log l'action
      if (user?.email) {
        AuditLog.log('LOGOUT_SUCCESS', user.email, { logoutTime: new Date() });
      }
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      throw error;
    }
  }

  /**
   * Obtenir l'utilisateur actuellement connecté
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const token = SecureStorage.getItem(this.TOKEN_KEY);
      if (!token) {
        return null;
      }

      // Vérifier la validité du token
      try {
        EncryptionService.verifyToken(token);
      } catch (error) {
        // Token expiré ou invalide
        this.signOut();
        return null;
      }

      // Récupérer les infos utilisateur du stockage sécurisé
      const userInfo = SecureStorage.getItem(this.USER_KEY);
      return userInfo || null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  }

  /**
   * Vérifier les permissions de l'utilisateur
   */
  static async hasPermission(requiredRole: UserRole): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;

      const roleHierarchy: { [key in UserRole]: number } = {
        'publisher': 1,
        'servant': 2,
        'elder': 3,
        'admin': 4,
      };

      return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
    } catch (error) {
      console.error('Erreur de vérification des permissions:', error);
      return false;
    }
  }

  /**
   * Changer le mot de passe
   */
  static async updatePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      // Valider le nouveau mot de passe
      if (!this.validatePassword(newPassword)) {
        throw new Error('Mot de passe faible');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      const user = await this.getCurrentUser();
      AuditLog.log('PASSWORD_CHANGED', user?.email || 'unknown', {
        changeTime: new Date()
      });
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      throw error;
    }
  }

  /**
   * Demander une réinitialisation de mot de passe
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        throw error;
      }

      AuditLog.log('PASSWORD_RESET_REQUESTED', email, {
        requestTime: new Date()
      });
    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation:', error);
      throw error;
    }
  }

  /**
   * Activer l'authentification à deux facteurs (TODO)
   */
  static async enableTwoFactor(): Promise<{ secret: string; qrCode: string }> {
    // À implémenter avec une librairie comme speakeasy
    throw new Error('2FA non encore implémenté');
  }

  /**
   * Valider l'email
   */
  private static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valider la force du mot de passe
   * Min 12 caractères, maj, min, chiffre, symbole
   */
  private static validatePassword(password: string): boolean {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    return passwordRegex.test(password);
  }
}

/**
 * Hook personnalisé pour l'authentification
 */
import * as React from 'react';

export function useSecureAuth() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await SecureAuthService.getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(!!currentUser);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return {
    isAuthenticated,
    user,
    loading,
    error,
    signIn: SecureAuthService.signIn,
    signUp: SecureAuthService.signUp,
    signOut: SecureAuthService.signOut,
    updatePassword: SecureAuthService.updatePassword,
    resetPassword: SecureAuthService.resetPassword,
  };
}
