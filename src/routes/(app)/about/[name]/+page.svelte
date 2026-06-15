<script>
  import { page } from '$app/state';
  import { getMember } from '$lib/story.remote' 
  
  import Meta from "$lib/components/Meta.svelte";
  import Member from "$lib/components/Member.svelte";
  import { Spinner } from '@the-vcsi/scrolly-kit';
  
</script>

<Meta
  title="Member"
  description="Author bio"
/>

<div class="page">
  {#await getMember(page.params.name)}
    <Spinner text="Loading member..." />
  {:then author}
    <Member {...author}/>
  {:catch error}
    <p>Error loading member: {error.message || 'Unknown error'}</p>
  {/await}
</div>
