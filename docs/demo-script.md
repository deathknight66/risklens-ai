# RiskLens Deterministic Founder Demo Script

*Prerequisites: Use the seeded read-only demo tenant (`scripts/seed_demo_org.js`).*

## Minute 1: The Ingestion
**Action:** Show the SOC Dashboard / Alerts view.
**Script:**
> "Logs arrive. But instead of drowning you in raw events, RiskLens immediately begins normalization."
*Point out the Cloudflare WAF or AWS GuardDuty logs populating the feed.*

## Minute 2: AI Analysis
**Action:** Click into an Incident and show the AI Root Cause Reconstruction.
**Script:**
> "Here, our AI analysis has reconstructed the root cause. Instead of you spending 40 minutes piecing together logs, RiskLens tells you exactly what happened: 'Attacker gained initial access via compromised VPN credentials, performed lateral movement using PsExec, and attempted to dump LSASS memory.' It also maps this to MITRE ATT&CK automatically."

## Minute 3: Memory Graph
**Action:** Navigate to the Threat Memory / Graph view.
**Script:**
> "This is where RiskLens stops being a dashboard and becomes intelligent. This attack resembles 3 previous credential stuffing campaigns from last month. We aren't just looking at isolated events; the Memory Graph connects the dots across your entire historical footprint."

## Minute 4: Escalation Score
**Action:** Highlight the Predictive Escalation Score badge.
**Script:**
> "Based on the AI analysis and the Memory Graph recurrence, the Predictive Escalation Engine scored this threat an 87/100. It knows this is critical before a human even looks at it."

## Minute 5: Autonomous Playbook Execution
**Action:** Open the Playbook Runs tab and show the DAG execution graph.
**Script:**
> "Because the score was above 80, an Autonomous Playbook fired immediately. It isolated the host, revoked the VPN session, and created a PagerDuty incident. This is the 'holy shit' moment. MTTR drops from hours to milliseconds. RiskLens isn't just an advisor; it's an operator."

## Minute 6: The Rollback
**Action:** Click the "Rollback" button on a completed action.
**Script:**
> "But what if it's a false positive? We built RiskLens with Enterprise-grade idempotency. With one click, the Rollback Stack reverses the playbook—unblocking the IP and restoring the session. It's a critical trust builder that most SOAR platforms skip. You are always in control."
