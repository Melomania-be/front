<script lang="ts">
	import { Calendar, MapPin, ChevronDown, ChevronUp } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import DateShow from '../DateShow.svelte';

	export let event: any;

	let isOpen = false;
</script>

<div class="border rounded-xl overflow-hidden shadow-md bg-white dark:bg-gray-700 text-left">
	<button
		class="w-full flex justify-between items-center px-4 py-3 text-left bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
		on:click={() => (isOpen = !isOpen)}
	>
		<div>
			<span class="font-semibold">{event.type.toUpperCase()}</span> — {new Date(event.startDate).toLocaleDateString()}
		</div>
		<div>
			{#if isOpen}
				<ChevronUp class="w-5 h-5" />
			{:else}
				<ChevronDown class="w-5 h-5" />
			{/if}
		</div>
	</button>

	{#if isOpen}
		<div class="p-4 space-y-3">
			<div class="flex gap-3 items-center">
				<Calendar class="text-purple-500" />
				<DateShow
					startTime={event.startDate}
					endTime={event.endDate}
					withTime
					isRehearsal={event.type === 'rehearsal'}
				/>
			</div>

			<div class="flex gap-3 items-center">
				<MapPin class="text-purple-500" />
				<span>{event.place}</span>
			</div>

			<div class="bg-gray-100 dark:bg-gray-600 p-3 rounded">
				<span class="font-semibold">Comment:</span>
				<p>{event.comment ?? 'No additional information'}</p>
			</div>
		</div>
	{/if}
</div>

<style>
    /* Optionnel pour une animation plus fluide */
    div[transition] {
        transition: all 0.3s ease-in-out;
    }
</style>
