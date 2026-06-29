# RiskLens AI

RiskLens AI is an adaptive cyber intelligence platform designed for SOC environments. It transforms raw log ingestion into actionable intelligence using AI-driven context extraction, and maintains an organizational threat memory to adapt to recurring attack patterns.

## Architecture Layers

This project has been developed in progressive architectural sprints:

### Sprint 1: Operational Logging
- **Data Persistence:** SQLite (WAL mode) for robust, lightweight, and local persistence of logs, alerts, incidents, and actions.
- **Log Ingestion:** Backend parsers that normalize raw inputs into standard threat vectors.

### Sprint 2: Intelligence Layer
- **Detection & AI Engine:** Integrates OpenAI SDK to construct attack summaries, root cause trees, and MITRE mapping from suspicious logs.
- **Context Truncation:** A custom heuristic scoring engine (failed auth, SQLi patterns, privilege changes, etc.) truncates logs to the Top 50 most suspicious events before passing to the LLM.
- **Hallucination Control:** Zod schema validation combined with a Strict Confidence Threshold (`>= 0.45`). Anything below this threshold is marked as "Inconclusive".
- **MITRE Allowlist:** Ensures only valid MITRE framework techniques are mapped.

### Sprint 3: Threat Memory Layer
- **Vector DB (Qdrant):** Stores AI analysis outputs using `text-embedding-3-small`.
- **Hybrid Similarity Search:** Searches past incidents based on semantic similarity (OpenAI embeddings) combined with hybrid scoring bonuses (same asset, same IP, same MITRE technique).
- **Threat Recurrence Engine:** Analyzes temporal decay (`decay = e^(-days/30)`) and recurrence counts to detect known, repeated adversary patterns.
- **Deduplication:** Hash fingerprinting (`SHA-256`) prevents duplicate incident memories and tracks frequencies natively.

## Getting Started

### Prerequisites
1. Node.js (v18+)
2. Docker (for Qdrant Vector DB)
3. OpenAI API Key

### Setup Environment
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Create `.env`, `.env.local`, and `.env.production` files in the root directory:
   ```env
   OPENAI_API_KEY=sk-your-openai-api-key
   QDRANT_URL=http://localhost:6333
   ```
3. Start the Qdrant Vector DB locally via Docker:
   ```bash
   docker run -d -p 6333:6333 qdrant/qdrant
   ```

### Running the Application
```bash
npm run build
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

## UI Modules
- **Dashboard:** At-a-glance threat posture and organizational Threat Memory Hits.
- **Investigation:** 4-stage AI Incident Analysis with similar incident pattern matching.
- **Business Impact:** Blast radius projections, What-If simulator, and Historical Loss Correlation based on threat memory.
