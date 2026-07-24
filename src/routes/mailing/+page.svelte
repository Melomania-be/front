<script lang="ts">
	import { onMount, tick } from 'svelte';
	import DOMPurify from 'dompurify';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { Mail } from 'lucide-svelte';
	import HtmlEditor from './HtmlEditor.svelte';
	import ModuleHeader from '$lib/components/ModuleHeader.svelte';
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte';
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import type { MailTemplate } from '$lib/types/MailTemplate';
	import type { CustomList } from '$lib/types/CustomList';
	import type { TableData } from '$lib/types/TableData';
	import type { List } from '$lib/types/List';
	import type { Project } from '$lib/types/Project';

	// =============================================
	// TAB STATE
	// =============================================
	type TabId = 'send' | 'templates' | 'system';
	let activeTab: TabId = 'send';

	function switchTab(tab: TabId) {
		activeTab = tab;
		if (browser) goto(`/mailing?tab=${tab}`, { replaceState: true });
	}

	// =============================================
	// SHARED DATA
	// =============================================
	let templates: MailTemplate[] = [];
	let defaultTemplates: MailTemplate[] = [];
	let allProjects: Project[] = [];

	// =============================================
	// SEND TAB STATE
	// =============================================
	let selectedList: CustomList | null = null;
	let lists: CustomList[] = [];
	let meta: any = {};
	let options: any = {
		filter: '',
		limit: 250,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};
	let uniqueUrl: string = '/mailing';
	let dataHolder: TableData<CustomList>;

	let toContact = {
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		messenger: ''
	};

	let unique_html: MailTemplate = {
		id: 0,
		name: '',
		content: '',
		is_default: false,
		createdAt: '',
		updatedAt: ''
	};
	let uniqueSubject = '';
	let useTemplate = false;
	let selectedSendTemplate: MailTemplate | null = null;
	let linkedProject: Project | null = null;

	$: containsToContact = selectedSendTemplate?.content?.includes('${TO_CONTACT}');
	$: containsProject = selectedSendTemplate?.content?.includes('${PROJECT}');
	$: containsCallsheet = selectedSendTemplate?.content?.includes('${CALLSHEET}');

	// =============================================
	// TEMPLATES TAB STATE
	// =============================================
	let selectedEditTemplate: MailTemplate;
	let isCreatingTemplate = false;
	let newTemplateToSave = {
		name: '',
		content: '',
		images: [] as any[],
		is_default: false
	};

	// =============================================
	// SYSTEM TAB STATE
	// =============================================
	let selectedDefaultTemplate: MailTemplate;

	// =============================================
	// SHARED: IFRAME PREVIEW
	// =============================================
	async function updateIframeContent(iframeId: string, content: string) {
        if (typeof window === 'undefined') return;
        await tick();

        const iframe = document.getElementById(iframeId) as HTMLIFrameElement;
        if (!iframe?.contentWindow) return;

        const doc = iframe.contentDocument || iframe.contentWindow.document;
        if (!doc) return;

        // ✅ CORRECTION V-09 (frontend) : sanitisation du contenu avant injection dans l'iframe
        // Bloque les balises dangereuses (script, iframe, object, form) et les attributs
        // d'événements (onerror, onclick...) qui permettraient une exécution de code.
        const safeContent = DOMPurify.sanitize(content, {
            FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'style'],
            FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
        });

        doc.open();
        doc.write(`<!DOCTYPE html>
            <html lang="en">
            <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }</style>
            </head>
            <body>${safeContent}</body>
            </html>`);
    doc.close();

		setTimeout(() => {
			if (doc.body) {
				iframe.style.height = Math.max(300, doc.body.scrollHeight + 50) + 'px';
			}
		}, 100);
	}

	// =============================================
	// SEND TAB: REACTIVITY
	// =============================================
	$: if (activeTab === 'send') {
		const content = useTemplate ? selectedSendTemplate?.content : unique_html.content;
		if (content !== undefined) updateIframeContent('preview-iframe-send', content || '');
	}

	function handleSendEditorInput(event: CustomEvent<string>) {
		if (!useTemplate) {
			unique_html.content = event.detail;
		}
		updateIframeContent('preview-iframe-send', event.detail);
	}

	// =============================================
	// TEMPLATES TAB: REACTIVITY
	// =============================================
	$: if (activeTab === 'templates' && (selectedEditTemplate || newTemplateToSave || isCreatingTemplate)) {
		const content = isCreatingTemplate ? newTemplateToSave.content : selectedEditTemplate?.content;
		updateIframeContent('preview-iframe-templates', content || '');
	}

	function handleTemplatesEditorInput(event: CustomEvent<string>) {
		if (isCreatingTemplate) {
			newTemplateToSave.content = event.detail;
		} else if (selectedEditTemplate) {
			selectedEditTemplate.content = event.detail;
		}
		updateIframeContent('preview-iframe-templates', event.detail);
	}

	// =============================================
	// SYSTEM TAB: REACTIVITY
	// =============================================
	$: if (activeTab === 'system' && selectedDefaultTemplate) {
		updateIframeContent('preview-iframe-system', selectedDefaultTemplate.content || '');
	}

	function handleSystemEditorInput(event: CustomEvent<string>) {
		if (selectedDefaultTemplate) {
			selectedDefaultTemplate.content = event.detail;
		}
		updateIframeContent('preview-iframe-system', event.detail);
	}

	// =============================================
	// DATA FETCHING
	// =============================================
	onMount(async () => {
		// Read tab from URL
		const tabParam = $page.url.searchParams.get('tab') as TabId | null;
		if (tabParam && ['send', 'templates', 'system'].includes(tabParam)) {
			activeTab = tabParam;
		}

		// Read pagination params
		const urlParams = new URLSearchParams(window.location.search);
		options = {
			filter: urlParams.get('filter') || options.filter,
			limit: parseInt(urlParams.get('limit') || options.limit.toString()),
			page: parseInt(urlParams.get('page') || options.page.toString()),
			order: urlParams.get('order') || options.order,
			orderBy: urlParams.get('orderBy') || options.orderBy
		};

		try {
			const [resTemplates, resDefault] = await Promise.all([
				fetch('/api/templates'),
				fetch('/api/templates/default')
			]);
			templates = await resTemplates.json();
			defaultTemplates = await resDefault.json();

			if (templates.length > 0) {
				selectedEditTemplate = templates[0];
			}
		} catch (error) {
			console.error('Error loading templates:', error);
		}

		fetchLists();
		fetchProjects();
	});

	async function fetchLists() {
		try {
			let optionInUrls = `?page=${options.page}&limit=${options.limit}`;
			optionInUrls += '&filter=' + options.filter;
			optionInUrls += '&orderBy=' + options.orderBy;
			optionInUrls += '&order=' + options.order;

			const response = await fetch(`/api/lists${optionInUrls}`, { method: 'GET' });
			const responseHandler = new ResponseHandlerClient();
			responseHandler.handle(response, async () => {
				const data = await response.json();
				const tmpLists: List[] = data.data;
				lists = tmpLists.map((list) => ({
					...list,
					contacts: list.contacts
						.map((contact) => `${contact.firstName} ${contact.lastName}`)
						.join(' - ')
				}));
				meta = data.meta;
				dataHolder = {
					data: lists,
					columns: ['id', 'name'],
					notOrderedColumns: ['contacts']
				};
			});
		} catch (error) {
			console.error('Error fetching lists:', error);
		}
	}

	async function fetchProjects() {
		try {
			const response = await fetch(`/api/projects?page=1&limit=10000&filter=&orderBy=id&order=asc`, { method: 'GET' });
			const responseHandler = new ResponseHandlerClient();
			responseHandler.handle(response, async () => {
				const data = await response.json();
				allProjects = data.data;
			});
		} catch (error) {
			console.error('Error fetching projects:', error);
		}
	}

	// =============================================
	// SEND TAB: ACTIONS
	// =============================================
	async function sendUniqueMail() {
		if (!selectedList) { alert('Please select a list'); return; }
		if (!confirm(`Are you sure you want to send this unique mail to the list ${selectedList.name}?`)) return;

		try {
			await fetch('/api/mailing', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					listContacts: selectedList,
					subject: uniqueSubject,
					content: unique_html?.content
				})
			});
			alert('Email sent');
		} catch (error) {
			alert('Error sending email');
		}
	}

	async function sendTemplateToList() {
		if (!selectedList) { alert('Please select a list'); return; }
		if (!selectedSendTemplate) { alert('Please select a template'); return; }
		if (!linkedProject && (containsProject || containsCallsheet)) { alert('Please select a project'); return; }
		if (!confirm(`Are you sure you want to send the template ${selectedSendTemplate.name} to the list ${selectedList.name}?`)) return;

		try {
			await fetch('/api/mailing/sendTemplateToLists', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					template: selectedSendTemplate,
					listContacts: selectedList,
					hasProject: containsProject,
					hasCallsheet: containsCallsheet,
					project: linkedProject,
					toContact: toContact
				})
			});
			alert('Email sent');
		} catch (error) {
			alert('Error sending email');
		}
	}

	// =============================================
	// TEMPLATES TAB: ACTIONS
	// =============================================
	function startNewTemplate() {
		isCreatingTemplate = true;
		newTemplateToSave = { name: '', content: '', images: [], is_default: false };
	}

	async function saveUserTemplate() {
		if (isCreatingTemplate) {
			if (!newTemplateToSave.name || !newTemplateToSave.content) { alert('Please fill all fields'); return; }
			if (!confirm('Are you sure you want to save this template?')) return;

			try {
				const res = await fetch('/api/templates', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(newTemplateToSave)
				});
				const data = await res.json();
				templates = [...templates, data];
				selectedEditTemplate = data;
				isCreatingTemplate = false;
				alert('Template saved');
			} catch (error) {
				alert('Error saving template');
			}
		} else {
			if (!selectedEditTemplate.name || !selectedEditTemplate.content) { alert('Please fill all fields'); return; }
			if (!confirm('Are you sure you want to save these edits?')) return;

			try {
				const res = await fetch(`/api/templates`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(selectedEditTemplate)
				});
				const data = await res.json();
				const index = templates.findIndex((t) => t.id === data.id);
				templates[index] = data;
				templates = templates;
				selectedEditTemplate = data;
				alert('Template saved');
			} catch (error) {
				alert('Error saving template');
			}
		}
	}

	async function deleteUserTemplate() {
		if (!confirm('Are you sure you want to delete this template?')) return;

		try {
			await fetch(`/api/templates/${selectedEditTemplate.id}`, { method: 'DELETE' });
			templates = templates.filter((t) => t.id !== selectedEditTemplate.id);
			selectedEditTemplate = templates[0];
			alert('Template deleted');
		} catch (error) {
			alert('Error deleting template');
		}
	}

	// =============================================
	// SYSTEM TAB: ACTIONS
	// =============================================
	async function saveDefaultTemplate() {
		if (!confirm('Are you sure you want to save the changes?')) return;

		try {
			const res = await fetch(`/api/templates/default`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: selectedDefaultTemplate.id,
					name: selectedDefaultTemplate.name,
					content: selectedDefaultTemplate.content
				})
			});

			if (res.ok) {
				alert('Template saved');
			} else {
				alert('An error occurred');
			}
		} catch (error) {
			console.error('Error saving template:', error);
			alert('Network error occurred');
		}
	}
</script>

<div>
	<ModuleHeader
		title="Mailing"
		description="Manage your emails and templates"
		icon={Mail}
		on:refresh={() => fetchLists()}
	/>

	<div class="m-4 relative max-w-xxl bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
		<!-- TAB BAR -->
		<div class="text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700">
			<ul class="flex flex-wrap -mb-px">
				<li class="me-2">
					<button
						class="inline-block p-4 border-b-2 rounded-t-lg {activeTab === 'send'
							? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500'
							: 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'}"
						on:click={() => switchTab('send')}
					>
						Envoyer un mail
					</button>
				</li>
				<li class="me-2">
					<button
						class="inline-block p-4 border-b-2 rounded-t-lg {activeTab === 'templates'
							? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500'
							: 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'}"
						on:click={() => switchTab('templates')}
					>
						Mes templates
					</button>
				</li>
				<li class="me-2">
					<button
						class="inline-block p-4 border-b-2 rounded-t-lg {activeTab === 'system'
							? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500'
							: 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'}"
						on:click={() => switchTab('system')}
					>
						Templates système
					</button>
				</li>
			</ul>
		</div>

		<!-- ============================================= -->
		<!-- TAB: ENVOYER UN MAIL                          -->
		<!-- ============================================= -->
		{#if activeTab === 'send'}
			<div class="p-6">
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
					<!-- Left: info + mail mode -->
					<div>
						<p class="mb-6 text-gray-600">
							Send emails to your contact lists. Choose between writing a unique email or using a saved template.
						</p>
						<div class="mb-4 p-3 border-2 border-gray-200 rounded-lg text-center">
							<p>Selected list: <strong>{selectedList?.name ?? 'none'}</strong></p>
						</div>
					</div>

					<!-- Right: list browser -->
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
								on:optionsUpdated={() => fetchLists()}
							>
								<div class="w-full">
									{#each dataHolder.data as list}
										<button
											class="w-full flex items-center justify-center p-2 my-2 text-s font-semibold text-gray-700 bg-white border rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400
												{selectedList?.id === list.id ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200' : 'border-gray-300'}"
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

				<!-- Mail mode toggle -->
				<div class="flex gap-3 mt-6 mb-4">
					<button
						class="px-5 py-2.5 font-medium rounded-lg text-sm transition-colors
							{!useTemplate ? 'text-white bg-blue-700 hover:bg-blue-800' : 'text-gray-700 bg-gray-200 hover:bg-gray-300'}"
						on:click={() => (useTemplate = false)}
					>
						Unique Mail
					</button>
					<button
						class="px-5 py-2.5 font-medium rounded-lg text-sm transition-colors
							{useTemplate ? 'text-white bg-blue-700 hover:bg-blue-800' : 'text-gray-700 bg-gray-200 hover:bg-gray-300'}"
						on:click={() => (useTemplate = true)}
					>
						Template Mail
					</button>
				</div>

				<!-- UNIQUE MAIL -->
				{#if !useTemplate}
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
						<div class="border border-gray-300 rounded-lg p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
							<h2 class="text-xl font-bold mb-4">Write your email</h2>
							<input
								type="text"
								bind:value={uniqueSubject}
								placeholder="Email Subject"
								class="mb-3 block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
							/>
							<HtmlEditor bind:content={unique_html.content} on:input={handleSendEditorInput} />
							<button
								class="mt-5 focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5"
								on:click={sendUniqueMail}>Send</button
							>
						</div>
						<div class="border border-gray-300 rounded-lg p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
							<h2 class="text-xl font-bold mb-4">Preview</h2>
							<div class="p-4 bg-gray-100 rounded dark:bg-gray-900" style="min-height: 200px;">
								<iframe title="preview" id="preview-iframe-send" class="w-full h-full border-0" />
							</div>
						</div>
					</div>
				{/if}

				<!-- TEMPLATE MAIL -->
				{#if useTemplate}
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
						<div class="border border-gray-300 rounded-lg p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
							<h2 class="text-xl font-bold mb-4">Send using a template</h2>
							<p class="mb-3">
								Select template:
								<select class="ml-2 p-2 border border-gray-300 rounded" bind:value={selectedSendTemplate}>
									<option value={null}>-- Choose a template --</option>
									{#each templates as template}
										<option value={template}>{template.name}</option>
									{/each}
								</select>
							</p>

							{#if selectedSendTemplate}
								{#if containsToContact}
									<div class="mb-3 p-3 border border-gray-200 rounded-lg">
										<p class="font-medium mb-2">Contact information:</p>
										<div class="grid grid-cols-2 gap-2">
											<input type="text" bind:value={toContact.firstName} placeholder="First Name" class="p-2 text-sm border rounded" />
											<input type="text" bind:value={toContact.lastName} placeholder="Last Name" class="p-2 text-sm border rounded" />
											<input type="email" bind:value={toContact.email} placeholder="Email" class="p-2 text-sm border rounded" />
											<input type="tel" bind:value={toContact.phone} placeholder="Phone" class="p-2 text-sm border rounded" />
											<input type="text" bind:value={toContact.messenger} placeholder="Messenger" class="p-2 text-sm border rounded col-span-2" />
										</div>
									</div>
								{/if}

								{#if containsProject || containsCallsheet}
									<div class="mb-3 p-3 border border-gray-200 rounded-lg">
										<p class="font-medium mb-2">Select project:</p>
										<select bind:value={linkedProject} class="p-2 border border-gray-300 rounded w-full">
											<option value={null}>-- Choose a project --</option>
											{#each allProjects as project}
												<option value={project}>{project.name}</option>
											{/each}
										</select>
									</div>
								{/if}

								<button
									class="mt-3 focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5"
									on:click={sendTemplateToList}>Send</button
								>
							{/if}
						</div>
						<div class="border border-gray-300 rounded-lg p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
							{#if selectedSendTemplate}
								<h2 class="text-xl font-bold mb-4">Preview: {selectedSendTemplate.name}</h2>
								<div class="p-4 bg-gray-100 rounded dark:bg-gray-900" style="min-height: 200px;">
									<iframe title="preview" id="preview-iframe-send" class="w-full h-full border-0" />
								</div>
							{:else}
								<p class="text-gray-500">Select a template to see its preview</p>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- ============================================= -->
		<!-- TAB: MES TEMPLATES                            -->
		<!-- ============================================= -->
		{#if activeTab === 'templates'}
			<div class="p-6">
				<!-- Actions bar -->
				<div class="flex items-center gap-3 mb-6">
					{#if !isCreatingTemplate}
						<button
							class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5"
							on:click={startNewTemplate}
						>
							+ New Template
						</button>
					{/if}
				</div>

				<!-- Template selector (edit mode) -->
				{#if !isCreatingTemplate}
					{#if templates && templates.length > 0}
						<div class="mb-6">
							<label class="font-medium text-gray-700">
								Select template to edit:
								<select class="ml-2 p-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" bind:value={selectedEditTemplate}>
									{#each templates as template}
										<option value={template}>{template.name}</option>
									{/each}
								</select>
							</label>
						</div>
					{:else}
						<p class="text-gray-500 mb-6">No templates yet. Create your first one!</p>
					{/if}
				{/if}

				<!-- Editor + Preview -->
				{#if selectedEditTemplate && !isCreatingTemplate}
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
						<div class="border border-gray-300 rounded-lg p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
							<h2 class="text-xl font-bold mb-4">Edit template</h2>

							<div class="flex gap-2 mb-4">
								<button
									class="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5"
									on:click={saveUserTemplate}>Save</button
								>
								<button
									class="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5"
									on:click={deleteUserTemplate}>Delete</button
								>
							</div>

							<input
								type="text"
								bind:value={selectedEditTemplate.name}
								placeholder="Template Name"
								class="mb-3 block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
							/>

							<label class="flex items-center gap-2 mb-4 text-sm">
								<input type="checkbox" bind:checked={selectedEditTemplate.is_default} />
								Set as default template
							</label>

							<HtmlEditor bind:content={selectedEditTemplate.content} on:input={handleTemplatesEditorInput} />
						</div>

						<div class="border border-gray-300 rounded-lg p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
							<h2 class="text-xl font-bold mb-4">Preview</h2>
							<iframe title="preview" id="preview-iframe-templates" class="w-full h-96 border-0" />
						</div>
					</div>
				{/if}

				<!-- New template form -->
				{#if isCreatingTemplate}
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
						<div class="border border-gray-300 rounded-lg p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
							<h2 class="text-xl font-bold mb-4">Create new template</h2>

							<div class="flex gap-2 mb-4">
								<button
									class="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5"
									on:click={saveUserTemplate}>Save</button
								>
								<button
									class="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5"
									on:click={() => (isCreatingTemplate = false)}>Cancel</button
								>
							</div>

							<input
								type="text"
								bind:value={newTemplateToSave.name}
								placeholder="Template Name"
								class="mb-3 block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
							/>

							<label class="flex items-center gap-2 mb-4 text-sm">
								<input type="checkbox" bind:checked={newTemplateToSave.is_default} />
								Set as default template
							</label>

							<HtmlEditor bind:content={newTemplateToSave.content} on:input={handleTemplatesEditorInput} />
						</div>

						<div class="border border-gray-300 rounded-lg p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
							<h2 class="text-xl font-bold mb-4">Preview</h2>
							<iframe title="preview" id="preview-iframe-templates" class="w-full h-96 border-0" />
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- ============================================= -->
		<!-- TAB: TEMPLATES SYSTÈME                        -->
		<!-- ============================================= -->
		{#if activeTab === 'system'}
			<div class="p-6">
				<!-- Documentation -->
				<div class="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-700">
					<h2 class="text-lg font-bold mb-3">What are system templates?</h2>
					<p class="mb-3 text-sm text-gray-600 dark:text-gray-400">
						These are the templates sent automatically when you perform specific actions.
						They cannot be deleted, but you can edit their content.
					</p>
					<ul class="space-y-2 text-sm">
						<li>
							<span class="font-semibold">Callsheet Notification</span> — sent to notify participants about callsheet changes.
							<br /><span class="text-gray-500">Variables: &#36;&#123;NAME&#125; ; &#36;&#123;PROJECT&#125; ; &#36;&#123;CALLSHEET&#125; ; &#36;&#123;TO_CONTACT&#125;</span>
						</li>
						<li>
							<span class="font-semibold">Recruitment Notification</span> — sent to contacts about a new project.
							<br /><span class="text-gray-500">Variables: &#36;&#123;NAME&#125; ; &#36;&#123;PROJECT&#125; ; &#36;&#123;REGISTRATION&#125; ; &#36;&#123;TO_CONTACT&#125;</span>
						</li>
						<li>
							<span class="font-semibold">Participation Validation</span> — sent when a contact is validated.
							<br /><span class="text-gray-500">Variables: &#36;&#123;NAME&#125; ; &#36;&#123;PROJECT&#125; ; &#36;&#123;CALLSHEET&#125; ; &#36;&#123;TO_CONTACT&#125;</span>
						</li>
						<li>
							<span class="font-semibold">Recommended Notification</span> — sent to a recommended person.
							<br /><span class="text-gray-500">Variables: &#36;&#123;NAME&#125; ; &#36;&#123;REGISTRATION&#125; ; &#36;&#123;TO_CONTACT&#125;</span>
						</li>
						<li>
							<span class="font-semibold">Audition Request</span> — sent to invite a participant to audition.
							<br /><span class="text-gray-500">Variables: &#36;&#123;NAME&#125; ; &#36;&#123;PROJECT&#125; ; &#36;&#123;REGISTRATION&#125; ; &#36;&#123;TO_CONTACT&#125; ; &#36;&#123;AUDITION_INSTRUCTIONS&#125; ; &#36;&#123;ATTACHMENTS_SECTION&#125; ; &#36;&#123;DEADLINE_BLOCK&#125;</span>
						</li>
					</ul>
					<p class="mt-3 text-xs text-gray-500">
						Changes are <strong>permanent</strong> and cannot be reverted. Use the same parameters as in the original templates.
					</p>
				</div>

				<!-- Template selector -->
				{#if defaultTemplates && defaultTemplates.length > 0}
					<div class="mb-6">
						<label class="font-medium text-gray-700">
							Select template:
							<select
								class="ml-2 p-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
								bind:value={selectedDefaultTemplate}
							>
								<option value={undefined}>-- Choose a template --</option>
								{#each defaultTemplates as template}
									<option value={template}>{template.name}</option>
								{/each}
							</select>
						</label>
					</div>

					{#if selectedDefaultTemplate}
						<div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
							<div class="border border-gray-300 rounded-lg p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
								<h2 class="text-xl font-bold mb-4">Edit: {selectedDefaultTemplate.name}</h2>
								<button
									class="mb-4 focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5"
									on:click={saveDefaultTemplate}>Save Changes</button
								>
								<HtmlEditor bind:content={selectedDefaultTemplate.content} on:input={handleSystemEditorInput} />
							</div>
							<div class="border border-gray-300 rounded-lg p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
								<h2 class="text-xl font-bold mb-4">Preview</h2>
								<iframe title="preview" id="preview-iframe-system" class="w-full h-96 border-0" />
							</div>
						</div>
					{/if}
				{:else}
					<p class="text-gray-500">Loading templates...</p>
				{/if}
			</div>
		{/if}
	</div>
</div>
