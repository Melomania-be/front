<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import CallsheetShow from '$lib/components/callsheet/CallsheetShow.svelte';
	import type { Callsheet } from '$lib/types/Callsheet';

	let callsheetId: number;
	let visitorId: number;
	let callsheet: Callsheet;

	onMount(async () => {
		visitorId = parseInt($page.params.visitorId);
		callsheetId = parseInt($page.params.id);

		const callsheetResponse = await fetch(`/api/call_sheets/${callsheetId}/${visitorId}`, {
			method: 'GET'
		});

		console.log('callsheetResponse', callsheetResponse);

		if (callsheetResponse.status === 200) {
			callsheet = await callsheetResponse.json();
			console.log('eeuughghfghg', callsheet);
		} else {
			console.error('Failed to fetch callsheet');
		}
	});
</script>

{#if callsheet}
    <CallsheetShow {callsheet} />
{:else}
    <p>Loading...</p>
{/if}