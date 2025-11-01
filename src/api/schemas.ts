/**
 * @swagger
 * components:
 *   schemas:
 *     Currency:
 *       type: object
 *       properties:
 *         symbol:
 *           type: string
 *           example: BTC
 *         name:
 *           type: string
 *           example: Bitcoin
 *         network:
 *           type: string
 *           example: mainnet
 *         decimals:
 *           type: integer
 *           example: 8
 *         derivationPath:
 *           type: string
 *           example: "m/44'/0'/0'"
 *     
 *     Wallet:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: wallet_1699123456789_a1b2c3d4
 *         name:
 *           type: string
 *           example: My Bitcoin Wallet
 *         encryptedSeed:
 *           type: string
 *           description: Encrypted mnemonic seed phrase
 *         addresses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Address'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         lastUsed:
 *           type: string
 *           format: date-time
 *     
 *     Address:
 *       type: object
 *       properties:
 *         address:
 *           type: string
 *           example: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
 *         derivationPath:
 *           type: string
 *           example: "m/44'/0'/0'/0/0"
 *         publicKey:
 *           type: string
 *           example: 03a0434d9e47f3c86235477c7b1ae6ae5d3442d49b1943c2b752a68e2a47e247c7
 *         balance:
 *           type: number
 *           example: 100000
 *         used:
 *           type: boolean
 *           example: false
 *         currency:
 *           $ref: '#/components/schemas/Currency'
 *     
 *     Balance:
 *       type: object
 *       properties:
 *         confirmed:
 *           type: number
 *           example: 100000
 *         unconfirmed:
 *           type: number
 *           example: 0
 *         total:
 *           type: number
 *           example: 100000
 *         currency:
 *           $ref: '#/components/schemas/Currency'
 *     
 *     Transaction:
 *       type: object
 *       properties:
 *         txId:
 *           type: string
 *           example: a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
 *         from:
 *           type: array
 *           items:
 *             type: string
 *           example: ["bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"]
 *         to:
 *           type: array
 *           items:
 *             type: string
 *           example: ["bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"]
 *         amount:
 *           type: number
 *           example: 100000
 *         fee:
 *           type: number
 *           example: 2000
 *         timestamp:
 *           type: string
 *           format: date-time
 *         confirmations:
 *           type: number
 *           example: 6
 *         status:
 *           type: string
 *           enum: [pending, confirmed, failed]
 *           example: confirmed
 *         currency:
 *           $ref: '#/components/schemas/Currency'
 *         rawTx:
 *           type: string
 *           example: 02000000010123456789abcdef...
 *     
 *     UTXO:
 *       type: object
 *       properties:
 *         txId:
 *           type: string
 *           example: a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
 *         outputIndex:
 *           type: number
 *           example: 0
 *         amount:
 *           type: number
 *           example: 100000
 *         address:
 *           type: string
 *           example: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
 *         scriptPubKey:
 *           type: string
 *           example: 0014123456789abcdef0123456789abcdef012345
 *         confirmations:
 *           type: number
 *           example: 6
 *     
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: Invalid password
 *     
 *     Success:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *         message:
 *           type: string
 *           example: Operation completed successfully
 */