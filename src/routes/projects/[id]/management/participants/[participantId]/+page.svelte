<script lang="ts">
	import ParticipantModifier from '$lib/components/participant/ParticipantModifier.svelte';
	import type { CustomParticipant } from '$lib/types/CustomParticipant.js';
	import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
	import { onMount } from 'svelte';
	import Fa from 'svelte-fa';

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

{#if participant}
<div class="bg-[#E7E7E7] h-screen p-4">
	<div
		class="bg-[#6b9ad9] text-white font-semibold justify-center flex items-center gap-2 rounded-lg px-6 w-20 py-1 mb-4"
	>
		<Fa icon={faChevronLeft} class="text-[14px]" style="color: white;" />
		<a href={`/projects/${data.id}/management/participants`}>Back</a>
	</div>
		<ParticipantModifier
			mode="modify"
			id={data.id}
			bind:currentParticipant={participant}
			{urlFront}
		/>
	</div>
{/if}
