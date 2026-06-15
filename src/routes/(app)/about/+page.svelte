<script>
    import Meta from "$lib/components/Meta.svelte";
    import { Spinner } from '@the-vcsi/scrolly-kit';
    import About from "$lib/components/About.svelte";

    import { getMembers } from '$lib/story.remote'

</script>


<Meta
  title="About"
  description="Description of the group."
/>

<div class="page">
    <div class="page-header no-logo">
        <div class="page-header-text">
            <h1>Who We Are</h1>
        </div>
    </div>

    {#await getMembers()}
        <Spinner text="Loading members..." />
    {:then members}
        <About {members} />
    {:catch error}
        <div>
            <p>Error loading members: {error.message}</p>
        </div>
    {/await}
</div>

<style>
    .page-header-text h1 {
        font-size: 3rem;
        font-weight: 400;
    }

    .page-header {
        display: flex;
        align-items: flex-start;
        gap: 3rem;
        margin-top: 4rem;
    }

    .page-header-text {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: 50%;
    }

     @media (max-width: 960px) {
        
        .page-header-text,
        .page-header.no-logo .page-header-text {
            max-width: 100%;
        }
    }

</style>
