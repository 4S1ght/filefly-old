
// Imports ====================================================================

import z, { object, string, boolean, union, literal } from 'zod'

import Session from '../../../user/Session.js'
import Config from '../../../config/Config.js'
import Logger from '../../../logging/Logger.js'

const logger = Logger.getScope(import.meta.url)

// Types ======================================================================

import type { THandlerSetup } from '../API.js'

// Type guards ================================================================

const Body = object({
    user: string(),
    pass: string(),
    long: boolean()
})

export type TPostLoginBody = z.infer<typeof Body>

// Implementation =============================================================

const login: THandlerSetup = () => {

    logger.DEBUG('Setup done.')

    return async function(req, res) {
        try {

            // Check the body
            const body: TPostLoginBody = req.body
            if (Body.safeParse(body).success === false) return res.status(400).end()

            // Create a new session & deny access on bad credentials
            const [sidError, sid] = await Session.create(body.user, body.pass, body.long)
            if (sidError) return res.status(401).end()

            res.cookie('sid', sid, {
                maxAge: body.long 
                    ? Config.sessions.extendedDuration * 1000*60*60*24
                    : Config.sessions.duration * 1000*60*60
            })

            res.end()
            
        }
        catch (error) {
            logger.ERROR(`User login error:`, error as Error)
            res.status(500).end()
        }
    }

}

export default login