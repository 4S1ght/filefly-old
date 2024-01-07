
// Imports ====================================================================

import path from 'path'
import winston from 'winston'
import 'winston-daily-rotate-file'
import c from 'chalk'

import * as url from 'url'
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

import Config from '../config/Config.js'

// Types ======================================================================

// Implementation =============================================================

export default new class Logger {

    private declare winston: winston.Logger

    private labels: Record<string, string> = {
        error:   'ERRO',
        warn:    'WARN',
        info:    'INFO',
        http:    'HTTP',
        debug:   'DEBG',
        verbose: "VERB"
    }

    private labelsColored: Record<string, string> =  {
        error:   c.redBright('ERRO'),
        warn:    c.yellowBright('WARN'),
        info:    c.greenBright('INFO'),
        http:    c.blueBright('HTTP'),
        debug:   c.magentaBright('DEBG'),
        verbose: c.cyanBright('VERB')
    }

    private formats = {
        console: winston.format.printf(x => {
            return `${c.grey(x.timestamp)} ${this.labelsColored[x.level]} ${c.grey("["+x["0"]+"]")} ${x.level === 'error' ? c.red(x.message) : x.message}`
        }),
        file: winston.format.printf(x => {
            return `${x.timestamp} ${this.labels[x.level]} [${x["0"]}] ${x.message}`.replace(/\x1B\[\d+m/g, '')
        })
    }

    public async init() {

        this.winston = winston.createLogger({
            levels: {
                error: 0,
                warn: 1,
                info: 2,
                http: 3,
                debug: 5,
                verbose: 6
            },
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console({
                    format: this.formats.console,
                    level: Config.logging.console.loggingLevel
                }),
                new winston.transports.DailyRotateFile({
                    auditFile:      path.join(__dirname, "../../../logs/log-audit.json"),
                    filename:       path.join(__dirname, "../../../logs/%DATE%.log"),
                    datePattern:    'YYYY-MM-DD',
                    format:         this.formats.file,
                    level:          Config.logging.logFile.loggingLevel,
                    maxSize:        Config.logging.logFile.maxSize,
                    maxFiles:       Config.logging.logFile.backlog
                })
            ]
        })

    }
    

    public getScope(scope: string) {

        let filePath = url.fileURLToPath(scope).replace(path.join(__dirname, '../../'), '')

        return {
            ERROR: (...message: string[]) => this.winston.error(message.join(', '), [filePath]),
            WARN:  (...message: string[]) => this.winston.warn(message.join(', '), [filePath]),
            INFO:  (...message: string[]) => this.winston.info(message.join(', '), [filePath]),
            HTTP:  (...message: string[]) => this.winston.http(message.join(', '), [filePath]),
            DEBUG: (...message: string[]) => this.winston.debug(message.join(', '), [filePath]),
            VERB:  (...message: string[]) => this.winston.verbose(message.join(', '), [filePath])
        }
        
    }

}