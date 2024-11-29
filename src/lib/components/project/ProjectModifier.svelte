<script lang="ts">
	import Sortable from 'sortablejs';

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
	import { StatusCodesClientError } from '$lib/common/statusCodes';
	import DatePicker from '../DatePicker.svelte';
	import TimePicker from '../TimePicker.svelte';

	import { onMount, afterUpdate } from 'svelte';

	export let project: Project;
	export let pieces: Array<Piece>;
	export let sectionGroups: Array<SectionGroup>;
	export let folders: Array<Folder>;
	export let mode: 'modify' | 'create';
	export let urlFront: string;

	let allowModification = mode === 'modify' ? false : true;

    let initialSelectedPieces = [...project.pieces];
    let initialAllPieces = pieces ? pieces.filter(piece => !project.pieces.some(p => p.id === piece.id)): [];

    let selectedPieces: Piece[] = [...initialSelectedPieces];
    let allPieces: Piece[] = [...initialAllPieces];
    let allPiecesContainer: HTMLElement;
    let selectedPiecesContainer: HTMLElement;

	let allPiecesSortable: any;
    let selectedPiecesSortable: any;

    function initializeSortable() {
        allPiecesSortable = Sortable.create(allPiecesContainer, {
            group: {
                name: 'pieces',
                put: true,
                pull: true
            },
            animation: 200,
            sort: false,
            onAdd: (evt: any) => {
                const item = selectedPieces[evt.oldIndex as number];
                allPieces.splice(evt.newIndex as number, 0, item);
                console.log('allPieces: ', allPieces);
            },
            onRemove: (evt: any) => {
                allPieces.splice(evt.oldIndex as number, 1);
                console.log('allPieces: ', allPieces);
            }
        });

        selectedPiecesSortable = Sortable.create(selectedPiecesContainer, {
            group: {
                name: 'pieces',
                put: true,
                pull: true
            },
            animation: 200,
            onAdd: (evt: any) => {
                const item = allPieces[evt.oldIndex as number];
                selectedPieces.splice(evt.newIndex as number, 0, item);
                console.log('selectedPieces: ', selectedPieces);
            },
            onRemove: (evt: any) => {
                selectedPieces.splice(evt.oldIndex as number, 1);
                console.log('selectedPieces: ', selectedPieces);
            },
            onUpdate: (evt: any) => {
                const item = selectedPieces[evt.oldIndex as number];
                selectedPieces.splice(evt.oldIndex as number, 1);
                selectedPieces.splice(evt.newIndex as number, 0, item);
                console.log('selectedPieces: ', selectedPieces);
            }
        });
    }

    function toggleSortable() {
        if (allPiecesSortable) {
            allPiecesSortable.option('disabled', !allowModification);
        }
        if (selectedPiecesSortable) {
            selectedPiecesSortable.option('disabled', !allowModification);
        }
    }

    onMount(() => {
        initializeSortable();
        toggleSortable();
    });

    afterUpdate(() => {
        toggleSortable();
    });

	function removeRehearsalDate(delRehearsal: Rehearsal) {
		project.rehearsals = project.rehearsals.filter((rehearsal) => rehearsal !== delRehearsal);
	}

	function removeConcertDate(delConcert: Concert) {
		project.concerts = project.concerts.filter((concert) => concert !== delConcert);
	}

	function addConcertDate() {
		project.concerts = [
			...project.concerts,
			{ id: null, startDate: new Date(), endDate: new Date(), place: '', comment: '', project_id: null }
		];
	}

	function addRehearsalDate() {
		project.rehearsals = [
			...project.rehearsals,
			{ id: null, startDate: new Date(), endDate: new Date(), comment: '', place: '', project_id: null }
		];
	}

	async function saveProject() {
		const projectToSend = {
			id: project.id || null,
			name: project.name,
			section_group_id: project.sectionGroup ? project.sectionGroup.id : null,
			concerts: project.concerts.map((concert) => ({
				id: concert.id ? concert.id : null,
				start_date: new Date(concert.startDate).toISOString(),
				end_date: concert.endDate ? new Date(concert.endDate).toISOString() : null,
				place: concert.place,
				comment: concert.comment
			})),
			pieces: selectedPieces.map((piece) => ({
				id: piece.id,
				pivot_order: selectedPieces.indexOf(piece)
			})),
			rehearsals: project.rehearsals.map((rehearsal) => ({
				id: rehearsal.id ? rehearsal.id : null,
				start_date: new Date(rehearsal.startDate).toISOString(),
				end_date: rehearsal.endDate ? new Date(rehearsal.endDate).toISOString() : null,
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
		} else {
			if (response.status === StatusCodesClientError.UNPROCESSABLE_ENTITY) {
				let error = await response.json();
				alert(error.message || JSON.stringify(error));
			}
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
		limit: 250,
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

	$: if (browser) allowModification && fetchData();
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
				class="ml-1 mt-1 w-full"
				bind:value={project.name}
				placeholder="Project name"
				disabled={!allowModification}
			/>
		</div>

		<h3 class="w-full text-center m-1 bg-slate-200">Project informations</h3>

		<h4 class="text-lg">Section Group</h4>
		<div class="m-1 border">
			{#if allowModification}
				<a href="/sectionGroups"
					><button class="border border-blue-700 p-1 hover:bg-slate-200 rounded-full">
						Manage section groups
					</button></a
				>
			{/if}

			{#if !allowModification}
				{#if project.sectionGroup}
					<p>{project.sectionGroup.name}</p>
					<div class="border">
						Composed of :
						{#if project.sectionGroup.sections}
							{#each project.sectionGroup.sections as section}
								<div class="m-1 text-nowrap">{section.name} - {section.size}</div>
							{/each}
						{/if}
					</div>
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

		<h4 class="text-lg">Pieces</h4>
		<div class="container flex flex-col md:flex-row md:gap-4">
			<div class="flex-1">
				<h4 class="text-lg sticky top-0 bg-white">Available pieces</h4>
				{#if allPieces.length === 0}
					<p>No pieces available</p>
				{:else}
					<section bind:this={allPiecesContainer} class="list p-1  min-h-[300px] max-h-[300px] border border-black overflow-y-auto">
						{#each allPieces as piece}
							<div class="item p-2 mb-2 border border-gray-300 rounded bg-white cursor-grab">
								{piece.name} - {piece.composer.shortName}
							</div>
						{/each}
					</section>
				{/if}
			</div>
		
			<div class="flex-1 mt-4 md:mt-0">
				<h4 class="text-lg sticky top-0 bg-white">Selected pieces (ordered)</h4>
				<section bind:this={selectedPiecesContainer} class="list p-1  min-h-[300px] max-h-[300px] border border-black overflow-y-auto">
					{#each project.pieces as piece}
						<div class="item p-2 mb-2 border border-gray-300 rounded bg-white cursor-grab">
							{piece.name} - {piece.composer.shortName}
						</div>
					{/each}
				</section>
			</div>
		</div>

		<h4 class="text-lg">Folder</h4>
		<div class="m-1">
			<select class="flex w-1/2" bind:value={project.folder}>
				<option value={null}>None</option>
				{#if folders}
					{#each folders as folder}
						<option value={folder}>{folder.name}</option>
					{/each}
				{/if}
			</select>
		</div>

		<h4 class="text-lg">Rehearsals</h4>
		<div class="m-1 border">
			{#if !allowModification}
				<div class="overflow-x-auto">
					<table class="table-auto max-w-min min-w-max">
						<thead>
							<tr>
								<th class="px-3 py-1">Date</th>
								<th class="px-3 py-1">Place</th>
								<th class="px-3 py-1">Comment</th>
							</tr>
						</thead>
						<tbody>
							{#if project.rehearsals && project.rehearsals.length}
								{#each project.rehearsals as rehearsal}
									<tr class="rehearsal-entry">
										<td class="px-3 py-1">
											<DateShow startTime={rehearsal.startDate} endTime={rehearsal.endDate} withTime isRehearsal/>
										</td>
										<td class="px-3 py-1">{rehearsal.place}</td>
										<td class="px-3 py-1 max-w-xs">{rehearsal.comment}</td>
									</tr>
								{/each}
							{:else}
								<tr><td colspan="3" class="text-center px-3 py-1">No rehearsal</td></tr>
							{/if}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="table-auto max-w-min min-w-max">
						<thead>
							<tr>
								<th class="px-3 py-1">Start Date</th>
								<th class="px-3 py-1">End Date</th>
								<th class="px-3 py-1">Place</th>
								<th class="px-3 py-1">Comment</th>
								<th class="px-3 py-1">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each project.rehearsals as rehearsal}
								<tr class="rehearsal-entry">
									<td class="px-3 py-1">
										<DatePicker bind:date={rehearsal.startDate} />
										<TimePicker bind:date={rehearsal.startDate} />
									</td>
									<td class="px-3 py-1">
										<DatePicker bind:date={rehearsal.endDate} />
										<TimePicker bind:date={rehearsal.endDate} />
									</td>
									<td class="px-3 py-1">
										<input
											class="p-1 w-full border-solid border-2 border-gray-200"
											bind:value={rehearsal.place}
											placeholder="enter a rehearsal place"
											type="text"
										/>
									</td>
									<td class="px-3 py-1">
										<textarea
											class="p-1 w-full"
											bind:value={rehearsal.comment}
											placeholder="enter a comment if needed"
											rows="2"
											cols="50"
										></textarea>
									</td>
									<td class="px-3 py-1">
										<button
											class="bg-red-700 text-sm px-2 py-1 rounded-lg text-white hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 text-center"
											on:click={() => removeRehearsalDate(rehearsal)}>Remove
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				<button
					class="bg-blue-700 text-sm px-2 py-1 m-2 rounded-lg text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 text-center mt-2"
					on:click={addRehearsalDate}>Add Rehearsal Date
				</button>
			{/if}
		</div>

		<h4 class="text-lg">Concerts</h4>
		<div class="m-1 border">
			{#if !allowModification}
			<div class="overflow-x-auto">
				<table class="table-auto max-w-min min-w-max">
					<thead>
						<tr>
							<th class="px-3 py-1">Date</th>
							<th class="px-3 py-1">Place</th>
							<th class="px-3 py-1">Comment</th>
						</tr>
					</thead>
					<tbody>
						{#if project.concerts && project.concerts.length}
							{#each project.concerts as concert}
								<tr class="concert-entry">
									<td class="px-3 py-1">
										<DateShow startTime={concert.startDate} endTime={concert.endDate} withTime />
									</td>
									<td class="px-3 py-1">{concert.place}</td>
									<td class="px-3 py-1 whitespace-normal">{concert.comment}</td>
								</tr>
							{/each}
						{:else}
							<tr><td colspan="3" class="text-center px-3 py-1">No concert</td></tr>
						{/if}
					</tbody>
				</table>
			</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="table-auto max-w-min min-w-max">
						<thead>
							<tr>
								<th class="px-3 py-1">Start Date</th>
								<th class="px-3 py-1">End Date</th>
								<th class="px-3 py-1">Place</th>
								<th class="px-3 py-1">Comment</th>
								<th class="px-3 py-1">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each project.concerts as concert}
								<tr class="concert-entry">
									<td class="px-3 py-1">
										<DatePicker bind:date={concert.startDate} />
										<TimePicker bind:date={concert.startDate} />
									</td>
									<td class="px-3 py-1">
										<DatePicker bind:date={concert.endDate} />
										<TimePicker bind:date={concert.endDate} />
									</td>
									<td class="px-3 py-1">
										<input
											class="p-1 w-full border-solid border-2 border-gray-200"
											bind:value={concert.place}
											placeholder="enter a concert place"
											type="text"
										/>
									</td>
									<td class="px-3 py-1">
										<textarea
											class="p-1 w-full"
											bind:value={concert.comment}
											placeholder="enter a comment if needed"
											rows="2"
											cols="50"
										></textarea>
									</td>
									<td class="px-3 py-1">
										<button
											class="bg-red-700 text-sm px-2 py-1 rounded-lg text-white hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 text-center"
											on:click={() => removeConcertDate(concert)}>Remove
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				<button
					class="bg-blue-700 text-sm px-2 py-1 m-2 rounded-lg text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 text-center mt-2"
					on:click={addConcertDate}>Add Concert Date
				</button>
			{/if}
		</div>

		<h3 class="w-full text-center m-1 bg-slate-200">Project managers for this project</h3>
		<div class="m-1">
			{#if !allowModification}
				{#if project.responsibles && project.responsibles.length}
					{#each project.responsibles as responsible}
						<p>{responsible.firstName} {responsible.lastName}</p>
					{/each}
				{:else}
					<p class="text-center">No project manager</p>
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
					}}>Add project manager</button
				>

				<SimpleFilterer
					bind:data={dataHolder}
					showData={false}
					editable={false}
					on:optionsUpdated={() => fetchData()}
					bind:options
					bind:meta
				>
					<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
						{#if contacts}
							{#each contacts as contact}
								<div class="flex items-center p-4 border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 bg-white dark:bg-gray-800">
									<input
										bind:checked={contact.selected}
										id="bordered-checkbox-${contact.id}"
										type="checkbox"
										name="bordered-checkbox"
										class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
									/>
									<label
										for="bordered-checkbox-${contact.id}"
										class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
									>
										{contact.firstName} {contact.lastName}
									</label>
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

<style>
	.table-auto {
	  border-collapse: collapse;
	  width: 100%;
	}
	.table-auto th, .table-auto td {
	  border: 1px solid #ddd;
	  padding: 8px;
	}
	.table-auto th {
	  background-color: #f2f2f2;
	  text-align: left;
	}
	.table-auto tr:nth-child(even) {
	  background-color: #f9f9f9;
	}
	.table-auto tr:hover {
	  background-color: #ddd;
	}

    .item:active {
        cursor: grabbing;
    }
</style>