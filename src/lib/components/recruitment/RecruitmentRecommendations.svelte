<!-- src/lib/components/recruitment/RecruitmentRecommendations.svelte -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { UserPlus, Mail, Phone, MessageCircle, Music, Clock, X, Check, Eye } from 'lucide-svelte';
	import type { RecruitmentRecommendation, Section } from '$lib/types';
	import RecommendationCard from '$lib/components/recruitment/RecommendationCard.svelte';

	export let projectId: string;

	const dispatch = createEventDispatcher();

	let recommendations: RecruitmentRecommendation[] = [];
	let sections: Section[] = [];
	let loading = true;

	onMount(async () => {
		await Promise.all([fetchRecommendations(), fetchSections()]);
		loading = false;
	});

	async function fetchRecommendations() {
		try {
			const response = await fetch(
				`/api/projects/${projectId}/management/recruitment/recommendations`
			);
			if (response.ok) {
				const data = await response.json();
				// S'assurer que les données sont dans le bon format
				recommendations = Array.isArray(data) ? data : [];
				console.log('Recommendations loaded:', recommendations);
			} else {
				console.error('Failed to fetch recommendations:', response.status);
				recommendations = [];
			}
		} catch (error) {
			console.error('Error fetching recommendations:', error);
			recommendations = [];
		}
	}

	async function fetchSections() {
		try {
			const response = await fetch('/api/sections');
			if (response.ok) {
				sections = await response.json();
			}
		} catch (error) {
			console.error('Error fetching sections:', error);
			sections = [];
		}
	}

	async function handleRecommendation(event) {
		const { action, sectionId, notes } = event.detail;
		const recommendation = event.target?.recommendation || recommendations.find((r) => r.id);

		if (!recommendation) {
			console.error('No recommendation found');
			return;
		}

		try {
			const response = await fetch(
				`/api/projects/${projectId}/management/recruitment/recommendations/${recommendation.id}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action,
						section_id: sectionId,
						notes
					})
				}
			);

			if (response.ok) {
				await fetchRecommendations();
				dispatch('recommendationChange');

				const actionMessages = {
					ignore: 'Recommendation ignored',
					contacted_email: 'Email sent and contact added to recruitment',
					contacted_manual: 'Contact added to recruitment'
				};

				const message = actionMessages[action] || 'Action completed';
			} else {
				console.error('API request failed:', response.status);
				const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
				alert(`Error processing: ${errorData.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error handling recommendation:', error);
			alert('Error processing recommendation');
		}
	}

	function onRecommendationHandle(event) {
		const recommendation = event.target?.recommendation;
		if (recommendation) {
			const enhancedEvent = {
				detail: {
					...event.detail,
					recommendation
				},
				target: {
					recommendation
				}
			};

			handleRecommendation(enhancedEvent);
		} else {
			console.error('No recommendation found in event target');
		}
	}

	function getStatusBadge(status: string) {
		const badges = {
			pending: { label: 'Pending', class: 'bg-yellow-100 text-yellow-800' },
			ignored: { label: 'Ignored', class: 'bg-gray-100 text-gray-800' },
			contacted_email: { label: 'Contacted by email', class: 'bg-blue-100 text-blue-800' },
			contacted_manual: { label: 'Contacted manually', class: 'bg-green-100 text-green-800' }
		};
		return badges[status] || badges['pending'];
	}

	function formatDate(dateString: string): string {
		if (!dateString) return 'Date inconnue';

		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) return 'Date invalide';

			return date.toLocaleDateString('fr-FR', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch (error) {
			return 'Date invalide';
		}
	}

	function getDisplayName(recommendation: RecruitmentRecommendation): string {
		const firstName = recommendation.recommended_first_name || '';
		const lastName = recommendation.recommended_last_name || '';
		return `${firstName} ${lastName}`.trim() || 'Nom inconnu';
	}

	function getRecommenderName(recommendation: RecruitmentRecommendation): string {
		return recommendation.recommender_name || 'Recommandateur inconnu';
	}

	$: pendingRecommendations = recommendations.filter((r) => r.status === 'pending');
	$: processedRecommendations = recommendations.filter((r) => r.status !== 'pending');
</script>

<div class="bg-white border-2 border-[#8C8C8C] rounded-lg">
	<div class="p-4 border-b">
		<h2 class="font-bold text-lg flex items-center gap-2">
			<UserPlus class="text-[#6B9AD9]" size={20} />
			Recommendations
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
			<p class="text-gray-600">Loading recommendations...</p>
		</div>
	{:else}
		<div class="divide-y">
			<!-- Pending recommendations -->
			{#if pendingRecommendations.length > 0}
				<div class="p-4">
					<h3 class="font-semibold text-lg mb-4 text-yellow-800">
						<Clock class="inline mr-2" size={16} />
						Pending processing ({pendingRecommendations.length})
					</h3>

					<div class="space-y-4">
						{#each pendingRecommendations as recommendation (recommendation.id)}
							<div>
								<RecommendationCard
									{recommendation}
									{sections}
									on:handle={(event) => {
										const enhancedEvent = {
											detail: event.detail,
											target: { recommendation }
										};
										handleRecommendation(enhancedEvent);
									}}
								/>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Processed recommendations -->
			{#if processedRecommendations.length > 0}
				<div class="p-4">
					<h3 class="font-semibold text-lg mb-4 text-gray-700">
						<Check class="inline mr-2" size={16} />
						Processed ({processedRecommendations.length})
					</h3>

					<div class="space-y-3">
						{#each processedRecommendations as recommendation (recommendation.id)}
							<div class="bg-gray-50 rounded-lg p-4 border">
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<h4 class="font-medium">
											{getDisplayName(recommendation)}
										</h4>
										<p class="text-sm text-gray-600">
											Recommended by {getRecommenderName(recommendation)}
										</p>
										<p class="text-xs text-gray-500">
											{formatDate(recommendation.created_at)}
										</p>
									</div>

									<div class="text-right">
										<span
											class="inline-block px-2 py-1 text-xs rounded-full {getStatusBadge(
												recommendation.status
											).class}"
										>
											{getStatusBadge(recommendation.status).label}
										</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- No recommendations -->
			{#if recommendations.length === 0}
				<div class="p-8 text-center text-gray-500">
					<UserPlus size={48} class="mx-auto mb-4 opacity-50" />
					<p class="text-lg font-medium mb-2">No recommendations</p>
					<p class="text-sm">
						Recommendations will appear here when people are recommended via the project's
						recommendation link.
					</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
