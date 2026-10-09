import { Campaign, Incident, IntelligenceSummary, Investigation } from '@/types';
import demoData from '@/data/demo-incidents.json';

/**
 * Interface contract for Campaign and Incident persistence.
 * Ready for drop-in Firestore implementation in Phase 2.
 */
export interface IDataRepository {
  getIntelligenceSummary(): Promise<IntelligenceSummary>;
  getCampaigns(): Promise<Campaign[]>;
  getCampaignById(idOrCode: string): Promise<Campaign | null>;
  getIncidentsByCampaignId(campaignId: string): Promise<Incident[]>;
  getAllIncidents(): Promise<Incident[]>;
  createInvestigation(targetUrl: string, contextText?: string): Promise<Investigation>;
}

/**
 * Mock / In-Memory implementation backed by synthetic demonstration data.
 * Adheres strictly to the rule: "Do not invent scan results. Do not create fake working security APIs."
 */
export class SyntheticDemoRepository implements IDataRepository {
  private summary: IntelligenceSummary;
  private campaigns: Campaign[];
  private incidents: Incident[];

  constructor() {
    this.summary = demoData.summary as IntelligenceSummary;
    this.campaigns = demoData.campaigns as Campaign[];
    this.incidents = (demoData as { incidents?: Incident[] }).incidents || [];
  }

  async getIntelligenceSummary(): Promise<IntelligenceSummary> {
    return { ...this.summary };
  }

  async getCampaigns(): Promise<Campaign[]> {
    return [...this.campaigns];
  }

  async getCampaignById(idOrCode: string): Promise<Campaign | null> {
    const normalized = idOrCode.toLowerCase().trim();
    const found = this.campaigns.find(
      (c) => c.id.toLowerCase() === normalized || c.code.toLowerCase() === normalized
    );
    return found ? { ...found } : null;
  }

  async getIncidentsByCampaignId(campaignId: string): Promise<Incident[]> {
    return this.incidents.filter(
      (inc) => inc.campaignId?.toLowerCase() === campaignId.toLowerCase()
    );
  }

  async getAllIncidents(): Promise<Incident[]> {
    return [...this.incidents];
  }

  async createInvestigation(targetUrl: string, contextText?: string): Promise<Investigation> {
    const id = `inv-${Date.now().toString(36)}`;
    return {
      id,
      targetUrl,
      contextText,
      screenshotProvided: false,
      status: 'engine_standby',
      stageMessage: 'Investigation engine is being initialized.',
      createdAt: new Date().toISOString(),
      demoNotice: 'Demonstration State: Signal extraction and Gemini AI correlation engine pipeline prepared for Phase 2.',
    };
  }
}

/**
 * Prepared Firestore repository adapter stub.
 * Ready for Google Cloud Run + Firestore connection in Phase 2.
 */
export class FirestoreRepositoryStub implements IDataRepository {
  private fallback = new SyntheticDemoRepository();

  async getIntelligenceSummary(): Promise<IntelligenceSummary> {
    // In Phase 2: return firestore.collection('metrics').doc('summary').get()
    return this.fallback.getIntelligenceSummary();
  }

  async getCampaigns(): Promise<Campaign[]> {
    // In Phase 2: return firestore.collection('campaigns').orderBy('lastActive', 'desc').get()
    return this.fallback.getCampaigns();
  }

  async getCampaignById(idOrCode: string): Promise<Campaign | null> {
    // In Phase 2: query firestore where 'code' == idOrCode or doc(idOrCode)
    return this.fallback.getCampaignById(idOrCode);
  }

  async getIncidentsByCampaignId(campaignId: string): Promise<Incident[]> {
    // In Phase 2: firestore.collection('incidents').where('campaignId', '==', campaignId).get()
    return this.fallback.getIncidentsByCampaignId(campaignId);
  }

  async getAllIncidents(): Promise<Incident[]> {
    // In Phase 2: firestore.collection('incidents').get()
    return this.fallback.getAllIncidents();
  }

  async createInvestigation(targetUrl: string, contextText?: string): Promise<Investigation> {
    // In Phase 2: firestore.collection('investigations').add(...)
    return this.fallback.createInvestigation(targetUrl, contextText);
  }
}

// Data repository singleton instance
export const dataRepository: IDataRepository = process.env.USE_FIRESTORE === 'true'
  ? new FirestoreRepositoryStub()
  : new SyntheticDemoRepository();
