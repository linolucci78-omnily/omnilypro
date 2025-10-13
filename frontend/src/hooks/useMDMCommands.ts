import { useEffect } from 'react'
import { createPrintService, type PrintConfig, type Receipt } from '../services/printService'

/**
 * Hook per gestire comandi MDM ricevuti dall'app Android
 * Registra funzioni globali che possono essere chiamate dal bridge Android
 */
export const useMDMCommands = () => {
  useEffect(() => {
    // Registra handler per comando di stampa MDM
    (window as any).handleMDMPrintCommand = async (templateJson: string, receiptDataJson: string) => {
      console.log('🖨️ MDM Print Command received!')
      console.log('📄 Template JSON:', templateJson)
      console.log('🧾 Receipt JSON:', receiptDataJson)

      try {
        // Parse dei dati JSON
        const template = JSON.parse(templateJson)
        const receiptData = receiptDataJson && receiptDataJson !== 'null' 
          ? JSON.parse(receiptDataJson) 
          : null

        console.log('✅ Template parsed:', template)
        console.log('✅ Receipt data parsed:', receiptData)

        // Crea configurazione stampante dal template
        const printConfig: PrintConfig = {
          storeName: template.store_name || 'Store',
          storeAddress: template.store_address || '',
          storePhone: template.store_phone || '',
          storeTax: template.store_tax || '',
          logoBase64: template.logo_base64 || undefined,
          paperWidth: template.paper_width || 384,
          fontSizeNormal: template.font_size_normal || 24,
          fontSizeLarge: template.font_size_large || 32,
          printDensity: template.print_density || 3
        }

        console.log('🔧 Print config created:', printConfig)

        // Inizializza servizio di stampa
        const printService = createPrintService(printConfig)
        console.log('📦 Print service created')

        const initialized = await printService.initialize()
        if (!initialized) {
          console.error('❌ Failed to initialize print service')
          alert('❌ Errore: impossibile inizializzare stampante')
          return
        }

        console.log('✅ Print service initialized')

        // Se c'è receiptData, stampalo, altrimenti stampa test receipt
        let success = false
        if (receiptData) {
          console.log('🖨️ Printing receipt with data...')
          
          // Converti timestamp da stringa a Date se necessario
          if (receiptData.timestamp && typeof receiptData.timestamp === 'string') {
            receiptData.timestamp = new Date(receiptData.timestamp)
          }
          // Se timestamp non esiste o è invalido, usa data corrente
          if (!receiptData.timestamp || !(receiptData.timestamp instanceof Date) || isNaN(receiptData.timestamp.getTime())) {
            console.warn('⚠️ Invalid or missing timestamp, using current date')
            receiptData.timestamp = new Date()
          }
          
          success = await printService.printReceipt(receiptData as Receipt)
        } else {
          console.log('🖨️ Printing test receipt...')
          success = await printService.printTestReceipt()
        }

        if (success) {
          console.log('✅ Print completed successfully')
          alert('✅ Stampa completata!')
        } else {
          console.error('❌ Print failed')
          alert('❌ Errore durante la stampa')
        }

      } catch (error) {
        console.error('❌ Error handling MDM print command:', error)
        alert('❌ Errore comando stampa: ' + (error as Error).message)
      }
    }

    console.log('✅ MDM command handlers registered')
    console.log('📋 Available: window.handleMDMPrintCommand')

    // Cleanup on unmount
    return () => {
      delete (window as any).handleMDMPrintCommand
      console.log('🧹 MDM command handlers unregistered')
    }
  }, [])
}
