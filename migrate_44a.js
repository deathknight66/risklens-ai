const Database = require('better-sqlite3');
const db = new Database('risklens.db');

try {
  db.exec('BEGIN TRANSACTION;');

  // Create new tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      plan TEXT NOT NULL DEFAULT 'free',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS memberships (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      organization_id TEXT NOT NULL,
      role TEXT NOT NULL,
      UNIQUE(user_id, organization_id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(organization_id) REFERENCES organizations(id)
    );
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      status TEXT NOT NULL,
      current_period_end TEXT,
      FOREIGN KEY(organization_id) REFERENCES organizations(id)
    );
    CREATE TABLE IF NOT EXISTS usage_metering (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      period_month TEXT NOT NULL,
      logs_ingested INTEGER DEFAULT 0,
      ai_analyses INTEGER DEFAULT 0,
      action_executions INTEGER DEFAULT 0,
      token_usage INTEGER DEFAULT 0,
      UNIQUE(organization_id, period_month),
      FOREIGN KEY(organization_id) REFERENCES organizations(id)
    );
  `);

  // Insert default org
  db.exec(`INSERT OR IGNORE INTO organizations (id, name, slug, plan, status, created_at) VALUES ('org_default', 'RiskLens Internal', 'risklens-internal', 'enterprise', 'active', datetime('now'))`);

  // Migrate users to memberships
  const users = db.prepare('SELECT * FROM users').all();
  for (const u of users) {
    if (u.role) {
      db.prepare('INSERT OR IGNORE INTO memberships (id, user_id, organization_id, role) VALUES (?, ?, ?, ?)').run('mem_' + u.id.split('_')[1], u.id, 'org_default', u.role);
    }
  }

  // Add organization_id and deleted_at to tables if not exist
  const addCol = (table, col, def) => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} TEXT DEFAULT '${def}'`);
    } catch (e) {
      if (!e.message.includes('duplicate column name')) console.error(e);
    }
  };

  const addColNull = (table, col) => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} TEXT`);
    } catch (e) {
      if (!e.message.includes('duplicate column name')) console.error(e);
    }
  };

  addCol('logs', 'organization_id', 'org_default');
  addCol('alerts', 'organization_id', 'org_default');
  addCol('incidents', 'organization_id', 'org_default');
  addColNull('incidents', 'deleted_at');
  addCol('actions', 'organization_id', 'org_default');
  addColNull('actions', 'deleted_at');
  addCol('policies', 'organization_id', 'org_default');
  addColNull('policies', 'deleted_at');
  addCol('reports', 'organization_id', 'org_default');
  addColNull('reports', 'deleted_at');
  addCol('auth_logs', 'organization_id', 'org_default');
  addCol('api_keys', 'organization_id', 'org_default');
  addCol('api_keys', 'status', 'active');
  addColNull('api_keys', 'expires_at');

  db.exec('COMMIT;');
  console.log('Migration successful');
} catch(err) {
  db.exec('ROLLBACK;');
  console.error('Migration failed:', err);
}
