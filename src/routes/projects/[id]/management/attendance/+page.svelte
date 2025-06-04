<script lang="ts">
	import type { Concert } from '$lib/types/Concert.js';
	import type { Participant } from '$lib/types/Participant.js';
	import type { Rehearsal } from '$lib/types/Rehearsal.js';
	import DateShow from '$lib/components/DateShow.svelte';
	import { onMount } from 'svelte';
	import ProjectHeadDisplayer from '../ProjectHeadDisplayer.svelte';
	import type { Project } from '$lib/types/Project';

	export let data;

    let project : Project;

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

        await fetchProject(); 
	});

    async function fetchProject() {
        if (!data?.id) return;

        const response = await fetch(`/api/projects/${data.id}`, {
            method: 'GET'
        });

        if (!response.ok) {
            console.error('Failed to fetch project');
            return;
        }

        project = await response.json();
    }

	function laxInclude(participant: Participant, concert: Concert | Rehearsal) {
		if (!concert.participants) return false;
		return concert.participants?.filter((p) => p.id === participant.id).length > 0;
	}
</script>

<div>
<ProjectHeadDisplayer project={project} selectedTab={4}></ProjectHeadDisplayer>
<div class="m-1 border">
    <div>
        <h2 class="text-lg font-semibold">Concerts</h2>
        {#if concerts && concerts.length > 0}
            <div class="overflow-x-auto">
                <table class="border border-collapse w-full text-sm">
                    <thead>
                        <tr class="bg-gray-200">
                            <th rowspan="2" class="crossed border p-1"></th>
                            <th rowspan="2" class="border p-1">Section</th>
                            {#each concerts as concert}
                                <th colspan="2" class="border p-1">{concert.place}</th>
                            {/each}
                        </tr>
                        <tr class="bg-gray-100">
                            {#each concerts as concert}
                                <th colspan="2" class="border p-1">
                                    <DateShow startTime={concert.startDate} endTime={concert.endDate} withTime />
                                </th>
                            {/each}
                        </tr>
                    </thead>
                    <tbody>
                        {#each participants as participant, index}
                            {#if index === 0 || participant.section.name !== participants[index - 1].section.name}
                                <!-- Section header row -->
                                <tr class="bg-gray-300 text-gray-800 font-bold">
                                    <td colspan="{2 + (concerts.length * 2)}" class="p-2 text-left">
                                        Section: {participant.section.name}
                                    </td>
                                </tr>
                            {/if}
                            <!-- Participant row -->
                            <tr class="odd:bg-gray-50 even:bg-white hover:bg-gray-200 border">
                                <td class="border p-1 whitespace-nowrap text-xs">
                                    {participant.contact.firstName} {participant.contact.lastName}
                                    {#if participant.isSectionLeader}
                                        <span class="text-xs font-semibold text-blue-500">(Leader)</span>
                                    {/if}
                                </td>
                                <td class="border p-1 text-xs">{participant.section.name}</td>
                                {#each concerts as concert}
                                    <td class="{laxInclude(participant, concert) ? 'bg-green-200' : 'bg-red-200'} border p-1 text-center w-6 h-6">
                                        {laxInclude(participant, concert) ? '✓' : '✗'}
                                    </td>
                                    <td class="border p-1 text-xs">
                                        {#if participantData = concert.participants?.find(p => p.id === participant.id)}
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
        <h2 class="text-lg font-semibold">Rehearsals</h2>
        {#if rehearsals && rehearsals.length > 0}
            <div class="overflow-x-auto">
                <table class="border border-collapse w-full text-sm">
                    <thead>
                        <tr class="bg-gray-200">
                            <th rowspan="2" class="crossed border p-1"></th>
                            <th rowspan="2" class="border p-1">Section</th>
                            {#each rehearsals as rehearsal}
                                <th colspan="2" class="border p-1">{rehearsal.place}</th>
                            {/each}
                        </tr>
                        <tr class="bg-gray-100">
                            {#each rehearsals as rehearsal}
                                <th colspan="2" class="border p-1">
                                    <DateShow startTime={rehearsal.startDate} endTime={rehearsal.endDate} withTime isRehearsal/>
                                </th>
                            {/each}
                        </tr>
                    </thead>
                    <tbody>
                        {#each participants as participant, index}
                            {#if index === 0 || participant.section.name !== participants[index - 1].section.name}
                                <!-- Section header row -->
                                <tr class="bg-gray-300 text-gray-800 font-bold">
                                    <td colspan="{2 + (rehearsals.length * 2)}" class="p-2 text-left">
                                        Section: {participant.section.name}
                                    </td>
                                </tr>
                            {/if}
                            <!-- Participant row -->
                            <tr class="odd:bg-gray-50 even:bg-white hover:bg-gray-200 border">
                                <td class="border p-1 whitespace-nowrap text-xs">
                                    {participant.contact.firstName} {participant.contact.lastName}
                                    {#if participant.isSectionLeader}
                                        <span class="text-xs font-semibold text-blue-500">(Leader)</span>
                                    {/if}
                                </td>
                                <td class="border p-1 text-xs">{participant.section.name}</td>
                                {#each rehearsals as rehearsal}
                                    <td class="{laxInclude(participant, rehearsal) ? 'bg-green-200' : 'bg-red-200'} border p-1 text-center w-6 h-6">
                                        {laxInclude(participant, rehearsal) ? '✓' : '✗'}
                                    </td>
                                    <td class="border p-1 text-xs">
                                        {#if participantData = rehearsal.participants?.find(p => p.id === participant.id)}
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

    @media (max-width: 768px) {
        table {
            display: block;
            overflow-x: auto;
        }
    }
</style>
