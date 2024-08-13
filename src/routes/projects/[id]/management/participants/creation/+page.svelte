<script lang="ts">
	import ParticipantModifier from '$lib/components/participant/ParticipantModifier.svelte';
	import type { CustomParticipant } from '$lib/types/CustomParticipant.js';

	export let data;
	let urlFront: string = `/projects/${data.id}/management/participants/creation`;
	let currentParticipant: CustomParticipant = {
		id: null,
		contact: null,
		project: {
			id: Number(data.id),
			name: '',
			concerts: [],
			pieces: [],
			sectionGroupId: null,
			rehearsals: [],
			sectionGroup: null,
			responsibles: []
		},
		answers: [],
		rehearsals: [],
		concerts: [],
		section: null
	};
</script>

{#if currentParticipant}
	<ParticipantModifier mode="create" id={data.id} bind:currentParticipant {urlFront} />
{/if}
