<script>
    import { resolve } from '$app/paths';

    let { colored = false } = $props();
</script>

<header>
    <a href={resolve(`/`)} class="home-logo" aria-label="Back to home">
        <img src={colored ? "/waxSealRedSmall.png" : "/waxSealSmall.png"} alt="" />
    </a>
</header>

<style>
.home-logo {
    position: absolute;
    top: 1rem;
    left: 1rem;
    z-index: 100;
    transition: transform 0.2s ease;
}

.home-logo:hover {
    transform: scale(1.05);
}

.home-logo img {
    height: 4.5rem;
    width: auto;
}

@media (max-width: 768px) {
    .home-logo {
        left: 50%;
        transform: translateX(-50%);
    }

    .home-logo:hover {
        transform: translateX(-50%) scale(1.05);
    }
}
</style>