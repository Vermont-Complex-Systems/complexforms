<!--
@component
Your site's SEO tags (edit the defaults below).
Thin wrapper over svelte-meta-tags, which renders title, description,
canonical, Open Graph, and Twitter Card tags into <svelte:head>.
-->
<script>
  import { MetaTags } from 'svelte-meta-tags';
  import { page } from '$app/state';
  import { base } from '$app/paths';

  let {
    title,
    description,
    keywords = '',
    image = '/default-og-image.jpg',
    author = 'Vermont Complex Systems Institute',
    siteName = 'VCSI',
    baseUrl = 'https://vermontcomplexsystems.org'
  } = $props();

  // Canonical URL derives from the current page path (minus any base path).
  let pathname = $derived(page.url.pathname.replace(base, '').replace(/^\/+/, '/'));
  let canonical = $derived(baseUrl ? `${baseUrl}${pathname}` : pathname);
  let fullImageUrl = $derived(image.startsWith('http') ? image : (baseUrl ? `${baseUrl}${image}` : image));
</script>

<MetaTags
  {title}
  {description}
  {canonical}
  robots="index, follow, max-image-preview:large"
  openGraph={{
    url: canonical,
    title,
    description,
    siteName,
    type: 'article',
    locale: 'en_US',
    images: [{ url: fullImageUrl, width: 1200, height: 628 }]
  }}
  twitter={{
    cardType: 'summary_large_image',
    title,
    description,
    image: fullImageUrl
  }}
  additionalMetaTags={[
    ...(author ? [{ name: 'author', content: author }] : []),
    ...(keywords ? [{ name: 'keywords', content: keywords }] : [])
  ]}
/>
