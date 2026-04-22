import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

// Types
interface SyncQueueItem {
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  retryCount: number;
}

// Define payload types for better type safety
type RealtimePayload = {
  new: Record<string, unknown>;
  old: Record<string, unknown>;
  [key: string]: unknown;
};

type RealtimeSubscriptionStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR';

/**
 * Unified Supabase Manager class that handles connection monitoring,
 * realtime subscriptions, and data synchronization
 */
export class SupabaseManager {
  private static instance: SupabaseManager;
  private client: SupabaseClient;

  // Connection monitoring
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  private retryCount = 0;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  // Realtime subscriptions
  private subscriptions: Map<string, RealtimeChannel> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1 second

  // Sync queue
  private syncQueue: Map<string, SyncQueueItem> = new Map();
  private processingQueue = false;
  private offlineMode = false;

  // Environment detection
  private isNodeEnvironment: boolean;

  private constructor(supabaseClient: SupabaseClient) {
    this.client = supabaseClient;
    this.isNodeEnvironment = typeof window === 'undefined';

    if (!this.isNodeEnvironment) {
      this.startConnectionMonitoring();
      this.initializeOfflineDetection();
    }
  }

  /**
   * Get the singleton instance of SupabaseManager
   */
  public static getInstance(supabaseClient: SupabaseClient): SupabaseManager {
    if (!SupabaseManager.instance) {
      SupabaseManager.instance = new SupabaseManager(supabaseClient);
    }
    return SupabaseManager.instance;
  }

  /**
   * Check if the Supabase connection is working
   */
  async checkConnection(): Promise<boolean> {
    try {
      const tables = ['profiles', 'exercises', 'fms_assessments', 'appointments', 'appointment_bookings'];
      const checks = await Promise.all(
        tables.map(table => 
          this.client.from(table).select('count').limit(1)
        )
      );

      const hasErrors = checks.some(result => 
        result.error && !['42P01', '42P17'].includes(result.error.code)
      );

      if (!hasErrors && this.connectionStatus !== 'connected') {
        this.connectionStatus = 'connected';
        this.retryCount = 0;
        if (!this.isNodeEnvironment && typeof toast !== 'undefined') {
          toast.success('Database connection restored');
        }

      }

      return !hasErrors;
    } catch (connectionError) {
      await this.handleConnectionError(connectionError);
      return false;
    }
  }

  /**
   * Handle connection errors with retry logic
   */
  private async handleConnectionError(error: unknown) {
    this.connectionStatus = 'disconnected';

    // Log the actual error for debugging
    console.error('Database connection error:', error);

    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      const message = `Connection lost. Retrying (${this.retryCount}/${this.maxRetries})...`;
      if (!this.isNodeEnvironment && typeof toast !== 'undefined') {
        toast.error(message);
      }
      console.error(message);
      await this.reconnect();
    } else {
      const message = 'Connection failed after max retries';
      if (!this.isNodeEnvironment && typeof toast !== 'undefined') {
        toast.error(message);
      }
      console.error(message);
      throw new Error('Connection failed after max retries');
    }
  }

  /**
   * Attempt to reconnect to Supabase
   */
  private async reconnect() {
    this.connectionStatus = 'connecting';

    await new Promise(resolve => setTimeout(resolve, this.retryDelay * this.retryCount));

    try {
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        throw new Error('Reconnection failed');
      }
    } catch (reconnectError) {
      console.error('Reconnection error:', reconnectError);
    }
  }

  /**
   * Start periodic connection monitoring
   */
  private startConnectionMonitoring() {
    if (this.isNodeEnvironment) return;

    // Check connection every 30 seconds
    this.connectionCheckInterval = setInterval(async () => {
      await this.checkConnection();
    }, 30000);
  }

  /**
   * Stop connection monitoring
   */
  public stopConnectionMonitoring() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  /**
   * Get the current connection status
   */
  public getConnectionStatus(): string {
    return this.connectionStatus;
  }

  private getSubscriptionKey(channel: string, event: string): string {
    return `${channel}:${event}`;
  }

  private parseRealtimeChannel(channel: string): { schema: string; table: string } {
    const [schema, table] = channel.split(':');
    if (schema && table) {
      return { schema, table };
    }

    return { schema: 'public', table: channel };
  }

  /**
   * Subscribe to a realtime channel
   */
  async subscribe(
    channel: string,
    event: string,
    callback: (payload: RealtimePayload) => void
  ): Promise<void> {
    try {
      const subscriptionKey = this.getSubscriptionKey(channel, event);
      const { schema, table } = this.parseRealtimeChannel(channel);
      const realtimeChannelName = `realtime:${schema}:${table}:${event.toLowerCase()}`;

      // Remove any stale subscription before creating a new one.
      this.unsubscribe(subscriptionKey);

      // Create a subscription handler that can handle async operations
      const handleStatus = async (status: RealtimeSubscriptionStatus) => {
        if (status === 'SUBSCRIBED') {

          this.reconnectAttempts.set(subscriptionKey, 0);

          // We don't need to set up listeners here as they're already set up below
        } else if (status === 'CLOSED') {
          await this.handleSubscriptionDisconnect(channel, event, callback);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Channel error for ${subscriptionKey}`);
          await this.handleSubscriptionDisconnect(channel, event, callback);
        }
      };

      // Create the channel
      const subscription = this.client.channel(realtimeChannelName);

      // Set up the table change listener
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subscription.on(
        'postgres_changes' as any,
        { event: event as '*' | 'INSERT' | 'UPDATE' | 'DELETE', schema, table },
        (payload: Record<string, unknown>) => {
          callback(payload as RealtimePayload);
        }
      );

      // Subscribe to the channel with our async handler
      await subscription.subscribe(handleStatus);

      this.subscriptions.set(subscriptionKey, subscription);
    } catch (error) {
      console.error('Subscription error:', error);
    }
  }

  /**
   * Handle subscription disconnects with retry logic
   */
  private async handleSubscriptionDisconnect(
    channel: string,
    event: string,
    callback: (payload: RealtimePayload) => void
  ): Promise<void> {
    const subscriptionKey = this.getSubscriptionKey(channel, event);
    const attempts = this.reconnectAttempts.get(subscriptionKey) || 0;

    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts.set(subscriptionKey, attempts + 1);
      await new Promise(resolve => setTimeout(resolve, this.reconnectDelay * (attempts + 1)));
      await this.resubscribe(channel, event, callback);
    } else {
      toast.error(`Failed to reconnect to ${subscriptionKey} after ${this.maxReconnectAttempts} attempts`);
      this.unsubscribe(subscriptionKey);
    }
  }

  /**
   * Resubscribe to a channel
   */
  private async resubscribe(
    channel: string,
    event: string,
    callback: (payload: RealtimePayload) => void
  ): Promise<void> {
    this.unsubscribe(this.getSubscriptionKey(channel, event));
    await this.subscribe(channel, event, callback);
  }

  /**
   * Unsubscribe from a channel
   */
  public unsubscribe(subscriptionKey: string): void {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
      this.reconnectAttempts.delete(subscriptionKey);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  public unsubscribeAll(): void {
    for (const channel of this.subscriptions.keys()) {
      this.unsubscribe(channel);
    }
  }

  /**
   * Get a list of active subscriptions
   */
  public getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Initialize offline detection
   */
  private initializeOfflineDetection() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.offlineMode = false;
      this.processQueue();
      if (typeof toast !== 'undefined') {
        toast.success('Connection restored. Syncing data...');
      }
    });

    window.addEventListener('offline', () => {
      this.offlineMode = true;
      if (typeof toast !== 'undefined') {
        toast.error('You are offline. Changes will be synced when connection is restored.');
      }
    });
  }

  /**
   * Add an item to the sync queue
   */
  async syncData(
    key: string,
    table: string,
    operation: 'insert' | 'update' | 'delete',
    data: Record<string, unknown>
  ): Promise<void> {
    this.syncQueue.set(key, {
      table,
      operation,
      data,
      retryCount: 0
    });

    if (!this.offlineMode) {
      await this.processQueue();
    }
  }

  /**
   * Process the sync queue
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.offlineMode) {
      return;
    }

    this.processingQueue = true;

    try {
      for (const [key, item] of this.syncQueue) {
        try {
          await this.performSync(key, item);
          this.syncQueue.delete(key);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_syncError) {
          if (!this.shouldRetry(item)) {
            this.syncQueue.delete(key);
            toast.error(`Failed to sync data after ${this.maxRetries} attempts`);
          }
        }
      }
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Perform a sync operation
   */
  private async performSync(_key: string, item: SyncQueueItem): Promise<void> {
    try {
      let result;

      switch (item.operation) {
        case 'insert':
          result = await this.client
            .from(item.table)
            .insert(item.data);
          break;

        case 'update':
          result = await this.client
            .from(item.table)
            .update(item.data)
            .eq('id', item.data.id as string);
          break;

        case 'delete':
          result = await this.client
            .from(item.table)
            .delete()
            .eq('id', item.data.id as string);
          break;
      }

      if (result?.error) {
        throw result.error;
      }

      toast.success('Data synchronized successfully');
    } catch (error) {
      item.retryCount++;
      if (this.shouldRetry(item)) {
        await new Promise(resolve => setTimeout(resolve, 1000 * item.retryCount));
        throw error;
      } else {
        console.error('Sync error:', error);
      }
    }
  }

  /**
   * Check if a sync operation should be retried
   */
  private shouldRetry(item: SyncQueueItem): boolean {
    return item.retryCount < this.maxRetries;
  }

  /**
   * Get the number of pending sync operations
   */
  public getPendingOperations(): number {
    return this.syncQueue.size;
  }

  /**
   * Clear the sync queue
   */
  public clearQueue(): void {
    this.syncQueue.clear();
  }

  /**
   * Clean up all resources
   */
  public cleanup(): void {
    this.stopConnectionMonitoring();
    this.unsubscribeAll();
    this.clearQueue();
  }
}

// Export the class only, not an instance
// The instance will be created in supabase.ts after the client is initialized
