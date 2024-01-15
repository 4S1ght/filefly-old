<script lang="ts">

    // Libraries | Types ================================================================

    import User from '../../lib/User'

    // Svelte ===========================================================================
    // Components =======================================================================

    import Input from './$CredentialsField.svelte'

    // Vars | State =====================================================================

    let username: HTMLInputElement
    let password: HTMLInputElement

    let _username: string
    let _password: string
    let _status: [string, string] = ['', '']
    let _statusOld: [string, string] = ['', '']
    let _errCount = 0

    // Form submit ======================================================================

    async function submit(e: Event) {
        try {
            
            e.preventDefault()
            const status = await User.login(_username, _password, false)

            _statusOld = _status

            if (status === 200) {
                _status = ['Logged in successfully.', '']
                _username = ''
                _password = ''
                return
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

</script>

<div class="login">

    <div class="content">
        <form on:submit|preventDefault={submit}>
            <Input 
                type="text"
                name="username" 
                placeholder="Username" 
                bind:input={username} 
                bind:value={_username} 
                on:enter={e => _username && password.focus()}
            />
            <Input 
                type="password" 
                name="password" 
                placeholder="Password" 
                bind:input={password} 
                bind:value={_password} 
                on:enter={e => _password && submit(e)}
            />
            <button on:click={submit}>Login</button>
        </form>

        <p class="status">{_status[0]}</p>
        <p class="status dark">{_status[1]}<br>{_errCount ? `(${_errCount+1})` : ''}</p>
        
        <footer>
            <p>
                Forgot the password?
                <br/>
                <span>
                    Contact the administrator or<br/>
                    reset it from server console.
                </span>
            </p>
        </footer>
    </div>

</div>

<style lang="scss">

    .login {
        position: fixed;
        display: flex;
        height: 100vh;
        width: 100%;
        background: var(--c-login-bg);
        overflow: auto;
    }

    .content {
        display: block;
        margin: auto;
        width: 90%;
        max-width: 300px;
    }

    form {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
    }

    button {
        background-color: var(--c-login-btn-bg);
        color: var(--c-login-btn-fg);
        border: none;
        margin-top: 3em;
        padding: 10px 20px;
        border: none;
        border-radius: 10px;
        text-transform: uppercase;
        letter-spacing: 0.3em;   
        cursor: pointer;

        &:hover {
            background-color: var(--c-login-btn-bg-hover);
            transition: background-color 0.1s;
        }
    }

    footer {
        margin-top: 100px;
        span {
            display: inline-block;
            margin-top: 0.5em;
            color: var(--c-login-fg-hint);
        }
    }

  
</style>
