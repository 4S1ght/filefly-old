<script lang="ts">

    // Libraries | Types ================================================================
    
    import type { HTMLInputTypeAttribute } from "svelte/elements"

    type InputFocusEvent = FocusEvent & { currentTarget: EventTarget & HTMLInputElement }

    // Svelte ===========================================================================

    import { onMount, onDestroy, createEventDispatcher } from "svelte"

    // Components =======================================================================
    // Vars | State =====================================================================

    export let name: string | undefined = ''
    export let value: string = ''
    export let placeholder: string = ''
    export let type: HTMLInputTypeAttribute = 'text'
    export let input: HTMLInputElement

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

<div class="credentials-field" data-active={_active}>
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
        margin-bottom: 15px;
        width: 100%;
        
        span {
            display: block;
            position: absolute;
            font-weight: 500;
            color: var(--c-login-input-fg-inactive);
            top: 50%;
            left: 0;
            transform: translateY(-28%);
            pointer-events: none;
            transition: transform 0.1s;
        }

        input {
            height: 100%;
            width: calc(100% - 2px);
            padding: 10px 0;
            margin: 0;
            color: var(--c-login-input-fg-active);
            font-weight: 500;
            background-color: transparent;
            border: none;
            border-bottom: solid 1px var(--c-login-input-underline);
            outline: none !important;
        }

        &[data-active="true"] span {
            transform: translateY(-135%) translateX(-14.5%) scale(0.75);
        }
    }

</style>
