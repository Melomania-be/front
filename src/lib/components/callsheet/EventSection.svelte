<script lang="ts">
	import type { Callsheet } from '$lib/types/Callsheet';
	import DateShow from '../DateShow.svelte';
	import { Calendar, MapPin } from 'lucide-svelte';
	export let callsheet: Callsheet;

	const combinedEvents = [
		...(callsheet.project?.concerts || []).map(e => ({ ...e, type: 'concert' })),
		...(callsheet.project?.rehearsals || []).map(e => ({ ...e, type: 'rehearsal' }))
	].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
</script>

<div class="mb-10 text-center">
	<h2 class="text-2xl font-bold text-slate-500 dark:text-white mb-4">
		Events
	</h2>

	{#if combinedEvents.length > 0}
		<div class="space-y-4">
			{#each combinedEvents as event}
				<div class="relative bg-white border border-gray-300 dark:border-gray-600 p-4 rounded-xl dark:bg-gray-700 w-full max-w-3xl mx-auto">
					<!-- Type tag -->
					<div class={`absolute -bottom-0.5 -right-0.5 text-white text-xs font-semibold px-4 py-2 rounded-tl-xl rounded-br-xl shadow-md
								${event.type === 'concert' ? 'bg-blue-400' : 'bg-purple-500'}`}>
						{event.type}
					</div>

					<!-- Date -->
					<div class="mb-2 flex items-center gap-2 text-sm sm:text-base">
						<span class="text-purple-500"><Calendar /></span>
						<DateShow
							startTime={event.startDate}
							endTime={event.endDate}
							withTime
							isRehearsal={event.type === 'rehearsal'}
						/>
					</div>

					<!-- Lieu -->
					<div class="mb-2 flex items-center gap-2 text-sm sm:text-base">
						<span class="text-purple-500"><MapPin /></span>
						<span class="text-gray-800 dark:text-white">{event.place}</span>
					</div>

					<!-- Commentaire -->
					<div class="bg-gray-100 dark:bg-gray-600 h-[80px] w-[600px] max-sm:w-[200px] shadow-inner rounded-md p-2 text-sm sm:text-base mt-2">
						<span class="font-semibold text-gray-800 dark:text-white">Comment: </span>
						{event.comment ?? 'No additional information'}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-gray-700 dark:text-gray-300">No events found.</p>
	{/if}
</div>

