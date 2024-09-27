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

	let participantData;

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
            <div class="overflow-x-auto">
                <table class="border border-collapse w-full min-w-max">
                    <thead>
                        <tr class="bg-gray-200">
                            <th rowspan="2" class="crossed border border-gray-400 p-2"></th>
                            {#each concerts as concert}
                                <th colspan="2" class="border border-gray-400 p-2">{concert.place}</th>
                            {/each}
                        </tr>
                        <tr class="bg-gray-100">
                            {#each concerts as concert}
                                <th colspan="2" class="border border-gray-400 p-2">
                                    <DateShow date={concert.date} withTime />
                                </th>
                            {/each}
                        </tr>
                    </thead>
                    <tbody>
                        {#each participants as participant}
                            <tr class="odd:bg-gray-50 even:bg-white hover:bg-gray-200 border border-gray-400">
                                <td class="border border-gray-400 p-2 w-48">
                                    {participant.contact.firstName} {participant.contact.lastName}
                                </td>
                                {#each concerts as concert}
                                    <td class="{laxInclude(participant, concert) ? 'bg-green-200' : 'bg-red-200'} border border-gray-400 p-2 fixed-width">
                                        {laxInclude(participant, concert) ? 'present' : 'absent'}
                                    </td>
                                    <td class="border border-gray-400 p-2">
                                        {#if participantData = concert.participants.find(p => p.id === participant.id)}
                                            {participantData ? participantData.pivot_comment : ''}
                                        {/if}
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>

    <div class="mt-4">
        <h2 class="text-lg font-bold">Rehearsals</h2>
        {#if rehearsals && rehearsals.length > 0}
            <div class="overflow-x-auto">
                <table class="border border-collapse w-full min-w-max">
                    <thead>
                        <tr class="bg-gray-200">
                            <th rowspan="2" class="crossed border border-gray-400 p-2"></th>
                            {#each rehearsals as rehearsal}
                                <th colspan="2" class="border border-gray-400 p-2">{rehearsal.place}</th>
                            {/each}
                        </tr>
                        <tr class="bg-gray-100">
                            {#each rehearsals as rehearsal}
                                <th colspan="2" class="border border-gray-400 p-2">
                                    <DateShow date={rehearsal.date} withTime />
                                </th>
                            {/each}
                        </tr>
                    </thead>
                    <tbody>
                        {#each participants as participant}
                            <tr class="odd:bg-gray-50 even:bg-white hover:bg-gray-200 border border-gray-400">
                                <td class="border border-gray-400 p-2 w-48">
                                    {participant.contact.firstName} {participant.contact.lastName}
                                </td>
                                {#each rehearsals as rehearsal}
                                    <td class="{laxInclude(participant, rehearsal) ? 'bg-green-200' : 'bg-red-200'} border border-gray-400 p-2 fixed-width">
                                        {laxInclude(participant, rehearsal) ? 'present' : 'absent'}
                                    </td>
                                    <td class="border border-gray-400 p-2">
                                        {#if participantData = rehearsal.participants.find(p => p.id === participant.id)}
                                            {participantData ? participantData.pivot_comment : ''}
                                        {/if}
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
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

    .fixed-width {
        width: 100px;
    }

    @media (max-width: 768px) {
        table {
            display: block;
            overflow-x: auto;
            white-space: nowrap;
        }

        th, td {
            white-space: nowrap;
        }
    }
</style>