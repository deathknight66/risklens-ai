# RiskLens Security Model

As an Autonomous Incident Intelligence platform, RiskLens requires high-trust access to your security telemetry and execution endpoints. We recognize that trust must be earned through transparency and rigorous engineering. This document outlines the core pillars of the RiskLens Security Model.

## 1. Tenant Isolation
RiskLens is a multi-tenant SaaS application designed with strict logical isolation at the data layer.
- Every row in our database corresponding to logs, incidents, alerts, API keys, and playbooks is strictly scoped by `organization_id`.
- The `lib/db.ts` SQLite architecture and all internal APIs mandate the presence and validation of `organization_id` before any CRUD operation is performed.
- Cross-tenant data spillage is structurally impossible through our ORM-equivalent query wrappers.

## 2. API Key Hashing and Secrets
RiskLens relies on API keys for log ingestion and playbook execution.
- We never store raw API keys. All keys are hashed using SHA-256 before being stored in the `api_keys` table.
- We support scoped API keys (e.g., `ingest_only`) to ensure that a compromised ingestion key cannot be used to read or modify your configuration.
- RiskLens implements rate-limiting on all ingest endpoints to prevent DoS attacks and billing exhaustion.

## 3. Deterministic Scoring vs. LLM Explanations
RiskLens leverages Large Language Models (LLMs) to reconstruct incident root causes and map behaviors to the MITRE ATT&CK framework.
However, **LLMs do not make autonomous decisions.**
- The **Predictive Escalation Engine** uses deterministic algorithms (e.g., evaluating severity, target criticality, and memory graph recurrence) to generate a Threat Score.
- **Autonomous Playbooks** are triggered exclusively by deterministic Policy Engine rules (e.g., `severity == "CRITICAL" && WAF_BLOCK == true`).
- We intentionally isolate the non-deterministic LLM output (the explanation) from the deterministic logic layer (the action).

## 4. Single Sign-On (SSO) and SCIM
RiskLens integrates with Enterprise Identity Providers (Okta, Azure AD, Google Workspace) via SAML 2.0.
- We abstract Identity Providers using a unified `IdentityManager`.
- Automated onboarding and offboarding are supported via SCIM 2.0, ensuring that terminated employees lose access to RiskLens immediately.

## 5. Rollback Guarantees and Idempotency
RiskLens Playbooks are modeled as Directed Acyclic Graphs (DAGs) and executed via our `PlaybookEngine`.
- **Idempotency**: Execution is guarded by `ResourceLocks`. If an IP is already being blocked by an active playbook run, a redundant playbook will not execute on that same target.
- **LIFO Rollback Stack**: Every action taken by RiskLens generates a `rollback_payload`. If an action needs to be reversed (or if a false positive is identified), RiskLens unwinds the actions in reverse chronological order (Last-In-First-Out).
- **Immutable Audit Logs**: Every execution and rollback is permanently recorded in `playbook_steps` and `actions`, providing complete visibility into what the autonomous engine did, and why.

## 6. Autonomy Escalation
We don't expect you to trust us on Day 1. RiskLens Playbooks support multiple execution modes:
1. **Suggest Only**: The engine suggests the correct playbook but takes no action.
2. **Approval Required**: The playbook evaluates conditions but pauses before taking action, requiring a human click.
3. **Fully Autonomous**: For high-trust, well-understood attacks (e.g., simple credential stuffing).

You control the dial.
