import fs from "fs";
import path from "path";
import type { StoredSubscription } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "push_subscriptions.json");

// In-memory fallback / cache
const memorySubscriptions: Map<string, StoredSubscription> = new Map();
let isInitialized = false;

function loadFromDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      const list: StoredSubscription[] = JSON.parse(content);
      memorySubscriptions.clear();
      for (const item of list) {
        memorySubscriptions.set(item.endpoint, item);
      }
    }
  } catch (err) {
    console.error("[Storage] Failed to read push subscriptions from disk:", err);
  }
  isInitialized = true;
}

function saveToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const list = Array.from(memorySubscriptions.values());
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    // In serverless read-only filesystem environments, memory cache is used
    console.warn("[Storage] Could not write to disk (likely serverless environment):", err);
  }
}

function ensureInit(): void {
  if (!isInitialized) {
    loadFromDisk();
  }
}

export async function saveSubscription(sub: StoredSubscription): Promise<void> {
  ensureInit();
  memorySubscriptions.set(sub.endpoint, sub);
  saveToDisk();
}

export async function removeSubscription(endpoint: string): Promise<boolean> {
  ensureInit();
  const deleted = memorySubscriptions.delete(endpoint);
  if (deleted) {
    saveToDisk();
  }
  return deleted;
}

export async function getAllSubscriptions(): Promise<StoredSubscription[]> {
  ensureInit();
  return Array.from(memorySubscriptions.values());
}

export async function cleanInvalidSubscriptions(invalidEndpoints: string[]): Promise<void> {
  if (!invalidEndpoints.length) return;
  ensureInit();
  let modified = false;
  for (const ep of invalidEndpoints) {
    if (memorySubscriptions.delete(ep)) {
      modified = true;
    }
  }
  if (modified) {
    saveToDisk();
  }
}
