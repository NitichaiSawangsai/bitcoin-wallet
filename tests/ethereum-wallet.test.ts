import { EthereumWallet } from '../src/wallet/ethereum-wallet';
import { CurrencyService } from '../src/services/currency.service';

describe('EthereumWallet', () => {
  const testPrivateKey = '0x1234567890123456789012345678901234567890123456789012345678901234';

  describe('constructor', () => {
    test('should create wallet with provided private key', () => {
      const privateKeyBuffer = Buffer.from(testPrivateKey.slice(2), 'hex');
      const wallet = new EthereumWallet(privateKeyBuffer);
      
      expect(wallet.getAddress()).toBeDefined();
      expect(wallet.getAddress().startsWith('0x')).toBe(true);
    });

    test('should create wallet with generated private key when none provided', () => {
      const wallet = new EthereumWallet();
      
      expect(wallet.getAddress()).toBeDefined();
      expect(wallet.getAddress().startsWith('0x')).toBe(true);
      expect(wallet.getPrivateKey()).toBeDefined();
    });

    test('should generate different wallets when no private key provided', () => {
      const wallet1 = new EthereumWallet();
      const wallet2 = new EthereumWallet();
      
      expect(wallet1.getAddress()).not.toBe(wallet2.getAddress());
    });
  });

  describe('static factory methods', () => {
    test('should create wallet from private key hex', () => {
      const wallet = EthereumWallet.fromPrivateKeyHex(testPrivateKey);
      
      expect(wallet.getAddress()).toBeDefined();
      expect(wallet.getAddress().startsWith('0x')).toBe(true);
    });

    test('should create same wallet from same private key', () => {
      const wallet1 = EthereumWallet.fromPrivateKeyHex(testPrivateKey);
      const wallet2 = EthereumWallet.fromPrivateKeyHex(testPrivateKey);
      
      expect(wallet1.getAddress()).toBe(wallet2.getAddress());
    });

    test('should handle private key without 0x prefix', () => {
      const keyWithoutPrefix = testPrivateKey.slice(2);
      const wallet = EthereumWallet.fromPrivateKeyHex(keyWithoutPrefix);
      
      expect(wallet.getAddress()).toBeDefined();
      expect(wallet.getAddress().startsWith('0x')).toBe(true);
    });
  });

  describe('address validation', () => {
    test('should validate correct Ethereum addresses', () => {
      expect(EthereumWallet.isValidAddress('0x1234567890123456789012345678901234567890')).toBe(true);
      expect(EthereumWallet.isValidAddress('0xAbCdEf1234567890123456789012345678901234')).toBe(true);
      expect(EthereumWallet.isValidAddress('0x0000000000000000000000000000000000000000')).toBe(true);
    });

    test('should reject invalid Ethereum addresses', () => {
      expect(EthereumWallet.isValidAddress('1234567890123456789012345678901234567890')).toBe(false); // No 0x prefix
      expect(EthereumWallet.isValidAddress('0x12345')).toBe(false); // Too short
      expect(EthereumWallet.isValidAddress('0x123456789012345678901234567890123456789012')).toBe(false); // Too long
      expect(EthereumWallet.isValidAddress('0xZZZZ567890123456789012345678901234567890')).toBe(false); // Invalid hex
      expect(EthereumWallet.isValidAddress('')).toBe(false); // Empty string
    });
  });

  describe('Wei/Ether conversion', () => {
    test('should convert Wei to Ether correctly', () => {
      expect(EthereumWallet.weiToEther('1000000000000000000')).toBe('1'); // 1 ETH
      expect(EthereumWallet.weiToEther('500000000000000000')).toBe('0.5'); // 0.5 ETH
      expect(EthereumWallet.weiToEther('1')).toBe('0.000000000000000001'); // 1 wei
      expect(EthereumWallet.weiToEther('0')).toBe('0');
    });

    test('should convert Ether to Wei correctly', () => {
      expect(EthereumWallet.etherToWei('1')).toBe('1000000000000000000'); // 1 ETH
      expect(EthereumWallet.etherToWei('0.5')).toBe('500000000000000000'); // 0.5 ETH
      expect(EthereumWallet.etherToWei('0.000000000000000001')).toBe('1'); // 1 wei
      expect(EthereumWallet.etherToWei('0')).toBe('0');
    });

    test('should handle number inputs for conversion', () => {
      expect(EthereumWallet.weiToEther(1000000000000000000)).toBe('1');
      expect(EthereumWallet.etherToWei(1)).toBe('1000000000000000000');
    });
  });

  describe('ERC-20 operations', () => {
    test('should create ERC-20 transfer data', () => {
      const toAddress = '0x1234567890123456789012345678901234567890';
      const amount = '1000000'; // 1 USDC (6 decimals)
      
      const data = EthereumWallet.createERC20TransferData(toAddress, amount);
      
      expect(data).toBeDefined();
      expect(data.startsWith('0x')).toBe(true);
      expect(data.length).toBe(138); // 4 bytes function + 32 bytes address + 32 bytes amount = 68 bytes = 136 hex chars + 0x
    });

    test('should create different data for different addresses', () => {
      const address1 = '0x1234567890123456789012345678901234567890';
      const address2 = '0x0987654321098765432109876543210987654321';
      const amount = '1000000';
      
      const data1 = EthereumWallet.createERC20TransferData(address1, amount);
      const data2 = EthereumWallet.createERC20TransferData(address2, amount);
      
      expect(data1).not.toBe(data2);
    });

    test('should create different data for different amounts', () => {
      const toAddress = '0x1234567890123456789012345678901234567890';
      const amount1 = '1000000';
      const amount2 = '2000000';
      
      const data1 = EthereumWallet.createERC20TransferData(toAddress, amount1);
      const data2 = EthereumWallet.createERC20TransferData(toAddress, amount2);
      
      expect(data1).not.toBe(data2);
    });

    test('should start with transfer function signature', () => {
      const toAddress = '0x1234567890123456789012345678901234567890';
      const amount = '1000000';
      
      const data = EthereumWallet.createERC20TransferData(toAddress, amount);
      
      // transfer(address,uint256) function signature: 0xa9059cbb
      expect(data.startsWith('0xa9059cbb')).toBe(true);
    });
  });

  describe('gas estimation', () => {
    test('should estimate gas for ETH transfer', () => {
      const gasEstimate = EthereumWallet.estimateGas(false);
      
      expect(gasEstimate).toBe(21000);
      expect(typeof gasEstimate).toBe('number');
    });

    test('should estimate gas for ERC-20 token transfer', () => {
      const gasEstimate = EthereumWallet.estimateGas(true);
      
      expect(gasEstimate).toBe(65000);
      expect(typeof gasEstimate).toBe('number');
      expect(gasEstimate).toBeGreaterThan(21000); // Token transfers cost more
    });
  });

  describe('transaction creation', () => {
    let wallet: EthereumWallet;

    beforeEach(() => {
      wallet = new EthereumWallet();
    });

    test('should create ETH transaction', () => {
      const transaction = wallet.createTransaction(
        '0x1234567890123456789012345678901234567890',
        '1000000000000000000', // 1 ETH in wei
        '20000000000', // 20 gwei
        21000,
        0
      );
      
      expect(transaction).toBeDefined();
      expect(transaction.to).toBe('0x1234567890123456789012345678901234567890');
      expect(transaction.value).toBeDefined();
      expect(transaction.gasPrice).toBeDefined();
      expect(transaction.gasLimit).toBeDefined();
      expect(transaction.nonce).toBeDefined();
      expect(transaction.data).toBe('0x');
    });

    test('should create ERC-20 transaction with data', () => {
      const data = EthereumWallet.createERC20TransferData(
        '0x1234567890123456789012345678901234567890',
        '1000000'
      );
      
      const transaction = wallet.createTransaction(
        '0xA0b86a33E6441d86ab5b3D4F6d18dd15A2a0E6Ef', // USDC contract
        '0', // No ETH value for token transfer
        '20000000000',
        65000,
        0,
        data
      );
      
      expect(transaction).toBeDefined();
      expect(transaction.to).toBe('0xA0b86a33E6441d86ab5b3D4F6d18dd15A2a0E6Ef');
      expect(transaction.value).toBeDefined();
      expect(transaction.data).toBe(data);
    });
  });

  describe('transaction signing', () => {
    let wallet: EthereumWallet;

    beforeEach(() => {
      wallet = new EthereumWallet();
    });

    test('should sign transaction', () => {
      const transaction = wallet.createTransaction(
        '0x1234567890123456789012345678901234567890',
        '1000000000000000000',
        '20000000000',
        21000,
        0
      );
      
      const signedTx = wallet.signTransaction(transaction);
      
      expect(signedTx).toBeDefined();
      expect(typeof signedTx).toBe('string');
      expect(signedTx.startsWith('0x')).toBe(true);
    });

    test('should produce different signatures for different transactions', () => {
      const tx1 = wallet.createTransaction(
        '0x1234567890123456789012345678901234567890',
        '1000000000000000000',
        '20000000000',
        21000,
        0
      );
      
      const tx2 = wallet.createTransaction(
        '0x0987654321098765432109876543210987654321',
        '2000000000000000000',
        '20000000000',
        21000,
        1
      );
      
      const signed1 = wallet.signTransaction(tx1);
      const signed2 = wallet.signTransaction(tx2);
      
      expect(signed1).not.toBe(signed2);
    });
  });

  describe('token contract information', () => {
    test('should return contract addresses for known tokens', () => {
      expect(EthereumWallet.getTokenContractAddress('USDC')).toBeDefined();
      expect(EthereumWallet.getTokenContractAddress('USDT')).toBeDefined();
      expect(EthereumWallet.getTokenContractAddress('DAI')).toBeDefined();
      expect(EthereumWallet.getTokenContractAddress('LINK')).toBeDefined();
    });

    test('should return null for unknown tokens', () => {
      expect(EthereumWallet.getTokenContractAddress('UNKNOWN')).toBeNull();
      expect(EthereumWallet.getTokenContractAddress('')).toBeNull();
    });

    test('should identify ERC-20 tokens correctly', () => {
      const eth = CurrencyService.getCurrency('ETH')!;
      const usdc = CurrencyService.getCurrency('USDC')!;
      
      expect(EthereumWallet.isERC20Token(eth)).toBe(false);
      expect(EthereumWallet.isERC20Token(usdc)).toBe(true);
    });

    test('should return correct decimals for tokens', () => {
      expect(EthereumWallet.getTokenDecimals('ETH')).toBe(18);
      expect(EthereumWallet.getTokenDecimals('USDC')).toBe(6);
      expect(EthereumWallet.getTokenDecimals('USDT')).toBe(6);
      expect(EthereumWallet.getTokenDecimals('DAI')).toBe(18);
      expect(EthereumWallet.getTokenDecimals('UNKNOWN')).toBe(18); // Default
    });
  });

  describe('wallet properties', () => {
    test('should return address as string', () => {
      const wallet = new EthereumWallet();
      const address = wallet.getAddress();
      
      expect(typeof address).toBe('string');
      expect(address.startsWith('0x')).toBe(true);
      expect(address.length).toBe(42);
    });

    test('should return private key as buffer', () => {
      const wallet = new EthereumWallet();
      const privateKey = wallet.getPrivateKey();
      
      expect(Buffer.isBuffer(privateKey)).toBe(true);
      expect(privateKey.length).toBe(32);
    });

    test('should return public key as buffer', () => {
      const wallet = new EthereumWallet();
      const publicKey = wallet.getPublicKey();
      
      expect(Buffer.isBuffer(publicKey)).toBe(true);
      expect(publicKey.length).toBeGreaterThan(32);
    });
  });
});