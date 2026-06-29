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
  attackTimeline: { time: string; event: string; severity: string; confidence: number; details?: string }[]
  rootCauseTree: RootCauseNode
  threatMemory: { similarIncidentId: string; similarityScore: number; date: string; description: string }
  affectedAssets: string[]
  riskScore: number
  recommendation: { action: string; type: 'block_ip' | 'isolate_endpoint' | 'reset_credentials' | 'disable_api_key' | 'general'; status: 'pending' | 'executing' | 'completed' }[]
  aiSummary: string
}

export interface RootCauseNode {
  id: string
  label: string
  type: 'initial_access' | 'execution' | 'lateral_movement' | 'impact'
  confidence: number
  children?: RootCauseNode[]
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
  blastRadius: { systems: number; users: number; databases: number; apis: number }
  lossEngine: { directLoss: number; downtimeCost: number; slaPenalty: number; totalEstimated: number }
  propagationTree?: RiskPropagationNode
}

export interface RiskPropagationNode {
  id: string
  label: string
  type: 'server' | 'database' | 'api' | 'business_process' | 'external_service'
  status: 'compromised' | 'at_risk' | 'safe'
  lossPerHour: number
  children?: RiskPropagationNode[]
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
      { time: '02:01:00', event: 'Phishing email delivered to HR department', severity: 'low', confidence: 95, details: 'Email matching known Emotet campaign signatures.' },
      { time: '02:07:00', event: 'Employee clicked malicious link', severity: 'medium', confidence: 99, details: 'Redirected to spoofed O365 login page.' },
      { time: '02:10:00', event: 'Credential stolen (svc01)', severity: 'high', confidence: 92, details: 'Session token hijacked.' },
      { time: '02:14:00', event: 'Abnormal VPN login detected', severity: 'high', confidence: 88, details: 'Login from tor exit node in Frankfurt.' },
      { time: '02:19:00', event: 'Privilege escalation attempt', severity: 'critical', confidence: 85, details: 'Exploiting local misconfiguration.' },
      { time: '02:23:00', event: 'Database access initiated', severity: 'critical', confidence: 98, details: 'Querying customer_records table.' },
    ],
    rootCauseTree: {
      id: 'rc-1',
      label: 'Initial Access (Phishing)',
      type: 'initial_access',
      confidence: 95,
      children: [
        {
          id: 'rc-2',
          label: 'Credential Abuse (svc01)',
          type: 'execution',
          confidence: 92,
          children: [
            {
              id: 'rc-3',
              label: 'Misconfigured VPN Access',
              type: 'lateral_movement',
              confidence: 88,
              children: [
                {
                  id: 'rc-4',
                  label: 'Customer DB Exfiltration',
                  type: 'impact',
                  confidence: 98
                }
              ]
            }
          ]
        }
      ]
    },
    threatMemory: {
      similarIncidentId: 'INC-2025-842',
      similarityScore: 87,
      date: '3 weeks ago',
      description: 'Similar credential abuse pattern linked to APT29 group targeting financial sectors.'
    },
    affectedAssets: ['auth-server-01', 'vpn-gateway', 'ad-controller', 'service-account-svc01'],
    riskScore: 92,
    recommendation: [
      { action: 'Block IP 185.220.101.42', type: 'block_ip', status: 'pending' },
      { action: 'Isolate affected endpoint (WS-HR-12)', type: 'isolate_endpoint', status: 'pending' },
      { action: 'Reset credentials for svc01', type: 'reset_credentials', status: 'pending' },
      { action: 'Disable VPN API Key', type: 'disable_api_key', status: 'pending' },
      { action: 'Enable MFA for all SSH access', type: 'general', status: 'pending' },
    ],
    aiSummary: 'This is a sophisticated credential-based attack leveraging a recent phishing campaign. The attacker bypassed initial perimeter defenses by stealing valid session tokens. Immediate autonomous containment is recommended to prevent data exfiltration.',
  },
  {
    id: 'INV-002',
    incidentId: 'THR-002',
    rootCause: 'Large-scale DDoS attack originating from Mirai-variant botnet.',
    attackTimeline: [
      { time: '09:20:00', event: 'Traffic anomaly first detected', severity: 'low', confidence: 90 },
      { time: '09:28:00', event: 'Traffic volume exceeded baseline by 300%', severity: 'medium', confidence: 95 },
      { time: '09:35:00', event: 'SYN flood packets identified', severity: 'high', confidence: 99 },
      { time: '09:38:00', event: 'HTTP flood from 12,000+ unique IPs', severity: 'critical', confidence: 99 },
    ],
    rootCauseTree: {
      id: 'rc-ddos-1',
      label: 'Botnet Assembly (Mirai)',
      type: 'initial_access',
      confidence: 99,
      children: [
        {
          id: 'rc-ddos-2',
          label: 'Volumetric Attack (Layer 4/7)',
          type: 'execution',
          confidence: 99,
          children: [
            {
              id: 'rc-ddos-3',
              label: 'Service Degradation',
              type: 'impact',
              confidence: 95
            }
          ]
        }
      ]
    },
    threatMemory: {
      similarIncidentId: 'INC-2025-112',
      similarityScore: 94,
      date: '2 months ago',
      description: 'Identical Mirai-variant botnet infrastructure used against competitor.'
    },
    affectedAssets: ['web-cluster-prod', 'load-balancer-01'],
    riskScore: 95,
    recommendation: [
      { action: 'Activate DDoS mitigation service (Cloudflare)', type: 'general', status: 'pending' },
      { action: 'Block originating subnets', type: 'block_ip', status: 'pending' }
    ],
    aiSummary: 'A Mirai-variant botnet launched a multi-vector DDoS attack combining HTTP flooding (Layer 7) and SYN flooding (Layer 4).',
  }
]

export const businessImpacts: BusinessImpact[] = [
  {
    category: 'Payment API Compromised',
    financialLoss: 92000,
    dataRecordsAffected: 15000,
    downtimeHours: 6,
    reputationScore: 58,
    complianceRisk: 'High - PCI DSS violation',
    mitigationCost: 35000,
    priority: 'critical',
    blastRadius: { systems: 3, users: 1200, databases: 2, apis: 14 },
    lossEngine: { directLoss: 72000, downtimeCost: 0, slaPenalty: 20000, totalEstimated: 92000 },
    propagationTree: {
      id: 'p-1', label: 'Payment API (Gateway)', type: 'api', status: 'compromised', lossPerHour: 12000,
      children: [
        { id: 'p-2', label: 'Core Banking DB', type: 'database', status: 'at_risk', lossPerHour: 45000 },
        { id: 'p-3', label: 'ERP System', type: 'server', status: 'at_risk', lossPerHour: 8000,
          children: [
            { id: 'p-4', label: 'Finance Processing', type: 'business_process', status: 'at_risk', lossPerHour: 15000 }
          ]
        }
      ]
    }
  },
  {
    category: 'Customer DB Exfiltration Risk',
    financialLoss: 340000,
    dataRecordsAffected: 23000,
    downtimeHours: 0,
    reputationScore: 52,
    complianceRisk: 'Critical - GDPR violation',
    mitigationCost: 55000,
    priority: 'critical',
    blastRadius: { systems: 1, users: 23000, databases: 1, apis: 0 },
    lossEngine: { directLoss: 120000, downtimeCost: 0, slaPenalty: 220000, totalEstimated: 340000 },
    propagationTree: {
      id: 'db-1', label: 'Customer DB Primary', type: 'database', status: 'at_risk', lossPerHour: 50000,
      children: [
        { id: 'db-2', label: 'CRM System', type: 'business_process', status: 'at_risk', lossPerHour: 10000 }
      ]
    }
  },
  {
    category: 'DDoS on Web Infrastructure',
    financialLoss: 285000,
    dataRecordsAffected: 0,
    downtimeHours: 4.5,
    reputationScore: 72,
    complianceRisk: 'Medium - SLA breach with 3 enterprise clients',
    mitigationCost: 45000,
    priority: 'high',
    blastRadius: { systems: 12, users: 50000, databases: 0, apis: 5 },
    lossEngine: { directLoss: 0, downtimeCost: 200000, slaPenalty: 85000, totalEstimated: 285000 }
  }
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

// ===================== PHASE 3 PREDICTIVE DATA =====================

export const executiveDecision = {
  recommendedAction: 'Isolate Payment API',
  projectedLossAvoided: 142000,
  confidence: 91,
  timeToImpact: '18 minutes', // Time to full propagation
  exposureSurface: {
    current: 64,
    projected: 38
  }
}

export const riskForecast = {
  trend: 'up',
  likelihoodChange: '+18%',
  timeframe: 'Next 7 days',
  primaryVector: 'Credential Stuffing'
}

export const insuranceReadiness = {
  score: 78,
  status: 'Eligible',
  premiumImpact: '-12%',
  gaps: ['MFA enforcement gap', 'Unpatched external assets']
}

export const assetCriticality = [
  { name: 'Payment Gateway', score: 99, type: 'api', status: 'critical' },
  { name: 'Core ERP', score: 95, type: 'server', status: 'critical' },
  { name: 'Customer DB', score: 92, type: 'database', status: 'high' },
  { name: 'HR System', score: 61, type: 'server', status: 'medium' },
  { name: 'Marketing Site', score: 34, type: 'server', status: 'low' }
]

export const scenarioComparisons = [
  { scenario: 'No Action', loss: 420000, downtime: '8h', assetsHit: 7, actionType: 'danger' },
  { scenario: 'Rotate Credentials', loss: 150000, downtime: '2h', assetsHit: 3, actionType: 'warning' },
  { scenario: 'Contain Endpoint Now', loss: 90000, downtime: '1.5h', assetsHit: 2, actionType: 'success' },
]

// ===================== PHASE 4 AUTONOMOUS ACTIONS & HYBRID DATA =====================

export const autonomousActions = [
  {
    id: "ACT-001",
    action: "Block External IP",
    target: "185.220.101.42",
    source: "Firewall",
    status: "Executed",
    riskReduction: 72,
    projectedLossAvoided: 142000,
    rollbackAvailable: true,
    executedAt: "2026-06-29T14:22:00Z"
  },
  {
    id: "ACT-002",
    action: "Isolate Payment API",
    target: "payment-api-prod",
    source: "Kubernetes Cluster",
    status: "Pending Approval",
    riskReduction: 73,
    projectedLossAvoided: 280000,
    rollbackAvailable: true,
    executedAt: null
  },
  {
    id: "ACT-003",
    action: "Rotate Compromised Credentials",
    target: "svc-payments-auth",
    source: "IAM",
    status: "Executed",
    riskReduction: 66,
    projectedLossAvoided: 92000,
    rollbackAvailable: false,
    executedAt: "2026-06-29T12:05:00Z"
  }
];

export const actionSimulations = {
  isolate_payment_api: {
    estimatedDowntimeMinutes: 5,
    financialImpact: 10000,
    affectedServices: 3,
    riskReduction: 73,
    blastRadiusReduction: 67
  },
  block_external_ip: {
    estimatedDowntimeMinutes: 0,
    financialImpact: 1200,
    affectedServices: 0,
    riskReduction: 72,
    blastRadiusReduction: 54
  },
  revoke_api_key: {
    estimatedDowntimeMinutes: 2,
    financialImpact: 4000,
    affectedServices: 1,
    riskReduction: 61,
    blastRadiusReduction: 43
  }
};

export const executionLogs = [
  "[14:22:01] Validating policy...",
  "[14:22:02] Checking dependencies...",
  "[14:22:03] Applying firewall rule...",
  "[14:22:04] Blocking IP 185.220.101.42...",
  "[14:22:05] Policy committed successfully.",
  "[14:22:06] Blast radius reduced by 54%.",
  "[14:22:07] Verifying packet drop rate...",
  "[14:22:08] Confirmed malicious source blocked."
];

export const rollbackLogs = [
  "[14:40:11] Reverting firewall policy...",
  "[14:40:12] Restoring API access...",
  "[14:40:13] Dependency checks passed.",
  "[14:40:14] Rollback completed successfully.",
  "[14:40:15] Post-rollback integrity validated."
];

export const approvalWorkflow = [
  { stage: "AI Recommendation", status: "Completed" },
  { stage: "SOC Analyst Approval", status: "Waiting" },
  { stage: "Execution Engine", status: "Locked" },
  { stage: "Post-Execution Verification", status: "Locked" }
];

export const intrusionEvents = [
  {
    dataset: "CIC-IDS2017",
    attackType: "Brute Force",
    sourceIP: "185.220.101.42",
    targetAsset: "vpn-gateway-prod",
    timestamp: "2026-06-29T02:11:00Z",
    packets: 442,
    severity: "High"
  },
  {
    dataset: "UNSW-NB15",
    attackType: "DoS",
    sourceIP: "149.171.126.14",
    targetAsset: "payment-api-prod",
    timestamp: "2026-06-29T02:14:00Z",
    packets: 18420,
    severity: "Critical"
  }
];

export const idsAlerts = [
  {
    engine: "Suricata",
    signature: "ET SCAN Suspicious inbound to MSSQL port 1433",
    sourceIP: "185.220.101.42",
    targetIP: "10.0.2.11",
    protocol: "TCP",
    mitreTechnique: "T1046",
    severity: 4
  },
  {
    engine: "Suricata",
    signature: "ET WEB_SERVER SQL Injection Attempt UNION SELECT",
    sourceIP: "91.240.118.172",
    targetIP: "10.0.3.21",
    protocol: "HTTP",
    mitreTechnique: "T1190",
    severity: 5
  }
];

export const zeekConnections = [
  {
    ts: "2026-06-29T02:16:20Z",
    uid: "C8w7Xa",
    id_orig_h: "91.240.118.172",
    id_resp_h: "10.0.3.21",
    service: "http",
    duration: 12.3,
    bytes_out: 92381,
    bytes_in: 1822,
    conn_state: "SF",
    history: "ShADadF"
  }
];

export const mitreTimeline = [
  { technique: "T1566", stage: "Phishing" },
  { technique: "T1078", stage: "Valid Accounts" },
  { technique: "T1021", stage: "Remote Services" },
  { technique: "T1059", stage: "Command and Scripting Interpreter" },
  { technique: "T1486", stage: "Data Encrypted for Impact" }
];

export const cveFeed = [
  {
    cve: "CVE-2021-44228",
    product: "Apache Log4j",
    severity: "Critical",
    cvss: 10.0,
    exploited: true
  },
  {
    cve: "CVE-2024-6387",
    product: "OpenSSH",
    severity: "High",
    cvss: 8.1,
    exploited: false
  }
];
