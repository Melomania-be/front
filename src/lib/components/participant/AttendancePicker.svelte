<script lang="ts">
	import DateShow from '$lib/components/DateShow.svelte';
	import type { Concert } from '$lib/types/Concert';
	import type { CustomParticipant } from '$lib/types/CustomParticipant';
	import type { Participant } from '$lib/types/Participant';
	import type { Rehearsal } from '$lib/types/Rehearsal';

	export let participants: (Participant | CustomParticipant)[];
	export let concertsOrRehearsals;
	export let type: 'concert' | 'rehearsal';
	export let disabled: boolean = false;

	let participantData;

	function triggerEvent(
		participant: CustomParticipant | Participant,
		concertOrRehehearsal: Rehearsal | Concert
	) {
		if (!participant.rehearsals) {
			participant.rehearsals = [];
		}
		if (!participant.concerts) {
			participant.concerts = [];
		}
		switch (type) {
			case 'rehearsal':
				if (laxInclude(participant, concertOrRehehearsal)) {
					participant.rehearsals.splice(participant.rehearsals.indexOf(concertOrRehehearsal), 1);
				} else {
					participant.rehearsals.push(concertOrRehehearsal);
				}
				break;
			case 'concert':
				if (laxInclude(participant, concertOrRehehearsal)) {
					participant.concerts.splice(participant.concerts.indexOf(concertOrRehehearsal), 1);
				} else {
					participant.concerts.push(concertOrRehehearsal);
				}
				break;
		}
	}

	$: participants.forEach((participant) => {
		participant.rehearsals = participant.rehearsals ?? [];
		participant.concerts = participant.concerts ?? [];
	});

	function laxInclude(participant: CustomParticipant | Participant, concert: Concert | Rehearsal) {
		return participant.rehearsals!.includes(concert) || participant.concerts!.includes(concert);
	}
</script>

<table
	class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 border border-collapse"
>
	<thead class="text-xs text-gray-700 dark:text-gray-400 border border-b-2">
		<tr>
			<th class="px-2 py-0">Participant</th>
			{#each concertsOrRehearsals as concertOrRehearsal}
				<th class="px-2 py-1 even:bg-gray-100 even:dark:bg-gray-800 uppercase"
					colspan="2">{concertOrRehearsal.place}</th
				>
			{/each}
		</tr>
		<tr>
			<th></th>
			{#each concertsOrRehearsals as concertOrRehearsal}
				<th class="px-6 pb-1 even:bg-gray-100 even:dark:bg-gray-800"
					colspan="2"><DateShow date={concertOrRehearsal.date} /></th
				>
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each participants as participant}
			<tr class="even:border even:border-t-2">
				<td class="px-2 w-0">{participant.contact ? participant.contact.firstName : ''}</td>
				{#each concertsOrRehearsals as concertOrRehearsal}
					<td class="px-3 py-2 w-0 even:bg-gray-100 even:dark:bg-gray-800">
						{#if (participant.rehearsals && type === 'rehearsal') || (participant.concerts && type === 'concert')}
							<input
								type="checkbox"
								checked={laxInclude(participant, concertOrRehearsal)}
								on:change={() => triggerEvent(participant, concertOrRehearsal)}
								{disabled}
							/>
						{/if}
					</td>
					<td class="px-3 py-1 even:bg-gray-100 even:dark:bg-gray-800">
						{#if (participant.rehearsals && type === 'rehearsal') || (participant.concerts && type === 'concert')}
							{#if concertOrRehearsal.participants}
								{#if participantData = concertOrRehearsal.participants.find(p => p.id === participant.id)}
									{participantData ? participantData.pivot_comment : ''}
								{/if}
							{:else}
								{concertOrRehearsal.pivot_comment ?? ''}
							{/if}
						{/if}
					</td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>
