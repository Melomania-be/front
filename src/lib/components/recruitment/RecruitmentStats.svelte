<!-- src/lib/components/recruitment/RecruitmentStats.svelte -->
<script lang="ts">
	import { onMount } from 'svelte'
	import { BarChart3, PieChart, TrendingUp, Users, Calendar, Target } from 'lucide-svelte'
	import type { RecruitmentStats } from '$lib/types'

	export let stats: RecruitmentStats

	let chartContainer: HTMLElement

	// Calculs pour les graphiques
	$: statusData = stats.by_status.map(item => ({
		status: item.status,
		count: item.count,
		percentage: Math.round((item.count / stats.total) * 100)
	}))

	$: recruitmentRate = stats.total > 0
		? Math.round(((stats.by_status.find(s => s.status === 'recruited')?.count || 0) / stats.total) * 100)
		: 0

	$: responseRate = (() => {
		const contacted = stats.by_status.filter(s =>
			['awaiting_response', 'to_follow_up', 'recruited', 'not_available'].includes(s.status)
		).reduce((sum, s) => sum + s.count, 0)

		const responded = stats.by_status.filter(s =>
			['recruited', 'not_available'].includes(s.status)
		).reduce((sum, s) => sum + s.count, 0)

		return contacted > 0 ? Math.round((responded / contacted) * 100) : 0
	})()

	function getStatusLabel(status: string): string {
		const labels = {
			'not_yet_contacted': 'Pas encore contacté',
			'awaiting_response': 'En attente de réponse',
			'to_follow_up': 'À relancer',
			'not_available': 'Non disponible',
			'pending_validation': 'En validation',
			'cancelled': 'Annulé',
			'recruited': 'Recruté'
		}
		return labels[status] || status
	}

	function getStatusColor(status: string): string {
		const colors = {
			'not_yet_contacted': '#6B7280',
			'awaiting_response': '#3B82F6',
			'to_follow_up': '#F59E0B',
			'not_available': '#EF4444',
			'pending_validation': '#8B5CF6',
			'cancelled': '#9CA3AF',
			'recruited': '#10B981'
		}
		return colors[status] || '#6B7280'
	}

	onMount(() => {
		// Si vous voulez ajouter des graphiques plus complexes avec Chart.js ou D3
		// renderCharts()
	})
</script>

<div class="space-y-6">
	<!-- Métriques principales -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<!-- Total des contacts -->
		<div class="bg-white border-2 border-[#6B9AD9] rounded-lg p-6">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-sm font-medium text-gray-600 uppercase">Total Contacts</h3>
					<p class="text-3xl font-bold text-[#6B9AD9]">{stats.total}</p>
				</div>
				<Users class="text-[#6B9AD9]" size={32} />
			</div>
		</div>

		<!-- Taux de recrutement -->
		<div class="bg-white border-2 border-green-500 rounded-lg p-6">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-sm font-medium text-gray-600 uppercase">Taux de Recrutement</h3>
					<p class="text-3xl font-bold text-green-600">{recruitmentRate}%</p>
					<p class="text-sm text-gray-500">
						{stats.by_status.find(s => s.status === 'recruited')?.count || 0} recruté(s)
					</p>
				</div>
				<Target class="text-green-500" size={32} />
			</div>
		</div>

		<!-- Taux de réponse -->
		<div class="bg-white border-2 border-blue-500 rounded-lg p-6">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-sm font-medium text-gray-600 uppercase">Taux de Réponse</h3>
					<p class="text-3xl font-bold text-blue-600">{responseRate}%</p>
					<p class="text-sm text-gray-500">Sur les contacts effectués</p>
				</div>
				<TrendingUp class="text-blue-500" size={32} />
			</div>
		</div>
	</div>

	<!-- Répartition par statut -->
	<div class="bg-white border-2 border-[#8C8C8C] rounded-lg p-6">
		<div class="flex items-center gap-2 mb-6">
			<PieChart class="text-[#6B9AD9]" size={24} />
			<h3 class="text-lg font-semibold">Répartition par Statut</h3>
		</div>

		<div class="space-y-4">
			{#each statusData as item}
				<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
					<div class="flex items-center gap-3">
						<div
							class="w-4 h-4 rounded-full"
							style="background-color: {getStatusColor(item.status)}"
						></div>
						<span class="font-medium">{getStatusLabel(item.status)}</span>
					</div>
					<div class="text-right">
						<span class="font-bold text-lg">{item.count}</span>
						<span class="text-sm text-gray-500 ml-2">({item.percentage}%)</span>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Graphique en barres -->
	<div class="bg-white border-2 border-[#8C8C8C] rounded-lg p-6">
		<div class="flex items-center gap-2 mb-6">
			<BarChart3 class="text-[#6B9AD9]" size={24} />
			<h3 class="text-lg font-semibold">Progression du Recrutement</h3>
		</div>

		<div class="space-y-3">
			{#each statusData as item}
				<div class="space-y-2">
					<div class="flex justify-between text-sm">
						<span>{getStatusLabel(item.status)}</span>
						<span class="font-medium">{item.count} ({item.percentage}%)</span>
					</div>
					<div class="w-full bg-gray-200 rounded-full h-3">
						<div
							class="h-3 rounded-full transition-all duration-500"
							style="width: {item.percentage}%; background-color: {getStatusColor(item.status)}"
						></div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Indicateurs de performance -->
	<div class="bg-white border-2 border-[#8C8C8C] rounded-lg p-6">
		<div class="flex items-center gap-2 mb-6">
			<TrendingUp class="text-[#6B9AD9]" size={24} />
			<h3 class="text-lg font-semibold">Indicateurs de Performance</h3>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<!-- Contacts non contactés -->
			<div class="text-center p-4 bg-gray-50 rounded-lg">
				<p class="text-2xl font-bold text-gray-600">
					{stats.by_status.find(s => s.status === 'not_yet_contacted')?.count || 0}
				</p>
				<p class="text-sm text-gray-500">À contacter</p>
				<p class="text-xs text-gray-400 mt-1">
					{stats.total > 0 ? Math.round(((stats.by_status.find(s => s.status === 'not_yet_contacted')?.count || 0) / stats.total) * 100) : 0}%
				</p>
			</div>

			<!-- En attente -->
			<div class="text-center p-4 bg-blue-50 rounded-lg">
				<p class="text-2xl font-bold text-blue-600">
					{stats.by_status.find(s => s.status === 'awaiting_response')?.count || 0}
				</p>
				<p class="text-sm text-blue-600">En attente</p>
				<p class="text-xs text-blue-400 mt-1">
					{stats.total > 0 ? Math.round(((stats.by_status.find(s => s.status === 'awaiting_response')?.count || 0) / stats.total) * 100) : 0}%
				</p>
			</div>

			<!-- À relancer -->
			<div class="text-center p-4 bg-yellow-50 rounded-lg">
				<p class="text-2xl font-bold text-yellow-600">
					{stats.by_status.find(s => s.status === 'to_follow_up')?.count || 0}
				</p>
				<p class="text-sm text-yellow-600">À relancer</p>
				<p class="text-xs text-yellow-400 mt-1">
					{stats.total > 0 ? Math.round(((stats.by_status.find(s => s.status === 'to_follow_up')?.count || 0) / stats.total) * 100) : 0}%
				</p>
			</div>

			<!-- Recommandations en attente -->
			<div class="text-center p-4 bg-purple-50 rounded-lg">
				<p class="text-2xl font-bold text-purple-600">{stats.pending_recommendations}</p>
				<p class="text-sm text-purple-600">Recommandations</p>
				<p class="text-xs text-purple-400 mt-1">En attente</p>
			</div>
		</div>
	</div>

	<!-- Insights et conseils -->
	{#if stats.total > 0}
		<div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
			<h3 class="text-lg font-semibold text-blue-900 mb-4">💡 Insights</h3>

			<div class="space-y-3 text-sm">
				{#if recruitmentRate >= 20}
					<p class="text-green-800">
						✅ Excellent taux de recrutement ! Votre stratégie fonctionne bien.
					</p>
				{:else if recruitmentRate >= 10}
					<p class="text-blue-800">
						👍 Bon taux de recrutement. Vous pourriez améliorer le suivi des contacts en attente.
					</p>
				{:else}
					<p class="text-yellow-800">
						⚠️ Taux de recrutement faible. Considérez revoir votre approche ou vos critères.
					</p>
				{/if}

				{#if stats.by_status.find(s => s.status === 'to_follow_up')?.count > 0}
					<p class="text-orange-800">
						📞 Vous avez {stats.by_status.find(s => s.status === 'to_follow_up')?.count} contact(s) à relancer.
					</p>
				{/if}

				{#if stats.pending_recommendations > 0}
					<p class="text-purple-800">
						👥 {stats.pending_recommendations} recommandation(s) en attente de traitement.
					</p>
				{/if}

				{#if responseRate < 50}
					<p class="text-red-800">
						📧 Taux de réponse faible ({responseRate}%). Essayez de personnaliser vos messages.
					</p>
				{/if}
			</div>
		</div>
	{/if}
</div>