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
      // Check if Android bridge is available
      if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
        // Initialize printer via Android bridge
        return new Promise((resolve) => {
          (window as any).omnilyPrinterInitHandler = (result: any) => {
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
      const headerText = `
        OMNILY PRO
        CARTA FEDELTÀ
        ----------------------------------------
        Cliente: ${customerName}
        Carta: ${cardNumber}
        Punti attuali: ${points}

        ${this.printConfig.storeName}
      `

      return new Promise((resolve) => {
        (window as any).omnilyTextPrintHandler = (result: any) => {
          if (result.success) {
            // Print QR code after text
            const qrData = `LOYALTY:${cardNumber}:${customerName}`

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
        errors: [error.message || 'Status check failed']
      }
    }
  }
}

export const createPrintService = (config: PrintConfig): ZCSPrintService => {
  return new ZCSPrintService(config)
}

export type { PrintConfig, PrintItem, Receipt }