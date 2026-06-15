<script>
  let { children } = $props();
</script>

<div class="hero-text">
  {@render children?.()}
</div>

<style>
  .hero-text {
    line-height: var(--vcsi-line-height-relaxed);
    padding: 2rem 0;
  }

  :global(.hero-text h1) {
    margin: 0;
    font-size: var(--vcsi-font-size-giant);
    font-family: var(--vcsi-font-sans);
    font-weight: var(--vcsi-font-weight-bold);
    -webkit-font-smoothing: antialiased;
    line-height: var(--vcsi-line-height-tight);
  }

  :global(.hero-text p) {
    font-weight: var(--vcsi-font-weight-light);
    font-size: var(--vcsi-font-size-lg);
    line-height: var(--vcsi-line-height-snug);
    max-width: var(--vcsi-content-max-width);
    margin-top: var(--vcsi-space-lg);
    -webkit-font-smoothing: antialiased;
  }

  @media (max-width: 959px) {
    .hero-text {
      padding: 5rem 0 1rem 0;
    }
  }

  @media (min-width: 960px) {
    .hero-text {
      padding: 4rem 0 2rem 0;
    }
  }
</style>