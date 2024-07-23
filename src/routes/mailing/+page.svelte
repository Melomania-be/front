<script lang="ts">
	import { onMount } from 'svelte';
	import HtmlEditor from './HtmlEditor.svelte';
	import type { MailTemplate } from '$lib/types/MailTemplate';
	import type { CustomList } from '$lib/types/CustomList';
	import type { TableData } from '$lib/types/TableData';
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import type { List } from '$lib/types/List';
	import type { Project } from '$lib/types/Project';

	let selectedList: CustomList | null = null as CustomList | null;
	let lists: CustomList[] = [];
	let meta: any = {};
	let options: any = {
		filter: '',
		limit: 10,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};
	let url: string = '/api/lists';
	let urlFront: string = '/mailing';
	let uniqueUrl: string = '/mailing';

	let dataHolder: TableData<CustomList>;

	let allProjects: Project[] = [];

	let toContact = {
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		messenger: ''
	};

	let containsToContact: boolean | undefined = false;
	let containsProject: boolean | undefined = false;
	let containsCallsheet: boolean | undefined = false;

	let html = `here's some <strong>HTML!!!</strong>`;

	async function sendMail() {
		const response = await fetch('/api/mailing', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ html })
		});

		const data = await response.json();
		console.log(data);
	}

	let useTemplate = false;
	let templates: MailTemplate[] = [];
	let selectedTemplate: MailTemplate | null = null;
	let linkedProject: Project | null = null;

	onMount(async () => {
		const res = await fetch('/api/templates');
		const data = await res.json();
		templates = data;

		const urlParams = new URLSearchParams(window.location.search);
		options = {
			filter: urlParams.get('filter') || '',
			limit: parseInt(urlParams.get('limit') || '5'),
			page: parseInt(urlParams.get('page') || '1'),
			order: urlParams.get('order') || 'asc',
			orderBy: urlParams.get('orderBy') || 'id'
		};
		fetchData();

		await fetchProjects();
	});

	async function fetchProjects() {
		const response = await fetch(`/api/projects?page=1&limit=10000&filter=&orderBy=id&order=asc`, {
			method: 'GET'
		});

		const responseHandler = new ResponseHandlerClient();

		responseHandler.handle(response, async () => {
			const data = await response.json();
			allProjects = data.data;
		});
	}

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

			console.log(data);

			const tmpLists: List[] = data.data;

			lists = tmpLists.map((list) => {
				return {
					...list,
					contacts: list.contacts
						.map((contact) => {
							return `${contact.firstName} ${contact.lastName}`;
						})
						.join(' - ')
				};
			});

			meta = data.meta;

			dataHolder = {
				data: lists,
				columns: ['id', 'name'],
				notOrderedColumns: ['contacts']
			};
		});
	}

	async function sendTemplateToList() {
		if (!selectedList) {
			alert('Please select a list');
			return;
		}

		if (!selectedTemplate) {
			alert('Please select a template');
			return;
		}

		if (!linkedProject && (containsProject || containsCallsheet)) {
			alert('Please select a project');
			return;
		}

		console.log('Send template to list', selectedTemplate, selectedList);
		console.log('To contact', toContact);
		console.log('Project', linkedProject);

		let dataToSend = {
			template: selectedTemplate,
			listContacts: selectedList,
			hasProject: containsProject,
			hasCallsheet: containsCallsheet,
			project: linkedProject,
			toContact: toContact
		};

		const response = await fetch('/api/mailing/sendLaterTemplateToLists', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(dataToSend)
		});
	}

	$: containsToContact = selectedTemplate?.content?.includes('${TO_CONTACT}');
	$: containsProject = selectedTemplate?.content?.includes('${PROJECT}');
	$: containsCallsheet = selectedTemplate?.content?.includes('${CALLSHEET}');
</script>

<div class="grid grid-cols-2 gap-4">
	<div class="space-y-4">
		<button
			class="m-2 p-2 bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
			on:click={() => {
				window.location.href = '/mailing/templates';
			}}>Template Manager</button
		>

		{#if useTemplate === true}
			<div class="m-2 p-2 border-2 border-gray-300 flex justify-between items-center">
				<button
					class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
					on:click={() => (useTemplate = false)}>Use unique mail</button
				>
				<h1>Send template mail</h1>
				<div>
					<h1 class="col-span-2">Templates</h1>
					<select class="m-2" bind:value={selectedTemplate}>
						{#each templates as template}
							<option value={template}>{template.name}</option>
						{/each}
					</select>

					<button
						class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
						on:click={sendTemplateToList}>Send</button
					>
				</div>
			</div>
			{#if selectedTemplate}
				{#if containsToContact}
					<div class="m-2 p-2 border-2 border-gray-300">
						Enter informations for the to contact to contact in case the template contains ${'{TO_CONTACT}'}:
						<input
							type="text"
							bind:value={toContact.firstName}
							placeholder="To Contact First Name"
						/>
						<input type="text" bind:value={toContact.lastName} placeholder="To Contact Last Name" />
						<input type="email" bind:value={toContact.email} placeholder="To Contact Email" />
						<input type="tel" bind:value={toContact.phone} placeholder="To Contact Phone" />
						<input
							type="text"
							bind:value={toContact.messenger}
							placeholder="To Contact Messenger"
						/>
					</div>
				{/if}
				{#if containsProject || containsCallsheet}
					<div class="m-2 p-2 border-2 border-gray-300">
						Enter informations for the project in case the template contains ${'{PROJECT}'} or a ${'{CALLSHEET}'}
						of a project:
						<select bind:value={linkedProject}>
							{#each allProjects as project}
								<option value={project}>{project.name}</option>
							{/each}
						</select>
					</div>
				{/if}
				<div class="m-2">
					<h1>{selectedTemplate.name}</h1>
					<HtmlEditor content={selectedTemplate.content || ''} />
				</div>
				<div class="m-2 border border-gray-500 rounded">
					{@html selectedTemplate.content}
				</div>
			{/if}
		{:else}
			<div class="m-2 p-2 border-2 border-gray-300">
				<button
					class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
					on:click={() => (useTemplate = true)}>Use template</button
				>
				<br />
				<h1>Send unique mail</h1>
			</div>
			<div>
				<h1 class="col-span-2">Mails</h1>
				<div class="m-2">
					<HtmlEditor bind:content={html} />
					<button
						class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
						on:click={sendMail}>Send</button
					>
				</div>
				<div class="m-2 border border-gray-500 rounded">
					{@html html}
				</div>
			</div>
		{/if}
	</div>

	<div>
		<div class="m-2 p-2 border-2 border-gray-300 flex justify-center items-center">
			<p>Please select a list. <br /> Selected list : {selectedList?.name ?? 'none'}</p>
		</div>
		{#if dataHolder}
			<SimpleFilterer
				showData={false}
				editable={false}
				paginatorTop={false}
				bind:data={dataHolder}
				bind:meta
				bind:options
				bind:uniqueUrl
				on:optionsUpdated={() => fetchData()}
			>
				<div class="w-full border-2 border-grey-500">
					{#each dataHolder.data as list}
						<button
							class="flex cursor-pointer justify-items-center"
							on:click={() => (selectedList = list)}
							role="button"
						>
							<h1>{list.name}</h1>
						</button>
					{/each}
				</div>
			</SimpleFilterer>
		{/if}
	</div>
</div>
