# Pricing Validation Strategy (Van Westendorp-lite)

## Current Hypotheses
Do NOT optimize for perfect pricing yet. We are validating ranges and gathering pricing intelligence.
- **Starter Tier**: $299–$499 / month
- **Growth Tier**: $1,500–$2,500 / month
- **Enterprise**: Custom

## Feedback Capture (During Design Partner Interviews)
Ask these three questions when discussing the product value:

1. **"At what price does this feel CHEAP?"**
   *(Identify the floor where they might question the quality.)*
2. **"At what price does this require APPROVAL?"**
   *(Identify the friction point in their procurement process.)*
3. **"At what price does this feel TOO EXPENSIVE?"**
   *(Identify the ceiling.)*

## Recording the Feedback
Capture this data directly into the `design_partner_feedback` table:
```sql
INSERT INTO design_partner_feedback (
  id, organization_id, interview_type, pain_score, 
  wow_moment, confusing_moment, missing_feature, 
  willing_to_pay, price_anchor, created_at
) VALUES (...)
```

**Goal**: Identify the price elasticity of RiskLens and find the exact price point that maximizes revenue while minimizing procurement friction.
