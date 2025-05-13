'use client';

interface StorageOptions {
  persistKey: string;
  defaultValue?: unknown;
}

export class Storage {
  private static instance: Storage;
  private options: StorageOptions;

  private constructor(options: StorageOptions) {
    this.options = options;
  }

  static getInstance(options: StorageOptions): Storage {
    if (!Storage.instance) {
      Storage.instance = new Storage(options);
    }
    return Storage.instance;
  }

  save<T>(data: T): void {
    if (typeof window === 'undefined') return;

    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(this.options.persistKey, serialized);
    } catch (error) {
      console.error(`Failed to save data to storage (${this.options.persistKey}):`, error);
    }
  }

  load<T>(): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const serialized = localStorage.getItem(this.options.persistKey);
      if (!serialized) return this.options.defaultValue as T ?? null;
      return JSON.parse(serialized) as T;
    } catch (error) {
      console.error(`Failed to load data from storage (${this.options.persistKey}):`, error);
      return this.options.defaultValue as T ?? null;
    }
  }

  clear(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.options.persistKey);
    } catch (error) {
      console.error(`Failed to clear storage (${this.options.persistKey}):`, error);
    }
  }
} 