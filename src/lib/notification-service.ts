import { useState, useEffect, useCallback } from 'react';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

export type NotificationType = 
  | 'assignment_reminder'
  | 'meeting_reminder' 
  | 'territory_overdue'
  | 'report_due'
  | 'system_update';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  dueDate?: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationRule {
  type: NotificationType;
  daysBeforeDue: number;
  enabled: boolean;
  recipients: string[]; // User IDs
}

class NotificationService {
  private static instance: NotificationService;
  private notifications: Notification[] = [];
  private rules: NotificationRule[] = [
    {
      type: 'assignment_reminder',
      daysBeforeDue: 3,
      enabled: true,
      recipients: []
    },
    {
      type: 'meeting_reminder',
      daysBeforeDue: 1,
      enabled: true,
      recipients: []
    },
    {
      type: 'territory_overdue',
      daysBeforeDue: 0,
      enabled: true,
      recipients: []
    }
  ];

  static getInstance(): NotificationService {
    if (!this.instance) {
      this.instance = new NotificationService();
    }
    return this.instance;
  }

  // Créer une notification
  createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): string {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      read: false,
    };

    this.notifications.unshift(newNotification);
    this.saveNotifications();
    
    // Déclencher les notifications browser si supportées
    this.showBrowserNotification(newNotification);
    
    return newNotification.id;
  }

  // Vérifier les assignations à venir
  checkUpcomingAssignments(assignments: any[]): void {
    const rule = this.rules.find(r => r.type === 'assignment_reminder');
    if (!rule?.enabled) return;

    const warningDate = addDays(new Date(), rule.daysBeforeDue);

    assignments.forEach(assignment => {
      if (assignment.date && isBefore(assignment.date, warningDate)) {
        const existingNotif = this.notifications.find(n => 
          n.type === 'assignment_reminder' && 
          n.metadata?.assignmentId === assignment.id
        );

        if (!existingNotif) {
          this.createNotification({
            type: 'assignment_reminder',
            title: 'Assignation Prochaine',
            message: `Vous avez une assignation "${assignment.title}" le ${format(assignment.date, 'dd/MM/yyyy', { locale: fr })}`,
            priority: 'medium',
            dueDate: assignment.date,
            actionUrl: `/programme/reunion-vie-ministere`,
            metadata: { assignmentId: assignment.id }
          });
        }
      }
    });
  }

  // Vérifier les territoires en retard
  checkOverdueTerritories(territories: any[]): void {
    const rule = this.rules.find(r => r.type === 'territory_overdue');
    if (!rule?.enabled) return;

    const today = startOfDay(new Date());

    territories.forEach(territory => {
      if (territory.expectedCompletionDate && isBefore(territory.expectedCompletionDate, today)) {
        const existingNotif = this.notifications.find(n => 
          n.type === 'territory_overdue' && 
          n.metadata?.territoryId === territory.id
        );

        if (!existingNotif) {
          this.createNotification({
            type: 'territory_overdue',
            title: 'Territoire en Retard',
            message: `Le territoire ${territory.number} (${territory.location}) est en retard`,
            priority: 'high',
            actionUrl: `/territories`,
            metadata: { territoryId: territory.id }
          });
        }
      }
    });
  }

  // Afficher notification browser
  private showBrowserNotification(notification: Notification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
      });
    }
  }

  // Demander permission notifications
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    
    if (Notification.permission === 'granted') return true;
    
    if (Notification.permission === 'denied') return false;
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Marquer comme lu
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  // Marquer tout comme lu
  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
  }

  // Supprimer notification
  removeNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
  }

  // Obtenir toutes les notifications
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  // Obtenir notifications non lues
  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  // Obtenir nombre de notifications non lues
  getUnreadCount(): number {
    return this.getUnreadNotifications().length;
  }

  // Sauvegarder dans localStorage
  private saveNotifications(): void {
    try {
      localStorage.setItem('app_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Erreur sauvegarde notifications:', error);
    }
  }

  // Charger depuis localStorage
  loadNotifications(): void {
    try {
      const saved = localStorage.getItem('app_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.notifications = parsed.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          dueDate: n.dueDate ? new Date(n.dueDate) : undefined,
        }));
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  }
}

// Hook personnalisé pour les notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const service = NotificationService.getInstance();

  const refreshNotifications = useCallback(() => {
    setNotifications(service.getNotifications());
    setUnreadCount(service.getUnreadCount());
  }, [service]);

  useEffect(() => {
    service.loadNotifications();
    refreshNotifications();
  }, [refreshNotifications, service]);

  const markAsRead = useCallback((notificationId: string) => {
    service.markAsRead(notificationId);
    refreshNotifications();
  }, [service, refreshNotifications]);

  const markAllAsRead = useCallback(() => {
    service.markAllAsRead();
    refreshNotifications();
  }, [service, refreshNotifications]);

  const removeNotification = useCallback((notificationId: string) => {
    service.removeNotification(notificationId);
    refreshNotifications();
  }, [service, refreshNotifications]);

  const createNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const id = service.createNotification(notification);
    refreshNotifications();
    return id;
  }, [service, refreshNotifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    createNotification,
    refreshNotifications,
    service, // Exposer le service pour les vérifications automatiques
  };
}

export default NotificationService;