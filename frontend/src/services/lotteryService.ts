import { supabase } from '../lib/supabase'

// =====================================================
// TYPES
// =====================================================

export type LotteryTheme = 'casino' | 'bingo' | 'drum' | 'modern'

export interface LotteryPrize {
  id: string
  event_id: string
  organization_id: string
  rank: number // 1 = first prize, 2 = second prize, etc.
  prize_name: string
  prize_value?: number
  prize_description?: string
  is_extracted: boolean
  extracted_at?: string
  winning_ticket_id?: string
  created_at: string
  updated_at: string
}

export interface LotteryEvent {
  id: string
  organization_id: string
  name: string
  description?: string
  event_date: string
  extraction_date: string
  ticket_price: number
  // Legacy single prize fields (kept for backward compatibility)
  prize_name?: string
  prize_value?: number
  prize_description?: string
  // Multi-prize fields
  total_prizes: number
  prizes_extracted: number
  brand_colors: {
    primary: string
    secondary: string
    accent: string
  }
  theme?: LotteryTheme
  status: 'draft' | 'active' | 'closed' | 'extracted'
  total_tickets_sold: number
  total_complimentary_tickets?: number
  total_revenue: number
  created_at: string
  updated_at: string
  extracted_at?: string
}

export interface LotteryTicket {
  id: string
  event_id: string
  organization_id: string
  ticket_number: string
  customer_id?: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  fortune_message?: string
  purchased_by_staff_id?: string
  purchased_by_staff_name?: string
  price_paid: number
  qr_code_data: string
  is_validated: boolean
  validated_at?: string
  is_winner: boolean
  won_at?: string
  // Multi-prize fields
  prize_id?: string
  prize_rank?: number
  prize_claimed: boolean
  prize_claimed_at?: string
  created_at: string
}

export interface LotteryExtraction {
  id: string
  event_id: string
  organization_id: string
  winning_ticket_id: string
  winning_ticket_number: string
  winner_customer_name: string
  extracted_by_staff_id?: string
  extracted_by_staff_name?: string
  extraction_method: 'automatic' | 'manual'
  total_participants: number
  // Multi-prize fields
  prize_id?: string
  prize_rank?: number
  created_at: string
}

export interface LotteryWinnerWithPrize {
  ticket_number: string
  customer_name: string
  prize_rank: number
  prize_name: string
  prize_value?: number
  won_at?: string
}

// =====================================================
// LOTTERY SERVICE
// =====================================================

export const lotteryService = {
  // =====================================================
  // EVENTS
  // =====================================================

  /**
   * Get all lottery events for organization
   */
  async getEvents(organizationId: string): Promise<LotteryEvent[]> {
    const { data, error } = await supabase
      .from('lottery_events')
      .select('*')
      .eq('organization_id', organizationId)
      .order('extraction_date', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Get active events
   */
  async getActiveEvents(organizationId: string): Promise<LotteryEvent[]> {
    const { data, error } = await supabase
      .from('lottery_events')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('extraction_date', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get single event
   */
  async getEvent(eventId: string): Promise<LotteryEvent> {
    const { data, error } = await supabase
      .from('lottery_events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Create new lottery event
   */
  async createEvent(event: Omit<LotteryEvent, 'id' | 'created_at' | 'updated_at' | 'total_tickets_sold' | 'total_revenue'>): Promise<LotteryEvent> {
    const { data, error } = await supabase
      .from('lottery_events')
      .insert([event])
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update event
   */
  async updateEvent(eventId: string, updates: Partial<LotteryEvent>): Promise<LotteryEvent> {
    const { data, error } = await supabase
      .from('lottery_events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', eventId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Close event (stop ticket sales)
   */
  async closeEvent(eventId: string): Promise<LotteryEvent> {
    return this.updateEvent(eventId, { status: 'closed' })
  },

  /**
   * Delete event and all related data (tickets, extractions, commands)
   */
  async deleteEvent(eventId: string): Promise<void> {
    console.log('🗑️ deleteEvent - Starting deletion for:', eventId)

    // Delete in correct order to respect foreign key constraints

    // 1. Delete tickets
    console.log('🎫 Deleting tickets...')
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('lottery_tickets')
      .delete()
      .eq('event_id', eventId)
      .select()

    console.log('🎫 Tickets delete result:', { data: ticketsData, error: ticketsError })
    if (ticketsError) {
      console.error('❌ Tickets error:', ticketsError)
      throw new Error(`Error deleting tickets: ${ticketsError.message}`)
    }

    // 2. Delete extraction commands
    console.log('📋 Deleting extraction commands...')
    const { data: commandsData, error: commandsError } = await supabase
      .from('lottery_extraction_commands')
      .delete()
      .eq('event_id', eventId)
      .select()

    console.log('📋 Commands delete result:', { data: commandsData, error: commandsError })
    if (commandsError) {
      console.error('❌ Commands error:', commandsError)
      throw new Error(`Error deleting commands: ${commandsError.message}`)
    }

    // 3. Delete extractions
    console.log('🎰 Deleting extractions...')
    const { data: extractionsData, error: extractionsError } = await supabase
      .from('lottery_extractions')
      .delete()
      .eq('event_id', eventId)
      .select()

    console.log('🎰 Extractions delete result:', { data: extractionsData, error: extractionsError })
    if (extractionsError) {
      console.error('❌ Extractions error:', extractionsError)
      throw new Error(`Error deleting extractions: ${extractionsError.message}`)
    }

    // 4. Check if event exists before deleting
    console.log('🔍 Checking if event exists...')
    const { data: existingEvent, error: checkError } = await supabase
      .from('lottery_events')
      .select('id')
      .eq('id', eventId)
      .single()

    console.log('🔍 Event exists check:', { exists: !!existingEvent, error: checkError })

    if (!existingEvent && !checkError) {
      console.log('⚠️ Event does not exist, nothing to delete')
      return
    }

    // 5. Finally, delete the event itself
    console.log('🎉 Deleting event...')
    const { data: eventData, error: eventError, count } = await supabase
      .from('lottery_events')
      .delete()
      .eq('id', eventId)
      .select()

    console.log('🎉 Event delete result:', {
      data: eventData,
      error: eventError,
      count,
      rowsDeleted: eventData?.length || 0
    })

    if (eventError) {
      console.error('❌ Event error:', eventError)
      throw new Error(`Error deleting event: ${eventError.message}`)
    }

    if (!eventData || eventData.length === 0) {
      console.warn('⚠️ Delete returned 0 rows - event may not exist or RLS policy blocking')
    }

    console.log('✅ deleteEvent - Deletion completed successfully!')
  },

  /**
   * Recalculate event totals from tickets
   */
  async recalculateEventTotals(eventId: string): Promise<void> {
    const { data: tickets, error } = await supabase
      .from('lottery_tickets')
      .select('price_paid')
      .eq('event_id', eventId)

    if (error) {
      console.error('Error fetching tickets for recalculation:', error)
      return
    }

    if (tickets) {
      const totalSold = tickets.filter(t => t.price_paid > 0).length
      const totalComplimentary = tickets.filter(t => t.price_paid === 0).length
      const totalRevenue = tickets.reduce((sum, t) => sum + (t.price_paid || 0), 0)

      console.log(`Recalculating event ${eventId}:`, {
        totalSold,
        totalComplimentary,
        totalRevenue,
        ticketsCount: tickets.length
      })

      // Try updating with complimentary tickets first
      let { error: updateError } = await supabase
        .from('lottery_events')
        .update({
          total_tickets_sold: totalSold,
          total_complimentary_tickets: totalComplimentary,
          total_revenue: totalRevenue
        })
        .eq('id', eventId)

      // If that fails, try without total_complimentary_tickets column
      if (updateError) {
        console.log('First update failed:', updateError.message, updateError)
        console.log('Trying update without total_complimentary_tickets column')
        const { error: retryError } = await supabase
          .from('lottery_events')
          .update({
            total_tickets_sold: totalSold,
            total_revenue: totalRevenue
          })
          .eq('id', eventId)

        if (retryError) {
          console.error('Error updating event totals:', retryError.message, retryError)
        } else {
          console.log('✅ Update successful without complimentary column')
        }
      } else {
        console.log('✅ Update successful with complimentary column')
      }
    }
  },

  // =====================================================
  // TICKETS
  // =====================================================

  /**
   * Get all tickets for event
   */
  async getEventTickets(eventId: string): Promise<LotteryTicket[]> {
    const { data, error } = await supabase
      .from('lottery_tickets')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Get tickets that haven't won yet (for extraction)
   */
  async getAvailableTickets(eventId: string): Promise<LotteryTicket[]> {
    const { data, error } = await supabase
      .from('lottery_tickets')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_winner', false)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Generate unique ticket number for event
   */
  async generateTicketNumber(eventId: string): Promise<string> {
    const { data, error } = await supabase
      .rpc('generate_lottery_ticket_number', { p_event_id: eventId })

    if (error) throw error
    return data
  },

  /**
   * Create ticket (sell ticket to customer)
   */
  async createTicket(params: {
    eventId: string
    organizationId: string
    customerName: string
    customerEmail?: string
    customerPhone?: string
    customerAddress?: string
    customerId?: string
    fortuneMessage?: string
    staffId?: string
    staffName?: string
    pricePaid: number
  }): Promise<LotteryTicket> {
    // Generate ticket number
    const ticketNumber = await this.generateTicketNumber(params.eventId)

    // Generate QR code data (event_id + ticket_number)
    const qrCodeData = `LOTTERY:${params.eventId}:${ticketNumber}`

    const ticket = {
      event_id: params.eventId,
      organization_id: params.organizationId,
      ticket_number: ticketNumber,
      customer_id: params.customerId,
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone,
      customer_address: params.customerAddress,
      fortune_message: params.fortuneMessage || this.generateFortune(),
      purchased_by_staff_id: params.staffId,
      purchased_by_staff_name: params.staffName,
      price_paid: params.pricePaid,
      qr_code_data: qrCodeData
    }

    const { data, error } = await supabase
      .from('lottery_tickets')
      .insert([ticket])
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Sell ticket (alias for createTicket)
   */
  async sellTicket(params: {
    eventId: string
    organizationId: string
    customerName: string
    customerEmail?: string
    customerPhone?: string
    customerAddress?: string
    customerId?: string
    fortuneMessage?: string
    staffId?: string
    staffName?: string
    pricePaid: number
    isComplimentary?: boolean
  }): Promise<LotteryTicket> {
    const ticket = await this.createTicket(params)

    // Update event totals
    const { data: event } = await supabase
      .from('lottery_events')
      .select('total_tickets_sold, total_revenue, total_complimentary_tickets')
      .eq('id', params.eventId)
      .single()

    if (event) {
      const isComplimentary = params.isComplimentary || params.pricePaid === 0

      await supabase
        .from('lottery_events')
        .update({
          total_tickets_sold: isComplimentary ? event.total_tickets_sold : (event.total_tickets_sold || 0) + 1,
          total_complimentary_tickets: isComplimentary ? (event.total_complimentary_tickets || 0) + 1 : event.total_complimentary_tickets,
          total_revenue: (event.total_revenue || 0) + params.pricePaid
        })
        .eq('id', params.eventId)
    }

    return ticket
  },

  /**
   * Validate ticket by QR code
   */
  async validateTicket(qrCodeData: string): Promise<LotteryTicket> {
    const { data, error } = await supabase
      .from('lottery_tickets')
      .select('*')
      .eq('qr_code_data', qrCodeData)
      .single()

    if (error) throw error

    // Mark as validated
    const { data: updated, error: updateError } = await supabase
      .from('lottery_tickets')
      .update({ is_validated: true, validated_at: new Date().toISOString() })
      .eq('id', data.id)
      .select()
      .single()

    if (updateError) throw updateError
    return updated
  },

  // =====================================================
  // EXTRACTION
  // =====================================================

  /**
   * Perform lottery extraction (pick random winner)
   */
  async performExtraction(params: {
    eventId: string
    organizationId: string
    staffId?: string
    staffName?: string
  }): Promise<{ winner: LotteryTicket; extraction: LotteryExtraction }> {
    // Get available tickets
    const availableTickets = await this.getAvailableTickets(params.eventId)

    if (availableTickets.length === 0) {
      throw new Error('Nessun biglietto disponibile per l\'estrazione')
    }

    // Pick random winner
    const randomIndex = Math.floor(Math.random() * availableTickets.length)
    const winningTicket = availableTickets[randomIndex]

    // Mark ticket as winner
    const { data: winner, error: winnerError } = await supabase
      .from('lottery_tickets')
      .update({
        is_winner: true,
        won_at: new Date().toISOString()
      })
      .eq('id', winningTicket.id)
      .select()
      .single()

    if (winnerError) throw winnerError

    // Create extraction record
    const extraction = {
      event_id: params.eventId,
      organization_id: params.organizationId,
      winning_ticket_id: winner.id,
      winning_ticket_number: winner.ticket_number,
      winner_customer_name: winner.customer_name,
      extracted_by_staff_id: params.staffId,
      extracted_by_staff_name: params.staffName,
      extraction_method: 'automatic' as const,
      total_participants: availableTickets.length
    }

    const { data: extractionRecord, error: extractionError } = await supabase
      .from('lottery_extractions')
      .insert([extraction])
      .select()
      .single()

    if (extractionError) throw extractionError

    // Update event status
    await this.updateEvent(params.eventId, {
      status: 'extracted',
      extracted_at: new Date().toISOString()
    })

    return { winner, extraction: extractionRecord }
  },

  /**
   * Get extraction history for event
   */
  async getExtractions(eventId: string): Promise<LotteryExtraction[]> {
    const { data, error } = await supabase
      .from('lottery_extractions')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Mark prize as claimed
   */
  async claimPrize(ticketId: string): Promise<LotteryTicket> {
    const { data, error } = await supabase
      .from('lottery_tickets')
      .update({
        prize_claimed: true,
        prize_claimed_at: new Date().toISOString()
      })
      .eq('id', ticketId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // =====================================================
  // PRIZES (Multi-Prize System)
  // =====================================================

  /**
   * Get all prizes for an event
   */
  async getPrizesByEvent(eventId: string): Promise<LotteryPrize[]> {
    const { data, error } = await supabase
      .from('lottery_prizes')
      .select('*')
      .eq('event_id', eventId)
      .order('rank', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get available prizes (not yet extracted) for an event
   */
  async getAvailablePrizes(eventId: string): Promise<LotteryPrize[]> {
    const { data, error } = await supabase
      .from('lottery_prizes')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_extracted', false)
      .order('rank', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get a specific prize by ID
   */
  async getPrize(prizeId: string): Promise<LotteryPrize> {
    const { data, error } = await supabase
      .from('lottery_prizes')
      .select('*')
      .eq('id', prizeId)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Create a prize for an event
   */
  async createPrize(params: {
    eventId: string
    organizationId: string
    rank: number
    prizeName: string
    prizeValue?: number
    prizeDescription?: string
  }): Promise<LotteryPrize> {
    const { data, error } = await supabase
      .from('lottery_prizes')
      .insert({
        event_id: params.eventId,
        organization_id: params.organizationId,
        rank: params.rank,
        prize_name: params.prizeName,
        prize_value: params.prizeValue,
        prize_description: params.prizeDescription
      })
      .select()
      .single()

    if (error) throw error

    // Update event total_prizes count
    const prizes = await this.getPrizesByEvent(params.eventId)
    await supabase
      .from('lottery_events')
      .update({ total_prizes: prizes.length })
      .eq('id', params.eventId)

    return data
  },

  /**
   * Update a prize
   */
  async updatePrize(
    prizeId: string,
    updates: Partial<Pick<LotteryPrize, 'prize_name' | 'prize_value' | 'prize_description' | 'rank'>>
  ): Promise<LotteryPrize> {
    const { data, error } = await supabase
      .from('lottery_prizes')
      .update(updates)
      .eq('id', prizeId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete a prize
   */
  async deletePrize(prizeId: string): Promise<void> {
    // Get prize info before deleting
    const prize = await this.getPrize(prizeId)

    // Can't delete if already extracted
    if (prize.is_extracted) {
      throw new Error('Impossibile eliminare un premio già estratto')
    }

    const { error } = await supabase
      .from('lottery_prizes')
      .delete()
      .eq('id', prizeId)

    if (error) throw error

    // Update event total_prizes count
    const prizes = await this.getPrizesByEvent(prize.event_id)
    await supabase
      .from('lottery_events')
      .update({ total_prizes: prizes.length })
      .eq('id', prize.event_id)
  },

  /**
   * Perform extraction for a specific prize
   */
  async performExtractionForPrize(params: {
    eventId: string
    prizeId: string
    organizationId: string
    staffId?: string
    staffName?: string
  }): Promise<{ winner: LotteryTicket; extraction: LotteryExtraction; prize: LotteryPrize }> {
    // Get prize info
    const prize = await this.getPrize(params.prizeId)

    if (prize.is_extracted) {
      throw new Error('Questo premio è già stato estratto')
    }

    // Get available tickets (that haven't won any prize yet)
    const availableTickets = await this.getAvailableTickets(params.eventId)

    if (availableTickets.length === 0) {
      throw new Error('Nessun biglietto disponibile per l\'estrazione')
    }

    // Pick random winner
    const randomIndex = Math.floor(Math.random() * availableTickets.length)
    const winningTicket = availableTickets[randomIndex]

    // Mark ticket as winner with prize info
    const { data: winner, error: winnerError } = await supabase
      .from('lottery_tickets')
      .update({
        is_winner: true,
        won_at: new Date().toISOString(),
        prize_id: params.prizeId,
        prize_rank: prize.rank
      })
      .eq('id', winningTicket.id)
      .select()
      .single()

    if (winnerError) throw winnerError

    // Mark prize as extracted
    const { data: updatedPrize, error: prizeError } = await supabase
      .from('lottery_prizes')
      .update({
        is_extracted: true,
        extracted_at: new Date().toISOString(),
        winning_ticket_id: winner.id
      })
      .eq('id', params.prizeId)
      .select()
      .single()

    if (prizeError) throw prizeError

    // Create extraction record
    const extraction = {
      event_id: params.eventId,
      organization_id: params.organizationId,
      winning_ticket_id: winner.id,
      winning_ticket_number: winner.ticket_number,
      winner_customer_name: winner.customer_name,
      extracted_by_staff_id: params.staffId,
      extracted_by_staff_name: params.staffName,
      extraction_method: 'automatic' as const,
      total_participants: availableTickets.length,
      prize_id: params.prizeId,
      prize_rank: prize.rank
    }

    const { data: extractionRecord, error: extractionError } = await supabase
      .from('lottery_extractions')
      .insert(extraction)
      .select()
      .single()

    if (extractionError) throw extractionError

    // Update event prizes_extracted count
    const { data: event } = await supabase
      .from('lottery_events')
      .select('total_prizes, prizes_extracted')
      .eq('id', params.eventId)
      .single()

    if (event) {
      const prizesExtracted = (event.prizes_extracted || 0) + 1
      const updates: any = {
        prizes_extracted: prizesExtracted
      }

      // If all prizes are extracted, mark event as extracted
      if (prizesExtracted >= event.total_prizes) {
        updates.status = 'extracted'
        updates.extracted_at = new Date().toISOString()
      }

      await supabase
        .from('lottery_events')
        .update(updates)
        .eq('id', params.eventId)
    }

    return { winner, extraction: extractionRecord, prize: updatedPrize }
  },

  /**
   * Get all winners with their prizes for an event
   */
  async getEventWinnersWithPrizes(eventId: string): Promise<LotteryWinnerWithPrize[]> {
    const { data, error } = await supabase
      .from('lottery_tickets')
      .select(`
        ticket_number,
        customer_name,
        prize_rank,
        won_at,
        lottery_prizes!lottery_tickets_prize_id_fkey (
          prize_name,
          prize_value
        )
      `)
      .eq('event_id', eventId)
      .eq('is_winner', true)
      .order('prize_rank', { ascending: true })

    if (error) throw error

    // Transform the data to match interface
    return (data || []).map((item: any) => ({
      ticket_number: item.ticket_number,
      customer_name: item.customer_name,
      prize_rank: item.prize_rank,
      prize_name: item.lottery_prizes?.prize_name || '',
      prize_value: item.lottery_prizes?.prize_value,
      won_at: item.won_at
    }))
  },

  // =====================================================
  // HELPERS
  // =====================================================

  /**
   * Generate random fortune message
   */
  generateFortune(): string {
    const fortunes = [
      "La fortuna ti sorride!",
      "Oggi è il tuo giorno fortunato!",
      "Le stelle sono dalla tua parte!",
      "Un grande premio ti attende!",
      "La dea bendata ti guarda!",
      "Il destino ti è favorevole!",
      "Grandi cose stanno per accadere!",
      "La tua stella brilla!",
      "Il successo è vicino!",
      "Un colpo di fortuna sta arrivando!"
    ]
    return fortunes[Math.floor(Math.random() * fortunes.length)]
  }
}
