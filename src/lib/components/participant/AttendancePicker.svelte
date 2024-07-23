<script lang="ts">
	import DateShow from '$lib/components/DateShow.svelte';
	import type { Concert } from '$lib/types/Concert';
	import type { CustomParticipant } from '$lib/types/CustomParticipant';
	import type { Participant } from '$lib/types/Participant';
	import type { Rehearsal } from '$lib/types/Rehearsal';

	export let participants: Participant[];
	export let concertsOrRehearsals;
	export let type: 'concert' | 'rehearsal';
	export let disabled: boolean = false;

	$: console.log(concertsOrRehearsals);
	$: console.log(participants);

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
				if (participant.rehearsals.includes(concertOrRehehearsal)) {
					participant.rehearsals.splice(participant.rehearsals.indexOf(concertOrRehehearsal), 1);
				} else {
					participant.rehearsals.push(concertOrRehehearsal);
				}
				break;
			case 'concert':
				if (participant.concerts.includes(concertOrRehehearsal)) {
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
</script>

<table
	class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 border border-collapse"
>
	<thead class="text-xs text-gray-700 dark:text-gray-400 border border-b-2">
		<tr>
			<th>Participant</th>
			{#each concertsOrRehearsals as concertOrRehearsal}
				<th class="px-6 py-1 even:bg-gray-100 even:dark:bg-gray-800 uppercase"
					>{concertOrRehearsal.place}</th
				>
			{/each}
		</tr>
		<tr>
			<th></th>
			{#each concertsOrRehearsals as concertOrRehearsal}
				<th class="px-6 pb-1 even:bg-gray-100 even:dark:bg-gray-800"
					><DateShow date={concertOrRehearsal.date} /></th
				>
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each participants as participant}
			<tr class="even:border even:border-t-2">
				<td>{participant.contact ? participant.contact.firstName : ''}</td>
				{#each concertsOrRehearsals as concertOrRehearsal}
					<td class="px-6 py-3 even:bg-gray-100 even:dark:bg-gray-800">
						{#if (participant.rehearsals && type === 'rehearsal') || (participant.concerts && type === 'concert')}
							<input
								type="checkbox"
								checked={participant.concerts?.includes(concertOrRehearsal) || participant.rehearsals?.includes(concertOrRehearsal)}
								on:change={() => triggerEvent(participant, concertOrRehearsal)}
								{disabled}
							/>
						{/if}
					</td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>
