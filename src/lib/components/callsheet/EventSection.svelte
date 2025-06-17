<script lang="ts">
	import type { Callsheet } from '$lib/types/Callsheet';
	import DateShow from '../DateShow.svelte';
	import { Calendar, MapPin, MessageSquare } from 'lucide-svelte';

	export let callsheet: Callsheet;

	const combinedEvents = [
		...(callsheet.project?.concerts || []).map(e => ({ ...e, type: 'concert' })),
		...(callsheet.project?.rehearsals || []).map(e => ({ ...e, type: 'rehearsal' }))
	].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

	let expandedComments: { [key: number]: boolean } = {};

	function toggleComment(index: number) {
		expandedComments[index] = !expandedComments[index];
	}

	function isLongComment(comment: string): boolean {
		return comment && comment.length > 120;
	}

	function truncateComment(comment: string, maxLength = 120): string {
		if (!comment || comment.length <= maxLength) return comment;
		return comment.substring(0, maxLength) + '...';
	}
</script>

<div class="mb-6 sm:mb-10 text-center">
	<h2 class="text-xl sm:text-2xl font-bold text-slate-500 dark:text-white mb-4 sm:mb-6">Events</h2>

	{#if combinedEvents.length > 0}
		<div class="space-y-3 sm:space-y-6">
			{#each combinedEvents as event, index}
				<div class="relative bg-white border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl dark:bg-gray-700 w-full max-w-4xl mx-auto shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">

					<!-- Type tag - Position exacte conservée -->
					<div class={`absolute -bottom-0.5 -right-0.5 text-white text-xs font-semibold px-3 sm:px-4 py-1 sm:py-2 rounded-tl-xl rounded-br-xl shadow-md z-10
						${event.type === 'concert' ? 'bg-blue-500' : 'bg-purple-500'}`}>
						{event.type.toUpperCase()}
					</div>

					<div class="p-3 sm:p-4 md:p-6 pb-6 sm:pb-8 md:pb-10 max-w-full overflow-hidden">
						<!-- Date -->
						<div class="mb-2 sm:mb-4 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm md:text-base">
							<span class="text-purple-500 flex-shrink-0"><Calendar size={16} class="sm:w-[18px] sm:h-[18px]" /></span>
							<DateShow
								startTime={event.startDate}
								endTime={event.endDate}
								withTime
								isRehearsal={event.type === 'rehearsal'}
							/>
						</div>

						<!-- Location -->
						<div class="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm md:text-base">
							<span class="text-purple-500 flex-shrink-0"><MapPin size={16} class="sm:w-[18px] sm:h-[18px]" /></span>
							<span class="text-gray-800 dark:text-white font-medium break-words">{event.place}</span>
						</div>

						<!-- Comment compact -->
						{#if event.comment}
							<div class="bg-gray-50 dark:bg-gray-600/50 rounded-md sm:rounded-lg border border-gray-200 dark:border-gray-600">
								<!-- Header compact -->
								<div class="flex items-center gap-2 px-2 sm:px-4 py-1 sm:py-3 border-b border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 rounded-t-md sm:rounded-t-lg">
									<MessageSquare size={14} class="sm:w-4 sm:h-4 text-gray-600 dark:text-gray-300" />
									<span class="font-semibold text-gray-700 dark:text-gray-200 text-xs sm:text-sm">Comment</span>
								</div>

								<!-- Content très compact sur mobile -->
								<div class="p-2 sm:p-4 max-w-full overflow-hidden">
									<div class="text-gray-800 dark:text-gray-200 text-xs sm:text-sm md:text-base leading-relaxed break-words max-w-full">
										{#if isLongComment(event.comment) && !expandedComments[index]}
											<p class="mb-1 sm:mb-3 whitespace-pre-wrap break-words break-keep overflow-hidden">{truncateComment(event.comment)}</p>
											<button
												on:click={() => toggleComment(index)}
												class="text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 font-medium text-xs sm:text-sm transition-colors duration-200"
											>
												See more
											</button>
										{:else}
											<p class="whitespace-pre-wrap break-words break-keep overflow-hidden">{event.comment}</p>
											{#if isLongComment(event.comment)}
												<button
													on:click={() => toggleComment(index)}
													class="text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 font-medium text-xs sm:text-sm mt-1 sm:mt-3 transition-colors duration-200"
												>
													See less
												</button>
											{/if}
										{/if}
									</div>
								</div>
							</div>
						{:else}
							<div class="bg-gray-50 dark:bg-gray-600/30 rounded-md sm:rounded-lg border border-gray-200 dark:border-gray-600 px-2 sm:px-4 py-2 sm:py-3">
								<div class="flex items-center gap-2">
									<MessageSquare size={14} class="sm:w-4 sm:h-4 text-gray-400" />
									<span class="text-gray-500 dark:text-gray-400 text-xs sm:text-sm italic">No additional information</span>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 sm:p-8 max-w-md mx-auto">
			<p class="text-gray-600 dark:text-gray-300 text-sm sm:text-base">No events found.</p>
		</div>
	{/if}
</div>