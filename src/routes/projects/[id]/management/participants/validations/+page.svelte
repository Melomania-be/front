<script lang="ts">
	import { onMount } from 'svelte';

	export let data;

	onMount(async () => {
        const responseParticipants = await fetch(`/api/projects/${data.id}/management/participants/validations`);
    });
</script>
