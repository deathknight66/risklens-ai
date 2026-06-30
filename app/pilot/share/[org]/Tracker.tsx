"use client";

import { useEffect } from 'react';

export default function Tracker({ orgId, sig }: { orgId: string, sig: string }) {
  useEffect(() => {
    // Log "viewed_champion_kit" on mount
    fetch('/api/telemetry/engagement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId,
        sig,
        eventType: 'viewed_champion_kit'
      })
    }).catch(console.error);

    // Set up intersection observers for other sections if needed
    // For MVP, we will just rely on the mount event for "viewed_champion_kit".
    // When they click "Generate Formal PDF Report" they hit `/pilot/report/...` 
    // We could track that here or on the report page. Let's keep it simple.
  }, [orgId, sig]);

  return null; // Invisible component
}
