<script lang="ts">
	import type { TypeOfPiece } from '$lib/types/TypeOfPiece';
	import { onMount } from 'svelte';

    let newTypeOfPiece: TypeOfPiece = {
		createdAt: new Date(),
		id: null,
		name: null,
		updatedAt: null
	};

    let selectedTypeOfPiece: TypeOfPiece;
    let copyListTypeOfPiece: Array<TypeOfPiece>;
    let copyCopyListTypeOfPiece: Array<TypeOfPiece>;


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

        let response = await fetch('/api/type_of_pieces', {
			method: 'GET'
		});

		errorEvent(response);

		if (response.ok) {
			const listTypeOfPiece: Array<TypeOfPiece> = await response.json();

			copyListTypeOfPiece = structuredClone(listTypeOfPiece);
			copyCopyListTypeOfPiece = structuredClone(listTypeOfPiece);
		}

    });


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

    function resetTypeOfPiece() {
		(selectedTypeOfPiece = structuredClone(newTypeOfPiece)),
			(copyListTypeOfPiece = structuredClone(copyCopyListTypeOfPiece));
	}


</script>


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