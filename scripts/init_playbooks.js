const Database = require('better-sqlite3');
const db = new Database('risklens.db');
const crypto = require('crypto');

// Create Playbook tables
db.exec(`
  CREATE TABLE IF NOT EXISTS playbooks (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    dag_json TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS playbook_runs (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    playbook_id TEXT NOT NULL,
    incident_id TEXT NOT NULL,
    execution_key TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    FOREIGN KEY(organization_id) REFERENCES organizations(id),
    FOREIGN KEY(playbook_id) REFERENCES playbooks(id),
    FOREIGN KEY(incident_id) REFERENCES incidents(id)
  );

  CREATE TABLE IF NOT EXISTS playbook_steps (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    node_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target TEXT,
    status TEXT NOT NULL,
    execution_log TEXT,
    rollback_payload TEXT,
    executed_at TEXT NOT NULL,
    FOREIGN KEY(run_id) REFERENCES playbook_runs(id)
  );

  CREATE TABLE IF NOT EXISTS resource_locks (
    target TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    run_id TEXT NOT NULL,
    locked_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY(organization_id) REFERENCES organizations(id),
    FOREIGN KEY(run_id) REFERENCES playbook_runs(id)
  );
`);

console.log("Tables created successfully.");

// Seed a playbook
const org = db.prepare('SELECT id FROM organizations LIMIT 1').get();
if (org) {
  const dag = {
    nodes: [
      { id: 'detect', type: 'condition', expression: 'severity > 8' },
      { id: 'block_ip', type: 'action' },
      { id: 'notify_slack', type: 'action' }
    ],
    edges: [
      { from: 'detect', to: 'block_ip', when: true },
      { from: 'detect', to: 'notify_slack', when: false }
    ]
  };
  
  db.prepare(`
    INSERT INTO playbooks (id, organization_id, name, description, dag_json, created_at, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'pb_' + crypto.randomBytes(8).toString('hex'), 
    org.id, 
    'High Severity Auto-Containment', 
    'Automatically blocks IPs for severe incidents and notifies via Slack.', 
    JSON.stringify(dag), 
    new Date().toISOString(), 
    new Date().toISOString()
  );
  console.log("Mock Playbook inserted.");
}
