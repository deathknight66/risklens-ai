export interface ThreatAlert {
  id: string
  type: 'brute_force' | 'ddos' | 'sql_injection' | 'malware' | 'credential_attack' | 'data_exfiltration'
  severity: 'critical' | 'high' | 'medium' | 'low'
  source: string
  target: string
  description: string
  timestamp: string
  status: 'active' | 'investigating' | 'mitigated' | 'resolved'
  attackVector: string
  affectedSystems: string[]
  riskScore: number
}

export interface DashboardMetrics {
  securityScore: number
  totalThreats: number
  criticalThreats: number
  highThreats: number
  mediumThreats: number
  lowThreats: number
  activeIncidents: number
  resolvedToday: number
  avgResponseTime: string
  systemsMonitored: number
  alertsToday: number
  blockedAttacks: number
}

export interface TimelineData {
  date: string
  threats: number
  blocked: number
  resolved: number
}

export interface SystemStatus {
  name: string
  status: 'online' | 'warning' | 'offline'
  uptime: string
  lastCheck: string
  type: 'firewall' | 'server' | 'cloud' | 'endpoint'
}

export interface InvestigationResult {
  id: string
  incidentId: string
  rootCause: string
  attackTimeline: { time: string; event: string; severity: string }[]
  affectedAssets: string[]
  riskScore: number
  recommendation: string[]
  aiSummary: string
}

export interface BusinessImpact {
  category: string
  financialLoss: number
  dataRecordsAffected: number
  downtimeHours: number
  reputationScore: number
  complianceRisk: string
  mitigationCost: number
  priority: 'critical' | 'high' | 'medium' | 'low'
}

export interface Report {
  id: string
  title: string
  type: 'incident' | 'compliance' | 'executive'
  status: 'draft' | 'generated' | 'approved'
  createdAt: string
  severity: string
  summary: string
}

// ===================== MOCK DATA =====================

export const dashboardMetrics: DashboardMetrics = {
  securityScore: 73,
  totalThreats: 1247,
  criticalThreats: 12,
  highThreats: 47,
  mediumThreats: 186,
  lowThreats: 1002,
  activeIncidents: 8,
  resolvedToday: 23,
  avgResponseTime: '4.2 min',
  systemsMonitored: 34,
  alertsToday: 342,
  blockedAttacks: 1893,
}

export const threatAlerts: ThreatAlert[] = [
  {
    id: 'THR-001',
    type: 'brute_force',
    severity: 'critical',
    source: '185.220.101.42',
    target: 'auth-server-01',
    description: 'Multiple failed login attempts detected from single IP. 847 attempts in 5 minutes targeting admin accounts.',
    timestamp: '2026-06-05T10:15:00Z',
    status: 'active',
    attackVector: 'SSH Brute Force',
    affectedSystems: ['auth-server-01', 'vpn-gateway', 'ad-controller'],
    riskScore: 92,
  },
  {
    id: 'THR-002',
    type: 'ddos',
    severity: 'critical',
    source: 'Multiple (Botnet)',
    target: 'web-cluster-prod',
    description: 'Distributed Denial of Service attack detected. Traffic spike of 45 Gbps from 12,000+ unique IPs targeting web infrastructure.',
    timestamp: '2026-06-05T09:42:00Z',
    status: 'investigating',
    attackVector: 'HTTP Flood + SYN Flood',
    affectedSystems: ['web-cluster-prod', 'load-balancer-01', 'cdn-edge'],
    riskScore: 95,
  },
  {
    id: 'THR-003',
    type: 'sql_injection',
    severity: 'high',
    source: '103.45.67.89',
    target: 'api-gateway-02',
    description: 'SQL injection attempts detected on customer API endpoint. Attacker attempting to extract user database.',
    timestamp: '2026-06-05T09:28:00Z',
    status: 'investigating',
    attackVector: 'Union-based SQL Injection',
    affectedSystems: ['api-gateway-02', 'db-customer-primary'],
    riskScore: 85,
  },
  {
    id: 'THR-004',
    type: 'malware',
    severity: 'high',
    source: 'Internal - WS-FINANCE-07',
    target: 'file-server-03',
    description: 'Ransomware signature detected on finance workstation. Lateral movement indicators found.',
    timestamp: '2026-06-05T08:56:00Z',
    status: 'active',
    attackVector: 'Phishing Email → Macro Execution',
    affectedSystems: ['WS-FINANCE-07', 'file-server-03', 'print-server'],
    riskScore: 88,
  },
  {
    id: 'THR-005',
    type: 'credential_attack',
    severity: 'medium',
    source: '45.33.12.156',
    target: 'office365-tenant',
    description: 'Password spraying attack against Microsoft 365 accounts. 15 accounts targeted with common passwords.',
    timestamp: '2026-06-05T08:12:00Z',
    status: 'mitigated',
    attackVector: 'Password Spraying',
    affectedSystems: ['office365-tenant', 'azure-ad'],
    riskScore: 62,
  },
  {
    id: 'THR-006',
    type: 'data_exfiltration',
    severity: 'high',
    source: 'Internal - SRV-DEV-04',
    target: 'external-endpoint',
    description: 'Unusual data transfer detected. 2.3 GB of encrypted data sent to unknown external server during off-hours.',
    timestamp: '2026-06-05T07:30:00Z',
    status: 'investigating',
    attackVector: 'DNS Tunneling',
    affectedSystems: ['SRV-DEV-04', 'dns-resolver'],
    riskScore: 78,
  },
  {
    id: 'THR-007',
    type: 'brute_force',
    severity: 'medium',
    source: '91.234.56.78',
    target: 'ftp-server-01',
    description: 'FTP brute force attempt from Eastern European IP. 234 login attempts across multiple usernames.',
    timestamp: '2026-06-05T06:45:00Z',
    status: 'resolved',
    attackVector: 'FTP Credential Stuffing',
    affectedSystems: ['ftp-server-01'],
    riskScore: 45,
  },
  {
    id: 'THR-008',
    type: 'malware',
    severity: 'low',
    source: 'WS-HR-12',
    target: 'WS-HR-12',
    description: 'Potentially unwanted program (PUP) detected on HR workstation. Low risk adware variant.',
    timestamp: '2026-06-05T06:00:00Z',
    status: 'resolved',
    attackVector: 'Software Bundle',
    affectedSystems: ['WS-HR-12'],
    riskScore: 18,
  },
  {
    id: 'THR-009',
    type: 'sql_injection',
    severity: 'medium',
    source: '178.90.12.34',
    target: 'web-app-staging',
    description: 'Automated SQL injection scanning detected against staging environment. No data breach confirmed.',
    timestamp: '2026-06-05T05:20:00Z',
    status: 'mitigated',
    attackVector: 'Blind SQL Injection',
    affectedSystems: ['web-app-staging', 'db-staging'],
    riskScore: 52,
  },
  {
    id: 'THR-010',
    type: 'ddos',
    severity: 'low',
    source: '5 IPs',
    target: 'api-docs-server',
    description: 'Minor traffic anomaly detected on API documentation server. Small-scale volumetric attack.',
    timestamp: '2026-06-05T04:10:00Z',
    status: 'resolved',
    attackVector: 'UDP Flood',
    affectedSystems: ['api-docs-server'],
    riskScore: 22,
  },
]

export const timelineData: TimelineData[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - (29 - i))
  const baseThreats = 30 + Math.floor(Math.random() * 25)
  return {
    date: date.toISOString().split('T')[0],
    threats: baseThreats + (i > 25 ? Math.floor(Math.random() * 15) : 0),
    blocked: Math.floor(baseThreats * (0.7 + Math.random() * 0.2)),
    resolved: Math.floor(baseThreats * (0.5 + Math.random() * 0.3)),
  }
})

export const threatDistribution = [
  { name: 'Brute Force', value: 35, color: '#ef4444' },
  { name: 'DDoS', value: 22, color: '#f97316' },
  { name: 'SQL Injection', value: 18, color: '#f59e0b' },
  { name: 'Malware', value: 15, color: '#a855f7' },
  { name: 'Data Exfiltration', value: 7, color: '#06b6d4' },
  { name: 'Other', value: 3, color: '#64748b' },
]

export const attackSourcesData = [
  { country: 'China', attacks: 342, percentage: 27 },
  { country: 'Russia', attacks: 256, percentage: 21 },
  { country: 'United States', attacks: 189, percentage: 15 },
  { country: 'Brazil', attacks: 134, percentage: 11 },
  { country: 'India', attacks: 98, percentage: 8 },
  { country: 'Iran', attacks: 87, percentage: 7 },
  { country: 'North Korea', attacks: 65, percentage: 5 },
  { country: 'Others', attacks: 76, percentage: 6 },
]

export const systemStatuses: SystemStatus[] = [
  { name: 'Fortigate FW-01', status: 'online', uptime: '99.9%', lastCheck: '30s ago', type: 'firewall' },
  { name: 'Palo Alto PA-3260', status: 'online', uptime: '99.8%', lastCheck: '45s ago', type: 'firewall' },
  { name: 'Web Server Cluster', status: 'warning', uptime: '98.2%', lastCheck: '15s ago', type: 'server' },
  { name: 'Database Primary', status: 'online', uptime: '99.99%', lastCheck: '10s ago', type: 'server' },
  { name: 'AWS Production', status: 'online', uptime: '99.95%', lastCheck: '20s ago', type: 'cloud' },
  { name: 'Azure AD', status: 'online', uptime: '99.9%', lastCheck: '35s ago', type: 'cloud' },
  { name: 'GCP Analytics', status: 'online', uptime: '99.7%', lastCheck: '60s ago', type: 'cloud' },
  { name: 'Windows Endpoints', status: 'warning', uptime: '97.5%', lastCheck: '5s ago', type: 'endpoint' },
]

export const investigationResults: InvestigationResult[] = [
  {
    id: 'INV-001',
    incidentId: 'THR-001',
    rootCause: 'Compromised credential from dark web marketplace. Attacker using automated tool "Hydra" to brute force SSH access with leaked corporate credentials.',
    attackTimeline: [
      { time: '09:45:00', event: 'Initial reconnaissance scan on port 22', severity: 'low' },
      { time: '09:52:00', event: 'First login attempt with leaked credentials', severity: 'medium' },
      { time: '10:01:00', event: 'Automated brute force tool activated', severity: 'high' },
      { time: '10:08:00', event: 'Rate exceeded 100 attempts/minute', severity: 'high' },
      { time: '10:12:00', event: 'Successful login on service account', severity: 'critical' },
      { time: '10:15:00', event: 'Lateral movement attempt detected', severity: 'critical' },
    ],
    affectedAssets: ['auth-server-01', 'vpn-gateway', 'ad-controller', 'service-account-svc01'],
    riskScore: 92,
    recommendation: [
      'Immediately disable compromised service account svc01',
      'Block source IP 185.220.101.42 at perimeter firewall',
      'Force password reset for all service accounts',
      'Enable MFA for all SSH access',
      'Review and revoke unnecessary service account privileges',
      'Deploy rate limiting on SSH endpoints',
    ],
    aiSummary: 'This is a sophisticated credential-based attack leveraging previously leaked corporate credentials found on dark web marketplaces. The attacker used Hydra, an automated brute force tool, to systematically test credentials against SSH endpoints. A service account with weak credentials was successfully compromised, enabling lateral movement attempts. Immediate credential rotation and MFA enforcement are critical to contain this incident.',
  },
  {
    id: 'INV-002',
    incidentId: 'THR-002',
    rootCause: 'Large-scale DDoS attack originating from Mirai-variant botnet. The attack uses a combination of HTTP flood and SYN flood techniques to overwhelm web infrastructure.',
    attackTimeline: [
      { time: '09:20:00', event: 'Traffic anomaly first detected', severity: 'low' },
      { time: '09:28:00', event: 'Traffic volume exceeded baseline by 300%', severity: 'medium' },
      { time: '09:35:00', event: 'SYN flood packets identified', severity: 'high' },
      { time: '09:38:00', event: 'HTTP flood from 12,000+ unique IPs', severity: 'critical' },
      { time: '09:42:00', event: 'Service degradation on web cluster', severity: 'critical' },
      { time: '09:48:00', event: 'Auto-scaling triggered, partial mitigation', severity: 'high' },
    ],
    affectedAssets: ['web-cluster-prod', 'load-balancer-01', 'cdn-edge', 'dns-primary'],
    riskScore: 95,
    recommendation: [
      'Activate DDoS mitigation service (Cloudflare/AWS Shield)',
      'Enable geographic IP blocking for non-business regions',
      'Implement rate limiting at CDN edge',
      'Scale infrastructure horizontally during attack',
      'Coordinate with ISP for upstream filtering',
      'Review and update DDoS response playbook',
    ],
    aiSummary: 'A Mirai-variant botnet launched a multi-vector DDoS attack combining HTTP flooding (Layer 7) and SYN flooding (Layer 4). The attack originates from approximately 12,000 compromised IoT devices across 45 countries. Peak traffic reached 45 Gbps, causing service degradation. Auto-scaling partially mitigated the impact, but dedicated DDoS protection services are needed for full mitigation.',
  },
]

export const businessImpacts: BusinessImpact[] = [
  {
    category: 'DDoS on Web Infrastructure',
    financialLoss: 285000,
    dataRecordsAffected: 0,
    downtimeHours: 4.5,
    reputationScore: 72,
    complianceRisk: 'Medium - SLA breach with 3 enterprise clients',
    mitigationCost: 45000,
    priority: 'critical',
  },
  {
    category: 'SSH Brute Force - Credential Compromise',
    financialLoss: 520000,
    dataRecordsAffected: 15000,
    downtimeHours: 0,
    reputationScore: 58,
    complianceRisk: 'High - Potential PCI DSS violation',
    mitigationCost: 35000,
    priority: 'critical',
  },
  {
    category: 'SQL Injection on Customer API',
    financialLoss: 180000,
    dataRecordsAffected: 8500,
    downtimeHours: 1.5,
    reputationScore: 65,
    complianceRisk: 'High - GDPR data breach notification required',
    mitigationCost: 28000,
    priority: 'high',
  },
  {
    category: 'Ransomware on Finance Workstation',
    financialLoss: 750000,
    dataRecordsAffected: 42000,
    downtimeHours: 8,
    reputationScore: 45,
    complianceRisk: 'Critical - SOX compliance impact',
    mitigationCost: 120000,
    priority: 'critical',
  },
  {
    category: 'Data Exfiltration via DNS Tunneling',
    financialLoss: 340000,
    dataRecordsAffected: 23000,
    downtimeHours: 0,
    reputationScore: 52,
    complianceRisk: 'High - Intellectual property theft',
    mitigationCost: 55000,
    priority: 'high',
  },
  {
    category: 'Password Spraying on O365',
    financialLoss: 45000,
    dataRecordsAffected: 0,
    downtimeHours: 0,
    reputationScore: 85,
    complianceRisk: 'Low - No data access confirmed',
    mitigationCost: 12000,
    priority: 'medium',
  },
]

export const reports: Report[] = [
  {
    id: 'RPT-001',
    title: 'Critical DDoS Incident Report - Web Infrastructure',
    type: 'incident',
    status: 'generated',
    createdAt: '2026-06-05T10:30:00Z',
    severity: 'critical',
    summary: 'Comprehensive analysis of the 45 Gbps DDoS attack targeting production web infrastructure. Includes attack timeline, impact assessment, and mitigation recommendations.',
  },
  {
    id: 'RPT-002',
    title: 'Monthly Executive Security Summary - June 2026',
    type: 'executive',
    status: 'generated',
    createdAt: '2026-06-01T09:00:00Z',
    severity: 'high',
    summary: 'Monthly overview of security posture including threat trends, incident metrics, risk scores, and strategic recommendations for executive leadership.',
  },
  {
    id: 'RPT-003',
    title: 'PCI DSS Compliance Gap Analysis',
    type: 'compliance',
    status: 'approved',
    createdAt: '2026-05-28T14:00:00Z',
    severity: 'high',
    summary: 'Assessment of current PCI DSS compliance status following credential compromise incident. Identifies gaps and provides remediation roadmap.',
  },
  {
    id: 'RPT-004',
    title: 'Ransomware Incident Report - Finance Department',
    type: 'incident',
    status: 'draft',
    createdAt: '2026-06-05T09:00:00Z',
    severity: 'critical',
    summary: 'Investigation report for ransomware incident affecting finance workstation. Details attack chain from phishing email to lateral movement.',
  },
  {
    id: 'RPT-005',
    title: 'ISO 27001 Annual Audit Preparation',
    type: 'compliance',
    status: 'generated',
    createdAt: '2026-05-15T10:00:00Z',
    severity: 'medium',
    summary: 'Pre-audit documentation and control assessment for upcoming ISO 27001 surveillance audit.',
  },
  {
    id: 'RPT-006',
    title: 'Q2 2026 Security Posture Report',
    type: 'executive',
    status: 'draft',
    createdAt: '2026-06-04T16:00:00Z',
    severity: 'medium',
    summary: 'Quarterly security metrics, trend analysis, budget utilization, and strategic initiative progress report.',
  },
]

export const riskMatrixData = [
  { impact: 5, likelihood: 5, label: 'Ransomware', color: '#ef4444' },
  { impact: 4, likelihood: 5, label: 'DDoS', color: '#ef4444' },
  { impact: 5, likelihood: 3, label: 'Data Breach', color: '#f97316' },
  { impact: 3, likelihood: 4, label: 'SQL Injection', color: '#f97316' },
  { impact: 4, likelihood: 3, label: 'Credential Theft', color: '#f59e0b' },
  { impact: 2, likelihood: 4, label: 'Brute Force', color: '#f59e0b' },
  { impact: 3, likelihood: 2, label: 'Insider Threat', color: '#f59e0b' },
  { impact: 1, likelihood: 3, label: 'PUP/Adware', color: '#22c55e' },
  { impact: 2, likelihood: 2, label: 'Port Scanning', color: '#22c55e' },
]

export const weeklyTrendData = [
  { week: 'Week 1', critical: 3, high: 12, medium: 45, low: 120 },
  { week: 'Week 2', critical: 5, high: 18, medium: 52, low: 98 },
  { week: 'Week 3', critical: 2, high: 8, medium: 38, low: 145 },
  { week: 'Week 4', critical: 8, high: 22, medium: 67, low: 110 },
  { week: 'Week 5', critical: 12, high: 47, medium: 186, low: 230 },
]

export const aiChatMessages = [
  {
    role: 'user' as const,
    content: 'Analyze the current brute force attack on auth-server-01 and provide recommendations.',
  },
  {
    role: 'assistant' as const,
    content: `## Brute Force Attack Analysis - THR-001

**Status:** 🔴 Active | **Risk Score:** 92/100

### Attack Summary
I've analyzed the attack pattern on auth-server-01. Here are my findings:

**Attack Profile:**
- **Source IP:** 185.220.101.42 (Tor exit node, Frankfurt, Germany)
- **Method:** SSH Brute Force using Hydra toolkit
- **Duration:** 30 minutes (ongoing)
- **Attempts:** 847 login attempts across 12 service accounts
- **Success:** 1 compromised account (svc01)

### Root Cause
The attacker obtained a list of valid service account usernames from a credential dump posted on a dark web marketplace 3 days ago. The compromised account \`svc01\` used a weak password that hadn't been rotated in 180 days.

### Immediate Recommendations
1. 🚨 **Disable account svc01** immediately
2. 🔒 **Block IP 185.220.101.42** at perimeter
3. 🔑 **Force password rotation** for all service accounts
4. ✅ **Enable MFA** on all SSH endpoints
5. 📊 **Deploy rate limiting** (max 5 attempts/minute)

### Business Impact
- **Estimated Financial Risk:** $520,000
- **Data at Risk:** 15,000 customer records
- **Compliance:** Potential PCI DSS violation`,
  },
  {
    role: 'user' as const,
    content: 'What is the estimated business impact if the attacker gains access to the database?',
  },
  {
    role: 'assistant' as const,
    content: `## Business Impact Assessment - Database Breach Scenario

### Worst-Case Scenario Analysis

If the attacker pivots from the compromised service account to the customer database, here's the projected impact:

| Impact Category | Estimate |
|----------------|----------|
| **Direct Financial Loss** | $2.4M - $4.8M |
| **Regulatory Fines (GDPR/PCI)** | $850K - $3.2M |
| **Customer Notification Cost** | $180K |
| **Legal & Forensics** | $350K - $500K |
| **Revenue Loss (Churn)** | $1.2M annually |
| **Total Potential Impact** | **$5.0M - $9.1M** |

### Data at Risk
- 📊 **245,000** customer records
- 💳 **89,000** payment card records (PCI scope)
- 📧 **312,000** email addresses
- 🔐 **15,000** hashed passwords

### Regulatory Implications
- **GDPR:** 72-hour breach notification required
- **PCI DSS:** Level 1 merchant compliance revocation risk
- **SOX:** Material impact on financial reporting

### Recommended Priority Actions
The cost of prevention ($35,000) is **143x less** than the potential breach cost. Immediate containment is strongly advised.`,
  },
]
