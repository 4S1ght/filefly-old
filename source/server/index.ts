
import c from 'chalk'

import Config from "./lib/config/Config.js"
import Logger from "./lib/logging/Logger.js"

const logger = Logger.getScope(import.meta.url)


;(async function() {
    
    // Program configuration
    await Config.init()

    // Initialize logging functionality
    await Logger.init()
    logger.DEBUG('Logger.init() done')

})()
