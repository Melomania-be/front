<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	type SectionGroup = {
		id: number;
		name: string;
		sections: Section[];
	};

	type Section = {
		id: number;
		name: string;
		size: number;
		instruments: Instrument[];
	};

	type Instrument = {
		id: number;
		name: string;
		family: string;
	};

	type Project = {
		id: number;
		name: string;
		section_group_id: number;
		registration_id: number;
		rehearsals: Rehearsal[];
		pieces: Piece[];
		sectionGroup: SectionGroup;
	};

	type Rehearsal = {
		id: number;
		date: string;
		comment: string;
		place: string;
	};

	type Piece = {
		id: number;
		name: string;
		opus: string;
		year_of_composition: string;
		arranger: string | null;
		composer: Composer;
	};

	type ContentCallsheet = {
		id: number;
		callsheet_id: number;
		title: string;
		text: string;
	};

	type Callsheet = {
		id: number;
		version: string;
		project_id: number;
		contents: ContentCallsheet[];
		project: Project;
	};

	type Composer = {
		birthDate: string | null;
		country: String | null;
		createdAt: Date;
		deathDate: string | null;
		id: Number | null;
		longName: String | null;
		mainStyle: String | null;
		shortName: String | null;
		updatedAt: Date | null;
	};

	let callsheetId: number;
	let visitorId: number;
	let callsheet: Callsheet | null = null;

	onMount(async () => {
		visitorId = parseInt($page.params.visitorId);
		callsheetId = parseInt($page.params.id);

		const callsheetResponse = await fetch(`/api/call_sheets/${callsheetId}/${visitorId}`, {
			method: 'GET'
		});

		console.log('callsheetResponse', callsheetResponse);

		if (callsheetResponse.status === 200) {
			callsheet = await callsheetResponse.json();
			console.log('eeuughghfghg', callsheet);
			console.log('project', callsheet?.project.name);
			console.log('anything about sections???? PLEASE???', callsheet?.project.sectionGroup);
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
