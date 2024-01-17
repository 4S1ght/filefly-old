
// Imports ====================================================================

import Session, { TSession } from '../../../user/Session.js'
import Logger from '../../../logging/Logger.js'

const logger = Logger.getScope(import.meta.url)

// Types ======================================================================

import type { THandlerSetup } from '../API.js'

export type HTTPSessionInfo = Pick<TSession, 'name'|'root'|'elevated'|'created'|'updated'|'type'>

// Type guards ================================================================

// Implementation =============================================================

const sessionInfo: THandlerSetup = () => {

    logger.DEBUG('Setup done.')

    return async function(req, res) {
        try {

            const sid = req.cookies["sid"]
            if (!sid) return res.status(401).end()

            const session = Session.renew(sid)
            if (!session) return res.status(401).end()
            
            const body: HTTPSessionInfo = {
                name: session.name,
                root: session.root,
                elevated: session.elevated,
                created: session.created,
                updated: session.updated,
                type: session.type
            }
        
            res.json(body).end()
            
        }
        catch (error) {
            logger.ERROR(`Session renew error:`, error as Error)
            res.status(500).end()
        }
    }

}

export default sessionInfo