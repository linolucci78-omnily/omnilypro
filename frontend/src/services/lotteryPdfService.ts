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
  organizationAddress?: string
  organizationPhone?: string
  organizationEmail?: string
  organizationVAT?: string
  organizationWebsite?: string
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
    // Create PDF - Receipt format (58mm x ~200mm) - perfect for mobile and thermal printers!
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [58, 200] // 58mm width (thermal printer), 200mm height
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

    // Page dimensions - Receipt format
    const pageWidth = 58
    const pageHeight = 200
    const margin = 4

    // Classic header with organization info
    let headerY = margin + 3

    // Organization Logo (if provided) - centered
    if (ticketData.organizationLogo) {
      try {
        const logoSize = 16
        const logoX = (pageWidth - logoSize) / 2
        pdf.addImage(ticketData.organizationLogo, 'PNG', logoX, headerY, logoSize, logoSize)
        headerY += logoSize + 3
      } catch (err) {
        console.warn('Could not add organization logo:', err)
      }
    }

    // Organization Name - classic serif font
    if (ticketData.organizationName) {
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(8)
      pdf.setFont('times', 'bold')
      const orgLines = pdf.splitTextToSize(ticketData.organizationName.toUpperCase(), pageWidth - margin * 2)
      orgLines.forEach(line => {
        pdf.text(line, pageWidth / 2, headerY, { align: 'center' })
        headerY += 3.5
      })
      headerY += 2
    }

    // Decorative line separator
    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.8)
    pdf.line(margin + 6, headerY, pageWidth - margin - 6, headerY)
    headerY += 1
    pdf.setLineWidth(0.3)
    pdf.line(margin + 6, headerY, pageWidth - margin - 6, headerY)
    headerY += 5

    // Title - BIGLIETTO LOTTERIA (classic style)
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(10)
    pdf.setFont('times', 'bold')
    pdf.text('BIGLIETTO LOTTERIA', pageWidth / 2, headerY, { align: 'center' })
    headerY += 5

    // Event Name - classic style
    pdf.setFontSize(8)
    pdf.setFont('times', 'bold')
    const eventNameLines = pdf.splitTextToSize(ticketData.eventName.toUpperCase(), pageWidth - margin * 2)
    eventNameLines.forEach(line => {
      pdf.text(line, pageWidth / 2, headerY, { align: 'center' })
      headerY += 3.5
    })

    // Bottom decorative line
    headerY += 2
    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.8)
    pdf.line(margin + 6, headerY, pageWidth - margin - 6, headerY)
    headerY += 1
    pdf.setLineWidth(0.3)
    pdf.line(margin + 6, headerY, pageWidth - margin - 6, headerY)

    headerY += 5

    // White background for content - starts after dynamic header
    let currentY = headerY
    pdf.setFillColor(255, 255, 255)
    pdf.rect(margin, currentY, pageWidth - margin * 2, pageHeight - currentY - margin, 'F')

    // Simple classic border - single line
    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.8)
    pdf.rect(margin, currentY, pageWidth - margin * 2, pageHeight - currentY - margin, 'S')

    // Inner border for classic double-frame effect
    pdf.setLineWidth(0.3)
    pdf.rect(margin + 1.5, currentY + 1.5, pageWidth - margin * 2 - 3, pageHeight - currentY - margin - 3, 'S')

    currentY += 8

    // Ticket Number - Classic Italian lottery style
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(7)
    pdf.setFont('times', 'normal')
    pdf.text('N.', pageWidth / 2, currentY, { align: 'center' })

    currentY += 6

    // Ticket number - VERY LARGE with classic serif font
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(20)
    pdf.setFont('times', 'bold')
    pdf.text(ticketData.ticketNumber, pageWidth / 2, currentY, { align: 'center' })

    currentY += 3

    // Classic underline
    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.5)
    pdf.line(margin + 8, currentY, pageWidth - margin - 8, currentY)

    currentY += 8

    // Prize Info (if exists) - Classic style
    if (ticketData.prizeName) {
      // Prize label
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(7)
      pdf.setFont('times', 'normal')
      pdf.text('PREMIO', pageWidth / 2, currentY, { align: 'center' })

      currentY += 5

      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(9)
      pdf.setFont('times', 'bold')
      const prizeLines = pdf.splitTextToSize(ticketData.prizeName, pageWidth - margin * 2 - 8)
      prizeLines.forEach(line => {
        pdf.text(line, pageWidth / 2, currentY, { align: 'center' })
        currentY += 4
      })

      if (ticketData.prizeValue) {
        currentY += 1
        pdf.setFontSize(12)
        pdf.setFont('times', 'bold')
        pdf.text(`€ ${ticketData.prizeValue.toFixed(2)}`, pageWidth / 2, currentY, { align: 'center' })
        currentY += 2
      }

      // Separator line
      currentY += 3
      pdf.setDrawColor(0, 0, 0)
      pdf.setLineWidth(0.3)
      pdf.line(margin + 8, currentY, pageWidth - margin - 8, currentY)
      currentY += 5
    }

    // Customer Info - Classic simple style
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(7)
    pdf.setFont('times', 'normal')
    pdf.text('Intestatario:', pageWidth / 2, currentY, { align: 'center' })
    currentY += 4

    pdf.setFontSize(8)
    pdf.setFont('times', 'bold')
    const nameLines = pdf.splitTextToSize(ticketData.customerName, pageWidth - margin * 2 - 8)
    nameLines.forEach(line => {
      pdf.text(line, pageWidth / 2, currentY, { align: 'center' })
      currentY += 3.5
    })

    if (ticketData.customerPhone) {
      pdf.setFontSize(7)
      pdf.setFont('times', 'normal')
      pdf.text(`Tel. ${ticketData.customerPhone}`, pageWidth / 2, currentY, { align: 'center' })
      currentY += 3
    }

    if (ticketData.customerEmail) {
      pdf.setFontSize(6)
      pdf.setFont('times', 'normal')
      const emailLines = pdf.splitTextToSize(ticketData.customerEmail, pageWidth - margin * 2 - 8)
      emailLines.forEach(line => {
        pdf.text(line, pageWidth / 2, currentY, { align: 'center' })
        currentY += 3
      })
    }

    currentY += 3

    // Simple separator line
    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.3)
    pdf.line(margin + 8, currentY, pageWidth - margin - 8, currentY)
    currentY += 5

    // Fortune Message - Classic italic style
    if (ticketData.fortuneMessage) {
      pdf.setTextColor(60, 60, 60)
      pdf.setFontSize(7)
      pdf.setFont('times', 'italic')
      const fortuneLines = pdf.splitTextToSize(`"${ticketData.fortuneMessage}"`, pageWidth - margin * 2 - 8)
      fortuneLines.forEach(line => {
        pdf.text(line, pageWidth / 2, currentY, { align: 'center' })
        currentY += 3
      })

      currentY += 3

      // Separator line
      pdf.setDrawColor(0, 0, 0)
      pdf.setLineWidth(0.3)
      pdf.line(margin + 8, currentY, pageWidth - margin - 8, currentY)
      currentY += 5
    }

    // Extraction Date - Classic style
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(7)
    pdf.setFont('times', 'normal')
    pdf.text('Estrazione:', pageWidth / 2, currentY, { align: 'center' })

    currentY += 4

    const extractionDate = new Date(ticketData.extractionDate)
    const extractionStr = extractionDate.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    pdf.setFontSize(7.5)
    pdf.setFont('times', 'bold')
    const extractionLines = pdf.splitTextToSize(extractionStr, pageWidth - margin * 2 - 8)
    extractionLines.forEach(line => {
      pdf.text(line, pageWidth / 2, currentY, { align: 'center' })
      currentY += 3.5
    })

    currentY += 2

    // Separator line
    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.3)
    pdf.line(margin + 8, currentY, pageWidth - margin - 8, currentY)
    currentY += 5

    // QR Code - HIGH QUALITY with simple classic border
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(ticketData.qrCodeData, {
        width: 600,  // ALTA RISOLUZIONE per scansione nitida
        margin: 2,
        errorCorrectionLevel: 'H',  // Massima correzione errori
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      const qrSize = 28  // Grande per scansione facile
      const qrX = (pageWidth - qrSize) / 2
      const qrY = currentY + 3

      // Simple black border around QR (classic style)
      pdf.setDrawColor(0, 0, 0)
      pdf.setLineWidth(0.5)
      pdf.rect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, 'S')

      // Add QR code - ALTA QUALITÀ
      pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)

      // QR Code label
      pdf.setTextColor(80, 80, 80)
      pdf.setFontSize(6)
      pdf.setFont('times', 'italic')
      pdf.text('Codice di verifica', pageWidth / 2, qrY + qrSize + 4, { align: 'center' })

      currentY = qrY + qrSize + 8
    } catch (err) {
      console.error('Error generating QR code:', err)
    }

    // Footer - Organization info and purchase details
    currentY += 2

    // Separator line
    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.3)
    pdf.line(margin + 8, currentY, pageWidth - margin - 8, currentY)

    currentY += 4

    // Organization details in footer
    pdf.setTextColor(80, 80, 80)
    pdf.setFontSize(6)
    pdf.setFont('times', 'bold')

    if (ticketData.organizationName) {
      const orgNameLines = pdf.splitTextToSize(ticketData.organizationName.toUpperCase(), pageWidth - margin * 2 - 6)
      orgNameLines.forEach(line => {
        pdf.text(line, pageWidth / 2, currentY, { align: 'center' })
        currentY += 2.5
      })
      currentY += 1
    }

    pdf.setFont('times', 'normal')
    pdf.setFontSize(5.5)

    if (ticketData.organizationAddress) {
      const addressLines = pdf.splitTextToSize(ticketData.organizationAddress, pageWidth - margin * 2 - 6)
      addressLines.forEach(line => {
        pdf.text(line, pageWidth / 2, currentY, { align: 'center' })
        currentY += 2.5
      })
    }

    if (ticketData.organizationPhone) {
      pdf.text(`Tel. ${ticketData.organizationPhone}`, pageWidth / 2, currentY, { align: 'center' })
      currentY += 2.5
    }

    if (ticketData.organizationEmail) {
      const emailLines = pdf.splitTextToSize(ticketData.organizationEmail, pageWidth - margin * 2 - 6)
      emailLines.forEach(line => {
        pdf.text(line, pageWidth / 2, currentY, { align: 'center' })
        currentY += 2.5
      })
    }

    if (ticketData.organizationWebsite) {
      const websiteLines = pdf.splitTextToSize(ticketData.organizationWebsite, pageWidth - margin * 2 - 6)
      websiteLines.forEach(line => {
        pdf.text(line, pageWidth / 2, currentY, { align: 'center' })
        currentY += 2.5
      })
    }

    if (ticketData.organizationVAT) {
      pdf.text(`P.IVA: ${ticketData.organizationVAT}`, pageWidth / 2, currentY, { align: 'center' })
      currentY += 2.5
    }

    // Separator before ticket emission info
    currentY += 2
    pdf.setLineWidth(0.2)
    pdf.line(margin + 10, currentY, pageWidth - margin - 10, currentY)
    currentY += 3

    // Ticket emission info
    pdf.setTextColor(100, 100, 100)
    pdf.setFontSize(5.5)
    pdf.setFont('times', 'italic')
    const createdDate = new Date(ticketData.createdAt)
    const createdStr = createdDate.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    pdf.text(`Emesso il ${createdStr}`, pageWidth / 2, currentY, { align: 'center' })

    // Staff info if available
    if (ticketData.purchasedByStaff) {
      currentY += 2.5
      pdf.setFontSize(5)
      pdf.text(`Operatore: ${ticketData.purchasedByStaff}`, pageWidth / 2, currentY, { align: 'center' })
    }

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
