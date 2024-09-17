<script lang="ts">
	import { goto } from '$app/navigation';
	import type { MailTemplate } from '$lib/types/MailTemplate';
	import { onMount, tick } from 'svelte';
	import HtmlEditor from '../../HtmlEditor.svelte';

	let selectedTemplate: MailTemplate;
	let templates: Array<MailTemplate> = [];

	onMount(async () => {
		const res = await fetch('/api/templates/default');
		templates = await res.json();
	});

	const saveTemplate = async () => {
		let saveConfirm = confirm('Are you sure you want to save the changes ?');
		if (!saveConfirm) {
			return;
		}

		const data = {
			name: selectedTemplate.name,
			content: selectedTemplate.content
		};

		const res = await fetch(`/api/templates/default`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		});

		if (res.ok) {
			alert('Template saved');
		} else {
			alert('An error occurred');
		}
	};

	async function updateIframeContent() {
		await tick() // Wait for Preview to load

		const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
		if (iframe && iframe.contentWindow) {
			const doc = iframe.contentDocument || iframe.contentWindow?.document;
			if (doc) {
				doc.open();
				// Wrap the user content in a full HTML document
				doc.write(`
					<!DOCTYPE html>
					<html lang="en">
					<head>
						<meta charset="UTF-8">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
						<style>
							/* Reset styles to prevent conflicts with user styles */
							body {
								margin: 0;
								padding: 0;
								font-family: Arial, sans-serif;
							}
						</style>
					</head>
					<body>
						${selectedTemplate.content}
					</body>
					</html>
				`);
				doc.close();
			}

			const contentHeight = doc.body.scrollHeight
			console.log(contentHeight)
			iframe.style.height = contentHeight + "px"
		}
		else {
			console.log("iframe not loaded")
		}
	}

    $: if (selectedTemplate) {
        updateIframeContent()
    }

    function handleEditorInput(event: CustomEvent<string>) {
        selectedTemplate.content = event.detail;
        updateIframeContent();
    }
</script>

<div
	class="m-1 relative max-w-xxl bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
>
	<div
		class="mb-5 font-bold tracking-tight text-gray-900 border-b-gray-200 shadow dark:text-white origin-center w-full flex justify-center"
	>
		<h1 class="text-3xl font-bold mb-2 p-3">Default Templates</h1>
	</div>

	<button
		class="
			py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700
			align-center"
		on:click={() => goto('/mailing/templates')}
	>
		<span class="size-3 icon-[line-md--arrow-left]"></span>
		Back to Template Manager
	</button>

	<div class="ml-10">
		<h2 class="text-lg font-bold tracking-tight dark:text-white underline">
			What are default templates ?
		</h2>
		<br />
		<p>
			They are the templates sent automatically or when you do a specific action. They are stored in
			a different way than classic templates and cannot be deleted.
		</p>
		<ul>
			<li>
				<span class="font-bold"> - Callsheet Notification</span> : sent to participants when you
				want to notify them about changes on a callsheet.
				<br /> (Parameters : &#36;&#123;NAME&#125; ; &#36;&#123;PROJECT&#125; ; &#36;&#123;CALLSHEET&#125;
				; &#36;&#123;TO_CONTACT&#125;)
			</li>
			<li>
				<span class="font-bold"> - Recruitment Notification </span>: sent to all contacts (validated
				and subscribed to emails) when you want to make them know there is a new project they can
				apply to.
				<br /> (Parameters : &#36;&#123;NAME&#125; ; &#36;&#123;PROJECT&#125; ; &#36;&#123;REGISTRATION&#125;
				; &#36;&#123;TO_CONTACT&#125;)
			</li>
			<li>
				<span class="font-bold"> - Participation Validation Notification</span> : sent to a contact
				when they are validated to participate in a project.
				<br /> (Parameters : &#36;&#123;NAME&#125; ; &#36;&#123;PROJECT&#125; ; &#36;&#123;CALLSHEET&#125;
				; &#36;&#123;TO_CONTACT&#125;)
			</li>
			<li>
				<span class="font-bold"> - Recommended Notification</span> : sent to someone that has been
				recommended to propose them to apply to a project.
				<br /> (Parameters : &#36;&#123;NAME&#125; ; &#36;&#123;REGISTRATION&#125; ; &#36;&#123;TO_CONTACT&#125;)
			</li>
		</ul>
		<p class="mt-5">
			You can edit them by selecting the template you want to modify and then saving the edits.
			Please note that these changes are permanent and you cannot revert back to a previous version. <br
			/> To avoid any incident we recommend using the same parameters as in the initial ones.
		</p>
	</div>
	<div class="ml-10 mt-10">
		Select the template : 
		<select bind:value={selectedTemplate} on:change={updateIframeContent}>
			{#each templates as template}
				<option value={template}>{template.name}</option>
			{/each}
		</select>
	</div>

	{#if selectedTemplate}
		<div class="m-10 pt-5 grid-container">
			<div
				class="col-span-1 border border-gray-500 rounded p-5 bg-white dark:bg-gray-800 dark:border-gray-700"
			>
				<h2 class="text-xl font-bold mb-4">Edit your template</h2>
				<button
					class="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
					on:click={saveTemplate}
				>
					Save Changes
				</button>

				<div class="mb-4 text-lg font-bold tracking-tight dark:text-white">
					Name : {selectedTemplate.name}
				</div>
				<HtmlEditor bind:content={selectedTemplate.content} on:input={handleEditorInput} />
			</div>
			<div
				class="col-span-1 border border-gray-500 rounded p-5 bg-white dark:bg-gray-800 dark:border-gray-700 flex flex-col h-full"
			>
				<h2 class="text-xl font-bold mb-4">Preview</h2>
				<iframe title="preview" id="preview-iframe" class="w-full h-full border-0" />
			</div>
		</div>
	{/if}
</div>

<style>
    .grid-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
    }

    @media (max-width: 1050px) {
        .grid-container {
            grid-template-columns: 1fr;
			margin: 0.5rem;
        }
    }
</style>