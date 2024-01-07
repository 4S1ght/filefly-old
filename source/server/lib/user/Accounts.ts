
// Imports ====================================================================

import path from 'path'
import { ClassicLevel, DatabaseOptions } from 'classic-level'
import { AbstractSublevel, AbstractSublevelOptions } from 'abstract-level'

import * as url from 'url'
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

import Config from '../config/Config.js'
import Logger from '../logging/Logger.js'

const logger = Logger.getScope(import.meta.url)

// Types ======================================================================

export interface TDBAccountEntry {
    name: string
    pass: string
    uuid: string
    root: boolean
}

export interface TDBAccountPreferencesEntry {
    [key: string]: string
}

// Implementation =============================================================

export default class Accounts {

    // Accounts class instance
    public static i: Accounts

    public declare db:              ClassicLevel<string, never>
    private declare slAccounts:     AbstractSublevel<typeof this.db, string | Buffer | Uint8Array, string, /* type */ TDBAccountEntry>
    private declare slPreferences:  AbstractSublevel<typeof this.db, string | Buffer | Uint8Array, string, /* type */ TDBAccountPreferencesEntry>

    public static init = () => new Promise<void>(async (resolve, reject) => {

        const self = new this()
        this.i = self

        const dbLocation = path.join(__dirname, '../../../db/accounts')
        const dbOptions: DatabaseOptions<string, never> = {
            keyEncoding: 'utf-8',
            valueEncoding: 'json'
        }
        const slOptions: AbstractSublevelOptions<string, any> = {
            keyEncoding: 'utf-8',
            valueEncoding: 'json'
        }

        logger.DEBUG(`Database at "${dbLocation}"`)

        // Open the database
        logger.INFO('Opening accounts database') 
        self.db = new ClassicLevel(dbLocation, dbOptions)
        self.slAccounts = self.db.sublevel<string, TDBAccountEntry>('accounts', slOptions)
        self.slPreferences = self.db.sublevel<string, TDBAccountPreferencesEntry>('accounts', slOptions)

        self.db.defer(() => {
            if (self.db.status === 'closed') {
                reject('Database closed')
            }
            else {
                logger.INFO('open')
                resolve()
            }
        })

    })

}