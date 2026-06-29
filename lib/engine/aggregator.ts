import { Alert, Incident, generateId } from './types';

export function groupAlertsIntoIncident(alerts: Alert[]): Incident[] {
  const incidents: Incident[] = [];
  
  // Group by sourceIP, or target if sourceIP is missing.
  const groups: Record<string, Alert[]> = {};
  
  for (const alert of alerts) {
    const key = alert.sourceIP ? `ip-${alert.sourceIP}` : (alert.target ? `target-${alert.target}` : 'unknown');
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(alert);
  }
  
  for (const [key, groupAlerts] of Object.entries(groups)) {
    // Determine overall severity
    let maxSeverity = 'Low';
    const severityLevels = { 'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4 };
    
    for (const a of groupAlerts) {
      if (severityLevels[a.severity] > severityLevels[maxSeverity as keyof typeof severityLevels]) {
        maxSeverity = a.severity;
      }
    }
    
    // Sort alerts by time
    groupAlerts.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    const sourceIP = groupAlerts.find(a => a.sourceIP)?.sourceIP || null;
    const target = groupAlerts.find(a => a.target)?.target || null;
    
    let title = '';
    if (groupAlerts.length === 1) {
      title = groupAlerts[0].ruleName;
    } else {
      if (key.startsWith('ip-')) {
        title = `Multiple Alerts for Source IP: ${sourceIP}`;
      } else if (key.startsWith('target-')) {
        title = `Multiple Alerts against Target: ${target}`;
      } else {
        title = `Multiple Unattributed Alerts`;
      }
    }
    
    incidents.push({
      id: generateId(),
      createdAt: groupAlerts[0]?.timestamp || new Date().toISOString(),
      title,
      severity: maxSeverity as 'Low' | 'Medium' | 'High' | 'Critical',
      status: 'Open',
      sourceIP,
      target,
      alerts: groupAlerts
    });
  }
  
  return incidents;
}
