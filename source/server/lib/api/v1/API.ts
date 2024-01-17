
// Imports ====================================================================

import path from 'path'
import http from 'http'
import https from 'https'
import express from 'express'

import * as url from 'url'
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

import Config from '../../config/Config.js'
import Logger from '../../logging/Logger.js'

const logger = Logger.getScope(import.meta.url, )

// Middleware =================================================================

import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import rateLimit from 'express-rate-limit'
import RequestLogger from './middleware/RequestLogger.js'

// Types ======================================================================

export type TMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => any
export type THandler = (req: express.Request, res: express.Response) => any

export type THandlerSetup = () => THandler

// Handlers ===================================================================

import login from './post/Login.js'
import sessionRenew from './get/SessionRenew.js'
import sessionInfo from './get/SessionInfo.js'

// Implementation =============================================================
 
export default new class API {

    private declare app: express.Express
    private declare server: http.Server | https.Server

    public async init() {

        this.app = express()
        this.app.disable('x-powered-by')

        logger.WARN(`Server running in HTTP mode`)
        this.server = http.createServer(this.app)

        this.bindAPI()

        // TODO: Use specified hostname in PROD and omit it in DEV
        // await new Promise<void>(resolve => this.server.listen(Config.network.expose.http, Config.network.expose.ip, () => {
        await new Promise<void>(resolve => this.server.listen(Config.network.expose.http, () => {
            const adr = this.server.address()!
            logger.INFO(`Listening on`, typeof adr === 'string' ? adr : `${adr.address}:${adr.port} (${adr.family})`)
            resolve()
        }))

    }

    public close() {
        return new Promise<void>((resolve, reject) => {
            this.server.close((error) => {
                error ? reject(error) : resolve()
            })
        })
    }

    private bindAPI() {

        const useRateLimit = Config.network.rateLimiting.enabled
        const rateLimitOptions: Parameters<typeof rateLimit>[0] = {
            windowMs: Config.network.rateLimiting.timeWindow * 1000,
            limit: Config.network.rateLimiting.limit,
            standardHeaders: 'draft-7',
            legacyHeaders: false
        }

        const apiRouter = express.Router()
        const staticRouter = express.static(path.join(__dirname, '../../../../../build/client'))
        
        if (useRateLimit) {
            this.app.use(rateLimit(rateLimitOptions))
            logger.DEBUG(`Enabled rate limiting | window:${rateLimitOptions.windowMs} limit:${rateLimitOptions.limit}`)
            logger.VERB(`API.bindAPI() call: rateLimitOptions`, rateLimitOptions)
        }

        this.app.use(RequestLogger.logger)
        this.app.use('/api/v1', apiRouter)
        this.app.use('/', staticRouter)

        apiRouter.use(bodyParser.json())
        apiRouter.use(cookieParser())

        apiRouter.post('/session/new', login())
        apiRouter.get('/session/renew', sessionRenew())
        apiRouter.get('/session/info', sessionInfo())

    }
    
}