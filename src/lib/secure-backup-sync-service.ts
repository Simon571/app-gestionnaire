/**
 * Service de sauvegarde sécurisée avec chiffrement
 * GDPR-compliant avec audit logs
 */

import { useState, useEffect, useCallback } from 'react';
import { SecureStorage, AuditLog, EncryptionService } from './encryption-service';

export interface BackupData {
  version: string;
  timestamp: Date;
  people: any[];
  territories: any[];
  assignments: any[];
  settings: any;
  meetings: any[];
  encryption: {
    algorithm: string;
    keyDerivation: string;
  };
}

export interface SyncStatus {
  lastSync: Date | null;
  isOnline: boolean;
  pendingChanges: number;
  syncing: boolean;
  error: string | null;
}

class SecureBackupSyncService {
  private static instance: SecureBackupSyncService;
  private syncStatus: SyncStatus = {
    lastSync: null,
    isOnline: navigator.onLine,
    pendingChanges: 0,
    syncing: false,
    error: null,
  };

  static getInstance(): SecureBackupSyncService {
    if (!this.instance) {
      this.instance = new SecureBackupSyncService();
    }
    return this.instance;
  }

  constructor() {
    window.addEventListener('online', () => {
      this.syncStatus.isOnline = true;
      this.autoSync();
    });

    window.addEventListener('offline', () => {
      this.syncStatus.isOnline = false;
    });

    setInterval(() => {
      if (this.syncStatus.isOnline && this.syncStatus.pendingChanges > 0) {
        this.autoSync();
      }
    }, 300000); // 5 minutes
  }

  /**
   * Créer une sauvegarde chiffrée
   */
  async createSecureBackup(password?: string): Promise<string> {
    try {
      const backupData: BackupData = {
        version: '2.0.0-secure',
        timestamp: new Date(),
        people: this.getStoredData('people') || [],
        territories: this.getStoredData('territories') || [],
        assignments: this.getStoredData('assignments') || [],
        settings: this.getStoredData('appSettings') || {},
        meetings: this.getStoredData('meetings') || [],
        encryption: {
          algorithm: 'AES-256-GCM',
          keyDerivation: 'PBKDF2'
        }
      };

      // Chiffrer les données sensibles
      const encryptedData = EncryptionService.encrypt(backupData);

      // Ajouter un mot de passe supplémentaire si fourni
      let backupContent = encryptedData;
      if (password) {
        backupContent = EncryptionService.encrypt({
          data: encryptedData,
          passwordHash: EncryptionService.hashPassword(password)
        });
      }

      const backupString = JSON.stringify({
        encrypted: backupContent,
        timestamp: new Date().toISOString(),
        passwordProtected: !!password
      }, null, 2);

      const blob = new Blob([backupString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-secure-${new Date().toISOString().split('T')[0]}.enc.json`;
      link.click();
      
      URL.revokeObjectURL(url);

      // Log l'action pour GDPR
      AuditLog.log('BACKUP_CREATED', 'user', {
        type: 'secure_backup',
        passwordProtected: !!password,
        size: backupString.length
      });

      return 'Sauvegarde chiffrée créée avec succès';
    } catch (error) {
      console.error('Erreur lors de la création de la sauvegarde:', error);
      AuditLog.log('BACKUP_FAILED', 'user', { error: String(error) });
      throw new Error(`Erreur lors de la création de la sauvegarde: ${error}`);
    }
  }

  /**
   * Restaurer depuis une sauvegarde chiffrée
   */
  async restoreFromSecureBackup(file: File, password?: string): Promise<string> {
    try {
      const text = await file.text();
      const backupWrapper = JSON.parse(text);

      // Déchiffrer les données
      let decryptedData: any;
      try {
        if (backupWrapper.passwordProtected && password) {
          const intermediate = EncryptionService.decrypt(backupWrapper.encrypted);
          if (!EncryptionService.verifyPassword(password, intermediate.passwordHash)) {
            throw new Error('Mot de passe incorrect');
          }
          decryptedData = EncryptionService.decrypt(intermediate.data);
        } else {
          decryptedData = EncryptionService.decrypt(backupWrapper.encrypted);
        }
      } catch (error) {
        throw new Error('Impossible de déchiffrer la sauvegarde. Vérifiez le mot de passe.');
      }

      const backupData: BackupData = decryptedData;

      // Valider la structure
      if (!backupData.version || !backupData.timestamp) {
        throw new Error('Format de sauvegarde invalide');
      }

      // Créer une sauvegarde de l'état actuel avant restauration
      await this.createSecureBackup();

      // Restaurer les données chiffrées dans le localStorage
      if (backupData.people) {
        SecureStorage.setItem('people', backupData.people);
      }
      if (backupData.territories) {
        SecureStorage.setItem('territories', backupData.territories);
      }
      if (backupData.assignments) {
        SecureStorage.setItem('assignments', backupData.assignments);
      }
      if (backupData.settings) {
        SecureStorage.setItem('appSettings', backupData.settings);
      }
      if (backupData.meetings) {
        SecureStorage.setItem('meetings', backupData.meetings);
      }

      AuditLog.log('BACKUP_RESTORED', 'user', {
        backupDate: backupData.timestamp,
        dataRestored: ['people', 'territories', 'assignments', 'settings', 'meetings']
      });

      return `Restauration réussie depuis la sauvegarde du ${new Date(backupData.timestamp).toLocaleDateString()}`;
    } catch (error) {
      AuditLog.log('BACKUP_RESTORE_FAILED', 'user', { error: String(error) });
      throw new Error(`Erreur lors de la restauration: ${error}`);
    }
  }

  /**
   * Exporter les données personnelles de l'utilisateur (GDPR Right of Access)
   */
  async exportPersonalData(): Promise<void> {
    try {
      const personalData = {
        exportDate: new Date().toISOString(),
        data: {
          people: this.getStoredData('people') || [],
          assignments: this.getStoredData('assignments') || [],
          settings: this.getStoredData('appSettings') || {},
        }
      };

      const dataString = JSON.stringify(personalData, null, 2);
      const blob = new Blob([dataString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `personal-data-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);

      AuditLog.log('DATA_EXPORT_GDPR', 'user', {
        type: 'personal_data_export',
        includesFields: Object.keys(personalData.data)
      });
    } catch (error) {
      throw new Error(`Erreur lors de l'exportation: ${error}`);
    }
  }

  /**
   * Supprimer toutes les données personnelles (GDPR Right to be Forgotten)
   */
  async deleteAllPersonalData(confirmationCode: string): Promise<void> {
    // Demander un code de confirmation pour éviter les suppression accidentelles
    if (confirmationCode !== 'DELETE_ALL_DATA_CONFIRM') {
      throw new Error('Code de confirmation invalide');
    }

    try {
      // Créer un dernier backup avant suppression
      await this.createSecureBackup();

      // Supprimer toutes les données
      SecureStorage.removeItem('people');
      SecureStorage.removeItem('territories');
      SecureStorage.removeItem('assignments');
      SecureStorage.removeItem('appSettings');
      SecureStorage.removeItem('meetings');
      SecureStorage.removeItem('audit_logs');

      AuditLog.log('DATA_DELETION_GDPR', 'user', {
        type: 'complete_data_deletion',
        timestamp: new Date().toISOString()
      });

      console.warn('Toutes les données personnelles ont été supprimées');
    } catch (error) {
      throw new Error(`Erreur lors de la suppression: ${error}`);
    }
  }

  /**
   * Synchronisation sécurisée avec le cloud
   */
  async autoSync(): Promise<void> {
    if (this.syncStatus.syncing || !this.syncStatus.isOnline) return;

    this.syncStatus.syncing = true;
    this.syncStatus.error = null;

    try {
      const localData = {
        people: this.getStoredData('people') || [],
        territories: this.getStoredData('territories') || [],
        assignments: this.getStoredData('assignments') || [],
        lastModified: Date.now(),
      };

      // TODO: Implémenter l'upload chiffré vers Supabase
      // Les données doivent rester chiffrées côté serveur
      await this.simulateCloudSync(localData);

      this.syncStatus.lastSync = new Date();
      this.syncStatus.pendingChanges = 0;
      
      AuditLog.log('CLOUD_SYNC_SUCCESS', 'system', { lastSync: this.syncStatus.lastSync });
    } catch (error) {
      this.syncStatus.error = `Erreur de synchronisation: ${error}`;
      AuditLog.log('CLOUD_SYNC_FAILED', 'system', { error: String(error) });
    } finally {
      this.syncStatus.syncing = false;
    }
  }

  private async simulateCloudSync(data: any): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (Math.random() < 0.1) {
      throw new Error('Échec temporaire de la synchronisation');
    }
    console.log('Données synchronisées de manière sécurisée');
  }

  markPendingChanges(count: number = 1): void {
    this.syncStatus.pendingChanges += count;
  }

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  async forcSync(): Promise<void> {
    await this.autoSync();
  }

  checkConnectivity(): boolean {
    return navigator.onLine;
  }

  private getStoredData(key: string): any {
    try {
      return SecureStorage.getItem(key);
    } catch {
      return null;
    }
  }

  /**
   * Obtenir les logs d'audit (GDPR compliance)
   */
  getAuditLogs(): any[] {
    return AuditLog.getLogs();
  }
}

/**
 * Hook personnalisé pour backup/sync sécurisé
 */
export function useSecureBackupSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    isOnline: navigator.onLine,
    pendingChanges: 0,
    syncing: false,
    error: null,
  });

  const service = SecureBackupSyncService.getInstance();

  const refreshStatus = useCallback(() => {
    setSyncStatus(service.getSyncStatus());
  }, [service]);

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 5000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  return {
    syncStatus,
    createSecureBackup: (password?: string) => service.createSecureBackup(password),
    restoreFromSecureBackup: (file: File, password?: string) => service.restoreFromSecureBackup(file, password),
    exportPersonalData: () => service.exportPersonalData(),
    deleteAllPersonalData: (code: string) => service.deleteAllPersonalData(code),
    forceSync: async () => {
      await service.forcSync();
      refreshStatus();
    },
    markPendingChanges: (count?: number) => {
      service.markPendingChanges(count);
      refreshStatus();
    },
    refreshStatus,
    getAuditLogs: () => service.getAuditLogs(),
  };
}

export default SecureBackupSyncService;
