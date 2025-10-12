<script lang="ts">
	import { onMount, tick } from 'svelte';
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
	import { Mail } from 'lucide-svelte';
	import ModuleHeader from '$lib/components/ModuleHeader.svelte';

	let selectedList: CustomList | null = null as CustomList | null;
	let lists: CustomList[] = [];
	let meta: any = {};
	let options: any = {
		filter: '',
		limit: 250,
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

	let unique_html: MailTemplate = {
		id: 0,
		name: '',
		content: '',
		is_default: false,
		createdAt: '',
		updatedAt: ''
	};
	let uniqueSubject = '';

	async function sendMail() {
		if (!selectedList) {
			alert('Please select a list');
			return;
		}

		let confirmSend = confirm(
			`Are you sure you want to send this unique mail to the list ${selectedList.name}?`
		);
		if (!confirmSend) {
			return;
		}

		let dataUnique = {
			listContacts: selectedList,
			subject: uniqueSubject,
			content: unique_html?.content
		};

		try {
			const response = await fetch('/api/mailing', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(dataUnique)
			});
			alert('Email sent');
		} catch (error) {
			alert('Error sending email');
		}
	}

	let useTemplate = false;
	let templates: MailTemplate[] = [];
	let selectedTemplate: MailTemplate | null = null;
	let linkedProject: Project | null = null;

	onMount(async () => {
		try {
			const res = await fetch('/api/templates');
			const data = await res.json();
			templates = data;

			const urlParams = new URLSearchParams(window.location.search);
			options = {
				filter: urlParams.get('filter') || options.filter,
				limit: parseInt(urlParams.get('limit') || options.limit.toString()),
				page: parseInt(urlParams.get('page') || options.page.toString()),
				order: urlParams.get('order') || options.order,
				orderBy: urlParams.get('orderBy') || options.orderBy
			};
			fetchData();
			await fetchProjects();
		} catch (error) {
			console.error('Error loading data:', error);
		}
	});

	async function fetchProjects() {
		try {
			const response = await fetch(`/api/projects?page=1&limit=10000&filter=&orderBy=id&order=asc`, {
				method: 'GET'
			});

			const responseHandler = new ResponseHandlerClient();
			responseHandler.handle(response, async () => {
				const data = await response.json();
				allProjects = data.data;
			});
		} catch (error) {
			console.error('Error fetching projects:', error);
		}
	}

	async function fetchData() {
		try {
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
		} catch (error) {
			console.error('Error fetching data:', error);
		}
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

		let confirmSend = confirm(
			`Are you sure you want to send the template ${selectedTemplate.name} to the list ${selectedList.name}?`
		);
		if (!confirmSend) {
			return;
		}

		let dataToSend = {
			template: selectedTemplate,
			listContacts: selectedList,
			hasProject: containsProject,
			hasCallsheet: containsCallsheet,
			project: linkedProject,
			toContact: toContact
		};

		try {
			const response = await fetch('/api/mailing/sendTemplateToLists', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(dataToSend)
			});
			alert('Email sent');
		} catch (error) {
			alert('Error sending email');
		}
	}

	function editTemplate() {
		return useTemplate ? selectedTemplate : unique_html;
	}

	async function updateIframeContent() {
		if (typeof window !== 'undefined') {
			await tick();

			const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
			if (iframe && iframe.contentWindow) {
				const doc = iframe.contentDocument || iframe.contentWindow?.document;
				if (doc) {
					const content = editTemplate()?.content || '';

					doc.open();
					doc.write(`
						<!DOCTYPE html>
						<html lang="en">
						<head>
							<meta charset="UTF-8">
							<meta name="viewport" content="width=device-width, initial-scale=1.0">
							<style>
								body {
									margin: 0;
									padding: 20px;
									font-family: Arial, sans-serif;
								}
							</style>
						</head>
						<body>
							${content}
						</body>
						</html>
					`);
					doc.close();
				}

				setTimeout(() => {
					if (doc && doc.body) {
						const contentHeight = doc.body.scrollHeight + 50;
						iframe.style.height = Math.max(300, contentHeight) + 'px';
					}
				}, 100);
			}
		}
	}

	$: containsToContact = selectedTemplate?.content?.includes('${TO_CONTACT}');
	$: containsProject = selectedTemplate?.content?.includes('${PROJECT}');
	$: containsCallsheet = selectedTemplate?.content?.includes('${CALLSHEET}');

	$: if (useTemplate || selectedTemplate || unique_html) {
		updateIframeContent();
	}

	function handleEditorInput(event: CustomEvent<string>) {
		if (!useTemplate) {
			unique_html.content = event.detail;
		}
		updateIframeContent();
	}
</script>

<div>
	<ModuleHeader
		title="Mailing"
		description="Send emails to your contact lists"
		icon={Mail}
		on:refresh={() => fetchData()}
	/>

<div class="m-4 relative max-w-xxl bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">

	<button
		type="button"
		class="ml-10 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2"
		on:click={() => goto('/mailing/templates')}
	>
		Go to Template Manager
	</button>
	<button
		type="button"
		class="ml-10 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2"
		on:click={() => goto('/mailing/templates/default')}
	>
		Go to the default templates editor
	</button>

	<div class="m-10 pt-5 grid grid-cols-1 lg:grid-cols-2 gap-10">
		<div class="p-2">
			<p class="mb-20">
				Here is where you can send mails to lists of contacts. You can either send a unique mail (it
				will not be saved) or use a template.
			</p>
			<div class="m-2 text-lg p-2 border-2 border-gray-300 flex justify-center items-center">
				<p>Please select a list. <br /> Selected list : {selectedList?.name ?? 'none'}</p>
			</div>
		</div>

		<div>
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
					<div class="w-full">
						{#each dataHolder.data as list}
							<button
								class="w-full flex items-center justify-center p-2 my-2 text-s font-semibold text-gray-700 bg-white border border-bottom-black-300 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
								on:click={() => (selectedList = list)}
							>
								<h1>{list.name}</h1>
							</button>
						{/each}
					</div>
				</SimpleFilterer>
			{/if}
		</div>
	</div>

	{#if useTemplate === false}
		<h2 class="mt-10 text-2xl font-bold mb-2 p-3 text-center underline">Unique Mail</h2>
		<button
			class="ml-10 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2"
			on:click={() => (useTemplate = true)}>Use a template</button
		>

		<div class="ml-10 mb-10 pt-5 grid grid-cols-1 lg:grid-cols-2 gap-10">
			<div class="border border-gray-500 rounded p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
				<h2 class="text-xl font-bold mb-4">Write your email</h2>

				<input
					type="text"
					bind:value={uniqueSubject}
					placeholder="Email Subject"
					class="mb-2 block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
				/>

				<HtmlEditor bind:content={unique_html.content} on:input={handleEditorInput} />

				<button
					class="mt-5 focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2"
					on:click={sendMail}>Send</button
				>
			</div>

			<div class="border border-gray-500 rounded p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
				<h2 class="text-xl font-bold mb-4">Preview</h2>
				<div class="p-4 bg-gray-100 rounded dark:bg-gray-900" style="min-height: 200px;">
					<iframe title="preview" id="preview-iframe" class="w-full h-full border-0" />
				</div>
			</div>
		</div>
	{/if}

	{#if useTemplate === true}
		<h2 class="mt-10 text-2xl font-bold mb-2 p-3 text-center underline">Template mail</h2>
		<button
			class="ml-10 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2"
			on:click={() => (useTemplate = false)}>Use unique mail</button
		>

		<div class="ml-10 mb-10 pt-5 grid grid-cols-1 lg:grid-cols-2 gap-10">
			<div class="border border-gray-500 rounded p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
				<h2 class="text-xl font-bold mb-4">Complete the template informations</h2>
				<p>
					Please select the template you want to use :
					<select class="m-2" bind:value={selectedTemplate}>
						{#each templates as template}
							<option value={template}>{template.name}</option>
						{/each}
					</select>
				</p>

				{#if selectedTemplate}
					{#if containsToContact}
						<div class="m-2 p-2 border-2 border-gray-300">
							Enter informations for the to contact:
							<input type="text" bind:value={toContact.firstName} placeholder="First Name" />
							<input type="text" bind:value={toContact.lastName} placeholder="Last Name" />
							<input type="email" bind:value={toContact.email} placeholder="Email" />
							<input type="tel" bind:value={toContact.phone} placeholder="Phone" />
							<input type="text" bind:value={toContact.messenger} placeholder="Messenger" />
						</div>
					{/if}

					{#if containsProject || containsCallsheet}
						<div class="m-2 p-2 border-2 border-gray-300">
							Select project:
							<select bind:value={linkedProject}>
								{#each allProjects as project}
									<option value={project}>{project.name}</option>
								{/each}
							</select>
						</div>
					{/if}

					<button
						class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
						on:click={sendTemplateToList}>Send</button
					>
				{/if}
			</div>

			<div class="border border-gray-500 rounded p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
				{#if selectedTemplate}
					<h2 class="text-xl font-bold mb-4">Preview</h2>
					<div class="m-2">
						<h1>{selectedTemplate.name}</h1>
					</div>
					<div class="p-4 bg-gray-100 rounded dark:bg-gray-900" style="min-height: 200px;">
						<iframe title="preview" id="preview-iframe" class="w-full h-full border-0" />
					</div>
				{:else}
					<p>Please select a template to see its content</p>
				{/if}
			</div>
		</div>
	{/if}
</div>
</div>