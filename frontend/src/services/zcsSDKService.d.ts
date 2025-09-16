declare class ZCSSDKService {
    constructor();
    initializeSDK(model: string, connectionType?: string): Promise<{ success: boolean; model?: string; connection?: string; error?: string }>;
    readNFCCard(timeout?: number): Promise<{ cardNo: string; rfCardType: string; rfUid: string; success: boolean }>;
    printLoyaltyReceipt(receiptData: any): Promise<{ success: boolean; error?: string }>;
    processEMVTransaction(transactionData: any): Promise<{ success: boolean; transactionId?: number; error?: string }>;
    handleSecurePinInput(pinType: any): Promise<any>; // More specific types can be added later
    testHardware(): Promise<{ success: boolean; results?: { led: boolean; beeper: boolean; printer: boolean; scanner: boolean }; error?: string }>;
    sleep(ms: number): Promise<void>;
    cleanup(): void;
}

declare const zcsSDK: ZCSSDKService;

export { zcsSDK };
export default zcsSDK;