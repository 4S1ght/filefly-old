import './app.scss'
// @ts-expect-error
import App from './App.svelte'

const app = new App({
    target: document.getElementById('app')!,
})

export default app
