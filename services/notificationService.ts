export type MedicalNotificationType = 'lab_result' | 'pending_task' | 'follow_up';

export interface MedicalNotification {
  type: MedicalNotificationType;
  patientId: string;
  urgency: 'low' | 'medium' | 'high';
  scheduledFor: Date;
}

const notificationTitles: Record<MedicalNotificationType, string> = {
  lab_result: 'Resultado de laboratorio listo',
  pending_task: 'Tarea pendiente',
  follow_up: 'Seguimiento programado',
};

const isNotificationSupported = () => typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) return false;

  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

const getRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isNotificationSupported()) return null;

  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.error('No se pudo obtener el service worker', error);
    return null;
  }
};

const triggerNotification = async (notification: MedicalNotification) => {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const registration = await getRegistration();
  if (!registration) return;

  const title = `MediDiario: ${notificationTitles[notification.type]}`;

  await registration.showNotification(title, {
    body: `Recordatorio para paciente ${notification.patientId}`,
    icon: '/icon.svg',
    badge: '/masked-icon.svg',
    tag: `${notification.type}-${notification.patientId}`,
    requireInteraction: notification.urgency === 'high',
    data: {
      patientId: notification.patientId,
      urgency: notification.urgency,
      scheduledFor: notification.scheduledFor?.toISOString?.() ?? null,
      type: notification.type,
    },
  });
};

export const scheduleNotification = async (notification: MedicalNotification) => {
  const delay = new Date(notification.scheduledFor).getTime() - Date.now();

  if (delay > 0) {
    window.setTimeout(() => {
      void triggerNotification(notification);
    }, delay);
  } else {
    await triggerNotification(notification);
  }
};
