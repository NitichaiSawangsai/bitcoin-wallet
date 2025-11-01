import * as ethereumjsWallet from 'ethereumjs-wallet';
import { Web3 } from 'web3';
import { CryptoCurrency } from '../types';

export class EthereumWallet {
  private wallet: any;
  private web3: Web3;

  constructor(privateKey?: Buffer) {
    if (privateKey) {
      this.wallet = ethereumjsWallet.default.fromPrivateKey(privateKey);
    } else {
      this.wallet = ethereumjsWallet.default.generate();
    }
    
    // Initialize web3 for future use
    this.web3 = new Web3();
  }

  /**
   * ดึง Ethereum address
   */
  getAddress(): string {
    return this.wallet.getAddressString();
  }

  /**
   * ดึง private key
   */
  getPrivateKey(): Buffer {
    return this.wallet.getPrivateKey();
  }

  /**
   * ดึง public key
   */
  getPublicKey(): Buffer {
    return this.wallet.getPublicKey();
  }

  /**
   * สร้าง Ethereum wallet จาก private key hex
   */
  static fromPrivateKeyHex(privateKeyHex: string): EthereumWallet {
    const privateKey = Buffer.from(privateKeyHex.replace('0x', ''), 'hex');
    return new EthereumWallet(privateKey);
  }

  /**
   * ตรวจสอบว่า address ถูกต้องหรือไม่
   */
  static isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * แปลง Wei เป็น Ether
   */
  static weiToEther(wei: string | number): string {
    const web3 = new Web3();
    return web3.utils.fromWei(wei.toString(), 'ether');
  }

  /**
   * แปลง Ether เป็น Wei
   */
  static etherToWei(ether: string | number): string {
    const web3 = new Web3();
    return web3.utils.toWei(ether.toString(), 'ether');
  }

  /**
   * สร้าง transaction data สำหรับ ERC-20 transfer
   */
  static createERC20TransferData(to: string, amount: string): string {
    const web3 = new Web3();
    
    // ERC-20 transfer function signature: transfer(address,uint256)
    const functionSignature = web3.utils.keccak256('transfer(address,uint256)').slice(0, 10);
    
    // Encode parameters
    const toAddress = web3.utils.padLeft(to.replace('0x', ''), 64);
    const tokenAmount = web3.utils.padLeft(web3.utils.toHex(amount).replace('0x', ''), 64);
    
    return functionSignature + toAddress + tokenAmount;
  }

  /**
   * คำนวณ gas สำหรับ transaction
   */
  static estimateGas(isTokenTransfer: boolean = false): number {
    if (isTokenTransfer) {
      return 65000; // ERC-20 transfer โดยประมาณ
    }
    return 21000; // ETH transfer พื้นฐาน
  }

  /**
   * สร้าง transaction object
   */
  createTransaction(
    to: string,
    value: string,
    gasPrice: string,
    gasLimit: number,
    nonce: number,
    data?: string
  ): any {
    return {
      to,
      value: this.web3.utils.toHex(value),
      gasPrice: this.web3.utils.toHex(gasPrice),
      gasLimit: this.web3.utils.toHex(gasLimit),
      nonce: this.web3.utils.toHex(nonce),
      data: data || '0x'
    };
  }

  /**
   * ลงนาม transaction
   */
  signTransaction(transaction: any): string {
    // Note: ในการใช้งานจริงควรใช้ @ethereumjs/tx
    // นี่เป็นการจำลองสำหรับ demo
    const serializedTx = JSON.stringify(transaction);
    return `0x${Buffer.from(serializedTx).toString('hex')}`;
  }

  /**
   * ดึงข้อมูล contract address สำหรับ tokens
   */
  static getTokenContractAddress(symbol: string): string | null {
    const tokenContracts: { [key: string]: string } = {
      'USDC': '0xA0b86a33E6441d86ab5b3D4F6d18dd15A2a0E6Ef', // USDC Mainnet
      'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT Mainnet
      'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',  // DAI Mainnet
      'LINK': '0x514910771AF9Ca656af840dff83E8264EcF986CA', // LINK Mainnet
      'UNI': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',  // UNI Mainnet
      'AAVE': '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', // AAVE Mainnet
      'MATIC': '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0' // MATIC Mainnet
    };

    return tokenContracts[symbol] || null;
  }

  /**
   * ตรวจสอบว่าเป็น ERC-20 token หรือไม่
   */
  static isERC20Token(currency: CryptoCurrency): boolean {
    const erc20Tokens = ['USDC', 'USDT', 'DAI', 'LINK', 'UNI', 'AAVE', 'MATIC'];
    return erc20Tokens.includes(currency.symbol);
  }

  /**
   * ดึงจำนวนทศนิยมสำหรับ token
   */
  static getTokenDecimals(symbol: string): number {
    const decimals: { [key: string]: number } = {
      'ETH': 18,
      'USDC': 6,
      'USDT': 6,
      'DAI': 18,
      'LINK': 18,
      'UNI': 18,
      'AAVE': 18,
      'MATIC': 18
    };

    return decimals[symbol] || 18;
  }
}