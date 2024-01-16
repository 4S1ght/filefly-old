
export default new class Timing {

    /**
     * A simple setImmediate implementation to desync a piece of code
     * from the natural execution.
     */
    public desync = (callback: Function) => setTimeout(callback)

    /** 
     * Similar to python's `sleep`.
     * Allows timeouts with clearer syntax and `sleep` functionality 
     * inside of async functions with use of `await`.
     * ```ts
     * // Substitute for `setTimeout`
     * Timing.wait(1000, () => {})
     * // Wait 1000ms
     * await Timing.wait(1000)
     * ```
    */
    public wait = (time: number, callback?: Function) => {
        return new Promise<void>(resolve => {
            setTimeout(async () => {
                if (callback) await callback()
                resolve()    
            }, time)
        })
    }

}