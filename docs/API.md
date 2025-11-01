# API Documentation

## Core Classes

### HDWallet

ระบบ Hierarchical Deterministic Wallet ที่ใช้ BIP32/BIP39/BIP44

#### Methods

```typescript
// สร้าง wallet ใหม่
static createWallet(name: string, password: string, mnemonic?: string): 
  { wallet: WalletData; hdWallet: HDWallet }

// โหลด wallet จากข้อมูลเข้ารหัส
static loadWallet(walletData: WalletData, password: string): HDWallet

// สร้าง address ใหม่
generateAddress(currency: CryptoCurrency, index: number): Address

// ลงนาม transaction
signTransaction(psbt: bitcoin.Psbt, inputs: Array<{ derivationPath: string; index: number }>): bitcoin.Psbt

// ตรวจสอบ mnemonic
static validateMnemonic(mnemonic: string): boolean
```

### WalletManager

จัดการ wallet หลายๆ อันและการทำ transaction

#### Methods

```typescript
// เริ่มต้นใช้งาน
initialize(password: string): Promise<void>

// สร้าง wallet ใหม่
createWallet(name: string, mnemonic?: string): Promise<{ walletId: string; mnemonic: string }>

// กู้คืน wallet
restoreWallet(name: string, mnemonic: string): Promise<string>

// สร้าง address ใหม่
generateNewAddress(walletId: string, currency: CryptoCurrency): Promise<Address>

// ดูยอดเงิน
getBalance(walletId: string, currency: CryptoCurrency): BalanceInfo

// สร้าง transaction offline
createTransaction(walletId: string, currency: CryptoCurrency, toAddress: string, amount: number): 
  Promise<{ rawTx: string; txId: string }>

// สำรองข้อมูล
createBackup(): Promise<string>

// กู้คืนจากสำรอง
restoreFromBackup(backupPath: string): Promise<void>
```

### EncryptionService

จัดการการเข้ารหัสและถอดรหัส

#### Methods

```typescript
// เข้ารหัสข้อมูล
static encrypt(data: string, password: string): string

// ถอดรหัสข้อมูล
static decrypt(encryptedData: string, password: string): string

// สร้าง password hash
static generatePasswordHash(password: string, salt?: string): { hash: string; salt: string }

// สร้าง checksum
static generateChecksum(data: string): string

// ตรวจสอบ checksum
static verifyChecksum(data: string, checksum: string): boolean
```

### StorageService

จัดการการจัดเก็บข้อมูลในไฟล์

#### Methods

```typescript
// เริ่มต้นระบบเก็บข้อมูล
static initializeStorage(): void

// บันทึก wallets
static saveWallets(wallets: WalletData[], password: string): Promise<void>

// โหลด wallets
static loadWallets(password: string): Promise<WalletData[]>

// สร้างสำรองข้อมูล
static createBackup(wallets: WalletData[], password: string): Promise<string>

// กู้คืนจากสำรอง
static restoreFromBackup(backupPath: string, password: string): Promise<WalletData[]>

// ตรวจสอบว่ามีข้อมูล wallet หรือไม่
static hasWalletData(): boolean
```

### CurrencyService

จัดการสกุลเงินดิจิทัลต่างๆ

#### Methods

```typescript
// ดึงข้อมูลสกุลเงิน
static getCurrency(symbol: string): CryptoCurrency | undefined

// ตรวจสอบว่าสกุลเงินรองรับหรือไม่
static isSupported(symbol: string): boolean

// แปลงจาก satoshi
static fromSatoshi(amount: number, currency: CryptoCurrency): number

// แปลงเป็น satoshi
static toSatoshi(amount: number, currency: CryptoCurrency): number

// จัดรูปแบบจำนวนเงิน
static formatAmount(amount: number, currency: CryptoCurrency): string

// คำนวณค่าธรรมเนียม
static calculateFee(inputCount: number, outputCount: number, currency: CryptoCurrency): number
```

## Data Types

### WalletData
```typescript
interface WalletData {
  id: string;
  name: string;
  encryptedSeed: string;
  addresses: Address[];
  createdAt: Date;
  lastUsed: Date;
}
```

### Address
```typescript
interface Address {
  address: string;
  derivationPath: string;
  publicKey: string;
  balance: number;
  used: boolean;
  currency: CryptoCurrency;
}
```

### CryptoCurrency
```typescript
interface CryptoCurrency {
  symbol: string;
  name: string;
  network: string;
  decimals: number;
  derivationPath: string;
}
```

### Transaction
```typescript
interface Transaction {
  txId: string;
  from: string[];
  to: string[];
  amount: number;
  fee: number;
  timestamp: Date;
  confirmations: number;
  status: 'pending' | 'confirmed' | 'failed';
  currency: CryptoCurrency;
  rawTx?: string;
}
```

## Supported Currencies

| Currency | Symbol | Network | Derivation Path |
|----------|--------|---------|-----------------|
| Bitcoin | BTC | mainnet | m/44'/0'/0' |
| Bitcoin Testnet | BTC-TEST | testnet | m/44'/1'/0' |
| Litecoin | LTC | mainnet | m/44'/2'/0' |
| Dogecoin | DOGE | mainnet | m/44'/3'/0' |
| Bitcoin Cash | BCH | mainnet | m/44'/145'/0' |
| Dash | DASH | mainnet | m/44'/5'/0' |

## Error Handling

### Common Errors

1. **Invalid Password**: เกิดขึ้นเมื่อรหัสผ่านไม่ถูกต้อง
2. **Invalid Mnemonic**: เกิดขึ้นเมื่อ mnemonic phrase ไม่ถูกต้อง
3. **Insufficient Balance**: เกิดขึ้นเมื่อยอดเงินไม่เพียงพอ
4. **Wallet Not Found**: เกิดขึ้นเมื่อไม่พบ wallet ที่ระบุ
5. **File Access Error**: เกิดขึ้นเมื่อไม่สามารถเข้าถึงไฟล์ได้

### Error Example

```typescript
try {
  await walletManager.initialize(password);
} catch (error) {
  if (error.message === 'Invalid password') {
    console.log('รหัสผ่านไม่ถูกต้อง');
  } else {
    console.log('เกิดข้อผิดพลาด:', error.message);
  }
}
```

## Security Considerations

### Encryption
- ใช้ AES-256-CBC สำหรับเข้ารหัสข้อมูล
- ใช้ PBKDF2 สำหรับ key derivation (100,000 iterations)
- Salt แบบ random สำหรับแต่ละการเข้ารหัส

### Key Management
- Private keys ไม่เก็บในหน่วยความจำ
- Mnemonic phrases เข้ารหัสก่อนเก็บ
- ใช้ secure random สำหรับสร้าง entropy

### File Permissions
- ไฟล์ wallet มี permission 600 (owner read/write only)
- โฟลเดอร์ wallet มี permission 700 (owner access only)

## Development Guide

### Adding New Currency

1. เพิ่มข้อมูลใน `SUPPORTED_CURRENCIES`:
```typescript
{
  symbol: 'NEW',
  name: 'New Coin',
  network: 'mainnet',
  decimals: 8,
  derivationPath: "m/44'/999'/0'"
}
```

2. อัพเดท address generation ใน `generateAddress()` ถ้าจำเป็น

3. ทดสอบด้วย testnet ก่อน

### Custom Network

```typescript
const customNetwork = {
  messagePrefix: '\x18Custom Coin Signed Message:\n',
  bech32: 'cc',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x00,
  scriptHash: 0x05,
  wif: 0x80,
};
```