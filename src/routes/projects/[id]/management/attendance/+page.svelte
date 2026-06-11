<!-- src/routes/projects/[id]/management/attendance/+page.svelte -->
<script lang="ts">
	import type { Concert } from '$lib/types/Concert.js';
	import type { Participant } from '$lib/types/Participant.js';
	import type { Rehearsal } from '$lib/types/Rehearsal.js';
	import DateShow from '$lib/components/DateShow.svelte';
	import { onMount } from 'svelte';
	import ProjectHeadDisplayer from '../ProjectHeadDisplayer.svelte';
	import type { Project } from '$lib/types/Project';
	import ProjectPhoneDisplayer from '../ProjectPhoneDisplayer.svelte';
	import { generateAttendancePDF } from '$lib/utils/simplePdfGenerator';
	import { sortParticipantsBySection } from '$lib/utils/sectionOrder';

	export let data;

	let project: Project;

	let concerts: Concert[] = [];
	let rehearsals: Rehearsal[] = [];
	let participants: Participant[] = [];

	let participantData;
	let isGeneratingPDF = false;

	onMount(async () => {
		const responseAttendance = await fetch(`/api/projects/${data.id}/management/attendance`);

		if (responseAttendance.ok) {
			const tmp = await responseAttendance.json();

			concerts = tmp.concerts;
			rehearsals = tmp.rehearsals;
			participants = sortParticipantsBySection(tmp.participants); // Tri des participants par section
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

	async function downloadPDF() {
		if (!project || isGeneratingPDF) return;

		isGeneratingPDF = true;
		try {
			await generateAttendancePDF({
				project,
				concerts,
				rehearsals,
				participants,
				laxInclude
			});
		} catch (error) {
			console.error('Erreur lors de la génération du PDF:', error);
			alert('Erreur lors de la génération du PDF');
		} finally {
			isGeneratingPDF = false;
		}
	}

	let isMobile = false;

	const checkMobile = () => {
		isMobile = window.innerWidth <= 1000;
	};

	onMount(() => {
		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});
</script>

<ProjectHeadDisplayer {project} selectedTab={4}></ProjectHeadDisplayer>
<div class="bg-[#E7E7E7] p-4 min-h-screen {isMobile ? 'pb-[80px]' : ''}">
	<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] pb-4">
		<!-- Header avec bouton de téléchargement PDF -->
		<div class="flex justify-between items-center p-4 border-b">
			<h1 class="text-2xl font-bold text-gray-800">Attendance Report</h1>
			<button
				on:click={downloadPDF}
				disabled={isGeneratingPDF}
				class="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				{#if isGeneratingPDF}
					<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
					Generating PDF...
				{:else}
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						></path>
					</svg>
					Download PDF
				{/if}
			</button>
		</div>

		<div class="p-4">
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
										<td colspan={2 + concerts.length * 2} class="p-2 text-left">
											Section: {participant.section.name}
										</td>
									</tr>
								{/if}
								<!-- Participant row -->
								<tr class="odd:bg-gray-50 even:bg-white hover:bg-gray-200 border">
									<td class="border p-1 whitespace-nowrap text-xs">
										{participant.contact.firstName}
										{participant.contact.lastName}
										{#if participant.isSectionLeader}
											<span class="text-xs font-semibold text-blue-500">(Leader)</span>
										{/if}
									</td>
									<td class="border p-1 text-xs">{participant.section.name}</td>
									{#each concerts as concert}
										<td
											class="{laxInclude(participant, concert)
												? 'bg-green-200'
												: 'bg-red-200'} border p-1 text-center w-6 h-6"
										>
											{laxInclude(participant, concert) ? '✓' : '✗'}
										</td>
										<td class="border p-1 text-xs">
											{#if (participantData = concert.participants?.find((p) => p.id === participant.id))}
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

		<div class="p-4 mt-4">
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
										<DateShow
											startTime={rehearsal.startDate}
											endTime={rehearsal.endDate}
											withTime
											isRehearsal
										/>
									</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each participants as participant, index}
								{#if index === 0 || participant.section.name !== participants[index - 1].section.name}
									<!-- Section header row -->
									<tr class="bg-gray-300 text-gray-800 font-bold">
										<td colspan={2 + rehearsals.length * 2} class="p-2 text-left">
											Section: {participant.section.name}
										</td>
									</tr>
								{/if}
								<!-- Participant row -->
								<tr class="odd:bg-gray-50 even:bg-white hover:bg-gray-200 border">
									<td class="border p-1 whitespace-nowrap text-xs">
										{participant.contact.firstName}
										{participant.contact.lastName}
										{#if participant.isSectionLeader}
											<span class="text-xs font-semibold text-blue-500">(Leader)</span>
										{/if}
									</td>
									<td class="border p-1 text-xs">{participant.section.name}</td>
									{#each rehearsals as rehearsal}
										<td
											class="{laxInclude(participant, rehearsal)
												? 'bg-green-200'
												: 'bg-red-200'} border p-1 text-center w-6 h-6"
										>
											{laxInclude(participant, rehearsal) ? '✓' : '✗'}
										</td>
										<td class="border p-1 text-xs">
											{#if (participantData = rehearsal.participants?.find((p) => p.id === participant.id))}
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
{#if isMobile}
	<ProjectPhoneDisplayer {project} selectedTab={4} />
{/if}

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
