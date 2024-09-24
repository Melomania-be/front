<script lang="ts">
	import { onMount } from 'svelte';

	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { TableData } from '$lib/types/TableData';
	import type { TypeOfPiece } from '$lib/types/TypeOfPiece';

	import Fa from 'svelte-fa';
	import { faMusic } from '@fortawesome/free-solid-svg-icons';

	let selectedData: TypeOfPiece | null;

	let typeOfPiece: TypeOfPiece[] = [];
	let meta: any = {};
	let options: any = {
		filter: '',
		limit: 250,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};
	let url: string = '/api/type_of_pieces';
	let urlFront: string = '/library/type_of_pieces';
	let uniqueUrl: string = '/library/type_of_pieces';

	let dataHolder: TableData<TypeOfPiece>;

	let newTypeOfPiece: TypeOfPiece = {
		createdAt: new Date(),
		id: 0,
		name: null,
		updatedAt: null
	};

    onMount(async () => {
        const urlParams = new URLSearchParams(window.location.search);
        options = {
            filter: urlParams.get('filter') || options.filter,
            limit: parseInt(urlParams.get('limit') || options.limit.toString()),
            page: parseInt(urlParams.get('page') || options.page.toString()),
            order: urlParams.get('order') || options.order,
            orderBy: urlParams.get('orderBy') || options.orderBy
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

			typeOfPiece = data.data;
			meta = data.meta;

			dataHolder = {
				data: typeOfPiece,
				columns: ['id', 'name'],
				notOrderedColumns: []
			};
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

	//api type of piece
	async function addTypeOfPiece() {
		if (!selectedData) return;

		if (selectedData.name) {
			const data = {
				id: selectedData.id ? selectedData.id : undefined,
				name: selectedData.name
			};
			if (data.id == 0) {
				data.id = undefined;
			}

			let response = await fetch('/api/type_of_pieces/', {
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

	async function deleteTypeOfPiece() {
		const validated = confirm('Are you sure you want to delete this file ?');

		if (!validated) return;

		let response = await fetch('/api/type_of_pieces/', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ id: selectedData.id })
		});

		errorEvent(response);

		if (response.ok) {
			window.location.reload();
		}
	}
</script>

<div class="flex">
	<div class="w-full">
		<div class="w-full">
			<button
				on:click={() => (selectedData = newTypeOfPiece)}
				class="m-1 p-1 rounded-full border border-blue-700 hover:bg-slate-200"
			>
				Add new type of piece
			</button>
		</div>

		{#if selectedData != null}
			<form class="justify-center w-full max-w-2xl mx-auto">
				<div class="flex justify-between items-center">
					<h1 class="text-4xl font-extrabold dark:text-white">Type of Piece</h1>
				
					<!-- Close button -->
					<button
						on:click={() => (selectedData = null)}
						type="button"
						class="m-2 p-2 rounded-full border border-red-700 hover:bg-red-200"
					>
						Close
					</button>
				</div>

				<label for="Name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
				>*Name</label>
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
							<Fa icon={faMusic} />
						</svg>
					</span>
					<input
						type="text"
						id="Name"
						bind:value={selectedData.name}
						class="rounded-none rounded-e-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
						placeholder="ex: Symphony"
						required
					/>
				</div>
				<p class="ms-auto text-xs text-gray-500 dark:text-gray-400">*Required to add or edit.</p>

				<div class="flex p-2">
					{#if selectedData.id == 0}
						<button
							on:click={addTypeOfPiece}
							type="submit"
							class="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
							>Add</button
						>
					{:else}
						<button
							on:click={addTypeOfPiece}
							type="submit"
							class="focus:outline-none text-white bg-yellow-400 hover:bg-yellow-500 focus:ring-4 focus:ring-yellow-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:focus:ring-yellow-900"
							>Edit</button
						>
						<button
							on:click={deleteTypeOfPiece}
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
