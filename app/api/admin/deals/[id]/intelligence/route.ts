import { NextResponse } from 'next/server';
import db from '@/lib/db';
import OpenAI from 'openai';

const openai = new OpenAI();

function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const dealId = params.id;
    const currentDeal = db.prepare('SELECT * FROM design_partner_pipeline WHERE id = ?').get(dealId) as any;
    
    if (!currentDeal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const currentStack = new Set(JSON.parse(currentDeal.tech_stack_json || '[]'));
    const currentSegment = currentDeal.segment;
    const currentSizeEstimate = currentDeal.deal_value_estimate || 0;

    // 1. Deal Similarity Scoring against closed_won deals in pipeline
    const wonDeals = db.prepare("SELECT * FROM design_partner_pipeline WHERE status = 'closed_won' AND id != ?").all(dealId) as any[];
    
    let bestSimilarityScore = 0;
    let mostSimilarDeal = null;

    for (const won of wonDeals) {
      const wonStack = new Set(JSON.parse(won.tech_stack_json || '[]'));
      const tScore = jaccardSimilarity(currentStack, wonStack);
      const segScore = currentSegment === won.segment ? 1 : 0;
      
      const wonSizeEstimate = won.deal_value_estimate || 0;
      let sizeScore = 0;
      if (currentSizeEstimate > 0 && wonSizeEstimate > 0) {
        const diff = Math.abs(currentSizeEstimate - wonSizeEstimate) / Math.max(currentSizeEstimate, wonSizeEstimate);
        sizeScore = diff <= 0.3 ? 1 : (diff <= 0.6 ? 0.5 : 0);
      }

      let procScore = 0.5; // Simplified for MVP
      if (currentDeal.legal_status === won.legal_status) procScore += 0.25;
      if (currentDeal.security_review_status === won.security_review_status) procScore += 0.25;

      const totalScore = Math.round(((tScore * 0.50) + (segScore * 0.25) + (sizeScore * 0.15) + (procScore * 0.10)) * 100);

      if (totalScore > bestSimilarityScore) {
        bestSimilarityScore = totalScore;
        mostSimilarDeal = won;
      }
    }

    // 2. Reference Matcher against customer_references
    const references = db.prepare('SELECT * FROM customer_references').all() as any[];
    let bestReferenceScore = 0;
    let bestReference = null;

    for (const ref of references) {
      const refStack = new Set(JSON.parse(ref.stack_json || '[]'));
      const tScore = jaccardSimilarity(currentStack, refStack);
      const segScore = currentSegment === ref.segment ? 1 : 0;
      const refScore = (tScore * 0.7) + (segScore * 0.3); // Simple weight for references
      if (refScore > bestReferenceScore) {
        bestReferenceScore = refScore;
        bestReference = ref;
      }
    }

    // 3. Objection Autoresponder
    const currentObjections = db.prepare('SELECT * FROM sales_objections WHERE company = ?').all(currentDeal.company_name) as any[];
    const playbooks = db.prepare('SELECT * FROM objection_playbooks').all() as any[];
    
    const matchedObjections = [];
    for (const obj of currentObjections) {
      const words = obj.exact_words.toLowerCase();
      // Simple keyword matching against playbook triggers
      const matchedPlaybook = playbooks.find(p => {
        const triggers = JSON.parse(p.trigger_words_json || '[]');
        return triggers.some((t: string) => words.includes(t.toLowerCase()));
      });
      if (matchedPlaybook) {
        matchedObjections.push({
          objection: obj.exact_words,
          strategy: matchedPlaybook.response_strategy,
          docs: JSON.parse(matchedPlaybook.recommended_docs_json || '[]')
        });
      }
    }

    // 4. Win Narrative Generator (LLM)
    // Only generate if we have a similar deal or reference
    let narrative = {
      why_this_matches: "Awaiting more pipeline data to find similarities.",
      likely_blockers: ["Standard security review", "Legal DPA"],
      best_next_move: "Continue standard pilot qualification."
    };

    if (bestReference || mostSimilarDeal) {
      const promptContext = `
        Current Deal: ${currentDeal.company_name} (Segment: ${currentSegment}, Stack: ${JSON.stringify(Array.from(currentStack))})
        Matched Reference: ${bestReference ? `${bestReference.company} (Stack: ${bestReference.stack_json}, Metrics: ${bestReference.metrics_json})` : 'None'}
        Most Similar Won Deal: ${mostSimilarDeal ? `${mostSimilarDeal.company_name} (Stack: ${mostSimilarDeal.tech_stack_json})` : 'None'}
        Current Objections Logged: ${JSON.stringify(matchedObjections.map(o => o.objection))}

        Based strictly on the provided context (Truth Layer), generate a sales Win Narrative.
        Output MUST be valid JSON with the exact following structure:
        {
          "why_this_matches": "Brief 1-sentence explanation of why this deal matches the reference/past won deal based on segment and tech stack.",
          "likely_blockers": ["blocker 1", "blocker 2"],
          "best_next_move": "One specific, highly tactical recommended next step to advance the deal (e.g. Send AI boundaries doc, schedule exec meeting)."
        }
      `;

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: promptContext }],
          response_format: { type: 'json_object' }
        });
        
        narrative = JSON.parse(completion.choices[0].message.content || '{}');
      } catch (err) {
        console.error("LLM Narrative generation failed", err);
      }
    }

    return NextResponse.json({
      deal: currentDeal,
      similarity: {
        score: bestSimilarityScore,
        mostSimilarDeal: mostSimilarDeal ? mostSimilarDeal.company_name : null
      },
      referenceMatch: bestReference ? {
        company: bestReference.company,
        segment: bestReference.segment,
        metrics: JSON.parse(bestReference.metrics_json),
        stack: JSON.parse(bestReference.stack_json)
      } : null,
      autoresponder: matchedObjections,
      narrative
    });

  } catch (error: any) {
    console.error('Deal Intelligence Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
