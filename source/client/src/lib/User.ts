
// Imports ====================================================================

import Network from './Network'

import type { TPostLoginBody } from '../../../server/lib/api/v1/post/Login.ts'

// Module =====================================================================

export default class User {

    public static async login(user: string, pass: string, long: boolean): Promise<Error | number> {
        try {

            const body: TPostLoginBody = { user, pass, long }
            const res = await Network.fetch('/api/v1/session/new', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            return res.status
            
        } 
        catch (error) {
            return error as Error
        }
    }

}