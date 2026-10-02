export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: PushSubscriptionKeys;
  expirationTime?: number | null;
}

export interface NotificationPreferences {
  latitude?: number;
  longitude?: number;
  floorElevationM?: number;
  c13AlertEnabled?: boolean;
  waterLevelAlertEnabled?: boolean;
}

export interface StoredSubscription {
  id: string;
  endpoint: string;
  keys: PushSubscriptionKeys;
  createdAt: string;
  updatedAt: string;
  preferences: NotificationPreferences;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  timestamp?: number;
}
