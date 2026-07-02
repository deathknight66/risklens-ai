import crypto from 'crypto';

/**
 * Generates a canonical fingerprint for an event using a 60-second tumbling window.
 * Formula: SHA256(source + actor + target + event_type + severity + rounded_timestamp)
 */
export function generateEventFingerprint(params: {
  source_connector: string;
  actor: string;
  target: string;
  event_type: string;
  severity: string;
  timestamp: string | Date | number;
}): string {
  const { source_connector, actor, target, event_type, severity, timestamp } = params;
  
  const ts = new Date(timestamp).getTime();
  const rounded_timestamp = Math.floor(ts / 60000); // 60s tumbling window

  const payloadString = `${source_connector}|${actor}|${target}|${event_type}|${severity}|${rounded_timestamp}`;
  
  return crypto.createHash('sha256').update(payloadString).digest('hex');
}
