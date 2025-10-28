/**
 * Gift Certificates Service - OMNILY PRO
 *
 * Service for managing gift certificates operations
 * Handles CRUD operations, validation, redemption, and analytics
 */

import { supabase } from '../lib/supabase';
import { generateGiftCertificateCode, generateQRCodeDataURL } from '../utils/giftCertificateCodeGenerator';
import type {
  GiftCertificate,
  GiftCertificateTransaction,
  GiftCertificateStats,
  CreateGiftCertificateRequest,
  CreateGiftCertificateResponse,
  ValidateGiftCertificateRequest,
  ValidateGiftCertificateResponse,
  RedeemGiftCertificateRequest,
  RedeemGiftCertificateResponse,
  GiftCertificateFilters,
  PaginationParams,
  PaginatedResponse,
  GiftCertificateSettings
} from '../types/giftCertificate';

export class GiftCertificatesService {

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Get all gift certificates for an organization
   */
  async getAll(
    organizationId: string,
    filters?: GiftCertificateFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<GiftCertificate>> {
    try {
      let query = supabase
        .from('gift_certificates')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId);

      // Apply filters
      if (filters) {
        if (filters.status) {
          if (Array.isArray(filters.status)) {
            query = query.in('status', filters.status);
          } else {
            query = query.eq('status', filters.status);
          }
        }

        if (filters.issue_type) {
          query = query.eq('issue_type', filters.issue_type);
        }

        if (filters.from_date) {
          query = query.gte('issued_at', filters.from_date);
        }

        if (filters.to_date) {
          query = query.lte('issued_at', filters.to_date);
        }

        if (filters.min_amount) {
          query = query.gte('original_amount', filters.min_amount);
        }

        if (filters.max_amount) {
          query = query.lte('original_amount', filters.max_amount);
        }

        if (filters.recipient_email) {
          query = query.ilike('recipient_email', `%${filters.recipient_email}%`);
        }

        if (filters.recipient_name) {
          query = query.ilike('recipient_name', `%${filters.recipient_name}%`);
        }

        if (filters.search_code) {
          query = query.ilike('code', `%${filters.search_code}%`);
        }
      }

      // Apply pagination
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 50;
      const offset = (page - 1) * limit;

      query = query.range(offset, offset + limit - 1);

      // Apply sorting
      const sortBy = pagination?.sort_by || 'created_at';
      const sortOrder = pagination?.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error, count } = await query;

      if (error) {
        console.error('Failed to get gift certificates:', error);
        throw error;
      }

      return {
        data: data || [],
        pagination: {
          total: count || 0,
          page,
          limit,
          total_pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error: any) {
      console.error('Error in GiftCertificatesService.getAll:', error);
      throw error;
    }
  }

  /**
   * Get gift certificate by ID
   */
  async getById(id: string, organizationId: string): Promise<GiftCertificate | null> {
    try {
      const { data, error } = await supabase
        .from('gift_certificates')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Failed to get gift certificate:', error);
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Error in GiftCertificatesService.getById:', error);
      throw error;
    }
  }

  /**
   * Get gift certificate by code
   */
  async getByCode(code: string, organizationId: string): Promise<GiftCertificate | null> {
    try {
      // Clean the code: remove dashes and spaces, convert to uppercase
      const cleanCode = code.replace(/[-\s]/g, '').toUpperCase();
      const upperCode = code.toUpperCase();

      console.log(`🔍 Searching for gift certificate - Input: "${code}", Clean: "${cleanCode}"`);

      // First try: exact match with the input as-is
      let { data, error } = await supabase
        .from('gift_certificates')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('code', upperCode)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to get gift certificate by code:', error);
        throw error;
      }

      if (data) {
        console.log(`✅ Found gift certificate (exact match): ${data.code}`);
        return data;
      }

      // Second try: search in database where stored code without dashes matches clean code
      console.log(`🔍 Trying to find by matching cleaned codes...`);

      // Get all certificates for this org and filter in JS
      const { data: allCerts, error: allError } = await supabase
        .from('gift_certificates')
        .select('*')
        .eq('organization_id', organizationId);

      if (allError) {
        console.error('Failed to get certificates:', allError);
        throw allError;
      }

      // Find certificate where the cleaned version of the stored code matches our cleaned input
      const matchingCert = allCerts?.find(cert => {
        const storedClean = cert.code.replace(/[-\s]/g, '').toUpperCase();
        return storedClean === cleanCode;
      });

      if (matchingCert) {
        console.log(`✅ Found gift certificate (cleaned match): ${matchingCert.code}`);
        return matchingCert;
      }

      console.log(`❌ No gift certificate found for code: ${code}`);
      return null;
    } catch (error: any) {
      console.error('Error in GiftCertificatesService.getByCode:', error);
      throw error;
    }
  }

  /**
   * Create a new gift certificate
   */
  async create(request: CreateGiftCertificateRequest): Promise<CreateGiftCertificateResponse> {
    try {
      // Get settings for code generation
      const settings = await this.getSettings(request.organization_id);
      const codePrefix = settings?.code_prefix || 'GIFT';
      const codeLength = settings?.code_length || 12;

      // Generate unique code
      let code = generateGiftCertificateCode(codePrefix, codeLength);
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        const existing = await this.getByCode(code, request.organization_id);
        if (!existing) {
          isUnique = true;
        } else {
          code = generateGiftCertificateCode(codePrefix, codeLength);
          attempts++;
        }
      }

      if (!isUnique) {
        throw new Error('Failed to generate unique gift certificate code after multiple attempts');
      }

      // Generate QR code
      const qrCodeData = await generateQRCodeDataURL(code);

      // Calculate validity
      const validFrom = new Date().toISOString();
      let validUntil = request.valid_until;

      if (!validUntil && settings?.default_terms_conditions) {
        // Use default validity from settings
        const defaultDays = 365; // Default 1 year
        const validUntilDate = new Date();
        validUntilDate.setDate(validUntilDate.getDate() + defaultDays);
        validUntil = validUntilDate.toISOString();
      }

      // Create gift certificate
      const giftCertificate: Partial<GiftCertificate> = {
        organization_id: request.organization_id,
        code: code.toUpperCase(),
        qr_code_data: qrCodeData,
        original_amount: request.amount,
        current_balance: request.amount,
        currency: 'EUR',
        issue_type: request.issue_type,
        recipient_name: request.recipient_name,
        recipient_email: request.recipient_email,
        recipient_phone: request.recipient_phone,
        personal_message: request.personal_message,
        valid_from: validFrom,
        valid_until: validUntil,
        status: 'active',
        template_id: request.template_id,
        metadata: request.metadata,
        issued_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('gift_certificates')
        .insert([giftCertificate])
        .select()
        .single();

      if (error) {
        console.error('Failed to create gift certificate:', error);
        throw error;
      }

      // Create initial transaction
      await this.createTransaction({
        gift_certificate_id: data.id,
        organization_id: request.organization_id,
        transaction_type: 'issued',
        amount: request.amount,
        balance_before: 0,
        balance_after: request.amount,
        description: 'Gift certificate issued'
      });

      // Log audit
      await this.logAudit({
        gift_certificate_id: data.id,
        organization_id: request.organization_id,
        action: 'created',
        new_values: data,
        success: true
      });

      // Send email if enabled and recipient has email
      if (request.recipient_email && request.send_email !== false) {
        try {
          // Pass QR code data URL - will be converted to inline attachment by edge function
          await this.sendGiftCertificateEmail({
            organization_id: request.organization_id,
            gift_certificate: data,
            qr_code_url: qrCodeData
          });
        } catch (emailError) {
          console.error('Failed to send gift certificate email:', emailError);
          // Don't throw - gift certificate was created successfully
        }
      }

      return {
        gift_certificate: data,
        qr_code_url: qrCodeData
      };
    } catch (error: any) {
      console.error('Error in GiftCertificatesService.create:', error);
      throw error;
    }
  }

  /**
   * Send gift certificate email via edge function
   */
  private async sendGiftCertificateEmail(params: {
    organization_id: string;
    gift_certificate: GiftCertificate;
    qr_code_url: string;
  }): Promise<void> {
    try {
      const { organization_id, gift_certificate, qr_code_url } = params;

      console.log('📧 Preparing to send gift certificate email...');

      // Get organization email settings
      const { data: settings } = await supabase
        .from('gift_certificate_settings')
        .select('send_email_on_issue')
        .eq('organization_id', organization_id)
        .single();

      // Check if email sending is enabled
      if (settings && !settings.send_email_on_issue) {
        console.log('⚠️ Email sending disabled for organization');
        return;
      }

      // Get organization name
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organization_id)
        .single();

      const organizationName = org?.name || 'Omnily PRO';

      // Call edge function directly
      console.log('📤 Calling send-email edge function...');
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          organization_id,
          template_type: 'gift_certificate_issued',
          to_email: gift_certificate.recipient_email!,
          to_name: gift_certificate.recipient_name || gift_certificate.recipient_email!,
          dynamic_data: {
            gift_certificate_code: gift_certificate.code,
            amount: gift_certificate.original_amount,
            recipient_name: gift_certificate.recipient_name || 'Cliente',
            personal_message: gift_certificate.personal_message || '',
            valid_until: gift_certificate.valid_until ? new Date(gift_certificate.valid_until).toLocaleDateString('it-IT') : 'N/A',
            qr_code_url: qr_code_url,
            organization_name: organizationName
          }
        }
      });

      if (error) {
        console.error('❌ Error calling send-email function:', error);
        throw error;
      }

      console.log('✅ Gift certificate email sent successfully:', data);
    } catch (error: any) {
      console.error('❌ Error in sendGiftCertificateEmail:', error);
      throw error;
    }
  }

  /**
   * Resend gift certificate email
   */
  async resendEmail(
    id: string,
    organizationId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📤 Resending gift certificate email:', { id, organizationId });

      // Get certificate details
      const certificate = await this.getById(id, organizationId);

      if (!certificate.recipient_email) {
        throw new Error('Nessun indirizzo email disponibile per questo certificato');
      }

      // Get organization name
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single();

      const organizationName = org?.name || 'Omnily PRO';

      // Generate QR code as data URL (will be converted to inline attachment by edge function)
      const qrCodeData = certificate.qr_code_data || await generateQRCodeDataURL(certificate.code);

      // Call edge function to send email
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          organization_id: organizationId,
          template_type: 'gift_certificate_issued',
          to_email: certificate.recipient_email,
          to_name: certificate.recipient_name || certificate.recipient_email,
          dynamic_data: {
            gift_certificate_code: certificate.code,
            amount: certificate.original_amount,
            recipient_name: certificate.recipient_name || 'Cliente',
            personal_message: certificate.personal_message || '',
            valid_until: certificate.valid_until ? new Date(certificate.valid_until).toLocaleDateString('it-IT') : 'N/A',
            qr_code_url: qrCodeData, // Pass data URL - will be converted to inline attachment by edge function
            organization_name: organizationName
          }
        }
      });

      if (error) {
        console.error('❌ Error calling send-email function:', error);
        throw new Error(error.message || 'Errore durante l\'invio dell\'email');
      }

      console.log('✅ Gift certificate email resent successfully:', data);

      // Log audit
      await this.logAudit({
        gift_certificate_id: id,
        organization_id: organizationId,
        action: 'email_resent',
        metadata: {
          recipient_email: certificate.recipient_email,
          email_result: data
        },
        success: true
      });

      return {
        success: true,
        message: 'Email inviata con successo!'
      };
    } catch (error: any) {
      console.error('❌ Error in resendEmail:', error);

      // Log failed audit
      await this.logAudit({
        gift_certificate_id: id,
        organization_id: organizationId,
        action: 'email_resent',
        metadata: { error: error.message },
        success: false
      });

      return {
        success: false,
        message: error.message || 'Errore durante l\'invio dell\'email'
      };
    }
  }

  /**
   * Update gift certificate
   */
  async update(
    id: string,
    organizationId: string,
    updates: Partial<GiftCertificate>
  ): Promise<GiftCertificate> {
    try {
      // Get current state for audit
      const current = await this.getById(id, organizationId);

      const { data, error } = await supabase
        .from('gift_certificates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) {
        console.error('Failed to update gift certificate:', error);
        throw error;
      }

      // Log audit
      await this.logAudit({
        gift_certificate_id: id,
        organization_id: organizationId,
        action: 'modified',
        old_values: current,
        new_values: data,
        success: true
      });

      return data;
    } catch (error: any) {
      console.error('Error in GiftCertificatesService.update:', error);
      throw error;
    }
  }

  /**
   * Cancel gift certificate
   */
  async cancel(id: string, organizationId: string, reason?: string): Promise<GiftCertificate> {
    try {
      const certificate = await this.getById(id, organizationId);

      if (!certificate) {
        throw new Error('Gift certificate not found');
      }

      const updated = await this.update(id, organizationId, {
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled'
      });

      // Create cancellation transaction
      await this.createTransaction({
        gift_certificate_id: id,
        organization_id: organizationId,
        transaction_type: 'cancelled',
        amount: certificate.current_balance,
        balance_before: certificate.current_balance,
        balance_after: 0,
        description: reason || 'Gift certificate cancelled'
      });

      return updated;
    } catch (error: any) {
      console.error('Error in GiftCertificatesService.cancel:', error);
      throw error;
    }
  }

  // ============================================================================
  // VALIDATION AND REDEMPTION
  // ============================================================================

  /**
   * Validate gift certificate
   */
  async validate(request: ValidateGiftCertificateRequest): Promise<ValidateGiftCertificateResponse> {
    try {
      const certificate = await this.getByCode(request.code, request.organization_id);

      if (!certificate) {
        return {
          valid: false,
          can_redeem: false,
          error_message: 'Gift certificate non trovato'
        };
      }

      // Check status
      if (certificate.status === 'cancelled') {
        return {
          valid: false,
          gift_certificate: certificate,
          can_redeem: false,
          error_message: 'Gift certificate annullato',
          remaining_balance: 0
        };
      }

      if (certificate.status === 'fully_used') {
        return {
          valid: true,
          gift_certificate: certificate,
          can_redeem: false,
          error_message: 'Gift certificate già utilizzato completamente',
          remaining_balance: 0
        };
      }

      if (certificate.status === 'expired') {
        return {
          valid: false,
          gift_certificate: certificate,
          can_redeem: false,
          error_message: 'Gift certificate scaduto',
          remaining_balance: certificate.current_balance
        };
      }

      // Check validity dates
      const now = new Date();
      const validFrom = new Date(certificate.valid_from);
      const validUntil = certificate.valid_until ? new Date(certificate.valid_until) : null;

      if (now < validFrom) {
        return {
          valid: false,
          gift_certificate: certificate,
          can_redeem: false,
          error_message: 'Gift certificate non ancora valido',
          remaining_balance: certificate.current_balance
        };
      }

      if (validUntil && now > validUntil) {
        // Auto-expire
        await this.update(certificate.id, request.organization_id, { status: 'expired' });

        return {
          valid: false,
          gift_certificate: certificate,
          can_redeem: false,
          error_message: 'Gift certificate scaduto',
          remaining_balance: certificate.current_balance
        };
      }

      // Check balance
      if (certificate.current_balance <= 0) {
        await this.update(certificate.id, request.organization_id, { status: 'fully_used' });

        return {
          valid: true,
          gift_certificate: certificate,
          can_redeem: false,
          error_message: 'Credito esaurito',
          remaining_balance: 0
        };
      }

      // Log validation
      await this.logAudit({
        gift_certificate_id: certificate.id,
        organization_id: request.organization_id,
        action: 'validated',
        success: true
      });

      return {
        valid: true,
        gift_certificate: certificate,
        can_redeem: true,
        remaining_balance: certificate.current_balance
      };
    } catch (error: any) {
      console.error('Error in GiftCertificatesService.validate:', error);

      // Log failed validation
      await this.logAudit({
        organization_id: request.organization_id,
        action: 'validated',
        success: false,
        error_message: error.message
      });

      throw error;
    }
  }

  /**
   * Redeem gift certificate
   */
  async redeem(request: RedeemGiftCertificateRequest): Promise<RedeemGiftCertificateResponse> {
    try {
      // Validate first
      const validation = await this.validate({
        code: request.code,
        organization_id: request.organization_id
      });

      if (!validation.valid || !validation.can_redeem || !validation.gift_certificate) {
        throw new Error(validation.error_message || 'Cannot redeem this gift certificate');
      }

      const certificate = validation.gift_certificate;

      // Check amount
      if (request.amount <= 0) {
        throw new Error('Redemption amount must be greater than 0');
      }

      if (request.amount > certificate.current_balance) {
        throw new Error(`Amount exceeds available balance (${certificate.current_balance} EUR)`);
      }

      // Calculate new balance
      const newBalance = certificate.current_balance - request.amount;
      const newStatus = newBalance <= 0 ? 'fully_used' : 'partially_used';

      // Update certificate
      const updated = await this.update(certificate.id, request.organization_id, {
        current_balance: newBalance,
        status: newStatus
      });

      // Create redemption transaction
      const transaction = await this.createTransaction({
        gift_certificate_id: certificate.id,
        organization_id: request.organization_id,
        transaction_type: 'redeemed',
        amount: request.amount,
        balance_before: certificate.current_balance,
        balance_after: newBalance,
        transaction_ref: request.transaction_ref,
        performed_by_user_id: request.performed_by_user_id,
        customer_id: request.customer_id,
        pos_device_id: request.pos_device_id,
        description: `Redeemed ${request.amount} EUR`
      });

      // Log redemption
      await this.logAudit({
        gift_certificate_id: certificate.id,
        organization_id: request.organization_id,
        action: 'redeemed',
        new_values: { amount: request.amount, new_balance: newBalance },
        success: true
      });

      return {
        success: true,
        new_balance: newBalance,
        transaction
      };
    } catch (error: any) {
      console.error('Error in GiftCertificatesService.redeem:', error);

      // Log failed redemption
      await this.logAudit({
        organization_id: request.organization_id,
        action: 'redeemed',
        success: false,
        error_message: error.message
      });

      throw error;
    }
  }

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================

  /**
   * Create transaction record
   */
  private async createTransaction(
    transaction: Partial<GiftCertificateTransaction>
  ): Promise<GiftCertificateTransaction> {
    try {
      const { data, error } = await supabase
        .from('gift_certificate_transactions')
        .insert([transaction])
        .select()
        .single();

      if (error) {
        console.error('Failed to create transaction:', error);
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Error in createTransaction:', error);
      throw error;
    }
  }

  /**
   * Get transactions for a gift certificate
   */
  async getTransactions(giftCertificateId: string): Promise<GiftCertificateTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('gift_certificate_transactions')
        .select('*')
        .eq('gift_certificate_id', giftCertificateId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get transactions:', error);
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error('Error in GiftCertificatesService.getTransactions:', error);
      throw error;
    }
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get statistics for organization
   */
  async getStats(organizationId: string): Promise<GiftCertificateStats> {
    try {
      const { data, error } = await supabase
        .from('gift_certificates')
        .select('original_amount, current_balance, status')
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Failed to get stats:', error);
        throw error;
      }

      const certificates = data || [];

      const totalIssued = certificates.length;
      const totalValueIssued = certificates.reduce((sum, cert) => sum + cert.original_amount, 0);
      const activeBalance = certificates
        .filter(cert => cert.status === 'active' || cert.status === 'partially_used')
        .reduce((sum, cert) => sum + cert.current_balance, 0);
      const totalRedeemed = totalValueIssued - certificates.reduce((sum, cert) => sum + cert.current_balance, 0);
      const activeCount = certificates.filter(cert => cert.status === 'active' || cert.status === 'partially_used').length;
      const fullyUsedCount = certificates.filter(cert => cert.status === 'fully_used').length;
      const expiredCount = certificates.filter(cert => cert.status === 'expired').length;
      const avgCertificateValue = totalIssued > 0 ? totalValueIssued / totalIssued : 0;
      const redemptionRate = totalValueIssued > 0 ? (totalRedeemed / totalValueIssued) * 100 : 0;

      return {
        total_issued: totalIssued,
        total_value_issued: totalValueIssued,
        active_count: activeCount,
        active_balance: activeBalance,
        total_redeemed: totalRedeemed,
        fully_used_count: fullyUsedCount,
        expired_count: expiredCount,
        avg_certificate_value: avgCertificateValue,
        redemption_rate: Math.round(redemptionRate)
      };
    } catch (error: any) {
      console.error('Error in GiftCertificatesService.getStats:', error);
      throw error;
    }
  }

  // ============================================================================
  // SETTINGS
  // ============================================================================

  /**
   * Get settings for organization
   */
  async getSettings(organizationId: string): Promise<GiftCertificateSettings | null> {
    try {
      const { data, error } = await supabase
        .from('gift_certificate_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Failed to get settings:', error);
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Error in GiftCertificatesService.getSettings:', error);
      throw error;
    }
  }

  /**
   * Update or create settings
   */
  async upsertSettings(
    organizationId: string,
    settings: Partial<GiftCertificateSettings>
  ): Promise<GiftCertificateSettings> {
    try {
      const { data, error } = await supabase
        .from('gift_certificate_settings')
        .upsert({
          organization_id: organizationId,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to upsert settings:', error);
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Error in GiftCertificatesService.upsertSettings:', error);
      throw error;
    }
  }

  // ============================================================================
  // AUDIT LOG
  // ============================================================================

  /**
   * Log audit entry
   */
  private async logAudit(entry: {
    gift_certificate_id?: string;
    organization_id: string;
    action: string;
    user_id?: string;
    old_values?: any;
    new_values?: any;
    success: boolean;
    error_message?: string;
  }): Promise<void> {
    try {
      await supabase
        .from('gift_certificate_audit_log')
        .insert([{
          ...entry,
          created_at: new Date().toISOString()
        }]);
    } catch (error: any) {
      // Don't throw on audit errors, just log
      console.error('Error logging audit:', error);
    }
  }

  /**
   * Get audit log for gift certificate
   */
  async getAuditLog(giftCertificateId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('gift_certificate_audit_log')
        .select('*')
        .eq('gift_certificate_id', giftCertificateId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get audit log:', error);
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error('Error in GiftCertificatesService.getAuditLog:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const giftCertificatesService = new GiftCertificatesService();
