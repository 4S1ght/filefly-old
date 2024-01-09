
/**
 * Takes a function and wraps it, allowing it to only be called once.
 */
export function once(callback: Function) {
    let used = false
    return function() {
        if (!used) {
            used = true
            callback()
        }
    }
}