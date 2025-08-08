<!-- src/lib/components/recruitment/RecruitmentRecommendations.svelte -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte'
	import { UserPlus, Mail, Phone, MessageCircle, Music, Clock, X, Check, Eye } from 'lucide-svelte'
	import type { RecruitmentRecommendation, Section } from '$lib/types'

	export let projectId: string

	const dispatch = createEventDispatcher()

	let recommendations: RecruitmentRecommendation[] = []
	let sections: Section[] = []
	let loading = true

	onMount(async () => {
		await Promise.all([
			fetchRecommendations(),
			fetchSections()
		])
		loading = false
	})

	async function fetchRecommendations() {
		try {
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/recommendations`)
			if (response.ok) {
				recommendations = await response.json()
			}
		} catch (error) {
			console.error('Error fetching recommendations:', error)
		}
	}

	async function fetchSections() {
		try {
			const response = await fetch('/api/sections')
			if (response.ok) {
				sections = await response.json()
			}
		} catch (error) {
			console.error('Error fetching sections:', error)
		}
	}

	async function handleRecommendation(recommendationId: number, action: string, sectionId?: number, notes?: string) {
		try {
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/recommendations/${recommendationId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action,
					section_id: sectionId,
					notes
				})
			})

			if (response.ok) {
				await fetchRecommendations()
				dispatch('recommendationChange')
			} else {
				alert('Erreur lors du traitement de la recommandation')
			}
		} catch (error) {
			console.error('Error handling recommendation:', error)
			alert('Erreur lors du traitement de la recommandation')
		}
	}

	function getStatusBadge(status: string) {
		const badges = {
			'pending': { label: 'En attente', class: 'bg-yellow-100 text-yellow-800' },
			'ignored': { label: 'Ignoré', class: 'bg-gray-100 text-gray-800' },
			'contacted_email': { label: 'Contacté par email', class: 'bg-blue-100 text-blue-800' },
			'contacted_manual': { label: 'Contacté manuellement', class: 'bg-green-100 text-green-800' }
		}
		return badges[status] || badges['pending']
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	const pendingRecommendations = recommendations.filter(r => r.status === 'pending')
	const processedRecommendations = recommendations.filter(r => r.status !== 'pending')
</script>

<div class="bg-white border-2 border-[#8C8C8C] rounded-lg">
	<div class="p-4 border-b">
		<h2 class="font-bold text-lg flex items-center gap-2">
			<UserPlus class="text-[#6B9AD9]" size={20} />
			Recommandations
			{#if pendingRecommendations.length > 0}
        <span class="bg-red-500 text-white text-xs rounded-full px-2 py-1">
          {pendingRecommendations.length}
        </span>
			{/if}
		</h2>
	</div>

	{#if loading}
		<div class="p-8 text-center">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B9AD9] mx-auto mb-4"></div>
			<p class="text-gray-600">Chargement des recommandations...</p>
		</div>
	{:else}
		<div class="divide-y">
			<!-- Recommandations en attente -->
			{#if pendingRecommendations.length > 0}
				<div class="p-4">
					<h3 class="font-semibold text-lg mb-4 text-yellow-800">
						<Clock class="inline mr-2" size={16} />
						En attente de traitement ({pendingRecommendations.length})
					</h3>

					<div class="space-y-4">
						{#each pendingRecommendations as recommendation (recommendation.id)}
							<RecommendationCard
								{recommendation}
								{sections}
								on:handle={(e) => handleRecommendation(recommendation.id, e.detail.action, e.detail.sectionId, e.detail.notes)}
							/>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Recommandations traitées -->
			{#if processedRecommendations.length > 0}
				<div class="p-4">
					<h3 class="font-semibold text-lg mb-4 text-gray-700">
						<Check class="inline mr-2" size={16} />
						Traitées ({processedRecommendations.length})
					</h3>

					<div class="space-y-3">
						{#each processedRecommendations as recommendation (recommendation.id)}
							<div class="bg-gray-50 rounded-lg p-4 border">
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<h4 class="font-medium">
											{recommendation.recommended_first_name} {recommendation.recommended_last_name}
										</h4>
										<p class="text-sm text-gray-600">
											Recommandé par {recommendation.recommender_name}
										</p>
										<p class="text-xs text-gray-500">
											{formatDate(recommendation.created_at)}
										</p>
									</div>

									<div class="text-right">
                    <span class="inline-block px-2 py-1 text-xs rounded-full {getStatusBadge(recommendation.status).class}">
                      {getStatusBadge(recommendation.status).label}
                    </span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Aucune recommandation -->
			{#if recommendations.length === 0}
				<div class="p-8 text-center text-gray-500">
					<UserPlus size={48} class="mx-auto mb-4 opacity-50" />
					<p class="text-lg font-medium mb-2">Aucune recommandation</p>
					<p class="text-sm">
						Les recommandations apparaîtront ici lorsque des personnes seront recommandées via le lien de recommandation du projet.
					</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Composant RecommendationCard -->
<script context="module" lang="ts">
	export interface RecommendationCardProps {
		recommendation: RecruitmentRecommendation
		sections: Section[]
	}
</script>

<!-- Composant intégré RecommendationCard -->
{#snippet RecommendationCard({ recommendation, sections, on:handle })}
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
						on:click={() => handle('ignore')}
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
							on:handle={handle}
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
						on:handle={handle}
					/>
				</div>
			</div>
		</div>
	</div>
{/snippet}

<!-- Composant RecommendationActionButton -->
{#snippet RecommendationActionButton({ recommendation, sections, action, label, icon: IconComponent, className, on:handle })}
	<div class="relative" use:clickOutside={() => showModal = false}>
		<button
			on:click={() => showModal = true}
			class="px-3 py-2 text-sm rounded flex items-center gap-1 {className}"
		>
			<svelte:component this={IconComponent} size={14} />
			{label}
		</button>

		{#if showModal}
			<div class="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[300px] z-10">
				<h4 class="font-semibold mb-3">{label}</h4>

				<div class="space-y-3">
					<!-- Sélection de section -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							Section (optionnel)
						</label>
						<select
							bind:value={selectedSection}
							class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							<option value={null}>Sélectionner une section</option>
							{#each sections as section}
								<option value={section.id}>{section.name}</option>
							{/each}
						</select>
					</div>

					<!-- Notes -->
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">
							Notes (optionnel)
						</label>
						<textarea
							bind:value={notes}
							rows="2"
							class="w-full px-3 py-2 border border-gray-300 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="Notes sur ce contact..."
						></textarea>
					</div>

					<!-- Actions -->
					<div class="flex justify-end gap-2">
						<button
							on:click={() => showModal = false}
							class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
						>
							Annuler
						</button>
						<button
							on:click={() => {
                handle(action, selectedSection, notes)
                showModal = false
                selectedSection = null
                notes = ''
              }}
							class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
						>
							Confirmer
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/snippet}

<script>
	let showModal = false
	let selectedSection = null
	let notes = ''

	function clickOutside(node) {
		function handleClick(event) {
			if (!node.contains(event.target)) {
				showModal = false
			}
		}

		document.addEventListener('click', handleClick, true)
		return {
			destroy() {
				document.removeEventListener('click', handleClick, true)
			}
		}
	}
</script>