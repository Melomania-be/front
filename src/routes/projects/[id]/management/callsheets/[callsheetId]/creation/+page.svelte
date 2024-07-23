<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { Callsheet } from '$lib/types/Callsheet';
	import CallsheetShow from '$lib/components/callsheet/CallsheetShow.svelte';
	import CallsheetModifier from '$lib/components/callsheet/CallsheetModifier.svelte';

	export let data: any;

	let callsheet: Callsheet;

	onMount(async () => {
		const callsheetResponse = await fetch(
			`/api/projects/${data.id}/management/callsheets/${data.callsheetId}`,
			{
				method: 'GET'
			}
		);

		if (callsheetResponse.ok) {
			callsheet = await callsheetResponse.json();
			callsheet.id = null;
		} else {
			console.error('Failed to fetch callsheet');
		}
	});
</script>

<CallsheetModifier {callsheet} mode="create" />
