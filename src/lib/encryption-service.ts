/**
 * Service de chiffrement pour protéger les données personnelles
 * Utilise AES-256 pour le localStorage et TweetNaCl pour la communication
 */

import CryptoJS from 'crypto-js';

export class EncryptionService {
  // Clé de chiffrement (à placer dans .env.local)
  private static readonly ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'fallback-key-256-bit-change-in-production';

  /**
   * Chiffre les données avec AES-256
   */
  static encrypt(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      return CryptoJS.AES.encrypt(jsonString, this.ENCRYPTION_KEY).toString();
    } catch (error) {
      console.error('Erreur de chiffrement:', error);
      throw new Error('Impossible de chiffrer les données');
    }
  }

  /**
   * Déchiffre les données chiffrées avec AES-256
   */
  static decrypt(encryptedData: string): any {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Erreur de déchiffrement:', error);
      throw new Error('Impossible de déchiffrer les données');
    }
  }

  /**
   * Hash sécurisé pour les mots de passe (PBKDF2)
   */
  static hashPassword(password: string): string {
    return CryptoJS.PBKDF2(password, this.ENCRYPTION_KEY, {
      keySize: 256 / 32,
      iterations: 1000
    }).toString();
  }

  /**
   * Vérifie un mot de passe hashé
   */
  static verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  /**
   * Génère une clé aléatoire sécurisée
   */
  static generateSecureKey(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Crée un JWT simple (à intégrer avec une vraie librairie JWT en production)
   */
  static createToken(data: any, expiresInHours: number = 24): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      ...data,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (expiresInHours * 3600)
    }));
    const signature = CryptoJS.HmacSHA256(`${header}.${payload}`, this.ENCRYPTION_KEY).toString();
    return `${header}.${payload}.${signature}`;
  }

  /**
   * Vérifie et décode un JWT
   */
  static verifyToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Token invalide');

      const [header, payload, signature] = parts;
      const expectedSignature = CryptoJS.HmacSHA256(`${header}.${payload}`, this.ENCRYPTION_KEY).toString();

      if (signature !== expectedSignature) {
        throw new Error('Signature invalide');
      }

      const decoded = JSON.parse(atob(payload));
      if (decoded.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expiré');
      }

      return decoded;
    } catch (error) {
      console.error('Erreur de vérification du token:', error);
      throw new Error('Token invalide');
    }
  }

  /**
   * Sanitize les données pour prévenir les XSS
   */
  static sanitize(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  /**
   * Masque les données sensibles pour les logs
   */
  static maskSensitiveData(data: any): any {
    const sensitiveFields = ['password', 'email', 'phone', 'ssn', 'creditCard'];
    const masked = { ...data };

    sensitiveFields.forEach(field => {
      if (masked[field]) {
        masked[field] = '***MASKED***';
      }
    });

    return masked;
  }
}

/**
 * Stockage sécurisé dans localStorage
 */
export class SecureStorage {
  static setItem(key: string, value: any): void {
    try {
      const encrypted = EncryptionService.encrypt(value);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de ${key}:`, error);
    }
  }

  static getItem(key: string): any | null {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      return EncryptionService.decrypt(encrypted);
    } catch (error) {
      console.error(`Erreur lors de la lecture de ${key}:`, error);
      return null;
    }
  }

  static removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  static clear(): void {
    localStorage.clear();
  }
}

/**
 * Gestion des cookies sécurisés (côté client)
 */
export class SecureCookie {
  static set(name: string, value: any, days: number = 7, httpOnly: boolean = false): void {
    try {
      const encrypted = EncryptionService.encrypt(value);
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      const expires = `expires=${date.toUTCString()}`;
      const secure = 'secure'; // Force HTTPS
      const sameSite = 'SameSite=Strict';

      document.cookie = `${name}=${encrypted};${expires};path=/;${secure};${sameSite}`;
    } catch (error) {
      console.error(`Erreur lors de la création du cookie ${name}:`, error);
    }
  }

  static get(name: string): any | null {
    try {
      const nameEQ = `${name}=`;
      const cookies = document.cookie.split(';');

      for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.indexOf(nameEQ) === 0) {
          const encrypted = cookie.substring(nameEQ.length);
          return EncryptionService.decrypt(encrypted);
        }
      }

      return null;
    } catch (error) {
      console.error(`Erreur lors de la lecture du cookie ${name}:`, error);
      return null;
    }
  }

  static delete(name: string): void {
    this.set(name, '', -1);
  }
}

/**
 * Audit logging pour conformité GDPR
 */
export class AuditLog {
  static log(action: string, userId: string, details: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      action,
      userId,
      details: EncryptionService.maskSensitiveData(details),
      ipAddress: 'client-side', // À enrichir côté serveur
      userAgent: navigator.userAgent
    };

    // Sauvegarder dans localStorage
    try {
      const logs = SecureStorage.getItem('audit_logs') || [];
      logs.push(logEntry);
      // Limiter à 1000 entrées
      if (logs.length > 1000) {
        logs.shift();
      }
      SecureStorage.setItem('audit_logs', logs);
    } catch (error) {
      console.error('Erreur lors de l\'audit logging:', error);
    }

    // À implémenter : Envoyer au serveur via API
  }

  static getLogs(): any[] {
    return SecureStorage.getItem('audit_logs') || [];
  }

  static clearLogs(): void {
    SecureStorage.removeItem('audit_logs');
  }
}
