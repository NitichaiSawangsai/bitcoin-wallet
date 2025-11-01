export interface WalletConfig {
  network: 'mainnet' | 'testnet';
  derivationPath: string;
  encryptionAlgorithm: string;
}

export interface WalletData {
  id: string;
  name: string;
  encryptedSeed: string;
  addresses: Address[];
  createdAt: Date;
  lastUsed: Date;
}

export interface Address {
  address: string;
  derivationPath: string;
  publicKey: string;
  balance: number;
  used: boolean;
  currency: CryptoCurrency;
}

export interface Transaction {
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

export interface UTXO {
  txId: string;
  outputIndex: number;
  amount: number;
  address: string;
  scriptPubKey: string;
  confirmations: number;
}

export interface CryptoCurrency {
  symbol: string;
  name: string;
  network: string;
  decimals: number;
  derivationPath: string;
}

export interface BackupData {
  wallets: WalletData[];
  version: string;
  timestamp: Date;
  checksum: string;
}

export interface BalanceInfo {
  confirmed: number;
  unconfirmed: number;
  total: number;
  currency: CryptoCurrency;
}

export interface CoinInfo {
  address: string;
  balance: BalanceInfo;
  transactions: Transaction[];
  utxos: UTXO[];
}