<script lang="ts">
	export let meta: {
		total: number;
		perPage: number;
		currentPage: number;
		lastPage: number;
		firstPage: 1;
		firstPageUrl: string;
		lastPageUrl: string;
		nextPageUrl: string;
		prevPageUrl: string;
	};
	export let options:
		| {
				filter: any;
				limit: number;
				page: number;
				order: 'asc' | 'desc';
				orderBy: string;
		  }
		| {
				filters: {
					type: string;
					filtersDepth1: {
						type: string;
						filtersDepth2: {
							relation: string;
							column: string;
							operation: string;
							filter: string;
						}[];
					}[];
				};
				page: number;
				limit: number;
				orderBy: string;
				order: string;
		  };
	export let changePage: (newPage: number) => void;

	export let possibleLimits: number[] = [5, 10, 20, 50, 100, 1000, 5000];

	export let orientation: 'horizontal' | 'vertical' = 'horizontal';
</script>

{#if meta}
	<div
		class={orientation === 'horizontal'
			? 'flex items-center justify-end w-full'
			: 'grid grid-cols-1 place-items-center gap-1'}
	>
		<span class="grid grid-cols-4 gap-1 {orientation === 'horizontal' ? 'mx-2' : ''}">
			<button
				type="button"
				on:click={() => changePage(meta.firstPage)}
				class="border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
				disabled={meta.currentPage === meta.firstPage}
			>
				<span
					class="icon-[material-symbols-light--first-page]"
					style="width: 1.2rem; height: 1.2rem; color: black;"
				></span>
			</button>
			<button
				type="button"
				on:click={() => changePage(meta.currentPage - 1)}
				class="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={meta.currentPage === meta.firstPage}>prev</button
			>
			<button
				type="button"
				on:click={() => changePage(meta.currentPage + 1)}
				class="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={meta.currentPage === meta.lastPage}>next</button
			>
			<button
				type="button"
				on:click={() => changePage(meta.lastPage)}
				class="border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
				disabled={meta.currentPage === meta.lastPage}
				><span
					class="icon-[material-symbols-light--last-page]"
					style="width: 1.2rem; height: 1.2rem; color: black;"
				></span></button
			>
		</span>
		<span class={orientation === 'horizontal' ? '' : ''}>
			{#if options.limit}
				<label for="limit">limit per page</label>
				<select
					id="limit"
					class="border border-gray-300 rounded-md"
					bind:value={options.limit}
					on:change={() => changePage(meta.firstPage)}
				>
					{#each possibleLimits as limit}
						<option value={limit}>{limit}</option>
					{/each}
				</select>
			{/if}
		</span>
		<span class={orientation === 'horizontal' ? 'mx-2' : ''}>
			<nav>
				{#if meta.lastPage}
					<ul class="inline-flex -space-x-px text-sm">
						{#if meta.currentPage !== meta.firstPage}
							<li>
								<button
									on:click={() => changePage(meta.firstPage)}
									class="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
									>{meta.firstPage}</button
								>
							</li>
						{/if}
						{#if meta.currentPage - 2 > meta.firstPage}
							<li>
								<span
									class="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
									>...</span
								>
							</li>
						{/if}
						{#if meta.currentPage - 1 > meta.firstPage}
							<li>
								<button
									on:click={() => changePage(meta.currentPage - 1)}
									class="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
									>{meta.currentPage - 1}</button
								>
							</li>
						{/if}
						<li>
							<button
								class="flex items-center justify-center px-3 h-8 leading-tight text-black bg-gray-300 border border-gray-300 hover:bg-gray-400 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
								>{meta.currentPage}</button
							>
						</li>
						{#if meta.currentPage + 1 < meta.lastPage}
							<li>
								<button
									on:click={() => changePage(meta.currentPage + 1)}
									class="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
									>{meta.currentPage + 1}</button
								>
							</li>
						{/if}
						{#if meta.currentPage + 2 < meta.lastPage}
							<li>
								<span
									class="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
									>...</span
								>
							</li>
						{/if}
						{#if meta.currentPage !== meta.lastPage}
							<li>
								<button
									on:click={() => changePage(meta.lastPage)}
									class="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
									>{meta.lastPage}</button
								>
							</li>
						{/if}
					</ul>
				{/if}
			</nav>
		</span>
	</div>
{/if}
