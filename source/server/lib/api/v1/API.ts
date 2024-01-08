
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

// Implementation =============================================================
 

export default class API {

    private declare app: express.Express
    private declare server: http.Server | https.Server

    public static i: API

    public static async init() {

        const self = new this()
        this.i = self

        self.app = express()

        logger.WARN(`Server running in HTTP mode`)
        self.server = http.createServer(self.app)

        this.bindAPI()

        await new Promise<void>(resolve => self.server.listen(Config.network.expose.http, Config.network.expose.ip, () => {
            const adr = self.server.address()!
            logger.INFO(`Listening on`, typeof adr === 'string' ? adr : `${adr.address}:${adr.port} (${adr.family})`)
            resolve()
        }))

    }

    private static bindAPI() {

        const useRateLimit = Config.network.rateLimiting.enabled
        const rateLimitOptions: Parameters<typeof rateLimit>[0] = {
            windowMs: Config.network.rateLimiting.timeWindow * 1000,
            limit: Config.network.rateLimiting.limit,
            standardHeaders: 'draft-7',
            legacyHeaders: true
        }

        const apiRouter = express.Router()
        const staticRouter = express.static(path.join(__dirname, '../../../../../.build/client'))
        
        if (useRateLimit) {
            this.i.app.use(rateLimit(rateLimitOptions))
            logger.DEBUG(`Enabled rate limiting | window:${rateLimitOptions.windowMs} limit:${rateLimitOptions.limit}`)
            logger.VERB(`rateLimitOptions`, rateLimitOptions)
        }

        apiRouter.use(bodyParser.json())
        apiRouter.use(cookieParser())

        this.i.app.use(RequestLogger.logger)

        this.i.app.use('/api', apiRouter)
        this.i.app.use('/', staticRouter)

    }
    
}