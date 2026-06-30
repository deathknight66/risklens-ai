import db from '@/lib/db';
import crypto from 'crypto';

interface TraversalOptions {
  maxDepth: number;
  minConfidence: number;
  visited: Set<string>;
}

export interface GraphNode {
  incidentId: string;
  relationType: string;
  confidence: number;
  depth: number;
}

export class MemoryGraph {
  
  static addEdge(organizationId: string, sourceId: string, targetId: string, relationType: string, confidence: number) {
    if (confidence < 0.70) return; // Rule B: Confidence Floor

    try {
      db.prepare(`
        INSERT OR IGNORE INTO incident_edges (id, organization_id, source_incident_id, target_incident_id, relation_type, confidence, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        `edge_${crypto.randomBytes(8).toString('hex')}`,
        organizationId,
        sourceId,
        targetId,
        relationType,
        confidence,
        new Date().toISOString()
      );
    } catch (e) {
      console.error('Failed to add incident edge', e);
    }
  }

  static traverseIncidentGraph(
    organizationId: string,
    startIncidentId: string,
    options: TraversalOptions = { maxDepth: 3, minConfidence: 0.70, visited: new Set() },
    currentDepth: number = 0
  ): GraphNode[] {
    
    // Rule C: Cycle Guard
    if (currentDepth > options.maxDepth || options.visited.size >= 50) {
      return [];
    }

    options.visited.add(startIncidentId);

    // Rule A: Tenant Isolation Inheritance (filter by organizationId)
    const edges = db.prepare(`
      SELECT target_incident_id, relation_type, confidence 
      FROM incident_edges 
      WHERE organization_id = ? 
        AND source_incident_id = ? 
        AND confidence >= ?
    `).all(organizationId, startIncidentId, options.minConfidence) as any[];

    let results: GraphNode[] = [];

    for (const edge of edges) {
      if (!options.visited.has(edge.target_incident_id)) {
        results.push({
          incidentId: edge.target_incident_id,
          relationType: edge.relation_type,
          confidence: edge.confidence,
          depth: currentDepth + 1
        });

        // Recursively traverse
        const children = this.traverseIncidentGraph(
          organizationId, 
          edge.target_incident_id, 
          options, 
          currentDepth + 1
        );
        results = results.concat(children);
      }
    }

    return results;
  }
}
