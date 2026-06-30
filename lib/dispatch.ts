import db from '@/lib/db';
import crypto from 'crypto';

export type DestinationType = 'slack' | 'teams' | 'pagerduty' | 'jira';

const MAX_ATTEMPTS = 4;
const RETRY_DELAYS_MS = [0, 30000, 300000, 1800000]; // immediate, 30s, 5m, 30m

interface DispatchPayload {
  incidentId: string;
  title: string;
  severity: string;
  summary: string;
  url: string;
}

export class DispatchEngine {
  
  static formatPayload(type: DestinationType, data: DispatchPayload) {
    switch (type) {
      case 'slack':
        return {
          blocks: [
            { type: "header", text: { type: "plain_text", text: `🚨 RiskLens Alert: ${data.title}` } },
            { type: "section", text: { type: "mrkdwn", text: `*Severity:* ${data.severity}\n*Summary:*\n${data.summary}` } },
            { type: "actions", elements: [{ type: "button", text: { type: "plain_text", text: "View Incident" }, url: data.url, style: "danger" }] }
          ]
        };
      case 'teams':
        return {
          "@type": "MessageCard",
          "@context": "http://schema.org/extensions",
          "themeColor": data.severity === 'CRITICAL' ? "FF0000" : "FF9900",
          "summary": data.title,
          "sections": [{
            "activityTitle": `RiskLens Alert: ${data.title}`,
            "activitySubtitle": `Severity: ${data.severity}`,
            "text": data.summary,
            "markdown": true
          }],
          "potentialAction": [{
            "@type": "OpenUri",
            "name": "View Incident",
            "targets": [{ "os": "default", "uri": data.url }]
          }]
        };
      case 'pagerduty':
        return {
          routing_key: "WILL_BE_INJECTED_VIA_WEBHOOK_URL",
          event_action: "trigger",
          payload: {
            summary: data.title,
            severity: data.severity.toLowerCase(),
            source: "RiskLens AI",
            custom_details: { summary: data.summary, url: data.url }
          }
        };
      case 'jira':
        return {
          fields: {
            project: { key: "SEC" },
            summary: `[RiskLens] ${data.title}`,
            description: `*Severity:* ${data.severity}\n\n*Summary:*\n${data.summary}\n\n[View in RiskLens|${data.url}]`,
            issuetype: { name: "Bug" }
          }
        };
      default:
        throw new Error(`Unsupported destination type: ${type}`);
    }
  }

  static async send(destinationId: string, payload: DispatchPayload) {
    const dest = db.prepare('SELECT * FROM destinations WHERE id = ? AND status = ?').get(destinationId, 'active') as any;
    if (!dest) return;

    const deliveryId = `dlv_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    const formattedPayload = this.formatPayload(dest.type, payload);
    
    // For PagerDuty, the webhook_url stores the integration key. We adapt the payload.
    let url = dest.webhook_url;
    if (dest.type === 'pagerduty') {
      formattedPayload.routing_key = dest.webhook_url;
      url = "https://events.pagerduty.com/v2/enqueue";
    }

    try {
      db.prepare(`
        INSERT INTO delivery_logs (id, organization_id, destination_id, incident_id, status, provider_response, attempts, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(deliveryId, dest.organization_id, dest.id, payload.incidentId, 'sending', null, 1, now);

      this.executeDelivery(deliveryId, url, formattedPayload, 1);
    } catch (e) {
      console.error('Dispatch init failed', e);
    }
  }

  static async executeDelivery(deliveryId: string, url: string, payload: any, attempt: number) {
    let success = false;
    let providerResponse = '';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      providerResponse = `HTTP ${res.status} ${res.statusText}`;
      if (res.ok) {
        success = true;
      } else {
        const text = await res.text().catch(() => '');
        providerResponse += ` | ${text.substring(0, 100)}`;
      }
    } catch (err: any) {
      providerResponse = err.name === 'AbortError' ? 'Timeout exceeded' : err.message;
    }

    if (success) {
      db.prepare('UPDATE delivery_logs SET status = ?, provider_response = ?, next_retry_at = NULL WHERE id = ?')
        .run('success', providerResponse, deliveryId);
    } else {
      if (attempt >= MAX_ATTEMPTS) {
        db.prepare('UPDATE delivery_logs SET status = ?, provider_response = ?, next_retry_at = NULL WHERE id = ?')
          .run('failed', providerResponse, deliveryId);
      } else {
        const nextRetryMs = RETRY_DELAYS_MS[attempt];
        const nextRetryAt = new Date(Date.now() + nextRetryMs).toISOString();
        
        db.prepare('UPDATE delivery_logs SET status = ?, provider_response = ?, attempts = ?, next_retry_at = ? WHERE id = ?')
          .run('retrying', providerResponse, attempt + 1, nextRetryAt, deliveryId);
        
        // In a real serverless system, you would enqueue a durable message (e.g., SQS/QStash) here.
        // For the scope of this MVP, we use setTimeout.
        setTimeout(() => {
          this.executeDelivery(deliveryId, url, payload, attempt + 1);
        }, nextRetryMs);
      }
    }
  }
}
