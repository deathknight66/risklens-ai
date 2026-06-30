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
  { company: 'AlphaSec', status: 'closed_won', value: 2500, contact: daysAgo(2), score: 95, leg: 'approved', sec: 'approved', bud: 'approved', exec: 'approved' },
  { company: 'Beta Infra', status: 'pilot_active', value: 1500, contact: daysAgo(1), score: 85, leg: 'approved', sec: 'pending', bud: 'pending', exec: 'approved' },
  { company: 'Gamma DevOps', status: 'pilot_offered', value: 3500, contact: daysAgo(5), score: 70, leg: 'blocked', sec: 'pending', bud: 'pending', exec: 'pending' },
  { company: 'Delta Cyber', status: 'demo_completed', value: 1000, contact: daysAgo(10), score: 60, leg: 'pending', sec: 'pending', bud: 'pending', exec: 'pending' },
  { company: 'Epsilon Tech', status: 'lead', value: null, contact: daysAgo(16), score: null, leg: 'pending', sec: 'pending', bud: 'pending', exec: 'pending' },
  { company: 'Zeta Bank', status: 'closed_lost', value: 5000, contact: daysAgo(20), score: 40, leg: 'blocked', sec: 'blocked', bud: 'blocked', exec: 'blocked' },
];

const insertDeal = db.prepare(`
  INSERT INTO design_partner_pipeline 
  (id, company_name, segment, contact_name, email, source, status, deal_value_estimate, champion_score, legal_status, security_review_status, budget_status, exec_sponsor_status, last_contact_at, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const d of deals) {
  insertDeal.run(
    crypto.randomBytes(8).toString('hex'), d.company, 'MSSP', 'Jane Doe', 'jane@' + d.company.replace(' ','').toLowerCase() + '.com',
    'Outbound', d.status, d.value, d.score, d.leg, d.sec, d.bud, d.exec, d.contact, daysAgo(30), now.toISOString()
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

console.log('Seeding complete.');
