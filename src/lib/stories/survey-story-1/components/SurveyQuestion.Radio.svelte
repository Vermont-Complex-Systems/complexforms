<script lang="ts">
import { RadioGroup, Label } from "bits-ui";

let {
    question,
    name,
    value = $bindable(),
    options,
    errors,
    onchange,
    saveStatus = 'idle',
    saveMessage = ''
}: {
    question: string;
    name: string;
    value: string;
    options: { value: string; label: string }[];
    errors?: { message: string }[];
    onchange: () => void;
    saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
    saveMessage?: string;
} = $props();
</script>

<div class="question-text">
    <h3>{question}</h3>
</div>
<div class="survey-controls">
    <RadioGroup.Root bind:value {name} class="radio-group" onValueChange={onchange}>
        {#each options as option (option.value)}
            <div class="radio-item" class:checked={value === option.value}>
                <RadioGroup.Item id={`${name}-${option.value}`} value={option.value} class="radio-button" />
                <Label.Root for={`${name}-${option.value}`} class="radio-label">{option.label}</Label.Root>
                {#if value === option.value && saveMessage}
                    <span
                        class="save-feedback"
                        class:success={saveStatus === 'saved'}
                        class:error={saveStatus === 'error'}
                        class:saving={saveStatus === 'saving'}
                    >
                        {saveMessage}
                    </span>
                {/if}
            </div>
        {/each}
    </RadioGroup.Root>
    {#if errors}
        {#each errors as error (error.message)}
            <p class="error">{error.message}</p>
        {/each}
    {/if}
</div>

<style>
    .question-text {
        text-align: center;
        margin-bottom: 1rem;
    }

    .question-text h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.2rem;
        font-weight: 600;
        color: #333;
    }

    :global(.radio-group) {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin: 0 auto;
        width: fit-content;
    }

    :global(.radio-item) {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        position: relative;
    }

    :global(.radio-button) {
        /* Reset native button styles */
        -webkit-appearance: none;
        appearance: none;
        margin: 0;
        padding: 0;

        /* Sizing */
        width: 1.15em;
        height: 1.15em;
        font: inherit;

        /* Visual */
        color: #666;
        background: white;
        border: 0.15em solid currentColor;
        border-radius: 50%;
        cursor: pointer;

        /* Layout for inner dot */
        display: grid;
        place-content: center;

        /* Prevent shrinking */
        flex-shrink: 0;
    }

    :global(.radio-button::before) {
        content: "";
        width: 0.65em;
        height: 0.65em;
        border-radius: 50%;
        transform: scale(0);
        transition: 120ms transform ease-in-out;
        box-shadow: inset 1em 1em #0891b2;
    }

    :global(.radio-button:hover) {
        color: #0891b2;
    }

    :global(.radio-button[data-state="checked"]) {
        color: #0891b2;
    }

    :global(.radio-button[data-state="checked"]::before) {
        transform: scale(1);
    }

    :global(.radio-button:focus) {
        outline: none;
    }

    :global(.radio-button:focus-visible) {
        outline: max(2px, 0.15em) solid currentColor;
        outline-offset: max(2px, 0.15em);
    }

    :global(.radio-label) {
        cursor: pointer;
        user-select: none;
        color: #333;
    }

    .error {
        background: #f8d7da;
        color: #721c24;
        padding: 0.5rem;
        border-radius: 4px;
        border: 1px solid #f5c6cb;
        font-size: 0.9rem;
        margin: 0.5rem 0;
    }

    .save-feedback {
        position: absolute;
        left: calc(100% + 0.75rem);
        font-size: 0.75rem;
        font-weight: 500;
        padding: 0.2rem 0.6rem;
        border-radius: 3px;
        opacity: 0;
        animation: fadeInOut 2s ease-in-out;
        white-space: nowrap;
    }

    .save-feedback.success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }

    .save-feedback.error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }

    .save-feedback.saving {
        background: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
        opacity: 1;
    }

    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(-2px); }
        20% { opacity: 1; transform: translateY(0); }
        80% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-2px); }
    }

    @media (max-width: 640px) {
        .question-text h3 {
            font-size: 1.3rem !important;
        }

    }
</style>