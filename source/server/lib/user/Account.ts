
// Imports ====================================================================

import path from 'path'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { ClassicLevel, DatabaseOptions } from 'classic-level'
import { AbstractSublevel, AbstractSublevelOptions } from 'abstract-level'
import z, { object, string, boolean } from 'zod'

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

export default new class Accounts {

    public declare db:              ClassicLevel<string, never>
    private declare slAccounts:     AbstractSublevel<typeof this.db, string | Buffer | Uint8Array, string, /* type */ TDBAccountEntry>
    private declare slPreferences:  AbstractSublevel<typeof this.db, string | Buffer | Uint8Array, string, /* type */ TDBAccountPreferencesEntry>

    public async init() {

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
        this.db = new ClassicLevel(dbLocation, dbOptions)
        this.slAccounts = this.db.sublevel<string, TDBAccountEntry>('accounts', slOptions)
        this.slPreferences = this.db.sublevel<string, TDBAccountPreferencesEntry>('accounts', slOptions)

        await new Promise<void>((resolve, reject) => this.db.defer(() => {
            if (this.db.status === 'closed') reject(new Error('Accounts database is already closed.'))
            else resolve()
        }))

        // Automatically create an administrator account if there are none
        if ((await this.list()).length === 0) {
            await this.create({
                name: 'admin',
                pass: 'admin',
                root: true
            }, true)
            logger.WARN(
                `!! IMPORTANT !! A default administrator account was created with username "admin" and password "admin".`,
                `Update the password immediately!`
            )
        }

    }

    public async close() {
        await this.db.close()
    }
    
    
    private CreateParams = object({
        name: string(),
        pass: string(),
        root: boolean()
    })
    /**
     * Creates a new user account with a given name, password and root privileges.
     * @param user Object containing account username, password and whether it should be a root user
     * @param skipChecks Whether to skip account security checks (for internal use only)
     * @returns Error code or instance if any had happened
     */
    public async create(user: z.infer<typeof this.CreateParams>, skipChecks = false) {
        try {
            
            logger.DEBUG(`Accounts.create() > Attempted account creation | name:"${user.name}"`)

            // Check if the username unused
            if (await this.exists(user.name)) return 'err_user_exists'

            // Type checks
            if (!skipChecks) {
                if (!this.CreateParams.safeParse(user).success)             return "err_type_check_failed"
                if (Config.accounts.username.minLength > user.name.length)  return 'err_name_too_short'
                if (Config.accounts.username.maxLength < user.name.length)  return 'err_name_too_long'
                const passSecurityError = this._getPasswordSecurityStatus(user.pass)
                if (passSecurityError) return passSecurityError
            }

            const passwordHash = await bcrypt.hash(user.pass, Config.accounts.password.saltRounds)
            const userID = await this._getUniqueUUID(user.name)

            // Save the account to the database
            await this.slAccounts.put(user.name, {
                name: user.name,
                pass: passwordHash,
                uuid: userID,
                root: user.root
            })

            logger.DEBUG(`Accounts.create() > Account created | name:"${user.name}" root:"${user.root}" uuid:"${userID}"`)

        } 
        catch (error) {
            logger.ERROR(`Accounts.create() error:`, error as Error)
            return error as Error
        }
    }

    /**
     * Returns a list of all existing user accounts.
     * @returns Account entries array
     */
    public async list(): Promise<TDBAccountEntry[]> {
        return await this.slAccounts.values({}).all()
    }
    
    /**
     * Gets the user account document information, including username, password hash, 
     * root privileges and user's UUID used for managing privileges in the virtual filesystem.
     * @param name Account username
     * @returns Account entry
     */
    public async get(name: string): Promise<TDBAccountEntry | undefined> {
        try {
            const doc = await this.slAccounts.get(name)
            return doc
        } 
        catch (error) {
            return undefined
        }
    }

    /**
     * Returns a boolean value based on if the account with a given name exists.
     * @param name Username
     * @returns Boolean
     */
    public async exists(name: string) {
        try {
            await this.slAccounts.get(name)
            return true
        } 
        catch {
            return false
        }
    }

    // Utility methods ========================================================

    private _getPasswordSecurityStatus(pass: string) {
        if (typeof pass !== 'string')                                               return 'err_pass_type_error'
        if (Config.accounts.password.minLength > pass.length)                       return 'err_pass_too_short'
        if (Config.accounts.password.useSpecialCharacters   && !/\W/.test(pass))    return 'err_pass_no_special_chars'
        if (Config.accounts.password.useNumbers             && !/[0-9]/.test(pass)) return 'err_pass_no_numbers'
        if (Config.accounts.password.useBigAndLittleSymbols && !/[a-z]/.test(pass)) return 'err_pass_no_small_chars'
        if (Config.accounts.password.useBigAndLittleSymbols && !/[A-Z]/.test(pass)) return 'err_pass_no_big_chars'
    }

    private async _getUniqueUUID(username: string): Promise<string> {
        const id = `${username}.${crypto.randomUUID()}`
        const accounts = await this.list()
        if (accounts.find(x => x.uuid === id)) return await this._getUniqueUUID(username)
        return id
    }

}