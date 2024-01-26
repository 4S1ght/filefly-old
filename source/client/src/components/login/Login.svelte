<script lang="ts">

    // Libraries | Types ================================================================

    import User from '../../lib/User'
    import Timing from '../../lib/Timing'

    // Svelte ===========================================================================

	import { blur } from 'svelte/transition'

    // Components =======================================================================

    import Input from './$CredentialsField.svelte'
    import { onMount } from 'svelte';

    // Vars | State =====================================================================

    let username: HTMLInputElement
    let password: HTMLInputElement

    let _username: string
    let _password: string
    let _status: [string, string] = ['', '']
    let _statusOld: [string, string] = ['', '']
    let _errCount = 0
    let _awaitingLogin = true
    let _awaitingRenew = true

    // Form submit ======================================================================

    async function submit(e: Event) {
        try {

            e.preventDefault()
            const status = await User.login(_username, _password, false)

            _statusOld = _status

            if (status === 200) {
                _status = [' ', ' ']
                return Timing.desync(() => _awaitingLogin = false)
            }

            if (status instanceof Error) return _status = [status.name, status.message]
            if (status === 400)          return _status = ['Login error', "The server could not process the login request."] 
            if (status === 401)          return _status = ['Login error', "Wrong username or password."] 
            if (status === 500)          return _status = ['Server error', "An unexpected error occurred while processing the request."] 

            _status = ['Error', "An unknown error had occurred."] 

            // Deselect password/name inputs for mobile devices.
            username.blur()
            password.blur()

        }
        catch (error) {
            _status = [(error as Error).name, (error as Error).message] 
        }
        finally {
            _status[0] === _statusOld[0] && _status[1] === _statusOld[1]
                ? _errCount++
                : _errCount !== 0 && (_errCount = 0)
        }
    }

    onMount(async () => {
        const renewed = await User.renewSession()
        if (renewed) {
            _awaitingLogin = false
            _awaitingRenew = false
        } 
        else {
            _awaitingRenew = false
        }
    }) 

</script>

{#if _awaitingRenew}
<div class="curtain" transition:blur={{ delay: 600, duration: 600 }}>
    <div class="loading-icon"></div>
</div>
{/if}

{#if _awaitingLogin}
    <div class="login" transition:blur={{ delay: 150, duration: 600 }}>

        <div class="content">
            
            <div class="prompt">
                <h2 transition:blur={{ delay: 0, duration: 600 }}>Login to Filefly</h2>
                <form on:submit={submit}>
                    <Input 
                        type="text"
                        name="username"
                        placeholder="Username"
                        transitionDelay={100}
                        bind:input={username}
                        bind:value={_username}
                        on:enter={e => _username && password.focus()}
                    />
                    <Input 
                        type="password"
                        name="password"
                        placeholder="Password"
                        transitionDelay={200}
                        bind:input={password}
                        bind:value={_password}
                        on:enter={e => _password && submit(e)}
                    />
                </form>

                <div class="status" transition:blur={{ delay: 300, amount: 0 }}>
                    <p class="code">{_status[0]}</p>
                    <p class="message">{_status[1]}<br>{_errCount ? `(${_errCount+1})` : ''}</p>
                </div>
            </div>

        </div>
        

        <footer transition:blur={{ delay: 400, amount: 0 }}>
            <div class="help">
                <p>Forgot password?</p>
                <p>Contact the administrator or <br/> reset it from server console.</p>
            </div>
            <div class="row">
                <a class="item" href="/">Patreon</a>
                <a class="item" href="/">Credits</a>
                <a class="item" href="/">Plugins</a>
            </div>
        </footer>

    </div>
{/if}

<style lang="scss">

    .curtain {
        position: fixed;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        width: 100%;
        background: var(--c-login-curtain-bg);
        z-index: 1001;

        .loading-icon {
            height: 50px;
            width: 50px;
            background-color: var(--c-login-curtain-logo-bg);
            border-radius: 13px;
            box-shadow: 0 0 .5em var(--c-login-curtain-logo-shadow);
            transform: translateY(-10vh);
        }

    }

    .login {
        position: fixed;
        display: flex;
        flex-direction: column;
        height: 100vh;
        width: 100%;
        background: var(--c-login-bg);
        overflow: auto;
        z-index: 1000;
    }

    .content {
        display: block;
        margin: auto;
        width: 90%;
        max-width: 600px;

        .prompt {
            padding: 3.5em;
            margin: 2em 0 2em 0;
            border-radius: 2.5em;
            box-shadow: 0 0 3em var(--c-login-prompt-shadow);
            background-color: var(--c-login-prompt-bg);
            
            h2 {
                font-weight: 600;
                text-align: center;
            }
            
            form {
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
            }

            .status {
                p.code {
                    color: var(--c-login-fg);
                    display: block;
                    height: 18px;
                    margin: 3.5em 0 0.5em 0;
                    font-weight: 500;
                    text-align: center;
                }
                p.message {
                    color: var(--c-login-fg-dimmed);
                    display: block;
                    height: 40px;
                    margin: 0.5em 0 0.5em 0;
                    text-align: center;
                }
            }
        }
    }
    
    footer {
        width: 100%;
        padding: 2em 0;
        background-color: var(--c-login-footer-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;

        .help p {
            font-size: 12px;
            color: var(--c-login-footer-fg);
            text-align: center;
        }

        .row {
            display: flex;
            align-items: center;
            justify-content: center; 

            .item {
                position: relative;
                padding: 0 1em 0 1em;
                    font-size: 12px;
                    color: var(--c-login-footer-fg);

                &::after {
                    content: '';
                    height: 1.3em;
                    width: 2px;
                    position: absolute;
                    right: 0;
                    top: 50%;
                    transform: translateX(50%) translateY(-50%);
                    background: var(--c-login-footer-fg);
                    opacity: 0.25;
                }
                &:last-child::after {
                    display: none;
                }
            }
        }


    }
  
</style>
