
4

Zoom automatico
ZCS POS Android Platform SDK Instructions and
Examples
Version 1.2
SHENZHEN ZCS TECHNOLOGY CO., LTD
Overview
This document is applicable to the Android platform SDK of Smart
POS (Z90, Z91, Z92, Z100), MPOS (Z70), all-in-one card reader module
(Z45) and other products.
Environment
This document uses Android Studio as the development environment
by default. If you use other development platforms to develop, please
refer to the environment of the corresponding platform. This document
is for reference only.

1. Import jar package
Copy the ‘SmartPos_xxx.jar’ file to the ‘app\libs’ directory. After the
copy is complete, click the jar package, right-click—>add as library.
If you need to use the function of printing QR code, you also need to
import the jar package of ‘zxing’, that is, copy the ‘core-3.2.1.jar’ file to
the ‘app\libs’ directory. After the copy is complete, click the jar package
and right-click—>add as library.
If you need to use the EMV function, refer to the above steps to add
the ‘emv_xxx.jar’ file.
2. Import so library
Copy the ‘armeabi-v7a’ and ‘arm64-v8a’ directories to the
‘src/main/jniLibs’ directory.
The so library includes ‘libSmartPosJni.so’ and ‘libEmvCoreJni.so’.
Among them, ‘libSmartPosJni.so’ is the basic so, and ‘libEmvCoreJni.so’ is
the so related to the EMV function. If the EMV function is not required,
‘libEmvCoreJni.so’ can not be added.
Common class
1. Introduction
DriverManager Used to generate instance of each module
operation class
Sys Used to obtain various device hardware information and
system packaging interfaces
Printer Used to print
CardReaderManager Used to find and operate various types of
cards
EmvHandler Used to run EMV
PinPadManager Used to manage PinPad
Led Used to operate LED
Beeper Used to operate beeper
BluetoothHandler Used for Z70 card reader
2. Get instance
Get each module operation class instance through various getXXX()
functions of DriverManager
initialization
All interfaces need to initialize the SDK before use.
1. Default (for Z90, Z91, Z92, Z100)
Refer to the following code.
private void initSdk() {
int status = mSys.sdkInit();
if(status != SdkResult.SDK_OK) {
mSys.sysPowerOn();
try {
Thread.sleep(1000);
} catch (InterruptedException e) {
e.printStackTrace();
}
}
status = mSys.sdkInit();
if(status != SdkResult.SDK_OK) {
//init failed.
}
}
2. Bluetooth (for Z70)
Refer to the following code.
private void initSdk() {
// Config the SDK base info
DriverManager mDriverManager = DriverManager.getInstance();
Sys mSys = mDriverManager.getBaseSysDevice();
CardReaderManager mCardReadManager = mDriverManager.getCardReadManager();
EmvHandler mEmvHandler = EmvHandler.getInstance();
PinPadManager mPadManager = mDriverManager.getPadManager();
Printer mPrinter = mDriverManager.getPrinter();
Beeper mBeeper = mDriverManager.getBeeper();
Led mLed = mDriverManager.getLedDriver();
BluetoothHandler mBluetoothHandler = mDriverManager.getBluetoothHandler();
mSys = mDriverManager.getBaseSysDevice();
mSys.showLog(true);
mBluetoothManager = BluetoothManager.getInstance()
.setContext(mActivity)
.setBluetoothListener(new BluetoothListener() {
@Override
public boolean isReader(BluetoothDevice bluetoothDevice) {
// Get device searched by bluetooth
mAdapter.addDevice(bluetoothDevice);
mAdapter.notifyDataSetChanged();
return false;
}
@Override
public void startedConnect(BluetoothDevice device) {
Log.e(TAG, "startedConnect: ");
}
@Override
public void connected(BluetoothDevice device) {
Log.e(TAG, "connected: ");
mHandler.obtainMessage(MSG_TOAST, "Connected").sendToTarget();
int sdkInit = mSys.sdkInit(ConnectTypeEnum.BLUETOOTH);
String initRes = (sdkInit == SdkResult.SDK_OK) ? getString(R.string.init_success
) : SDK_Result.obtainMsg(mActivity, sdkInit);
// mBluetoothManager.connect called in sub thread, u need to switch to main thre
ad when u need to change ui
mHandler.obtainMessage(MSG_TOAST, initRes).sendToTarget();
}
@Override
public void disConnect() {
Log.e(TAG, "disConnect: ");
mHandler.obtainMessage(MSG_TOAST, "Disconnect").sendToTarget();
}
@Override
public void startedDiscovery() {
Log.e(TAG, "startedDiscovery: ");
}
@Override
public void finishedDiscovery() {
Log.e(TAG, "finishedDiscovery: ");
}
})
.init();
}
3. USB (for Z45)
Refer to the following code.
private int openUsb() {
if (mUsbHandler != null) {
mUsbHandler.close();
}
mUsbHandler = UsbHandler.getInstance().setContext(this).init();
int nRet = mUsbHandler.connect();
if (nRet == USBConstants.USB_NO_PERMISSION) {
mUsbHandler.checkPermission();
nRet = mUsbHandler.connect();
} else if (nRet == USBConstants.USB_NO_USB_DEVICE || nRet == USBConstants.USB_NOT_FIND_D
EVICE) {
SystemClock.sleep(2000);
if (mUsbHandler != null) {
mUsbHandler.close();
}
mUsbHandler = UsbHandler.getInstance().setContext(this).init();
nRet = mUsbHandler.connect();
}
showLog("openUsb: " + nRet);
if (nRet == 0) {
nRet = mSys.sdkInit(ConnectTypeEnum.USB);
showLog("sdkInit:" + nRet);
}
return nRet;
}
Print
This chapter will show some methods of printing functions, please
adjust the specific usage according to actual needs. The SDK needs to be
initialized before printing, please refer to the previous chapter.
1. Print text
private void printText() {
int printStatus = mPrinter.getPrinterStatus();
if (printStatus == SdkResult.SDK_PRN_STATUS_PAPEROUT) {
//out of paper
} else {
PrnStrFormat format = new PrnStrFormat();
format.setTextSize(30);
format.setAli(Layout.Alignment.ALIGN_CENTER);
format.setStyle(PrnTextStyle.BOLD);
format.setFont(PrnTextFont.CUSTOM);
format.setPath(Environment.getExternalStorageDirectory() + "/fonts/simsun.ttf");
mPrinter.setPrintAppendString("POS SALES SLIP", format);
format.setTextSize(25);
format.setStyle(PrnTextStyle.NORMAL);
format.setAli(Layout.Alignment.ALIGN_NORMAL);
mPrinter.setPrintAppendString(" ", format);
mPrinter.setPrintAppendString("MERCHANGT NAME:" + " Test ", format);
mPrinter.setPrintAppendString("MERCHANT NO:" + " 123456789012345 ", format);
mPrinter.setPrintAppendString("TERMINAL NAME:" + " 12345678 ", format);
mPrinter.setPrintAppendString("OPERATOR NO:" + " 01 ", format);
mPrinter.setPrintAppendString("CARD NO: ", format);
format.setAli(Layout.Alignment.ALIGN_CENTER);
format.setTextSize(30);
format.setStyle(PrnTextStyle.BOLD);
mPrinter.setPrintAppendString("6214 44** **** **** 7816", format);
format.setAli(Layout.Alignment.ALIGN_NORMAL);
format.setStyle(PrnTextStyle.NORMAL);
format.setTextSize(25);mPrinter.setPrintAppendString(" -----------------------------
", format);
mPrinter.setPrintAppendString(" ", format);
mPrinter.setPrintAppendString(" ", format);
mPrinter.setPrintAppendString(" ", format);
mPrinter.setPrintAppendString(" ", format);
printStatus = mPrinter.setPrintStart();
}
}
2. Print QR code (the jar package of zxing needs to be imported)
private void printQrcode(String qrString) {
int printStatus = mPrinter.getPrinterStatus();
if (printStatus != SdkResult.SDK_PRN_STATUS_PAPEROUT) {
mPrinter.setPrintAppendQRCode(qrString, 200, 200, Layout.Alignment.ALIGN_CENTER);
printStatus = mPrinter.setPrintStart();
mPrinter.printLabel(bitmap);
}
}
Card
1. some common methods
This section lists some common methods that will be used to read
the card. The sdk needs to be initialized before reading the card, please
refer to the previous chapter.
private DriverManager mDriverManager = DriverManager.getInstance();
private CardReaderManager mCardReadManager = mDriverManager.getCardReadManager();
private static final int READ_TIMEOUT = 60 * 1000;
private ProgressDialog mProgressDialog;
private void showSearchCardDialog(@StringRes int title, @StringRes int msg) {
mProgressDialog = (ProgressDialog) DialogUtils.showProgress(getActivity(), getString
(title), getString(msg), new DialogInterface.OnCancelListener() {
@Override
public void onCancel(DialogInterface dialog) {
mCardReadManager.cancelSearchCard();
}
});
}
private static String cardInfoToString(CardInfoEntity cardInfoEntity) {
if (cardInfoEntity == null)
return null;
StringBuilder sb = new StringBuilder();
sb.append("Resultcode:\t" + cardInfoEntity.getResultcode() + "\n")
.append(cardInfoEntity.getCardExistslot() == null ? "" : "Card type:\t" + ca
rdInfoEntity.getCardExistslot().name() + "\n")
.append(cardInfoEntity.getCardNo() == null ? "" : "Card no:\t" + cardInfoEnt
ity.getCardNo() + "\n")
.append(cardInfoEntity.getRfCardType() == 0 ? "" : "Rf card type:\t" + cardI
nfoEntity.getRfCardType() + "\n")
.append(cardInfoEntity.getRFuid() == null ? "" : "RFUid:\t" + new String(car
dInfoEntity.getRFuid()) + "\n")
.append(cardInfoEntity.getAtr() == null ? "" : "Atr:\t" + cardInfoEntity.get
Atr() + "\n")
.append(cardInfoEntity.getTk1() == null ? "" : "Track1:\t" + cardInfoEntity.
getTk1() + "\n")
.append(cardInfoEntity.getTk2() == null ? "" : "Track2:\t" + cardInfoEntity.
getTk2() + "\n")
.append(cardInfoEntity.getTk3() == null ? "" : "Track3:\t" + cardInfoEntity.
getTk3() + "\n")
.append(cardInfoEntity.getExpiredDate() == null ? "" : "expiredDate:\t" + ca
rdInfoEntity.getExpiredDate() + "\n")
.append(cardInfoEntity.getServiceCode() == null ? "" : "serviceCode:\t" + ca
rdInfoEntity.getServiceCode());
return sb.toString();
}
private String rfCardTypeToString(byte rfCardType) {
String type = "";
switch (rfCardType) {
case SdkData.RF_TYPE_A:
type = "RF_TYPE_A";
break;
case SdkData.RF_TYPE_B:
type = "RF_TYPE_B";
break;
case SdkData.RF_TYPE_MEMORY_A:
type = "RF_TYPE_MEMORY_A";
break;
case SdkData.RF_TYPE_FELICA:
type = "RF_TYPE_FELICA";
break;
case SdkData.RF_TYPE_MEMORY_B:
type = "RF_TYPE_MEMORY_B";
break;
}
return type;
}
2. IC Card
This section will show how to read the information of IC card.
private void searchICCard() {
showSearchCardDialog(R.string.waiting, R.string.msg_ic_card);
mCardReadManager.cancelSearchCard();
mCardReadManager.searchCard(CardReaderTypeEnum.IC_CARD, READ_TIMEOUT, mICCardSearchC
ardListener);
}
private OnSearchCardListener mICCardSearchCardListener = new OnSearchCardListener() {
@Override
public void onCardInfo(CardInfoEntity cardInfoEntity) {
mProgressDialog.dismiss();
readICCard();
}
@Override
public void onError(int i) {
mProgressDialog.dismiss();
showReadICCardErrorDialog(i);
}
@Override
public void onNoCard(CardReaderTypeEnum cardReaderTypeEnum, boolean b) {
}
};
public static final byte[] APDU_SEND_IC = {0x00, (byte) 0xA4, 0x04, 0x00, 0x0E, 0x31, 0x
50, 0x41, 0x59, 0x2E, 0x53, 0x59, 0x53, 0x2E, 0x44, 0x44, 0x46, 0x30, 0x31, 0X00};
private void readICCard() {
ICCard icCard = mCardReadManager.getICCard();
int result = icCard.icCardReset(CardSlotNoEnum.SDK_ICC_USERCARD);
if (result == SdkResult.SDK_OK) {
int[] recvLen = new int[1];
byte[] recvData = new byte[300];
result = icCard.icExchangeAPDU(CardSlotNoEnum.SDK_ICC_USERCARD, APDU_SEND_IC, re
cvData, recvLen);
if (result == SdkResult.SDK_OK) {
final String apduRecv = StringUtils.convertBytesToHex(recvData).substring(0,
recvLen[0] * 2);
CardFragment.this.getActivity().runOnUiThread(new Runnable() {
@Override
public void run() {
DialogUtils.show(getActivity(), "Read IC card result", apduRecv);
}
});
