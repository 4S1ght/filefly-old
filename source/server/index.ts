
import { once } from "./lib/_helpers_.js"

import Config from "./lib/config/Config.js"
import Logger from "./lib/logging/Logger.js"
import Accounts from './lib/user/Accounts.js'
import API from './lib/api/v1/API.js'

const logger = Logger.getScope(import.meta.url)

;(async function main() {
    try {
        
        // ========= Initialization =========
                
        // Program configuration
        await Config.init()

        // Initialize logging functionality
        await Logger.init()
        logger.INFO('Logger.init() done')

        // Initialize accounts embedded database
        await Accounts.init()
        logger.INFO('Accounts.init() done')
        
        // Initialize the API and start listening
        await API.init()
        logger.INFO('API.init() done')

        // ========= Closing =========

        const close = once(async () => {
            try {
                logger.INFO('Shutting down...')
                await API.close()
                await Accounts.close()
                logger.INFO('Shutdown finished.')
                process.exit(0)
            } 
            catch (error) {
                logger.ERROR('Shutdown error:', error as Error)
                process.exit(-1)
            }
        })

        process.on('SIGTERM', close)
        process.on('SIGINT', close)

    } 
    catch (error) {
        console.error(error)
    }
})()
