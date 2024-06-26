<script lang="ts">
	import { page } from '$app/stores';
	import ListModifier from '$lib/components/list/ListModifier.svelte';

	let id : number = parseInt($page.params.id);
	let url = '/api/contacts';
	let urlFront = `/contacts/lists/${id}`;
</script>

<ListModifier mode='modify' bind:url bind:urlFront bind:id/>