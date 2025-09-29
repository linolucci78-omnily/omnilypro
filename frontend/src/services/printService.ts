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
      // Initialize ZCS POS SDK printer
      if (typeof window !== 'undefined' && (window as any).ZCSPrinter) {
        const printer = (window as any).ZCSPrinter
        await printer.init()
        this.isInitialized = true
        return true
      }
      throw new Error('ZCS Printer SDK not available')
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
      const printer = (window as any).ZCSPrinter

      // Start print job
      await printer.printStart()

      // Store logo if available
      if (this.printConfig.logoBase64) {
        await printer.printBitmap(this.printConfig.logoBase64, 1) // Center align
      }

      // Store header
      await printer.printText(this.centerText(this.printConfig.storeName), {
        fontSize: this.printConfig.fontSizeLarge,
        bold: true,
        align: 1 // Center
      })

      await printer.printText(this.centerText(this.printConfig.storeAddress), {
        fontSize: this.printConfig.fontSizeNormal,
        align: 1
      })

      await printer.printText(this.centerText(this.printConfig.storePhone), {
        fontSize: this.printConfig.fontSizeNormal,
        align: 1
      })

      if (this.printConfig.storeTax) {
        await printer.printText(this.centerText(`P.IVA: ${this.printConfig.storeTax}`), {
          fontSize: this.printConfig.fontSizeNormal,
          align: 1
        })
      }

      // Separator
      await printer.printText(this.createSeparatorLine())

      // Receipt info
      await printer.printText(`Scontrino: ${receipt.receiptNumber}`, {
        fontSize: this.printConfig.fontSizeNormal,
        bold: true
      })

      await printer.printText(`Data: ${this.formatDateTime(receipt.timestamp)}`)
      await printer.printText(`Cassiere: ${receipt.cashierName}`)

      if (receipt.loyaltyCard) {
        await printer.printText(`Carta: ${receipt.loyaltyCard}`)
      }

      // Separator
      await printer.printText(this.createSeparatorLine())

      // Items
      for (const item of receipt.items) {
        const itemLine = this.formatItemLine(
          item.name,
          item.quantity,
          this.formatPrice(item.total)
        )
        await printer.printText(itemLine)

        if (item.quantity > 1) {
          const priceLine = this.rightAlignText(
            `(${this.formatPrice(item.price)} cad.)`
          )
          await printer.printText(priceLine, {
            fontSize: this.printConfig.fontSizeNormal - 1
          })
        }
      }

      // Separator
      await printer.printText(this.createSeparatorLine())

      // Totals
      await printer.printText(
        `Subtotale:${' '.repeat(22)}${this.formatPrice(receipt.subtotal)}`,
        { align: 2 } // Right align
      )

      if (receipt.tax > 0) {
        await printer.printText(
          `IVA 22%:${' '.repeat(24)}${this.formatPrice(receipt.tax)}`,
          { align: 2 }
        )
      }

      await printer.printText(
        `TOTALE:${' '.repeat(25)}${this.formatPrice(receipt.total)}`,
        {
          fontSize: this.printConfig.fontSizeLarge,
          bold: true,
          align: 2
        }
      )

      // Payment method
      await printer.printText(this.createSeparatorLine())
      await printer.printText(`Pagamento: ${receipt.paymentMethod}`, {
        bold: true
      })

      // Loyalty points if applicable
      if (receipt.customerPoints !== undefined) {
        await printer.printText('')
        await printer.printText(`Punti guadagnati: ${receipt.customerPoints}`, {
          bold: true
        })
      }

      // Footer
      await printer.printText('')
      await printer.printText(this.centerText('Grazie per la visita!'), {
        fontSize: this.printConfig.fontSizeNormal,
        bold: true,
        align: 1
      })

      await printer.printText(this.centerText('Powered by OMNILY PRO'), {
        fontSize: this.printConfig.fontSizeNormal - 1,
        align: 1
      })

      // QR Code for digital receipt (optional)
      const qrData = `RECEIPT:${receipt.receiptNumber}:${receipt.total}`
      await printer.printQRCode(qrData, {
        size: 6,
        align: 1 // Center
      })

      // Feed paper and cut
      await printer.printText('\n\n\n')
      await printer.cutPaper()

      console.log('Receipt printed successfully')
      return true

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
      const printer = (window as any).ZCSPrinter

      await printer.printStart()

      // Header
      await printer.printText(this.centerText('OMNILY PRO'), {
        fontSize: this.printConfig.fontSizeLarge,
        bold: true,
        align: 1
      })

      await printer.printText(this.centerText('CARTA FEDELTÀ'), {
        fontSize: this.printConfig.fontSizeNormal,
        bold: true,
        align: 1
      })

      await printer.printText(this.createSeparatorLine())

      // Customer info
      await printer.printText(`Cliente: ${customerName}`, {
        bold: true
      })

      await printer.printText(`Carta: ${cardNumber}`)
      await printer.printText(`Punti attuali: ${points}`)

      // QR Code with card data
      await printer.printText('')
      const qrData = `LOYALTY:${cardNumber}:${customerName}`
      await printer.printQRCode(qrData, {
        size: 8,
        align: 1
      })

      await printer.printText('')
      await printer.printText(this.centerText(this.printConfig.storeName), {
        align: 1
      })

      await printer.printText('\n\n')
      await printer.cutPaper()

      return true

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
        errors: [error.message || 'Status check failed']
      }
    }
  }
}

export const createPrintService = (config: PrintConfig): ZCSPrintService => {
  return new ZCSPrintService(config)
}

export type { PrintConfig, PrintItem, Receipt }