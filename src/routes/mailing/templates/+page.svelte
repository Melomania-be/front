<script lang="ts">
	import type { MailTemplate } from '$lib/types/MailTemplate';
	import { onMount } from 'svelte';
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
		images: []
	};

	function addImages(file: { path: any }) {
		OutputSrc = `<img file=${file.path}/>`;
	}

	async function newTemplate() {
		console.log('New Template');
		newOne = true;
		newTemplateToSave = {
			name: '',
			content: '',
			images: []
		};
	}

	async function saveTemplate() {
		console.log('Save Template');
		if (newOne) {
			if (!newTemplateToSave.name || !newTemplateToSave.content) {
				alert('Please fill all fields');
				return;
			}
			let confirmSave = confirm('Are you sure you want to save this template ?');
			if (!confirmSave) {
				return;
			}
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
		} else {
			if (!selectedTemplate.name || !selectedTemplate.content) {
				alert('Please fill all fields');
				return;
			}
			let confirmSave = confirm('Are you sure you want to save these edits ?');
			if (!confirmSave) {
				return;
			}
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
		alert('Template saved');
	}

	async function deleteTemplate() {
		console.log('delete');
		let confirmDelete = confirm('Are you sure you want to delete this template ?');
		if (!confirmDelete) {
			return;
		}

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
		const resFolder = await fetch('/api/folders');
		const dataFolder = await resFolder.json();
		folders = dataFolder;
	});
</script>

<div
	class="m-1 relative max-w-xxl bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
>
	<div
		class="mb-5 font-bold tracking-tight text-gray-900 border-b-gray-200 shadow dark:text-white origin-center w-full flex justify-center"
	>
		<h1 class="text-3xl font-bold mb-2 p-3">Templates Manager</h1>
	</div>
	<button
		class="
			py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700
			align-center"
		on:click={() => goto('/mailing')}
	>
		<span class="size-3 icon-[line-md--arrow-left]"></span>
		Back to Mailing
	</button>
	<button
		class="ml-10 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
		on:click={() => goto('/mailing/templates/default')}
	>
		Go to the default templates manager
	</button>
	{#if newOne === false}
		<button
			type="button"
			class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
			on:click={newTemplate}
		>
			New Template
		</button>
	{/if}
	<div class="p-5">
		<div class="">
			<h2 class="text-2xl font-bold tracking-tight dark:text-white underline mb-5">
				Select your template and edit it, do not forget to save !
			</h2>
			<p>
				Some fields can be auto-completed in your mails. When sending a template using these fields
				we will ask you to complete them by selecting a project or giving more informations.
				<br />Here is a short list of what's available :
			</p>
			<ul>
				<li>
					<span class="font-bold">&#36;&#123;NAME&#125;</span> : The complete name of the user.
				</li>
				<li>
					<span class="font-bold">&#36;&#123;PROJECT&#125;</span> : The name of the project.
				</li>
				<li>
					<span class="font-bold">&#36;&#123;CALLSHEET&#125;</span> : The url of the callsheet found
					linked with a project (It cannot be from a different project than the one specified when using
					the template).
				</li>
				<li>
					<span class="font-bold">&#36;&#123;REGISTRATION&#125;</span> : The url of the registration
					page linked with a project (It cannot be from a different project than the one specified when
					using the template).
				</li>
				<li>
					<span class="font-bold">&#36;&#123;TO_CONTACT&#125;</span> : The informations of one person
					to contact (The fields to complete when using this template are : First Name, Last Name, Email,
					Phone, Messenger).
				</li>
			</ul>
			<br />
			<p>
				You are not required to use each one of these to fill your template, but if you do use one
				you <span class="font-bold">MUST</span> use the correct syntax (no spaces !) : &#36;&#123;EXAMPLE&#125;
			</p>
		</div>
		{#if newOne === false}
			<div class="pt-5">
				{#if templates && templates.length > 0}
					<p>
						Please select the template you want to edit : <select bind:value={selectedTemplate}>
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
			<div class="m-10 pt-5 grid grid-cols-2 gap-10">
				<div
					class="col-span-1 border border-gray-500 rounded p-5 bg-white dark:bg-gray-800 dark:border-gray-700"
				>
					<div class="justify justify-between">
						<h2 class="text-xl font-bold mb-4">Edit your template</h2>
						<button
							class="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
							on:click={saveTemplate}
						>
							Save
						</button>
						<button
							class="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
							on:click={deleteTemplate}>Delete This Template</button
						>
					</div>
					<div>
						<p>
							To add an image select a folder and click on the name of the image you want to add.
							You can now paste the appropriate line in the html below.
							<br />
							The image cannot appear in the preview but will be sent in the mail.
						</p>
						<br />
						{#if folders && folders.length > 0}
							<p>
								Select your folder : <select bind:value={selectedFolder}>
									{#each folders as folder}
										<option value={folder}>{folder.name}</option>
									{/each}
								</select>
							</p>
						{:else}
							<p>No folders found</p>
						{/if}
					</div>
					{#if selectedFolder && selectedFolder.files && selectedFolder.files.length > 0}
						<div>
							<p>Images in the folder :</p>
							{#each selectedFolder.files as file}
								{#if file.type === 'image'}
									<button
										class="text-blue-900 cursor-pointer"
										on:click={() => {
											addImages(file);
											const imageEmbedCode = OutputSrc;
											navigator.clipboard.writeText(imageEmbedCode);
											alert('Image link copied to clipboard');
										}}
									>
										{file.name}
									</button>
									<br />
								{/if}
							{/each}
						</div>
					{/if}
					<div class="mb-4">
						<input
							type="text"
							bind:value={selectedTemplate.name}
							placeholder="Template Name"
							class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
						/>
					</div>
					<HtmlEditor bind:content={selectedTemplate.content} />
				</div>
				<div
					class="col-span-1 border border-gray-500 rounded p-5 bg-white dark:bg-gray-800 dark:border-gray-700"
				>
					<h2 class="text-xl font-bold mb-4">Preview</h2>
					<div class="p-4 bg-gray-100 rounded dark:bg-gray-900" style="min-height: 200px;">
						{@html selectedTemplate.content}
					</div>
				</div>
			</div>
		{/if}
	</div>
	{#if newOne === true}
		<div class="m-10 pt-5 grid grid-cols-2 gap-10">
			<div
				class="col-span-1 border border-gray-500 rounded p-5 bg-white dark:bg-gray-800 dark:border-gray-700"
			>
				<div class="justify justify-between">
					<h2 class="text-xl font-bold mb-4">Edit your template</h2>
					<button
						class="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
						on:click={saveTemplate}
					>
						Save
					</button>
					<button
						class="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
						on:click={() => (newOne = false)}
					>
						Cancel
					</button>
				</div>
				<div>
					<p>
						To add an image select a folder and click on the name of the image you want to add. You
						can now paste the appropriate line in the html below.
						<br />
						The image cannot appear in the preview but will be sent in the mail.
					</p>
					<br />
					{#if folders && folders.length > 0}
						<p>
							Select your folder : <select bind:value={selectedFolder}>
								{#each folders as folder}
									<option value={folder}>{folder.name}</option>
								{/each}
							</select>
						</p>
					{:else}
						<p>No folders found</p>
					{/if}
				</div>
				{#if selectedFolder && selectedFolder.files && selectedFolder.files.length > 0}
					<div>
						<p>Images in the folder :</p>
						{#each selectedFolder.files as file}
							{#if file.type === 'image'}
								<button
									class="text-blue-900 cursor-pointer"
									on:click={() => {
										addImages(file);
										const imageEmbedCode = OutputSrc;
										navigator.clipboard.writeText(imageEmbedCode);
										alert('Image link copied to clipboard');
									}}
								>
									{file.name}
								</button>
								<br />
							{/if}
						{/each}
					</div>
				{/if}
				<div class="mb-4">
					<input
						type="text"
						bind:value={newTemplateToSave.name}
						placeholder="Template Name"
						class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
					/>
				</div>
				<HtmlEditor bind:content={newTemplateToSave.content} />
			</div>
			<div
				class="col-span-1 border border-gray-500 rounded p-5 bg-white dark:bg-gray-800 dark:border-gray-700"
			>
				<h2 class="text-xl font-bold mb-4">Preview</h2>
				<div class="p-4 bg-gray-100 rounded dark:bg-gray-900" style="min-height: 200px;">
					{@html newTemplateToSave.content}
				</div>
			</div>
		</div>
	{/if}
</div>
