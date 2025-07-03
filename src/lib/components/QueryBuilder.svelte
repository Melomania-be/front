<script lang="ts">
	import Condition from '$lib/components/Condition.svelte';
	import type { Instrument } from '$lib/types/Instrument';
	import { faMessage, faSearch, faSliders, faXmark } from '@fortawesome/free-solid-svg-icons';
	import { Button } from 'flowbite-svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import Fa from 'svelte-fa';
	import { familyToEmoji, familyToStyle, levelSimplificator, levelToStyle } from './contact/StylesFunctions';

	export let columns: { [key: string]: string[] };
	export let options: {
		filters: {
			type: string;
			filtersDepth1: {
				type: string;
				filtersDepth2: { relation: string; column: string; operation: string; filter: string }[];
			}[];
		};
	};
	export let operations: string[];
	export let typesOfWhere: string[];

	export let filterLevel: string[];
	export let instrumentFamily: string[];

	let instruments: Instrument[] = [];
	

	const filter = {
		relation: '',
		column: '',
		operation: '',
		filter: ''
	};

	function addCondition(depth1: any) {
		const tmpFilter = { ...filter };
		tmpFilter.relation = 'self';
		tmpFilter.column = 'first_name';
		tmpFilter.operation = '=';
		tmpFilter.filter = 'Pierre';

		depth1.filtersDepth2.push(tmpFilter);
		options = options;
	}

	function updateSearchBar(value: string) {
		
		if (value) {
			const orTerms = value.split(/\s+/).filter(Boolean);
			options.filters.filtersDepth1 = [
				{
					type: 'or',
					filtersDepth2: orTerms.map(term => [
					{ relation: 'self', column: 'email', operation: 'like', filter: `%${term}%` },
					{ relation: 'self', column: 'first_name', operation: 'like', filter: `%${term}%` },
					{ relation: 'self', column: 'last_name', operation: 'like', filter: `%${term}%` },
					{ relation: 'self', column: 'messenger', operation: 'like', filter: `%${term}%` }
					]).flat()
				}
			];
		} else {
			options.filters.filtersDepth1 = [
				{
					type: 'or',
					filtersDepth2: []
				}
			];
		}
		options = options;
		console.log(quickSearch);
	}

	function addSubCondition(type : string) {
		options.filters.filtersDepth1.push({
			type,
			filtersDepth2: []
		});
		options = options;
	}

	function deleteGroup(depth1: any) {
		options.filters.filtersDepth1 = options.filters.filtersDepth1.filter(
			(item: any) => item !== depth1
		);
	}

	onMount(async () => {
		// Récupérer les instruments déjà sélectionnés dans les filtres (s'ils existent)
		const filtersGroup = options.filters.filtersDepth1[1];

		if (filtersGroup) {
			selectedInstrumentIds = new Set(
				filtersGroup.filtersDepth2
					.filter((f) => f.relation === 'instruments' && f.column === 'id')
					.map((f) => Number(f.filter))
			);
		}

		// Puis récupérer les instruments via fetch
		fetchInstruments().then((data) => {
			instruments = data;
		});
		

	});

	async function fetchInstruments() {
		try {
			const response = await fetch('/api/instruments');

			if (!response.ok) {
				throw new Error(`Erreur ${response.status} : ${response.statusText}`);
			}

			const instruments : Instrument[] = await response.json();
			console.log(instruments)
			instrumentFamily = [...new Set(instruments.map(i => i.family))];
			return instruments;
		} catch (error) {
			console.error('Erreur lors de la récupération des instruments :', error);
			return [];
		}
	}

	let quickSearch = '';

	//let levelFilter = ["Amateur - Low" , "Amateur - Medium" , "Amateur - High" , "Student" , "Professional" , "High-level Professional"];

	const levels = [
    'Amateur - low level',
	'Amateur - medium',
    "Amateur - high level",
    "Student",
    "Professional",
    "High level professional"
  ]

	function updateLevelFilter(level : string , checked : boolean){
		if(checked){
			filterLevel.push(level);
		}
		else{
			const newFilter = filterLevel.filter(l => l !== level)
			filterLevel = newFilter;
		}
		console.log(filterLevel)

	}
	
	let popUpFilter = false;

	// Stocke les ID cochés (en string ou number)
	let selectedInstrumentIds: Set<number> = new Set();
	let selectedFamilyIds: Set<string> = new Set();
	let projectIds : string = "";
	let projectName : string = "";

	function updateProjectsIdFilter(projectIds : string){
		const projects = projectIds.split(",")

		if (!options.filters.filtersDepth1[1]) {
			addSubCondition('and');
		}

		const filtersGroup = options.filters.filtersDepth1[1];

		filtersGroup.filtersDepth2 = filtersGroup.filtersDepth2.filter(
			(f) => !(f.relation === 'participants' && f.column === 'project_id')
		);

		if(projectIds !== ""){
		// Ajoute les filtres actuels
		for (const project of projects) {
			filtersGroup.filtersDepth2.push({
				relation: 'participants',
				column: 'project_id',
				operation: '=',
				filter: project
			});
		}
		}

	}

	function updateProjectNameFilter(){
		if (!options.filters.filtersDepth1[1]) {
			addSubCondition('and');
		}
		const filtersGroup = options.filters.filtersDepth1[1];

		filtersGroup.filtersDepth2 = filtersGroup.filtersDepth2.filter(
			(f) => !(f.relation === 'projects' && f.column === 'name')
		);

		if(projectName !== ""){
			filtersGroup.filtersDepth2.push({
				relation: 'projects',
				column: 'name',
				operation: 'like',
				filter: projectName
			});
		}

	}

	function updateFamilyFilter(family : string, checked: boolean) {
		if (checked) {
			selectedFamilyIds.add(family);
		} else {
			selectedFamilyIds.delete(family);
		}
		// Met à jour le groupe de filtres
		if (!options.filters.filtersDepth1[1]) {
			addSubCondition('or');
		}
		const filtersGroup = options.filters.filtersDepth1[1];

		// Supprime les anciens filtres d'instruments
		filtersGroup.filtersDepth2 = filtersGroup.filtersDepth2.filter(
			(f) => !(f.relation === 'instruments' && f.column === 'family')
		);

		// Ajoute les filtres actuels
		for (const family of selectedFamilyIds) {
			filtersGroup.filtersDepth2.push({
				relation: 'instruments',
				column: 'family',
				operation: 'like',
				filter: family // ou .toString() selon ton backend
			});
		}

		// Déclenche la mise à jour Svelte
		options = { ...options };
		console.log("options",options);
	}
	
	// Fonction pour mettre à jour les filtres des instruments
	function toggleInstrumentFilter(id: number, checked: boolean) {
		if (checked) {
			selectedInstrumentIds.add(id);
		} else {
			selectedInstrumentIds.delete(id);
		}

		// Met à jour le groupe de filtres
		if (!options.filters.filtersDepth1[1]) {
			addSubCondition('or');
		}
		const filtersGroup = options.filters.filtersDepth1[1];

		// Supprime les anciens filtres d'instruments
		filtersGroup.filtersDepth2 = filtersGroup.filtersDepth2.filter(
			(f) => !(f.relation === 'instruments' && f.column === 'id')
		);

		// Ajoute les filtres actuels
		for (const instrumentId of selectedInstrumentIds) {
			filtersGroup.filtersDepth2.push({
				relation: 'instruments',
				column: 'id',
				operation: '=',
				filter: instrumentId.toString() // ou .toString() selon ton backend
			});
		}

		// Déclenche la mise à jour Svelte
		options = { ...options };
		console.log("options",options);
	}

	const dispatch = createEventDispatcher();

	function triggerSearch() {
		updateProjectsIdFilter(projectIds)
		updateProjectNameFilter();
		console.log(filter)
		dispatch('optionsUpdated');
	}


</script>

{#if popUpFilter}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 pl-64">
		<div class="bg-white pb-4 rounded-xl shadow-xl w-[60%] h-[50%] text-gray-600">
			<div class='flex items-center'>
				<h2 class="text-xl font-bold my-4 ml-6 uppercase text-gray-400">Filter</h2>
				<button class="ml-auto mr-6" on:click={()=>{popUpFilter = false; document.body.style.overflow = '';}}><Fa icon={faXmark} class="text-[22px]" style="color: #6b7280;" /></button>
			</div>
			<div class="px-6 h-[80%] w-auto overflow-y-scroll">
				<h2 class="text-md font-bold mb-4 text-xl">Instruments</h2>
				<div class="grid grid-cols-[1fr_1fr_1fr] mb-6 px-4">
					{#each instruments as instrument}
						<div class="flex gap-2 items-center">
							<input
								id={String(instrument.id)}
								checked={selectedInstrumentIds.has(instrument.id)}
								type="checkbox"
								class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
								on:change={(e) => toggleInstrumentFilter(instrument.id, e.target.checked)}
							/>
							<p>{instrument.name}</p>
						</div>
					{/each}
				</div>
				<h2 class="text-md font-bold mb-2 text-xl">Family</h2>
				<div class="grid gap-2 grid-cols-[1fr_1fr_1fr] mb-6 px-4">
					{#each instrumentFamily as family}
					<div class="flex items-center gap-2">
							<input
								id={family}
								checked={selectedFamilyIds.has(family)}
								type="checkbox"
								class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
								on:change={(e) => updateFamilyFilter(family , e.target.checked)}
							/>
							<p class="{familyToStyle(family)} font-semibold rounded-lg p-1 px-2"> {familyToEmoji(family)} {family}</p>
					</div>
					{/each}
				</div>
				<h2 class="text-md font-bold mb-2 text-xl">Level</h2>
				<div class="grid items-center grid-cols-3 mb-6 px-4 gap-2">
					{#each levels as level}
					<div class="flex items-center gap-2">
							<input
								id={level}
								checked={filterLevel.some(l => l === level)}
								type="checkbox"
								class="w-4 h-4 rounded-full text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
								on:change={(e) => updateLevelFilter(level , e.target.checked)}
							/>
							<p class="{levelToStyle(level)} border-2 p-1 rounded-lg font-semibold px-2">{level}</p>
					</div>
					{/each}
				</div>
				<h2 class="text-md font-bold mb-2 text-xl">Project</h2>
				<div class="px-4 flex mb-6">
					<p class="font-semibold text-gray-500 mr-2">By Id :</p>
					<input type="text" bind:value={projectIds} class="border-2 rounded-lg border-gray-300 pl-2" />

					<p class="font-semibold text-gray-500 mr-2 ml-4">By Name :</p>
					<input type="text" bind:value={projectName} class="border-2 rounded-lg border-gray-300 pl-2" />
				</div>
			</div>
			<div class="flex pr-6 bg-white border-t py-2 rounded-b-xl border-gray-300">
				<button
					class="w-[20%] px-4 py-2 my-2 rounded-full hover:underline font-semibold"
					on:click={() => {
						popUpFilter = false;
						deleteGroup(options.filters.filtersDepth1[1]);
						filterLevel = [];
						selectedFamilyIds.clear();
						selectedInstrumentIds.clear();
						projectIds = "";
						projectName = "";
						triggerSearch();
						document.body.style.overflow = '';
						console.log(options);
					}}>Reset Filter</button
				>
				<Button
					on:click={() => {triggerSearch() ; popUpFilter = false; document.body.style.overflow = '';}}
					class="w-[30%] px-4 py-2 my-2 ml-auto bg-[#6b9ad9] hover:bg-[#5b89c5] text-white rounded-full font-bold"
				>
					Search
				</Button>
			</div>
		</div>
	</div>
{/if}

{#if columns}
	<div class="w-full rounded p-0.5">
		<div class="flex mb-4">
			<div class="flex border-2 border-gray-400 p-3 rounded-2xl items-center w-[90%]">
				<input class="w-full focus:outline-none"
					on:change={() => {updateSearchBar(quickSearch); triggerSearch()}}
					type="text"
					placeholder="Search..."
					bind:value={quickSearch}
				/>
				<button class="ml-auto mr-2" on:click={()=>{popUpFilter = false; quickSearch = "",updateSearchBar(quickSearch)}}><Fa icon={faXmark} class="text-[18px]" style="color: #6b7280;" /></button>
			</div>
			<div class="flex justify-center items-center">
				<Button
					on:click={triggerSearch}
					class="bg-[#6B9AD9] hover:bg-[#4f7cb7] text-white font-medium ml-8 w-[100px] rounded-2xl gap-2 text-sm px-4 dark:bg-blue-600 dark:hover:bg-blue-700"
				>
					<Fa icon={faSearch} class="text-[18px]" style="color: white;" />
					Search
				</Button>
			</div>
		</div>
		<button
			on:click={() => {
				popUpFilter = true;
				document.body.style.overflow = 'hidden';
				}}
			class="flex items-center border-2 border-gray-400 p-1 gap-2 rounded-full px-4"
			class:bg-blue-200={selectedInstrumentIds.size > 0}
  			class:bg-white={selectedInstrumentIds.size === 0}
		>
			<p class="text-gray-500 font-semibold">Filter</p>
			<Fa icon={faSliders} class="text-[16px]" style="color: #6b7280;" />
		</button>
		{#each options.filters.filtersDepth1.slice(1) as depth1}
			<div class="flex items-center">
				{#if depth1 !== options.filters.filtersDepth1[0]}
					<div>
						{options.filters.type}
					</div>
				{/if}
				<div class="border m-0.5 p-0.5">
					<div>
						{#each depth1.filtersDepth2 as depth2}
							<Condition
								{operations}
								bind:columns
								bind:depth1
								bind:filter={depth2}
								noType={depth2 === depth1.filtersDepth2[0]}
							/>
						{/each}
					</div>
					<div>
						{#if depth1.filtersDepth2.length > 1}
							<select bind:value={depth1.type} class="mr-2">
								{#each typesOfWhere as type}
									<option value={type}>{type}</option>
								{/each}
							</select>
						{/if}
						<button
							class="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
							on:click={() => addCondition(depth1)}>+</button
						>
					</div>
				</div>
				<button on:click={() => deleteGroup(depth1)}>
					<span class="icon-[material-symbols-light--delete] hover:text-red-500"></span>
				</button>
			</div>
		{/each}
		<div>
			{#if options.filters.filtersDepth1.length > 1}
				<select bind:value={options.filters.type} class="mr-2">
					{#each typesOfWhere as type}
						<option value={type}>{type}</option>
					{/each}
				</select>
			{/if}
			<button
				class="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
				>+</button
			>
		</div>
		
	</div>
{/if}
