interface ReceiptLayoutSettings {
  line_spacing: number
  section_spacing: number
  header_alignment: 'left' | 'center' | 'right'
  items_alignment: 'left' | 'center' | 'right'
  footer_alignment: 'left' | 'center' | 'right'
  font_size_small: number
  font_size_normal: number
  font_size_large: number
  show_logo: boolean
  logo_url: string | null
  logo_size: 'small' | 'medium' | 'large'
  logo_alignment: 'left' | 'center' | 'right'
  show_qr_code: boolean
  qr_alignment: 'left' | 'center' | 'right'
  show_separator_lines: boolean
  show_thank_you_message: boolean
  thank_you_message: string
  paper_width: number
  font_family: 'courier' | 'monospace' | 'sans-serif'
  header_text: string
  show_store_info: boolean
  qr_size: 'small' | 'medium' | 'large'
  bold_totals: boolean
}

interface PrintConfig {
  storeName: string
  storeAddress: string
  storePhone: string
  storeTax: string
  logoBase64?: string
  paperWidth: number // 58mm = 384 dots
  fontSizeNormal: number
  fontSizeLarge: number
  printDensity: number
  layoutSettings?: ReceiptLayoutSettings
}

interface PrintItem {
  name: string
  quantity: number
  price: number
  total: number
}

interface Receipt {
  receiptNumber: string
  timestamp: Date
  items: PrintItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  cashierName: string
  customerPoints?: number
  loyaltyCard?: string
}

export class ZCSPrintService {
  private printConfig: PrintConfig
  private isInitialized: boolean = false

  constructor(config: PrintConfig) {
    this.printConfig = config
  }

  // Load receipt layout settings from database
  static async loadLayoutSettings(organizationId: string): Promise<ReceiptLayoutSettings | null> {
    try {
      const { supabase } = await import('../lib/supabase')
      const { data, error } = await supabase
        .from('receipt_layout_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

      if (error || !data) {
        console.log('No custom layout settings found, using defaults')
        return null
      }

      return {
        line_spacing: data.line_spacing || 1,
        section_spacing: data.section_spacing || 1,
        header_alignment: data.header_alignment || 'center',
        items_alignment: data.items_alignment || 'left',
        footer_alignment: data.footer_alignment || 'center',
        font_size_small: data.font_size_small || 20,
        font_size_normal: data.font_size_normal || 24,
        font_size_large: data.font_size_large || 30,
        show_logo: data.show_logo || false,
        logo_url: data.logo_url,
        logo_size: data.logo_size || 'medium',
        logo_alignment: data.logo_alignment || 'center',
        show_qr_code: data.show_qr_code !== false,
        qr_alignment: data.qr_alignment || 'center',
        show_separator_lines: data.show_separator_lines !== false,
        show_thank_you_message: data.show_thank_you_message !== false,
        thank_you_message: data.thank_you_message || 'Grazie per la visita!',
        paper_width: data.paper_width || 384,
        font_family: data.font_family || 'courier',
        header_text: data.header_text || 'SCONTRINO FISCALE',
        show_store_info: data.show_store_info !== false,
        qr_size: data.qr_size || 'medium',
        bold_totals: data.bold_totals !== false
      }
    } catch (error) {
      console.error('Error loading layout settings:', error)
      return null
    }
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('🔍 CONTROLLO BRIDGE ANDROID - v2.0...')
      console.log('🔧 window.OmnilyPOS esiste?', typeof window !== 'undefined' && !!(window as any).OmnilyPOS)
      console.log('🔑 window keys:', typeof window !== 'undefined' ? Object.keys(window).filter(k => k.toLowerCase().includes('omni') || k.toLowerCase().includes('pos') || k.toLowerCase().includes('android')) : [])

      // Check if Android bridge is available
      if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
        console.log('Bridge trovato, chiamo initPrinter...')
        // Initialize printer via Android bridge
        return new Promise((resolve) => {
          (window as any).omnilyPrinterInitHandler = (result: any) => {
            console.log('Risposta da initPrinter:', result)
            if (result.success) {
              this.isInitialized = true
              resolve(true)
            } else {
              console.error('Printer initialization failed:', result.error)
              this.isInitialized = false
              resolve(false)
            }
          }

          (window as any).OmnilyPOS.initPrinter('omnilyPrinterInitHandler')
        })
      }
      console.error('Bridge NON trovato!')
      throw new Error('Android POS bridge not available')
    } catch (error) {
      console.error('Failed to initialize printer:', error)
      this.isInitialized = false
      return false
    }
  }

  private formatPrice(amount: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  private createSeparatorLine(): string {
    return '----------------------------------------'
  }

  private centerText(text: string, width: number = 40): string {
    const padding = Math.max(0, width - text.length)
    const leftPad = Math.floor(padding / 2)
    return ' '.repeat(leftPad) + text
  }

  private rightAlignText(text: string, width: number = 40): string {
    const padding = Math.max(0, width - text.length)
    return ' '.repeat(padding) + text
  }

  private formatItemLine(name: string, qty: number, price: string): string {
    const qtyStr = `${qty}x`
    const maxNameLength = 40 - qtyStr.length - price.length - 2
    const truncatedName = name.length > maxNameLength
      ? name.substring(0, maxNameLength - 3) + '...'
      : name

    const padding = 40 - qtyStr.length - truncatedName.length - price.length
    return `${qtyStr} ${truncatedName}${' '.repeat(Math.max(1, padding))}${price}`
  }

  async printReceipt(receipt: Receipt): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('Printer not initialized')
      return false
    }

    try {
      // Prepare receipt data for Android bridge
      const receiptData = {
        storeName: this.printConfig.storeName,
        storeAddress: this.printConfig.storeAddress,
        storePhone: this.printConfig.storePhone,
        storeTax: this.printConfig.storeTax,
        logoBase64: this.printConfig.logoBase64, // Include logo
        receiptNumber: receipt.receiptNumber,
        timestamp: this.formatDateTime(receipt.timestamp),
        cashier: receipt.cashierName,
        items: receipt.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })),
        subtotal: receipt.subtotal,
        tax: receipt.tax,
        total: receipt.total,
        paymentMethod: receipt.paymentMethod,
        qrData: `RECEIPT:${receipt.receiptNumber}:${receipt.total}`
      }

      return new Promise((resolve) => {
        (window as any).omnilyReceiptPrintHandler = (result: any) => {
          if (result.success) {
            console.log('Receipt printed successfully via Android bridge')
            resolve(true)
          } else {
            console.error('Receipt print failed:', result.error)
            resolve(false)
          }
        }

        (window as any).OmnilyPOS.printReceipt(
          JSON.stringify(receiptData),
          'omnilyReceiptPrintHandler'
        )
      })

    } catch (error) {
      console.error('Print error:', error)
      return false
    }
  }

  async printTestReceipt(): Promise<boolean> {
    const testReceipt: Receipt = {
      receiptNumber: 'TEST-001',
      timestamp: new Date(),
      items: [
        {
          name: 'Caffè Espresso',
          quantity: 2,
          price: 1.50,
          total: 3.00
        },
        {
          name: 'Cornetto alla Crema',
          quantity: 1,
          price: 2.50,
          total: 2.50
        }
      ],
      subtotal: 5.50,
      tax: 1.21,
      total: 6.71,
      paymentMethod: 'Contanti',
      cashierName: 'Test User',
      customerPoints: 6
    }

    return this.printReceipt(testReceipt)
  }

  async printLoyaltyCard(customerName: string, cardNumber: string, points: number): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('Printer not initialized')
      return false
    }

    try {
      // Print header text
      const lines: string[] = [
        this.printConfig.storeName,
        'CARTA FEDELTÀ',
        '----------------------------------------',
        `Cliente: ${customerName}`,
        `Carta: ${cardNumber}`,
        `Punti attuali: ${points}`,
        ''
      ]
      const headerText = lines.join('\n')

      return new Promise((resolve) => {
        (window as any).omnilyTextPrintHandler = (result: any) => {
          if (result.success) {
            // Print QR code after text
            const qrData = 'LOYALTY:' + cardNumber + ':' + customerName;

            (window as any).omnilyQRPrintHandler = (qrResult: any) => {
              if (qrResult.success) {
                console.log('Loyalty card printed successfully')
                resolve(true)
              } else {
                console.error('QR code print failed:', qrResult.error)
                resolve(false)
              }
            }

            (window as any).OmnilyPOS.printQRCode(qrData, 'omnilyQRPrintHandler')
          } else {
            console.error('Header text print failed:', result.error)
            resolve(false)
          }
        }

        (window as any).OmnilyPOS.printText(headerText, 'omnilyTextPrintHandler')
      })

    } catch (error) {
      console.error('Loyalty card print error:', error)
      return false
    }
  }

  async checkPrinterStatus(): Promise<{
    isOnline: boolean
    paperStatus: string
    temperature: string
    errors: string[]
  }> {
    if (!this.isInitialized) {
      return {
        isOnline: false,
        paperStatus: 'Unknown',
        temperature: 'Unknown',
        errors: ['Printer not initialized']
      }
    }

    try {
      const printer = (window as any).ZCSPrinter
      const status = await printer.getStatus()

      return {
        isOnline: status.isOnline || false,
        paperStatus: status.paperStatus || 'Unknown',
        temperature: status.temperature || 'Normal',
        errors: status.errors || []
      }

    } catch (error) {
      return {
        isOnline: false,
        paperStatus: 'Error',
        temperature: 'Unknown',
        errors: [error instanceof Error ? error.message : 'Status check failed']
      }
    }
  }

  /**
   * Print Gift Certificate voucher
   */
  async printGiftCertificate(data: {
    code: string
    amount: number
    currentBalance?: number
    recipientName?: string
    recipientEmail?: string
    validUntil?: string
    personalMessage?: string
    issuedAt: string
    organizationName: string
  }): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('Printer not initialized')
      return false
    }

    try {
      const lines: string[] = [
        '',
        this.centerText('🎁 GIFT CERTIFICATE 🎁'),
        this.centerText(data.organizationName),
        this.createSeparatorLine(),
        '',
        this.centerText('VALIDAZIONE BUONO REGALO'),
        '',
        this.createSeparatorLine(),
        '',
        `Codice: ${data.code}`,
        `Emesso il: ${this.formatDateTime(new Date(data.issuedAt))}`,
      ]

      if (data.validUntil) {
        lines.push(`Valido fino: ${this.formatDateTime(new Date(data.validUntil))}`)
      }

      if (data.recipientName) {
        lines.push('')
        lines.push(`Beneficiario: ${data.recipientName}`)
      }

      if (data.recipientEmail) {
        lines.push(`Email: ${data.recipientEmail}`)
      }

      if (data.personalMessage) {
        lines.push('')
        lines.push('Messaggio:')
        lines.push(data.personalMessage)
      }

      // Add balance information
      lines.push('')
      lines.push(this.createSeparatorLine())
      lines.push(this.centerText('SALDO GIFT CERTIFICATE'))
      lines.push(this.createSeparatorLine())
      lines.push('')
      lines.push(`Valore originale: ${this.formatPrice(data.amount)}`)

      if (data.currentBalance !== undefined) {
        lines.push(`SALDO DISPONIBILE: ${this.formatPrice(data.currentBalance)}`)

        if (data.currentBalance === 0) {
          lines.push('')
          lines.push(this.centerText('✓ Completamente utilizzato'))
        } else if (data.currentBalance < data.amount) {
          const usedAmount = data.amount - data.currentBalance
          lines.push(`Già utilizzato: ${this.formatPrice(usedAmount)}`)
        }
      } else {
        lines.push(`SALDO DISPONIBILE: ${this.formatPrice(data.amount)}`)
      }

      lines.push('')
      lines.push(this.createSeparatorLine())
      lines.push(this.centerText('Presenta questo voucher'))
      lines.push(this.centerText('per utilizzare il buono'))
      lines.push('')

      const headerText = lines.join('\n')

      return new Promise((resolve) => {
        (window as any).omnilyGiftCertPrintHandler = (result: any) => {
          if (result.success) {
            // Print QR code after text
            const qrData = `GIFTCERT:${data.code}:${data.amount}`;

            (window as any).omnilyGiftQRPrintHandler = (qrResult: any) => {
              if (qrResult.success) {
                console.log('Gift certificate printed successfully')
                resolve(true)
              } else {
                console.error('QR code print failed:', qrResult.error)
                resolve(false)
              }
            }

            (window as any).OmnilyPOS.printQRCode(qrData, 'omnilyGiftQRPrintHandler')
          } else {
            console.error('Gift certificate text print failed:', result.error)
            resolve(false)
          }
        }

        (window as any).OmnilyPOS.printText(headerText, 'omnilyGiftCertPrintHandler')
      })

    } catch (error) {
      console.error('Gift certificate print error:', error)
      return false
    }
  }

  /**
   * Print Gift Certificate redemption receipt
   */
  async printGiftCertificateRedemption(data: {
    code: string
    amountRedeemed: number
    balanceBefore: number
    balanceAfter: number
    cashierName: string
    timestamp: Date
    organizationName: string
  }): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('Printer not initialized')
      return false
    }

    try {
      // Use printText() instead of printReceipt() to ensure balance info is printed
      // (similar to printGiftCertificate which works correctly)
      const lines: string[] = [
        '',
        this.centerText('🎁 RISCATTO GIFT CERTIFICATE 🎁'),
        this.centerText(data.organizationName),
        this.createSeparatorLine(),
        '',
        `Ricevuta: GC-${data.code}`,
        `Data: ${this.formatDateTime(data.timestamp)}`,
        `Cassiere: ${data.cashierName}`,
        '',
        this.createSeparatorLine(),
        `Codice GC: ${data.code}`,
        this.createSeparatorLine(),
        '',
        'IMPORTO RISCATTATO',
        `€${this.formatPrice(data.amountRedeemed)}`,
        '',
        this.createSeparatorLine(),
        this.centerText('RIEPILOGO GIFT CERTIFICATE'),
        this.createSeparatorLine(),
        '',
        `Saldo prima:          €${this.formatPrice(data.balanceBefore)}`,
        `Importo riscattato:  -€${this.formatPrice(data.amountRedeemed)}`,
        this.createSeparatorLine(),
        `SALDO RESIDUO:        €${this.formatPrice(data.balanceAfter)}`,
        this.createSeparatorLine(),
        '',
        data.balanceAfter > 0
          ? this.centerText('✓ Saldo rimanente utilizzabile')
          : this.centerText('✓ Gift Certificate completamente utilizzato'),
        '',
        this.centerText('Grazie!'),
        ''
      ];

      const receiptText = lines.join('\n');

      console.log('🖨️ Gift Certificate Redemption Receipt Data:', {
        code: data.code,
        amountRedeemed: data.amountRedeemed,
        balanceBefore: data.balanceBefore,
        balanceAfter: data.balanceAfter,
        textLength: receiptText.length
      });

      return new Promise((resolve) => {
        (window as any).omnilyGCRedeemPrintHandler = (result: any) => {
          if (result.success) {
            console.log('✅ GC redemption receipt printed successfully')
            resolve(true)
          } else {
            console.error('❌ GC redemption receipt print failed:', result.error)
            resolve(false)
          }
        }

        (window as any).OmnilyPOS.printText(
          receiptText,
          'omnilyGCRedeemPrintHandler'
        )
      })

    } catch (error) {
      console.error('GC redemption print error:', error)
      return false
    }
  }

  /**
   * Print subscription voucher/card
   */
  async printSubscriptionVoucher(data: {
    subscription_code: string
    customer_name: string
    template_name: string
    start_date: string
    end_date: string
    daily_limit?: number
    total_limit?: number
    organizationName: string
  }): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('❌ Printer not initialized')
      return false
    }

    try {
      const lines: string[] = [
        '',
        this.centerText('🎫 ABBONAMENTO 🎫'),
        this.centerText(data.organizationName),
        this.createSeparatorLine(),
        '',
        `Codice: ${data.subscription_code}`,
        `Cliente: ${data.customer_name}`,
        `Abbonamento: ${data.template_name}`,
        '',
        this.createSeparatorLine(),
        `Valido da: ${this.formatDateTime(new Date(data.start_date))}`,
        `Valido fino: ${this.formatDateTime(new Date(data.end_date))}`,
        ''
      ]

      if (data.daily_limit) {
        lines.push(`Limite giornaliero: ${data.daily_limit} utilizzi`)
      }

      if (data.total_limit) {
        lines.push(`Limite totale: ${data.total_limit} utilizzi`)
      }

      lines.push('')
      lines.push(this.createSeparatorLine())
      lines.push(this.centerText('Presenta questo voucher'))
      lines.push(this.centerText('per utilizzare l\'abbonamento'))
      lines.push('')

      const headerText = lines.join('\n')

      return new Promise((resolve) => {
        (window as any).omnilySubPrintHandler = (result: any) => {
          console.log('📝 omnilySubPrintHandler called with:', result);
          console.log('📝 data object:', data);
          console.log('📝 data.subscription_code:', data.subscription_code);

          if (result.success) {
            // Print QR code
            const subscriptionCode = String(data.subscription_code);
            const qrData = `SUB:${subscriptionCode}`;

            console.log('📝 About to print QR with data:', qrData);

            (window as any).omnilySubQRHandler = (qrResult: any) => {
              console.log('📝 omnilySubQRHandler called with:', qrResult);
              if (qrResult.success) {
                console.log('✅ Subscription voucher printed successfully')
                resolve(true)
              } else {
                console.error('❌ QR code print failed:', qrResult.error)
                resolve(false)
              }
            }

            (window as any).OmnilyPOS.printQRCode(qrData, 'omnilySubQRHandler')
          } else {
            console.error('❌ Subscription voucher print failed:', result.error)
            resolve(false)
          }
        }

        (window as any).OmnilyPOS.printText(headerText, 'omnilySubPrintHandler')
      })
    } catch (error) {
      console.error('Subscription voucher print error:', error)
      return false
    }
  }

  /**
   * Print referral code voucher
   */
  async printReferralCode(data: {
    referral_code: string
    customer_name: string
    customer_email?: string
    total_referrals: number
    successful_referrals: number
    total_points_earned: number
    organizationName: string
    referralUrl?: string
  }): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('❌ Printer not initialized')
      return false
    }

    try {
      const lines: string[] = [
        '',
        this.centerText('🎁 CODICE REFERRAL 🎁'),
        this.centerText(data.organizationName),
        this.createSeparatorLine(),
        '',
        this.centerText('INVITA I TUOI AMICI!'),
        this.centerText('Ottieni vantaggi esclusivi'),
        '',
        this.createSeparatorLine(),
        '',
        `Cliente: ${data.customer_name}`,
      ]

      if (data.customer_email) {
        lines.push(`Email: ${data.customer_email}`)
      }

      lines.push('')
      lines.push(this.createSeparatorLine())
      lines.push(this.centerText('IL TUO CODICE PERSONALE'))
      lines.push(this.createSeparatorLine())
      lines.push('')
      lines.push(this.centerText(data.referral_code))
      lines.push('')
      lines.push(this.createSeparatorLine())
      lines.push(this.centerText('LE TUE STATISTICHE'))
      lines.push(this.createSeparatorLine())
      lines.push('')
      lines.push(`Amici invitati: ${data.total_referrals}`)
      lines.push(`Registrazioni riuscite: ${data.successful_referrals}`)
      lines.push(`Punti guadagnati: ${data.total_points_earned}`)

      if (data.referralUrl) {
        lines.push('')
        lines.push(this.createSeparatorLine())
        lines.push('Link di registrazione:')
        lines.push(data.referralUrl)
      }

      lines.push('')
      lines.push(this.createSeparatorLine())
      lines.push(this.centerText('Condividi il QR code o il'))
      lines.push(this.centerText('codice con i tuoi amici!'))
      lines.push('')

      const headerText = lines.join('\n')

      return new Promise((resolve) => {
        (window as any).omnilyReferralPrintHandler = (result: any) => {
          if (result.success) {
            // Print QR code with referral code
            const qrData = data.referralUrl || `REFERRAL:${data.referral_code}:${data.customer_name}`;

            (window as any).omnilyReferralQRHandler = (qrResult: any) => {
              if (qrResult.success) {
                console.log('✅ Referral code printed successfully')
                resolve(true)
              } else {
                console.error('❌ QR code print failed:', qrResult.error)
                resolve(false)
              }
            }

            (window as any).OmnilyPOS.printQRCode(qrData, 'omnilyReferralQRHandler')
          } else {
            console.error('❌ Referral code print failed:', result.error)
            resolve(false)
          }
        }

        (window as any).OmnilyPOS.printText(headerText, 'omnilyReferralPrintHandler')
      })
    } catch (error) {
      console.error('Referral code print error:', error)
      return false
    }
  }

  /**
   * Print receipt with optimized compact layout (like referral voucher)
   */
  async printReceiptOptimized(receipt: Receipt): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('❌ Printer not initialized')
      return false
    }

    try {
      const layout = this.printConfig.layoutSettings
      const lines: string[] = []

      // Helper functions for alignment
      const alignText = (text: string, alignment: 'left' | 'center' | 'right' = 'center') => {
        switch (alignment) {
          case 'left': return text
          case 'right': return text.padStart(40, ' ')
          case 'center': return this.centerText(text)
        }
      }

      const addLineSpacing = () => {
        const spacing = layout?.line_spacing || 0
        for (let i = 0; i < spacing; i++) {
          lines.push('')
        }
      }

      const addSectionSpacing = () => {
        const spacing = layout?.section_spacing || 0
        for (let i = 0; i < spacing; i++) {
          lines.push('')
        }
      }

      const addSeparator = () => {
        if (layout?.show_separator_lines !== false) {
          lines.push(this.createSeparatorLine())
        }
      }

      // Header
      lines.push('')
      addSectionSpacing()
      lines.push(alignText(this.printConfig.storeName, layout?.header_alignment || 'center'))
      addLineSpacing()
      lines.push(alignText(layout?.header_text || 'SCONTRINO FISCALE', layout?.header_alignment || 'center'))
      addSectionSpacing()
      addSeparator()
      addSectionSpacing()

      // Receipt Info
      lines.push(alignText(`N. ${receipt.receiptNumber}`, 'left'))
      addLineSpacing()
      lines.push(alignText(`Data: ${this.formatDateTime(receipt.timestamp)}`, 'left'))
      addLineSpacing()
      lines.push(alignText(`Operatore: ${receipt.cashierName}`, 'left'))
      addSectionSpacing()

      addSeparator()
      addSectionSpacing()
      lines.push(alignText('ARTICOLI', layout?.items_alignment || 'center'))
      addSeparator()
      addSectionSpacing()

      // Items
      receipt.items.forEach((item, index) => {
        const itemName = item.name.substring(0, 22)
        const qty = `${item.quantity}x`
        const price = `€${item.total.toFixed(2)}`
        const padding = 32 - qty.length - itemName.length - price.length
        const itemLine = `${qty} ${itemName}${' '.repeat(Math.max(1, padding))}${price}`

        lines.push(alignText(itemLine, layout?.items_alignment || 'left'))
        if (index < receipt.items.length - 1) {
          addLineSpacing()
        }
      })

      addSectionSpacing()
      addSeparator()
      addSectionSpacing()

      // Totals
      lines.push(alignText(`Subtotale:${' '.repeat(21)}€${receipt.subtotal.toFixed(2)}`, 'left'))
      addLineSpacing()
      lines.push(alignText(`IVA (22%):${' '.repeat(21)}€${receipt.tax.toFixed(2)}`, 'left'))
      addLineSpacing()
      addSeparator()
      const totalLine = `TOTALE:${' '.repeat(24)}€${receipt.total.toFixed(2)}`
      lines.push(alignText(totalLine, 'left'))
      addSeparator()
      addSectionSpacing()
      lines.push(alignText(`Pagamento: ${receipt.paymentMethod}`, 'left'))

      // Loyalty points
      if (receipt.customerPoints) {
        addSectionSpacing()
        addSeparator()
        addSectionSpacing()
        lines.push(alignText('PUNTI FEDELTÀ', layout?.footer_alignment || 'center'))
        addLineSpacing()
        lines.push(alignText(`Punti guadagnati: ${receipt.customerPoints}`, layout?.footer_alignment || 'center'))
      }

      // Thank you message
      if (layout?.show_thank_you_message !== false) {
        addSectionSpacing()
        addSeparator()
        addSectionSpacing()
        const thankYouMsg = layout?.thank_you_message || 'Grazie per la visita!'
        lines.push(alignText(thankYouMsg, layout?.footer_alignment || 'center'))
        addLineSpacing()
        lines.push(alignText('Arrivederci', layout?.footer_alignment || 'center'))
      }

      addSectionSpacing()
      lines.push('')

      const receiptText = lines.join('\n')

      return new Promise((resolve) => {
        (window as any).omnilyReceiptOptimizedHandler = (result: any) => {
          if (result.success) {
            // Print QR code if enabled
            if (layout?.show_qr_code !== false) {
              const qrData = `RECEIPT:${receipt.receiptNumber}:${receipt.total}`;

              (window as any).omnilyReceiptQRHandler = (qrResult: any) => {
                if (qrResult.success) {
                  console.log('✅ Receipt printed successfully (optimized)')
                  resolve(true)
                } else {
                  console.error('❌ Receipt QR code print failed:', qrResult.error)
                  resolve(false)
                }
              }

              (window as any).OmnilyPOS.printQRCode(qrData, 'omnilyReceiptQRHandler')
            } else {
              console.log('✅ Receipt printed successfully (no QR)')
              resolve(true)
            }
          } else {
            console.error('❌ Receipt print failed:', result.error)
            resolve(false)
          }
        }

        (window as any).OmnilyPOS.printText(receiptText, 'omnilyReceiptOptimizedHandler')
      })
    } catch (error) {
      console.error('Receipt print error:', error)
      return false
    }
  }

  /**
   * Print subscription usage receipt
   */
  async printSubscriptionUsage(data: {
    subscription_code: string
    customer_name: string
    template_name: string
    item_name: string
    remaining_daily?: number
    remaining_total?: number
    cashier: string
    organizationName: string
  }): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('❌ Printer not initialized')
      return false
    }

    try {
      const lines: string[] = [
        '',
        this.centerText('UTILIZZO ABBONAMENTO'),
        this.centerText(data.organizationName),
        this.createSeparatorLine(),
        '',
        `Ricevuta: ${Date.now()}`,
        `Data: ${this.formatDateTime(new Date())}`,
        `Cassiere: ${data.cashier}`,
        '',
        this.createSeparatorLine(),
        `Codice: ${data.subscription_code}`,
        `Cliente: ${data.customer_name}`,
        `Abbonamento: ${data.template_name}`,
        '',
        this.createSeparatorLine(),
        'ARTICOLO UTILIZZATO',
        `${data.item_name}`,
        '',
        this.createSeparatorLine()
      ]

      if (data.remaining_daily !== undefined) {
        lines.push(`Utilizzi rimanenti oggi: ${data.remaining_daily}`)
      }

      if (data.remaining_total !== undefined) {
        lines.push(`Utilizzi rimanenti totali: ${data.remaining_total}`)
      }

      lines.push('')
      lines.push(this.centerText('Grazie!'))
      lines.push('')

      const receiptText = lines.join('\n')

      return new Promise((resolve) => {
        (window as any).omnilySubUsagePrintHandler = (result: any) => {
          if (result.success) {
            // Print QR code after text
            const qrData = `SUB:${data.subscription_code}`

            (window as any).omnilySubUsageQRHandler = (qrResult: any) => {
              if (qrResult.success) {
                console.log('✅ Subscription usage receipt printed with QR code')
                resolve(true)
              } else {
                console.error('❌ QR code print failed:', qrResult.error)
                resolve(false)
              }
            }

            (window as any).OmnilyPOS.printQRCode(qrData, 'omnilySubUsageQRHandler')
          } else {
            console.error('❌ Receipt print failed:', result.error)
            resolve(false)
          }
        }

        (window as any).OmnilyPOS.printText(receiptText, 'omnilySubUsagePrintHandler')
      })
    } catch (error) {
      console.error('Subscription usage print error:', error)
      return false
    }
  }
}

export const createPrintService = (config: PrintConfig): ZCSPrintService => {
  return new ZCSPrintService(config)
}

export type { PrintConfig, PrintItem, Receipt }