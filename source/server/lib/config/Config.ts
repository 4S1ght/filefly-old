
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

const LogLevel = union([ literal('error'), literal('warn'), literal('info'), literal('http'), literal('debug'), literal('verbose') ])

// ======= Logging =======

const LoggingConfig = object({
    console: object({
        loggingLevel: LogLevel
    }),
    logFile: object({
        loggingLevel: LogLevel,
        maxSize:      string().regex(/^\d+(\.\d+)?(?:B|KB|MB|GB|TB)$/i).transform(x => x.toLowerCase()),
        backlog:      string().regex(/^\d+d$/i).transform(x => x.toLowerCase()),
    })
})

type TLoggingConfig = z.infer<typeof LoggingConfig>

// ======= Accounts =======

const AccountsConfig = object({
    username: object({
        minLength: number().min(4),
        maxLength: number().max(150)
    }),
    password: object({
        minLength:              number().min(10),
        useSpecialCharacters:   boolean(),
        useNumbers:             boolean(),
        useBigAndLittleSymbols: boolean(),
        saltRounds:             number().min(10)
    })
})

type TAccountsConfig = z.infer<typeof AccountsConfig>

// ======= Security =======

const NetworkConfig = object({
    expose: object({
        ip:     union([ string().ip(), literal('localhost') ]),
        http:   number().min(0).max(65535),
        https:  number().min(0).max(65535),
    }),
    tls: object({
        enabled:                    boolean(),
        useSelfSignedCertificate:   boolean(),
        external: object({
            cert:       string(),
            privateKey: string()
        }),
        selfSigned: object({
            lifetime:           number().min(7).max(365),
            alg:                string().regex(/sha256|sha384|sha512/i),
            keySize:            number(),
            commonName:         string().min(5).max(70),
            countryName:        string().min(5).max(70),
            localityName:       string().min(5).max(70),
            organizationName:   string().min(5).max(70),
        })
    })
})

type TNetworkConfig = z.infer<typeof NetworkConfig>


// Implementation =============================================================

export default class Config {

    public static logging: TLoggingConfig
    public static accounts: TAccountsConfig
    public static network: TNetworkConfig

    public static init() {

        // Logging
        this.logging = this.loadConfiguration('../../../../config/logging.yaml', LoggingConfig)
        // Accounts
        this.accounts = this.loadConfiguration('../../../../config/accounts.yaml', AccountsConfig)
        // Network security
        this.network = this.loadConfiguration('../../../../config/network.yaml', NetworkConfig)

    }

    private static loadConfiguration(file: string, schema: z.ZodObject<any>) {

        let config: any
        
        const getNestedValue = (obj: any, path: (string|number)[]) => {
            let value = obj
            path.forEach(x => value = value[x])
            return value
        }

        try {
            config = yaml.parse(fs.readFileSync(path.join(__dirname, file), 'utf-8'), this.reviver, {})
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

    private static reviver = (key: unknown, value: unknown): any => {
        // Booleans
        if (value === 'yes') return true
        if (value === 'no') return false
        return value
    }

}

