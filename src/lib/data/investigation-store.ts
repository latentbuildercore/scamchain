import { InvestigationRecord } from '@/types';
import fs from 'fs';
import path from 'path';

let firestoreInstance: any = null;
let firestoreInitialized = false;

// Initialize Firestore lazily if credentials/project are configured
function getFirestore() {
  if (firestoreInitialized) return firestoreInstance;
  firestoreInitialized = true;

  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    if (projectId && projectId !== 'scamchain-hackathon-2026') {
      const { Firestore } = require('@google-cloud/firestore');
      firestoreInstance = new Firestore({
        projectId,
        databaseId: process.env.FIRESTORE_DATABASE_ID || '(default)',
      });
      console.log(`[Firestore] Initialized for project: ${projectId}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[Firestore] Cloud client initialization skipped (development mode): ${message}`);
    firestoreInstance = null;
  }

  return firestoreInstance;
}

// In-memory fallback registry for development
const localCache = new Map<string, InvestigationRecord>();
const cacheFilePath = path.join(process.cwd(), 'data', 'investigations-cache.json');

// Preload local cache from file if it exists
function loadLocalCache() {
  if (localCache.size > 0) return;
  try {
    if (fs.existsSync(cacheFilePath)) {
      const content = fs.readFileSync(cacheFilePath, 'utf-8');
      const parsed = JSON.parse(content) as InvestigationRecord[];
      for (const rec of parsed) {
        localCache.set(rec.id, rec);
      }
    }
  } catch {
    // Ignore cache read failures
  }
}

function persistLocalCache() {
  try {
    const records = Array.from(localCache.values()).slice(-50); // Keep last 50
    const dir = path.dirname(cacheFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(cacheFilePath, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[InvestigationStore] Local cache persistence warning:', err);
  }
}

/**
 * Stores an investigation record to Firestore (/investigations) with graceful development fallback.
 */
export async function saveInvestigation(record: InvestigationRecord): Promise<{
  success: boolean;
  storageSource: 'firestore' | 'local_fallback';
}> {
  loadLocalCache();
  localCache.set(record.id, record);
  persistLocalCache();

  const firestore = getFirestore();
  if (firestore) {
    try {
      await firestore.collection('investigations').doc(record.id).set({
        id: record.id,
        createdAt: record.createdAt,
        url: record.url,
        normalizedUrl: record.normalizedUrl,
        classification: record.classification,
        confidence: record.confidence,
        observedSignals: record.observedSignals,
        threatIntelligence: record.threatIntelligence,
        geminiAnalysis: record.geminiAnalysis,
        websiteDNA: record.websiteDNA,
        campaignIds: record.campaignIds,
        campaignRelationship: record.campaignRelationship || '',
        recommendations: record.recommendations,
      });

      return { success: true, storageSource: 'firestore' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[Firestore] Save failed, fallback engaged: ${message}`);
    }
  }

  return { success: true, storageSource: 'local_fallback' };
}

/**
 * Retrieves an investigation record by ID.
 */
export async function getInvestigationById(id: string): Promise<InvestigationRecord | null> {
  loadLocalCache();

  const firestore = getFirestore();
  if (firestore) {
    try {
      const doc = await firestore.collection('investigations').doc(id).get();
      if (doc.exists) {
        return doc.data() as InvestigationRecord;
      }
    } catch {
      // Fall through to local cache
    }
  }

  return localCache.get(id) || null;
}
