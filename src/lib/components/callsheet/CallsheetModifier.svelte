<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Callsheet } from '$lib/types/Callsheet';
	import { onMount } from 'svelte';
	import CallsheetShow from './CallsheetShow.svelte';
	import RichTextEditor from './RichTextEditor.svelte'

	export let callsheet: Callsheet | null = null;
	export let mode: 'modify' | 'create';

	let allowModification = mode === 'modify' ? false : true;
	let isLoading = false;
	let errorMessage = '';
	let successMessage = '';
	let loadingError = '';
	let callsheetLoaded = false;

	$: if (callsheet && !callsheet.contents) {
		callsheet.contents = [];
	}

	let contentIdCounter = Math.max(...(callsheet?.contents?.map(c => c.id || 0) || [0])) + 1;

	function validateCallsheet() {
		const errors = [];

		if (!callsheet) {
			errors.push('Callsheet not loaded');
			return errors;
		}

		if (!callsheet.version || callsheet.version.trim() === '') {
			errors.push('Version is required');
		} else if (callsheet.version.length > 255) {
			errors.push('Version cannot exceed 255 characters');
		}

		if (!callsheet.contents || callsheet.contents.length === 0) {
			errors.push('At least one content block is required');
		} else {
			const emptyTitles = callsheet.contents.filter(content => !content.title || content.title.trim() === '');
			if (emptyTitles.length > 0) {
				errors.push('All content blocks must have a title');
			}
		}

		return errors;
	}

	async function saveCallsheet() {
		if (!callsheet) {
			errorMessage = 'Callsheet not available';
			return;
		}

		errorMessage = '';
		successMessage = '';

		const validationErrors = validateCallsheet();
		if (validationErrors.length > 0) {
			errorMessage = validationErrors.join(', ');
			return;
		}

		isLoading = true;

		try {
			const tmpCallsheet = {
				id: callsheet.id,
				project_id: callsheet.projectId,
				version: callsheet.version.trim(),
				contents: (callsheet.contents || []).map((content, index) => {
					return {
						id: content.id,
						title: content.title.trim(),
						text: content.text,
						order: content.order ?? index,
						position: content.position ?? 'below'
					};
				})
			};

			const response = await fetch(`/api/projects/${callsheet.projectId}/management/callsheets`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(tmpCallsheet)
			});

			if (response.ok) {
				successMessage = 'Callsheet saved successfully!';
				setTimeout(() => {
					goto(`/projects/${callsheet.projectId}/management/callsheets`);
				}, 1500);
			} else {
				const errorData = await response.json().catch(() => null);
				if (errorData && errorData.message) {
					errorMessage = `Server error: ${errorData.message}`;
				} else {
					errorMessage = `Error ${response.status}: Unable to save the callsheet`;
				}
			}
		} catch (error) {
			console.error('Error saving callsheet:', error);
			errorMessage = 'Connection error. Please check your internet connection.';
		} finally {
			isLoading = false;
		}
	}

	async function loadCallsheet(projectId: string, callsheetId: string) {
		try {
			loadingError = '';
			const response = await fetch(`/api/projects/${projectId}/management/callsheets/${callsheetId}`);

			if (!response.ok) {
				if (response.status === 404) {
					loadingError = 'Callsheet not found';
				} else if (response.status === 500) {
					loadingError = 'Server error. Please check the server logs.';
				} else {
					loadingError = `Error ${response.status}: ${response.statusText}`;
				}
				return null;
			}

			const data = await response.json();
			callsheetLoaded = true;
			return data;
		} catch (error) {
			console.error('Error loading callsheet:', error);
			loadingError = 'Connection error';
			return null;
		}
	}

	onMount(async () => {
		try {
			await fetch(`/api/folders`);
		} catch (error) {
			console.warn('Error loading folders:', error);
		}

		if (callsheet?.contents) {
			callsheet.contents = callsheet.contents.map((content, index) => ({
				...content,
				order: content.order ?? index,
				position: content.position ?? 'below'
			}));
		}
	});

	async function deleteCallsheet() {
		if (!callsheet) {
			errorMessage = 'Callsheet not available';
			return;
		}

		let confirmDelete = confirm('Are you sure you want to delete this callsheet?');
		if (!confirmDelete) return;

		isLoading = true;
		errorMessage = '';

		try {
			const response = await fetch(
				`/api/projects/${callsheet.projectId}/management/callsheets/${callsheet.id}`,
				{ method: 'DELETE' }
			);

			if (response.ok) {
				successMessage = 'Callsheet deleted successfully!';
				setTimeout(() => {
					goto(`/projects/${callsheet.projectId}/management/callsheets`);
				}, 1000);
			} else {
				errorMessage = `Error ${response.status}: Unable to delete the callsheet`;
			}
		} catch (error) {
			console.error('Error deleting callsheet:', error);
			errorMessage = 'Connection error while deleting.';
		} finally {
			isLoading = false;
		}
	}

	function isFieldValid(field: string) {
		return field && field.trim() !== '';
	}

	function removeContent(contentToRemove: any) {
		if (!callsheet || !callsheet.contents) return;

		const confirmDelete = confirm('Are you sure you want to delete this block?');
		if (!confirmDelete) return;

		callsheet.contents = callsheet.contents.filter(content => content !== contentToRemove);
		callsheet = callsheet;
	}

	function addNewContent() {
		if (!callsheet) return;

		if (!callsheet.contents) {
			callsheet.contents = [];
		}

		const newContent = {
			title: '',
			text: '',
			callsheet_id: 0,
			id: contentIdCounter++,
			order: callsheet.contents.length,
			position: 'below',
			createdAt: new Date(),
			updatedAt: new Date()
		};
		callsheet.contents.push(newContent);
		callsheet = callsheet;
	}

	function moveUp(index: number) {
		if (!callsheet || index === 0) return;
		const contents = [...callsheet.contents];
		[contents[index - 1], contents[index]] = [contents[index], contents[index - 1]];
		contents.forEach((c, i) => (c.order = i));
		callsheet.contents = contents;
	}

	function moveDown(index: number) {
		if (!callsheet || index === callsheet.contents.length - 1) return;
		const contents = [...callsheet.contents];
		[contents[index], contents[index + 1]] = [contents[index + 1], contents[index]];
		contents.forEach((c, i) => (c.order = i));
		callsheet.contents = contents;
	}
</script>

{#if loadingError}
	<div class="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded dark:bg-red-900 dark:border-red-600 dark:text-red-300">
		<div class="flex items-center gap-2">
			<span class="icon-[tabler--alert-circle]" style="width: 1.5rem; height: 1.5rem;"></span>
			<div>
				<h3 class="font-semibold">Loading error</h3>
				<p>{loadingError}</p>
				<button
					on:click={() => window.location.reload()}
					class="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
				>
					Reload page
				</button>
			</div>
		</div>
	</div>
{/if}

<div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 min-h-screen bg-[#E7E7E7]">
	{#if callsheet}
		<div class="m-1 relative max-w-xxl bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
			{#if mode === 'modify'}
				<div class="absolute top-0 right-0 p-1">
					<button
						on:click={() => (allowModification = !allowModification)}
						class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
						disabled={isLoading}
						aria-label="Toggle modification"
					>
						{#if !allowModification}
							<span class="icon-[tabler--edit]" style="width: 1.2rem; height: 1.2rem; color: black;"></span>
						{:else}
							Stop editing
						{/if}
					</button>
				</div>
			{/if}

			<div class="m-1">
				<h1 class="text-2xl font-bold">Callsheet</h1>

				{#if errorMessage}
					<div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded dark:bg-red-900 dark:border-red-600 dark:text-red-300">
						<div class="flex items-center gap-2">
							<span class="icon-[tabler--alert-circle]" style="width: 1.2rem; height: 1.2rem;"></span>
							{errorMessage}
						</div>
					</div>
				{/if}

				{#if successMessage}
					<div class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded dark:bg-green-900 dark:border-green-600 dark:text-green-300">
						<div class="flex items-center gap-2">
							<span class="icon-[tabler--check]" style="width: 1.2rem; height: 1.2rem;"></span>
							{successMessage}
						</div>
					</div>
				{/if}

				<div class="mb-4">
					<label for="version-input" class="block text-lg font-medium mb-2">
						Version <span class="text-red-500">*</span>
					</label>
					<input
						id="version-input"
						class={`border rounded px-3 py-2 w-full ${
							allowModification && !isFieldValid(callsheet.version)
								? 'border-red-400 bg-red-50 dark:bg-red-900 dark:border-red-600'
								: 'border-gray-300 dark:border-gray-600'
						} ${!allowModification ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}`}
						type="text"
						placeholder="Enter version (e.g. 1.0, v2.1, etc.)"
						bind:value={callsheet.version}
						disabled={!allowModification || isLoading}
					/>
					{#if allowModification && !isFieldValid(callsheet.version)}
						<p class="text-red-500 text-sm mt-1">Version is required</p>
					{/if}
				</div>

				{#if callsheet.id}
					<div class="mb-4">
						<a class="text-blue-600 hover:text-blue-800 dark:text-blue-400" href="/call_sheets/{callsheet.projectId}/-1">
							<h2 class="text-lg flex items-center gap-2">
								<span class="icon-[tabler--external-link]" style="width: 1rem; height: 1rem;"></span>
								Link to the callsheet
							</h2>
						</a>
					</div>
				{/if}

				<div class="mb-5">
					<h2 class="text-lg font-medium mb-2">
						Contents <span class="text-red-500">*</span>
					</h2>
					{#if allowModification}
						<button
							class="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded m-1 disabled:opacity-50"
							disabled={isLoading}
							on:click={addNewContent}
							aria-label="Add new content"
						>
							<span class="flex items-center gap-2">
								<span class="icon-[tabler--plus]" style="width: 1rem; height: 1rem;"></span>
								Add content
							</span>
						</button>
					{/if}
					<div>
						{#if callsheet.contents && callsheet.contents.length > 0}
							{#each callsheet.contents as content, index (content.id || content)}
								<div class="grid grid-cols-1 gap-1 mb-4 p-3 border rounded-lg bg-gray-50 dark:bg-gray-700">
									<div class="flex items-center justify-between mb-1">
										<span class="text-sm text-gray-500 font-semibold">Block {index + 1}</span>
										{#if allowModification}
											<div class="flex items-center gap-2">
												<select
													class="border border-gray-300 rounded text-sm p-1"
													bind:value={content.position}
												>
													<option value="above">Above program & events</option>
													<option value="below">Below program & events</option>
												</select>
												<button
													class="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
													on:click={() => moveUp(index)}
													disabled={index === 0}
												>
													▲
												</button>
												<button
													class="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
													on:click={() => moveDown(index)}
													disabled={index === callsheet.contents.length - 1}
												>
													▼
												</button>
												<button
													class="m-1 p-2 text-red-500 hover:text-red-700 disabled:opacity-50"
													disabled={isLoading}
													on:click={() => removeContent(content)}
													aria-label="Delete this content"
												>
													<span class="icon-[tabler--trash]" style="width: 1.2rem; height: 1.2rem;"></span>
												</button>
											</div>
										{/if}
									</div>
									<div class="flex items-center justify-center">
										<label for="content-title-{content.id}" class="sr-only">Content title</label>
										<input
											id="content-title-{content.id}"
											class={`border rounded px-3 py-2 flex-1 ${
												allowModification && !isFieldValid(content.title)
													? 'border-red-400 bg-red-50 dark:bg-red-900'
													: 'border-gray-300 dark:border-gray-600'
											} ${!allowModification ? 'bg-gray-100 dark:bg-gray-600' : 'bg-white dark:bg-gray-800'}`}
											type="text"
											placeholder="Content title *"
											bind:value={content.title}
											disabled={!allowModification || isLoading}
										/>
									</div>
									{#if allowModification && !isFieldValid(content.title)}
										<p class="text-red-500 text-sm">Title is required</p>
									{/if}
									{#if allowModification}
										<RichTextEditor
											value={content.text}
											onChange={(v) => content.text = v}
										/>
									{:else}
										<div class="prose dark:prose-invert max-w-none">{@html content.text}</div>
									{/if}
								</div>
							{/each}
						{:else if allowModification}
							<p class="text-gray-500 italic p-4 text-center border-2 border-dashed rounded-lg">
								No content added yet. Click "Add content" to get started.
							</p>
						{/if}
					</div>
				</div>

				{#if allowModification}
					<div class="flex justify-end gap-3">
						<button
							on:click={saveCallsheet}
							disabled={isLoading}
							class="bg-blue-500 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded flex items-center gap-2"
						>
							{#if isLoading}
								<span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
							{:else}
								<span class="icon-[tabler--device-floppy]" style="width: 1rem; height: 1rem;"></span>
							{/if}
							{isLoading ? 'Saving...' : 'Save'}
						</button>
						{#if mode == 'modify'}
							<button
								on:click={deleteCallsheet}
								disabled={isLoading}
								class="bg-red-500 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded flex items-center gap-2"
							>
								{#if isLoading}
									<span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
								{:else}
									<span class="icon-[tabler--trash]" style="width: 1rem; height: 1rem;"></span>
								{/if}
								{isLoading ? 'Deleting...' : 'Delete'}
							</button>
						{/if}
					</div>
				{/if}
			</div>
		</div>
		<CallsheetShow {callsheet} />
	{:else}
		<div class="flex justify-center items-center h-64 col-span-full">
			<div class="text-center">
				<div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
				<p class="text-gray-600 dark:text-gray-400">Loading callsheet...</p>
				<p class="text-sm text-gray-500 dark:text-gray-500 mt-2">
					If loading takes too long, check your connection or reload the page.
				</p>
			</div>
		</div>
	{/if}
</div>