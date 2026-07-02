import Database from 'better-sqlite3';
import path from 'path';

// Setup database connection
// In a real production scenario, this would be a Postgres connection pool.
// For this POC, we use a local SQLite file.
const isVercel = !!process.env.VERCEL;
const dbPath = process.env.DATABASE_URL || (isVercel ? '/tmp/risklens.db' : path.join(process.cwd(), 'risklens.db'));
const db = new Database(dbPath, { verbose: console.log });

db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    tier TEXT NOT NULL DEFAULT 'free',
    industry TEXT,
    company_size TEXT DEFAULT '1_50',
    benchmark_opt_out INTEGER DEFAULT 0,
    onboarding_step TEXT,
    time_to_first_containment_minutes REAL,
    first_ace_achieved_at TEXT,
    activation_intent TEXT,
    slug TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS identity_providers (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL UNIQUE,
    provider_type TEXT NOT NULL,
    domain TEXT NOT NULL,
    metadata_url TEXT,
    entity_id TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS sso_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    idp_id TEXT NOT NULL,
    login_at TEXT NOT NULL,
    ip_address TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(organization_id) REFERENCES organizations(id),
    FOREIGN KEY(idp_id) REFERENCES identity_providers(id)
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
    plan_id TEXT NOT NULL DEFAULT 'free',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT NOT NULL,
    current_period_end TEXT,
    cancel_at_period_end INTEGER DEFAULT 0,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    stripe_invoice_id TEXT UNIQUE NOT NULL,
    plan_snapshot TEXT NOT NULL,
    usage_snapshot TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    status TEXT NOT NULL,
    hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS billing_logs (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload TEXT,
    created_at TEXT NOT NULL,
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

  CREATE TABLE IF NOT EXISTS invitations (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,
    invited_by TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    source_ip TEXT,
    target TEXT,
    event_type TEXT,
    status TEXT,
    payload TEXT,
    source_type TEXT NOT NULL,
    raw_log TEXT NOT NULL,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    rule_name TEXT NOT NULL,
    severity TEXT NOT NULL,
    confidence REAL NOT NULL,
    timestamp TEXT NOT NULL,
    source_ip TEXT,
    target TEXT,
    description TEXT,
    mitre_technique TEXT,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    title TEXT NOT NULL,
    severity TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    summary TEXT,
    ai_summary TEXT,
    timeline_json TEXT,
    mitre_tactics TEXT,
    root_cause_tree TEXT,
    prompt_version TEXT,
    token_usage INTEGER,
    analysis_cost REAL,
    analysis_confidence REAL,
    analyst_notes TEXT,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS incident_alerts (
    incident_id TEXT,
    alert_id TEXT,
    PRIMARY KEY (incident_id, alert_id),
    FOREIGN KEY(incident_id) REFERENCES incidents(id),
    FOREIGN KEY(alert_id) REFERENCES alerts(id)
  );

  CREATE TABLE IF NOT EXISTS incident_edges (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    source_incident_id TEXT NOT NULL,
    target_incident_id TEXT NOT NULL,
    relation_type TEXT NOT NULL,
    confidence REAL NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(organization_id, source_incident_id, target_incident_id),
    FOREIGN KEY(organization_id) REFERENCES organizations(id),
    FOREIGN KEY(source_incident_id) REFERENCES incidents(id),
    FOREIGN KEY(target_incident_id) REFERENCES incidents(id)
  );

  CREATE TABLE IF NOT EXISTS actions (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
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
    deleted_at TEXT,
    FOREIGN KEY(organization_id) REFERENCES organizations(id),
    FOREIGN KEY(incident_id) REFERENCES incidents(id)
  );

  CREATE TABLE IF NOT EXISTS policies (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    conditions_json TEXT NOT NULL,
    actions_json TEXT NOT NULL,
    cooldown_minutes INTEGER NOT NULL DEFAULT 60,
    last_triggered_at TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    deleted_at TEXT,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS playbooks (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    dag_json TEXT NOT NULL,
    playbook_hash TEXT,
    execution_mode TEXT NOT NULL DEFAULT 'fully_autonomous',
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
    approval_snapshot_json TEXT,
    started_at TEXT NOT NULL,
    expires_at TEXT,
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

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    report_period TEXT NOT NULL,
    generated_at TEXT NOT NULL,
    prompt_version TEXT,
    source_snapshot_json TEXT NOT NULL,
    llm_summary TEXT NOT NULL,
    llm_recommendations TEXT NOT NULL,
    integrity_hash TEXT NOT NULL,
    risk_rating TEXT NOT NULL,
    deleted_at TEXT,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS beta_events (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    user_id TEXT,
    session_id TEXT,
    event_type TEXT NOT NULL,
    metadata_json TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS design_partner_feedback (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    interview_type TEXT NOT NULL,
    pain_score INTEGER,
    wow_moment TEXT,
    confusing_moment TEXT,
    missing_feature TEXT,
    willing_to_pay INTEGER,
    price_anchor REAL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS design_partner_pipeline (
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
  );

  CREATE TABLE IF NOT EXISTS customer_references (
    id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    segment TEXT NOT NULL,
    stack_json TEXT NOT NULL,
    metrics_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS objection_playbooks (
    id TEXT PRIMARY KEY,
    objection_type TEXT NOT NULL,
    trigger_words_json TEXT NOT NULL,
    response_strategy TEXT NOT NULL,
    recommended_docs_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS report_snapshots (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    snapshot_json TEXT NOT NULL,
    hash TEXT NOT NULL,
    generated_at TEXT NOT NULL,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS stakeholder_map (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT,
    influence_score INTEGER DEFAULT 0,
    is_champion INTEGER DEFAULT 0,
    is_blocker INTEGER DEFAULT 0,
    last_contact_at TEXT,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS deal_engagement_events (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    actor_hash TEXT NOT NULL,
    event_type TEXT NOT NULL,
    weight INTEGER DEFAULT 1,
    source_stakeholder_id TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS retention_playbooks (
    id TEXT PRIMARY KEY,
    trigger_type TEXT NOT NULL,
    threshold INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    content_template TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS retention_actions_log (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    executed INTEGER DEFAULT 0,
    outcome TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

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
    created_at TEXT NOT NULL,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

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
    created_at TEXT NOT NULL,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

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
    created_at TEXT NOT NULL,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS board_triggers (
    id TEXT PRIMARY KEY,
    trigger_rule TEXT NOT NULL,
    action_recommendation TEXT NOT NULL,
    priority INTEGER NOT NULL,
    active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS partners (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- mssp | reseller | vciso
    tier TEXT NOT NULL, -- silver | gold | platinum
    rev_share_percent REAL NOT NULL,
    slug TEXT UNIQUE,
    status TEXT DEFAULT 'active',
    billing_model TEXT, -- rev_share | wholesale | referral
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS partner_accounts (
    id TEXT PRIMARY KEY,
    partner_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    contract_start TEXT,
    contract_end TEXT,
    primary_operator_user_id TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(partner_id) REFERENCES partners(id),
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS partner_commissions (
    id TEXT PRIMARY KEY,
    partner_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    invoice_id TEXT,
    commission_amount REAL NOT NULL,
    paid_at TEXT,
    status TEXT DEFAULT 'pending', -- pending | paid | disputed
    snapshot_hash TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(partner_id) REFERENCES partners(id),
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS partner_playbooks (
    id TEXT PRIMARY KEY,
    partner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    playbook_json TEXT NOT NULL,
    visibility TEXT DEFAULT 'private',
    version INTEGER DEFAULT 1,
    adoption_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY(partner_id) REFERENCES partners(id)
  );

  CREATE TABLE IF NOT EXISTS partner_users (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    partner_id TEXT NOT NULL,
    role TEXT NOT NULL, -- partner_admin | partner_operator | partner_analyst
    created_at TEXT NOT NULL,
    UNIQUE(user_id, partner_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(partner_id) REFERENCES partners(id)
  );

  CREATE TABLE IF NOT EXISTS partner_activity_logs (
    id TEXT PRIMARY KEY,
    partner_id TEXT NOT NULL,
    partner_user_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(partner_id) REFERENCES partners(id),
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

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
    updated_at TEXT NOT NULL,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS sales_objections (
    id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    objection_type TEXT NOT NULL,
    exact_words TEXT NOT NULL,
    severity TEXT NOT NULL,
    resolved INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS auth_logs (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT,
    login_at TEXT NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    scope TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_used_at TEXT,
    expires_at TEXT,
    revoked_at TEXT,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS rate_limits (
    key_hash TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0,
    reset_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS destinations (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    webhook_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS delivery_logs (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    destination_id TEXT NOT NULL,
    incident_id TEXT,
    status TEXT NOT NULL,
    provider_response TEXT,
    attempts INTEGER DEFAULT 1,
    next_retry_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(organization_id) REFERENCES organizations(id),
    FOREIGN KEY(destination_id) REFERENCES destinations(id)
  );

  CREATE TABLE IF NOT EXISTS benchmark_snapshots (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    industry TEXT NOT NULL,
    company_size TEXT NOT NULL,
    avg_mttr_minutes REAL NOT NULL,
    containment_rate REAL NOT NULL,
    hours_saved REAL NOT NULL,
    roi_multiple REAL NOT NULL,
    playbook_penetration REAL NOT NULL,
    incident_volume INTEGER NOT NULL,
    mttr_percentile INTEGER NOT NULL,
    containment_percentile INTEGER NOT NULL,
    roi_percentile INTEGER NOT NULL,
    snapshot_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS marketplace_assets (
    id TEXT PRIMARY KEY,
    creator_partner_id TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL, -- playbook | compliance | benchmark_pack
    name TEXT NOT NULL,
    description TEXT,
    asset_json TEXT NOT NULL,
    price REAL NOT NULL,
    status TEXT DEFAULT 'draft', -- draft | published | deprecated
    visibility TEXT DEFAULT 'public',
    version TEXT DEFAULT '1.0',
    verified INTEGER DEFAULT 0,
    installs INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY(creator_partner_id) REFERENCES partners(id)
  );

  CREATE TABLE IF NOT EXISTS marketplace_installs (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    installed_by TEXT NOT NULL,
    install_mode TEXT DEFAULT 'simulated', -- simulated | active
    license_type TEXT DEFAULT 'one_time', -- one_time | subscription
    success_state TEXT,
    installed_at TEXT NOT NULL,
    FOREIGN KEY(asset_id) REFERENCES marketplace_assets(id),
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS marketplace_payouts (
    id TEXT PRIMARY KEY,
    creator_partner_id TEXT NOT NULL,
    asset_id TEXT NOT NULL,
    invoice_id TEXT,
    amount REAL NOT NULL,
    paid_at TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT NOT NULL,
    FOREIGN KEY(creator_partner_id) REFERENCES partners(id),
    FOREIGN KEY(asset_id) REFERENCES marketplace_assets(id)
  );

  CREATE TABLE IF NOT EXISTS marketplace_reviews (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    review_text TEXT,
    verified_install INTEGER DEFAULT 1,
    organization_segment TEXT,
    incident_volume_band TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(asset_id) REFERENCES marketplace_assets(id),
    FOREIGN KEY(organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS partner_reputation_cache (
    partner_id TEXT PRIMARY KEY,
    avg_asset_rating REAL DEFAULT 0,
    benchmark_win_rate REAL DEFAULT 0,
    install_volume INTEGER DEFAULT 0,
    last_updated_at TEXT NOT NULL,
    FOREIGN KEY(partner_id) REFERENCES partners(id)
  );
`);

// Upgrade existing tables safely
try { db.exec("ALTER TABLE organizations ADD COLUMN stripe_customer_id TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE organizations ADD COLUMN billing_email TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE organizations ADD COLUMN grace_until TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE organizations ADD COLUMN industry TEXT DEFAULT 'tech';"); } catch (e) {}
try { db.exec("ALTER TABLE organizations ADD COLUMN company_size TEXT DEFAULT '1_50';"); } catch (e) {}
try { db.exec("ALTER TABLE organizations ADD COLUMN benchmark_opt_out INTEGER DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE organizations ADD COLUMN onboarding_step TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE organizations ADD COLUMN time_to_first_containment_minutes REAL;"); } catch (e) {}
try { db.exec("ALTER TABLE organizations ADD COLUMN first_ace_achieved_at TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE organizations ADD COLUMN activation_intent TEXT;"); } catch (e) {}

try { db.exec("ALTER TABLE marketplace_reviews ADD COLUMN organization_segment TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE marketplace_reviews ADD COLUMN incident_volume_band TEXT;"); } catch (e) {}

// Seed Default Organization
const checkOrgs = db.prepare('SELECT COUNT(*) as count FROM organizations').get() as any;
if (checkOrgs.count === 0) {
  const now = new Date().toISOString();
  db.prepare('INSERT INTO organizations (id, name, slug, plan, status, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run('org_default', 'RiskLens Internal', 'risklens-internal', 'enterprise', 'active', now);
  console.log('[DB] Default organization seeded successfully.');
}

// Seed Mock Users and Memberships
const checkUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
if (checkUsers.count === 0) {
  const defaultHash = '$2b$10$UQhO1zf.kaVjRnNlMdf/2OgDrF/NsDoYD83XqzSTrBbii6sNviD4C'; // password123
  const now = new Date().toISOString();
  
  const insertUser = db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)');
  insertUser.run('usr_admin', 'admin@risklens.local', defaultHash, now);
  insertUser.run('usr_analyst', 'analyst@risklens.local', defaultHash, now);
  insertUser.run('usr_board', 'board@risklens.local', defaultHash, now);

  const insertMembership = db.prepare('INSERT INTO memberships (id, user_id, organization_id, role) VALUES (?, ?, ?, ?)');
  insertMembership.run('mem_admin', 'usr_admin', 'org_default', 'Org Admin');
  insertMembership.run('mem_analyst', 'usr_analyst', 'org_default', 'SOC Analyst');
  insertMembership.run('mem_board', 'usr_board', 'org_default', 'Board Member');

  console.log('[DB] Mock users and memberships seeded successfully.');
}

// Seed Mock API Key for Ingestion
const checkApiKeys = db.prepare('SELECT COUNT(*) as count FROM api_keys').get() as any;
if (checkApiKeys.count === 0) {
  const insertKey = db.prepare('INSERT INTO api_keys (id, organization_id, key_hash, scope, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  // We'll use a plain text key "demo_ingest_key_2026" for prototype simplicity, but in a real app this must be hashed.
  insertKey.run('key_demo', 'org_default', 'demo_ingest_key_2026', 'ingest_only', 'active', 'usr_admin', new Date().toISOString());
  console.log('[DB] Mock API key seeded successfully.');
}

export default db;
