import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { WalletManager } from '../wallet/wallet-manager';
import { CurrencyService } from '../services/currency.service';
import { StorageService } from '../services/storage.service';

export class WalletAPIServer {
  private app: express.Application;
  private walletManager: WalletManager;
  private port: number;

  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;
    this.walletManager = new WalletManager();
    this.setupMiddleware();
    this.setupSwagger();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * ตั้งค่า middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.'
      }
    });
    this.app.use('/api/', limiter);

    // Logging
    this.app.use(morgan('combined'));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Health check
    this.app.get('/health', (_req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
  }

  /**
   * ตั้งค่า Swagger documentation
   */
  private setupSwagger(): void {
    const options = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'Bitcoin Wallet API',
          version: '1.0.0',
          description: 'Comprehensive cryptocurrency wallet API supporting Bitcoin, Ethereum, and various tokens',
          contact: {
            name: 'Bitcoin Wallet Support',
            email: 'support@bitcoinwallet.com'
          },
          license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
          }
        },
        servers: [
          {
            url: `http://localhost:${this.port}`,
            description: 'Development server'
          }
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            }
          }
        }
      },
      apis: ['./src/api/*.ts', './src/api/routes/*.ts'], // paths to files containing OpenAPI definitions
    };

    const specs = swaggerJsdoc(options);
    this.app.use('/api-docs', swaggerUi.serve);
    this.app.get('/api-docs', swaggerUi.setup(specs));
  }

  /**
   * ตั้งค่า routes
   */
  private setupRoutes(): void {
    // API routes
    this.app.use('/api', this.createAPIRoutes());
  }

  /**
   * สร้าง API routes
   */
  private createAPIRoutes(): express.Router {
    const router = express.Router();

    /**
     * @swagger
     * /api/currencies:
     *   get:
     *     summary: Get supported cryptocurrencies
     *     tags: [Currencies]
     *     responses:
     *       200:
     *         description: List of supported cryptocurrencies
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Currency'
     */
    router.get('/currencies', (_req, res) => {
      try {
        const currencies = CurrencyService.getAllCurrencies();
        res.json({
          success: true,
          data: currencies
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    /**
     * @swagger
     * /api/wallet/initialize:
     *   post:
     *     summary: Initialize wallet manager
     *     tags: [Wallet]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - password
     *             properties:
     *               password:
     *                 type: string
     *                 description: Master password for wallet encryption
     *     responses:
     *       200:
     *         description: Wallet manager initialized successfully
     *       400:
     *         description: Invalid request
     *       500:
     *         description: Server error
     */
    router.post('/wallet/initialize', async (req, res) => {
      try {
        const { password } = req.body;
        
        if (!password) {
          return res.status(400).json({
            success: false,
            error: 'Password is required'
          });
        }

        await this.walletManager.initialize(password);
        
        return res.json({
          success: true,
          message: 'Wallet manager initialized successfully'
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    /**
     * @swagger
     * /api/wallet/create:
     *   post:
     *     summary: Create a new wallet
     *     tags: [Wallet]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *             properties:
     *               name:
     *                 type: string
     *                 description: Name for the new wallet
     *               mnemonic:
     *                 type: string
     *                 description: Optional mnemonic phrase for wallet recovery
     *     responses:
     *       200:
     *         description: Wallet created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   type: object
     *                   properties:
     *                     walletId:
     *                       type: string
     *                     mnemonic:
     *                       type: string
     */
    router.post('/wallet/create', async (req, res) => {
      try {
        const { name, mnemonic } = req.body;
        
        if (!name) {
          return res.status(400).json({
            success: false,
            error: 'Wallet name is required'
          });
        }

        const result = await this.walletManager.createWallet(name, mnemonic);
        
        return res.json({
          success: true,
          data: result
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    /**
     * @swagger
     * /api/wallet/list:
     *   get:
     *     summary: Get all wallets
     *     tags: [Wallet]
     *     responses:
     *       200:
     *         description: List of all wallets
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Wallet'
     */
    router.get('/wallet/list', (_req, res) => {
      try {
        const wallets = this.walletManager.getWallets();
        res.json({
          success: true,
          data: wallets
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    /**
     * @swagger
     * /api/wallet/{walletId}/balance:
     *   get:
     *     summary: Get wallet balance for specific currency
     *     tags: [Wallet]
     *     parameters:
     *       - in: path
     *         name: walletId
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: currency
     *         required: true
     *         schema:
     *           type: string
     *           example: BTC
     *     responses:
     *       200:
     *         description: Wallet balance information
     */
    router.get('/wallet/:walletId/balance', (req, res) => {
      try {
        const { walletId } = req.params;
        const { currency } = req.query;
        
        if (!currency) {
          return res.status(400).json({
            success: false,
            error: 'Currency parameter is required'
          });
        }

        const currencyInfo = CurrencyService.getCurrency(currency as string);
        if (!currencyInfo) {
          return res.status(400).json({
            success: false,
            error: 'Unsupported currency'
          });
        }

        const balance = this.walletManager.getBalance(walletId, currencyInfo);
        
        return res.json({
          success: true,
          data: balance
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    /**
     * @swagger
     * /api/wallet/{walletId}/address/generate:
     *   post:
     *     summary: Generate new address for wallet
     *     tags: [Address]
     *     parameters:
     *       - in: path
     *         name: walletId
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - currency
     *             properties:
     *               currency:
     *                 type: string
     *                 example: BTC
     *     responses:
     *       200:
     *         description: New address generated successfully
     */
    router.post('/wallet/:walletId/address/generate', async (req, res) => {
      try {
        const { walletId } = req.params;
        const { currency } = req.body;
        
        if (!currency) {
          return res.status(400).json({
            success: false,
            error: 'Currency is required'
          });
        }

        const currencyInfo = CurrencyService.getCurrency(currency);
        if (!currencyInfo) {
          return res.status(400).json({
            success: false,
            error: 'Unsupported currency'
          });
        }

        const address = await this.walletManager.generateNewAddress(walletId, currencyInfo);
        
        return res.json({
          success: true,
          data: address
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    /**
     * @swagger
     * /api/wallet/{walletId}/addresses:
     *   get:
     *     summary: Get all addresses for wallet
     *     tags: [Address]
     *     parameters:
     *       - in: path
     *         name: walletId
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: currency
     *         schema:
     *           type: string
     *           example: BTC
     *     responses:
     *       200:
     *         description: List of addresses
     */
    router.get('/wallet/:walletId/addresses', (req, res) => {
      try {
        const { walletId } = req.params;
        const { currency } = req.query;
        
        let currencyInfo;
        if (currency) {
          currencyInfo = CurrencyService.getCurrency(currency as string);
          if (!currencyInfo) {
            return res.status(400).json({
              success: false,
              error: 'Unsupported currency'
            });
          }
        }

        const addresses = this.walletManager.getAddresses(walletId, currencyInfo);
        
        return res.json({
          success: true,
          data: addresses
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    /**
     * @swagger
     * /api/wallet/{walletId}/transaction/create:
     *   post:
     *     summary: Create offline transaction
     *     tags: [Transaction]
     *     parameters:
     *       - in: path
     *         name: walletId
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - currency
     *               - toAddress
     *               - amount
     *             properties:
     *               currency:
     *                 type: string
     *                 example: BTC
     *               toAddress:
     *                 type: string
     *                 example: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
     *               amount:
     *                 type: number
     *                 example: 100000
     *               feeRate:
     *                 type: number
     *                 example: 20
     *     responses:
     *       200:
     *         description: Transaction created successfully
     */
    router.post('/wallet/:walletId/transaction/create', async (req, res) => {
      try {
        const { walletId } = req.params;
        const { currency, toAddress, amount, feeRate } = req.body;
        
        if (!currency || !toAddress || !amount) {
          return res.status(400).json({
            success: false,
            error: 'Currency, toAddress, and amount are required'
          });
        }

        const currencyInfo = CurrencyService.getCurrency(currency);
        if (!currencyInfo) {
          return res.status(400).json({
            success: false,
            error: 'Unsupported currency'
          });
        }

        const transaction = await this.walletManager.createTransaction(
          walletId,
          currencyInfo,
          toAddress,
          amount,
          feeRate
        );
        
        return res.json({
          success: true,
          data: transaction
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    /**
     * @swagger
     * /api/backup/create:
     *   post:
     *     summary: Create wallet backup
     *     tags: [Backup]
     *     responses:
     *       200:
     *         description: Backup created successfully
     */
    router.post('/backup/create', async (_req, res) => {
      try {
        const backupPath = await this.walletManager.createBackup();
        
        res.json({
          success: true,
          data: {
            backupPath,
            message: 'Backup created successfully'
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    /**
     * @swagger
     * /api/backup/list:
     *   get:
     *     summary: List available backups
     *     tags: [Backup]
     *     responses:
     *       200:
     *         description: List of backup files
     */
    router.get('/backup/list', (_req, res) => {
      try {
        const backups = StorageService.listBackups();
        
        res.json({
          success: true,
          data: backups
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    return router;
  }

  /**
   * ตั้งค่า error handling
   */
  private setupErrorHandling(): void {
    // 404 handler
    // Handle 404 for unmatched routes
    this.app.use((_req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found'
      });
    });

    // Global error handler
    this.app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('Global error:', err);
      
      res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error'
      });
    });
  }

  /**
   * เริ่ม server
   */
  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`🚀 Bitcoin Wallet API Server running on port ${this.port}`);
        console.log(`📚 API Documentation: http://localhost:${this.port}/api-docs`);
        console.log(`🏥 Health Check: http://localhost:${this.port}/health`);
        resolve();
      });
    });
  }

  /**
   * ดึง Express app สำหรับ testing
   */
  public getApp(): express.Application {
    return this.app;
  }
}