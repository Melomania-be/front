<script lang="ts">
	export let project: any;

	let mode: 'pieces' | 'files' = 'pieces';
</script>

<div
	class="w-full bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
>
	<div class="sm:hidden">
		<label for="tabs" class="sr-only">Select tab</label>
		<select
			bind:value={mode}
			id="tabs"
			class="bg-gray-50 border-0 border-b border-gray-200 text-gray-900 text-sm rounded-t-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
		>
			<option value="pieces">Pieces</option>
			<option value="files">Pieces files</option>
		</select>
	</div>

	<ul
		class="hidden sm:flex text-sm font-medium text-center text-gray-500 dark:divide-gray-600 dark:text-gray-400"
	>
		<li class="w-full">
			<button
				on:click={() => {
					mode = 'pieces';
				}}
				type="button"
				role="tab"
				class="inline-block h-full w-full p-4 focus:outline-none dark:bg-gray-700 dark:hover:bg-gray-600 {mode ===
				'pieces'
					? 'bg-gray-200 hover:bg-gray-200'
					: 'bg-gray-50 hover:bg-gray-100'}">Pieces</button
			>
		</li>
		<li class="w-full">
			<button
				on:click={() => {
					mode = 'files';
				}}
				type="button"
				role="tab"
				class="inline-block w-full p-4 focus:outline-none dark:bg-gray-700 dark:hover:bg-gray-600 {mode ===
				'files'
					? 'bg-gray-200 hover:bg-gray-200'
					: 'bg-gray-50 hover:bg-gray-100'}">Pieces files</button
			>
		</li>
	</ul>

	<div class="border-t border-gray-200 dark:border-gray-600 w-full">
		{#if mode === 'pieces'}
			<div class="p-4 bg-white rounded-lg md:p-8 dark:bg-gray-800 w-full">
				<ul class="divide-y divide-gray-200 dark:divide-gray-700">
					{#each project.pieces as piece}
						<li class="py-3 sm:py-4">
							<div class="flex items-center justify-between">
								<div class="flex items-center space-x-1">
									<h3 class="text-sm font-medium text-gray-900 dark:text-white">{piece.name}</h3>
									<span class="text-xs text-gray-500 dark:text-gray-400"
										>{piece.composer.shortName}</span
									>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
		{#if mode === 'files'}
			<div class="p-4 bg-white rounded-lg md:p-8 dark:bg-gray-800 w-full">
				<ul class="divide-y divide-gray-200 dark:divide-gray-700">
					{#each project.pieces as piece}
						<li class="py-3 sm:py-4">
							<div class=" grid grid-cols-1">
								<div class="flex items-center space-x-1">
									<h3 class="text-sm font-medium text-gray-900 dark:text-white">{piece.name}</h3>
								</div>

								{#if piece.folder}
									<div class="items-center space-x-1 grid grid-cols-1">
										<h3 class="text-sm font-medium text-gray-600 dark:text-white">
											Folder : {piece.folder.name}
										</h3>
										<ul class="divide-y divide-gray-200 dark:divide-gray-700 border text-gray-600 ">
											{#each piece.folder.files as file}
												<li class="py-3 sm:py-4">
													<div class="flex items-end justify-between text-gray-600 ">
														{file.name}
													</div>
												</li>
											{/each}
										</ul>
									</div>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</div>
