import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const isVercel = !!process.env.VERCEL;
const dbPath = process.env.DATABASE_URL || (isVercel ? '/tmp/risklens.db' : path.join(process.cwd(), 'risklens.db'));

export async function GET() {
  try {
    const db = new Database(dbPath);
    
    // Get all organizations
    const orgs = db.prepare(`SELECT id, name FROM organizations`).all() as any[];
    const pipeline = db.prepare(`SELECT * FROM design_partner_pipeline`).all() as any[];
    const boardTriggers = db.prepare(`SELECT * FROM board_triggers`).all() as any[];

    const results = pipeline.map(deal => {
      const org = orgs.find(o => o.name === deal.company_name);
      const orgId = org ? org.id : null;

      let rcs = 0; // ROI Certainty Score
      let rpi = 0; // Renewal Pressure Index
      let brs = 0; // Board Readiness Score
      
      let boardMetrics = null;
      let budgetCycle = null;
      let execSponsors = [];
      let threadStrength = 0;
      let recommendedActions: any[] = [];

      if (orgId) {
        // Fetch GTM-7 data
        boardMetrics = db.prepare(`SELECT * FROM board_metrics WHERE organization_id = ? ORDER BY created_at DESC LIMIT 1`).get(orgId) as any;
        budgetCycle = db.prepare(`SELECT * FROM budget_cycles WHERE organization_id = ? ORDER BY created_at DESC LIMIT 1`).get(orgId) as any;
        execSponsors = db.prepare(`SELECT * FROM exec_sponsors WHERE organization_id = ?`).all(orgId) as any[];

        // RCS Calculation
        if (boardMetrics) {
          // Normalize metrics against baselines
          const ACV = 50000;
          const TeamCapacity = 2000;
          const AuditHoursBaseline = 200;

          const lossScore = Math.min(100, (boardMetrics.estimated_loss_prevented / ACV) * 100);
          const hoursScore = Math.min(100, (boardMetrics.analyst_hours_saved / TeamCapacity) * 100);
          const mttrDelta = boardMetrics.mttr_before - boardMetrics.mttr_after;
          const mttrScore = Math.min(100, Math.max(0, (mttrDelta / boardMetrics.mttr_before) * 100));
          const compScore = Math.min(100, (boardMetrics.compliance_hours_saved / AuditHoursBaseline) * 100);

          rcs = Math.round(
            (lossScore * 0.35) +
            (hoursScore * 0.25) +
            (mttrScore * 0.25) +
            (compScore * 0.15)
          );
        }

        // RPI Calculation
        if (budgetCycle) {
          const daysToRenewal = Math.max(0, Math.floor((new Date(budgetCycle.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
          // Invert days: closer to 0 days = 100 urgency
          const normalizedDays = Math.min(100, (daysToRenewal / 365) * 100);
          const renewalUrgency = Math.max(0, 100 - normalizedDays);
          
          let budgetStageScore = 50;
          if (budgetCycle.procurement_stage === 'budget_approved') budgetStageScore = 10;
          if (budgetCycle.procurement_stage === 'security_review') budgetStageScore = 60;
          if (budgetCycle.procurement_stage === 'legal_review') budgetStageScore = 80;
          
          const politicalRisk = 50; // default medium risk

          rpi = Math.round(
            (renewalUrgency * 0.40) +
            (budgetStageScore * 0.35) +
            (politicalRisk * 0.25)
          );
        }

        // Thread Strength (from GTM-6)
        const stakeholders = db.prepare(`SELECT * FROM stakeholder_map WHERE organization_id = ?`).all(orgId) as any[];
        const champions = stakeholders.filter(s => s.is_champion);
        const cScore = Math.min(5, champions.length) / 5 * 100;
        const avgInfluence = stakeholders.length > 0 ? (stakeholders.reduce((sum, s) => sum + s.influence_score, 0) / stakeholders.length) : 0;
        const uniqueDepts = new Set(stakeholders.map(s => s.department)).size;
        const dScore = Math.min(5, uniqueDepts) / 5 * 100;
        threadStrength = Math.round((cScore * 0.40) + (avgInfluence * 0.35) + (dScore * 0.25));

        // BRS Calculation
        const econBuyer = execSponsors.find(s => s.economic_buyer === 1);
        const execScore = econBuyer ? econBuyer.engagement_score : 0;

        brs = Math.round(
          (execScore * 0.40) +
          (rcs * 0.35) +
          (threadStrength * 0.25)
        );

        // Budget Triggers Evaluator (Layered execution)
        let triggers = [];
        
        // 1. Budget Timing
        if (rpi > 80) triggers.push('escalate_procurement');
        else if (rcs > 75 && rpi > 40) triggers.push('generate_board_packet');
        // 2. Political Risk / Economic Readiness
        if (threadStrength < 40 && execScore > 70) triggers.push('schedule_exec_alignment');

        // Map triggers to actions and sequence them by priority
        let allActions: any[] = [];
        triggers.forEach(t => {
          const rule = boardTriggers.find(bt => bt.trigger_rule === t && bt.active === 1);
          if (rule) {
            allActions.push(rule);
          } else {
            // fallback mock rule if not seeded
            allActions.push({
              trigger_rule: t,
              action_recommendation: t.replace(/_/g, ' '),
              priority: t === 'escalate_procurement' ? 1 : 2
            });
          }
        });

        // Sequence matters more than score
        recommendedActions = allActions.sort((a, b) => a.priority - b.priority);
      }

      return {
        dealId: deal.id,
        company: deal.company_name,
        orgId,
        rcs,
        rpi,
        brs,
        threadStrength,
        budgetCycle: budgetCycle || { fiscal_year: 'N/A', renewal_date: 'N/A', procurement_stage: 'Unknown' },
        boardMetrics: boardMetrics || {},
        execSponsors,
        recommendedActions
      };
    });

    return NextResponse.json({
      all: results
    });

  } catch (error: any) {
    console.error('Error fetching board data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
