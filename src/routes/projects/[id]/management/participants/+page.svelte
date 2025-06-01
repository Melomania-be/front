<script lang="ts">
    
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import DateShow from '$lib/components/DateShow.svelte';
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';
	import type { Participant } from '$lib/types/Participant';
	import type { TableData } from '$lib/types/TableData';
	import { onMount } from 'svelte';
    import ProjectHeadDisplayer from '../ProjectHeadDisplayer.svelte';
    import type { Project } from '$lib/types/Project';

	export let data;
    
    let project : Project | undefined;

	let participants: Participant[] = [];
	let meta: any = {};
	let options: any = {
		filter: '',
		limit: 250,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};

	let urlSvelteApi = `/api/projects/${data.id}/management/participants`;
	let urlFront = `/projects/${data.id}/management/participants`;
	let uniqueUrl = `/projects/${data.id}/management/participants`;

	let dataHolder: TableData<Participant>;

	onMount(async () => {
		const urlParams = new URLSearchParams(window.location.search);

        options = {
            filter: urlParams.get('filter') || options.filter,
            limit: parseInt(urlParams.get('limit') || options.limit.toString()),
            page: parseInt(urlParams.get('page') || options.page.toString()),
            order: urlParams.get('order') || options.order,
            orderBy: urlParams.get('orderBy') || options.orderBy
        };

        await fetchProject(); 
		fetchData();
	});

    
    async function fetchProject() {
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

            console.log('Réponse brute API participants :', data);

			participants = data.data;
			meta = data.meta;

			dataHolder = {
				data: participants,
				columns: ['id', 'updatedAt', 'lastActivity'],
				notOrderedColumns: []
			};
            console.log("Participants :" , dataHolder)
		});
	}
</script>

<ProjectHeadDisplayer {project} selectedTab={1} />

<SimpleFilterer
    bind:data={dataHolder}
    bind:meta
    bind:options
    bind:uniqueUrl
    on:optionsUpdated={() => fetchData()}
>

    <div class="w-full overflow-x-auto">
        <table class="w-full min-w-[800px] text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead class="bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 uppercase dark:text-gray-400">
                <tr>
                    <th class="px-4 py-2">First name</th>
                    <th class="px-4 py-2">Last name</th>
                    <th class="px-4 py-2">Email</th>
                    <th class="px-4 py-2">Phone</th>
                    <th class="px-4 py-2">Messenger</th>
                    <th class="px-4 py-2">Section</th>
                    <th class="px-4 py-2">Last activity</th>
                    <th class="px-4 py-2">Updated at</th>
                </tr>
            </thead>
            <tbody>

                {#each participants as participant}
                    <tr
                        on:click={() => goto(uniqueUrl + `/${participant.id}`)}
                        class="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-700"
                    >
                        <td class="px-4 py-2">{participant.contact.firstName}</td>
                        <td class="px-4 py-2">{participant.contact.lastName}</td>
                        <td class="px-4 py-2">{participant.contact.email}</td>
                        <td class="px-4 py-2">{participant.contact.phone}</td>
                        <td class="px-4 py-2">{participant.contact.messenger}</td>
                        <td class="px-4 py-2">
                            {participant.section.name}
                            {#if participant.isSectionLeader}
                                <span class="text-sm font-bold text-blue-500">(Leader)</span>
                            {/if}
                        </td>
                        <td class="px-4 py-2"><DateShow bind:startTime={participant.lastActivity} /></td>
                        <td class="px-4 py-2"><DateShow bind:startTime={participant.updatedAt} /></td>
                    </tr>
                {/each}
                
            </tbody>
        </table>
    </div>
  
</SimpleFilterer>

<button 
    on:click={() => goto(`${urlFront}/creation`)} 
    class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
>
    Add a participant
</button>