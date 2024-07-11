<script lang="ts">
    import type { TypeOfPiece } from '$lib/types/TypeOfPiece';
    import type { Composer } from '$lib/types/Composer';
	import type { Piece } from '$lib/types/Piece';
    import type { Folder } from '$lib/types/Folder';
	import { onMount } from 'svelte';
	import Swal from 'sweetalert2';
    import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
    import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { TableData } from '$lib/types/TableData';
	import type { List } from '$lib/types/List';
	import type { CustomList } from '$lib/types/CustomList';


    let newTypeOfPiece: TypeOfPiece = {
		createdAt: new Date(),
		id: null,
		name: null,
		updatedAt: null
	};

    let selectedTypeOfPiece: TypeOfPiece;
    let copyListTypeOfPiece: Array<TypeOfPiece>;
    let copyCopyListTypeOfPiece: Array<TypeOfPiece>;

        let newComposer: Composer = {
		birthDate: '',
		country: '',
		createdAt: new Date(),
		deathDate: '',
		id: 0,
		longName: '',
		mainStyle: '',
		shortName: '',
		updatedAt: new Date(),
	};

    let selectedComposer: Composer;
    let copyListComposer: Array<Composer>;
    let copyCopyListComposer: Array<Composer>;

    
    let newPiece: Piece = {
		arranger: null,
		folderId: null,
		folder: null,
		composer: null,
		composerId: null,
		CreatedAt: new Date(),
		id: null,
		name: null,
		opus: null,
		typeOfPiece: null,
		typeOfPieceId: null,
		updatedAt: null,
		yearOfComposition: null
	};

    let selectedPiece: Piece;
	let copyListPiece: Array<Piece>;
    let copyCopyListPiece: Array<Piece>;

    let folderList: Array<Folder> = [];


    let lists: CustomList[] = [];
	let meta: any = {};
	let options: any = {
		filter: '',
		limit: 10,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};
	let url: string = '/api/pieces';
	let urlFront: string = '/library/pieces';
	let uniqueUrl: string = '/library/pieces';

	let dataHolder: TableData<CustomList>;



    async function errorEvent(response: Response) {
		if (response.status >= 400 && response.status < 500) {
			const jsonResponse = await response.json();
			const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
			alert(error);
		} else if (response.status >= 500) {
			alert('Server error');
		}
	}

    onMount(async () => {
        //recuperer la liste des folders
		let response = await fetch('/api/folders', {
			method: 'GET'
		});

		errorEvent(response);

		if (response.ok) {
			folderList = await response.json();
		}


        //recuperer la liste des piece
		response = await fetch('/api/pieces', {
			method: 'GET'
		});

		errorEvent(response);

		if (response.ok) {
			const listPieces: Array<Piece> = await response.json();
			copyListPiece = structuredClone(listPieces);
			copyCopyListPiece = structuredClone(listPieces);
		}


		//recuperer la liste des type of piece
        response = await fetch('/api/type_of_pieces', {
			method: 'GET'
		});

		errorEvent(response);

		if (response.ok) {
			const listTypeOfPiece: Array<TypeOfPiece> = await response.json();

			copyListTypeOfPiece = structuredClone(listTypeOfPiece);
			copyCopyListTypeOfPiece = structuredClone(listTypeOfPiece);
		}


        //recuperer la liste des composer
		response = await fetch('/api/composers', {
			method: 'GET'
		});

		errorEvent(response);

		if (response.ok) {
			const listComposers: Array<Composer> = await response.json();

			listComposers.forEach((composer) => {
				composer.birthDate = composer.birthDate
					? new Date(composer.birthDate).toISOString().split('T')[0]
					: null;
				composer.deathDate = composer.deathDate
					? new Date(composer.deathDate).toISOString().split('T')[0]
					: null;
			});

			copyListComposer = structuredClone(listComposers);
			copyCopyListComposer = structuredClone(listComposers);
		}


        const urlParams = new URLSearchParams(window.location.search);
		options = {
			filter: urlParams.get('filter') || '',
			limit: parseInt(urlParams.get('limit') || '20'),
			page: parseInt(urlParams.get('page') || '1'),
			order: urlParams.get('order') || 'asc',
			orderBy: urlParams.get('orderBy') || 'id'
		};

		fetchData();
    });


    //api piece
	async function addPiece() {
		const data = {
			id: selectedPiece.id ? selectedPiece.id : undefined,
			arranger: selectedPiece.arranger,
			composer_id: selectedPiece.composer?.id,
			folder_id: selectedPiece.folder?.id || null,
			name: selectedPiece.name,
			opus: selectedPiece.opus,
			type_of_piece_id: selectedPiece.typeOfPiece?.id,
			year_of_composition: selectedPiece.yearOfComposition || ''
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
			body: JSON.stringify(selectedPiece)
		});

		errorEvent(response);

		if (response.ok) {
			window.location.reload();
		}
	}


    function resetPiece() {
		(selectedPiece = structuredClone(newPiece)),
			(copyListPiece = structuredClone(copyCopyListPiece));
	}


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

			console.log(data);

			const tmpLists: List[] = data.data;

			lists = tmpLists.map((list) => {
				return {
					...list,
					contacts: list.contacts
						.map((contact) => {
							return `${contact.firstName} ${contact.lastName}`;
						})
						.join(' - ')
				};
			});

			meta = data.meta;

			dataHolder = {
				data: lists,
				columns: ['id', 'name'],
				notOrderedColumns: ['contacts']
			};
		});
	}

    
</script>

{#if dataHolder}
	<SimpleFilterer
		showData={true}
		bind:data={dataHolder}
		bind:meta
		bind:options
		bind:uniqueUrl
		on:optionsUpdated={() => fetchData()}
	></SimpleFilterer>
{/if}

<div class="flex p-2">
    <!--selecteur des pieces-->
    <select class="flex w-1/2" name="piece" id="2" bind:value={selectedPiece}>
        <optgroup label="piece">
            <option value={structuredClone(newPiece)}>New</option>
            {#if copyListPiece != null}
                {#each copyListPiece as piece}
                    <option value={piece}>{piece.name}</option>
                {/each}
            {/if}
        </optgroup>
    </select>
</div>

<div class="flex">
    <!--affichage des pieces-->
    {#if selectedPiece}
        <div class="flex flex-col w-1/2 border-2 border-rose-500">
            <div class="flex justify-center border-2 border-rose-500">piece</div>
            <div class="flex flex-col p-2">
                <span>Name</span>
                <input class="p-1" bind:value={selectedPiece.name} placeholder="enter the full name" />

                <span>Arranger</span>
                <input class="p-1" bind:value={selectedPiece.arranger} placeholder="enter the Arranger" />

                <span>Opus</span>
                <input
                    class="p-1"
                    bind:value={selectedPiece.opus}
                    placeholder="enter the name of the opus"
                />

                <span>Year of composition</span>
                <input
                    class="p-1"
                    bind:value={selectedPiece.yearOfComposition}
                    placeholder="enter the year"
                />

                <span>Composer</span>
                <select class="flex w-1/2" bind:value={selectedPiece.composer}>
                    {#if selectedPiece.composer !== null}
                        <optgroup label="Composer of the Piece">
                            <option value={selectedPiece.composer}>{selectedPiece.composer.longName}</option>
                        </optgroup>
                    {/if}
                    <optgroup label="All Composer">
                        <option value={null}>None</option>
                        {#if copyListComposer}
                            {#each copyListComposer as composer}
                                <option value={composer}>{composer.longName}</option>
                            {/each}
                        {/if}
                    </optgroup>
                </select>

                <span>Folder</span>
                <select class="flex w-1/2" bind:value={selectedPiece.folder}>
                    {#if selectedPiece.folder !== null}
                        <optgroup label="Folder linked">
                            <option value={selectedPiece.folder}>{selectedPiece.folder.name}</option>
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
                <select class="flex w-1/2" bind:value={selectedPiece.typeOfPiece}>
                    {#if selectedPiece.typeOfPiece !== null}
                        <optgroup label="Type of Piece">
                            <option value={selectedPiece.typeOfPiece}>{selectedPiece.typeOfPiece?.name}</option>
                        </optgroup>
                    {/if}
                    <optgroup label="All type of Piece">
                        <option value={null}>None</option>
                        {#if copyListTypeOfPiece}
                            {#each copyListTypeOfPiece as typeOfPiece}
                                <option value={typeOfPiece}>{typeOfPiece.name}</option>
                            {/each}
                        {/if}
                    </optgroup>
                </select>
            </div>

            <div class="flex p-2">
                <button class="p-1 border-2 border-blue-500" on:click={resetPiece}>
                    effacer tous les changements
                </button>

                {#if selectedPiece.id == null}
                    <button class="p-1 border-2 border-green-500" on:click={addPiece}> add </button>
                {:else}
                    <button class="p-1 border-2 border-orange-500" on:click={addPiece}> modify </button>
                    <button class="p-1 border-2 border-red-500" on:click={PopupdeletePiece}> Delete </button>
                {/if}
            </div>
        </div>
    {/if}
</div>


