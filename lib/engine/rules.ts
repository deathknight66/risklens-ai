import { NormalizedLog, Alert, generateId } from './types';

export function runDetectionRules(logs: NormalizedLog[]): Alert[] {
  const alerts: Alert[] = [];
  
  // Pre-group logs by IP for tracking
  const ipLogs: Record<string, NormalizedLog[]> = {};
  for (const log of logs) {
    if (log.sourceIP) {
      if (!ipLogs[log.sourceIP]) {
        ipLogs[log.sourceIP] = [];
      }
      ipLogs[log.sourceIP].push(log);
    }
  }

  alerts.push(...detectBruteForce(logs, ipLogs));
  alerts.push(...detectSQLi(logs));
  alerts.push(...detectDoS(logs, ipLogs));
  alerts.push(...detectPortScan(logs, ipLogs));
  alerts.push(...detectCredentialStuffing(logs, ipLogs));
  alerts.push(...detectPrivilegeEscalation(logs));

  return alerts;
}

function detectBruteForce(logs: NormalizedLog[], ipLogs: Record<string, NormalizedLog[]>): Alert[] {
  const alerts: Alert[] = [];
  for (const [ip, userLogs] of Object.entries(ipLogs)) {
    const failedLogins = userLogs.filter(l => l.status === '401' || l.status === '403');
    failedLogins.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    for (let i = 0; i < failedLogins.length; i++) {
      let count = 1;
      const startTime = new Date(failedLogins[i].timestamp).getTime();
      const windowLogs = [failedLogins[i]];
      
      for (let j = i + 1; j < failedLogins.length; j++) {
        if (new Date(failedLogins[j].timestamp).getTime() - startTime <= 60000) {
          count++;
          windowLogs.push(failedLogins[j]);
        } else {
          break;
        }
      }
      
      if (count > 10) {
        alerts.push({
          id: generateId(),
          timestamp: new Date().toISOString(),
          ruleName: 'Brute Force Attempt',
          severity: 'High',
          technique: 'T1110',
          confidence: 0.95,
          sourceIP: ip,
          description: `Detected ${count} failed logins from ${ip} within 60 seconds.`,
          relatedLogs: windowLogs
        });
        break; 
      }
    }
  }
  return alerts;
}

function detectSQLi(logs: NormalizedLog[]): Alert[] {
  const alerts: Alert[] = [];
  const sqliPattern = /(?:union\s+select|'\s*or\s*1\s*=\s*1|;\s*drop\s+table)/i;
  
  for (const log of logs) {
    if ((log.payload && sqliPattern.test(log.payload)) || (log.target && sqliPattern.test(log.target))) {
      alerts.push({
        id: generateId(),
        timestamp: new Date().toISOString(),
        ruleName: 'SQL Injection Attempt',
        severity: 'Critical',
        technique: 'T1190',
        confidence: 0.99,
        sourceIP: log.sourceIP,
        target: log.target,
        description: `Potential SQL Injection detected in payload or target URL.`,
        relatedLogs: [log]
      });
    }
  }
  return alerts;
}

function detectDoS(logs: NormalizedLog[], ipLogs: Record<string, NormalizedLog[]>): Alert[] {
  const alerts: Alert[] = [];
  for (const [ip, userLogs] of Object.entries(ipLogs)) {
    const sortedLogs = [...userLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    for (let i = 0; i < sortedLogs.length; i++) {
      let count = 1;
      const startTime = new Date(sortedLogs[i].timestamp).getTime();
      const windowLogs = [sortedLogs[i]];
      
      for (let j = i + 1; j < sortedLogs.length; j++) {
        if (new Date(sortedLogs[j].timestamp).getTime() - startTime <= 10000) {
          count++;
          windowLogs.push(sortedLogs[j]);
        } else {
          break;
        }
      }
      
      if (count > 100) {
        alerts.push({
          id: generateId(),
          timestamp: new Date().toISOString(),
          ruleName: 'Denial of Service (DoS)',
          severity: 'Critical',
          technique: 'T1498',
          confidence: 0.92,
          sourceIP: ip,
          description: `Detected ${count} requests from ${ip} within 10 seconds.`,
          relatedLogs: windowLogs
        });
        break; 
      }
    }
  }
  return alerts;
}

function detectPortScan(logs: NormalizedLog[], ipLogs: Record<string, NormalizedLog[]>): Alert[] {
  const alerts: Alert[] = [];
  for (const [ip, userLogs] of Object.entries(ipLogs)) {
    const sortedLogs = [...userLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    for (let i = 0; i < sortedLogs.length; i++) {
      const startTime = new Date(sortedLogs[i].timestamp).getTime();
      const targets = new Set<string>();
      if (sortedLogs[i].target) targets.add(sortedLogs[i].target as string);
      const windowLogs = [sortedLogs[i]];
      
      for (let j = i + 1; j < sortedLogs.length; j++) {
        if (new Date(sortedLogs[j].timestamp).getTime() - startTime <= 30000) {
          if (sortedLogs[j].target) targets.add(sortedLogs[j].target as string);
          windowLogs.push(sortedLogs[j]);
        } else {
          break;
        }
      }
      
      if (targets.size > 20) {
        alerts.push({
          id: generateId(),
          timestamp: new Date().toISOString(),
          ruleName: 'Port/Target Scan',
          severity: 'Medium',
          technique: 'T1046',
          confidence: 0.85,
          sourceIP: ip,
          description: `Detected access to ${targets.size} unique targets from ${ip} within 30 seconds.`,
          relatedLogs: windowLogs
        });
        break;
      }
    }
  }
  return alerts;
}

function detectCredentialStuffing(logs: NormalizedLog[], ipLogs: Record<string, NormalizedLog[]>): Alert[] {
  const alerts: Alert[] = [];
  
  for (const [ip, userLogs] of Object.entries(ipLogs)) {
    const usernames = new Set<string>();
    const windowLogs: NormalizedLog[] = [];
    
    for (const log of userLogs) {
      let user = '';
      try {
        const parsed = JSON.parse(log.payload);
        if (parsed.username) user = parsed.username;
        else if (parsed.user) user = parsed.user;
        else if (parsed.email) user = parsed.email;
      } catch (e) {
        const userMatch = log.payload.match(/(?:user|username|email)=([^&]+)/i);
        if (userMatch) {
          user = userMatch[1];
        }
      }
      
      if (user) {
        usernames.add(user);
        windowLogs.push(log);
      }
    }
    
    if (usernames.size >= 5) { // Assuming 5 unique usernames is a stuffing attempt
      alerts.push({
        id: generateId(),
        timestamp: new Date().toISOString(),
        ruleName: 'Credential Stuffing Attempt',
        severity: 'High',
        technique: 'T1110.004',
        confidence: 0.90,
        sourceIP: ip,
        description: `Detected ${usernames.size} distinct usernames attempted from ${ip}.`,
        relatedLogs: windowLogs
      });
    }
  }
  return alerts;
}

function detectPrivilegeEscalation(logs: NormalizedLog[]): Alert[] {
  const alerts: Alert[] = [];
  const privEscPattern = /(?:sudo\s+su|chmod\s+\+s|usermod\s+-aG\s+(?:sudo|admin|wheel))/i;
  
  for (const log of logs) {
    if (privEscPattern.test(log.payload) || privEscPattern.test(log.rawLog)) {
      alerts.push({
        id: generateId(),
        timestamp: new Date().toISOString(),
        ruleName: 'Privilege Escalation Activity',
        severity: 'High',
        technique: 'T1068',
        confidence: 0.88,
        sourceIP: log.sourceIP,
        target: log.target,
        description: `Potential privilege escalation command detected.`,
        relatedLogs: [log]
      });
    }
  }
  return alerts;
}
