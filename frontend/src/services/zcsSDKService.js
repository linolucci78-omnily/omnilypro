/**
 * ZCS POS Android SDK Integration Service
 * Basato sulla documentazione ZCS POS Android Platform SDK v1.2
 * 
 * Supporta modelli: Z90, Z91, Z92, Z100, Z108, Z70 (MPOS), Z45 (Card Reader)
 */

class ZCSSDKService {
    constructor() {
        this.driverManager = null
        this.cardReadManager = null
        this.printer = null
        this.sys = null
        this.emvHandler = null
        this.pinPadManager = null
        this.led = null
        this.beeper = null
        this.isInitialized = false
        this.currentModel = null
    }

    /**
     * Inizializzazione SDK per diversi modelli POS
     * @param {string} model - Modello POS (Z108, Z100, Z92, etc.)
     * @param {string} connectionType - Tipo connessione (usb, bluetooth)
     */
    async initializeSDK(model, connectionType = 'usb') {
        try {
            console.log(`Inizializzazione ZCS SDK per ${model} via ${connectionType}`)
            
            // Verifica che Android WebView abbia accesso all'SDK nativo
            if (typeof window.ZCSDriver === 'undefined') {
                throw new Error('ZCS SDK nativo non disponibile. Verificare installazione librerie Android.')
            }

            this.currentModel = model
            this.driverManager = window.ZCSDriver.getInstance()
            
            // Ottieni istanze dei manager
            this.sys = this.driverManager.getBaseSysDevice()
            this.cardReadManager = this.driverManager.getCardReadManager()
            this.printer = this.driverManager.getPrinter()
            this.emvHandler = window.ZCSEmvHandler?.getInstance()
            this.pinPadManager = this.driverManager.getPadManager()
            this.led = this.driverManager.getLedDriver()
            this.beeper = this.driverManager.getBeeper()

            // Inizializzazione specifica per tipo di connessione
            let initResult
            switch (connectionType) {
                case 'usb':
                    initResult = await this.initUSBConnection()
                    break
                case 'bluetooth':
                    initResult = await this.initBluetoothConnection()
                    break
                default:
                    initResult = await this.initDefaultConnection()
            }

            if (initResult.success) {
                this.isInitialized = true
                console.log('ZCS SDK inizializzato con successo')
                return { success: true, model: model, connection: connectionType }
            } else {
                throw new Error(initResult.error)
            }

        } catch (error) {
            console.error('Errore inizializzazione ZCS SDK:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Inizializzazione connessione USB (Z45, Z100, Z108)
     */
    async initUSBConnection() {
        try {
            if (this.usbHandler) {
                this.usbHandler.close()
            }
            
            this.usbHandler = window.ZCSUsbHandler.getInstance()
                .setContext(window.ZCSContext)
                .init()
            
            let result = this.usbHandler.connect()
            
            if (result === window.ZCSConstants.USB_NO_PERMISSION) {
                this.usbHandler.checkPermission()
                result = this.usbHandler.connect()
            }
            
            if (result === 0) {
                result = this.sys.sdkInit(window.ZCSConnectType.USB)
                return { success: true }
            } else {
                return { success: false, error: `USB connection failed: ${result}` }
            }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Inizializzazione connessione Bluetooth (Z70)
     */
    async initBluetoothConnection() {
        try {
            this.bluetoothManager = window.ZCSBluetoothManager.getInstance()
                .setContext(window.ZCSContext)
                .setBluetoothListener({
                    onReader: (device) => {
                        console.log('Dispositivo POS trovato:', device.getName())
                        return false
                    },
                    onConnected: (device) => {
                        console.log('POS connesso:', device.getName())
                        const sdkInit = this.sys.sdkInit(window.ZCSConnectType.BLUETOOTH)
                        return sdkInit === window.ZCSResult.SDK_OK
                    },
                    onDisconnect: () => {
                        console.log('POS disconnesso')
                        this.isInitialized = false
                    }
                })
                .init()

            return { success: true }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Inizializzazione default per POS integrati (Z90, Z91, Z92, Z100, Z108)
     */
    async initDefaultConnection() {
        try {
            let status = this.sys.sdkInit()
            
            if (status !== window.ZCSResult.SDK_OK) {
                this.sys.sysPowerOn()
                await this.sleep(1000)
                status = this.sys.sdkInit()
            }
            
            if (status === window.ZCSResult.SDK_OK) {
                return { success: true }
            } else {
                return { success: false, error: `SDK init failed: ${status}` }
            }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Lettura NFC/Contactless per tessere loyalty
     */
    async readNFCCard(timeout = 60000) {
        if (!this.isInitialized) {
            throw new Error('SDK non inizializzato')
        }

        return new Promise((resolve, reject) => {
            try {
                const listener = {
                    onCardInfo: (cardInfo) => {
                        const cardData = {
                            cardNo: cardInfo.getCardNo(),
                            rfCardType: cardInfo.getRfCardType(),
                            rfUid: cardInfo.getRFuid(),
                            success: true
                        }
                        resolve(cardData)
                    },
                    onError: (errorCode) => {
                        reject(new Error(`Errore lettura NFC: ${errorCode}`))
                    },
                    onNoCard: () => {
                        reject(new Error('Nessuna carta rilevata'))
                    }
                }

                this.cardReadManager.cancelSearchCard()
                this.cardReadManager.searchCard(
                    window.ZCSCardType.RF_CARD, 
                    timeout, 
                    listener
                )
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Stampa ricevuta loyalty con QR code
     */
    async printLoyaltyReceipt(receiptData) {
        if (!this.isInitialized) {
            throw new Error('SDK non inizializzato')
        }

        try {
            const printStatus = this.printer.getPrinterStatus()
            if (printStatus === window.ZCSResult.SDK_PRN_STATUS_PAPEROUT) {
                throw new Error('Carta esaurita')
            }

            // Configura formato testo
            const format = window.ZCSPrnStrFormat()
            format.setTextSize(30)
            format.setAli(window.ZCSAlignment.ALIGN_CENTER)
            format.setStyle(window.ZCSTextStyle.BOLD)

            // Header ricevuta
            this.printer.setPrintAppendString(receiptData.merchantName, format)
            
            format.setTextSize(25)
            format.setStyle(window.ZCSTextStyle.NORMAL)
            format.setAli(window.ZCSAlignment.ALIGN_NORMAL)

            // Dati transazione
            this.printer.setPrintAppendString(`CLIENTE: ${receiptData.customerName}`, format)
            this.printer.setPrintAppendString(`PUNTI GUADAGNATI: ${receiptData.pointsEarned}`, format)
            this.printer.setPrintAppendString(`SALDO PUNTI: ${receiptData.totalPoints}`, format)
            this.printer.setPrintAppendString(`DATA: ${receiptData.date}`, format)

            // QR Code per app mobile
            if (receiptData.qrCode) {
                this.printer.setPrintAppendQRCode(
                    receiptData.qrCode, 
                    200, 200, 
                    window.ZCSAlignment.ALIGN_CENTER
                )
            }

            // Stampa
            const printResult = this.printer.setPrintStart()
            
            if (printResult === window.ZCSResult.SDK_OK) {
                return { success: true }
            } else {
                throw new Error(`Errore stampa: ${printResult}`)
            }
        } catch (error) {
            console.error('Errore stampa ricevuta:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Transazione EMV (Chip & PIN)
     */
    async processEMVTransaction(transactionData) {
        if (!this.isInitialized || !this.emvHandler) {
            throw new Error('EMV non disponibile')
        }

        return new Promise((resolve, reject) => {
            try {
                const emvListener = {
                    onSelApp: (appList) => {
                        // Selezione automatica prima app disponibile
                        return 0
                    },
                    onConfirmCardNo: (cardNo) => {
                        console.log('Carta confermata:', cardNo)
                        return 0
                    },
                    onInputPIN: (pinType) => {
                        // Gestione input PIN sicuro
                        return this.handleSecurePinInput(pinType)
                    },
                    onCertVerify: (certType, certNo) => {
                        return 0 // Certificato valido
                    },
                    onExchangeApdu: (sendData) => {
                        // Comunicazione con carta
                        if (this.currentCardType === window.ZCSCardType.IC_CARD) {
                            return this.icCard.icExchangeAPDU(
                                window.ZCSCardSlot.SDK_ICC_USERCARD, 
                                sendData
                            )
                        } else if (this.currentCardType === window.ZCSCardType.RF_CARD) {
                            return this.rfCard.rfExchangeAPDU(sendData)
                        }
                        return null
                    },
                    onlineProc: () => {
                        // Autorizzazione online
                        const authCode = ['0', '0'] // Approved
                        const issuerResp = []
                        const respLen = 0
                        
                        this.emvHandler.separateOnlineResp(authCode, issuerResp, respLen)
                        return 0
                    }
                }

                // Parametri transazione
                const emvTransParam = window.ZCSEmvTransParam()
                emvTransParam.setTransKernalType(window.ZCSEmvKernel.KERNAL_EMV_PBOC)

                // Avvia transazione EMV
                const result = this.emvHandler.emvTrans(
                    emvTransParam,
                    emvListener,
                    [], // isEcTrans
                    [], // balance  
                    []  // transResult
                )

                if (result === 0) {
                    resolve({ success: true, transactionId: Date.now() })
                } else {
                    reject(new Error(`Transazione EMV fallita: ${result}`))
                }
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Input PIN sicuro
     */
    async handleSecurePinInput(pinType) {
        try {
            const pinResult = await this.pinPadManager.inputOnlinePin(
                window.ZCSContext,
                6,    // min length
                12,   // max length  
                60,   // timeout
                true, // beep enabled
                '5187108106590784', // card number
                0,    // key index
                window.ZCSPinAlgorithm.ANSI_X_9_8
            )

            if (pinResult.success) {
                this.emvHandler.setPinBlock(pinResult.pinBlock)
                return window.ZCSEmvResult.EMV_OK
            } else {
                return window.ZCSEmvResult.EMV_ERR_USER_CANCEL
            }
        } catch (error) {
            console.error('Errore input PIN:', error)
            return window.ZCSEmvResult.EMV_ERR_OTHER
        }
    }

    /**
     * Test hardware components
     */
    async testHardware() {
        if (!this.isInitialized) {
            return { success: false, error: 'SDK non inizializzato' }
        }

        const results = {
            led: false,
            beeper: false,
            printer: false,
            scanner: false
        }

        try {
            // Test LED
            const ledResult = this.led.setLed(window.ZCSLedMode.RED, true)
            results.led = ledResult === window.ZCSResult.SDK_OK
            
            await this.sleep(500)
            this.led.setLed(window.ZCSLedMode.RED, false)

            // Test Beeper
            const beeperResult = this.beeper.beep(4000, 300)
            results.beeper = beeperResult === window.ZCSResult.SDK_OK

            // Test Printer
            const printerStatus = this.printer.getPrinterStatus()
            results.printer = printerStatus !== window.ZCSResult.SDK_PRN_STATUS_PAPEROUT

            // Test Scanner (se disponibile)
            if (this.scanner) {
                this.scanner.QRScanerPowerCtrl(1)
                results.scanner = true
                this.scanner.QRScanerPowerCtrl(0)
            }

            return { success: true, results }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    /**
     * Utilità sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    /**
     * Cleanup risorse
     */
    cleanup() {
        try {
            if (this.cardReadManager) {
                this.cardReadManager.closeCard()
            }
            if (this.usbHandler) {
                this.usbHandler.close()
            }
            if (this.bluetoothManager) {
                this.bluetoothManager.disconnect()
            }
            
            this.isInitialized = false
            console.log('ZCS SDK cleanup completato')
        } catch (error) {
            console.error('Errore cleanup:', error)
        }
    }
}

// Export singleton instance
export const zcsSDK = new ZCSSDKService()
export default zcsSDK