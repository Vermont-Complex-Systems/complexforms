<script>
  import HeroText from "$lib/components/HeroText.svelte";

  let { name, url, social, pronoun, bio } = $props();
</script>

<section class="content-container">
  <HeroText>
    <h1>{name}</h1>

    {@const pronounA = pronoun === "They" ? "them" : pronoun === "He" ? "him" : "her"}
    {@const pronounB = pronoun === "They" ? "their" : pronoun === "He" ? "his" : "her"}
    {@const socialLink = social ? `You can follow ${pronounA} on <a href="${social}">the socials</a>` : null}
    {@const websiteLink = url ? `out ${pronounB} <a href="${url}">website</a>` : null}

    <p>
      <span class="sr-only">{name} </span>{@html bio || " is a contributor to The VCSI."}
      {#if socialLink && websiteLink}
        {@html `${socialLink} or check ${websiteLink}.`}
      {:else if socialLink}
        {@html `${socialLink}.`}
      {:else if websiteLink}
        {@html `Check ${websiteLink}.`}
      {/if}
    </p>

  </HeroText>
</section>