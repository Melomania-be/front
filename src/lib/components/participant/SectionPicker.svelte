<script lang="ts">
	import type { CustomParticipant } from '$lib/types/CustomParticipant';
	import type { Participant } from '$lib/types/Participant';
	import type { Section } from '$lib/types/Section';

	export let participant: Participant | CustomParticipant;
	export let sections: Section[];
	export let disabled: boolean = false;

	$: {
		if (participant.section && sections.length > 0) {
			participant.section = sections.filter((section) => section.id === participant.section!.id)[0];
		}
	}

	$: console.log(participant);
</script>

{#if sections.length > 0}
	<select bind:value={participant.section} {disabled}>
		{#each sections as section}
			<option value={section}>{section.name}</option>
		{/each}
	</select>

	Section leader : <input type="checkbox" bind:checked={participant.isSectionLeader} {disabled}>
{/if}
