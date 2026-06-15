<script>
	import { ModeWatcher } from 'mode-watcher';
	import '$lib/styles/app.css';

	let { children } = $props();
</script>

<ModeWatcher defaultMode="system" />

{@render children?.()}
