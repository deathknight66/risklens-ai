# AI Boundaries and LLM Architecture

RiskLens integrates Large Language Models (LLMs) to provide unparalleled incident context. However, we employ strict architectural boundaries to ensure safety, predictability, and compliance.

### 1. Does the LLM take actions?
**No.** 
The LLM is strictly used for **analysis and translation** (e.g., turning raw JSON logs into a human-readable Root Cause narrative). 
- Playbook triggers and actions are executed by a **Deterministic Engine**.
- If `severity == CRITICAL`, the deterministic engine fires the playbook. The LLM has zero authority to execute code, ban IPs, or alter infrastructure.

### 2. Can the LLM modify policies?
**No.**
Policies and playbooks are statically defined Directed Acyclic Graphs (DAGs). The LLM cannot alter the DAG structure or change the threshold rules.

### 3. Is training happening on our data?
**Absolutely Not.**
RiskLens uses zero-retention Enterprise API agreements with our LLM providers (e.g., OpenAI, Anthropic). Your security data, incident logs, and proprietary architecture are **never** used to train foundation models. 

### 4. Deterministic vs. Probabilistic
- **Probabilistic (LLM)**: "This attack appears to be a credential stuffing attempt targeting the finance portal." (Used for the UI Summary).
- **Deterministic (Engine)**: "Login failures > 50 in 1 minute. Escalate to PagerDuty and trigger AWS WAF block." (Used for Playbooks).

We keep the Brain (LLM) and the Hands (Engine) strictly separated.
