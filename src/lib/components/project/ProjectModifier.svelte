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
	import ProjectPiecesPicker from './ProjectPiecesPicker.svelte';
	import TimePicker from '../TimePicker.svelte';

	import { onMount, afterUpdate, tick } from 'svelte';
	import Fa from 'svelte-fa';
	import {
		faChevronCircleDown,
		faChevronDown,
		faChevronLeft,
		faChevronUp,
		faPenToSquare,
		faTrash,
		faUser,
		faUsers,
		type IconDefinition
	} from '@fortawesome/free-solid-svg-icons';
	import { slide } from 'svelte/transition';

	export let project: Project;
	export let pieces: Array<Piece>;
	export let sectionGroups: Array<SectionGroup>;
	export let folders: Array<Folder>;
	export let mode: 'modify' | 'create';
	export let urlFront: string;

	let allowModification = mode === 'modify' ? false : true;
	const PROJECT_CREATION_DRAFT_KEY = 'projectCreationDraft';

	let initialSelectedPieces = [...project.pieces];
	let selectedPieces: Piece[] = [...initialSelectedPieces];
	let allPieces: Piece[] = [];
	let draggedPieceId: number | null = null;
	let dragSource: 'available' | 'selected' | null = null;
	let allPiecesContainer: HTMLElement;
	let selectedPiecesContainer: HTMLElement;
	let allPiecesSortable: any;
	let selectedPiecesSortable: any;
	let initialized = false;
	let pieceListsVersion = 0;

	function syncPieceCollections() {
		project.pieces = [...selectedPieces];
	}

	function getCatalogPieceById(pieceId: number): Piece | undefined {
		return (pieces || []).find((piece) => Number(piece.id) === pieceId);
	}

	function sanitizePieceContainer(
		_container?: HTMLElement,
		_expectedIds?: number[]
	) {}

	function cleanupSortableArtifacts() {}

	function syncSelectedPiecesFromDom() {}

	function deriveAvailablePieces() {
		const selectedIds = new Set(selectedPieces.map((piece) => Number(piece.id)));
		allPieces = (pieces || []).filter((piece) => !selectedIds.has(Number(piece.id)));
	}

	function reconcilePiecesAfterRefresh() {
		const catalog = pieces || [];
		const selectedIds = selectedPieces.map((piece) => Number(piece.id));
		const piecesById = new Map(catalog.map((piece) => [Number(piece.id), piece]));
		selectedPieces = selectedIds
			.map((pieceId) => piecesById.get(pieceId))
			.filter((piece): piece is Piece => Boolean(piece));
		syncPieceCollections();
	}

	$: if (pieces) {
		reconcilePiecesAfterRefresh();
	}

	$: project.pieces = [...selectedPieces];
	$: deriveAvailablePieces();

	function startDragging(piece: Piece, source: 'available' | 'selected') {
		if (!allowModification) return;
		draggedPieceId = Number(piece.id);
		dragSource = source;
	}

	function endDragging() {
		draggedPieceId = null;
		dragSource = null;
	}

	function moveDraggedPieceToSelected(targetIndex?: number) {
		if (draggedPieceId === null) return;

		const draggedPiece = getCatalogPieceById(draggedPieceId);
		if (!draggedPiece) {
			endDragging();
			return;
		}

		const nextSelectedPieces = selectedPieces.filter(
			(piece) => Number(piece.id) !== draggedPieceId
		);
		const safeIndex =
			targetIndex === undefined
				? nextSelectedPieces.length
				: Math.max(0, Math.min(targetIndex, nextSelectedPieces.length));

		nextSelectedPieces.splice(safeIndex, 0, draggedPiece);
		selectedPieces = nextSelectedPieces;
		syncPieceCollections();
		endDragging();
	}

	function removeDraggedPieceFromSelected() {
		if (draggedPieceId === null) return;
		selectedPieces = selectedPieces.filter((piece) => Number(piece.id) !== draggedPieceId);
		syncPieceCollections();
		endDragging();
	}

	function handleDropToSelected(targetIndex?: number) {
		if (!allowModification || draggedPieceId === null) return;
		moveDraggedPieceToSelected(targetIndex);
	}

	function handleDropToAvailable() {
		if (!allowModification || draggedPieceId === null) return;
		if (dragSource === 'selected') {
			removeDraggedPieceFromSelected();
			return;
		}
		endDragging();
	}

	function persistProjectDraft() {
		const draft = {
			name: project.name,
			sectionGroupId: project.sectionGroup?.id ?? null,
			folderId: project.folder?.id ?? null,
			pieceIds: selectedPieces.map((piece) => Number(piece.id)),
			rehearsals: project.rehearsals.map((rehearsal) => ({
				...rehearsal,
				startDate: rehearsal.startDate ? new Date(rehearsal.startDate).toISOString() : null,
				endDate: rehearsal.endDate ? new Date(rehearsal.endDate).toISOString() : null
			})),
			concerts: project.concerts.map((concert) => ({
				...concert,
				startDate: concert.startDate ? new Date(concert.startDate).toISOString() : null,
				endDate: concert.endDate ? new Date(concert.endDate).toISOString() : null
			})),
			responsibles: project.responsibles
		};

		window.sessionStorage.setItem(PROJECT_CREATION_DRAFT_KEY, JSON.stringify(draft));
		window.localStorage.setItem(PROJECT_CREATION_DRAFT_KEY, JSON.stringify(draft));
	}

	function openPieceCreationPage() {
		if (!browser) return;
		persistProjectDraft();
		const params = new URLSearchParams({
			create: '1',
			fromProjectCreation: '1',
			returnTo: '/projects/creation'
		});
		goto(`/library/pieces?${params.toString()}`);
	}


	async function initSortableWhenReady() {
		await tick(); // attend que allPiecesContainer soit bindé dans le DOM

		if (allPiecesContainer && selectedPiecesContainer) {
			initializeSortable();
			toggleSortable();
			initialized = true;
		}
	}

	function toLocalDateTimeString(value: string | Date) {
	    const d = new Date(value);

	    const year = d.getFullYear();
	    const month = String(d.getMonth() + 1).padStart(2, '0');
	    const day = String(d.getDate()).padStart(2, '0');
	    const hours = String(d.getHours()).padStart(2, '0');
	    const minutes = String(d.getMinutes()).padStart(2, '0');

	    return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

	function formatDate(value: string | Date) {
	    if (!value) return '';

	    let datePart: string;

	    if (value instanceof Date) {
		    const year = value.getFullYear();
		    const month = String(value.getMonth() + 1).padStart(2, '0');
		    const day = String(value.getDate()).padStart(2, '0');

		    datePart = `${year}-${month}-${day}`;
	    } else {
		    datePart = value.includes('T') ? value.split('T')[0] : value.slice(0, 10);
	        }

	    const [year, month, day] = datePart.split('-').map(Number);
	    const date = new Date(year, month - 1, day);

	    return date.toLocaleDateString('en-GB', {
		    weekday: 'long',
		    day: 'numeric',
		    month: 'long',
		    year: 'numeric'
	    });
    }

    function formatTime(value: string | Date | null = null) {
	    const raw = value instanceof Date ? toLocalDateTimeString(value) : String(value);
	    const timePart = raw.includes('T') ? raw.split('T')[1]?.slice(0, 5) : raw.slice(0, 5);

	    if (!timePart || !timePart.includes(':')) return '';

	    const [hourString, minute] = timePart.split(':');

	    return `${hourString}:${minute} `;
    }

	function initializeSortable() {
		allPiecesSortable = Sortable.create(allPiecesContainer, {
			group: {
				name: 'pieces',
				put: true,
				pull: true
			},
			animation: 200,
			sort: false,
			removeCloneOnHide: true,
			onAdd: (evt: any) => {
				evt.item?.remove();
				syncSelectedPiecesFromDom();
				cleanupSortableArtifacts();
			},
			onEnd: cleanupSortableArtifacts
		});

		selectedPiecesSortable = Sortable.create(selectedPiecesContainer, {
			group: {
				name: 'pieces',
				put: true,
				pull: true
			},
			animation: 200,
			removeCloneOnHide: true,
			onAdd: syncSelectedPiecesFromDom,
			onRemove: syncSelectedPiecesFromDom,
			onUpdate: syncSelectedPiecesFromDom,
			onEnd: cleanupSortableArtifacts
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

	afterUpdate(() => {
		toggleSortable();
		sanitizePieceContainer(
			allPiecesContainer,
			allPieces.map((piece) => Number(piece.id))
		);
		sanitizePieceContainer(
			selectedPiecesContainer,
			selectedPieces.map((piece) => Number(piece.id))
		);
		cleanupSortableArtifacts();
		if (browser && mode === 'create') {
			persistProjectDraft();
		}
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
			{
				id: null,
				startDate: new Date(),
				endDate: new Date(),
				place: '',
				comment: '',
				project_id: null
			}
		];
	}

	function addRehearsalDate() {
		project.rehearsals = [
			...project.rehearsals,
			{
				id: null,
				startDate: new Date(),
				endDate: new Date(),
				comment: '',
				place: '',
				project_id: null
			}
		];
	}

	function toLocalISOString(date: Date | string) {
	    const d = new Date(date);

	    const year = d.getFullYear();
	    const month = String(d.getMonth() + 1).padStart(2, '0');
	    const day = String(d.getDate()).padStart(2, '0');
	    const hours = String(d.getHours()).padStart(2, '0');
	    const minutes = String(d.getMinutes()).padStart(2, '0');
	    const seconds = String(d.getSeconds()).padStart(2, '0');

	    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }

	async function saveProject() {
		const projectToSend = {
			id: project.id || null,
			name: project.name,
			section_group_id: project.sectionGroup ? project.sectionGroup.id : null,
			concerts: project.concerts.map((concert) => ({
				id: concert.id ? concert.id : null,
				start_date: toLocalISOString(concert.startDate),
				end_date: concert.endDate ? toLocalISOString(concert.endDate) : null,
				place: concert.place,
				comment: concert.comment
			})),
			pieces: selectedPieces.map((piece) => ({
				id: piece.id,
				pivot_order: selectedPieces.indexOf(piece)
			})),
			rehearsals: project.rehearsals.map((rehearsal) => ({
				id: rehearsal.id ? rehearsal.id : null,
				start_date: toLocalISOString(rehearsal.startDate),
				end_date: rehearsal.endDate ? toLocalISOString(rehearsal.endDate) : null,
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
			if (browser && mode === 'create') {
				window.sessionStorage.removeItem(PROJECT_CREATION_DRAFT_KEY);
				window.localStorage.removeItem(PROJECT_CREATION_DRAFT_KEY);
			}
			popUpSave = true;
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

	let displayProjectInfo = false;
	let chevronProjectInfo: IconDefinition = faChevronDown;

	let displayProjectPieces = false;
	let chevronPieces: IconDefinition = faChevronDown;

	let displayEvents = false;
	let chevronEvents: IconDefinition = faChevronDown;

	let displayManagers = false;
	let chevronManagers: IconDefinition = faChevronDown;

	let popUpSave = false;

	let isMobile = false;
	let screenDirection : "horizontal" | "vertical" = "vertical";
	let windowWidth : number;

	const checkMobile = () => {
		isMobile = window.innerWidth <= 1000;
	};

	const checkDirection = () => {
        screenDirection = (window.innerWidth > window.innerHeight ? "horizontal" : "vertical");
	};

	onMount(() => {
		checkMobile();
		checkDirection();
		window.addEventListener('resize', checkMobile);
		window.addEventListener('resize', checkDirection);

		return () => {
			window.removeEventListener('resize', checkMobile);
			window.removeEventListener('resize', checkDirection);
		};
	});
</script>

{#if popUpSave}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 ">
		<div
			class="bg-white p-6 min-h-[200px] rounded-xl shadow-xl  text-center flex flex-col items-center justify-center {isMobile ? "h-[20%] w-[80%]" : "h-[20%] w-[20%]"}
		"
		>
			<h2 class="text-xl text-gray-500 font-bold mb-10">Changes saved successfully</h2>
			<button
				class="mt-4 w-[30%] px-4 py-2 bg-[#6b9ad9] text-white rounded"
				on:click={() => {
					popUpSave = false;
					allowModification = false;
				}}>OK</button
			>
		</div>
	</div>
{/if}

<div
	class="max-w-xxl min-h-screen bg-[#E7E7E7] p-4 border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
>
	<div class="flex mb-2">
		<div
			class="bg-[#6b9ad9] text-white font-semibold justify-center flex items-center gap-2 rounded-lg px-6"
		>
			<Fa icon={faChevronLeft} class="text-[14px]" style="color: white;" />
			<a href={`/projects/${project.id}/management`}>Back</a>
		</div>
		{#if mode === 'modify'}
			<div class=" flex w-full p-1 mr-0 ml-auto">
				<button
					on:click={() => (allowModification = !allowModification)}
					class="text-white dark:text-gray-400 hover:bg-[#4f7cb7] dark:hover:text-gray-300 ml-auto bg-[#6B9AD9] p-1.5 rounded-md font-semibold"
				>
					<div class="h-[20px] items-center flex justify-center {allowModification ? 'px-2' : ''}">
						{#if !allowModification}
							<Fa icon={faPenToSquare} class="text-[20px]" style="color: white;" />
						{:else}
							Stop editing
						{/if}
						<div></div>
					</div></button
				>
			</div>
		{/if}
	</div>
	<div class="">
		<div class="pt-4">
			<div class="bg-white border-2 border-gray-500 rounded-lg p-4">
				<div class="flex items-center gap-4">
					<h1 class="font-bold text-lg mb-4">PROJECT INFORMATION</h1>
					<button
						class="mb-4"
						on:click={() => {
							displayProjectInfo = !displayProjectInfo;
							if (chevronProjectInfo === faChevronDown) {
								chevronProjectInfo = faChevronUp;
							} else {
								chevronProjectInfo = faChevronDown;
							}
						}}
					>
						<Fa icon={chevronProjectInfo} style="color : black" />
					</button>
				</div>
				{#if displayProjectInfo}
					<div in:slide={{ duration: 300 }} out:slide={{ duration: 200 }}>
						<div class="flex flex-col ml-4 {isMobile ? "mr-4" : "w-1/2"}">
							<div
								class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500
										{!project.name ? 'text-red-500 placeholder-red-400' : ''}"
								style="width: fit-content;"
							>
								Project Title
							</div>
							<input
								class="p-3 border-2 border-gray-500 rounded-xl focus:outline-none {!allowModification
									? 'pointer-events-none'
									: ''} 
										{!project.name ? 'border-red-500 placeholder-red-400' : ''}"
								bind:value={project.name}
								placeholder="First name"
								required
							/>
							{#if project.name === ''}
								<div class="text-red-500 text-right text-xs ml-10 mr-2 mt-1">
									Project title is required
								</div>
							{/if}
						</div>
						<div>
							<div class="flex  ml-4 w-full mt-4 {isMobile ? "flex-col" : "h-16"}">
								<div class="flex flex-col {isMobile ? "mr-8" : "w-1/2"}">
									<div
										class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500 flex"
										style="width: fit-content;"
									>
										Section
									</div>

									{#if !allowModification}
										<div
											class="p-3 border-2 border-gray-500 z-10 rounded-xl focus:outline-none flex"
										>
											{project.sectionGroup ? project.sectionGroup.name : 'None'}
										</div>
									{:else}
										<select
											class="p-3 border-2 border-gray-500 rounded-xl focus:outline-none"
											bind:value={project.sectionGroup}
										>
											<option value={null}>None</option>

											{#each sectionGroups as sectionGroup}
												<option value={sectionGroup}>{sectionGroup.name}</option>
											{/each}
										</select>
									{/if}
								</div>
								<div class="flex mr-4 ml-auto">
									<a
										href="/sectionGroups"
										class="bg-[#6b9ad9] my-3 ml-auto mr-0 px-4 text-white pointer-events-auto hover:bg-[#4f7cb7] font-semibold justify-center flex items-center gap-2 rounded-lg
										{isMobile ? "p-1" : ""}"
										><button> Manage section groups </button></a
									>
								</div>
							</div>
							{#if project.sectionGroup}
								<p class="ml-4 uppercase mt-3 font-semibold">Composed of</p>
								<div class="grid  text-center gap-x-4 gap-y-3 mt-4 pb-4 mx-4 {isMobile ? "grid-cols-2" : "grid-cols-5"}">
									{#each project.sectionGroup.sections as section}
										<div
											class="flex flex-col border-2 border-gray-400 rounded-full text-gray-500 p-1"
										>
											<p class="text-nowrap font-bold">{section.name}</p>
											<p class="text-nowrap items-center flex justify-center gap-2 font-semibold">
												<Fa icon={faUsers} style="color : #6b9ad9" />
												{section.size}
											</p>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<div
				class="bg-white border-2 border-gray-500 rounded-lg p-4 mt-8"
				class:bg-red-500={displayProjectPieces}
			>
				<div class="flex items-center gap-4">
					<h4 class="font-bold text-lg mb-4 uppercase">Pieces & Folder</h4>
					<button
						class="mb-4"
						on:click={() => {
							displayProjectPieces = !displayProjectPieces;
							if (chevronPieces === faChevronDown) {
								chevronPieces = faChevronUp;
							} else {
								chevronPieces = faChevronDown;
							}
						}}
					>
						<Fa icon={chevronPieces} style="color : black" />
					</button>
				</div>
				{#if displayProjectPieces}
					<div in:slide={{ duration: 300 }} out:slide={{ duration: 200 }}>
						{#if mode === 'create'}
							<div class="mb-4 flex flex-wrap gap-3">
								<button
									type="button"
									class="rounded-lg bg-[#6B9AD9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4f7cb7]"
									on:click={openPieceCreationPage}
								>
									Add piece
								</button>
							</div>
						{/if}
						<ProjectPiecesPicker bind:selectedPieces {pieces} {allowModification} />
						<div class="pb-4 pt-4">
							{#if allowModification}
								<div class="flex flex-col h-16 {isMobile ? "" : "w-1/2"}">
									<div
										class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500"
										style="width: fit-content;"
									>
										Folder
									</div>

									<select
										class="p-3 border-2 border-gray-500 rounded-xl focus:outline-none"
										bind:value={project.folder}
									>
										<option value={null}>None</option>

										{#each folders as folder}
											<option value={folder}>{folder.name}</option>
										{/each}
									</select>
								</div>
							{:else}
								<div class="flex flex-col {isMobile ? "" : "w-1/2"}">
									<div
										class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500 flex"
										style="width: fit-content;"
									>
										Folder
									</div>

									<div class="p-3 border-2 border-gray-500 z-10 rounded-xl focus:outline-none flex">
										{project.folder ? project.folder.name : 'None'}
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<div class="bg-white border-2 border-gray-500 rounded-lg p-4 mt-8">
				<div class="flex items-center gap-4">
					<h4 class="font-bold text-lg mb-4 uppercase">Events</h4>
					<button
						class="mb-4"
						on:click={() => {
							displayEvents = !displayEvents;
							if (chevronEvents === faChevronDown) {
								chevronEvents = faChevronUp;
							} else {
								chevronEvents = faChevronDown;
							}
						}}
					>
						<Fa icon={chevronEvents} style="color : black" />
					</button>
				</div>

				{#if displayEvents}
					<div in:slide={{ duration: 300 }} out:slide={{ duration: 200 }}>
						<h4 class="text-lg p-1 font-semibold text-gray-500">Rehearsals</h4>
						<div class="p-1">
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
															{formatTime(rehearsal.startDate)} - {formatTime(rehearsal.endDate)}
					                                        {' | '}
                                                            {formatDate(rehearsal.startDate)}
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
												<th class="px-3 py-1">Date</th>
												<th class="px-3 py-1">Start Time</th>
												<th class="px-3 py-1">End Time</th>
												<th class="px-3 py-1">Place</th>
												<th class="px-3 py-1">Comment</th>
												<th class="px-3 py-1">Actions</th>
											</tr>
										</thead>
										<tbody>
											{#each project.rehearsals as rehearsal}
												<tr class="rehearsal-entry">
													<td class="px-3 py-1">
														<DatePicker bind:date={rehearsal.startDate} on:change={() => rehearsal.endDate = new Date(rehearsal.startDate)}/>
													</td>
													<td class="px-3 py-1">
														<TimePicker bind:date={rehearsal.startDate} />
													</td>
													<td class="px-3 py-1">
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
															on:click={() => removeRehearsalDate(rehearsal)}
															>Remove
														</button>
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
								<button
									class="hover:bg-[#4f7cb7] bg-[#6B9AD9] font-semibold text-sm px-2 py-1 m-2 rounded-lg text-white focus:outline-none focus:ring-4 focus:ring-blue-300 text-center mt-2"
									on:click={addRehearsalDate}
									>Add Rehearsal
								</button>
							{/if}
						</div>

						<h4 class="text-lg p-1 font-semibold text-gray-500">Concerts</h4>
						<div class="p-1">
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
															{formatTime(concert.startDate)} - {formatTime(concert.endDate)}
                                                            {' | '}
                                                            {formatDate(concert.startDate)}
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
												<th class="px-3 py-1">Date</th>
												<th class="px-3 py-1">Start Time</th>
												<th class="px-3 py-1">End Time</th>
												<th class="px-3 py-1">Place</th>
												<th class="px-3 py-1">Comment</th>
												<th class="px-3 py-1">Actions</th>
											</tr>
										</thead>
										<tbody>
											{#each project.concerts as concert}
												<tr class="concert-entry">
													<td class="px-3 py-1">
														<DatePicker bind:date={concert.startDate} on:change={() => concert.endDate = new Date(concert.startDate)}/> <!--Changed this to avoid having to set separate start and end dates (events are always on one day). This should not change the backend.-->
													</td>
													<td class="px-3 py-1">
														<TimePicker bind:date={concert.startDate} />
													</td>
													<td class="px-3 py-1">
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
															on:click={() => removeConcertDate(concert)}
															>Remove
														</button>
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
								<button
									class="hover:bg-[#4f7cb7] bg-[#6B9AD9] font-semibold text-sm px-2 py-1 m-2 rounded-lg text-white focus:outline-none focus:ring-4 focus:ring-blue-300 text-center mt-2"
									on:click={addConcertDate}
									>Add Concert
								</button>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<div class="bg-white border-2 border-gray-500 rounded-lg p-4 mt-8">
				<div class="flex items-center gap-4">
					<h4 class="font-bold text-lg mb-4 uppercase">managers</h4>
					<button
						class="mb-4"
						on:click={() => {
							displayManagers = !displayManagers;
							if (chevronManagers === faChevronDown) {
								chevronManagers = faChevronUp;
							} else {
								chevronManagers = faChevronDown;
							}
						}}
					>
						<Fa icon={chevronManagers} style="color : black" />
					</button>
				</div>

				{#if displayManagers}
					<div in:slide={{ duration: 300 }} out:slide={{ duration: 200 }}>
						<div class="p-1 w-full">
							<div class="text-sm py-6 grid  gap-4 {isMobile ? "" : "grid-cols-5"}">
								{#if project.responsibles && project.responsibles.length === 0}
									<p class="text-center">No project manager</p>
								{:else}
									{#each project.responsibles as responsible}
										<div
											class="pl-4 border-2 border-gray-400 text-sm flex items-center gap-3 rounded-full p-2"
										>
											<Fa icon={faUser} class="text-[16px]" style="color: #6B9AD9;" />
											<div class="flex flex-col w-full">
												<p class="overflow-hidden text-gray-500 font-semibold text-md">
													{responsible.firstName}
													{responsible.lastName}
												</p>
											</div>
											{#if allowModification}
												<button
													class="bg-red-400 hover:bg-red-500 text-sm px-2 py-1 rounded-lg text-white focus:outline-none focus:ring-4 focus:ring-red-300 text-center"
													on:click={() =>
														(project.responsibles = project.responsibles.filter(
															(contact) => contact !== responsible
														))}><Fa icon={faTrash} style="color: white;" /></button
												>
											{/if}
										</div>
									{/each}
									
								{/if}
							</div>
							{#if allowModification}
										<div class="w-full">
											<button
												class="bg-blue-700 text-sm px-2 py-1 rounded-lg text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 text-center"
												on:click={() => {
													project.responsibles = [
														...project.responsibles,
														...contacts.filter((contact) => {
															if (
																project.responsibles.find(
																	(responsible) => responsible.id === contact.id
																)
															)
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
												<div
													class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4"
												>
													{#if contacts}
														{#each contacts as contact}
															<div
																class="flex items-center p-4 border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 bg-white dark:bg-gray-800"
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
																	class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
																>
																	{contact.firstName}
																	{contact.lastName}
																</label>
															</div>
														{/each}
													{/if}
												</div>
											</SimpleFilterer>
										</div>
									{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>

		{#if allowModification}
			<div class=" pt-4 flex gap-4 {isMobile ? "" : "w-1/4"}">
				<button
					on:click={saveProject}
					class="hover:bg-[#4f7cb7] bg-[#6B9AD9] text-white font-bold p-2 rounded-lg flex-1"
				>
					Save
				</button>
				{#if mode == 'modify'}
					<button
						on:click={deleteProject}
						class="bg-red-400 hover:bg-red-500 text-white font-bold p-2 flex-1 rounded-lg"
					>
						Delete
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.table-auto {
		border-collapse: collapse;
		width: 100%;
	}
	.table-auto th,
	.table-auto td {
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
</style>
