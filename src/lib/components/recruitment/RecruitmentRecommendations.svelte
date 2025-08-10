<!-- src/lib/components/recruitment/RecruitmentRecommendations.svelte - Version corrigée -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte'
	import { UserPlus, Mail, Phone, MessageCircle, Music, Clock, X, Check, Eye } from 'lucide-svelte'
	import type { RecruitmentRecommendation, Section } from '$lib/types'
	import RecommendationCard from '$lib/components/recruitment/RecommendationCard.svelte'

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
			console.log('🔍 [RecruitmentRecommendations] Fetching recommendations for project:', projectId)
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/recommendations`)
			if (response.ok) {
				recommendations = await response.json()
				console.log('✅ [RecruitmentRecommendations] Loaded recommendations:', recommendations.length)
			} else {
				console.error('❌ [RecruitmentRecommendations] Failed to fetch recommendations:', response.status)
			}
		} catch (error) {
			console.error('❌ [RecruitmentRecommendations] Error fetching recommendations:', error)
		}
	}

	async function fetchSections() {
		try {
			console.log('🔍 [RecruitmentRecommendations] Fetching sections...')
			const response = await fetch('/api/sections')
			if (response.ok) {
				sections = await response.json()
				console.log('✅ [RecruitmentRecommendations] Loaded sections:', sections.length)
			}
		} catch (error) {
			console.error('❌ [RecruitmentRecommendations] Error fetching sections:', error)
		}
	}

	// ✅ CORRECTION : Fonction de gestion des recommandations améliorée avec debug
	async function handleRecommendation(event) {
		const { action, sectionId, notes } = event.detail
		const recommendation = event.target?.recommendation || recommendations.find(r => r.id)

		console.log('🎯 [RecruitmentRecommendations] Handling recommendation:', {
			action,
			sectionId,
			notes,
			recommendationId: recommendation?.id
		})

		if (!recommendation) {
			console.error('❌ [RecruitmentRecommendations] No recommendation found')
			return
		}

		try {
			console.log('📡 [RecruitmentRecommendations] Sending API request...')

			const response = await fetch(`/api/projects/${projectId}/management/recruitment/recommendations/${recommendation.id}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action,
					section_id: sectionId,
					notes
				})
			})

			if (response.ok) {
				console.log('✅ [RecruitmentRecommendations] Recommendation handled successfully')

				// Refresh des recommandations
				await fetchRecommendations()

				// Notifier le parent
				dispatch('recommendationChange')

				// Message de succès selon l'action
				const actionMessages = {
					'ignore': 'Recommandation ignorée',
					'contacted_email': 'Email envoyé et contact ajouté au recrutement',
					'contacted_manual': 'Contact ajouté au recrutement'
				}

				const message = actionMessages[action] || 'Action effectuée'
				console.log(`✅ ${message}`)

				// Optionnel : afficher une notification à l'utilisateur
				if (typeof window !== 'undefined' && window.alert) {
					// En production, remplacer par un système de notifications plus élégant
					// alert(message)
				}
			} else {
				console.error('❌ [RecruitmentRecommendations] API request failed:', response.status)
				const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
				alert(`Erreur lors du traitement: ${errorData.error || 'Erreur inconnue'}`)
			}
		} catch (error) {
			console.error('❌ [RecruitmentRecommendations] Error handling recommendation:', error)
			alert('Erreur lors du traitement de la recommandation')
		}
	}

	// ✅ CORRECTION : Handler pour les événements du RecommendationCard
	function onRecommendationHandle(event) {
		console.log('📨 [RecruitmentRecommendations] Received handle event from card:', event.detail)

		// Trouver la recommandation correspondante
		const recommendation = event.target?.recommendation
		if (recommendation) {
			// Ajouter la recommandation aux détails de l'événement
			const enhancedEvent = {
				detail: {
					...event.detail,
					recommendation
				},
				target: {
					recommendation
				}
			}

			handleRecommendation(enhancedEvent)
		} else {
			console.error('❌ [RecruitmentRecommendations] No recommendation found in event target')
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

	$: pendingRecommendations = recommendations.filter(r => r.status === 'pending')
	$: processedRecommendations = recommendations.filter(r => r.status !== 'pending')
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
							<!-- ✅ CORRECTION : Passage correct de la recommandation et binding des événements -->
							<div>
								<RecommendationCard
									{recommendation}
									{sections}
									on:handle={(event) => {
										console.log('📨 Received handle event for recommendation:', recommendation.id)
										// Créer un événement enrichi avec la recommandation
										const enhancedEvent = {
											detail: event.detail,
											target: { recommendation }
										}
										handleRecommendation(enhancedEvent)
									}}
								/>
							</div>
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