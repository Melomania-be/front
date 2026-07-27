<script lang="ts">
	import { afterUpdate, onMount } from 'svelte';

	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';
	import { beforeNavigate, goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { TableData } from '$lib/types/TableData';
	import type { Piece } from '$lib/types/Piece';
	import Swal from 'sweetalert2';
	import type { Composer } from '$lib/types/Composer';
	import type { TypeOfPiece } from '$lib/types/TypeOfPiece';
	import type { Folder } from '$lib/types/Folder';

	import Fa from 'svelte-fa';
	import { faCalendar, faPerson } from '@fortawesome/free-solid-svg-icons';

	let selectedData: Piece | null = null;

	let piece: Piece[] = [];
	let meta: any = {};
	let options: any = {
		filter: '',
		limit: 250,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};

	let listComposers: Composer[] = [];
	let listTypeOfPieces: TypeOfPiece[] = [];
	let folderList: Folder[] = [];

	let url = '/api/pieces';
	let urlFront = '/library/pieces';
	let uniqueUrl = '/library/pieces';
	let urlComposerS = '/api/composers';
	let urlTypeOfPieces = '/api/type_of_pieces';
	let urlFolders = '/api/folders';
	let isProjectCreationFlow = false;
	let isPieceCreationFlow = false;
	let createMode = false;
	let returnToUrl = '/projects/creation';
	const PIECE_CREATION_DRAFT_KEY = 'pieceCreationDraft';
	let pendingSelectedPiece: Partial<Piece> | null = null;

	let dataHolder: TableData<Piece>;

	let newPiece = {
		arranger: null,
		folderId: null,
		folder: null,
		composer: null,
		composerId: null,
		CreatedAt: new Date(),
		id: 0,
		name: null,
		opus: null,
		typeOfPiece: null,
		typeOfPieceId: null,
		updatedAt: null,
		yearOfComposition: null
	} as unknown as Piece;

	function serializePieceDraft() {
		return {
			isOpen: selectedData !== null,
			piece: selectedData
				? {
						...selectedData,
						composerId: selectedData.composer?.id ?? null,
						typeOfPieceId: selectedData.typeOfPiece?.id ?? null,
						folderId: selectedData.folder?.id ?? null,
						composer: null,
						typeOfPiece: null,
						folder: null
					}
				: null
		};
	}

	function normalizePieceSelection(pieceDraft: Partial<Piece>) {
		return {
			...pieceDraft,
			composer:
				listComposers.find(
					(composer) => Number(composer.id) === Number(pieceDraft.composerId)
				) || null,
			typeOfPiece:
				listTypeOfPieces.find(
					(typeOfPiece) => Number(typeOfPiece.id) === Number(pieceDraft.typeOfPieceId)
				) || null,
			folder:
				folderList.find((folder) => Number(folder.id) === Number(pieceDraft.folderId)) || null
		} as Piece;
	}

	function persistPieceDraft() {
		if (!browser) return;
		const serializedDraft = JSON.stringify(serializePieceDraft());
		window.sessionStorage.setItem(PIECE_CREATION_DRAFT_KEY, serializedDraft);
		window.localStorage.setItem(PIECE_CREATION_DRAFT_KEY, serializedDraft);
	}

	function clearPieceDraft() {
		if (!browser) return;
		window.sessionStorage.removeItem(PIECE_CREATION_DRAFT_KEY);
		window.localStorage.removeItem(PIECE_CREATION_DRAFT_KEY);
	}

	function restorePieceDraft() {
		if (!browser) return;
		const rawDraft =
			window.sessionStorage.getItem(PIECE_CREATION_DRAFT_KEY) ||
			window.localStorage.getItem(PIECE_CREATION_DRAFT_KEY);
		if (!rawDraft) return;

		try {
			const draft = JSON.parse(rawDraft);
			if (!draft?.isOpen || !draft?.piece) {
				selectedData = null;
				return;
			}

			selectedData = normalizePieceSelection(draft.piece);
		} catch {
			clearPieceDraft();
		}
	}

	function buildCurrentPiecePageUrl() {
		const params = new URLSearchParams();
		if (createMode) params.set('create', '1');
		if (isProjectCreationFlow) params.set('fromProjectCreation', '1');
		if (returnToUrl) params.set('returnTo', returnToUrl);
		if (selectedData !== null) {
			params.set('selected', encodeURIComponent(JSON.stringify(serializePieceDraft().piece)));
		}
		return `/library/pieces${params.toString() ? `?${params.toString()}` : ''}`;
	}

	function openComposerCreationPage() {
		if (!browser) return;
		persistPieceDraft();
		const params = new URLSearchParams({
			create: '1',
			fromPieceCreation: '1',
			returnTo: buildCurrentPiecePageUrl()
		});
		goto(`/library/composers?${params.toString()}`);
	}

	function openTypeOfPieceCreationPage() {
		if (!browser) return;
		persistPieceDraft();
		const params = new URLSearchParams({
			create: '1',
			fromPieceCreation: '1',
			returnTo: buildCurrentPiecePageUrl()
		});
		goto(`/library/type_of_pieces?${params.toString()}`);
	}

	function updateProjectFlowUrls() {
		if (!isProjectCreationFlow) return;

		const flowParams = new URLSearchParams({
			fromProjectCreation: '1',
			returnTo: returnToUrl
		});

		if (createMode) {
			flowParams.set('create', '1');
		}

		urlFront = `/library/pieces?${flowParams.toString()}`;
		uniqueUrl = urlFront;
	}

	onMount(async () => {
		const urlParams = new URLSearchParams(window.location.search);
		options = {
			filter: urlParams.get('filter') || options.filter,
			limit: parseInt(urlParams.get('limit') || options.limit.toString()),
			page: parseInt(urlParams.get('page') || options.page.toString()),
			order: urlParams.get('order') || options.order,
			orderBy: urlParams.get('orderBy') || options.orderBy
		};
		isProjectCreationFlow = urlParams.get('fromProjectCreation') === '1';
		isPieceCreationFlow = urlParams.get('fromPieceCreation') === '1';
		createMode = urlParams.get('create') === '1';
		returnToUrl = urlParams.get('returnTo') || '/projects/creation';
		updateProjectFlowUrls();

		const selectedParam = urlParams.get('selected');
		if (selectedParam) {
			try {
				pendingSelectedPiece = JSON.parse(decodeURIComponent(selectedParam));
				selectedData = { ...pendingSelectedPiece } as Piece;
			} catch (e) {
				console.error('Error parsing selected piece:', e);
			}
		}

		if (createMode && !selectedData) {
			selectedData = { ...newPiece };
		}

		await fetchData();
		if (pendingSelectedPiece) {
			selectedData = normalizePieceSelection(pendingSelectedPiece);
			pendingSelectedPiece = null;
		} else {
			restorePieceDraft();
		}
	});

	beforeNavigate((navigation) => {
		if (!browser) return;
		if (!navigation.to?.url) {
			clearPieceDraft();
			return;
		}

		const pathname = navigation.to.url.pathname;
		const search = navigation.to.url.search;
		if (pathname === '/library/pieces') return;
		if (
			(pathname === '/library/composers' || pathname === '/library/type_of_pieces') &&
			new URLSearchParams(search).get('fromPieceCreation') === '1'
		) {
			persistPieceDraft();
			return;
		}
		clearPieceDraft();
	});

	async function fetchData() {
		let optionInUrls = `?page=${options.page}&limit=${options.limit}`;
		optionInUrls += '&filter=' + options.filter;
		optionInUrls += '&orderBy=' + options.orderBy;
		optionInUrls += '&order=' + options.order;

		const baseOptionInUrls = `?page=1&limit=1000000&filter=&orderBy=id&order=asc`;
		const frontUrl = urlFront.includes('?')
			? `${urlFront}${optionInUrls.replace('?', '&')}`
			: `${urlFront}${optionInUrls}`;

		if (browser) goto(frontUrl);

		const response = await fetch(`${url}${optionInUrls}`, {
			method: 'GET'
		});

		const responseHandler = new ResponseHandlerClient();

		await responseHandler.handle(response, async () => {
			const data = await response.json();

			piece = data.data;
			meta = data.meta;

			dataHolder = {
				data: piece,
				columns: ['id', 'name'],
				notOrderedColumns: []
			};
		});

		const responseComposer = await fetch(`${urlComposerS}${baseOptionInUrls}`, {
			method: 'GET'
		});

		const responseHandlerComposer = new ResponseHandlerClient();

		await responseHandlerComposer.handle(responseComposer, async () => {
			const data = await responseComposer.json();
			listComposers = data.data;
		});

		const responseTypeOfPieces = await fetch(`${urlTypeOfPieces}${baseOptionInUrls}`, {
			method: 'GET'
		});

		const responseHandlerTypeOfPieces = new ResponseHandlerClient();

		await responseHandlerTypeOfPieces.handle(responseTypeOfPieces, async () => {
			const data = await responseTypeOfPieces.json();
			listTypeOfPieces = data.data;
		});

		const responseFolders = await fetch(`${urlFolders}`, {
			method: 'GET'
		});

		const responseHandlerFolders = new ResponseHandlerClient();

		await responseHandlerFolders.handle(responseFolders, async () => {
			const data = await responseFolders.json();
			folderList = data;
		});
	}

	async function errorEvent(response: Response) {
		if (response.status >= 400 && response.status < 500) {
			const jsonResponse = await response.json();
			const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
			alert(error);
		} else if (response.status >= 500) {
			alert('Server error');
		}
	}

	async function addPiece() {
		if (!selectedData) return;

		if (
			selectedData.composer &&
			selectedData.name &&
			selectedData.opus &&
			selectedData.typeOfPiece &&
			selectedData.yearOfComposition
		) {
			const data = {
				id: selectedData.id ? selectedData.id : undefined,
				arranger: selectedData.arranger,
				composer_id: selectedData.composer?.id,
				folder_id: selectedData.folder?.id || null,
				name: selectedData.name,
				opus: selectedData.opus,
				type_of_piece_id: selectedData.typeOfPiece?.id,
				year_of_composition: selectedData.yearOfComposition || ''
			};

			if (data.id == 0) {
				data.id = undefined;
			}

			const response = await fetch('/api/pieces', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});

			errorEvent(response);

			if (response.ok) {
				await response.json();
				if ((isProjectCreationFlow || isPieceCreationFlow) && data.id === undefined) {
					clearPieceDraft();
					await fetchData();
					selectedData = { ...newPiece };
					return;
				}

				clearPieceDraft();
				window.location.reload();
			}
		}
	}

	async function PopupdeletePiece() {
		Swal.fire({
			title: 'Are you sure?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete it!'
		}).then((result) => {
			if (result.isConfirmed) {
				deletePiece();
				Swal.fire({
					title: 'Deleted!',
					text: 'Your file has been deleted.',
					icon: 'success'
				});
			}
		});
	}

	async function deletePiece() {
		const response = await fetch('/api/pieces', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(selectedData)
		});

		errorEvent(response);

		if (response.ok) {
			window.location.reload();
		}
	}

	afterUpdate(() => {
		if (browser) {
			persistPieceDraft();
		}
	});
</script>

<div class="responsive-container">
	<div class="w-full">
		{#if isProjectCreationFlow}
			<div class="mb-4 flex justify-end pr-2 pt-2">
				<button
					type="button"
					class="rounded-lg bg-[#6B9AD9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4f7cb7]"
					on:click={() => goto(returnToUrl)}
				>
					Back to project creation
				</button>
			</div>
		{/if}
		{#if isPieceCreationFlow}
			<div class="mb-4 flex justify-end pr-2 pt-2">
				<button
					type="button"
					class="rounded-lg bg-[#6B9AD9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4f7cb7]"
					on:click={() => goto(returnToUrl)}
				>
					Back to piece creation
				</button>
			</div>
		{/if}

		<div class="w-full">
			<div class="flex flex-col items-start">
				<button
					on:click={() => (selectedData = { ...newPiece })}
					class="m-1 p-1 rounded-full border border-blue-700 hover:bg-slate-200"
				>
					Add new piece
				</button>
				{#if selectedData != null}
					<button
						type="button"
						class="m-1 p-1 rounded-full border border-blue-700 hover:bg-slate-200"
						on:click={openTypeOfPieceCreationPage}
					>
						Add new type of piece
					</button>
					<button
						type="button"
						class="m-1 p-1 rounded-full border border-blue-700 hover:bg-slate-200"
						on:click={openComposerCreationPage}
					>
						Add new composer
					</button>
				{/if}
			</div>
		</div>

		{#if selectedData != null}
			<form class="justify-center w-full max-w-2xl mx-auto" on:submit|preventDefault={addPiece}>
				<div class="flex justify-between items-center">
					<h1 class="text-4xl font-extrabold dark:text-white">Piece</h1>
					<button
						on:click={() => (selectedData = null)}
						type="button"
						class="m-2 p-2 rounded-full border border-red-700 hover:bg-red-200"
					>
						Close
					</button>
				</div>

				<div class="flex">
					<div class="flex flex-col">
						<label
							for="piece-name"
							class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">*Piece name</label
						>
						<div class="flex">
							<span
								class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border rounded-e-0 border-gray-300 border-e-0 rounded-s-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600"
							>
								<svg
									class="w-4 h-4 text-gray-500 dark:text-gray-400"
									aria-hidden="true"
									xmlns="http://www.w3.org/2000/svg"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z"
									/>
								</svg>
							</span>
							<input
								bind:value={selectedData.name}
								type="text"
								id="piece-name"
								class="rounded-none rounded-e-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
								placeholder="Piece name"
								required
							/>
						</div>
					</div>

					<div class="flex flex-col">
						<label
							for="piece-opus"
							class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">*Opus number</label
						>
						<div class="flex">
							<input
								bind:value={selectedData.opus}
								type="text"
								id="piece-opus"
								class="rounded-none rounded-e-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
								placeholder="ex: Op. 9 n°2"
								required
							/>
						</div>
					</div>
				</div>

				<label
					for="piece-arranger"
					class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Arranger name</label
				>
				<div class="flex">
					<span
						class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border rounded-e-0 border-gray-300 border-e-0 rounded-s-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600"
					>
						<svg
							class="w-4 h-4 text-gray-500 dark:text-gray-400"
							aria-hidden="true"
							xmlns="http://www.w3.org/2000/svg"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<Fa icon={faPerson} />
						</svg>
					</span>
					<input
						bind:value={selectedData.arranger}
						type="text"
						id="piece-arranger"
						class="rounded-none rounded-e-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
						placeholder="Arranger name"
					/>
				</div>

				<label
					for="piece-year"
					class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">*Year of composition</label
				>
				<div class="flex">
					<span
						class="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border rounded-e-0 border-gray-300 border-e-0 rounded-s-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600"
					>
						<svg
							class="w-4 h-4 text-gray-500 dark:text-gray-400"
							aria-hidden="true"
							xmlns="http://www.w3.org/2000/svg"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<Fa icon={faCalendar} />
						</svg>
					</span>
					<input
						bind:value={selectedData.yearOfComposition}
						type="text"
						id="piece-year"
						class="rounded-none rounded-e-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
						required
					/>
				</div>

				<div class="flex">
					<div class="w-1/2">
						<label for="piece-folder" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
							>Folder</label
						>
						<select
							bind:value={selectedData.folder}
							id="piece-folder"
							class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
						>
							{#if selectedData.folder !== null}
								<optgroup label="Folder linked">
									<option value={selectedData.folder}>{selectedData.folder.name}</option>
								</optgroup>
							{/if}
							<optgroup label="All folders">
								<option value={null}>None</option>
								{#each folderList as folder}
									<option value={folder}>{folder.name}</option>
								{/each}
							</optgroup>
						</select>
					</div>

					<div class="w-1/2">
						<label for="piece-type" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
							>*Type of piece</label
						>
						<select
							bind:value={selectedData.typeOfPiece}
							id="piece-type"
							class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
							required
						>
							{#if selectedData.typeOfPiece !== null}
								<optgroup label="Type of Piece">
									<option value={selectedData.typeOfPiece}>{selectedData.typeOfPiece?.name}</option>
								</optgroup>
							{/if}
							<optgroup label="All type of Piece">
								<option value={null}>None</option>
								{#each listTypeOfPieces as typeOfPiece}
									<option value={typeOfPiece}>{typeOfPiece.name}</option>
								{/each}
							</optgroup>
						</select>
					</div>
				</div>

				<div class="max-w-sm mx-auto">
					<label for="piece-composer" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
						>*Composer</label
					>
					<select
						bind:value={selectedData.composer}
						id="piece-composer"
						class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
						required
					>
						{#if selectedData.composer !== null}
							<optgroup label="Composer of the Piece">
								<option value={selectedData.composer}>{selectedData.composer.longName}</option>
							</optgroup>
						{/if}
						<optgroup label="All Composer">
							<option value={null}>None</option>
							{#each listComposers as composer}
								<option value={composer}>{composer.longName}</option>
							{/each}
						</optgroup>
					</select>
				</div>

				<p class="ms-auto text-xs text-gray-500 dark:text-gray-400">*Required to add or edit.</p>

				<div class="flex p-2">
					{#if selectedData.id == 0}
						<button
							type="submit"
							class="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
							>Add</button
						>
					{:else}
						<button
							type="submit"
							class="focus:outline-none text-white bg-yellow-400 hover:bg-yellow-500 focus:ring-4 focus:ring-yellow-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:focus:ring-yellow-900"
							>Edit</button
						>
						<button
							on:click={PopupdeletePiece}
							type="button"
							class="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
							>Delete</button
						>
					{/if}
				</div>
			</form>
		{/if}

		{#if dataHolder}
			<SimpleFilterer
				showData={true}
				paginatorTop={false}
				bind:data={dataHolder}
				bind:meta
				bind:options
				bind:uniqueUrl
				on:optionsUpdated={() => fetchData()}
				buttonLinkId={false}
				editable={true}
				bind:selectedData
			></SimpleFilterer>
		{/if}
	</div>
</div>
