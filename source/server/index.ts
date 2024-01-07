
import c from 'chalk'

import Config from "./lib/config/Config.js"
import Logger from "./lib/logging/Logger.js"
import Accounts from './lib/user/Accounts.js'

const logger = Logger.getScope(import.meta.url)


;(async function() {
    
    // Program configuration
    await Config.init()

    // Initialize logging functionality
    await Logger.init()
    logger.INFO('Logger.init() done')

    // Initialize accounts embedded database
    await Accounts.init()
    logger.INFO('Accounts.init() done')

})()
