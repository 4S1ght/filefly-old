
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
import Accounts from './Accounts.js'

const logger = Logger.getScope(import.meta.url)

// Types ======================================================================

export interface TSession {
    name: string
    uuid: string
    root: boolean
    elevated: boolean
    created: string
    updated: string
    type: "short" | "long"
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

    public async create(name: string, pass: string, long: boolean): ProcAsync<string, "unknown_error" | 'bad_name_or_pass'> {
        try {

            logger.INFO(`Attempt was made to create a session for user "${name}".`)

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

            logger.INFO(`New session issued for user "${name}". Long: ${long}, UUID: ${account.uuid}`)
            logger.VERB(`Session.create() call:`, session)
            return [null, SID]
            
        } 
        catch (error) {
            logger.ERROR(`Session.create() error:`, error as Error)
            return ["unknown_error", null]
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
            short: Config.sessions.duration * 1000*60,
            long: Config.sessions.extendedDuration * 1000*60*60*24
        }

        for (const [SID, session] of this.cache) {
            const sessionExpiryTime = new Date(session.updated).getTime() + sessionLengths[session.type]
            const sessionExpired = now >= sessionExpiryTime

            if (sessionExpired) {
                this.cache.delete(SID)
                const sessionLastedMs = Date.now() - new Date(session.created).getTime()
                const sessionLasted = session.type === 'long' 
                    ? ((sessionLastedMs / (1000*60*60*24)).toFixed(1) + ' days') 
                    : ((sessionLastedMs / (1000*60*60)).toFixed(1) + ' hours')
                logger.INFO(`Session ${SID.slice(0, 10)}...${SID.slice(-10)} of "${session.uuid}" expired, lasted ${sessionLasted}`)
            }
        }

    }


}