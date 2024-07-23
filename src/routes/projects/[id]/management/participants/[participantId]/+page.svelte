<script lang="ts">
	import ParticipantModifier from '$lib/components/participant/ParticipantModifier.svelte';
	import type { CustomParticipant } from '$lib/types/CustomParticipant.js';
	import { onMount } from 'svelte';

	export let data;

	let participant: CustomParticipant;
	let urlFront: string = `/projects/${data.id}/management/participants/${data.participantId}`;

	onMount(async () => {
		const request = await fetch(
			`/api/projects/${data.id}/management/participants/${data.participantId}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);

		if (request.ok) {
			const response = await request.json();
			participant = response;
		}
	});
</script>

<ParticipantModifier mode="modify" id={data.id} bind:currentParticipant={participant} {urlFront} />
