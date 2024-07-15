<script lang="ts">
	import type { CustomParticipant } from '$lib/types/CustomParticipant';
	import type { Section } from '$lib/types/Section';

	export let participant: CustomParticipant;
	export let sections: Section[];
	export let disabled: boolean = false;

	if (participant.section && sections.length > 0) {
		participant.section = sections.filter((section) => section.id === participant.section!.id)[0];
	}
</script>

{#if sections.length > 0}
	<select bind:value={participant.section} {disabled}>
		{#each sections as section}
			<option value={section}>{section.name}</option>
		{/each}
	</select>
{/if}
