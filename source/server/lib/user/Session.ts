
// Imports ====================================================================

import path from 'path'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import z, { object, string, boolean } from 'zod'

import * as url from 'url'
const __filename = url.fileURLToPath(import.meta.url)
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

import Config from '../config/Config.js'
import Logger from '../logging/Logger.js'
import Accounts from './Account.js'

const logger = Logger.getScope(import.meta.url)

// Types ======================================================================

export interface TSession {
    name: string
    uuid: string
    root: boolean
    elevated: boolean
    created: string
    updated: string
    type: "short" | "long" | "elevated"
}

// Implementation =============================================================

export default new class Session {

    // Session cache
    private cache = new Map<string, TSession>()

    // Session cleanup/expiration
    private sci = 10_000
    private declare sct: NodeJS.Timer

    // Session ID size in bytes
    private sidSize = 64

    public async Init() {
        this.sct = setInterval(() => {
            this._clearOldSessions()
        }, this.sci)
    }

    /**
     * Takes in a username and a password, performs checks and validates the credentials.
     * If they match an account, a new session for that account is created
     * @param name Username
     * @param pass Password
     * @param long Specifies whether the session is long or short
     * @returns String session ID
     */
    public async create(name: string, pass: string, long: boolean): ProcAsync<string, "unknown_error" | 'bad_name_or_pass'> {
        try {

            const account = await Accounts.get(name)
            if (!account) return ['bad_name_or_pass', null]

            const passwordsMatch = await bcrypt.compare(pass, account.pass)
            if (!passwordsMatch) return ['bad_name_or_pass', null]

            const [SIDError, SID] = await this._getUniqueSID()
            if (SIDError) return ['unknown_error', null]

            const created = new Date().toISOString()
            const session: TSession = {
                name: account.name,
                uuid: account.uuid,
                root: account.root,
                elevated: false,
                created: created,
                updated: created,
                type: long ? 'long' : 'short'
            } 
            this.cache.set(SID, session)

            logger.INFO(`New session issued for user "${name}". Long: "${long}", UUID: "${account.uuid}"`)
            logger.VERB(`Session.create() success:`, session)
            return [null, SID]
            
        } 
        catch (error) {
            logger.ERROR(`Session.create() error:`, error as Error)
            return ["unknown_error", null]
        }
    }

    /**
     * Takes in an existing session ID and a user password.
     * Performs checks if the password is correct and the user has root privileges,
     * and elevates that user's rights and downgrades his session to a short one.
     * 
     * This is done for security reasons, to prevent things such as an unauthorized
     * user trying to change his file permissions through the administrator's computer.
     * 
     * @param id Session ID
     * @returns Error (if encountered)
     */
    public async elevate(sid: string, pass: string): SProcAsync<Error | "unknown_session" | "root_required" | "unknown_error" | "bad_name_or_pass"> {
        try {

            const session = this.cache.get(sid)
            if (!session) return 'unknown_session'
            if (!session.root) return 'root_required'
            
            const account = await Accounts.get(session.name)
            if (!account) return 'unknown_error' // Unlikely, but can happen

            const passwordsMatch = await bcrypt.compare(pass, account.pass)
            if (!passwordsMatch) return 'bad_name_or_pass'

            session.elevated = true

        } 
        catch (error) {
            logger.ERROR(`Session.elevate() error:`, error as Error)
            return error as Error
        }
    }


    // Helpers ================================================================

    private _getUniqueSID(): ProcAsync<string> {
        return new Promise(resolve => {
            crypto.randomBytes(this.sidSize, async (error, bytes) => {
                // Catch cryptography errors, low entropy, etc...
                if (error) {
                    logger.ERROR(`Session._getUniqueSID error:`, error)
                    return resolve([error, null])
                }

                const SID = bytes.toString('base64')
                // Check if the session id is taken and generate a new one if true
                if (this.cache.get(SID)) return resolve(await this._getUniqueSID())
                else resolve([null, SID])

            })
        })
    }

    private async _clearOldSessions() {

        const now = Date.now()
        const sessionLengths: Record<TSession["type"], number> = {
            short:    Config.sessions.duration         * 1000*60,
            long:     Config.sessions.extendedDuration * 1000*60*60*24,
            elevated: Config.sessions.elevatedDuration * 1000*60
        }

        for (const [SID, session] of this.cache) {
            const sessionExpiryTime = new Date(session.updated).getTime() + sessionLengths[session.type]
            const sessionExpired = now >= sessionExpiryTime

            if (sessionExpired) {
                this.cache.delete(SID)
                const sessionLastedMs = Date.now() - new Date(session.created).getTime()
                const sessionLasted = {
                    long: (sessionLastedMs / (1000*60*60*24)).toFixed(1) + ' days',
                    short: (sessionLastedMs / (1000*60*60)).toFixed(1) + ' hours',
                    elevated: (sessionLastedMs / (1000*60*60)).toFixed(1) + ' hours'
                }[session.type]
                logger.INFO(`Session ${SID.slice(0, 10)}...${SID.slice(-10)} of "${session.uuid}" expired, lasted ${sessionLasted}, elevated: ${session.type === 'elevated'}`)
            }
        }

    }


}