import { supabase } from '../config/supabase';
import { handleSupabaseError } from './supabaseUtils';
import toast from 'react-hot-toast';

interface SyncQueueItem {
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  retryCount: number;
}

export class SyncManager {
  private static instance: SyncManager;
  private queue: Map<string, SyncQueueItem> = new Map();
  private maxRetries = 3;
  private processingQueue = false;
  private offlineMode = false;

  private constructor() {
    // Only initialize offline detection in browser environment
    if (typeof window !== 'undefined') {
      this.initializeOfflineDetection();
    }
  }

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

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
        toast.warning('You are offline. Changes will be synced when connection is restored.');
      }
    });
  }

  async syncData(
    key: string,
    table: string,
    operation: 'insert' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    this.queue.set(key, {
      table,
      operation,
      data,
      retryCount: 0
    });

    if (!this.offlineMode) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.offlineMode) {
      return;
    }

    this.processingQueue = true;

    try {
      for (const [key, item] of this.queue) {
        try {
          await this.performSync(key, item);
          this.queue.delete(key);
        } catch (error) {
          if (!this.shouldRetry(item)) {
            this.queue.delete(key);
            toast.error(`Failed to sync data after ${this.maxRetries} attempts`);
          }
        }
      }
    } finally {
      this.processingQueue = false;
    }
  }

  private async performSync(key: string, item: SyncQueueItem): Promise<void> {
    try {
      let error;

      switch (item.operation) {
        case 'insert':
          ({ error } = await supabase
            .from(item.table)
            .insert(item.data));
          break;

        case 'update':
          ({ error } = await supabase
            .from(item.table)
            .update(item.data)
            .eq('id', item.data.id));
          break;

        case 'delete':
          ({ error } = await supabase
            .from(item.table)
            .delete()
            .eq('id', item.data.id));
          break;
      }

      if (error) {
        throw error;
      }

      toast.success('Data synchronized successfully');
    } catch (error) {
      item.retryCount++;
      if (this.shouldRetry(item)) {
        await new Promise(resolve => setTimeout(resolve, 1000 * item.retryCount));
        throw error;
      } else {
        await handleSupabaseError(error);
      }
    }
  }

  private shouldRetry(item: SyncQueueItem): boolean {
    return item.retryCount < this.maxRetries;
  }

  public getPendingOperations(): number {
    return this.queue.size;
  }

  public clearQueue(): void {
    this.queue.clear();
  }
} 