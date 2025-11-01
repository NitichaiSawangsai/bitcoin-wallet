import { WalletAPIServer } from './api/server';

async function startAPIServer(): Promise<void> {
  try {
    const port = parseInt(process.env.PORT || '3000');
    const server = new WalletAPIServer(port);
    
    await server.start();
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received. Shutting down gracefully...');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start API server:', error);
    process.exit(1);
  }
}

// เริ่ม API server
if (require.main === module) {
  startAPIServer().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}