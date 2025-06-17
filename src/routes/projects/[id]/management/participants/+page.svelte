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
	import ProjectPhoneDisplayer from '../ProjectPhoneDisplayer.svelte';

	export let data;

	let project: Project | undefined;

	let participants: Participant[] = [];
    let participantNotValidated : number = 0;

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

	onMount(() => {
		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});

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

        if(project?.participants){
        for(const p of project.participants){
            if( !p.accepted ){
                participantNotValidated++;
            }
        }
        }
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
		//console.log("DATA : " , project )
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
			console.log('Participants :', dataHolder);
		});
	}


	let isMobile = false;

	const checkMobile = () => {
		isMobile = window.innerWidth <= 1000;
	};
</script>

<ProjectHeadDisplayer {project} selectedTab={1} />
<div class="bg-[#E7E7E7] p-4 min-h-screen pb-[80px]">
	<div class="p-4 gap-4 flex flex-col">
		<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
            <h1 class="font-bold text-lg mb-2">NEW PARTICIPANTS</h1>
            {#if participantNotValidated}
            <div class="flex items-center  {isMobile ? "flex-col gap-2" : "px-2" }">
				<p class="{isMobile ? "" : ""}"> You have <strong class="text-red-400 mx-1">{participantNotValidated}</strong> {participantNotValidated === 1 ? "participant" : "participants"} waiting for validation</p>
				<a
					href="/projects/{data.id}/management/validation"
					class="ml-auto inline-flex items-center px-3 py-2 text-sm font-semibold text-center text-white bg-[#6B9AD9] rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				>
					Review Participants
				</a>
            </div>
            {:else if project}
                <p>No new participants waiting for validation</p>
            {/if}
		</div>
		<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
            <div class="flex items-center">
			<h1 class="font-bold text-lg">PARTICIPANTS</h1>
            <button
				on:click={() => goto(`${urlFront}/creation`)}
				class="ml-auto px-4 py-2 text-sm bg-[#6B9AD9] text-white rounded-lg font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
			>
				Add a participant
			</button>
            </div>
			<SimpleFilterer
				bind:data={dataHolder}
				bind:meta
				bind:options
				bind:uniqueUrl
				on:optionsUpdated={() => fetchData()}
			>
				<div class="w-full overflow-x-auto">
					<table
						class="w-full min-w-[800px] text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400"
					>
						<thead
							class="bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 uppercase dark:text-gray-400"
						>
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
		</div>
	</div>

	{#if isMobile}
	<ProjectPhoneDisplayer project={project} selectedTab={1}/>
	{/if}
</div>
