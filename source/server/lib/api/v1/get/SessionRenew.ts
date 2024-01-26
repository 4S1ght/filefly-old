
// Imports ====================================================================

import Session from '../../../user/Session.js'
import Logger from '../../../logging/Logger.js'
import Config from '../../../config/Config.js'

const logger = Logger.getScope(import.meta.url)

// Types ======================================================================

import type { THandlerSetup } from '../API.js'

// Type guards ================================================================

// Implementation =============================================================

const sessionRenew: THandlerSetup = () => {

    logger.DEBUG('Setup done.')

    return async function(req, res) {
        try {

            const sid = req.cookies["sid"]
            if (!sid) return res.status(401).end()

            const session = Session.renew(sid)
            if (!session) return res.status(401).end()

            res.cookie('sid', sid, {
                maxAge: {
                    "short":    Config.sessions.duration         * 1000*60,
                    "long":     Config.sessions.extendedDuration * 1000*60*60*24,
                    "elevated": Config.sessions.elevatedDuration * 1000*60
                }[session.type]
            })
        
            session
                ? res.status(200).end()
                : res.status(401).end()
            
        }
        catch (error) {
            logger.ERROR(`Session renew error:`, error as Error)
            res.status(500).end()
        }
    }

}

export default sessionRenew