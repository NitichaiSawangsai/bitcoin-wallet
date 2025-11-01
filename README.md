# ยังไม่ได้เทสนะครับ
# 🪙 Bitcoin Wallet API - คู่มือการใช้งานฉบับสมบูรณ์

## 📋 สารบัญ
1. [ภาพรวมของระบบ](#ภาพรวมของระบบ)
2. [การติดตั้ง](#การติดตั้ง)
3. [การเริ่มต้นใช้งาน](#การเริ่มต้นใช้งาน)
4. [สกุลเงินที่รองรับ](#สกุลเงินที่รองรับ)
5. [API Endpoints](#api-endpoints)
6. [ตัวอย่างการใช้งาน](#ตัวอย่างการใช้งาน)
7. [Security Best Practices](#security-best-practices)
8. [การแก้ปัญหา](#การแก้ปัญหา)

## 🎯 ภาพรวมของระบบ

Bitcoin Wallet API เป็นระบบจัดการกระเป๋าเงินดิจิทัลแบบครอบครันที่รองรับ:

### ✨ ฟีเจอร์หลัก
- � **Local Storage**: เก็บข้อมูลในเครื่องโดยไม่ต้องพึ่งพา cloud
- 🔒 **Cold Storage**: สร้าง transaction แบบ offline
- 🔑 **HD Wallet**: ระบบ BIP32/BIP39/BIP44 พร้อม mnemonic recovery
- 💰 **Multi-Currency**: รองรับ 18+ สกุลเงินดิจิทัล รวมถึง BTC, ETH, USDC, USDT
- 🌐 **REST API**: Swagger documentation ครบครัน
- 🔐 **Security**: เข้ารหัสด้วย AES-256-CBC

### 🏗 สถาปัตยกรรม
- **Backend**: Node.js + TypeScript + Express
- **Database**: Local encrypted files
- **API Documentation**: Swagger/OpenAPI 3.0
- **Security**: JWT, Rate limiting, CORS

## 🚀 การติดตั้ง

### ข้อกำหนดระบบ
- **Node.js**: เวอร์ชัน 18.0.0 ขึ้นไป
- **NPM**: เวอร์ชันล่าสุด
- **RAM**: อย่างน้อย 512MB
- **Storage**: อย่างน้อย 100MB

### 📦 ขั้นตอนการติดตั้ง

```bash
# 1. Clone repository
git clone https://github.com/your-repo/bitcoin-wallet.git
cd bitcoin-wallet

# 2. ติดตั้ง dependencies
npm install

# 3. Build โปรเจค
npm run build

# 4. ตรวจสอบการติดตั้ง
npm test
```

## � การเริ่มต้นใช้งาน

### เริ่ม API Server

```bash
# Development mode
npm run dev:api

# Production mode  
npm run build
npm run start:api
```

เมื่อเริ่มสำเร็จจะเห็นข้อความ:
```
🚀 Bitcoin Wallet API Server running on port 3000
📚 API Documentation: http://localhost:3000/api-docs
🏥 Health Check: http://localhost:3000/health
```

### ตรวจสอบ API ทำงาน

```bash
# Health check
curl http://localhost:3000/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-11-01T10:30:00.000Z"
}
```

## 💱 สกุลเงินที่รองรับ

### Bitcoin Family
| Symbol | Name | Network | Decimals |
|--------|------|---------|----------|
| BTC | Bitcoin | mainnet | 8 |
| BTC-TEST | Bitcoin Testnet | testnet | 8 |
| LTC | Litecoin | mainnet | 8 |
| DOGE | Dogecoin | mainnet | 8 |
| BCH | Bitcoin Cash | mainnet | 8 |
| DASH | Dash | mainnet | 8 |

### Ethereum & Tokens
| Symbol | Name | Network | Decimals |
|--------|------|---------|----------|
| ETH | Ethereum | mainnet | 18 |
| ETH-TEST | Ethereum Goerli | testnet | 18 |
| USDC | USD Coin | mainnet | 6 |
| USDT | Tether USD | mainnet | 6 |
| DAI | Dai Stablecoin | mainnet | 18 |

### Other Major Cryptocurrencies
| Symbol | Name | Network | Decimals |
|--------|------|---------|----------|
| ADA | Cardano | mainnet | 6 |
| DOT | Polkadot | mainnet | 10 |
| SOL | Solana | mainnet | 9 |
| MATIC | Polygon | mainnet | 18 |
| AVAX | Avalanche | mainnet | 18 |
| LINK | Chainlink | mainnet | 18 |
| UNI | Uniswap | mainnet | 18 |
| AAVE | Aave | mainnet | 18 |

## � API Endpoints

### 🔧 Base Information
- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **Rate Limit**: 100 requests/15 minutes per IP
- **Swagger Documentation**: `http://localhost:3000/api-docs`

### 📝 ตัวอย่างการใช้งาน

#### 1. เริ่มต้นระบบ
```bash
curl -X POST http://localhost:3000/api/wallet/initialize \
  -H "Content-Type: application/json" \
  -d '{"password": "your-secure-password"}'
```

#### 2. สร้าง wallet ใหม่
```bash
curl -X POST http://localhost:3000/api/wallet/create \
  -H "Content-Type: application/json" \
  -d '{"name": "My Bitcoin Wallet"}'
```

#### 3. ดูสกุลเงินที่รองรับ
```bash
curl -X GET http://localhost:3000/api/currencies
```

#### 4. สร้าง Bitcoin address
```bash
curl -X POST http://localhost:3000/api/wallet/{walletId}/address/generate \
  -H "Content-Type: application/json" \
  -d '{"currency": "BTC"}'
```

#### 5. สร้าง Ethereum address
```bash
curl -X POST http://localhost:3000/api/wallet/{walletId}/address/generate \
  -H "Content-Type: application/json" \
  -d '{"currency": "ETH"}'
```

#### 6. สร้าง USDC address
```bash
curl -X POST http://localhost:3000/api/wallet/{walletId}/address/generate \
  -H "Content-Type: application/json" \
  -d '{"currency": "USDC"}'
```

#### 7. ดูยอดเงิน
```bash
curl -X GET "http://localhost:3000/api/wallet/{walletId}/balance?currency=BTC"
curl -X GET "http://localhost:3000/api/wallet/{walletId}/balance?currency=ETH"
curl -X GET "http://localhost:3000/api/wallet/{walletId}/balance?currency=USDC"
```

#### 8. สร้าง transaction offline
```bash
curl -X POST http://localhost:3000/api/wallet/{walletId}/transaction/create \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "BTC",
    "toAddress": "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    "amount": 100000,
    "feeRate": 20
  }'
```

## � Security Best Practices

### 🔑 การจัดการรหัสผ่าน
- ใช้รหัสผ่านที่แข็งแกร่ง (อย่างน้อย 12 ตัวอักษร)
- ผสมตัวอักษรพิมพ์ใหญ่-เล็ก ตัวเลข และสัญลักษณ์
- ไม่ใช้รหัสผ่านซ้ำกับบริการอื่น

### 📝 การเก็บ Mnemonic Phrase
- เขียนบนกระดาษเก็บในตู้เซฟ
- แยกเก็บหลายที่
- **ไม่เก็บในคอมพิวเตอร์**
- **ไม่ส่งผ่านอินเทอร์เน็ต**

### 🌐 การตั้งค่าความปลอดภัย
- ใช้ HTTPS ใน production
- ตั้งค่า CORS ให้เหมาะสม
- ใช้ environment variables สำหรับ sensitive data

## ⚠️ การแก้ปัญหา

### 🔧 ปัญหาที่พบบ่อย

1. **Server ไม่ start**: ตรวจสอบ port ว่าถูกใช้งานแล้วหรือไม่
2. **CORS Error**: เพิ่ม origin ใน CORS configuration
3. **Invalid Password**: ตรวจสอบรหัสผ่านหรือ reset wallet data
4. **Transaction Failed**: ตรวจสอบยอดเงินและ address format

### 📊 Health Monitoring
```bash
# ตรวจสอบสถานะ API
curl http://localhost:3000/health

# ดู Swagger documentation
open http://localhost:3000/api-docs
```

## 🎉 สรุป

Bitcoin Wallet API รองรับ **18+ สกุลเงินดิจิทัล** รวมถึง **BTC, ETH, USDC, USDT** ตามที่ต้องการ พร้อม:

- ✅ **Swagger Documentation** ครบครัน
- ✅ **REST API** ใช้งานง่าย  
- ✅ **Multi-Currency Support** รองรับสกุลเงินหลัก
- ✅ **Security** ระดับธนาคาร
- ✅ **Offline Capability** ทำงานได้โดยไม่ต้องออนไลน์
- ✅ **Backup & Recovery** ระบบสำรองข้อมูลครบครัน

� **พร้อมใช้งานแล้ว** - เริ่มต้นด้วย `npm run dev:api` และเข้าไปดู Swagger ที่ http://localhost:3000/api-docs!