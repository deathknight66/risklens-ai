import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';
import crypto from 'crypto';

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION_NAME = 'risklens_incidents';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const VECTOR_SIZE = 1536; // OpenAI small embedding size

// Lazy init clients
let qdrantClient: QdrantClient | null = null;
let openai: OpenAI | null = null;

function getQdrant(): QdrantClient {
  if (!qdrantClient) qdrantClient = new QdrantClient({ url: QDRANT_URL });
  return qdrantClient;
}

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

export async function ensureCollectionExists() {
  const qdrant = getQdrant();
  try {
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME);
    if (!exists) {
      await qdrant.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: 'Cosine',
        },
      });
      console.log(`Created Qdrant collection: ${COLLECTION_NAME}`);
    }
  } catch (error) {
    console.error("Failed to ensure Qdrant collection:", error);
    // Ignore error, might be connection issue if Docker is not running
  }
}

export function generateFingerprint(summary: string, rootCauseTree: any[], mitreMappings: string[]): string {
  const rootCauseString = rootCauseTree.map(r => r.step).join("");
  const mitreString = [...mitreMappings].sort().join("");
  
  const hash = crypto.createHash('sha256');
  hash.update(summary + rootCauseString + mitreString);
  return hash.digest('hex');
}

// Convert hex to UUID format for Qdrant Point ID
function hexToUuid(hex: string): string {
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
}

export async function storeIncidentMemory(incidentId: string, orgId: string, analysisResult: any, logs: any[]) {
  // Only store high confidence incidents
  if ((analysisResult.analysisConfidence || 0) < 0.45) {
    console.log(`Skipping memory storage for ${incidentId} due to low confidence.`);
    return;
  }

  const fingerprint = generateFingerprint(
    analysisResult.attackSummary || "", 
    analysisResult.rootCauseTree || [], 
    analysisResult.mitreMappings || []
  );
  
  const pointId = hexToUuid(fingerprint);
  const qdrant = getQdrant();
  
  await ensureCollectionExists();

  try {
    // Deduplication check: check if fingerprint exists
    const existingPoints = await qdrant.retrieve(COLLECTION_NAME, {
      ids: [pointId]
    });

    if (existingPoints && existingPoints.length > 0) {
      // It exists -> Increment recurrence count
      const existing = existingPoints[0];
      const newRecurrenceCount = ((existing.payload?.recurrence_count as number) || 1) + 1;
      
      await qdrant.setPayload(COLLECTION_NAME, {
        points: [pointId],
        payload: {
          recurrence_count: newRecurrenceCount,
          last_seen: new Date().toISOString()
        }
      });
      console.log(`Incremented recurrence_count for fingerprint ${fingerprint} to ${newRecurrenceCount}`);
      return;
    }

    // Doesn't exist -> Generate new embedding
    const contentToEmbed = `Summary: ${analysisResult.attackSummary}\nRoot Cause: ${analysisResult.rootCauseTree?.map((r: any) => r.step).join(" -> ")}\nMITRE: ${analysisResult.mitreMappings?.join(", ")}`;
    
    const oai = getOpenAI();
    const embedResponse = await oai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: contentToEmbed
    });
    
    const vector = embedResponse.data[0].embedding;

    // Extract assets and IPs from logs for metadata
    const sourceIps = [...new Set(logs.map(l => l.source_ip).filter(Boolean))];
    const targetAssets = [...new Set(logs.map(l => l.target).filter(Boolean))];

    const payload = {
      incident_id: incidentId,
      organization_id: orgId,
      fingerprint: fingerprint,
      summary: analysisResult.attackSummary,
      root_cause: analysisResult.rootCauseTree,
      mitre: analysisResult.mitreMappings,
      source_ips: sourceIps,
      affected_assets: targetAssets,
      severity: "High", // Dynamic in real app
      timestamp: new Date().toISOString(),
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      recurrence_count: 1,
      embedding_model_version: EMBEDDING_MODEL
    };

    await qdrant.upsert(COLLECTION_NAME, {
      wait: true,
      points: [
        {
          id: pointId,
          vector: vector,
          payload: payload
        }
      ]
    });
    
    console.log(`Stored new incident memory for ${incidentId}`);

  } catch (error) {
    console.error("Error storing memory in Qdrant:", error);
  }
}

export async function searchSimilarIncidents(incidentId: string, orgId: string, currentAnalysis: any, currentLogs: any[]) {
  const qdrant = getQdrant();
  await ensureCollectionExists();

  try {
    const contentToEmbed = `Summary: ${currentAnalysis.attackSummary}\nRoot Cause: ${currentAnalysis.rootCauseTree?.map((r: any) => r.step).join(" -> ")}\nMITRE: ${currentAnalysis.mitreMappings?.join(", ")}`;
    
    const oai = getOpenAI();
    const embedResponse = await oai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: contentToEmbed
    });
    
    const vector = embedResponse.data[0].embedding;
    
    // Search Qdrant
    const searchResults = await qdrant.search(COLLECTION_NAME, {
      vector: vector,
      limit: 5,
      with_payload: true,
      // Do not return the exact same incident if it's already in DB, and scope to orgId
      filter: {
        must: [
          {
            key: "organization_id",
            match: { value: orgId }
          }
        ],
        must_not: [
          {
            key: "incident_id",
            match: { value: incidentId }
          }
        ]
      }
    });

    const currentIps = new Set(currentLogs.map(l => l.source_ip).filter(Boolean));
    const currentAssets = new Set(currentLogs.map(l => l.target).filter(Boolean));
    const currentMitre = new Set(currentAnalysis.mitreMappings || []);

    const enrichedResults = searchResults.map(result => {
      let score = result.score;
      
      const payload = result.payload || {};
      
      // Calculate Hybrid Bonus
      let bonus = 0;
      
      // Asset bonus
      const memoryAssets = payload.affected_assets as string[] || [];
      if (memoryAssets.some(a => currentAssets.has(a))) bonus += 0.1;

      // IP bonus
      const memoryIps = payload.source_ips as string[] || [];
      if (memoryIps.some(ip => currentIps.has(ip))) bonus += 0.15;

      // MITRE bonus
      const memoryMitre = payload.mitre as string[] || [];
      if (memoryMitre.some(m => currentMitre.has(m))) bonus += 0.2;

      // Calculate temporal decay
      const lastSeenStr = payload.last_seen as string || new Date().toISOString();
      const daysDiff = (new Date().getTime() - new Date(lastSeenStr).getTime()) / (1000 * 3600 * 24);
      const decay = Math.exp(-daysDiff / 30);
      
      const hybridScore = (score + bonus) * decay;
      
      const freq = (payload.recurrence_count as number) || 1;
      const recurrenceScore = freq * hybridScore; // User requested: frequency * similarity * recency

      return {
        ...result,
        hybridScore,
        recurrenceScore,
        classification: hybridScore >= 0.82 ? 'highly_similar' : (hybridScore >= 0.70 ? 'related' : 'ignored')
      };
    });

    return enrichedResults.filter(r => r.classification !== 'ignored');

  } catch (error) {
    console.error("Error searching memory in Qdrant:", error);
    return [];
  }
}
