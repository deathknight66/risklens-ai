export type OnboardingPackId = 'cloudflare' | 'aws' | 'internal_soc';

export interface OnboardingPack {
  id: OnboardingPackId;
  name: string;
  description: string;
  icon: string;
  samplePayload: any;
  policies: {
    name: string;
    conditions_json: string;
    actions_json: string;
  }[];
  playbooks: {
    name: string;
    description: string;
    dag_json: string;
  }[];
  successCriteria: {
    expected_incident_types: string[];
    recommended_playbooks: string[];
  };
}

export const onboardingPacks: Record<OnboardingPackId, OnboardingPack> = {
  cloudflare: {
    id: 'cloudflare',
    name: 'Cloudflare WAF',
    description: 'Optimize for external web attacks (SQLi, XSS, Credential Stuffing).',
    icon: 'Cloud',
    samplePayload: {
      source_ip: "45.22.11.90",
      event_type: "WAF_BLOCK",
      target: "api.risklens.ai/login",
      severity: "HIGH",
      raw_log: "Cloudflare WAF Blocked SQLi payload: ' OR 1=1 -- on endpoint /login"
    },
    policies: [
      {
        name: 'Auto-Contain Critical WAF Attacks',
        conditions_json: JSON.stringify({ "severity": "HIGH", "event_type": "WAF_BLOCK" }),
        actions_json: JSON.stringify([{ "action": "execute_playbook", "target": "cloudflare_block_pb" }])
      }
    ],
    playbooks: [
      {
        name: 'Block Attacker IP (Cloudflare)',
        description: 'Update Cloudflare IP Access Rules to block the malicious source.',
        dag_json: JSON.stringify({
          nodes: [
            { id: 'detect', type: 'condition', expression: 'severity == "HIGH"' },
            { id: 'block_cf_ip', type: 'action' },
            { id: 'notify_slack', type: 'action' }
          ],
          edges: [
            { from: 'detect', to: 'block_cf_ip', when: true },
            { from: 'detect', to: 'notify_slack', when: false }
          ]
        })
      }
    ],
    successCriteria: {
      expected_incident_types: ['SQL Injection', 'Credential Stuffing'],
      recommended_playbooks: ['Block Attacker IP (Cloudflare)', 'Escalate to PagerDuty']
    }
  },
  aws: {
    id: 'aws',
    name: 'AWS Security Hub',
    description: 'Preloaded rules for AWS GuardDuty and IAM anomalies.',
    icon: 'Server',
    samplePayload: {
      source_ip: "102.33.2.1",
      event_type: "IAM_ANOMALY",
      target: "arn:aws:iam::123456789012:user/admin",
      severity: "CRITICAL",
      raw_log: "GuardDuty: UnauthorizedAccess:IAMUser/ConsoleLoginSuccess.B anomaly detected for user admin."
    },
    policies: [
      {
        name: 'Revoke Anomalous IAM Sessions',
        conditions_json: JSON.stringify({ "severity": "CRITICAL", "event_type": "IAM_ANOMALY" }),
        actions_json: JSON.stringify([{ "action": "execute_playbook", "target": "aws_revoke_pb" }])
      }
    ],
    playbooks: [
      {
        name: 'Revoke AWS IAM Session',
        description: 'Attach DenyAll policy and revoke active STS sessions for the compromised user.',
        dag_json: JSON.stringify({
          nodes: [
            { id: 'revoke_sts', type: 'action' },
            { id: 'notify_secops', type: 'action' }
          ],
          edges: [
            { from: 'revoke_sts', to: 'notify_secops' }
          ]
        })
      }
    ],
    successCriteria: {
      expected_incident_types: ['IAM Compromise', 'EC2 Crypto Mining'],
      recommended_playbooks: ['Revoke AWS IAM Session']
    }
  },
  internal_soc: {
    id: 'internal_soc',
    name: 'Internal SOC (Custom)',
    description: 'Syslog / Custom CSV. Start with generic behavioral alerts.',
    icon: 'Shield',
    samplePayload: {
      source_ip: "192.168.1.55",
      event_type: "MALWARE_DETECTED",
      target: "win-workstation-01",
      severity: "HIGH",
      raw_log: "CrowdStrike Falcon: Cobalt Strike beacon payload detected in memory on win-workstation-01."
    },
    policies: [
      {
        name: 'Isolate Infected Endpoint',
        conditions_json: JSON.stringify({ "severity": "HIGH", "event_type": "MALWARE_DETECTED" }),
        actions_json: JSON.stringify([{ "action": "execute_playbook", "target": "isolate_endpoint_pb" }])
      }
    ],
    playbooks: [
      {
        name: 'Isolate Endpoint & Page On-Call',
        description: 'Isolate the host from the network and trigger a PagerDuty incident.',
        dag_json: JSON.stringify({
          nodes: [
            { id: 'isolate_host', type: 'action' },
            { id: 'trigger_pagerduty', type: 'action' }
          ],
          edges: [
            { from: 'isolate_host', to: 'trigger_pagerduty' }
          ]
        })
      }
    ],
    successCriteria: {
      expected_incident_types: ['Ransomware', 'Lateral Movement'],
      recommended_playbooks: ['Isolate Endpoint', 'Lock Active Directory Account']
    }
  }
};
