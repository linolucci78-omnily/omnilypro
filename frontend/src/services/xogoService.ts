
/**
 * Service for interacting with Xogo Digital Signage API.
 * Docs: https://www.xogo.io/api
 */

const XOGO_API_BASE = 'https://manager.xogo.io/api'

export const xogoService = {

    /**
     * Triggers a specific content item (e.g., Welcome Video, Winner Image) 
     * to play immediately on a specific player.
     * 
     * @param apiKey Organization's Xogo API Key
     * @param playerId The ID of the Xogo Player (TV)
     * @param contentId The ID of the content item in the library
     */
    async triggerRealtimeContent(apiKey: string, playerId: string, contentId: string) {
        try {
            const response = await fetch(`${XOGO_API_BASE}/players/${playerId}/realtime`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contentId: contentId,
                    // 'interrupt' true forces immediate playback over current item
                    interrupt: true
                })
            })

            if (!response.ok) {
                throw new Error(`Xogo API Error: ${response.statusText}`)
            }

            console.log('✅ Xogo Trigger Sent Successfully!')
            return true

        } catch (error) {
            console.error('❌ Failed to trigger Xogo content:', error)
            return false
        }
    },

    /**
     * Simulates a trigger for testing without a real player.
     * In production, this would be replaced by webhooks or direct calls.
     */
    simulateWelcomeTrigger(orgId: string, customerName: string) {
        console.log(`📡 SIMULATION: Triggering Welcome for ${customerName} at Org ${orgId}`)

        // In a real app with webhooks, we might hit the local TV URL directly if on same network
        // OR we rely on Xogo to load a URL that polls for this event.
        // For now, we assume the TV Page is open and we can 'push' via Supabase Realtime (future)
        // or simply log this for the prototype.

        // This is where we would call the Edge Function trigger/xogo.ts
    }
}
