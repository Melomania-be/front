<script lang="ts">
	import { onMount } from 'svelte';

	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { TableData } from '$lib/types/TableData';
	import type { Piece } from '$lib/types/Piece';
	import Swal from 'sweetalert2';
	import type { Composer } from '$lib/types/Composer';
	import type { TypeOfPiece } from '$lib/types/TypeOfPiece';
	import type { Folder } from '$lib/types/Folder';

	import Fa from 'svelte-fa';
	import { faCalendar, faGlobe, faPerson } from '@fortawesome/free-solid-svg-icons';

	let selectedData: Piece;

	let piece: Piece[] = [];
	let meta: any = {};
	let options: any = {
		filter: '',
		limit: 1000000000,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};

	let listComposers: Composer[] = [];
	let listTypeOfPieces: TypeOfPiece[] = [];
	let folderList: Array<Folder> = [];

	let url: string = '/api/pieces';
	let urlFront: string = '/library/pieces';
	let uniqueUrl: string = '/library/pieces';
	let urlComposerS: string = '/api/composers';
	let urlTypeOfPieces: string = '/api/type_of_pieces';
	let urlFolders: string = '/api/folders';

	let dataHolder: TableData<Piece>;

	let newPiece: Piece = {
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
	};

	onMount(async () => {
		const urlParams = new URLSearchParams(window.location.search);

		options = {
			filter: urlParams.get('filter') || '',
			limit: parseInt(urlParams.get('limit') || '1000000000'),
			page: parseInt(urlParams.get('page') || '1'),
			order: urlParams.get('order') || 'asc',
			orderBy: urlParams.get('orderBy') || 'id'
		};

		fetchData();
	});

	async function fetchData() {
		let optionInUrls = `?page=${options.page}&limit=${options.limit}`;
		optionInUrls += '&filter=' + options.filter;
		optionInUrls += '&orderBy=' + options.orderBy;
		optionInUrls += '&order=' + options.order;

		let baseOptionInUrls = `?page=1&limit=1000000&filter=&orderBy=id&order=asc`;

		if (browser) goto(`${urlFront}${optionInUrls}`);

		const response = await fetch(`${url}${optionInUrls}`, {
			method: 'GET'
		});

		const responseHandler = new ResponseHandlerClient();

		responseHandler.handle(response, async () => {
			const data = await response.json();

			piece = data.data;

			meta = data.meta;

			dataHolder = {
				data: piece,
				columns: ['id', 'name'],
				notOrderedColumns: []
			};
		});

		//récupération des composers
		const responseComposer = await fetch(`${urlComposerS}${baseOptionInUrls}`, {
			method: 'GET'
		});

		const responseHandlerComposer = new ResponseHandlerClient();

		responseHandlerComposer.handle(responseComposer, async () => {
			const data = await responseComposer.json();

			listComposers = data.data;
		});

		//récupération des Type Of Pieces
		const responseTypeOfPieces = await fetch(`${urlTypeOfPieces}${baseOptionInUrls}`, {
			method: 'GET'
		});

		const responseHandlerTypeOfPieces = new ResponseHandlerClient();

		responseHandlerTypeOfPieces.handle(responseTypeOfPieces, async () => {
			const data = await responseTypeOfPieces.json();

			listTypeOfPieces = data.data;
		});

		//récupération des Folders
		const responseFolders = await fetch(`${urlFolders}`, {
			method: 'GET'
		});

		const responseHandlerFolders = new ResponseHandlerClient();

		responseHandlerFolders.handle(responseFolders, async () => {
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

	//api piece
	async function addPiece() {
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
</script>

<div class="flex">
	<div class="w-1/2">
		<div class="w-full">
			<button
				on:click={() => (selectedData = newPiece)}
				class="m-1 p-1 rounded-full border border-blue-700 hover:bg-slate-200"
			>
				Add new piece
			</button>
		</div>
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

	<!--affichage des pieces-->
	<form class="justify-center w-1/2">
		{#if selectedData == null}
			<h1 class="text-4xl font-extrabold dark:text-white">Select a Piece</h1>
		{:else}
			<h1 class="text-4xl font-extrabold dark:text-white">Piece</h1>

			<div class="flex">
				<div class="flex flex-col">
					<label
						for="website-admin"
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
							id="website-admin"
							class="rounded-none rounded-e-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
							placeholder="Piece name"
							required
						/>
					</div>
				</div>

				<div class="flex flex-col">
					<label
						for="website-admin"
						class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">*Opus number</label
					>
					<div class="flex">
						<input
							bind:value={selectedData.opus}
							type="text"
							id="website-admin"
							class="rounded-none rounded-e-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
							placeholder="ex: Op. 9 n°2"
							required
						/>
					</div>
				</div>
			</div>

			<label
				for="website-admin"
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
					id="website-admin"
					class="rounded-none rounded-e-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
					placeholder="Arranger name"
				/>
			</div>

			<label
				for="website-admin"
				class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
				>*Year of composition</label
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
					id="website-admin"
					class="rounded-none rounded-e-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
					required
				/>
			</div>

			<div class="flex">
				<div class="w-1/2">
					<label for="Composer" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
						>Folder</label
					>
					<select
						bind:value={selectedData.folder}
						id="Composer"
						class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
					>
						{#if selectedData.folder !== null}
							<optgroup label="Folder linked">
								<option value={selectedData.folder}>{selectedData.folder.name}</option>
							</optgroup>
						{/if}
						<optgroup label="All folders">
							<option value={null}>None</option>
							{#if folderList}
								{#each folderList as folder}
									<option value={folder}>{folder.name}</option>
								{/each}
							{/if}
						</optgroup>
					</select>
				</div>

				<div class="w-1/2">
					<label for="Composer" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
						>*Type of piece</label
					>
					<select
						bind:value={selectedData.typeOfPiece}
						id="Composer"
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
							{#if listTypeOfPieces}
								{#each listTypeOfPieces as typeOfPiece}
									<option value={typeOfPiece}>{typeOfPiece.name}</option>
								{/each}
							{/if}
						</optgroup>
					</select>
				</div>
			</div>

			<form class="max-w-sm mx-auto">
				<label for="Composer" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
					>*Composer</label
				>
				<select
					bind:value={selectedData.composer}
					id="Composer"
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
						{#if listComposers}
							{#each listComposers as composer}
								<option value={composer}>{composer.longName}</option>
							{/each}
						{/if}
					</optgroup>
				</select>
			</form>
			<p class="ms-auto text-xs text-gray-500 dark:text-gray-400">*Required to add or edit.</p>

			<div class="flex p-2">
				{#if selectedData.id == 0}
					<button
						on:click={addPiece}
						type="submit"
						class="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
						>Add</button
					>
				{:else}
					<button
						on:click={addPiece}
						type="submit"
						class="focus:outline-none text-white bg-yellow-400 hover:bg-yellow-500 focus:ring-4 focus:ring-yellow-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:focus:ring-yellow-900"
						>Edit</button
					>
					<button
						on:click={deletePiece}
						type="button"
						class="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
						>Delete</button
					>
				{/if}
			</div>
		{/if}
	</form>
</div>
