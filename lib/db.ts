import Database from 'better-sqlite3';
import path from 'path';

// Setup database connection
// In a real production scenario, this would be a Postgres connection pool.
// For this POC, we use a local SQLite file.
const dbPath = path.join(process.cwd(), 'risklens.db');
const db = new Database(dbPath, { verbose: console.log });

db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    source_ip TEXT,
    target TEXT,
    event_type TEXT,
    status TEXT,
    payload TEXT,
    source_type TEXT NOT NULL,
    raw_log TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    rule_name TEXT NOT NULL,
    severity TEXT NOT NULL,
    confidence REAL NOT NULL,
    timestamp TEXT NOT NULL,
    source_ip TEXT,
    target TEXT,
    description TEXT,
    mitre_technique TEXT
  );

  CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    severity TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    summary TEXT,
    ai_summary TEXT,
    timeline_json TEXT,
    mitre_tactics TEXT,
    root_cause_tree TEXT,
    prompt_version TEXT,
    token_usage INTEGER,
    analysis_cost REAL,
    analysis_confidence REAL,
    analyst_notes TEXT
  );

  CREATE TABLE IF NOT EXISTS incident_alerts (
    incident_id TEXT,
    alert_id TEXT,
    PRIMARY KEY (incident_id, alert_id),
    FOREIGN KEY(incident_id) REFERENCES incidents(id),
    FOREIGN KEY(alert_id) REFERENCES alerts(id)
  );

  DROP TABLE IF EXISTS actions;

  CREATE TABLE IF NOT EXISTS actions (
    id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target TEXT NOT NULL,
    status TEXT NOT NULL,
    approved_by TEXT,
    reason TEXT,
    decision_confidence REAL,
    simulation_payload TEXT,
    rollback_payload TEXT,
    rollback_status TEXT,
    execution_hash TEXT,
    rollback_expires_at TEXT,
    executed_at TEXT,
    rolled_back_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(incident_id) REFERENCES incidents(id)
  );

  DROP TABLE IF EXISTS policies;
  CREATE TABLE IF NOT EXISTS policies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    conditions_json TEXT NOT NULL,
    actions_json TEXT NOT NULL,
    cooldown_minutes INTEGER NOT NULL DEFAULT 60,
    last_triggered_at TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    report_period TEXT NOT NULL,
    generated_at TEXT NOT NULL,
    prompt_version TEXT,
    source_snapshot_json TEXT NOT NULL,
    llm_summary TEXT NOT NULL,
    llm_recommendations TEXT NOT NULL,
    integrity_hash TEXT NOT NULL,
    risk_rating TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS auth_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT,
    login_at TEXT NOT NULL,
    status TEXT NOT NULL
  );
`);

// Seed Mock Users
const checkUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
if (checkUsers.count === 0) {
  const defaultHash = '$2b$10$UQhO1zf.kaVjRnNlMdf/2OgDrF/NsDoYD83XqzSTrBbii6sNviD4C'; // password123
  const now = new Date().toISOString();
  
  const insertUser = db.prepare('INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)');
  insertUser.run('usr_admin', 'admin@risklens.local', defaultHash, 'Org Admin', now);
  insertUser.run('usr_analyst', 'analyst@risklens.local', defaultHash, 'SOC Analyst', now);
  insertUser.run('usr_board', 'board@risklens.local', defaultHash, 'Board Member', now);
  console.log('[DB] Mock users seeded successfully.');
}

export default db;
