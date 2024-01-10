
/**
 * Takes a function and wraps it, allowing it to only be called once.
 */
export function once<CB extends Function>(callback: CB): CB {
    let used = false
    // @ts-ignore
    return function(...args: any[]) {
        if (!used) {
            used = true
            callback(...args)
        }
    }
}