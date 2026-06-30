# RiskLens Design Partner Pilot Agreement

This document outlines the mutual expectations, limitations, and conversion path for the 14-day RiskLens Pilot Program.

## 1. Pilot Scope and Duration
- **Duration**: The pilot will run for 14 calendar days from the date of the first successfully ingested log.
- **Ingestion Limit**: Up to 50 GB of log data per day during the pilot period.
- **Cost**: $0. The pilot is entirely free.

## 2. Autonomy Escalation Ladder
To ensure trust and safe deployment, RiskLens will operate according to the following escalation ladder:
- **Week 1 (Suggest Only)**: RiskLens will ingest logs, perform AI root cause analysis, and *suggest* autonomous playbooks. No actions will be taken without human intervention.
- **Week 2 (Approval Required)**: Playbooks will automatically trigger but will pause execution and require explicit human approval via the dashboard before taking destructive actions (e.g., blocking IPs, revoking IAM keys).
- **Week 3 (Fully Autonomous)**: *Optional.* If the Design Partner is satisfied with the false-positive rate and playbook accuracy, select playbooks may be transitioned to Fully Autonomous mode.

## 3. SLA Disclaimer
During the pilot phase, RiskLens is provided "AS-IS". We do not guarantee a 99.99% uptime SLA, though we strive for maximum availability. We recommend running RiskLens in parallel with your existing SIEM/SOAR rather than as an immediate replacement.

## 4. Feedback Expectation
The primary goal of this pilot is mutual learning. The Design Partner agrees to:
- One 30-minute mid-pilot check-in call (Day 7).
- One 45-minute technical review and off-boarding/conversion call (Day 14).

## 5. Conversion Pricing
If the pilot successfully proves a reduction in MTTR (Mean Time to Respond) and analyst fatigue, the Design Partner will be offered a heavily discounted lifetime conversion rate.

*By proceeding with the RiskLens onboarding pack, you agree to these pilot terms.*
