<script lang="ts">
	export let project: any;

	let mode: 'pieces' | 'files' = 'pieces';

	// Variables réactives sécurisées
	$: safePieces = project?.pieces || [];
</script>

{#if project}
	<div class="w-full bg-white border-2 rounded-xl pt-4 pb-4 border-[#8C8C8C] shadow dark:bg-gray-800 dark:border-gray-700">
		<div class="sm:hidden">
			<label for="tabs" class="sr-only">Select tab</label>
			<select
				bind:value={mode}
				id="tabs"
				class="bg-gray-50 border-0 border-b border-black text-gray-900 text-sm rounded-t-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
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

		<div class="border-t border-black dark:border-gray-600 w-full">
			{#if mode === 'pieces'}
				<div class="p-4 bg-white rounded-lg md:p-8 dark:bg-gray-800 w-full">
					{#if safePieces.length > 0}
						<ul class="divide-y divide-gray-200 dark:divide-gray-700">
							{#each safePieces as piece}
								{#if piece}
									<li class="py-3 sm:py-4">
										<div class="flex items-center justify-between">
											<div class="flex items-center space-x-1">
												<a href="/library/pieces?filter={encodeURIComponent(piece.name || '')}">
													<h3 class="text-sm font-medium text-gray-900 dark:text-white">{piece.name || 'Unknown Piece'}</h3>
													{#if piece.composer}
										<span class="text-xs text-gray-500 dark:text-gray-400"
										>{piece.composer.shortName || piece.composer.longName || 'Unknown Composer'}</span
										>
													{:else}
														<span class="text-xs text-gray-500 dark:text-gray-400">Unknown Composer</span>
													{/if}
												</a>
											</div>
										</div>
									</li>
								{/if}
							{/each}
						</ul>
					{:else}
						<div class="text-center py-8 text-gray-500">
							<p>No pieces found for this project</p>
						</div>
					{/if}
				</div>
			{/if}
			{#if mode === 'files'}
				<div class="p-4 bg-white rounded-lg md:p-8 dark:bg-gray-800 w-full">
					{#if safePieces.length > 0}
						<ul class="divide-y divide-gray-200 dark:divide-gray-700">
							{#each safePieces as piece}
								{#if piece}
									<li class="py-3 sm:py-4">
										<div class=" grid grid-cols-1">
											<div class="flex items-center space-x-1">
												<h3 class="text-sm font-medium text-gray-900 dark:text-white">{piece.name || 'Unknown Piece'}</h3>
											</div>

											{#if piece.folder}
												<div class="items-center space-x-1 grid grid-cols-1">
													<h3 class="text-sm font-medium text-gray-600 dark:text-white">
														Folder : {piece.folder.name || 'Unknown Folder'}
													</h3>
													{#if piece.folder.files && piece.folder.files.length > 0}
														<ul class="divide-y divide-gray-200 dark:divide-gray-700 border text-gray-600">
															{#each piece.folder.files as file}
																{#if file}
																	<li class="py-3 sm:py-4">
																		<div class="flex items-end justify-between text-gray-600">
																			{file.name || 'Unknown File'}
																		</div>
																	</li>
																{/if}
															{/each}
														</ul>
													{:else}
														<div class="text-center py-4 text-gray-500">
															<p>No files in this folder</p>
														</div>
													{/if}
												</div>
											{:else}
												<div class="text-center py-2 text-gray-500">
													<p>No folder associated with this piece</p>
												</div>
											{/if}
										</div>
									</li>
								{/if}
							{/each}
						</ul>
					{:else}
						<div class="text-center py-8 text-gray-500">
							<p>No pieces found for this project</p>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="w-full bg-gray-100 border-2 rounded-xl pt-4 pb-4 border-[#8C8C8C] shadow h-64 flex justify-center items-center">
		<div class="text-center">
			<div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
			<p class="text-gray-600">Loading pieces...</p>
		</div>
	</div>
{/if}