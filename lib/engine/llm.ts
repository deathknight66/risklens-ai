import OpenAI from "openai";
import { z } from "zod";
import mitreData from "../mitre-techniques.json";

let client: OpenAI | null = null;

// Zod Schema for strict validation
const IncidentAnalysisSchema = z.object({
  attackSummary: z.string(),
  rootCauseTree: z.array(z.object({ step: z.string() })).min(0),
  timelineEvents: z.array(z.object({ time: z.string(), event: z.string() })).min(0),
  recommendedActions: z.array(z.string()).min(0),
  mitreMappings: z.array(z.string()).min(0),
  analysisConfidence: z.number().min(0).max(1)
});

// Scoring logic to prioritize suspicious logs
function scoreLog(log: any): number {
  let score = 0;
  const payload = (log.payload || "").toLowerCase();
  const status = String(log.status || "");
  const eventType = (log.event_type || "").toLowerCase();

  if (eventType === "login" && status !== "200") score += 5; // failed_auth
  if (payload.includes("sql") || payload.includes("select") || payload.includes("union") || payload.includes("drop")) score += 8; // sql_pattern
  if (payload.includes("curl") || payload.includes("wget") || payload.includes("nmap")) score += 4; // suspicious_user_agent
  if (status.startsWith("5")) score += 2; // 5xx errors
  if (eventType === "privilege_escalation" || payload.includes("chmod") || payload.includes("sudo")) score += 7; // privilege_change
  if (payload.includes("/api/admin") || payload.includes("/etc/passwd")) score += 4; // rare endpoint

  // Boost score slightly for anything that is not 200 just in case
  if (status !== "200" && status !== "") score += 1;
  
  return score;
}

export async function analyzeIncident(incident: any, logs: any[]) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY environment variable. Please set it to use the LLM engine.");
  }
  
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // 1. Context Truncation -> Score and Top 50
  let processedLogs = Array.isArray(logs) ? logs : [];
  if (processedLogs.length > 50) {
    processedLogs = processedLogs
      .map(log => ({ log, score: scoreLog(log) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
      .map(item => item.log);
    
    // Sort them back chronologically before sending to LLM for context coherence
    processedLogs.sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
  }

  const prompt = `
Analyze this cybersecurity incident.

Incident:
${JSON.stringify(incident)}

Logs:
${JSON.stringify(processedLogs)}

Return JSON:
{
  "attackSummary": "",
  "rootCauseTree": [
     {"step": "Initial Access"},
     {"step": "Execution"},
     {"step": "Persistence"},
     {"step": "Impact"}
  ],
  "timelineEvents": [
     {"time": "02:11", "event": "Failed logins begin"}
  ],
  "recommendedActions": [],
  "mitreMappings": [],
  "analysisConfidence": 0.8
}

CRITICAL RULES:
1. "rootCauseTree" MUST be 3-6 steps deep representing the lifecycle of the attack.
2. If the logs indicate benign activity or lack sufficient evidence of an attack, return "Insufficient Evidence" for attackSummary, empty arrays for everything else, and a low analysisConfidence. DO NOT hallucinate attack chains.
3. Use exact MITRE ATT&CK IDs (e.g., T1110, T1190) in mitreMappings.
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You are a SOC incident response analyst."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });

  const rawJson = JSON.parse(response.choices[0].message.content || "{}");
  
  // 2. Zod Parsing for Stability
  let parsed = IncidentAnalysisSchema.parse(rawJson);

  // 3. Hallucination Check -> Confidence < 0.45 = Inconclusive
  if (parsed.analysisConfidence < 0.45) {
    parsed.attackSummary = "Inconclusive - Insufficient evidence to determine a concrete attack pattern.";
    parsed.rootCauseTree = [];
    parsed.mitreMappings = [];
  }

  // 4. Time Ordering
  parsed.timelineEvents.sort((a, b) => {
    // Basic string comparison works for ISO or HH:mm formats
    return a.time.localeCompare(b.time);
  });

  // 5. MITRE Validity
  const validMitreIds = new Set(mitreData.techniques.map(t => t.id));
  parsed.mitreMappings = parsed.mitreMappings.filter(id => validMitreIds.has(id));
  
  // Return the parsed JSON along with metadata for the DB
  return {
    ...parsed,
    _meta: {
      promptVersion: "v2.1",
      usage: response.usage?.total_tokens || 0
    }
  };
}
