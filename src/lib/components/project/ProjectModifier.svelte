<script lang="ts">
	import type { Project } from '$lib/types/Project';
	import type { SectionGroup } from '$lib/types/SectionGroup';
	import type { Piece } from '$lib/types/Piece';

	import DateShow from '../DateShow.svelte';
	import type { Rehearsal } from '$lib/types/Rehearsal';
	import type { Concert } from '$lib/types/Concert';
	import SimpleFilterer from '../SimpleFilterer.svelte';
	import type { TableData } from '$lib/types/TableData';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import type { Contact } from '$lib/types/Contact';
	import type { Folder } from '$lib/types/Folder';

	export let project: Project;
	export let pieces: Array<Piece>;
	export let sectionGroups: Array<SectionGroup>;
	export let folders: Array<Folder>;
	export let mode: 'modify' | 'create';
	export let urlFront: string;

	let allowModification = mode === 'modify' ? false : true;

	function removeRehearsalDate(delRehearsal: Rehearsal) {
		project.rehearsals = project.rehearsals.filter((rehearsal) => rehearsal !== delRehearsal);
	}

	function removeConcertDate(delConcert: Concert) {
		project.concerts = project.concerts.filter((concert) => concert !== delConcert);
	}

	function addConcertDate() {
		project.concerts = [
			...project.concerts,
			{ id: null, date: '', place: '', comment: '', project_id: null }
		];
	}

	function addRehearsalDate() {
		project.rehearsals = [...project.rehearsals, { id: null, date: '', comment: '', place: '', project_id: null}];
	}

	async function saveProject() {
		const projectToSend = {
			id: project.id || null,
			name: project.name,
			section_group_id: project.sectionGroup ? project.sectionGroup.id : null,
			concerts: project.concerts.map((concert) => ({
				id: concert.id? concert.id : null,
				date: new Date(concert.date).toISOString().split('T')[0],
				place: concert.place,
				comment: concert.comment
			})),
			pieces_ids: project.pieces.map((piece) => piece.id),
			rehearsals: project.rehearsals.map((rehearsal) => ({
				id: rehearsal.id? rehearsal.id : null,
				date: new Date(rehearsal.date).toISOString().split('T')[0],
				place: rehearsal.place,
				comment: rehearsal.comment
			})),
			responsibles_ids: project.responsibles.map((responsible) => responsible.id),
			folder_id: project.folder ? project.folder.id : null
		};

		const response = await fetch('/api/projects', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(projectToSend)
		});

		if (response.ok) {
			const data = await response.json();
			goto(`/projects/${data.id}/management`);
		}
	}

	async function deleteProject() {
		if (
			confirm('Are you sure you want to delete this project? This action will be irreversible.')
		) {
			const response = await fetch(`/api/projects/${project.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				goto('/projects');
			}
		}
	}

	let contacts: (Contact & { selected: boolean })[] = [];
	let meta: any = {};
	let options: any = {
		filter: '',
		limit: 10,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};
	let url: string = '/api/contacts';

	let dataHolder: TableData<Contact>;

	async function fetchData() {
		let optionInUrls = `?page=${options.page}&limit=${options.limit}`;
		optionInUrls += '&filter=' + options.filter;
		optionInUrls += '&orderBy=' + options.orderBy;
		optionInUrls += '&order=' + options.order;

		if (browser) goto(`${urlFront}${optionInUrls}`);

		const response = await fetch(`${url}${optionInUrls}`, {
			method: 'GET'
		});

		const responseHandler = new ResponseHandlerClient();

		responseHandler.handle(response, async () => {
			const data = await response.json();

			contacts = data.data;
			meta = data.meta;

			if (contacts) {
				contacts.forEach((contact) => {
					if (project.responsibles.find((responsible) => responsible.id === contact.id)) {
						contact.selected = true;
					} else contact.selected = false;
				});
			}

			dataHolder = {
				data: contacts,
				columns: ['firstName', 'lastName'],
				notOrderedColumns: []
			};
		});
	}

	$: if (browser) options && allowModification && fetchData();
</script>

<div
	class="m-1 relative max-w-xxl bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
>
	{#if mode === 'modify'}
		<div class="absolute top-0 right-0 p-1">
			<button
				on:click={() => (allowModification = !allowModification)}
				class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
			>
				{#if !allowModification}
					<span class="icon-[tabler--edit]" style="width: 1.2rem; height: 1.2rem; color: black;"
					></span>
				{:else}
					Stop editing
				{/if}
			</button>
		</div>
	{/if}

	<div class="p-5">
		<div class="w-full mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
			<input
				class="ml-0.5"
				bind:value={project.name}
				placeholder="Project name"
				disabled={!allowModification}
			/>
		</div>

		<h3 class="w-full text-center m-1 bg-slate-200">Project informations</h3>

		<h4>Section Group</h4>
		<div class="m-1 border">
			<a href="/sectionGroups">Manage section groups</a>
			{#if !allowModification}
				{#if project.sectionGroup}
					<p>{project.sectionGroup.name}</p>
					<p>
						Composed of :
						{#if project.sectionGroup.sections}
							{#each project.sectionGroup.sections as section}
								{section.name}
							{/each}
						{/if}
					</p>
				{:else}
					<p>No section group</p>
				{/if}
			{:else}
				<select class="flex w-1/2" bind:value={project.sectionGroup}>
					<option value={null}>None</option>
					{#if sectionGroups}
						{#each sectionGroups as sectionGroup}
							<option value={sectionGroup}>{sectionGroup.name}</option>
						{/each}
					{/if}
				</select>

				{#if project.sectionGroup?.sections}
					<p>
						Composed of :
						{project.sectionGroup.sections.map((section) => section.name).join(', ')}.
					</p>
				{/if}
			{/if}
		</div>

		<h4>Pieces</h4>
		<div class="m-1 border">
			{#if !allowModification}
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Composer</th>
							<th>Arranger</th>
						</tr>
					</thead>
					<tbody>
						{#each project.pieces as piece}
							<tr>
								<td>{piece.name}</td>
								<td>{piece.composer.shortName}</td>
								<td>{piece.arranger}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{:else}
				<select class="flex w-1/2" bind:value={project.pieces} multiple>
					<option value={null}>None</option>
					{#if pieces}
						{#each pieces as piece}
							<option value={piece}>{piece.name}</option>
						{/each}
					{/if}
				</select>
				<p>Selected Pieces: {project.pieces.map((piece) => piece.name).join(', ')}</p>
			{/if}
		</div>

		<h4>Rehearsals</h4>
		<div class="m-1 border">
			{#if !allowModification}
				<table>
					<thead>
						<tr>
							<th>Date</th>
							<th>Place</th>
							<th>Comment</th>
						</tr>
					</thead>
					<tbody>
						{#if project.rehearsals}
							{#each project.rehearsals as rehearsal}
								<tr>
									<td><DateShow date={rehearsal.date} /></td>
									<td>{rehearsal.place}</td>
									<td>{rehearsal.comment}</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			{:else}
				<div>
					{#if project.rehearsals}
						{#each project.rehearsals as rehearsal}
							<div class="rehearsal-entry">
								<input
									class="p-1"
									bind:value={rehearsal.date}
									placeholder="enter a rehearsal date"
									type="date"
								/>
								<input
									class="p-1"
									bind:value={rehearsal.place}
									placeholder="enter a rehearsal place"
									type="text"
								/>
								<input
									class="p-1"
									bind:value={rehearsal.comment}
									placeholder="enter a comment if needed"
									type="text"
								/>
								<button
									class="bg-red-700 text-sm px-2 py-1 rounded-lg text-white hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 text-center"
									on:click={() => removeRehearsalDate(rehearsal)}>Remove</button
								>
							</div>
						{/each}
					{/if}
					<button
						class="bg-blue-700 text-sm px-2 py-1 rounded-lg text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 text-center"
						on:click={addRehearsalDate}>Add Rehearsal Date</button
					>
				</div>
			{/if}
		</div>

		<h4>Folder</h4>
		<div class="m-1 border">
			<select class="flex w-1/2" bind:value={project.folder}>
				<option value={null}>None</option>
				{#if folders}
					{#each folders as folder}
						<option value={folder}>{folder.name}</option>
					{/each}
				{/if}
			</select>
		</div>

		<h4>Concerts</h4>
		<div class="m-1 border">
			{#if !allowModification}
				<table>
					<thead>
						<tr>
							<th>Date</th>
							<th>Place</th>
							<th>Comment</th>
						</tr>
					</thead>
					<tbody>
						{#if project.concerts}
							{#each project.concerts as concert}
								<tr>
									<td><DateShow date={concert.date} /></td>
									<td>{concert.place}</td>
									<td>{concert.comment}</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			{:else}
				<div>
					{#if project.concerts}
						{#each project.concerts as concert, index}
							<div class="concert-entry">
								<input
									class="p-1"
									bind:value={concert.date}
									placeholder="enter a concert date"
									type="date"
								/>
								<input
									class="p-1"
									bind:value={concert.place}
									placeholder="enter a concert place"
									type="text"
								/>
								<input
									class="p-1"
									bind:value={concert.comment}
									placeholder="enter a comment if needed"
									type="text"
								/>
								<button
									class="bg-red-700 text-sm px-2 py-1 rounded-lg text-white hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 text-center"
									on:click={() => removeConcertDate(concert)}>Remove</button
								>
							</div>
						{/each}
					{/if}
					<button
						class="bg-blue-700 text-sm px-2 py-1 rounded-lg text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 text-center"
						on:click={addConcertDate}>Add Concert Date</button
					>
				</div>
			{/if}
		</div>

		<h3 class="w-full text-center m-1 bg-slate-200">Responsibles for this project</h3>
		<div class="m-1">
			{#if !allowModification}
				{#if project.responsibles}
					{#each project.responsibles as responsible}
						<p>{responsible.firstName} {responsible.lastName}</p>
					{/each}
				{/if}
			{:else if project.responsibles}
				{#each project.responsibles as responsible}
					<div>
						{responsible.firstName}
						{responsible.lastName}
						<button
							class="bg-red-700 text-sm px-2 py-1 rounded-lg text-white hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 text-center"
							on:click={() =>
								(project.responsibles = project.responsibles.filter(
									(contact) => contact !== responsible
								))}>Remove</button
						>
					</div>
				{/each}
				<button
					class="bg-blue-700 text-sm px-2 py-1 rounded-lg text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 text-center"
					on:click={() => {
						project.responsibles = [
							...project.responsibles,
							...contacts.filter((contact) => {
								if (project.responsibles.find((responsible) => responsible.id === contact.id))
									return false;
								return contact.selected;
							})
						];
					}}>Add responsibles</button
				>

				<SimpleFilterer
					bind:data={dataHolder}
					showData={false}
					editable={false}
					on:optionsUpdated={fetchData}
					bind:options
					bind:meta
				>
					<div class="grid grid-cols-4">
						{#if contacts}
							{#each contacts as contact}
								<div
									class="flex items-center p-2 border border-gray-200 rounded dark:border-gray-700"
								>
									<input
										bind:checked={contact.selected}
										id="bordered-checkbox-${contact.id}"
										type="checkbox"
										name="bordered-checkbox"
										class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
									/>
									<label
										for="bordered-checkbox-${contact.id}"
										class="w-full py-4 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
										>{contact.firstName} {contact.lastName}</label
									>
								</div>
							{/each}
						{/if}
					</div>
				</SimpleFilterer>
			{/if}
		</div>
	</div>

	{#if allowModification}
		<div>
			<button
				on:click={saveProject}
				class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
			>
				Save
			</button>
			{#if mode == 'modify'}
				<button
					on:click={deleteProject}
					class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
				>
					Delete
				</button>
			{/if}
		</div>
	{/if}
</div>
