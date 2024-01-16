<script lang="ts">

    // Libraries | Types ================================================================
    
    import type { HTMLInputTypeAttribute } from "svelte/elements"

    type InputFocusEvent = FocusEvent & { currentTarget: EventTarget & HTMLInputElement }

    // Svelte ===========================================================================

    import { onMount, onDestroy, createEventDispatcher } from "svelte"
	import { blur } from 'svelte/transition'

    // Components =======================================================================
    // Vars | State =====================================================================

    export let name: string | undefined = ''
    export let value: string = ''
    export let placeholder: string = ''
    export let type: HTMLInputTypeAttribute = 'text'
    export let input: HTMLInputElement
    export let transitionDelay: number

    let _active = false
    
    const dispatch = createEventDispatcher()

    // Interactions =====================================================================
    
    const onUpdate = (e: InputFocusEvent) => _active = input.value !== '' || e.target === document.activeElement


    const onEnter = (e: KeyboardEvent) => {
        if (e.code === 'Enter') {
            e.preventDefault()
            dispatch('enter', {})
        }
    }

    onMount(() => {
        input.type = type
        window.addEventListener('blur', onUpdate as any)
    })

    onDestroy(() => {
        window.removeEventListener('blur', onUpdate as any)
    })


</script>

<div class="credentials-field" data-active={_active} transition:blur={{ delay: transitionDelay, amount: 0 }}>
    <span class="placeholder">{placeholder}</span>
    <input {name} 
        bind:this={input} 
        bind:value={value}
        on:focus={onUpdate}
        on:blur={onUpdate}
        on:keypress={onEnter}
    />
</div>

<style lang="scss">

    .credentials-field {
        display: block;
        position: relative;
        padding-top: 4px;
        margin-top: 15px;
        margin-bottom: 10px;
        width: 100%;
        
        input {
            background-color: transparent;
            border: solid 1px var(--c-login-input-border);
            border-radius: 1.2em;
            color: var(--c-login-input-text);
            padding: 24px 15px 7px 15px;
            outline: none;
            width: calc(100% - 32px);
            transition: border-color 0.2s, box-shadow 0.2s;

            &:focus {
                border-color: var(--c-login-input-border-focus);
                box-shadow: 0 0 3px var(--c-login-input-border-focus);
            }
        }

        span {
            position: absolute;
            left: 15px; 
            top: 50%;
            transform: translateY(-38%);
            line-height: 1em;
            color: var(--c-login-input-fg-holder);
            pointer-events: none;
            transition: transform 0.1s, color 0.1s;
        }

        &[data-active="true"] span {
            transform: translate(-10%, -100%) scale(0.8);
            color: var(--c-login-input-fg-label);
        }

    }

</style>
