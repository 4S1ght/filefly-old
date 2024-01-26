
// Imports ====================================================================

import Network from './Network'

import type { HTTPLoginBody } from '../../../server/lib/api/v1/post/Login.ts'

// Module =====================================================================

export default class User {

    public static async login(user: string, pass: string, long: boolean): Promise<Error | number> {
        try {

            const body: HTTPLoginBody = { user, pass, long }
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

    public static async renewSession() {
        try {
            const res = await Network.fetch('/api/v1/session/renew')
            return res.status === 200
        } 
        catch (error) {
            console.error(error)
            return false
        }
    }

}