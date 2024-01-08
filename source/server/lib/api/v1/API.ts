
// Imports ====================================================================

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
            logger.INFO(`Listening on port ${Config.network.expose.http}`)
            resolve()
        }))

    }

    private static bindAPI() {
        
        this.i.app.use(bodyParser.json())
        this.i.app.use(cookieParser())
    }
    
}