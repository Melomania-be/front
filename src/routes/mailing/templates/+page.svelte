<script lang="ts">
	import type { MailTemplate } from '$lib/types/MailTemplate';
	import { onMount, tick } from 'svelte';
	import HtmlEditor from '../HtmlEditor.svelte';
	import { goto } from '$app/navigation';
	import type { Folder } from '$lib/types/Folder';

	let selectedTemplate: MailTemplate;
	let folders: Array<Folder> = [];
	let selectedFolder: Folder;
	let templates: MailTemplate[] = [];
	let newOne = false;
	let OutputSrc = '';
	let newTemplateToSave = {
		name: '',
		content: '',
		images: [],
		is_default: false
	};

	function addImages(file: { path: any }) {
		OutputSrc = `<img file=${file.path}/>`;
	}

	async function newTemplate() {
		newOne = true;
		newTemplateToSave = {
			name: '',
			content: '',
			images: [],
			is_default: false
		};
	}

	function editTemplate() {
		return newOne ? newTemplateToSave : selectedTemplate;
	}

	async function saveTemplate() {
		if (newOne) {
			if (!newTemplateToSave.name || !newTemplateToSave.content) {
				alert('Please fill all fields');
				return;
			}
			let confirmSave = confirm('Are you sure you want to save this template ?');
			if (!confirmSave) {
				return;
			}

			try {
				const res = await fetch('/api/templates', {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(newTemplateToSave)
				});
				const data = await res.json();
				templates.push(data);
				selectedTemplate = data;
				newOne = false;
				alert('Template saved');
			} catch (error) {
				alert('Error saving template');
			}
		} else {
			if (!selectedTemplate.name || !selectedTemplate.content) {
				alert('Please fill all fields');
				return;
			}
			let confirmSave = confirm('Are you sure you want to save these edits ?');
			if (!confirmSave) {
				return;
			}

			try {
				const res = await fetch(`/api/templates`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(selectedTemplate)
				});
				const data = await res.json();
				const index = templates.findIndex((template) => template.id === data.id);
				templates[index] = data;
				selectedTemplate = data;
				alert('Template saved');
			} catch (error) {
				alert('Error saving template');
			}
		}
	}

	async function deleteTemplate() {
		let confirmDelete = confirm('Are you sure you want to delete this template ?');
		if (!confirmDelete) {
			return;
		}

		try {
			const res = await fetch(`/api/templates/${selectedTemplate.id}`, {
				method: 'DELETE'
			});

			const index = templates.findIndex((template) => template.id === selectedTemplate.id);
			templates.splice(index, 1);
			selectedTemplate = templates[0];
			alert('Template deleted');
		} catch (error) {
			alert('Error deleting template');
		}
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
						iframe.style.height = Math.max(300, contentHeight) + "px";
					}
				}, 100);
			}
		}
	}

	onMount(async () => {
		try {
			const res = await fetch('/api/templates');
			const data = await res.json();
			templates = data;
			selectedTemplate = data[0];

			const resFolder = await fetch('/api/folders');
			const dataFolder = await resFolder.json();
			folders = dataFolder;
		} catch (error) {
			console.error('Error loading data:', error);
		}
	});

	$: if (selectedTemplate || newTemplateToSave || newOne) {
		updateIframeContent()
	}

	function handleEditorInput(event: CustomEvent<string>) {
		if (newOne) {
			newTemplateToSave.content = event.detail;
		} else {
			selectedTemplate.content = event.detail;
		}
		updateIframeContent();
	}
</script>

<div class="m-1 relative max-w-xxl bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
	<div class="mb-5 font-bold tracking-tight text-gray-900 border-b-gray-200 shadow dark:text-white origin-center w-full flex justify-center">
		<h1 class="text-3xl font-bold mb-2 p-3">Templates Manager</h1>
	</div>

	<button
		class="py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700"
		on:click={() => goto('/mailing')}
	>
		← Back to Mailing
	</button>

	<button
		class="ml-10 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2"
		on:click={() => goto('/mailing/templates/default')}
	>
		Go to the default templates manager
	</button>

	{#if newOne === false}
		<button
			type="button"
			class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2"
			on:click={newTemplate}
		>
			New Template
		</button>
	{/if}

	<div class="p-5">
		{#if newOne === false}
			<div class="pt-5">
				{#if templates && templates.length > 0}
					<p>
						Please select the template you want to edit :
						<select bind:value={selectedTemplate} on:change={updateIframeContent}>
							{#each templates as template}
								<option value={template}>{template.name}</option>
							{/each}
						</select>
						or
						<button class="text-blue-900 cursor-pointer" on:click={newTemplate}>
							create a new one.</button
						>
					</p>
				{:else}
					<p>
						No templates found you can add one : <button
						class="text-blue-900 cursor-pointer"
						on:click={newTemplate}
					>
						here !</button
					>
					</p>
				{/if}
			</div>
		{/if}

		{#if selectedTemplate && newOne === false}
			<div class="m-10 pt-5 grid grid-cols-1 lg:grid-cols-2 gap-10">
				<div class="border border-gray-500 rounded p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
					<h2 class="text-xl font-bold mb-4">Edit your template</h2>

					<div class="mb-4">
						<button
							class="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2"
							on:click={saveTemplate}
						>
							Save
						</button>
						<button
							class="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2"
							on:click={deleteTemplate}>Delete This Template</button
						>
					</div>

					<div class="mb-4">
						<input
							type="text"
							bind:value={selectedTemplate.name}
							placeholder="Template Name"
							class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					<div class="mb-4">
						<label>
							<input type="checkbox" bind:checked={selectedTemplate.is_default} />
							Set as default template
						</label>
					</div>

					<HtmlEditor bind:content={selectedTemplate.content} on:input={handleEditorInput} />
				</div>

				<div class="border border-gray-500 rounded p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
					<h2 class="text-xl font-bold mb-4">Preview</h2>
					<iframe title="preview" id="preview-iframe" class="w-full h-96 border-0" />
				</div>
			</div>
		{/if}

		{#if newOne === true}
			<div class="m-10 pt-5 grid grid-cols-1 lg:grid-cols-2 gap-10">
				<div class="border border-gray-500 rounded p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
					<h2 class="text-xl font-bold mb-4">Create new template</h2>

					<div class="mb-4">
						<button
							class="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2"
							on:click={saveTemplate}
						>
							Save
						</button>
						<button
							class="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2"
							on:click={() => (newOne = false)}
						>
							Cancel
						</button>
					</div>

					<div class="mb-4">
						<input
							type="text"
							bind:value={newTemplateToSave.name}
							placeholder="Template Name"
							class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					<div class="mb-4">
						<label>
							<input type="checkbox" bind:checked={newTemplateToSave.is_default} />
							Set as default template
						</label>
					</div>

					<HtmlEditor bind:content={newTemplateToSave.content} on:input={handleEditorInput} />
				</div>

				<div class="border border-gray-500 rounded p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
					<h2 class="text-xl font-bold mb-4">Preview</h2>
					<iframe title="preview" id="preview-iframe" class="w-full h-96 border-0" />
				</div>
			</div>
		{/if}
	</div>
</div>