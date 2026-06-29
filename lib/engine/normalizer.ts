import { NormalizedLog, generateId } from './types';

export function normalizeEvent(rawLog: string, sourceType: string): NormalizedLog {
  const id = generateId();
  const timestamp = new Date().toISOString();
  let sourceIP: string | null = null;
  let target: string | null = null;
  let eventType = 'unknown';
  let status = 'unknown';
  let payload = '';

  if (sourceType.toLowerCase() === 'nginx') {
    // Basic generic Nginx parsing
    const parts = rawLog.split(' ');
    if (parts.length > 0) {
      sourceIP = parts[0];
    }
    // Attempt to extract method, target and status
    if (rawLog.includes('HTTP/')) {
      const match = rawLog.match(/"(GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH) (.*?) HTTP/);
      if (match) {
        eventType = match[1];
        target = match[2];
        payload = match[2];
      }
    }
    const statusMatch = rawLog.match(/HTTP\/[1-3]\.[0-9]" (\d{3})/);
    if (statusMatch) {
      status = statusMatch[1];
    }
  } else if (sourceType.toLowerCase() === 'json') {
    // Basic JSON parsing
    try {
      const parsed = JSON.parse(rawLog);
      sourceIP = parsed.sourceIP || parsed.ip || parsed.source_ip || null;
      target = parsed.target || parsed.destination || null;
      eventType = parsed.eventType || parsed.event_type || 'json_event';
      status = parsed.status ? String(parsed.status) : 'unknown';
      payload = parsed.payload ? (typeof parsed.payload === 'string' ? parsed.payload : JSON.stringify(parsed.payload)) : '';
      if (!payload) {
        // If payload field isn't explicitly provided, use the entire log as payload
        payload = rawLog;
      }
    } catch (e) {
      payload = rawLog;
    }
  } else {
    payload = rawLog;
  }

  return {
    id,
    timestamp,
    sourceIP,
    target,
    eventType,
    status,
    payload,
    sourceType,
    rawLog
  };
}
