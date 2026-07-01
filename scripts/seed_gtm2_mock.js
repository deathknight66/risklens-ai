const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'risklens.db');
const db = new Database(dbPath);

console.log('Seeding GTM-2 Mock Data for Dashboard...');

db.prepare('DROP TABLE IF EXISTS design_partner_pipeline').run();
db.prepare('DROP TABLE IF EXISTS pilot_success_metrics').run();
db.prepare('DROP TABLE IF EXISTS sales_objections').run();

db.prepare(`
  CREATE TABLE design_partner_pipeline (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    segment TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    source TEXT NOT NULL,
    status TEXT NOT NULL,
    pain_score INTEGER,
    urgency_score INTEGER,
    deal_value_estimate INTEGER,
    champion_score INTEGER,
    risk_of_stall TEXT,
    stakeholder_map_json TEXT,
    tech_stack_json TEXT DEFAULT '[]',
    legal_status TEXT DEFAULT 'pending',
    security_review_status TEXT DEFAULT 'pending',
    budget_status TEXT DEFAULT 'pending',
    exec_sponsor_status TEXT DEFAULT 'pending',
    last_contact_at TEXT,
    next_action_at TEXT,
    decision_deadline TEXT,
    next_followup_at TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`).run();

db.prepare('DROP TABLE IF EXISTS report_snapshots').run();
db.prepare(`
  CREATE TABLE report_snapshots (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    snapshot_json TEXT NOT NULL,
    hash TEXT NOT NULL,
    generated_at TEXT NOT NULL
  )
`).run();

db.prepare('DROP TABLE IF EXISTS customer_references').run();
db.prepare(`
  CREATE TABLE customer_references (
    id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    segment TEXT NOT NULL,
    stack_json TEXT NOT NULL,
    metrics_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`).run();

db.prepare('DROP TABLE IF EXISTS objection_playbooks').run();
db.prepare(`
  CREATE TABLE objection_playbooks (
    id TEXT PRIMARY KEY,
    objection_type TEXT NOT NULL,
    trigger_words_json TEXT NOT NULL,
    response_strategy TEXT NOT NULL,
    recommended_docs_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`).run();

db.prepare('DROP TABLE IF EXISTS stakeholder_map').run();
db.prepare(`
  CREATE TABLE stakeholder_map (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT,
    influence_score INTEGER DEFAULT 0,
    is_champion INTEGER DEFAULT 0,
    is_blocker INTEGER DEFAULT 0,
    last_contact_at TEXT
  )
`).run();

db.prepare('DROP TABLE IF EXISTS deal_engagement_events').run();
db.prepare(`
  CREATE TABLE deal_engagement_events (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    actor_hash TEXT NOT NULL,
    event_type TEXT NOT NULL,
    weight INTEGER DEFAULT 1,
    source_stakeholder_id TEXT,
    created_at TEXT NOT NULL
  )
`).run();

db.prepare('DROP TABLE IF EXISTS retention_playbooks').run();
db.prepare(`
  CREATE TABLE retention_playbooks (
    id TEXT PRIMARY KEY,
    trigger_type TEXT NOT NULL,
    threshold INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    content_template TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`).run();

db.prepare('DROP TABLE IF EXISTS retention_actions_log').run();
db.prepare(`
  CREATE TABLE retention_actions_log (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    executed INTEGER DEFAULT 0,
    outcome TEXT,
    notes TEXT,
    created_at TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS board_metrics (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    reporting_period TEXT NOT NULL,
    mttr_before INTEGER,
    mttr_after INTEGER,
    incidents_contained INTEGER,
    analyst_hours_saved REAL,
    estimated_loss_prevented REAL,
    insurance_premium_delta REAL,
    compliance_hours_saved REAL,
    confidence_score INTEGER DEFAULT 80,
    methodology_version TEXT DEFAULT 'v1',
    snapshot_hash TEXT,
    created_at TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS budget_cycles (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    fiscal_year TEXT,
    renewal_date TEXT,
    board_meeting_date TEXT,
    security_budget_status TEXT,
    budget_owner TEXT,
    procurement_stage TEXT,
    priority_score INTEGER,
    budget_locked INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS exec_sponsors (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT,
    buying_power INTEGER DEFAULT 0,
    economic_buyer INTEGER DEFAULT 0,
    risk_owner INTEGER DEFAULT 0,
    engagement_score INTEGER DEFAULT 0,
    last_seen_at TEXT,
    created_at TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS board_triggers (
    id TEXT PRIMARY KEY,
    trigger_rule TEXT NOT NULL,
    action_recommendation TEXT NOT NULL,
    priority INTEGER NOT NULL,
    active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS pilot_success_metrics (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    incidents_ingested INTEGER DEFAULT 0,
    analyses_completed INTEGER DEFAULT 0,
    playbooks_triggered INTEGER DEFAULT 0,
    analyst_hours_saved REAL DEFAULT 0,
    mttr_delta_minutes REAL DEFAULT 0,
    prevented_escalations INTEGER DEFAULT 0,
    containment_rate REAL DEFAULT 0,
    time_to_first_value_minutes REAL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS sales_objections (
    id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    objection_type TEXT NOT NULL,
    exact_words TEXT NOT NULL,
    severity TEXT NOT NULL,
    resolved INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL
  )
`).run();

// Clear existing to avoid duplicates if run multiple times
db.prepare('DELETE FROM design_partner_pipeline').run();
db.prepare('DELETE FROM pilot_success_metrics').run();
db.prepare('DELETE FROM sales_objections').run();
db.prepare('DELETE FROM report_snapshots').run();
// Don't delete beta_events entirely, just our mock ones if needed, or clear all
db.prepare("DELETE FROM beta_events WHERE event_type LIKE 'second_%'").run();

const now = new Date();
const daysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

// 1. Pipeline Deals
const deals = [
  { company: 'AlphaSec', status: 'closed_won', value: 2500, contact: daysAgo(2), score: 95, leg: 'approved', sec: 'approved', bud: 'approved', exec: 'approved', stack: ['Cloudflare WAF', 'AWS GuardDuty'] },
  { company: 'Beta Infra', status: 'pilot_active', value: 1500, contact: daysAgo(1), score: 85, leg: 'approved', sec: 'pending', bud: 'pending', exec: 'approved', stack: ['Cloudflare WAF', 'AWS GuardDuty', 'PagerDuty'] },
  { company: 'Gamma DevOps', status: 'pilot_offered', value: 3500, contact: daysAgo(5), score: 70, leg: 'blocked', sec: 'pending', bud: 'pending', exec: 'pending', stack: ['AWS GuardDuty', 'Slack'] },
  { company: 'Delta Cyber', status: 'demo_completed', value: 1000, contact: daysAgo(10), score: 60, leg: 'pending', sec: 'pending', bud: 'pending', exec: 'pending', stack: ['Okta', 'Splunk'] },
  { company: 'Epsilon Tech', status: 'lead', value: null, contact: daysAgo(16), score: null, leg: 'pending', sec: 'pending', bud: 'pending', exec: 'pending', stack: ['Azure Sentinel', 'Jira'] },
  { company: 'Zeta Bank', status: 'closed_lost', value: 5000, contact: daysAgo(20), score: 40, leg: 'blocked', sec: 'blocked', bud: 'blocked', exec: 'blocked', stack: ['Palo Alto Networks', 'Splunk'] },
];

const insertDeal = db.prepare(`
  INSERT INTO design_partner_pipeline 
  (id, company_name, segment, contact_name, email, source, status, deal_value_estimate, champion_score, legal_status, security_review_status, budget_status, exec_sponsor_status, tech_stack_json, last_contact_at, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const d of deals) {
  insertDeal.run(
    crypto.randomBytes(8).toString('hex'), d.company, 'MSSP', 'Jane Doe', 'jane@' + d.company.replace(' ','').toLowerCase() + '.com',
    'Outbound', d.status, d.value, d.score, d.leg, d.sec, d.bud, d.exec, JSON.stringify(d.stack), d.contact, daysAgo(30), now.toISOString()
  );
}

// 2. Pilot Success Metrics
// First need to ensure an org exists
let org = db.prepare('SELECT id FROM organizations LIMIT 1').get();
if (!org) {
  org = { id: crypto.randomBytes(8).toString('hex') };
  db.prepare('INSERT INTO organizations (id, name, slug) VALUES (?, ?, ?)').run(org.id, 'Demo Org', 'demo-org');
}

const insertMetric = db.prepare(`
  INSERT INTO pilot_success_metrics 
  (id, organization_id, incidents_ingested, analyses_completed, playbooks_triggered, analyst_hours_saved, mttr_delta_minutes, containment_rate, time_to_first_value_minutes, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertMetric.run(
  crypto.randomBytes(8).toString('hex'), org.id, 
  150, 140, 80, 27, 45, Math.round((80/140)*100), 12, 
  now.toISOString(), now.toISOString()
);

// 3. Sales Objections
const objections = [
  { type: 'Too risky', words: 'We cannot let AI block IPs', res: 0 },
  { type: 'Too risky', words: 'Approval mode is needed', res: 1 },
  { type: 'Too risky', words: 'Compliance says no', res: 0 },
  { type: 'Too expensive', words: 'Can just use open source', res: 0 },
  { type: 'Too expensive', words: 'Budget frozen', res: 0 },
  { type: 'Need SIEM integration', words: 'Must sync with Splunk', res: 1 },
];

const insertObj = db.prepare(`
  INSERT INTO sales_objections (id, company, objection_type, exact_words, severity, resolved, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const o of objections) {
  insertObj.run(
    crypto.randomBytes(8).toString('hex'), 'Some Company', o.type, o.words, 'high', o.res, now.toISOString()
  );
}

// 4. Expansion Signals (Beta Events)
// We will assign Beta Infra the org.id
// And give them some expansion signals
db.prepare(`UPDATE organizations SET name = 'Beta Infra' WHERE id = ?`).run(org.id);
const insertEvent = db.prepare(`
  INSERT INTO beta_events (id, organization_id, event_type, created_at)
  VALUES (?, ?, ?, ?)
`);

insertEvent.run(crypto.randomBytes(8).toString('hex'), org.id, 'second_analyst_invited', now.toISOString());
insertEvent.run(crypto.randomBytes(8).toString('hex'), org.id, 'second_integration_added', now.toISOString());

// 5. GTM-4 Customer References & Objection Playbooks
db.prepare('DELETE FROM customer_references').run();
db.prepare('DELETE FROM objection_playbooks').run();

const insertRef = db.prepare(`
  INSERT INTO customer_references (id, company, segment, stack_json, metrics_json, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);
insertRef.run(crypto.randomBytes(8).toString('hex'), 'AlphaSec', 'MSSP', JSON.stringify(['Cloudflare WAF', 'AWS GuardDuty']), JSON.stringify({ 'MTTR Reduced': '41%', 'Analyst Hours Saved': 120 }), now.toISOString());
insertRef.run(crypto.randomBytes(8).toString('hex'), 'NovaInfra', 'DevOps', JSON.stringify(['AWS GuardDuty', 'Slack']), JSON.stringify({ 'Containment Rate': '58%', 'Escalations Prevented': 15 }), now.toISOString());
insertRef.run(crypto.randomBytes(8).toString('hex'), 'SecureBank', 'Fintech', JSON.stringify(['Azure Sentinel', 'Okta']), JSON.stringify({ 'ROI': '2.5x in 30 days', 'Analyst Hours Saved': 45 }), now.toISOString());

const insertPlaybook = db.prepare(`
  INSERT INTO objection_playbooks (id, objection_type, trigger_words_json, response_strategy, recommended_docs_json, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);
insertPlaybook.run(crypto.randomBytes(8).toString('hex'), 'Trust Gap', JSON.stringify(['risky', 'risk', 'hallucinate', 'ai concern']), 'Emphasize Deterministic Playbook Engine vs Probabilistic Triage.', JSON.stringify(['docs/security-faq.md', 'docs/ai-boundaries.md']), now.toISOString());
insertPlaybook.run(crypto.randomBytes(8).toString('hex'), 'Budget', JSON.stringify(['budget', 'expensive', 'price']), 'Shift focus to operational leverage and analyst hour reduction.', JSON.stringify(['/roi']), now.toISOString());
insertPlaybook.run(crypto.randomBytes(8).toString('hex'), 'Legal Slowdown', JSON.stringify(['legal', 'procurement', 'dpa']), 'Offer DPA Lite and scoped data retention to bypass heavy compliance.', JSON.stringify(['docs/dpa-lite.md', 'docs/data-retention.md']), now.toISOString());
insertPlaybook.run(crypto.randomBytes(8).toString('hex'), 'Compliance', JSON.stringify(['soc2', 'compliance', 'iso']), 'Share the compliance roadmap and tenant isolation architecture.', JSON.stringify(['docs/security-faq.md']), now.toISOString());

// 6. GTM-5 Stakeholder Maps & Engagement Events
db.prepare('DELETE FROM stakeholder_map').run();
db.prepare('DELETE FROM deal_engagement_events').run();

const insertStakeholder = db.prepare(`
  INSERT INTO stakeholder_map (id, organization_id, name, role, department, influence_score, is_champion, is_blocker, last_contact_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// AlphaSec (Closed Won - Expansion Candidate - 3 stakeholders)
insertStakeholder.run(crypto.randomBytes(8).toString('hex'), org.id, 'Jane Doe', 'VP Security', 'Security', 90, 1, 0, daysAgo(2));
insertStakeholder.run(crypto.randomBytes(8).toString('hex'), org.id, 'John Smith', 'CISO', 'Executive', 100, 0, 0, daysAgo(10));
insertStakeholder.run(crypto.randomBytes(8).toString('hex'), org.id, 'Alice Bob', 'SecOps Lead', 'Security', 70, 1, 0, daysAgo(1));

// Beta Infra (Pilot Active - Single Threaded Risk - 1 stakeholder)
// In a real DB we'd have a second org, but let's mock it using the same org ID since our pipeline fetches by name, 
// and our expansion API does `const org = orgs.find(o => o.name === deal.company_name);`.
// But wait, our seed script only creates ONE organization in the `organizations` table: 'AlphaSec'.
// Let's create a second organization 'Beta Infra'.
const betaOrgId = crypto.randomBytes(8).toString('hex');
const betaSlug = `beta-infra-${Date.now()}`;
db.prepare(`
  INSERT INTO organizations (id, name, slug, plan, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(betaOrgId, 'Beta Infra', betaSlug, 'pro', 'active', now.toISOString());

// Beta Infra Pilot Metrics (Low engagement to trigger churn)
db.prepare(`
  INSERT INTO pilot_success_metrics (id, organization_id, incidents_ingested, analyses_completed, playbooks_triggered, analyst_hours_saved, mttr_delta_minutes, prevented_escalations, containment_rate, time_to_first_value_minutes, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(crypto.randomBytes(8).toString('hex'), betaOrgId, 50, 4, 1, 2.5, 5.0, 1, 10.0, 180, now.toISOString(), now.toISOString());

// Beta Infra Stakeholder
insertStakeholder.run(crypto.randomBytes(8).toString('hex'), betaOrgId, 'Mark Beta', 'Security Engineer', 'Security', 42, 1, 0, daysAgo(15));

// AlphaSec Multi-champion spread events
const insertEngagement = db.prepare(`
  INSERT INTO deal_engagement_events (id, organization_id, actor_hash, event_type, weight, source_stakeholder_id, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
insertEngagement.run(crypto.randomBytes(8).toString('hex'), org.id, 'hash1_jane', 'viewed_champion_kit', 5, null, daysAgo(5));
insertEngagement.run(crypto.randomBytes(8).toString('hex'), org.id, 'hash1_jane', 'copied_share_link', 20, null, daysAgo(5));
insertEngagement.run(crypto.randomBytes(8).toString('hex'), org.id, 'hash2_ciso', 'viewed_champion_kit', 5, 'jane_stakeholder_id', daysAgo(4));
insertEngagement.run(crypto.randomBytes(8).toString('hex'), org.id, 'hash2_ciso', 'viewed_roi_section', 10, 'jane_stakeholder_id', daysAgo(4));
insertEngagement.run(crypto.randomBytes(8).toString('hex'), org.id, 'hash3_procurement', 'opened_procurement_pack', 25, 'ciso_stakeholder_id', daysAgo(2));

// 7. GTM-6 Retention Playbooks
db.prepare('DELETE FROM retention_playbooks').run();
db.prepare('DELETE FROM retention_actions_log').run();

const insertRetPlaybook = db.prepare(`
  INSERT INTO retention_playbooks (id, trigger_type, threshold, action_type, content_template, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);
insertRetPlaybook.run(crypto.randomBytes(8).toString('hex'), 'high_churn_score', 70, 'founder_checkin', 'Schedule immediate check-in.', now.toISOString());
insertRetPlaybook.run(crypto.randomBytes(8).toString('hex'), 'low_thread_strength', 35, 'champion_diversification', 'Trigger champion diversification playbook.', now.toISOString());
insertRetPlaybook.run(crypto.randomBytes(8).toString('hex'), 'political_drift', 60, 'exec_alignment_refresh', 'Trigger executive alignment refresh.', now.toISOString());
insertRetPlaybook.run(crypto.randomBytes(8).toString('hex'), 'automation_decay', 40, 'roi_refresh', 'Auto-send executive ROI refresh.', now.toISOString());

// 8. GTM-7 Boardroom Engine Data
db.prepare('DELETE FROM board_metrics').run();
db.prepare('DELETE FROM budget_cycles').run();
db.prepare('DELETE FROM exec_sponsors').run();
db.prepare('DELETE FROM board_triggers').run();

// AlphaSec Board Data (Strong ROI, Budget Cycle approaching)
db.prepare(`
  INSERT INTO board_metrics (id, organization_id, reporting_period, mttr_before, mttr_after, incidents_contained, analyst_hours_saved, estimated_loss_prevented, insurance_premium_delta, compliance_hours_saved, confidence_score, snapshot_hash, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(crypto.randomBytes(8).toString('hex'), org.id, 'Q3 2026', 120, 15, 42, 650.5, 147000, 15000, 45, 92, 'hash_abc123', now.toISOString());

const nextMonth = new Date();
nextMonth.setMonth(nextMonth.getMonth() + 1);
const nextYear = new Date();
nextYear.setFullYear(nextYear.getFullYear() + 1);

db.prepare(`
  INSERT INTO budget_cycles (id, organization_id, fiscal_year, renewal_date, board_meeting_date, security_budget_status, budget_owner, procurement_stage, priority_score, budget_locked, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(crypto.randomBytes(8).toString('hex'), org.id, 'FY27', nextMonth.toISOString(), daysAgo(-15), 'approved', 'CFO', 'legal_review', 90, 0, now.toISOString());

db.prepare(`
  INSERT INTO exec_sponsors (id, organization_id, name, role, department, buying_power, economic_buyer, risk_owner, engagement_score, last_seen_at, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(crypto.randomBytes(8).toString('hex'), org.id, 'Sarah Exec', 'CISO', 'Security', 85, 1, 1, 95, daysAgo(2), now.toISOString());

const insertBoardTrigger = db.prepare(`
  INSERT INTO board_triggers (id, trigger_rule, action_recommendation, priority, active, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);
insertBoardTrigger.run(crypto.randomBytes(8).toString('hex'), 'escalate_procurement', 'Escalate to VP Procurement', 1, 1, now.toISOString());
insertBoardTrigger.run(crypto.randomBytes(8).toString('hex'), 'generate_board_packet', 'Generate & Send Board Packet', 2, 1, now.toISOString());
insertBoardTrigger.run(crypto.randomBytes(8).toString('hex'), 'schedule_exec_alignment', 'Schedule Exec Alignment', 3, 1, now.toISOString());

console.log('Seeding complete.');
