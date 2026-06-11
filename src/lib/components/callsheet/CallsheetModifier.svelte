<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Callsheet } from '$lib/types/Callsheet';
	import { onMount } from 'svelte';
	import CallsheetShow from './CallsheetShow.svelte';

	export let callsheet: Callsheet;
	export let mode: 'modify' | 'create';

	let allowModification = mode === 'modify' ? false : true;

	async function saveCallsheet() {
		const tmpCallsheet = {
			id: callsheet.id,
			project_id: callsheet.projectId,
			version: callsheet.version,
			contents: callsheet.contents.map((content, index) => {
				return {
					id: content.id,
					title: content.title,
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
			alert('Callsheet saved');
			goto(`/projects/${callsheet.projectId}/management/callsheets`);
		}
	}

	onMount(async () => {
		await fetch(`/api/folders`);
		callsheet.contents = callsheet.contents.map((content, index) => ({
			...content,
			order: content.order ?? index,
			position: content.position ?? 'below'
		}));
	});

	async function deleteCallsheet() {
		let confirmDelete = confirm('Are you sure you want to delete this callsheet ?');
		if (!confirmDelete) return;

		const response = await fetch(
			`/api/projects/${callsheet.projectId}/management/callsheets/${callsheet.id}`,
			{ method: 'DELETE' }
		);

		if (response.ok) {
			goto(`/projects/${callsheet.projectId}/management/callsheets`);
		}
	}

	function moveUp(index: number) {
		if (index === 0) return;
		const contents = [...callsheet.contents];
		[contents[index - 1], contents[index]] = [contents[index], contents[index - 1]];
		contents.forEach((c, i) => (c.order = i));
		callsheet.contents = contents;
	}

	function moveDown(index: number) {
		if (index === callsheet.contents.length - 1) return;
		const contents = [...callsheet.contents];
		[contents[index], contents[index + 1]] = [contents[index + 1], contents[index]];
		contents.forEach((c, i) => (c.order = i));
		callsheet.contents = contents;
	}
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
	{#if callsheet}
		<div class="m-1 relative max-w-xxl bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
			{#if mode === 'modify'}
				<div class="absolute top-0 right-0 p-1">
					<button
						on:click={() => (allowModification = !allowModification)}
						class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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

				<div>
					<h2 class="text-lg">Version :</h2>
					<input
						class="border border-gray-100"
						type="text"
						placeholder="Version"
						bind:value={callsheet.version}
						disabled={!allowModification}
					/>
				</div>

				{#if callsheet.id}
					<div>
						<a class="text-blue-600" href="/call_sheets/{callsheet.projectId}/-1">
							<h2 class="text-lg">Link to callsheet</h2>
						</a>
					</div>
				{/if}

				<div class="mb-5">
					<h2 class="text-lg">Contents :</h2>
					{#if allowModification}
						<button
							class="bg-rose-500 text-white p-2 rounded m-1"
							on:click={() => {
								callsheet.contents.push({
									title: '',
									text: '',
									callsheet_id: 0,
									id: null,
									order: callsheet.contents.length,
									position: 'below',
									createdAt: new Date(),
									updatedAt: new Date()
								});
								callsheet = callsheet;
							}}
						>
							Add content
						</button>
					{/if}
					<div>
						{#if callsheet.contents && callsheet.contents.length > 0}
							{#each callsheet.contents as content, index}
								<div class="grid grid-cols-1 gap-1 border border-gray-200 rounded p-2 mb-2">
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
													class="m-1 flex items-center justify-center"
													on:click={() => {
														callsheet.contents = callsheet.contents.filter(
															(c) => c.title !== content.title || c.text !== content.text
														);
														callsheet = callsheet;
													}}
												>
													<span class="icon-[tabler--trash]" style="width: 1.2rem; height: 1.2rem; color: black;"></span>
												</button>
											</div>
										{/if}
									</div>
									<div class="flex items-center justify-center">
										<input
											class="border border-gray-100 flex-1"
											type="text"
											placeholder="Title"
											bind:value={content.title}
											disabled={!allowModification}
										/>
									</div>
									<textarea
										class="border border-gray-100"
										placeholder="Html content"
										bind:value={content.text}
										disabled={!allowModification}
									></textarea>
								</div>
							{/each}
						{/if}
					</div>
				</div>
				{#if allowModification}
					<div class="flex justify-end">
						<button
							on:click={saveCallsheet}
							class="mr-5 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
						>
							Save callsheet
						</button>
						{#if mode == 'modify'}
							<button
								on:click={deleteCallsheet}
								class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
							>
								Delete callsheet
							</button>
						{/if}
					</div>
				{/if}
			</div>
		</div>
		<CallsheetShow {callsheet} />
	{/if}
</div>