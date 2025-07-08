<script lang="ts" generics="DataType extends GenericDataType">
	import Fa from 'svelte-fa';

	import { faSort, faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons';

	import DateShow from './DateShow.svelte';

	import { goto } from '$app/navigation';
	import type { GenericDataType } from '$lib/types/GenericDataType';
	import type { TableData } from '$lib/types/TableData';

	import {familyToEmoji, familyToStyle, levelSimplificator, levelToStyle} from '$lib/components/contact/StylesFunctions'

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

	export let selectedLevelInstruments: [number, string | null][];

	$: if (selectedLevelInstruments) {
			if(selectedLevelInstruments.length !== 0){
				const filteredContacts = data.data.filter((contact) => {
				if (!Array.isArray(contact.instruments)) return false
				// Garde le contact si l’un de ses instruments correspond à un des couples instrumentId + niveau
				return contact.instruments.some((instrument) => {
					return selectedLevelInstruments.some(([id, level]) => {
						return (
							instrument.id === id && instrument.pivot_proficiency_level == level
						)
					})
				})
			})
			console.log("zerzer",selectedLevelInstruments)
			data.data = filteredContacts
			console.log(data.data)
		}
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


	function columnToColumnName(col : string){
		const normalized = col.trim().toLowerCase();
		switch (normalized) {
			case 'id':
				return "Id";
			case 'firstname':
				return "First Name";
			case 'lastname':
				return "Last Name";
			case 'email':
				return "Email";
			case 'messenger':
				return "Messenger";
			case 'comments':
				return "Comments";
			case 'phone':
				return "Phone"
				
		}
	}

</script>

<div class="grid grid-cols-1 w-full mt-2">
	<div class="overflow-x-auto">
		<table class="w-full text-sm table-auto text-left rtl:text-right text-gray-500 dark:text-gray-400">
			<thead
				class="text-md text-gray-700 h-10 border-b-2 border-gray-400 dark:bg-gray-700 dark:text-gray-400"
			>
				<tr>
					{#each data.columns as column}
						{#if columnDisplayer[column]}
							<th class="pr-8 {column == "comments" ? "" : ""}">
								<button
									on:click={() => {
										options.orderBy = typeof column === 'string' ? column : '';
										options.order = options.order === 'asc' ? 'desc' : 'asc';
										changePage(meta.firstPage);
									}}
									class="flex relative items-center"
								>
									{columnToColumnName(column)}
									{#if options.orderBy === column}
										{#if options.order === 'asc'}
											<Fa icon={faSort} class="text-[16px] -right-4 absolute" style="color: #b6b6b6;" />
											<Fa icon={faSortUp} class="text-[16px] -right-4 absolute" style="color: #374151;" />
										{:else}
											<Fa icon={faSort} class="text-[16px] -right-4 absolute" style="color: #b6b6b6;" />
											<Fa icon={faSortDown} class="text-[16px] -right-4 absolute" style="color: #374151;" />
										{/if}
									{:else}
										<Fa icon={faSort} class="text-[16px] -right-4 absolute" style="color: #b6b6b6;" />
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
						<th class="px-1">Instruments</th>
					{/if}
					{#if columnDisplayer['projects']}
						<th class="px-1">Projects</th>
					{/if}
					{#if columnDisplayer['action']}
						{#if data.data.length > 0}
							{#if hasId(data.data[0])}
								<th class="px-1 w-10"> Actions </th>
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
									<td>{getNestedValue(row, String(column))}</td>
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
								{#if row.instruments.length !== 0}
									{#each row.instruments as instrument}
										<div class="flex gap-4 my-1 pl-6">
											<div class="{familyToStyle(instrument.family)} font-semibold rounded-lg p-1 px-2">{familyToEmoji(instrument.family)} {instrument.name} </div>
											<div class="{levelToStyle(instrument.pivot_proficiency_level)} border-2 p-1 px-2 rounded-lg font-semibold">{levelSimplificator(instrument.pivot_proficiency_level)}</div>
										</div>
									{/each}
								{:else}
									<p class="my-1 pl-6 font-semibold text-gray-400 text-xs">No instruments</p>
								{/if}

							</td>
						{/if}
						{#if columnDisplayer['projects']}
							<td class="w-[20vw]">
								{#if row.projects.length !== 0}
								<div class="grid-cols-3 grid gap-2">
									{#each row.projects as project}
										<div class="flex gap-4 my-1 text-xs min-h-10 pl-2 rounded-xl border-2 border-gray-400 relative ">
											<div class="font-semibold self-center mr-8"> {project.name} </div>
											<div class="text-white font-bold w-7 text-center bg-blue-300 ml-auto p-1 px-2 rounded-br-[11px] rounded-tl-xl absolute right-[-1px] bottom-[-1px]"> {project.id} </div>
										</div>
									{/each}
								</div>
								{:else}
									<p class="my-1 pl-6 font-semibold text-gray-400 text-xs">No Projects</p>
								{/if}
							</td>
						{/if}
						{#if columnDisplayer['action']}
						<td class="w-10 text-center">
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
