<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { Callsheet } from '$lib/types/Callsheet';

    export let data: any;

	let callsheet: Callsheet;

	onMount(async () => {
		const callsheetResponse = await fetch(`/api/projects/${data.id}/management/callsheets/${data.callsheetId}`, {
			method: 'GET'
		});

		if (callsheetResponse.ok) {
			callsheet = await callsheetResponse.json();
		} else {
			console.error('Failed to fetch callsheet');
		}
	});
</script>

<div class="flex flex-col w-3/4 border-2 border-rose-500">
	<h1>CALL SHEET</h1>
	{#if callsheet}
		<p><b>Version n° :</b> {callsheet.version}</p>
		<p><b>Project Name :</b> {callsheet.project.name || 'No project name?'}</p>

		<div>
			<p><b>Contents</b></p>
			{#each callsheet.contents as content}
				<div>
					<b>- Title : </b>{content.title}
					<br />
					{content.text}
				</div>
			{/each}
		</div>

		<p><b>Rehearsals</b></p>
		{#if callsheet.project?.rehearsals}
			<table>
				<thead>
					<tr>
						<th>Date</th>
						<th>Place</th>
						<th>Comment</th>
					</tr>
				</thead>
				<tbody>
					{#each callsheet.project.rehearsals as rehearsal}
						<tr>
							<td>{rehearsal.date}</td>
							<td>{rehearsal.place}</td>
							<td>{rehearsal.comment}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<p>No rehearsal information available</p>
		{/if}

		<p><b>Pieces</b></p>
		{#if callsheet.project?.pieces}
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Opus</th>
						<th>Composer</th>
						<th>Arranger</th>
					</tr>
				</thead>
				<tbody>
					{#each callsheet.project.pieces as pieces}
						<tr>
							<td>{pieces.name}</td>
							<td>{pieces.opus}</td>
							<td>{pieces.composer.shortName} {pieces.composer.longName}</td>
							<td>{pieces.arranger}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<p>No pieces found</p>
		{/if}

		<p><b>Section Informations</b></p>
		{#if callsheet.project?.sectionGroup}
			<div>
				<div class="text-red-500">
					<b>Section Group Name:</b>
					{callsheet.project.sectionGroup.name}
				</div>
				{#each callsheet.project.sectionGroup.sections as section}
					<div>
						<p><b>Section Name:</b> {section.name}</p>
						<p><b>Size:</b> {section.size}</p>
						<p><b>Instruments:</b></p>
						<ul>
							{#each section.instruments as instrument}
								<li>{instrument.name}</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		{:else}
			<p>No section found</p>
		{/if}
	{/if}
</div>
