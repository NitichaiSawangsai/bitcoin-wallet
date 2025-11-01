import { WalletCLI } from './cli/wallet-cli';

async function main(): Promise<void> {
  try {
    const cli = new WalletCLI();
    await cli.start();
  } catch (error) {
    console.error('Fatal error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// เริ่มต้นโปรแกรม
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}