<script lang="ts" generics="DataType extends GenericDataType">
	import TableContact from '$lib/components/TableContact.svelte';

	import { familyToEmoji, familyToStyle } from './contact/StylesFunctions';

	import { DataTable } from 'smelte';

	import Fa from 'svelte-fa';

	import { faGear, faListCheck, faM, faSliders } from '@fortawesome/free-solid-svg-icons';

	import { createEventDispatcher, onMount } from 'svelte';
	import type { GenericDataType } from '$lib/types/GenericDataType';
	import type { TableData } from '$lib/types/TableData';
	import Paginator from '$lib/components/Paginator.svelte';
	import Table from '$lib/components/TableContact.svelte';
	import QueryBuilder from './QueryBuilder.svelte';
	import { Button } from 'flowbite-svelte';

	export let showData: boolean = false;
	export let editable: boolean = true;
	export let paginatorTop: boolean = true;
	export let options: {
		filters: {
			type: string;
			filtersDepth1: {
				type: string;
				filtersDepth2: { relation: string; column: string; operation: string; filter: string }[];
			}[];
		};
		page: number;
		limit: number;
		orderBy: string;
		order: string;
	};
	export let meta: {
		total: number;
		perPage: number;
		currentPage: number;
		lastPage: number;
		firstPage: 1;
		firstPageUrl: string;
		lastPageUrl: string;
		nextPageUrl: string;
		prevPageUrl: string;
	};
	export let uniqueUrl: string = '';
	export let columns: { [key: string]: string[] };
	export let data: TableData<DataType> = { data: [], columns: [], notOrderedColumns: [] };
	export let filterLevel: string[] = []
	/*export let filterLevel: string[] = [
		'Amateur - low level',
		'Amateur - medium',
		'Amateur - high level',
		'Student',
		'Professional',
		'High level professional'
	];*/

	let columnDisplayer: { [key: string]: boolean } = {
		id : true,
		firstName : true,
		lastName : true,
		email : true,
		messenger : false,
		phone : false,
		comments : true,
		instruments : true,
		projects : false,
		action : true
	};

	if (uniqueUrl === '') {
		editable = false;
	}

	let operations = ['none', '=', '!=', '>', '>=', '<', '<=', 'like'];
	let typesOfWhere = ['and', 'or'];
	let selectedData: GenericDataType | null = null;

	let selectedLevelInstruments: [number, string | null][] = []

	let instrumentFamily: string[] = [];

	const dispatch = createEventDispatcher();
	function changePage(newPage: number) {
		options.page = newPage;
		dispatch('optionsUpdated');
	}
	let showColumList = false;

	let isMobile = false;

	const checkMobile = () => {
		isMobile = window.innerWidth <= 1000;
	};

	onMount(() => {
		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});

</script>


<!-- 🔍 Filtre toujours visible -->
<div class="bg-gray-100 dark:bg-gray-800 w-full px-4 py-3 rounded-lg shadow-md mb-4">
	<h2 class="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">🔎 Search Options</h2>
	<QueryBuilder
		bind:columns
		bind:options
		bind:operations
		bind:typesOfWhere
		bind:filterLevel
		bind:instrumentFamily
		bind:selectedLevelInstruments
		on:optionsUpdated={() => dispatch('optionsUpdated')}
	/>
</div>

<!-- 📄 Table et pagination -->
<div
	class="grid grid-cols-1 place-items-center p-2 border-2 border-gray-400 rounded-xl m-4 bg-white"
>
	<div class="w-full relative">
		<div class="flex flex-col items-center ml-2">
			<div class="flex gap-2">
				{#if instrumentFamily.length !== 0 }
					{#if !isMobile}
						<p class="flex gap-2 text-sm font-semibold text-[#6b7280] items-center	">Legend : 
							{#each instrumentFamily as family}
								<div class="p-1 px-2 rounded-lg {familyToStyle(family)}"> {familyToEmoji(family)} {family} </div> 
							{/each}
						</p>
					{:else}
						<div class="grid grid-cols-2 gap-2 text-sm font-semibold text-[#6b7280] items-center">
						{#each instrumentFamily as family}
							<div class="p-1 px-2 rounded-lg {familyToStyle(family)}"> {familyToEmoji(family)} {family} </div> 
						{/each}
						</div>
					{/if}
				{/if}
			</div>
			<button on:click={() => (showColumList = !showColumList)} class="flex ml-auto mr-2 mt-2 mb-2">
				<Fa icon={faListCheck} class="text-[22px]" style="color: #6b7280;" />
			</button>
		</div>
		{#if showColumList}
		
			<div class="absolute right-0 h-auto w-auto mt-0 bg-white rounded-lg border-gray-400 border-2 p-4 z-20">
				{#each Object.entries(columnDisplayer) as [col, displayed]}
					<div class="flex gap-2 items-center">
						<input
							id={col}
							checked={displayed}
							type="checkbox"
							class="w-4 h-4 rounded-full text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
							on:click={()=>{columnDisplayer[col] = !displayed ; columnDisplayer = { ...columnDisplayer };}}
						/>
						<div>{col}</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
	<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full mt-2 items-center justify-items-stretch">
		{#if paginatorTop}
			<div class="sm:col-start-2 col-start-1">
				<Paginator bind:meta bind:options {changePage} />
			</div>
		{/if}
	</div>

	{#if !showData}
		<slot />
	{:else}
		<TableContact
			bind:data
			bind:options
			bind:meta
			bind:uniqueUrl
			bind:editable
			{changePage}
			bind:selectedData
			bind:filterLevel
			bind:columnDisplayer
			bind:selectedLevelInstruments
		/>
	{/if}

	<div class="mt-4">
		<Paginator
			bind:meta
			bind:options
			{changePage}
			on:optionsUpdated={() => dispatch('optionsUpdated')}
			orientation="vertical"
		/>
	</div>
</div>
