
// Imports ====================================================================

import path from 'path'
import fs from 'fs'
import yaml from 'yaml'
import c from 'chalk'
import z, { object, number, string, boolean, union, literal } from 'zod'

import * as url from 'url'
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

// Types ======================================================================

const LoggingConfig = object({
    "console.loggingLevel": string().regex(/error|warn|info|http|debug|verbose/),
    "logFile.loggingLevel": string().regex(/error|warn|info|http|debug|verbose/),
    "logFile.maxSize":      string().regex(/^\d+(\.\d+)?(?:B|KB|MB|GB|TB)$/i),
    "logFile.backlog":      string().regex(/^\d+d$/),
})

type TLoggingConfig = z.infer<typeof LoggingConfig>

// Implementation =============================================================

export default class Config {

    public static logging: TLoggingConfig

    public static init() {
        
        this.logging = this.loadConfiguration('../../../../config/logging.yaml', LoggingConfig)

    }

    private static loadConfiguration(file: string, schema: z.ZodObject<any>) {

        let config: any
        
        const getNestedValue = (obj: any, path: (string|number)[]) => {
            let value = obj
            path.forEach(x => value = value[x])
            return value
        }

        try {
            config = yaml.parse(fs.readFileSync(path.join(__dirname, file), 'utf-8'))
            schema.parse(config)
            return config
        } 
        catch (error) {
            if (error instanceof z.ZodError === false) {
                console.error(c.red(`Config.init() load error on file "${path.join(__dirname, file)}".`))
                console.error(error)
                process.exit(-1)
            }
            else {
                error.issues.forEach(issue => {
                    console.error(c.red(
                        `Parse error inside config/${path.basename(file)} > ${issue.path.join('.')}: ` +
                        `"${getNestedValue(config, issue.path)}" - ${issue.message}. (${issue.code})`
                    ))
                })
            }        
        }

    }

}

