<script lang="ts">
	import type { Composer } from '$lib/types/Composer';
	import type { Folder } from '$lib/types/Folder';
	import type { Piece } from '$lib/types/Piece';
	import type { TypeOfPiece } from '$lib/types/TypeOfPiece';
	import { onMount } from 'svelte';


	//tableau initaliser vide pour les ajouts
	let newComposer: Composer = {
		birthDate: null,
		country: null,
		createdAt: new Date(),
		deathDate: null,
		id: null,
		longName: null,
		mainStyle: null,
		shortName: null,
		updatedAt: null
	};

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

	let newTypeOfPiece: TypeOfPiece = {
		createdAt: new Date(),
		id: null,
		name: null,
		updatedAt: null
	};

	let folderList: Array<Folder> = [];

	let selectedComposer: Composer;
	let selectedPiece: Piece;
	let selectedTypeOfPiece: TypeOfPiece;

	let copyListComposer: Array<Composer>;
	let copyListPiece: Array<Piece>;
	let copyListTypeOfPiece: Array<TypeOfPiece>;

	let copyCopyListComposer: Array<Composer>;
	let copyCopyListPiece: Array<Piece>;
	let copyCopyListTypeOfPiece: Array<TypeOfPiece>;

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
	});

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
	let isLoadingAddPiece = false;
	let isLoadingDeletePiece = false;

	async function addPiece() {
		isLoadingAddPiece = true;

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

	async function deletePiece() {
		isLoadingDeletePiece = true;

		const validated = confirm('Are you sure you want to delete this file ?');

		if (!validated) return;

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

	//api composer
	let isLoadingAddComposer = false;
	let isLoadingDeleteComposer = false;

	async function addComposer() {
		isLoadingAddComposer = true;

		if (selectedComposer.birthDate === null || selectedComposer.deathDate === null) {
			return alert('Please enter a date of birth and a date of death');
		}

		const data = {
			id: selectedComposer.id ? selectedComposer.id : undefined,
			long_name: selectedComposer.longName,
			short_name: selectedComposer.shortName,
			main_style: selectedComposer.mainStyle,
			country: selectedComposer.country,
			birth_date: (await new Date(selectedComposer.birthDate))?.getTime(),
			death_date: (await new Date(selectedComposer.deathDate))?.getTime()
		};

		const response = await fetch('/api/composers/', {
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

	async function deleteComposer() {
		isLoadingDeleteComposer = true;

		const validated = confirm('Are you sure you want to delete this file ?');

		if (!validated) return;

		const jsoned = JSON.stringify({ id: selectedComposer.id });

		const response = await fetch('/api/composers/', {
			method: 'DELETE',
			body: jsoned
		});

		errorEvent(response);

		if (response.ok) {
			window.location.reload();
		}
	}

	//api type of piece
	let isLoadingAddTypeOfPiece = false;
	let isLoadingDeleteTypeOfPiece = false;

	async function addTypeOfPiece() {
		const name = selectedTypeOfPiece.name;
		isLoadingAddTypeOfPiece = true;
		let response = await fetch('/api/type_of_pieces/', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name
			})
		});

		errorEvent(response);

		if (response.ok) {
			window.location.reload();
		}
	}

	async function deleteTypeOfPiece() {
		isLoadingDeleteTypeOfPiece = true;

		const validated = confirm('Are you sure you want to delete this file ?');

		if (!validated) return;

		let response = await fetch('/api/type_of_pieces/', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ id: selectedTypeOfPiece.id })
		});

		errorEvent(response);

		if (response.ok) {
			window.location.reload();
		}
	}

	function resetComposer() {
		(selectedComposer = structuredClone(newComposer)),
			(copyListComposer = structuredClone(copyCopyListComposer));
	}

	function resetPiece() {
		(selectedPiece = structuredClone(newPiece)),
			(copyListPiece = structuredClone(copyCopyListPiece));
	}

	function resetTypeOfPiece() {
		(selectedTypeOfPiece = structuredClone(newTypeOfPiece)),
			(copyListTypeOfPiece = structuredClone(copyCopyListTypeOfPiece));
	}
</script>

<!--Selecteur des composers et pieces à modifier/créer-->
<div class="flex p-2">
	<!--selecteur des composers-->
	<select class="flex w-1/2" bind:value={selectedComposer}>
		<optgroup label="Composer">
			<option value={structuredClone(newComposer)}>New</option>
			{#if copyListComposer != null}
				{#each copyListComposer as composer}
					<option value={composer}>{composer.longName}</option>
				{/each}
			{/if}
		</optgroup>
	</select>

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

<!--Affichage des composers et pieces à modifier/créer-->
<div class="flex">
	<!--affichage des composers-->
	{#if selectedComposer}
		<div class="flex flex-col w-1/2 border-2 border-rose-500">
			<div class="flex justify-center border-2 border-rose-500">composer</div>
			<div class="flex flex-col p-2">
				<span>Full Name</span>
				<input
					class="p-1"
					bind:value={selectedComposer.longName}
					placeholder="enter the full name"
				/>
				<span>Short name</span>
				<input
					class="p-1"
					bind:value={selectedComposer.shortName}
					placeholder="enter the short name"
				/>
				<span>His main style</span>
				<input
					class="p-1"
					bind:value={selectedComposer.mainStyle}
					placeholder="enter his main style"
				/>
				<span>Country</span>
				<input class="p-1" bind:value={selectedComposer.country} placeholder="enter his country" />
				<span>Date of birth</span>
				<input
					id="birthDate"
					class="p-1"
					bind:value={selectedComposer.birthDate}
					placeholder="enter his date of birth"
					type="date"
				/>
				<span>Date of death</span>
				<input
					id="deathDate"
					class="p-1"
					bind:value={selectedComposer.deathDate}
					placeholder="enter his date of death"
					type="date"
				/>
			</div>

			<div class="flex p-2">
				<button class="p-1 border-2 border-blue-500" on:click={resetComposer}>
					effacer tous les changements
				</button>

				{#if selectedComposer.id == null}
					<button class="p-1 border-2 border-green-500" on:click={addComposer}> add </button>
				{:else}
					<button class="p-1 border-2 border-orange-500" on:click={addComposer}> modify </button>
					<button class="p-1 border-2 border-red-500" on:click={deleteComposer}> Delete </button>
				{/if}
			</div>
		</div>
	{/if}

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
					<button class="p-1 border-2 border-red-500" on:click={deletePiece}> Delete </button>
				{/if}
			</div>
		</div>
	{/if}
</div>

<div class="flex items-center justify-center p-2">
	<!--selecteur des type_of_pieces-->
	<select
		class="flex w-1/4 justify-center"
		name="type of piece"
		id="2"
		bind:value={selectedTypeOfPiece}
	>
		<optgroup label="type of piece">
			<option value={structuredClone(newTypeOfPiece)}>New</option>
			{#if copyListTypeOfPiece != null}
				{#each copyListTypeOfPiece as typeOfPiece}
					<option value={typeOfPiece}>{typeOfPiece.name}</option>
				{/each}
			{/if}
		</optgroup>
	</select>
</div>

<div class="flex justify-center">
	<div class="flex flex-col w-1/4 p-2 justify-center border-2 border-red-500">
		{#if selectedTypeOfPiece}
			<div class="flex border-2 border-rose-500">Type of Piece</div>

			<span>Name</span>
			<input
				class="p-1"
				bind:value={selectedTypeOfPiece.name}
				placeholder="enter the name of the Type of Piece"
			/>

			<div class="flex p-2">
				<button class="p-1 border-2 border-blue-500" on:click={resetTypeOfPiece}>
					effacer tous les changements
				</button>

				{#if selectedTypeOfPiece.id == null}
					<button class="p-1 border-2 border-green-500" on:click={addTypeOfPiece}> add </button>
				{:else}
					<button class="p-1 border-2 border-orange-500" on:click={addTypeOfPiece}> modify </button>
					<button class="p-1 border-2 border-red-500" on:click={deleteTypeOfPiece}> Delete </button>
				{/if}
			</div>
		{/if}
	</div>
</div>
