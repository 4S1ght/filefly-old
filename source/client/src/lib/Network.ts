

export default new class Network {

    /**
     * fetch implementation with added `timeout` support built-in.
     */
    public async fetch(input: RequestInfo | URL, init: RequestInit & { timeout?: number } = {}) {

        const { timeout = 3000 } = init
        const controller = new AbortController()
        const id = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(input, {
            ...init,
            signal: controller.signal
        });

        clearTimeout(id)
        return response

    }

}