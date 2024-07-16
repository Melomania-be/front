<script lang="ts">
	import type { Concert } from '$lib/types/Concert.js';
	import type { Participant } from '$lib/types/Participant.js';
	import type { Rehearsal } from '$lib/types/Rehearsal.js';
	import DateShow from '$lib/components/DateShow.svelte';
	import { onMount } from 'svelte';

	export let data;

	let concerts: Concert[] = [];
	let rehearsals: Rehearsal[] = [];
	let participants: Participant[] = [];

	onMount(async () => {
		const responseAttendance = await fetch(`/api/projects/${data.id}/management/attendance`);

		if (responseAttendance.ok) {
			const tmp = await responseAttendance.json();

			concerts = tmp.concerts;
			rehearsals = tmp.rehearsals;
			participants = tmp.participants;
		}
	});

	function laxInclude(participant: Participant, concert: Concert | Rehearsal) {
		if (!concert.participants) return false;
		return concert.participants?.filter((p) => p.id === participant.id).length > 0;
	}
</script>

<div class="m-1 border">
	<div>
		<h2 class="text-lg font-bold">Concerts</h2>
		{#if concerts && concerts.length > 0}
			<table class="border border-collapse border-black">
				<thead>
					<tr>
						<th rowspan="2" class="crossed border-x border-black"></th>
						{#each concerts as concert}
							<th class=" border-x border-black">{concert.place}</th>
						{/each}
					</tr>
					<tr>
						{#each concerts as concert}
							<th class=" border-x border-black">
								<DateShow date={concert.date} />
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each participants as participant}
						<tr class="odd:bg-slate-200 border border-gray-500">
							<td class=" border-x border-black">
								{participant.contact.firstName}
								{participant.contact.lastName}
							</td>
							{#each concerts as concert}
								<td
									class="{laxInclude(participant, concert)
										? 'bg-green-700'
										: 'bg-red-700'} border-x border-black"
									>{laxInclude(participant, concert) ? 'present' : 'absent'}</td
								>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>

	<div>
		<h2 class="text-lg font-bold">Rehearsals</h2>
		{#if rehearsals && rehearsals.length > 0}
			<table class="border border-collapse border-black">
				<thead>
					<tr>
						<th rowspan="2" class="crossed border-x border-black"></th>
						{#each rehearsals as rehearsal}
							<th class=" border-x border-black">{rehearsal.place}</th>
						{/each}
					</tr>
					<tr>
						{#each rehearsals as rehearsal}
							<th class=" border-x border-black">
								<DateShow date={rehearsal.date} />
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each participants as participant}
						<tr class="odd:bg-slate-200 border border-gray-500">
							<td class=" border-x border-black">
								{participant.contact.firstName}
								{participant.contact.lastName}
							</td>
							{#each rehearsals as rehearsal}
								<td
									class="{laxInclude(participant, rehearsal)
										? 'bg-green-700'
										: 'bg-red-700'} border-x border-black"
									>{laxInclude(participant, rehearsal) ? 'present' : 'absent'}</td
								>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>

<style>
	.crossed {
		background: linear-gradient(
			to top right,
			rgba(0, 0, 0, 0) 0%,
			rgba(0, 0, 0, 0) calc(50% - 0.8px),
			rgba(0, 0, 0, 1) 50%,
			rgba(0, 0, 0, 0) calc(50% + 0.8px),
			rgba(0, 0, 0, 0) 100%
		);
	}
</style>
