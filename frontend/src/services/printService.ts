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
        'OMNILY PRO',
        'CARTA FEDELTÀ',
        '----------------------------------------',
        `Cliente: ${customerName}`,
        `Carta: ${cardNumber}`,
        `Punti attuali: ${points}`,
        '',
        this.printConfig.storeName
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
          if (result.success) {
            // Print QR code
            const qrData = `SUB:${data.subscription_code}`

            (window as any).omnilySubQRHandler = (qrResult: any) => {
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
            console.log('✅ Subscription usage receipt printed')
            resolve(true)
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