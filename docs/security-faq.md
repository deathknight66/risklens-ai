# RiskLens Security FAQ

### 1. How is tenant data isolated?
RiskLens employs strict logical isolation at the ORM/Query layer. Every row of sensitive data (logs, incidents, api_keys) is scoped to an `organization_id`. Database queries are incapable of fetching cross-tenant data. We also use dedicated API keys per tenant.

### 2. Is data encrypted?
Yes. All data in transit is encrypted via TLS 1.3. Data at rest is encrypted using AES-256 (managed by AWS/GCP depending on the deployment zone). Passwords and API keys are strictly hashed (bcrypt/SHA-256) and never stored in plaintext.

### 3. How do you handle SSO and SAML?
We fully support Enterprise SSO, including SCIM for automated provisioning and de-provisioning, ensuring that off-boarded employees instantly lose access to RiskLens.

### 4. Who has access to our log data?
Only authorized RiskLens Support Engineers and the named users within your Organization. We maintain a strict audit log of all internal access for compliance purposes.

### 5. Does RiskLens replace our SIEM?
No. RiskLens acts as an Autonomous Incident Intelligence layer that sits *on top* of your existing SIEM (like Splunk or Datadog) or security tools (like Cloudflare or GuardDuty). We ingest only the alerts, not the raw petabytes of application logs.
