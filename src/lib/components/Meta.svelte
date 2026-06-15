<!-- VCSI-configured Meta wrapper -->
<script>
  import { Meta } from '@the-vcsi/scrolly-kit';

  let {
    title,
    description,
    keywords = "",
    image = "/default-og-image.jpg",
    author = "Vermont Complex Systems Institute"
  } = $props();
</script>

<Meta
  {title}
  {description}
  {keywords}
  {image}
  {author}
  baseUrl="https://vermontcomplexsystems.org"
  siteName="VCSI"
/>
