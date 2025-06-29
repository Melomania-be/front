<script lang="ts">
	import { goto } from '$app/navigation';
	import type { MailTemplate } from '$lib/types/MailTemplate';
	import { onMount, tick } from 'svelte';
	import HtmlEditor from '../../HtmlEditor.svelte';

	let selectedTemplate: MailTemplate;
	let templates: Array<MailTemplate> = [];

	onMount(async () => {
		try {
			const res = await fetch('/api/templates/default');
			templates = await res.json();
		} catch (error) {
			console.error('Error fetching templates:', error);
		}
	});

	const saveTemplate = async () => {
		let saveConfirm = confirm('Are you sure you want to save the changes ?');
		if (!saveConfirm) {
			return;
		}

		const data = {
			id: selectedTemplate.id,
			name: selectedTemplate.name,
			content: selectedTemplate.content
		};

		try {
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
		} catch (error) {
			console.error('Error saving template:', error);
			alert('Network error occurred');
		}
	};

	async function updateIframeContent() {
		if (typeof window !== 'undefined') {
			await tick();

			const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
			if (iframe && iframe.contentWindow) {
				const doc = iframe.contentDocument || iframe.contentWindow?.document;
				if (doc) {
					const content = selectedTemplate?.content || '';

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

	$: if (selectedTemplate) {
		updateIframeContent()
	}

	function handleEditorInput(event: CustomEvent<string>) {
		selectedTemplate.content = event.detail;
		updateIframeContent();
	}
</script>

<div class="m-1 relative max-w-xxl bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
	<div class="mb-5 font-bold tracking-tight text-gray-900 border-b-gray-200 shadow dark:text-white origin-center w-full flex justify-center">
		<h1 class="text-3xl font-bold mb-2 p-3">Default Templates</h1>
	</div>

	<button
		class="py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700"
		on:click={() => goto('/mailing/templates')}
	>
		← Back to Template Manager
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
		<ul class="space-y-2">
			<li>
				<span class="font-bold"> - Callsheet Notification</span> : sent to participants when you
				want to notify them about changes on a callsheet.
				<br><span class="text-sm text-gray-600 dark:text-gray-400">(Parameters : &#36;&#123;NAME&#125; ; &#36;&#123;PROJECT&#125; ; &#36;&#123;CALLSHEET&#125; ; &#36;&#123;TO_CONTACT&#125;)</span>
			</li>
			<li>
				<span class="font-bold"> - Recruitment Notification </span>: sent to all contacts (validated
				and subscribed to emails) when you want to make them know there is a new project they can
				apply to.
				<br><span class="text-sm text-gray-600 dark:text-gray-400">(Parameters : &#36;&#123;NAME&#125; ; &#36;&#123;PROJECT&#125; ; &#36;&#123;REGISTRATION&#125; ; &#36;&#123;TO_CONTACT&#125;)</span>
			</li>
			<li>
				<span class="font-bold"> - Participation Validation Notification</span> : sent to a contact
				when they are validated to participate in a project.
				<br><span class="text-sm text-gray-600 dark:text-gray-400">(Parameters : &#36;&#123;NAME&#125; ; &#36;&#123;PROJECT&#125; ; &#36;&#123;CALLSHEET&#125; ; &#36;&#123;TO_CONTACT&#125;)</span>
			</li>
			<li>
				<span class="font-bold"> - Recommended Notification</span> : sent to someone that has been
				recommended to propose them to apply to a project.
				<br><span class="text-sm text-gray-600 dark:text-gray-400">(Parameters : &#36;&#123;NAME&#125; ; &#36;&#123;REGISTRATION&#125; ; &#36;&#123;TO_CONTACT&#125;)</span>
			</li>
			<li>
				<span class="font-bold"> - Audition Request</span> : sent to invite a participant to take an audition with sheet music.
				<br><span class="text-sm text-gray-600 dark:text-gray-400">(Parameters : &#36;&#123;NAME&#125; ; &#36;&#123;PROJECT&#125; ; &#36;&#123;REGISTRATION&#125; ; &#36;&#123;TO_CONTACT&#125; ; &#36;&#123;AUDITION_INSTRUCTIONS&#125; ; &#36;&#123;ATTACHMENTS_SECTION&#125; ; &#36;&#123;DEADLINE_BLOCK&#125;)</span>
			</li>
		</ul>
		<p class="mt-5 text-sm">
			You can edit them by selecting the template you want to modify and then saving the edits.
			Please note that these changes are <strong>permanent</strong> and you cannot revert back to a previous version.
			To avoid any incident we recommend using the same parameters as in the initial ones.
			<br><br>
			<strong>Note:</strong> The Audition Request template includes additional dynamic variables for specific audition content (instructions, attachments, deadline).
		</p>
	</div>

	{#if templates && templates.length > 0}
		<div class="ml-10 mt-10">
			Select the template :
			<select bind:value={selectedTemplate} on:change={updateIframeContent} class="ml-2 p-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
				<option value={undefined}>-- Choose a template --</option>
				{#each templates as template}
					<option value={template}>{template.name}</option>
				{/each}
			</select>
		</div>

		{#if selectedTemplate}
			<div class="m-10 pt-5 grid grid-cols-1 lg:grid-cols-2 gap-10">
				<div class="border border-gray-500 rounded p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
					<h2 class="text-xl font-bold mb-4">Edit your template</h2>

					<button
						class="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2"
						on:click={saveTemplate}
					>
						Save Changes
					</button>

					<div class="mb-4 text-lg font-bold tracking-tight dark:text-white">
						Name : {selectedTemplate.name}
					</div>

					<HtmlEditor bind:content={selectedTemplate.content} on:input={handleEditorInput} />
				</div>

				<div class="border border-gray-500 rounded p-5 bg-white dark:bg-gray-800 dark:border-gray-700">
					<h2 class="text-xl font-bold mb-4">Preview</h2>
					<iframe title="preview" id="preview-iframe" class="w-full h-96 border-0" />
				</div>
			</div>
		{/if}
	{:else}
		<div class="ml-10 mt-10">
			<p>Loading templates...</p>
		</div>
	{/if}
</div>