<script lang="ts">
	import { onMount } from 'svelte';

	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { TableData } from '$lib/types/TableData';
	import type { Piece } from '$lib/types/Piece';
	import Swal from 'sweetalert2'
	import type { Composer } from '$lib/types/Composer';
	import type { TypeOfPiece } from '$lib/types/TypeOfPiece';
	import type { Folder } from '$lib/types/Folder';

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

		if (browser) goto(`${urlFront}${optionInUrls}`);

		const response = await fetch(`${url}${optionInUrls}`, {
			method: 'GET'
		});

		const responseHandler = new ResponseHandlerClient();

		responseHandler.handle(response, async () => {
			const data = await response.json();

			piece = data

            meta = data.meta;

			dataHolder = {
				data: piece,
				columns: ['id', 'name'],
				notOrderedColumns: []
			};

			selectedData = piece[0];
			
		});

		//récupération des composers
		const responseComposer = await fetch(`${urlComposerS}${optionInUrls}`, {
			method: 'GET'
		});

		const responseHandlerComposer = new ResponseHandlerClient();

		responseHandlerComposer.handle(responseComposer, async () => {
			const data = await responseComposer.json();
			console.log(data)
			
			listComposers = data;
		});

		//récupération des Type Of Pieces
		const responseTypeOfPieces = await fetch(`${urlTypeOfPieces}${optionInUrls}`, {
			method: 'GET'
		});

		const responseHandlerTypeOfPieces = new ResponseHandlerClient();

		responseHandlerTypeOfPieces.handle(responseTypeOfPieces, async () => {
			const data = await responseTypeOfPieces.json();
			
			listTypeOfPieces = data;
		});

		//récupération des Folders
		const responseFolders = await fetch(`${urlFolders}`, {
			method: 'GET'
		});

		const responseHandlerFolders = new ResponseHandlerClient();

		responseHandlerFolders.handle(responseFolders, async () => {
			const data = await responseFolders.json();
			
			folderList = data;
			console.log(folderList)
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


	async function PopupdeletePiece() {
		Swal.fire({
			title: "Are you sure?",
			text: "You won't be able to revert this!",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#3085d6",
			cancelButtonColor: "#d33",
			confirmButtonText: "Yes, delete it!"
		}).then((result) => {
			if (result.isConfirmed) {
				deletePiece()
				Swal.fire({
				title: "Deleted!",
				text: "Your file has been deleted.",
				icon: "success"
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
        {#if dataHolder}
            <SimpleFilterer
                showData={true}
                bind:data={dataHolder}
                bind:meta
                bind:options
                bind:uniqueUrl
                on:optionsUpdated={() => fetchData()}
				buttonLinkId={false}
				bind:selectedData
            ></SimpleFilterer>
        {/if}
    </div>


	<!--affichage des pieces-->
	<div class="justify-center w-1/2">
		{#if selectedData}
			<div class="flex flex-col w-1/2 border-2 border-rose-500">
				<div class="flex justify-center border-2 border-rose-500">piece</div>
				<div class="flex flex-col p-2">
					<span>Name</span>
					<input class="p-1" bind:value={selectedData.name} placeholder="enter the full name" />

					<span>Arranger</span>
					<input class="p-1" bind:value={selectedData.arranger} placeholder="enter the Arranger" />

					<span>Opus</span>
					<input
						class="p-1"
						bind:value={selectedData.opus}
						placeholder="enter the name of the opus"
					/>

					<span>Year of composition</span>
					<input
						class="p-1"
						bind:value={selectedData.yearOfComposition}
						placeholder="enter the year"
					/>

					<span>Composer</span>
					<select class="flex w-1/2" bind:value={selectedData.composer}>
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

					<span>Folder</span>
					<select class="flex w-1/2" bind:value={selectedData.folder}>
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

					<span>Type of piece</span>
					<select class="flex w-1/2" bind:value={selectedData.typeOfPiece}>
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

				<div class="flex p-2">
					{#if selectedData.id == null}
						<button class="p-1 border-2 border-green-500" on:click={addPiece}> add </button>
					{:else}
						<button class="p-1 border-2 border-orange-500" on:click={addPiece}> modify </button>
						<button class="p-1 border-2 border-red-500" on:click={PopupdeletePiece}> Delete </button>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>