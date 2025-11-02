import { CurrencyService } from '../src/services/currency.service';

describe('CurrencyService', () => {
  const btc = CurrencyService.getCurrency('BTC')!;
  const eth = CurrencyService.getCurrency('ETH')!;
  const usdc = CurrencyService.getCurrency('USDC')!;

  describe('SUPPORTED_CURRENCIES', () => {
    test('should return all supported currencies', () => {
      const currencies = CurrencyService.SUPPORTED_CURRENCIES;
      
      expect(Array.isArray(currencies)).toBe(true);
      expect(currencies.length).toBeGreaterThan(0);
    });

    test('should include required currency properties', () => {
      const currencies = CurrencyService.SUPPORTED_CURRENCIES;
      const symbols = currencies.map((c: any) => c.symbol);
      
      expect(symbols).toContain('BTC');
      expect(symbols).toContain('ETH');
      expect(symbols).toContain('USDC');
      expect(symbols).toContain('USDT');
    });

    test('should have required properties for each currency', () => {
      const currencies = CurrencyService.SUPPORTED_CURRENCIES;
      const symbols = currencies.map((c: any) => c.symbol);
      
      symbols.forEach((symbol: string) => {
        const currency = CurrencyService.getCurrency(symbol);
        expect(currency).toBeDefined();
        expect(currency!.symbol).toBe(symbol);
        expect(currency!.name).toBeDefined();
        expect(currency!.decimals).toBeGreaterThanOrEqual(0);
        expect(currency!.derivationPath).toBeDefined();
      });
    });

    test('should include both mainnet and testnet currencies', () => {
      const currencies = CurrencyService.SUPPORTED_CURRENCIES;
      const symbols = currencies.map((c: any) => c.symbol);
      
      expect(symbols).toContain('BTC');
      expect(symbols).toContain('BTC-TEST');
      expect(symbols).toContain('ETH');
      expect(symbols).toContain('ETH-TEST');
    });

    test('should have unique symbols', () => {
      const currencies = CurrencyService.SUPPORTED_CURRENCIES;
      const symbols = currencies.map((c: any) => c.symbol);
      const uniqueSymbols = [...new Set(symbols)];
      
      expect(symbols.length).toBe(uniqueSymbols.length);
    });
  });

  describe('getCurrency', () => {
    test('should return currency for valid symbol', () => {
      const currency = CurrencyService.getCurrency('BTC');
      
      expect(currency).toBeDefined();
      expect(currency!.symbol).toBe('BTC');
      expect(currency!.name).toBe('Bitcoin');
    });

    test('should return undefined for invalid symbol', () => {
      const currency = CurrencyService.getCurrency('INVALID');
      
      expect(currency).toBeUndefined();
    });

    test('should be case insensitive', () => {
      const currency = CurrencyService.getCurrency('btc');
      
      expect(currency).toBeDefined(); // getCurrency actually uses case-insensitive search
    });
  });

  describe('isSupported', () => {
    test('should return true for supported currencies', () => {
      expect(CurrencyService.isSupported('BTC')).toBe(true);
      expect(CurrencyService.isSupported('ETH')).toBe(true);
      expect(CurrencyService.isSupported('USDC')).toBe(true);
      expect(CurrencyService.isSupported('USDT')).toBe(true);
    });

    test('should return false for unsupported currencies', () => {
      expect(CurrencyService.isSupported('INVALID')).toBe(false);
      expect(CurrencyService.isSupported('UNKNOWN')).toBe(false);
      expect(CurrencyService.isSupported('')).toBe(false);
    });
  });

  describe('conversion methods', () => {
    test('should convert from satoshi correctly', () => {
      expect(CurrencyService.fromSatoshi(100000000, btc)).toBe(1); // 1 BTC
      expect(CurrencyService.fromSatoshi(1000000, usdc)).toBe(1); // 1 USDC (6 decimals)
    });

    test('should convert to satoshi correctly', () => {
      expect(CurrencyService.toSatoshi(1, btc)).toBe(100000000); // 1 BTC
      expect(CurrencyService.toSatoshi(1, usdc)).toBe(1000000); // 1 USDC (6 decimals)
    });

    test('should handle fractional amounts', () => {
      expect(CurrencyService.fromSatoshi(50000000, btc)).toBe(0.5); // 0.5 BTC
      expect(CurrencyService.toSatoshi(0.5, btc)).toBe(50000000);
    });
  });

  describe('formatAmount', () => {
    test('should format BTC amounts correctly', () => {
      const formatted = CurrencyService.formatAmount(100000000, btc); // 1 BTC
      expect(formatted).toBe('1.00000000 BTC');
    });

    test('should format ETH amounts correctly', () => {
      const formatted = CurrencyService.formatAmount(1000000000000000000, eth); // 1 ETH in wei
      expect(formatted).toBe('1.000000000000000000 ETH');
    });

    test('should format USDC amounts correctly', () => {
      const formatted = CurrencyService.formatAmount(1500000, usdc); // 1.5 USDC
      expect(formatted).toBe('1.500000 USDC');
    });

    test('should handle zero amounts', () => {
      const formatted = CurrencyService.formatAmount(0, btc);
      expect(formatted).toBe('0.00000000 BTC');
    });

    test('should handle very small amounts', () => {
      const formatted = CurrencyService.formatAmount(1, btc); // 1 satoshi
      expect(formatted).toBe('0.00000001 BTC');
    });
  });

  describe('isValidAmount', () => {
    test('should validate positive amounts', () => {
      expect(CurrencyService.isValidAmount(1, btc)).toBe(true);
      expect(CurrencyService.isValidAmount(0.00000001, btc)).toBe(true); // 1 satoshi
    });

    test('should reject zero and negative amounts', () => {
      expect(CurrencyService.isValidAmount(0, btc)).toBe(false);
      expect(CurrencyService.isValidAmount(-1, btc)).toBe(false);
    });

    test('should handle precision correctly', () => {
      // Test with amount that has valid precision for BTC (8 decimals)
      expect(CurrencyService.isValidAmount(0.00000001, btc)).toBe(true); // 1 satoshi
      expect(CurrencyService.isValidAmount(0.12345678, btc)).toBe(true); // 8 decimals exactly
    });

    test('should reject infinite and NaN values', () => {
      expect(CurrencyService.isValidAmount(Infinity, btc)).toBe(false);
      expect(CurrencyService.isValidAmount(-Infinity, btc)).toBe(false);
      expect(CurrencyService.isValidAmount(NaN, btc)).toBe(false);
    });
  });

  describe('currency lists', () => {
    test('should return all currencies', () => {
      const currencies = CurrencyService.getAllCurrencies();
      expect(currencies.length).toBeGreaterThan(0);
      expect(currencies).toEqual(CurrencyService.SUPPORTED_CURRENCIES);
    });

    test('should filter mainnet currencies', () => {
      const mainnetCurrencies = CurrencyService.getMainnetCurrencies();
      mainnetCurrencies.forEach(currency => {
        expect(currency.network).toBe('mainnet');
      });
      
      expect(mainnetCurrencies.some(c => c.symbol === 'BTC')).toBe(true);
      expect(mainnetCurrencies.some(c => c.symbol === 'BTC-TEST')).toBe(false);
    });

    test('should filter testnet currencies', () => {
      const testnetCurrencies = CurrencyService.getTestnetCurrencies();
      testnetCurrencies.forEach(currency => {
        expect(currency.network).toBe('testnet');
      });
      
      expect(testnetCurrencies.some(c => c.symbol === 'BTC-TEST')).toBe(true);
      expect(testnetCurrencies.some(c => c.symbol === 'BTC')).toBe(false);
    });
  });

  describe('fee calculation', () => {
    test('should provide recommended fee rates', () => {
      const btcFeeRate = CurrencyService.getRecommendedFeeRate(btc);
      expect(btcFeeRate).toBeGreaterThan(0);
      expect(typeof btcFeeRate).toBe('number');
    });

    test('should estimate transaction size', () => {
      const size = CurrencyService.estimateTransactionSize(2, 2); // 2 inputs, 2 outputs
      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    test('should calculate fees correctly', () => {
      const fee = CurrencyService.calculateFee(1, 2, btc); // 1 input, 2 outputs
      expect(fee).toBeGreaterThan(0);
      expect(typeof fee).toBe('number');
    });

    test('should use custom fee rate when provided', () => {
      const customFeeRate = 50;
      const fee = CurrencyService.calculateFee(1, 2, btc, customFeeRate);
      const expectedSize = CurrencyService.estimateTransactionSize(1, 2);
      expect(fee).toBe(expectedSize * customFeeRate);
    });
  });
});