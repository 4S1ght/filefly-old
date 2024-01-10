
// Imports ====================================================================

import c from 'chalk'
import type express from 'express'

import * as url from 'url'
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

import Logger from '../../../logging/Logger.js'
import Config from '../../../config/Config.js'

// Types ======================================================================

import type { TMiddleware } from '../API.js'

// Implementation =============================================================

export default class RequestLogger {

    private static id = 0

    private static getRequestID() {
        const id = (this.id++).toString(16).padStart(5, '0')
        if (id === 'fffff') this.id = 0
        return c.grey(id)
    }
    
    private static getStatusCodeColor(code: number) {
        if (code <= 199) return c.blue(code)
        if (code <= 299) return c.green(code)
        if (code <= 399) return c.cyan(code)
        if (code <= 599) return c.red(code)
    }

    public static logger: TMiddleware = (req, res, next) => {

        const logger = Logger.getScope(import.meta.url, 'network')

        const id = this.getRequestID()
        const method = c.green(req.method)
        const ip = c.grey(req.ip)
        const ua = req.headers['user-agent'] || 'N/A'
        const url = req.originalUrl
        const start = Date.now()
        const blankStatus = c.grey('###')
        const blankTime = c.grey('#####')
        const reqSign = c.grey('req')
        const resSign = c.whiteBright('res')

        logger.HTTP(`${id} ${reqSign} ${method} ${blankStatus} ${ip} ${blankTime} ${url} / ${ua}`)
        res.on('finish', () => {
            const time = (Date.now() - start + 'ms').padEnd(5, ' ')
            logger.HTTP(`${id} ${resSign} ${method} ${this.getStatusCodeColor(res.statusCode)} ${ip} ${time} ${url}`)
        })
    
        next()
    }

}