import { supabase } from '../config/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { handleSupabaseError } from './supabaseUtils';
import toast from 'react-hot-toast';

export class RealtimeManager {
  private static instance: RealtimeManager;
  private subscriptions: Map<string, RealtimeChannel> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1 second

  private constructor() {}

  public static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }
    return RealtimeManager.instance;
  }

  async subscribe(
    channel: string,
    event: string,
    callback: (payload: any) => void
  ): Promise<void> {
    try {
      const subscription = supabase
        .channel(channel)
        .on('postgres_changes', { event: event as any, schema: 'public', table: channel }, (payload: any) => {
          callback(payload);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {

            this.reconnectAttempts.set(channel, 0);
          } else if (status === 'CLOSED') {
            await this.handleDisconnect(channel, event, callback);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Channel error for ${channel}`);
            await this.handleDisconnect(channel, event, callback);
          }
        });

      this.subscriptions.set(channel, subscription);
    } catch (error) {
      await handleSupabaseError(error);
    }
  }

  private async handleDisconnect(
    channel: string,
    event: string,
    callback: (payload: any) => void
  ): Promise<void> {
    const attempts = this.reconnectAttempts.get(channel) || 0;

    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts.set(channel, attempts + 1);
      await new Promise(resolve => setTimeout(resolve, this.reconnectDelay * (attempts + 1)));
      await this.resubscribe(channel, event, callback);
    } else {
      toast.error(`Failed to reconnect to ${channel} after ${this.maxReconnectAttempts} attempts`);
      this.unsubscribe(channel);
    }
  }

  private async resubscribe(
    channel: string,
    event: string,
    callback: (payload: any) => void
  ): Promise<void> {
    this.unsubscribe(channel);
    await this.subscribe(channel, event, callback);
  }

  public unsubscribe(channel: string): void {
    const subscription = this.subscriptions.get(channel);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(channel);
      this.reconnectAttempts.delete(channel);
    }
  }

  public unsubscribeAll(): void {
    for (const channel of this.subscriptions.keys()) {
      this.unsubscribe(channel);
    }
  }

  public getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }
} 