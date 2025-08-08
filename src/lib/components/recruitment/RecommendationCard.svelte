<!-- src/lib/components/recruitment/RecommendationCard.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import { UserPlus, Mail, Phone, MessageCircle, Music, X } from 'lucide-svelte'
	import type { RecruitmentRecommendation, Section } from '$lib/types'
	import RecommendationActionButton from './RecommendationActionButton.svelte'

	export let recommendation: RecruitmentRecommendation
	export let sections: Section[]

	const dispatch = createEventDispatcher()

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	function handleAction(action: string, sectionId?: number, notes?: string) {
		dispatch('handle', {
			action,
			sectionId,
			notes
		})
	}
</script>

<div class="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
	<div class="flex flex-col space-y-4">
		<!-- En-tête -->
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<h4 class="font-semibold text-lg">
					{recommendation.recommended_first_name} {recommendation.recommended_last_name}
				</h4>
				<p class="text-sm text-gray-600">
					Recommandé par <strong>{recommendation.recommender_name}</strong>
					{#if recommendation.recommender_email}
						(<a href="mailto:{recommendation.recommender_email}" class="text-blue-600 hover:underline">{recommendation.recommender_email}</a>)
					{/if}
				</p>
				<p class="text-xs text-gray-500 mt-1">
					{formatDate(recommendation.created_at)}
				</p>
			</div>

			<div class="text-right">
				<span class="inline-block px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
					Nouveau
				</span>
			</div>
		</div>

		<!-- Informations de contact -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<h5 class="font-medium text-sm text-gray-700 mb-2">Informations de contact</h5>
				<div class="space-y-1 text-sm">
					{#if recommendation.recommended_email}
						<div class="flex items-center gap-2">
							<Mail size={14} class="text-gray-400" />
							<a href="mailto:{recommendation.recommended_email}" class="text-blue-600 hover:underline">
								{recommendation.recommended_email}
							</a>
						</div>
					{/if}
					{#if recommendation.recommended_phone}
						<div class="flex items-center gap-2">
							<Phone size={14} class="text-gray-400" />
							<a href="tel:{recommendation.recommended_phone}" class="text-blue-600 hover:underline">
								{recommendation.recommended_phone}
							</a>
						</div>
					{/if}
					{#if recommendation.recommended_messenger}
						<div class="flex items-center gap-2">
							<MessageCircle size={14} class="text-gray-400" />
							<span>{recommendation.recommended_messenger}</span>
						</div>
					{/if}
					{#if recommendation.recommended_instrument}
						<div class="flex items-center gap-2">
							<Music size={14} class="text-gray-400" />
							<span>{recommendation.recommended_instrument}</span>
						</div>
					{/if}
				</div>
			</div>

			{#if recommendation.recommendation_message}
				<div>
					<h5 class="font-medium text-sm text-gray-700 mb-2">Message de recommandation</h5>
					<p class="text-sm text-gray-600 bg-white p-3 rounded border">
						{recommendation.recommendation_message}
					</p>
				</div>
			{/if}
		</div>

		<!-- Actions -->
		<div class="border-t pt-4">
			<div class="flex flex-wrap gap-2">
				<!-- Ignorer -->
				<button
					on:click={() => handleAction('ignore')}
					class="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-1"
				>
					<X size={14} />
					Ignorer
				</button>

				<!-- Contacter par email (si email disponible) -->
				{#if recommendation.recommended_email}
					<RecommendationActionButton
						{recommendation}
						{sections}
						action="contact_email"
						label="Contacter par email"
						icon={Mail}
						className="bg-blue-600 text-white hover:bg-blue-700"
						on:handle={(e) => handleAction(e.detail.action, e.detail.sectionId, e.detail.notes)}
					/>
				{/if}

				<!-- Contacter manuellement -->
				<RecommendationActionButton
					{recommendation}
					{sections}
					action="contact_manual"
					label="Contacter manuellement"
					icon={UserPlus}
					className="bg-green-600 text-white hover:bg-green-700"
					on:handle={(e) => handleAction(e.detail.action, e.detail.sectionId, e.detail.notes)}
				/>
			</div>
		</div>
	</div>
</div>