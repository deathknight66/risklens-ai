const Database = require('better-sqlite3');
const db = new Database('risklens.db');
const crypto = require('crypto');

console.log('Seeding Demo Organization...');

// 1. Create Demo Org
const orgId = `org_demo_${crypto.randomBytes(4).toString('hex')}`;
db.prepare(`
  INSERT INTO organizations (id, name, slug, created_at) 
  VALUES (?, ?, ?, ?)
`).run(orgId, 'Acme Corp (Demo Environment)', `acme-demo-${crypto.randomBytes(4).toString('hex')}`, new Date().toISOString());

// 2. Create Demo User
const userId = `usr_demo_${crypto.randomBytes(4).toString('hex')}`;
db.prepare(`
  INSERT INTO users (id, email, password_hash, role, created_at)
  VALUES (?, ?, ?, ?, ?)
`).run(userId, 'demo@risklens.ai', 'MOCK_HASH_DO_NOT_USE', 'Org Admin', new Date().toISOString());

// 3. Seed Realistic Incidents & Logs
console.log('Seeding simulated attack chains...');
const incId1 = `inc_demo_${crypto.randomBytes(4).toString('hex')}`;

db.prepare(`
  INSERT INTO incidents (id, organization_id, title, severity, status, created_at, updated_at, summary, ai_summary, timeline_json, mitre_tactics, analysis_confidence)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  incId1, 
  orgId, 
  'Multi-Stage Ransomware Precursor Detected', 
  'CRITICAL', 
  'open', 
  new Date().toISOString(), 
  new Date().toISOString(),
  'Detected 3 associated alerts indicating lateral movement and credential dumping.',
  'An attacker gained initial access via compromised VPN credentials, performed lateral movement using PsExec, and attempted to dump LSASS memory on a domain controller.',
  JSON.stringify([
    { timestamp: new Date(Date.now() - 3600000).toISOString(), description: 'Anomalous VPN Login from Tor Exit Node' },
    { timestamp: new Date(Date.now() - 3500000).toISOString(), description: 'PsExec Execution on DC-01' },
    { timestamp: new Date(Date.now() - 3400000).toISOString(), description: 'LSASS Memory Dump Attempt' }
  ]),
  JSON.stringify(['T1078 (Valid Accounts)', 'T1021.002 (SMB/Windows Admin Shares)', 'T1003.001 (OS Credential Dumping: LSASS Memory)']),
  0.95
);

// Alerts for the incident
db.prepare(`
  INSERT INTO alerts (id, organization_id, rule_name, severity, confidence, timestamp, source_ip, target, description, mitre_technique)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(`alt_${crypto.randomBytes(4).toString('hex')}`, orgId, 'Anomalous VPN Login', 'HIGH', 0.88, new Date(Date.now() - 3600000).toISOString(), '185.100.200.5', 'vpn.acme.com', 'Login from known Tor exit node', 'T1078');

// 4. Seed Policies and Playbooks
console.log('Seeding Playbooks...');
const pbId = `pb_demo_${crypto.randomBytes(4).toString('hex')}`;
db.prepare(`
  INSERT INTO playbooks (id, organization_id, name, description, dag_json, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  pbId, orgId, 
  'Ransomware Rapid Containment', 
  'Automatically isolate hosts involved in credential dumping and revoke active VPN sessions.',
  JSON.stringify({
    nodes: [
      { id: 'detect', type: 'condition', expression: 'severity == "CRITICAL"' },
      { id: 'isolate_host', type: 'action' },
      { id: 'revoke_vpn', type: 'action' },
      { id: 'notify_pagerduty', type: 'action' }
    ],
    edges: [
      { from: 'detect', to: 'isolate_host', when: true },
      { from: 'detect', to: 'revoke_vpn', when: true },
      { from: 'isolate_host', to: 'notify_pagerduty' }
    ]
  }),
  new Date().toISOString(), new Date().toISOString()
);

db.prepare(`
  INSERT INTO policies (id, organization_id, name, conditions_json, actions_json, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(`pol_demo_${crypto.randomBytes(4).toString('hex')}`, orgId, 'Ransomware Auto-Contain', JSON.stringify({ severity: 'CRITICAL', mitre_tactic: 'T1003.001' }), JSON.stringify([{ action: 'execute_playbook', target: pbId }]), new Date().toISOString());

console.log(`\nDemo Organization Seeded Successfully!`);
console.log(`Demo Org ID: ${orgId}`);
console.log(`Demo User ID: ${userId}`);
console.log(`Login: demo@risklens.ai (Bypass auth required in local setup)`);
