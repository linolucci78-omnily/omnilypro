import { supabase } from '../lib/supabase'

// ============================================
// TYPES
// ============================================

export interface ContractTemplate {
  id: string
  organization_id: string
  name: string
  description: string | null
  template_type: 'service_agreement' | 'nda' | 'subscription' | 'custom'
  content: string
  variables: any
  requires_counter_signature: boolean
  signature_positions: any
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface Contract {
  id: string
  contract_number: string
  organization_id: string
  lead_id: string | null
  template_id: string | null
  created_by: string | null
  title: string
  content: string
  contract_type: string
  contract_value: number | null
  currency: string
  client_info: {
    name: string
    email: string
    phone?: string
    company: string
    vat_number?: string
    address?: string
  }
  vendor_info: {
    name: string
    email: string
    company: string
    vat_number: string
    address: string
  }
  status: 'draft' | 'sent' | 'viewed' | 'signing_in_progress' | 'signed' | 'completed' | 'rejected' | 'expired' | 'cancelled'
  sent_at: string | null
  expires_at: string | null
  signed_at: string | null
  completed_at: string | null
  pdf_url: string | null
  signed_pdf_url: string | null
  metadata: any
  created_at: string
  updated_at: string
}

export interface ContractSignature {
  id: string
  contract_id: string
  signer_name: string
  signer_email: string
  signer_phone: string | null
  signer_role: 'client' | 'vendor' | 'witness'
  signer_company: string | null
  status: 'pending' | 'otp_sent' | 'otp_verified' | 'signed' | 'rejected'
  otp_code: string | null
  otp_sent_at: string | null
  otp_verified_at: string | null
  otp_attempts: number
  otp_max_attempts: number
  signature_type: 'otp_verified' | 'drawn' | 'typed' | null
  signature_data: string | null
  signature_ip: string | null
  signature_user_agent: string | null
  signature_geolocation: any
  acceptance_timestamp: string | null
  acceptance_method: string | null
  legal_consent_text: string | null
  legal_consent_accepted: boolean
  signed_at: string | null
  rejected_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export interface CreateContractInput {
  lead_id?: string
  template_id?: string
  title: string
  content: string
  contract_type: string
  contract_value?: number
  client_info: Contract['client_info']
  vendor_info: Contract['vendor_info']
  expires_at?: string
}

export interface CreateSignatureInput {
  contract_id: string
  signer_name: string
  signer_email: string
  signer_phone?: string
  signer_role: ContractSignature['signer_role']
  signer_company?: string
}

// ============================================
// CONTRACTS SERVICE
// ============================================

export const contractsService = {
  // Get all contracts
  async getContracts(filters?: { status?: string; lead_id?: string }): Promise<Contract[]> {
    let query = supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.lead_id) {
      query = query.eq('lead_id', filters.lead_id)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  // Get contract by ID
  async getContractById(id: string): Promise<Contract> {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Get contract by number
  async getContractByNumber(contractNumber: string): Promise<Contract> {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('contract_number', contractNumber)
      .single()

    if (error) throw error
    return data
  },

  // Create contract
  async createContract(input: CreateContractInput, organizationId: string, userId: string): Promise<Contract> {
    console.log('🔵 contractsService.createContract called')
    console.log('Input:', input)
    console.log('Organization ID:', organizationId)
    console.log('User ID:', userId)

    const contractData = {
      ...input,
      organization_id: organizationId,
      created_by: userId,
      status: 'draft' as const,
      currency: 'EUR'
    }

    console.log('🔵 Inserting to database:', contractData)

    const { data, error } = await supabase
      .from('contracts')
      .insert(contractData)
      .select()
      .single()

    if (error) {
      console.error('🔴 Database error:', error)
      throw error
    }

    console.log('🟢 Contract created in DB:', data)

    // Log audit event
    try {
      await this.logAuditEvent(data.id, 'contract_created', 'Contract created', 'user', userId)
    } catch (auditError) {
      console.warn('⚠️ Audit log failed (non-critical):', auditError)
    }

    return data
  },

  // Update contract
  async updateContract(id: string, updates: Partial<CreateContractInput>): Promise<Contract> {
    const { data, error } = await supabase
      .from('contracts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Send contract for signature
  async sendContract(contractId: string): Promise<Contract> {
    const { data, error } = await supabase
      .from('contracts')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', contractId)
      .select()
      .single()

    if (error) throw error

    // Log audit event
    await this.logAuditEvent(contractId, 'contract_sent', 'Contract sent for signature', 'system')

    // Send signature invitation emails to all signers
    const signatures = await this.getContractSignatures(contractId)
    for (const signature of signatures) {
      if (signature.status === 'pending') {
        await this.sendSignatureInvitation(signature.id, data)
      }
    }

    return data
  },

  // Send signature invitation email with link
  async sendSignatureInvitation(signatureId: string, contract: Contract): Promise<void> {
    try {
      // Get signature details
      const { data: signature, error: sigError } = await supabase
        .from('contract_signatures')
        .select('*')
        .eq('id', signatureId)
        .single()

      if (sigError) throw sigError

      // Get frontend URL from env or use default
      const frontendUrl = import.meta.env.VITE_APP_URL || window.location.origin
      const signatureLink = `${frontendUrl}/sign/${signatureId}`

      console.log(`📧 Sending signature invitation to ${signature.signer_email}`)

      // Send email via Edge Function
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          organization_id: contract.organization_id,
          template_type: 'contract_signature_invitation',
          to_email: signature.signer_email,
          to_name: signature.signer_name,
          dynamic_data: {
            signer_name: signature.signer_name,
            contract_title: contract.title,
            contract_number: contract.contract_number,
            signature_link: signatureLink,
            signer_role: signature.signer_role === 'client' ? 'Cliente' : 'Fornitore'
          }
        }
      })

      if (emailError) {
        console.error('❌ Error sending invitation email:', emailError)
        // Fallback: log link to console
        console.log(`📧 FALLBACK - Signature link for ${signature.signer_email}:`)
        console.log(signatureLink)
      } else {
        console.log('✅ Signature invitation sent successfully')
      }

      // Log notification
      await supabase
        .from('contract_notifications')
        .insert({
          contract_id: contract.id,
          signature_id: signatureId,
          notification_type: 'signature_invitation',
          channel: 'email',
          recipient_email: signature.signer_email,
          subject: `Contratto da firmare: ${contract.title}`,
          content: `Clicca sul link per firmare il contratto: ${signatureLink}`,
          status: emailError ? 'failed' : 'sent',
          sent_at: new Date().toISOString()
        })

    } catch (error) {
      console.error('Error sending signature invitation:', error)
      throw error
    }
  },

  // Get signatures for contract
  async getContractSignatures(contractId: string): Promise<ContractSignature[]> {
    const { data, error } = await supabase
      .from('contract_signatures')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Create signature request
  async createSignatureRequest(input: CreateSignatureInput): Promise<ContractSignature> {
    const { data, error } = await supabase
      .from('contract_signatures')
      .insert({
        ...input,
        status: 'pending',
        otp_attempts: 0,
        otp_max_attempts: 3,
        legal_consent_accepted: false
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Send OTP for signature
  async sendSignatureOTP(signatureId: string, method: 'email' | 'sms'): Promise<{ success: boolean; message: string }> {
    // Get signature with contract info
    const { data: signature, error: sigError } = await supabase
      .from('contract_signatures')
      .select(`
        *,
        contract:contracts(title, organization_id)
      `)
      .eq('id', signatureId)
      .single()

    if (sigError) throw sigError

    // Generate OTP
    const { data: otpData, error: otpError } = await supabase
      .rpc('generate_otp_code')

    if (otpError) throw otpError

    const otpCode = otpData as string

    // Update signature with OTP
    const { error: updateError } = await supabase
      .from('contract_signatures')
      .update({
        otp_code: otpCode,
        otp_sent_at: new Date().toISOString(),
        otp_attempts: 0,
        status: 'otp_sent'
      })
      .eq('id', signatureId)

    if (updateError) throw updateError

    console.log(`📧 Sending OTP via ${method} to ${signature.signer_email}...`)

    // Send OTP via email using Edge Function
    if (method === 'email') {
      try {
        const { data: functionData, error: functionError } = await supabase.functions.invoke('send-email', {
          body: {
            organization_id: signature.contract.organization_id,
            template_type: 'contract_otp',
            to_email: signature.signer_email,
            to_name: signature.signer_name,
            dynamic_data: {
              signer_name: signature.signer_name,
              contract_title: signature.contract.title,
              otp_code: otpCode
            }
          }
        })

        if (functionError) {
          console.error('❌ Edge Function error:', functionError)
          // Fallback: log OTP to console
          console.log(`📧 FALLBACK - OTP Code for ${signature.signer_email}: ${otpCode}`)
        } else {
          console.log('✅ OTP email sent successfully:', functionData)
        }
      } catch (emailError) {
        console.error('❌ Error calling edge function:', emailError)
        // Fallback: log OTP to console
        console.log(`📧 FALLBACK - OTP Code for ${signature.signer_email}: ${otpCode}`)
      }
    } else {
      // SMS not implemented yet
      console.log(`📱 SMS OTP Code for ${signature.signer_phone}: ${otpCode}`)
    }

    // Log notification
    await supabase
      .from('contract_notifications')
      .insert({
        contract_id: signature.contract_id,
        signature_id: signatureId,
        notification_type: 'otp',
        channel: method,
        recipient_email: method === 'email' ? signature.signer_email : null,
        recipient_phone: method === 'sms' ? signature.signer_phone : null,
        subject: 'Codice OTP per firma contratto',
        content: `Il tuo codice OTP è: ${otpCode}`,
        status: 'sent',
        sent_at: new Date().toISOString()
      })

    // Log audit event
    await this.logAuditEvent(
      signature.contract_id,
      'otp_sent',
      `OTP sent via ${method}`,
      'system',
      undefined,
      signatureId
    )

    return {
      success: true,
      message: `OTP inviato via ${method === 'email' ? 'email' : 'SMS'}`
    }
  },

  // Verify OTP
  async verifySignatureOTP(signatureId: string, otpCode: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase
      .rpc('verify_signature_otp', {
        p_signature_id: signatureId,
        p_otp_code: otpCode
      })

    if (error) throw error

    if (data) {
      // Log audit event
      const { data: signature } = await supabase
        .from('contract_signatures')
        .select('contract_id')
        .eq('id', signatureId)
        .single()

      if (signature) {
        await this.logAuditEvent(
          signature.contract_id,
          'otp_verified',
          'OTP verified successfully',
          'signer',
          undefined,
          signatureId
        )
      }

      return { success: true, message: 'OTP verificato con successo' }
    }

    return { success: false, message: 'OTP non valido o scaduto' }
  },

  // Complete signature
  async completeSignature(
    signatureId: string,
    signatureData: {
      signature_type: 'drawn' | 'typed'
      signature_data: string
      ip_address: string
      user_agent: string
      geolocation?: any
      legal_consent_accepted: boolean
    }
  ): Promise<ContractSignature> {
    const { data, error } = await supabase
      .from('contract_signatures')
      .update({
        ...signatureData,
        status: 'signed',
        signed_at: new Date().toISOString(),
        acceptance_timestamp: new Date().toISOString(),
        acceptance_method: 'email_otp'
      })
      .eq('id', signatureId)
      .select()
      .single()

    if (error) throw error

    // Log audit event
    await this.logAuditEvent(
      data.contract_id,
      'signature_completed',
      `Signature completed by ${data.signer_role}`,
      'signer',
      undefined,
      signatureId
    )

    // Se il cliente ha appena firmato, notifica il fornitore
    if (data.signer_role === 'client') {
      await this.notifyVendorToSign(data.contract_id)
    }

    // Check if all signatures are completed and update contract status
    await this.checkAndUpdateContractStatus(data.contract_id)

    return data
  },

  // Notify vendor to sign after client signature
  async notifyVendorToSign(contractId: string): Promise<void> {
    try {
      // Find vendor signature request
      const { data: vendorSignature, error } = await supabase
        .from('contract_signatures')
        .select('*')
        .eq('contract_id', contractId)
        .eq('signer_role', 'vendor')
        .eq('status', 'pending')
        .single()

      if (error || !vendorSignature) {
        console.log('No pending vendor signature found')
        return
      }

      // Send OTP to vendor
      console.log('📧 Notifying vendor to sign contract:', vendorSignature.signer_email)
      await this.sendSignatureOTP(vendorSignature.id, 'email')

      console.log('✅ Vendor notified successfully')
    } catch (error) {
      console.error('Error notifying vendor:', error)
    }
  },

  // Check if all signatures are completed and update contract accordingly
  async checkAndUpdateContractStatus(contractId: string): Promise<void> {
    // Get all signatures for this contract
    const { data: signatures, error: sigError } = await supabase
      .from('contract_signatures')
      .select('*')
      .eq('contract_id', contractId)

    if (sigError) {
      console.error('Error fetching signatures:', sigError)
      return
    }

    if (!signatures || signatures.length === 0) {
      console.log('No signatures found for contract')
      return
    }

    // Check if all signatures are signed
    const allSigned = signatures.every(sig => sig.status === 'signed')
    const anySigned = signatures.some(sig => sig.status === 'signed')

    if (allSigned) {
      // All signatures completed - mark contract as signed
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          status: 'signed',
          signed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId)

      if (updateError) {
        console.error('Error updating contract status:', updateError)
      } else {
        console.log('✅ Contract marked as SIGNED - all signatures completed')

        // Log audit event
        await this.logAuditEvent(
          contractId,
          'contract_signed',
          'All signatures completed - contract fully signed',
          'system'
        )
      }
    } else if (anySigned) {
      // Some signatures completed - mark as signing in progress
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          status: 'signing_in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId)

      if (updateError) {
        console.error('Error updating contract status:', updateError)
      } else {
        console.log('⏳ Contract marked as SIGNING_IN_PROGRESS')
      }
    }
  },

  // Get audit log
  async getAuditLog(contractId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('signature_audit_log')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Log audit event (internal)
  async logAuditEvent(
    contractId: string,
    eventType: string,
    description: string,
    actorType: 'system' | 'user' | 'signer',
    actorId?: string,
    signatureId?: string
  ): Promise<void> {
    await supabase
      .from('signature_audit_log')
      .insert({
        contract_id: contractId,
        signature_id: signatureId,
        event_type: eventType,
        event_description: description,
        actor_type: actorType,
        actor_id: actorId
      })
  }
}

// ============================================
// TEMPLATES SERVICE
// ============================================

export const contractTemplatesService = {
  // Get all templates
  async getTemplates(): Promise<ContractTemplate[]> {
    const { data, error } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Get template by ID
  async getTemplateById(id: string): Promise<ContractTemplate> {
    const { data, error } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Render template with variables
  renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template

    Object.keys(variables).forEach((key) => {
      const placeholder = `{{${key}}}`
      rendered = rendered.replace(new RegExp(placeholder, 'g'), variables[key] || '')
    })

    return rendered
  }
}
