<script lang="ts" generics="DataType extends GenericDataType">
	import DateShow from './DateShow.svelte';

	import { goto } from '$app/navigation';
	import type { GenericDataType } from '$lib/types/GenericDataType';
	import type { TableData } from '$lib/types/TableData';

	export let editable: boolean;
	export let data: TableData<DataType>;
	export let options:
		| {
				filter: any;
				limit: number;
				page: number;
				order: 'asc' | 'desc';
				orderBy: string;
		  }
		| {
				filters: {
					type: string;
					filtersDepth1: {
						type: string;
						filtersDepth2: {
							relation: string;
							column: string;
							operation: string;
							filter: string;
						}[];
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
	export let changePage: (newPage: number) => void;
	export let uniqueUrl: string;
	export let buttonLinkId: boolean = true;
	export let selectedData: GenericDataType | null;
	export let filterLevel: string[];

	export let columnDisplayer: { [key: string]: boolean } = {};

	$: if (filterLevel) {
		console.log(data.data);
		const filteredContacts = data.data.filter(
			(contact) => ((Array.isArray(contact.instruments) && contact.instruments.some((instrument) => filterLevel.includes(instrument.pivot_proficiency_level))) || (Array.isArray(contact.instruments) && contact.instruments.length == 0) )
		);
		data.data = filteredContacts;
	}

	interface WithId {
		id: number;
	}

	$: if (data) {
		console.log(data);
	}
	// Function to check if an item has an id
	function hasId<T>(item: T): item is T & WithId {
		return (item as WithId).id !== undefined;
	}

	function getNestedValue(obj: any, path: string) {
		return path.split('.').reduce((acc, part) => acc && acc[part], obj);
	}

	function familyToStyle(family : string){
		const normalized = family.trim().toLowerCase();
		switch (normalized) {
			case 'brass':
				return "text-orange-500 bg-orange-200";
			case 'misc':
				return "text-purple-500 bg-purple-200";
			case 'strings':
				return "text-blue-500 bg-blue-200";
			case 'percussions':
				return "text-green-500 bg-green-200";
			case 'woodwinds':
				return "text-yellow-500 bg-[#fff5aa]";
			case 'keyboards':
				return "text-rose-500 bg-rose-200";
				
		}
	}

	function familyToEmoji(family: string) {
		const normalized = family.trim().toLowerCase();
		switch (normalized) {
			case 'keyboards':
				return '🎹';
			case 'strings':
				return '🎻';
			case 'brass':
				return '🎺';
			case 'percussions':
				return '🥁';
			case 'misc':
				return '🎼';
			case 'woodwinds':
				return '🎷';
			default:
				return '🎶'; // emoji générique si inconnu
		}
	}

	function levelSimplificator(level : string){
		const normalized = level.trim().toLowerCase();
		switch (normalized) {
			case 'amateur - low level':
				return 'Low';
			case 'amateur - medium':
				return 'Medium';
			case 'student':
				return 'Student';
			case 'professional':
				return 'Pro';
			case 'amateur - high level':
				return 'High';
			case 'high level professional':
				return 'High Pro';
			default:
				return ''
		}

	}

	function levelToStyle(level : string){
		const normalized = level.trim().toLowerCase();
		switch (normalized) {
			case 'amateur - low level':
				return "text-red-500 border-red-500";
			case 'amateur - medium':
				return "text-orange-500 border-orange-500";
			case 'amateur - high level':
				return "text-yellow-500 border-yellow-500";
			case 'student':
				return "text-green-500 border-green-500";
			case 'professional':
				return "text-blue-500 border-blue-500";
			case 'high level professional':
				return "text-purple-500 border-purple-500";
			default:
				return ''
		}

	}

</script>

<div class="grid grid-cols-1 w-full mt-2">
	<div class="overflow-x-auto">
		<table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
			<thead
				class="text-md text-gray-700 h-10 uppercase border-b-2 border-gray-400 dark:bg-gray-700 dark:text-gray-400"
			>
				<tr>
					{#each data.columns as column}
						{#if columnDisplayer[column]}
							<th class="px-1">
								<button
									on:click={() => {
										options.orderBy = typeof column === 'string' ? column : '';
										options.order = options.order === 'asc' ? 'desc' : 'asc';
										changePage(meta.firstPage);
									}}
									class="flex items-center justify-center"
								>
									{column}
									{#if options.orderBy === column}
										{#if options.order === 'asc'}
											<span
												class="icon-[tdesign--order-ascending] ml-2"
												style="width: 1.2rem; height: 1.2rem; color: black;"
											></span>
										{:else}
											<span
												class="icon-[tdesign--order-descending] ml-2"
												style="width: 1.2rem; height: 1.2rem; color: black;"
											></span>
										{/if}
									{:else}
										<span class="ml-2" style="width: 1.2rem; height: 1.2rem;"></span>
									{/if}
								</button>
							</th>
						{/if}
					{/each}
					{#each data.notOrderedColumns as column}
						{#if columnDisplayer[column]}
							<th class="px-1">
								{column}
							</th>
						{/if}
					{/each}
					{#if columnDisplayer['instruments']}
						<th class="px-1 pl-6">instruments</th>
					{/if}
					{#if columnDisplayer['action']}
						{#if data.data.length > 0}
							{#if hasId(data.data[0])}
								<th class="px-1"> Actions </th>
							{/if}
						{/if}
					{/if}
				</tr>
			</thead>
			<tbody>
				{#each data.data as row}
					<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 ">
						{#each data.columns as column}
							{#if columnDisplayer[column]}
								{#if typeof getNestedValue(row, String(column)) === 'object' && getNestedValue(row, String(column)) instanceof Date}
									<td>
										<DateShow startTime={getNestedValue(row, String(column))} />
									</td>
								{:else}
									<td class="{column === "comments" ? "w-64 ml-8" : ""}
									 {column === "lastName" ? " w-20" : ""} 
									 {column === "firstName" ? " w-20" : ""} 
									 {column === "email" ? "w-20" : ""}
									 {column === "id" ? "w-10" : ""} 
									 {column === "messenger" ? "" : ""}
									">{getNestedValue(row, String(column))}</td>
								{/if}
							{/if}
						{/each}
						{#each data.notOrderedColumns as column}
							{#if columnDisplayer[column]}
								<td>{getNestedValue(row, String(column))}</td>
							{/if}
						{/each}
						{#if columnDisplayer['instruments']}
							<td>
								{#if row.instruments}
									{#each row.instruments as instrument}
										<div class="flex gap-4 my-1 pl-6">
											<div class="{familyToStyle(instrument.family)} font-semibold rounded-lg p-1 px-2">{familyToEmoji(instrument.family)} {instrument.name} </div>
											<div class="{levelToStyle(instrument.pivot_proficiency_level)} border-2 p-1 px-2 rounded-lg font-semibold">{levelSimplificator(instrument.pivot_proficiency_level)}</div>
										</div>
									{/each}
								{/if}
							</td>
						{/if}
						{#if columnDisplayer['action']}
						<td class="w-10 bg-red-200">
							{#if editable}
								{#if hasId(row)}
									{#if buttonLinkId == true}
										<button
											on:click={() => {
												const url = `${uniqueUrl}/${row.id}`;
												goto(url);
											}}
											class="text-blue-700 hover:text-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:text-blue-500 dark:hover:text-blue-600 dark:focus:ring-blue-800"
										>
											<span class="icon-[formkit--arrowright] hover:text-black"></span>
										</button>
									{:else}
										<button
											on:click={() => {
												selectedData = row;
											}}
											class="text-blue-700 hover:text-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:text-blue-500 dark:hover:text-blue-600 dark:focus:ring-blue-800"
										>
											<span class="icon-[formkit--arrowright] hover:text-black"></span>
										</button>
									{/if}
								{/if}
							{/if}
						</td>
						{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
