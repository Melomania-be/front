<script lang="ts">
	import type { MailTemplate } from '$lib/types/MailTemplate';
	import { onMount } from 'svelte';
	import HtmlEditor from '../HtmlEditor.svelte';
	import { goto } from '$app/navigation';

	let selectedTemplate: MailTemplate = {
		id: null,
		name: '',
		content: '',
		createdAt: '',
		updatedAt: ''
	};

	let templates: MailTemplate[] = [];
	let editing = false;
	let newOne = false;

	async function newTemplate() {
		console.log('New Template');
		selectedTemplate = {
			id: null,
			name: '',
			content: null,
			createdAt: '',
			updatedAt: ''
		};
		editing = true;
		newOne = true;
	}

	async function saveTemplate() {
		console.log('Save Template');
		if (newOne) {
			const res = await fetch('/api/templates', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(selectedTemplate)
			});
			const data = await res.json();
			templates.push(data);
			selectedTemplate = data;
			newOne = false;
		} else {
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
		}
		editing = false;
	}

	async function cancelEdit() {
		console.log('Cancel Edit');
		selectedTemplate = templates[0];
		editing = false;
		newOne = false;
	}

	async function deleteTemplate() {
		console.log('delete');
		console.log('selectedTemplate', selectedTemplate);
		const res = await fetch(`/api/templates/${selectedTemplate.id}`, {
			method: 'DELETE'
		});

		const index = templates.findIndex((template) => template.id === selectedTemplate.id);
		templates.splice(index, 1);
		selectedTemplate = templates[0];
		alert('Template deleted');
	}

	onMount(async () => {
		const res = await fetch('/api/templates');
		const data = await res.json();
		templates = data;
		selectedTemplate = data[0];
	});
</script>

<div class="m-2">
	<button
		class="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
		on:click={() => goto('/mailing')}>Mailing</button
	>
	<br />
	<br />
	<h1 class="col-span-2">Templates</h1>
	{#if editing && newOne === true}
		<button
			class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
			on:click={saveTemplate}>Save</button
		>
		<button
			class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
			on:click={cancelEdit}>Cancel</button
		>

		<div class="m-2">
			<input
				type="text"
				bind:value={selectedTemplate.name}
				placeholder="Template Name"
				class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
			/>
		</div>
		<div class="m-2">
			<textarea
				id="message"
				rows="4"
				class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
				placeholder="Write your html here..."
				bind:value={selectedTemplate.content}
			></textarea>
		</div>
	{:else if editing && newOne === false}
		<button
			class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
			on:click={saveTemplate}>Save</button
		>
		<button
			class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
			on:click={cancelEdit}>Cancel</button
		>

		<div class="m-2">
			<input
				type="text"
				bind:value={selectedTemplate.name}
				placeholder="Template Name"
				class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
			/>
		</div>
		<div class="m-2">
			<textarea
				id="message"
				rows="4"
				class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
				placeholder="Write your html here..."
				bind:value={selectedTemplate.content}
			></textarea>
		</div>
	{:else if !editing}
		<button
			class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
			on:click={newTemplate}>New Template</button
		>
		<p class="m-2">Template visualizer</p>
		<div>
			{#if templates && templates.length > 0}
				<select bind:value={selectedTemplate}>
					{#each templates as template}
						<option value={template}>{template.name}</option>
					{/each}
				</select>
				<button
					class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
					on:click={deleteTemplate}>Delete</button
				>
				<button
					class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
					on:click={() => (editing = true)}>Edit</button
				>
			{:else}
				<p>No templates found</p>
			{/if}
		</div>
		<div class="grid grid-cols-2">
			{#if selectedTemplate}
				<h1 class="col-span-2">{selectedTemplate.name}</h1>
				<div class="m-2">
					<HtmlEditor bind:content={selectedTemplate.content} />
				</div>
				<div class="m-2 border border-gray-500 rounded">
					{@html selectedTemplate.content}
				</div>
			{/if}
		</div>
	{/if}
</div>
