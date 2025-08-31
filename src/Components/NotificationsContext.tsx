// src/Components/NotificationsContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

// NotificationsContext.tsx
export type NotificationType = "poll" | "message" | "inbox" | "calendar"; // etc.


export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
}

interface NotificationsContextType {
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'read'>) => void;
  markRead: (type: NotificationType) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = ({ id, type, message }: Omit<Notification, 'read'>) => {
    setNotifications(n => [{ id, type, message, read: false }, ...n]);
  };

  const markRead = (type: NotificationType) => {
    setNotifications(n =>
      n.map(x => (x.type === type ? { ...x, read: true } : x))
    );
  };

  return (
    <NotificationsContext.Provider value={{ notifications, addNotification, markRead }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationsProvider');
  return ctx;
};
