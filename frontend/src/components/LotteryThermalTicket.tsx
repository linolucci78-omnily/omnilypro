import React from 'react'
import QRCode from 'qrcode'
import { LotteryTicket } from '../services/lotteryService'

interface LotteryThermalTicketProps {
  ticket: LotteryTicket
  eventName: string
  eventDate: string
  extractionDate: string
  prizeName?: string
  organizationName?: string
  organizationAddress?: string
  organizationPhone?: string
  organizationVat?: string
}

/**
 * Thermal Printer Ticket Component
 * Designed for 58mm/80mm thermal printers
 * Black & white only, vertical layout
 */
export const LotteryThermalTicket: React.FC<LotteryThermalTicketProps> = ({
  ticket,
  eventName,
  eventDate,
  extractionDate,
  prizeName,
  organizationName,
  organizationAddress,
  organizationPhone,
  organizationVat
}) => {
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>('')

  React.useEffect(() => {
    // Generate QR code as data URL
    QRCode.toDataURL(ticket.qr_code_data, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }).then(url => {
      setQrCodeUrl(url)
    })
  }, [ticket.qr_code_data])

  return (
    <div className="lottery-thermal-ticket" style={{
      width: '58mm', // 58mm thermal printer width
      backgroundColor: '#FFFFFF',
      color: '#000000',
      fontFamily: 'monospace',
      padding: '4mm',
      boxSizing: 'border-box'
    }}>
      {/* Organization Header */}
      {organizationName && (
        <>
          <div style={{
            textAlign: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '2mm',
            textTransform: 'uppercase'
          }}>
            {organizationName}
          </div>
          {organizationAddress && (
            <div style={{
              textAlign: 'center',
              fontSize: '9px',
              marginBottom: '1mm'
            }}>
              {organizationAddress}
            </div>
          )}
          {organizationPhone && (
            <div style={{
              textAlign: 'center',
              fontSize: '9px',
              marginBottom: '1mm'
            }}>
              Tel: {organizationPhone}
            </div>
          )}
          {organizationVat && (
            <div style={{
              textAlign: 'center',
              fontSize: '9px',
              marginBottom: '3mm'
            }}>
              P.IVA: {organizationVat}
            </div>
          )}
          <div style={{
            borderTop: '2px solid #000',
            margin: '3mm 0'
          }} />
        </>
      )}

      {/* Header - Event Name */}
      <div style={{
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        marginBottom: '3mm',
        borderBottom: '2px dashed #000',
        paddingBottom: '3mm',
        textTransform: 'uppercase'
      }}>
        {eventName}
      </div>

      {/* Ticket Number - Large and prominent */}
      <div style={{
        textAlign: 'center',
        margin: '4mm 0'
      }}>
        <div style={{
          fontSize: '10px',
          marginBottom: '2mm'
        }}>
          BIGLIETTO N.
        </div>
        <div style={{
          fontSize: '28px',
          fontWeight: 'bold',
          letterSpacing: '3px',
          border: '3px double #000',
          padding: '3mm',
          borderRadius: '3px'
        }}>
          {ticket.ticket_number}
        </div>
      </div>

      {/* Customer Name */}
      <div style={{
        textAlign: 'center',
        margin: '3mm 0',
        fontSize: '12px'
      }}>
        <div style={{ fontSize: '9px', marginBottom: '1mm' }}>INTESTATARIO:</div>
        <div style={{ fontWeight: 'bold' }}>{ticket.customer_name}</div>
      </div>

      {/* Separator */}
      <div style={{
        borderTop: '1px dashed #000',
        margin: '3mm 0'
      }} />

      {/* Fortune Message */}
      {ticket.fortune_message && (
        <div style={{
          textAlign: 'center',
          fontSize: '11px',
          fontStyle: 'italic',
          margin: '3mm 0',
          padding: '2mm',
          border: '1px solid #000',
          borderRadius: '2px'
        }}>
          "{ticket.fortune_message}"
        </div>
      )}

      {/* Prize Info */}
      {prizeName && (
        <div style={{
          textAlign: 'center',
          margin: '3mm 0',
          fontSize: '11px'
        }}>
          <div style={{ fontSize: '9px' }}>PREMIO IN PALIO:</div>
          <div style={{ fontWeight: 'bold', marginTop: '1mm' }}>{prizeName}</div>
        </div>
      )}

      {/* Extraction Date */}
      <div style={{
        textAlign: 'center',
        margin: '3mm 0',
        fontSize: '10px'
      }}>
        <div style={{ fontSize: '9px' }}>ESTRAZIONE:</div>
        <div style={{ fontWeight: 'bold', marginTop: '1mm' }}>
          {new Date(extractionDate).toLocaleDateString('it-IT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      {/* Separator */}
      <div style={{
        borderTop: '1px dashed #000',
        margin: '3mm 0'
      }} />

      {/* QR Code */}
      {qrCodeUrl && (
        <div style={{
          textAlign: 'center',
          margin: '3mm 0'
        }}>
          <img
            src={qrCodeUrl}
            alt="QR Code"
            style={{
              width: '120px',
              height: '120px',
              imageRendering: 'pixelated'
            }}
          />
          <div style={{
            fontSize: '8px',
            marginTop: '2mm'
          }}>
            Conserva questo biglietto per la validazione
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        borderTop: '2px dashed #000',
        paddingTop: '3mm',
        marginTop: '3mm',
        textAlign: 'center',
        fontSize: '8px'
      }}>
        <div>Data acquisto: {new Date(ticket.created_at).toLocaleString('it-IT')}</div>
        <div style={{ marginTop: '1mm' }}>Prezzo: €{ticket.price_paid.toFixed(2)}</div>
        {ticket.purchased_by_staff_name && (
          <div style={{ marginTop: '1mm' }}>Staff: {ticket.purchased_by_staff_name}</div>
        )}
      </div>

      {/* Tear Line */}
      <div style={{
        borderTop: '1px dashed #000',
        margin: '4mm -4mm 0 -4mm',
        paddingTop: '2mm',
        textAlign: 'center',
        fontSize: '7px',
        color: '#666'
      }}>
        ✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - ✂
      </div>

      {/* Stub Section */}
      <div style={{
        marginTop: '2mm',
        padding: '3mm',
        backgroundColor: '#f5f5f5',
        border: '1px solid #000',
        borderRadius: '2px'
      }}>
        <div style={{
          textAlign: 'center',
          fontSize: '10px',
          fontWeight: 'bold',
          marginBottom: '2mm'
        }}>
          TALLONCINO
        </div>
        <div style={{
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          letterSpacing: '2px',
          margin: '2mm 0'
        }}>
          {ticket.ticket_number}
        </div>
        <div style={{
          textAlign: 'center',
          fontSize: '9px'
        }}>
          {ticket.customer_name}
        </div>
        <div style={{
          textAlign: 'center',
          fontSize: '8px',
          marginTop: '2mm'
        }}>
          Estrazione: {new Date(extractionDate).toLocaleDateString('it-IT')}
        </div>
      </div>
    </div>
  )
}

/**
 * Hook to print thermal ticket
 */
export const usePrintLotteryTicket = () => {
  const printTicket = React.useCallback(async (ticketData: {
    ticket: LotteryTicket
    eventName: string
    eventDate: string
    extractionDate: string
    prizeName?: string
    organizationName?: string
    organizationAddress?: string
    organizationPhone?: string
    organizationVat?: string
  }) => {
    try {
      // Generate QR code first
      const qrCodeUrl = await QRCode.toDataURL(ticketData.ticket.qr_code_data, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      // Create print window
      const printWindow = window.open('', '', 'width=300,height=600')
      if (!printWindow) {
        console.warn('Popup bloccato - stampa non disponibile')
        return
      }

      const extractionDateFormatted = new Date(ticketData.extractionDate).toLocaleDateString('it-IT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })

      const createdAtFormatted = new Date(ticketData.ticket.created_at).toLocaleString('it-IT')

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Biglietto ${ticketData.ticket.ticket_number}</title>
            <style>
              @page { size: 58mm auto; margin: 0; }
              body {
                margin: 0;
                padding: 4mm;
                font-family: monospace;
                width: 58mm;
                box-sizing: border-box;
              }
              .header {
                text-align: center;
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 3mm;
                border-bottom: 2px dashed #000;
                padding-bottom: 3mm;
                text-transform: uppercase;
              }
              .ticket-number-box {
                text-align: center;
                margin: 4mm 0;
              }
              .ticket-label {
                font-size: 10px;
                margin-bottom: 2mm;
              }
              .ticket-number {
                font-size: 28px;
                font-weight: bold;
                letter-spacing: 3px;
                border: 3px double #000;
                padding: 3mm;
                border-radius: 3px;
              }
              .customer {
                text-align: center;
                margin: 3mm 0;
                font-size: 12px;
              }
              .customer-label {
                font-size: 9px;
                margin-bottom: 1mm;
              }
              .separator {
                border-top: 1px dashed #000;
                margin: 3mm 0;
              }
              .fortune {
                text-align: center;
                font-size: 11px;
                font-style: italic;
                margin: 3mm 0;
                padding: 2mm;
                border: 1px solid #000;
                border-radius: 2px;
              }
              .prize {
                text-align: center;
                margin: 3mm 0;
                font-size: 11px;
              }
              .prize-label {
                font-size: 9px;
              }
              .prize-name {
                font-weight: bold;
                margin-top: 1mm;
              }
              .extraction {
                text-align: center;
                margin: 3mm 0;
                font-size: 10px;
              }
              .extraction-label {
                font-size: 9px;
              }
              .extraction-date {
                font-weight: bold;
                margin-top: 1mm;
              }
              .qr-code {
                text-align: center;
                margin: 3mm 0;
              }
              .qr-code img {
                width: 120px;
                height: 120px;
              }
              .qr-label {
                font-size: 8px;
                margin-top: 2mm;
              }
              .footer {
                border-top: 2px dashed #000;
                padding-top: 3mm;
                margin-top: 3mm;
                text-align: center;
                font-size: 8px;
              }
              .tear-line {
                border-top: 1px dashed #000;
                margin: 4mm -4mm 0 -4mm;
                padding-top: 2mm;
                text-align: center;
                font-size: 7px;
                color: #666;
              }
              .stub {
                margin-top: 2mm;
                padding: 3mm;
                background: #f5f5f5;
                border: 1px solid #000;
                border-radius: 2px;
              }
              .stub-title {
                text-align: center;
                font-size: 10px;
                font-weight: bold;
                margin-bottom: 2mm;
              }
              .stub-number {
                text-align: center;
                font-size: 16px;
                font-weight: bold;
                letter-spacing: 2px;
                margin: 2mm 0;
              }
              .stub-name {
                text-align: center;
                font-size: 9px;
              }
              .stub-date {
                text-align: center;
                font-size: 8px;
                margin-top: 2mm;
              }
              .org-header {
                text-align: center;
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 2mm;
                text-transform: uppercase;
              }
              .org-info {
                text-align: center;
                font-size: 9px;
                margin-bottom: 1mm;
              }
              .org-separator {
                border-top: 2px solid #000;
                margin: 3mm 0;
              }
            </style>
          </head>
          <body>
            ${ticketData.organizationName ? `
              <div class="org-header">${ticketData.organizationName}</div>
              ${ticketData.organizationAddress ? `<div class="org-info">${ticketData.organizationAddress}</div>` : ''}
              ${ticketData.organizationPhone ? `<div class="org-info">Tel: ${ticketData.organizationPhone}</div>` : ''}
              ${ticketData.organizationVat ? `<div class="org-info">P.IVA: ${ticketData.organizationVat}</div>` : ''}
              <div class="org-separator"></div>
            ` : ''}

            <div class="header">${ticketData.eventName}</div>

            <div class="ticket-number-box">
              <div class="ticket-label">BIGLIETTO N.</div>
              <div class="ticket-number">${ticketData.ticket.ticket_number}</div>
            </div>

            <div class="customer">
              <div class="customer-label">INTESTATARIO:</div>
              <div><strong>${ticketData.ticket.customer_name}</strong></div>
            </div>

            <div class="separator"></div>

            ${ticketData.ticket.fortune_message ? `
              <div class="fortune">"${ticketData.ticket.fortune_message}"</div>
            ` : ''}

            ${ticketData.prizeName ? `
              <div class="prize">
                <div class="prize-label">PREMIO IN PALIO:</div>
                <div class="prize-name">${ticketData.prizeName}</div>
              </div>
            ` : ''}

            <div class="extraction">
              <div class="extraction-label">ESTRAZIONE:</div>
              <div class="extraction-date">${extractionDateFormatted}</div>
            </div>

            <div class="separator"></div>

            <div class="qr-code">
              <img src="${qrCodeUrl}" alt="QR Code">
              <div class="qr-label">Conserva questo biglietto per la validazione</div>
            </div>

            <div class="footer">
              <div>Data acquisto: ${createdAtFormatted}</div>
              <div style="margin-top: 1mm;">Prezzo: €${ticketData.ticket.price_paid.toFixed(2)}</div>
              ${ticketData.ticket.purchased_by_staff_name ? `
                <div style="margin-top: 1mm;">Staff: ${ticketData.ticket.purchased_by_staff_name}</div>
              ` : ''}
            </div>

            <div class="tear-line">✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - ✂</div>

            <div class="stub">
              <div class="stub-title">TALLONCINO</div>
              <div class="stub-number">${ticketData.ticket.ticket_number}</div>
              <div class="stub-name">${ticketData.ticket.customer_name}</div>
              <div class="stub-date">Estrazione: ${new Date(ticketData.extractionDate).toLocaleDateString('it-IT')}</div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()

      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print()
        setTimeout(() => {
          printWindow.close()
        }, 1000)
      }, 500)
    } catch (error) {
      console.error('Errore stampa biglietto:', error)
      alert('Errore durante la stampa del biglietto')
    }
  }, [])

  return { printTicket }
}
