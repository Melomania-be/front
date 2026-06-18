<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	onMount(() => goto('/mailing?tab=system', { replaceState: true }));
</script>
