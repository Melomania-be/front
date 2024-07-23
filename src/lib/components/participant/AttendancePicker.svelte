<script lang="ts">
	import DateShow from '$lib/components/DateShow.svelte';
	import type { Concert } from '$lib/types/Concert';
	import type { CustomParticipant } from '$lib/types/CustomParticipant';
	import type { Rehearsal } from '$lib/types/Rehearsal';

	export let participants: CustomParticipant[];
	export let concertsOrRehearsals;
	export let type: 'concert' | 'rehearsal';
	export let disabled: boolean = false;

	function triggerEvent(participant: CustomParticipant, concertOrRehehearsal: Rehearsal | Concert) {
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
						<input
							type="checkbox"
							on:change={() => triggerEvent(participant, concertOrRehearsal)}
							{disabled}
						/>
					</td>
				{/each}
			</tr>
		{/each}
	</tbody>
</table>
