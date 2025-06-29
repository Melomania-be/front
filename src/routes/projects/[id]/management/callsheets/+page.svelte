<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';
	import type { Callsheet } from '$lib/types/Callsheet.js';
	import type { TableData } from '$lib/types/TableData';
	import { onMount } from 'svelte';
	import ProjectHeadDisplayer from '../ProjectHeadDisplayer.svelte';
	import type { Project } from '$lib/types/Project';
	import ProjectPhoneDisplayer from '../ProjectPhoneDisplayer.svelte';

	export let data;


	let project : Project | undefined;

	async function fetchProject(){
		if (!data?.id) return;

		const response = await fetch(`/api/projects/${data.id}`, {
			method: 'GET'
		});

		if (!response.ok) {
			console.error('Failed to fetch project');
			return;
		}
		project = await response.json();
	}

	let callsheets: Callsheet[] = [];
	let meta: any = {};
	let options: any = {
		filter: '',
		limit: 250,
		page: 1,
		order: 'desc',
		orderBy: 'updatedAt'
	};
	let urlSvelteApi: string;
	let urlFront: string;
	let uniqueUrl: string;

	let dataHolder: TableData<Callsheet>;

	onMount(async () => {
		const urlParams = new URLSearchParams(window.location.search);

		urlSvelteApi = `/api/projects/${data.id}/management/callsheets`;
		urlFront = `/projects/${data.id}/management/callsheets`;
		uniqueUrl = `/projects/${data.id}/management/callsheets`;
        options = {
            filter: urlParams.get('filter') || options.filter,
            limit: parseInt(urlParams.get('limit') || options.limit.toString()),
            page: parseInt(urlParams.get('page') || options.page.toString()),
            order: urlParams.get('order') || options.order,
            orderBy: urlParams.get('orderBy') || options.orderBy
        };

		fetchProject();
		fetchData();
	});

	async function fetchData() {
		let optionInUrls = `?page=${options.page}&limit=${options.limit}`;
		optionInUrls += '&filter=' + options.filter;
		optionInUrls += '&orderBy=' + options.orderBy;
		optionInUrls += '&order=' + options.order;

		if (browser && data.id) goto(`${urlFront}${optionInUrls}`);

		const response = await fetch(`${urlSvelteApi}${optionInUrls}`, {
			method: 'GET'
		});

		const responseHandler = new ResponseHandlerClient();

		responseHandler.handle(response, async () => {
			const data = await response.json();

			callsheets = data.data.map((callsheet: Callsheet) => {
				return {
					...callsheet,
					updatedAt: new Date(callsheet.updatedAt),
					createdAt: new Date(callsheet.createdAt)
				};
			});
			meta = data.meta;

			dataHolder = {
				data: callsheets,
				columns: ['version', 'updatedAt'],
				notOrderedColumns: []
			};
		});
	}

	function maxUpdateDate(callsheets: Callsheet[]) {
		let maxDate = new Date(0);
		let index = 0;
		for (let i = 0; i < callsheets.length; i++) {
			if (new Date(callsheets[i].updatedAt) > maxDate) {
				maxDate = new Date(callsheets[i].updatedAt);
				index = i;
			}
		}
		return callsheets[index];
	}

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


<ProjectHeadDisplayer {project} selectedTab={3} />
<div class="flex flex-col bg-[#E7E7E7] p-4 gap-4 h-screen">
	<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
		<h2 class="font-bold text-lg uppercase">CALLSHEETS</h2>
	
		<SimpleFilterer
			showData
			bind:data={dataHolder}
			bind:meta
			bind:options
			bind:uniqueUrl
			on:optionsUpdated={fetchData}
		></SimpleFilterer>

		<div class="flex gap-4">
		<button
			on:click={() => goto(`${urlFront}/creation`)}
			class="w-full h-full sm:w-auto text-white bg-[#6B9AD9] hover:bg-[#4f7cb7] font-medium rounded-lg text-sm md:text-base px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 transition duration-300"
		>
			New callsheet
		</button>

		{#if callsheets.length > 0}
			<a
				href="/projects/{data.id}/management/callsheets/{maxUpdateDate(callsheets).id}/creation"
				class="w-full h-full sm:w-auto text-white bg-[#6B9AD9] hover:bg-[#4f7cb7] font-medium rounded-lg text-sm md:text-base px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 transition duration-300"
			>
				New callsheet from the last one
			</a>
		{/if}
		</div>
	</div>
</div>

{#if isMobile}
	<ProjectPhoneDisplayer project={project} selectedTab={3}/>
{/if}