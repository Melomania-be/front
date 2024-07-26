<script lang="ts">
	import type { Project } from '$lib/types/Project';

	export let project: Project;

	let mode: 'folder' | 'concerts' = 'folder';
</script>

<div class="w-full bg-white border border-black shadow dark:bg-gray-800 dark:border-gray-700">
	<div class="sm:hidden">
		<label for="tabs" class="sr-only">Select tab</label>
		<select
			bind:value={mode}
			id="tabs"
			class="bg-gray-50 border-0 border-b border-gray-200 text-gray-900 text-sm rounded-t-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
		>
			<option value="folder">folder</option>
		</select>
	</div>

	<ul
		class="hidden sm:flex text-sm font-medium text-center text-gray-500 dark:divide-gray-600 dark:text-gray-400"
	>
		<li class="w-full">
			<button
				on:click={() => {
					mode = 'folder';
				}}
				type="button"
				role="tab"
				class="inline-block h-full w-full p-4 focus:outline-none dark:bg-gray-700 dark:hover:bg-gray-600 {mode ===
				'folder'
					? 'bg-gray-200 hover:bg-gray-200'
					: 'bg-gray-50 hover:bg-gray-100'}">folder</button
			>
		</li>
	</ul>
	<div class="p-4 bg-white rounded-lg md:p-8 dark:bg-gray-800 w-full">
		{#if project.folder}
			<h3 class="text-sm font-medium text-gray-600 dark:text-white">
				Folder : {project.folder.name}
			</h3>
			{#if project.folder.files.length === 0}
				<p class="text-gray-600 dark:text-gray-400">No files in this folder</p>
			{:else}
				<ul class="divide-y divide-gray-200 dark:divide-gray-700 border text-gray-600">
					{#each project.folder.files as file}
						<li class="py-3 sm:py-4">
							<div class="flex items-end justify-between text-gray-600">
								{file.name}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		{:else}
			<p class="text-gray-600 dark:text-gray-400">No folder</p>
		{/if}
	</div>
</div>
