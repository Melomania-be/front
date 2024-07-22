<script lang="ts">
	import DateShow from '$lib/components/DateShow.svelte';
	import { comment } from 'postcss';

	export let project: any;

	let mode: 'rehearsals' | 'concerts' = 'rehearsals';
</script>

<div
	class="w-full h-full bg-white border border-black shadow dark:bg-gray-800 dark:border-gray-700"
>
	<div class="sm:hidden">
		<label for="tabs" class="sr-only">Select tab</label>
		<select
			bind:value={mode}
			id="tabs"
			class="rounded-t-lg bg-gray-50 border-0 border-b border-black text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
		>
			<option value="rehearsals">rehearsals</option>
			<option value="concerts">concerts</option>
		</select>
	</div>

	<ul
		class="hidden sm:flex text-sm font-medium text-center text-gray-500 dark:divide-gray-600 dark:text-gray-400"
	>
		<li class="w-full">
			<button
				on:click={() => {
					mode = 'rehearsals';
				}}
				type="button"
				role="tab"
				class="inline-block h-full w-full p-4 focus:outline-none dark:bg-gray-700 dark:hover:bg-gray-600 {mode ===
				'rehearsals'
					? 'bg-gray-200 hover:bg-gray-200'
					: 'bg-gray-50 hover:bg-gray-100'}">rehearsals</button
			>
		</li>
		<li class="w-full">
			<button
				on:click={() => {
					mode = 'concerts';
				}}
				type="button"
				role="tab"
				class="inline-block w-full p-4 focus:outline-none dark:bg-gray-700 dark:hover:bg-gray-600 {mode ===
				'concerts'
					? 'bg-gray-200 hover:bg-gray-200'
					: 'bg-gray-50 hover:bg-gray-100'}">concerts</button
			>
		</li>
	</ul>

	<div class="border-t border-black dark:border-gray-600 w-full">
		{#if mode === 'rehearsals'}
			<div class="p-4 bg-white rounded-lg md:p-8 dark:bg-gray-800 w-full">
				<ul class="divide-y divide-gray-200 dark:divide-gray-700">
					{#each project.rehearsals as rehearsal}
						<li class="py-3 sm:py-4">
							<div class="flex items-center justify-between">
								<div class="flex items-center space-x-1">
									<h3 class="text-gray-900 dark:text-white">
										{rehearsal.place}
									</h3>
									<div class="rounded-full bg-slate-100 p-1">
										<DateShow date={rehearsal.date} />
									</div>
								</div>
								<div>
									{#if rehearsal.comment}
										{rehearsal.comment}
									{/if}
								</div>
							</div>
						</li>
					{/each}
				</ul>

				<div class="flex justify-end">
					<p class="text-sm">
						<a href="/projects/{project.id}/management/rehearsals/add">Create a rehearsal</a>
					</p>
				</div>
			</div>
		{/if}
		{#if mode === 'concerts'}
			<div class="p-4 bg-white rounded-lg md:p-8 dark:bg-gray-800 w-full">
				<ul class="divide-y divide-gray-200 dark:divide-gray-700">
					{#each project.concerts as concert}
						<li class="py-3 sm:py-4">
							<div class="flex items-center justify-between">
								<div class="flex items-center space-x-1">
									<h3 class="text-gray-900 dark:text-white">
										{concert.place}
									</h3>
									<div class="rounded-full bg-slate-100 p-1">
										<DateShow date={concert.date} />
									</div>
								</div>
								<div>
									{#if concert.comment}
										{concert.comment}
									{/if}
								</div>
							</div>
						</li>
					{/each}
				</ul>

				<div class="flex justify-end">
					<p class="text-sm">
						<a href="/projects/{project.id}/management/concerts/add">Create a concert</a>
					</p>
				</div>
			</div>
		{/if}
	</div>
</div>
