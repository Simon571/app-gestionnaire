import { useState, useEffect, useCallback } from 'react';

export interface BackupData {
  version: string;
  timestamp: Date;
  people: any[];
  territories: any[];
  assignments: any[];
  settings: any;
  meetings: any[];
}

export interface SyncStatus {
  lastSync: Date | null;
  isOnline: boolean;
  pendingChanges: number;
  syncing: boolean;
  error: string | null;
}

class BackupSyncService {
  private static instance: BackupSyncService;
  private syncStatus: SyncStatus = {
    lastSync: null,
    isOnline: navigator.onLine,
    pendingChanges: 0,
    syncing: false,
    error: null,
  };

  static getInstance(): BackupSyncService {
    if (!this.instance) {
      this.instance = new BackupSyncService();
    }
    return this.instance;
  }

  constructor() {
    // Écouter les changements de connexion
    window.addEventListener('online', () => {
      this.syncStatus.isOnline = true;
      this.autoSync();
    });

    window.addEventListener('offline', () => {
      this.syncStatus.isOnline = false;
    });

    // Auto-sync périodique
    setInterval(() => {
      if (this.syncStatus.isOnline && this.syncStatus.pendingChanges > 0) {
        this.autoSync();
      }
    }, 300000); // 5 minutes
  }

  // Créer une sauvegarde complète
  async createBackup(): Promise<string> {
    try {
      const backupData: BackupData = {
        version: '1.0.0',
        timestamp: new Date(),
        people: this.getStoredData('people') || [],
        territories: this.getStoredData('territories') || [],
        assignments: this.getStoredData('assignments') || [],
        settings: this.getStoredData('appSettings') || {},
        meetings: this.getStoredData('meetings') || [],
      };

      const backupString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([backupString], { type: 'application/json' });
      
      // Créer un lien de téléchargement
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-assemblee-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      
      return 'Sauvegarde créée avec succès';
    } catch (error) {
      throw new Error(`Erreur lors de la création de la sauvegarde: ${error}`);
    }
  }

  // Restaurer depuis une sauvegarde
  async restoreFromBackup(file: File): Promise<string> {
    try {
      const text = await file.text();
      const backupData: BackupData = JSON.parse(text);
      
      // Valider la structure
      if (!backupData.version || !backupData.timestamp) {
        throw new Error('Format de sauvegarde invalide');
      }

      // Sauvegarder l'état actuel avant restauration
      await this.createBackup();

      // Restaurer les données
      if (backupData.people) {
        localStorage.setItem('people', JSON.stringify(backupData.people));
      }
      if (backupData.territories) {
        localStorage.setItem('territories', JSON.stringify(backupData.territories));
      }
      if (backupData.assignments) {
        localStorage.setItem('assignments', JSON.stringify(backupData.assignments));
      }
      if (backupData.settings) {
        localStorage.setItem('appSettings', JSON.stringify(backupData.settings));
      }
      if (backupData.meetings) {
        localStorage.setItem('meetings', JSON.stringify(backupData.meetings));
      }

      return `Restauration réussie depuis la sauvegarde du ${new Date(backupData.timestamp).toLocaleDateString()}`;
    } catch (error) {
      throw new Error(`Erreur lors de la restauration: ${error}`);
    }
  }

  // Synchronisation automatique avec le cloud (Firebase/Supabase)
  async autoSync(): Promise<void> {
    if (this.syncStatus.syncing || !this.syncStatus.isOnline) return;

    this.syncStatus.syncing = true;
    this.syncStatus.error = null;

    try {
      // Récupérer les données locales
      const localData = {
        people: this.getStoredData('people') || [],
        territories: this.getStoredData('territories') || [],
        assignments: this.getStoredData('assignments') || [],
        lastModified: Date.now(),
      };

      // Simuler l'upload vers le cloud
      // TODO: Remplacer par vrai appel API
      await this.simulateCloudSync(localData);

      this.syncStatus.lastSync = new Date();
      this.syncStatus.pendingChanges = 0;
      
    } catch (error) {
      this.syncStatus.error = `Erreur de synchronisation: ${error}`;
    } finally {
      this.syncStatus.syncing = false;
    }
  }

  // Simulation de sync cloud (à remplacer par vraie implémentation)
  private async simulateCloudSync(data: any): Promise<void> {
    // Simuler délai réseau
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simuler erreur occasionnelle
    if (Math.random() < 0.1) {
      throw new Error('Échec temporaire de la synchronisation');
    }

    console.log('Données synchronisées:', data);
  }

  // Marquer des changements en attente
  markPendingChanges(count: number = 1): void {
    this.syncStatus.pendingChanges += count;
  }

  // Obtenir statut de sync
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Forcer la synchronisation
  async forcSync(): Promise<void> {
    await this.autoSync();
  }

  // Vérifier la connectivité
  checkConnectivity(): boolean {
    return navigator.onLine;
  }

  // Utilitaire pour récupérer données localStorage
  private getStoredData(key: string): any {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // Exportation de données spécifiques
  async exportData(dataType: 'people' | 'territories' | 'assignments' | 'all'): Promise<void> {
    try {
      let data: any;
      let filename: string;

      switch (dataType) {
        case 'people':
          data = this.getStoredData('people') || [];
          filename = 'personnes.json';
          break;
        case 'territories':
          data = this.getStoredData('territories') || [];
          filename = 'territoires.json';
          break;
        case 'assignments':
          data = this.getStoredData('assignments') || [];
          filename = 'assignations.json';
          break;
        default:
          await this.createBackup();
          return;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(`Erreur lors de l'exportation: ${error}`);
    }
  }
}

// Hook personnalisé pour backup/sync
export function useBackupSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    isOnline: navigator.onLine,
    pendingChanges: 0,
    syncing: false,
    error: null,
  });

  const service = BackupSyncService.getInstance();

  const refreshStatus = useCallback(() => {
    setSyncStatus(service.getSyncStatus());
  }, [service]);

  useEffect(() => {
    refreshStatus();
    
    // Mettre à jour le statut régulièrement
    const interval = setInterval(refreshStatus, 5000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  const createBackup = useCallback(async () => {
    return await service.createBackup();
  }, [service]);

  const restoreFromBackup = useCallback(async (file: File) => {
    const result = await service.restoreFromBackup(file);
    refreshStatus();
    return result;
  }, [service, refreshStatus]);

  const forceSync = useCallback(async () => {
    await service.forcSync();
    refreshStatus();
  }, [service, refreshStatus]);

  const exportData = useCallback(async (dataType: 'people' | 'territories' | 'assignments' | 'all') => {
    return await service.exportData(dataType);
  }, [service]);

  const markPendingChanges = useCallback((count?: number) => {
    service.markPendingChanges(count);
    refreshStatus();
  }, [service, refreshStatus]);

  return {
    syncStatus,
    createBackup,
    restoreFromBackup,
    forceSync,
    exportData,
    markPendingChanges,
    refreshStatus,
  };
}

export default BackupSyncService;