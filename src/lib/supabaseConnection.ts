import { supabase } from '../config/supabase';
import { SupabaseError, handleSupabaseError } from './supabaseUtils';
import toast from 'react-hot-toast';

export class SupabaseConnectionManager {
  private static instance: SupabaseConnectionManager;
  private retryCount = 0;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  private isNodeEnvironment: boolean;

  private constructor() {
    this.isNodeEnvironment = typeof window === 'undefined';
    if (!this.isNodeEnvironment) {
      this.startConnectionMonitoring();
    }
  }

  public static getInstance(): SupabaseConnectionManager {
    if (!SupabaseConnectionManager.instance) {
      SupabaseConnectionManager.instance = new SupabaseConnectionManager();
    }
    return SupabaseConnectionManager.instance;
  }

  async checkConnection(): Promise<boolean> {
    try {
      const tables = ['profiles', 'exercises', 'fms_assessments'];
      const checks = await Promise.all(
        tables.map(table => 
          supabase.from(table).select('count').limit(1)
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
        console.log('Database connection restored');
      }
      
      return !hasErrors;
    } catch (error) {
      await this.handleConnectionError(error);
      return false;
    }
  }

  private async handleConnectionError(error: any) {
    this.connectionStatus = 'disconnected';
    
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
      throw new SupabaseError('Connection failed after max retries', 'CONNECTION_FAILED', error);
    }
  }

  private async reconnect() {
    this.connectionStatus = 'connecting';
    
    await new Promise(resolve => setTimeout(resolve, this.retryDelay * this.retryCount));
    
    try {
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        throw new Error('Reconnection failed');
      }
    } catch (error) {
      await handleSupabaseError(error);
    }
  }

  private startConnectionMonitoring() {
    if (this.isNodeEnvironment) return;
    
    // Check connection every 30 seconds
    this.connectionCheckInterval = setInterval(async () => {
      await this.checkConnection();
    }, 30000);
  }

  public stopConnectionMonitoring() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  public getConnectionStatus(): string {
    return this.connectionStatus;
  }
} 