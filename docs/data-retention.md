# RiskLens Data Retention Policy

### Log Retention
By default, RiskLens retains ingested security alerts and logs for **90 days**. 
- Data older than 90 days is automatically purged from the active SQLite/PostgreSQL clusters.
- Customers on Enterprise plans can opt into 365-day cold storage retention.

### Incident and Memory Graph Retention
Incident metadata, Root Cause Analyses, and Memory Graph vertices are retained for **1 year** to ensure long-term threat actor tracking and Predictive Escalation scoring.

### Data Deletion (Right to be Forgotten)
Upon contract termination or explicit user request, RiskLens will permanently purge all tenant data (`organization_id` scope) within **7 business days**. This includes all active databases, backups, and vector embeddings.

### Backups
RiskLens takes daily automated snapshots of the database. Backups are retained for 30 days and are encrypted at rest.
