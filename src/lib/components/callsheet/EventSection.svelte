<script lang="ts">
	import type { Callsheet } from '$lib/types/Callsheet';
	import DateShow from '../DateShow.svelte';
	import { Calendar, MapPin, MessageSquare } from 'lucide-svelte';

	export let callsheet: Callsheet;

	const combinedEvents = [
		...(callsheet.project?.concerts || []).map(e => ({ ...e, type: 'concert' })),
		...(callsheet.project?.rehearsals || []).map(e => ({ ...e, type: 'rehearsal' }))
	].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

	// État pour gérer l'expansion des commentaires
	let expandedComments: { [key: number]: boolean } = {};

	function toggleComment(index: number) {
		expandedComments[index] = !expandedComments[index];
	}

	function isLongComment(comment: string): boolean {
		return comment && comment.length > 150;
	}

	function truncateComment(comment: string, maxLength = 150): string {
		if (!comment || comment.length <= maxLength) return comment;
		return comment.substring(0, maxLength) + '...';
	}
</script>

<div class="mb-10 text-center">
	<h2 class="text-2xl font-bold text-slate-500 dark:text-white mb-6">
		Events
	</h2>

	{#if combinedEvents.length > 0}
		<div class="space-y-6">
			{#each combinedEvents as event, index}
				<div class="relative bg-white border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 w-full max-w-4xl mx-auto shadow-sm hover:shadow-md transition-shadow duration-200">

					<!-- Type tag en bas à droite -->
					<div class={`absolute -bottom-0.5 -right-0.5 text-white text-xs font-semibold px-4 py-2 rounded-tl-xl rounded-br-xl shadow-md z-10
         ${event.type === 'concert' ? 'bg-blue-500' : 'bg-purple-500'}`}>
						{event.type.toUpperCase()}
					</div>

					<div class="p-4 sm:p-6 pb-8 sm:pb-10">
						<!-- Date -->
						<div class="mb-4 flex items-center gap-3 text-sm sm:text-base">
							<span class="text-purple-500 flex-shrink-0"><Calendar size={18} /></span>
							<DateShow
								startTime={event.startDate}
								endTime={event.endDate}
								withTime
								isRehearsal={event.type === 'rehearsal'}
							/>
						</div>

						<!-- Lieu -->
						<div class="mb-4 flex items-center gap-3 text-sm sm:text-base">
							<span class="text-purple-500 flex-shrink-0"><MapPin size={18} /></span>
							<span class="text-gray-800 dark:text-white font-medium">{event.place}</span>
						</div>

						<!-- Commentaire amélioré -->
						{#if event.comment}
							<div class="bg-gray-50 dark:bg-gray-600/50 rounded-lg border border-gray-200 dark:border-gray-600">
								<!-- En-tête du commentaire -->
								<div class="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 rounded-t-lg">
									<MessageSquare size={16} class="text-gray-600 dark:text-gray-300" />
									<span class="font-semibold text-gray-700 dark:text-gray-200 text-sm">Commentaire</span>
								</div>

								<!-- Contenu du commentaire -->
								<div class="p-4">
									<div class="text-gray-800 dark:text-gray-200 text-sm sm:text-base leading-relaxed">
										{#if isLongComment(event.comment) && !expandedComments[index]}
											<p class="mb-3">{truncateComment(event.comment)}</p>
											<button
												on:click={() => toggleComment(index)}
												class="text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 font-medium text-sm transition-colors duration-200"
											>
												Voir plus
											</button>
										{:else}
											<p class="whitespace-pre-wrap">{event.comment}</p>
											{#if isLongComment(event.comment)}
												<button
													on:click={() => toggleComment(index)}
													class="text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 font-medium text-sm mt-3 transition-colors duration-200"
												>
													Voir moins
												</button>
											{/if}
										{/if}
									</div>
								</div>
							</div>
						{:else}
							<div class="bg-gray-50 dark:bg-gray-600/30 rounded-lg border border-gray-200 dark:border-gray-600 px-4 py-3">
								<div class="flex items-center gap-2">
									<MessageSquare size={16} class="text-gray-400" />
									<span class="text-gray-500 dark:text-gray-400 text-sm italic">Aucune information supplémentaire</span>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-8 max-w-md mx-auto">
			<p class="text-gray-600 dark:text-gray-300">Aucun événement trouvé.</p>
		</div>
	{/if}
</div>