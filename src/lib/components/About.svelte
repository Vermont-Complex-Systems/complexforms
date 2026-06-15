<script>
    import { base } from '$app/paths';
    import { flip } from 'svelte/animate';
    import { fade } from 'svelte/transition';

    let { members } = $props()
</script>

<div class="members-grid">
        {#each members as member (member.id)}
            <div
                class="member-card"
                animate:flip={{ duration: 400 }}
                in:fade={{ duration: 300 }}
                out:fade={{ duration: 200 }}
            >
                <a href="{base}/about/{member.id}" class="member-link">
                    <div class="member-photo">
                        <img
                            src="{base}/common/assets/members/{member.id}.jpg"
                            alt="{member.name}"
                            onerror={() => this.src = `${base}/common/assets/members/${member.id}.png`}
                        />
                    </div>
                    <div class="member-info">
                        <h3 class="member-name">{member.name}</h3>
                        <p class="member-position">{member.position2 || member.position}</p>
                    </div>
                </a>
            </div>
        {/each}
    </div>

<style>

    .members-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: var(--vcsi-space-xl);
        margin-bottom: var(--vcsi-space-2xl);
    }

    .member-card {
        transition: transform var(--vcsi-transition-base);
    }

    .member-card:hover {
        transform: translateY(-2px);
    }

    .member-link {
        display: block;
        text-decoration: none;
        color: inherit;
    }

    .member-photo {
        width: 100%;
        aspect-ratio: 1;
        overflow: hidden;
        border-radius: var(--vcsi-radius-sm);
        margin-bottom: var(--vcsi-space-md);
        background: var(--vcsi-gray-100);
    }

    .member-photo img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .member-info {
        text-align: center;
    }

    .member-name {
        font-size: 1.1rem;
        font-weight: 500;
        font-family: var(--vcsi-font-serif);
        margin-bottom: var(--vcsi-space-xs);
        color: var(--vcsi-fg);
    }

    .member-position {
        font-size: 0.9rem;
        color: var(--vcsi-gray-600);
        font-family: var(--vcsi-font-serif);
        margin: 0;
    }

    /* Mobile adjustments */
    @media (max-width: 768px) {
        .members-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: var(--vcsi-space-lg);
        }
    }
</style>
