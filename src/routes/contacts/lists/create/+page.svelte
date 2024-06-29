<script lang="ts">
	import ListModifier from '$lib/components/list/ListModifier.svelte';

	let url = '/api/contacts';
	let urlFront = '/contacts/lists/create';
</script>

<ListModifier mode="create" bind:url bind:urlFront />
