<script lang="ts">
    import type { Story } from '$lib/story.remote';

    let { stories }: { stories: Story[] } = $props();

    // Group stories by level
    let storiesByLevel = $derived.by(() => {
        const groups: Record<string, Story[]> = {};
        for (const story of stories) {
            const level = story.level || '1';
            if (!groups[level]) {
                groups[level] = [];
            }
            groups[level].push(story);
        }
        // Sort by level number and return as entries
        return Object.entries(groups).sort((a, b) => Number(a[0]) - Number(b[0]));
    });
</script>

{#each storiesByLevel as [level, levelStories] (level)}
    <section class="level-section">
        {#if +level === 1}
            <h2 class="level-heading">Level {level}: building blocks</h2>
        {:else}
            <h2 class="level-heading">Level {level}</h2>
        {/if}
        <div class="story-grid">
            {#each levelStories as story (story.slug)}
                <a href="/{story.slug}" class="story-card">
                    <div class="card-content">
                        <h4>{story.title}</h4>
                        <p class="description">{story.description}</p>
                        {#if story.tags}
                            <div class="tags">
                                {#each story.tags.split(',').map(t => t.trim()).filter(Boolean) as tag (tag)}
                                    <span class="tag">{tag}</span>
                                {/each}
                            </div>
                        {/if}
                        <div class="card-footer">
                            <p class="date">{story.date}</p>
                            <span class="read-more">Read more →</span>
                        </div>
                    </div>
                </a>
            {/each}
        </div>
    </section>
{/each}

<style>
    .level-section {
        margin-bottom: var(--vcsi-space-2xl);
    }

    .level-section:last-child {
        margin-bottom: 0;
    }

    .level-heading {
        font-size: var(--vcsi-font-size-md);
        font-family: var(--vcsi-font-serif);
        margin: 0 0 var(--vcsi-space-lg) 0;
        color: var(--vcsi-fg);
        border-bottom: 2px solid var(--vcsi-border);
        padding-bottom: var(--vcsi-space-sm);
    }

    .story-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(225px, 320px));
        justify-content: center;
        gap: var(--vcsi-space-xl);
        margin: 0;
    }

    .story-card {
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 16px;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        height: 285px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        text-decoration: none;
        color: inherit;
        display: flex;
        flex-direction: column;
    }

    .story-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
        background: rgba(255, 255, 255, 1);
        border-color: rgba(0, 0, 0, 0.12);
    }

    :global(.dark) .story-card {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.1);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    :global(.dark) .story-card:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.15);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
    }

    .card-content {
        padding: 0rem var(--vcsi-space-lg);
        display: flex;
        flex-direction: column;
        height: 100%;
        gap: var(--vcsi-space-md);
    }

    .card-footer {
        margin-top: auto;
        margin-bottom: var(--vcsi-space-md);
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: var(--vcsi-space-md);
        border-top: 1px solid rgba(0, 0, 0, 0.08);
    }

    :global(.dark) .card-footer {
        border-top-color: rgba(255, 255, 255, 0.1);
    }

    .read-more {
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--vcsi-color-accent, #007a87);
        transition: transform var(--vcsi-transition-base);
    }

    .story-card:hover .read-more {
        transform: translateX(4px);
    }

    .description {
        font-size: 1rem;
        line-height: 1.6;
        color: rgba(0, 0, 0, 0.7);
        flex-grow: 1;
    }

    :global(.dark) .description {
        color: rgba(255, 255, 255, 0.7);
    }

    .date {
        margin: 0;
        font-size: 0.9rem;
        color: rgba(0, 0, 0, 0.5);
        font-family: var(--vcsi-font-sans);
    }

    :global(.dark) .date {
        color: rgba(255, 255, 255, 0.5);
    }

    .tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--vcsi-space-sm);
    }

    .tag {
        font-size: 0.75rem;
        font-family: var(--vcsi-font-sans);
        padding: var(--vcsi-space-xs) 0.6rem;
        background: rgba(0, 0, 0, 0.06);
        border-radius: 12px;
        color: rgba(0, 0, 0, 0.6);
    }

    :global(.dark) .tag {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.7);
    }

    @media (max-width: 768px) {
        .story-grid {
            grid-template-columns: 1fr;
            gap: var(--vcsi-space-lg);
        }

        .story-card {
            min-height: 220px;
        }

        .card-content {
            padding: var(--vcsi-space-lg);
        }
    }
</style>
