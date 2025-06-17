<script lang="ts">
	import type { Callsheet } from '$lib/types/Callsheet';
	export let callsheet: Callsheet;
</script>

<div class="mb-10">
	<h2 class="text-2xl font-bold text-slate-500 dark:text-white text-center mb-4 mt-4">
		Contact Information
	</h2>
	<p class="text-gray-800 dark:text-gray-400 mb-4">
		Below are the project managers. Please don't hesitate to call or email one of us for questions or remarks.
	</p>

	<div class="grid gap-4 sm:grid-cols-2">
		{#each callsheet.project?.responsibles || [] as responsible}
			<div class="p-4 bg-white border border-blue-900 rounded-lg shadow dark:bg-gray-700">
				<h5 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
					{responsible.firstName} {responsible.lastName}
				</h5>
				<div class="text-gray-700 dark:text-gray-300 text-sm">
					{#if responsible.email}
						<div><span class="font-semibold">Email:</span> {responsible.email}</div>
					{/if}
					{#if responsible.phone && responsible.phone !== '/'}
						<div><span class="font-semibold">Phone:</span> {responsible.phone}</div>
					{/if}
					{#if responsible.messenger && responsible.messenger !== '/'}
						<div><span class="font-semibold">Messenger:</span> {responsible.messenger}</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
