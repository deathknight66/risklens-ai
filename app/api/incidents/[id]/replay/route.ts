import { NextResponse } from 'next/server';
import { IncidentRepository } from '@/lib/repositories/incident';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions) as any;
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await props.params;
    const incident = IncidentRepository.getIncidentById(id) as any;
    
    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    const alerts = IncidentRepository.getAlertsForIncident(id) as any[];
    const actions = IncidentRepository.getActionsForIncident(id) as any[];
    
    // We will build a unified, chronological timeline of frames
    const frames: any[] = [];

    // Base Frame (T=0)
    frames.push({
      timestamp: incident.created_at,
      type: 'INIT',
      message: `Incident ${id} generated.`,
      metadata: { severity: incident.severity }
    });

    // Alert Frames
    alerts.forEach((alert: any) => {
      frames.push({
        timestamp: alert.timestamp,
        type: 'ALERT',
        message: `Alert triggered: ${alert.rule_name}`,
        metadata: {
          source: alert.source_ip,
          target: alert.target,
          mitre: alert.mitre_technique
        }
      });
    });

    // If analysis was performed, insert analysis frame slightly after the latest alert
    if (incident.ai_summary) {
      const latestAlertTime = alerts.length > 0 ? 
        Math.max(...alerts.map((a: any) => new Date(a.timestamp).getTime())) : 
        new Date(incident.created_at).getTime();
        
      frames.push({
        timestamp: new Date(latestAlertTime + 2000).toISOString(),
        type: 'ANALYSIS_COMPLETE',
        message: `AI Analysis Concluded with confidence ${Math.round(incident.analysis_confidence * 100)}%`,
        metadata: {
          tactics: incident.mitre_tactics,
          cost: incident.analysis_cost
        }
      });
    }

    // Action Frames
    actions.forEach((action: any) => {
      frames.push({
        timestamp: action.created_at,
        type: 'ACTION_PROPOSED',
        message: `Action proposed: ${action.action_type} on ${action.target}`,
        metadata: { status: 'Awaiting Approval' }
      });
      
      if (action.executed_at) {
        frames.push({
          timestamp: action.executed_at,
          type: 'ACTION_EXECUTED',
          message: `Action executed: ${action.action_type}`,
          metadata: { by: action.approved_by, hash: action.execution_hash }
        });
      }
    });

    // Sort by timestamp
    frames.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Generate cumulative delays for playback pacing (in ms) relative to start
    if (frames.length > 0) {
      const startTime = new Date(frames[0].timestamp).getTime();
      frames.forEach((frame, idx) => {
        // We compress time for the demo. Max 2 seconds between steps.
        frame.demo_delay_ms = idx * 1500; 
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        incidentId: id,
        frames
      }
    });

  } catch (error: any) {
    console.error('Replay Engine Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
