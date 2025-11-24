import jsPDF from 'jspdf'
import QRCode from 'qrcode'

interface LotteryTicketData {
  eventName: string
  ticketNumber: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  fortuneMessage?: string
  prizeName?: string
  prizeValue?: number
  extractionDate: string
  pricePaid: number
  purchasedByStaff?: string
  createdAt: string
  qrCodeData: string
  organizationName?: string
  organizationLogo?: string
  brandColors?: {
    primary: string
    secondary: string
    accent: string
  }
}

export class LotteryPdfService {
  /**
   * Generate professional lottery ticket PDF
   */
  static async generateTicketPDF(ticketData: LotteryTicketData): Promise<Blob> {
    // Create PDF - A4 format for now, can be customized
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a6' // 105 x 148 mm - perfect ticket size!
    })

    // Colors
    const colors = ticketData.brandColors || {
      primary: '#e74c3c',
      secondary: '#c0392b',
      accent: '#f39c12'
    }

    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 231, g: 76, b: 60 }
    }

    const primaryRgb = hexToRgb(colors.primary)
    const secondaryRgb = hexToRgb(colors.secondary)
    const accentRgb = hexToRgb(colors.accent)

    // Page dimensions
    const pageWidth = 105
    const pageHeight = 148
    const margin = 8

    // Background gradient effect with rectangles
    pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    pdf.rect(0, 0, pageWidth, 30, 'F')

    pdf.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b)
    pdf.rect(0, 30, pageWidth, 15, 'F')

    // Organization Logo (if provided)
    if (ticketData.organizationLogo) {
      try {
        pdf.addImage(ticketData.organizationLogo, 'PNG', margin, margin, 20, 20)
      } catch (err) {
        console.warn('Could not add organization logo:', err)
      }
    }

    // Organization Name
    if (ticketData.organizationName) {
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.text(ticketData.organizationName.toUpperCase(), pageWidth / 2, margin + 5, {
        align: 'center'
      })
    }

    // Title - BIGLIETTO LOTTERIA
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('🎫 BIGLIETTO LOTTERIA', pageWidth / 2, 20, { align: 'center' })

    // Event Name
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    const eventNameLines = pdf.splitTextToSize(ticketData.eventName.toUpperCase(), pageWidth - margin * 2)
    pdf.text(eventNameLines, pageWidth / 2, 35, { align: 'center' })

    // White background for content
    let currentY = 50
    pdf.setFillColor(255, 255, 255)
    pdf.roundedRect(margin, currentY, pageWidth - margin * 2, pageHeight - currentY - margin, 3, 3, 'F')

    // Add decorative border
    pdf.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b)
    pdf.setLineWidth(0.5)
    pdf.roundedRect(margin, currentY, pageWidth - margin * 2, pageHeight - currentY - margin, 3, 3, 'S')

    currentY += 10

    // Ticket Number - BIG and BOLD
    pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text('BIGLIETTO N.', pageWidth / 2, currentY, { align: 'center' })

    currentY += 8

    // Ticket number in box
    pdf.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b)
    pdf.roundedRect(margin + 10, currentY - 6, pageWidth - margin * 2 - 20, 12, 2, 2, 'F')

    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(18)
    pdf.setFont('courier', 'bold')
    pdf.text(ticketData.ticketNumber, pageWidth / 2, currentY, { align: 'center' })

    currentY += 12

    // Prize Info (if exists)
    if (ticketData.prizeName) {
      currentY += 5

      // Prize trophy icon (using emoji/text)
      pdf.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b)
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('🏆 PREMIO IN PALIO', pageWidth / 2, currentY, { align: 'center' })

      currentY += 6

      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      const prizeLines = pdf.splitTextToSize(ticketData.prizeName, pageWidth - margin * 4)
      pdf.text(prizeLines, pageWidth / 2, currentY, { align: 'center' })

      currentY += prizeLines.length * 5

      if (ticketData.prizeValue) {
        pdf.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b)
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.text(`€ ${ticketData.prizeValue.toFixed(2)}`, pageWidth / 2, currentY, { align: 'center' })
        currentY += 6
      }
    }

    // Divider line
    currentY += 2
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.3)
    pdf.line(margin + 5, currentY, pageWidth - margin - 5, currentY)
    currentY += 5

    // Customer Info
    pdf.setTextColor(50, 50, 50)
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')

    pdf.text('Cliente:', margin + 5, currentY)
    pdf.setFont('helvetica', 'bold')
    const nameLines = pdf.splitTextToSize(ticketData.customerName, pageWidth - margin * 3)
    pdf.text(nameLines, margin + 5, currentY + 4)
    currentY += 4 + (nameLines.length * 4)

    if (ticketData.customerPhone) {
      pdf.setFont('helvetica', 'normal')
      pdf.text(`📞 ${ticketData.customerPhone}`, margin + 5, currentY)
      currentY += 4
    }

    // Fortune Message
    if (ticketData.fortuneMessage) {
      currentY += 3

      // Box with fortune
      pdf.setFillColor(255, 250, 240)
      pdf.roundedRect(margin + 3, currentY - 3, pageWidth - margin * 2 - 6, 12, 2, 2, 'F')

      pdf.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b)
      pdf.setLineWidth(0.3)
      pdf.roundedRect(margin + 3, currentY - 3, pageWidth - margin * 2 - 6, 12, 2, 2, 'S')

      pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      const fortuneLines = pdf.splitTextToSize(`"${ticketData.fortuneMessage}"`, pageWidth - margin * 3)
      pdf.text(fortuneLines, pageWidth / 2, currentY, { align: 'center' })

      currentY += 12
    }

    // Divider
    currentY += 3
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.3)
    pdf.line(margin + 5, currentY, pageWidth - margin - 5, currentY)
    currentY += 5

    // Extraction Date
    pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.text('📅 ESTRAZIONE', pageWidth / 2, currentY, { align: 'center' })

    currentY += 5

    const extractionDate = new Date(ticketData.extractionDate)
    const extractionStr = extractionDate.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.text(extractionStr, pageWidth / 2, currentY, { align: 'center' })

    // QR Code - Generate and add
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(ticketData.qrCodeData, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      const qrSize = 25
      const qrX = (pageWidth - qrSize) / 2
      const qrY = pageHeight - margin - qrSize - 10

      pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)

      // QR Code label
      pdf.setTextColor(100, 100, 100)
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Scansiona per verificare', pageWidth / 2, qrY + qrSize + 4, { align: 'center' })
    } catch (err) {
      console.error('Error generating QR code:', err)
    }

    // Footer - Purchase info
    pdf.setTextColor(120, 120, 120)
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    const createdDate = new Date(ticketData.createdAt)
    const createdStr = createdDate.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    pdf.text(`Acquistato: ${createdStr}`, pageWidth / 2, pageHeight - margin - 2, { align: 'center' })

    // Return PDF as Blob
    return pdf.output('blob')
  }

  /**
   * Download PDF ticket
   */
  static async downloadTicket(ticketData: LotteryTicketData, filename?: string): Promise<void> {
    const pdfBlob = await this.generateTicketPDF(ticketData)
    const url = URL.createObjectURL(pdfBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename || `biglietto-${ticketData.ticketNumber}.pdf`
    link.click()

    URL.revokeObjectURL(url)
  }

  /**
   * Open PDF in new tab (for preview)
   */
  static async previewTicket(ticketData: LotteryTicketData): Promise<void> {
    const pdfBlob = await this.generateTicketPDF(ticketData)
    const url = URL.createObjectURL(pdfBlob)
    window.open(url, '_blank')
  }
}
