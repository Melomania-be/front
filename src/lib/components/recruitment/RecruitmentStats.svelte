<!-- src/lib/components/recruitment/RecruitmentStats.svelte -->
<script lang="ts">
	import { BarChart3, TrendingUp, Users, Target } from 'lucide-svelte'
	import type { RecruitmentStats } from '$lib/types'

	export let stats: RecruitmentStats | undefined

	$: safeStats = {
		total: Number(stats?.total) || 0,
		by_status: Array.isArray(stats?.by_status) ? stats.by_status.filter(item => item && item.status) : [],
		pending_recommendations: Number(stats?.pending_recommendations) || 0
	}

	function getStatusCount(status: string): number {
		if (!safeStats || !Array.isArray(safeStats.by_status)) {
			return 0
		}
		const item = safeStats.by_status.find(s => s && s.status === status)
		return Number(item?.count) || 0
	}

	$: statusData = safeStats.by_status
		.filter(item => item && item.status)
		.map(item => ({
			status: item.status,
			count: Number(item.count) || 0,
			percentage: safeStats.total > 0
				? Math.round(((Number(item.count) || 0) / safeStats.total) * 100)
				: 0
		}))

	$: recruitmentRate = safeStats.total > 0
		? Math.round((getStatusCount('recruited') / safeStats.total) * 100)
		: 0

	function getStatusLabel(status: string): string {
		const labels = {
			'not_yet_contacted': 'Not yet contacted',
			'awaiting_response': 'Awaiting response',
			'to_follow_up': 'Follow up',
			'not_available': 'Not available',
			'pending_validation': 'Pending validation',
			'cancelled': 'Cancelled',
			'recruited': 'Recruited'
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

	function formatNumber(value: any): string {
		const num = Number(value)
		return isNaN(num) ? '0' : num.toString()
	}
</script>

{#if !stats}
	<div class="bg-white border-2 border-[#8C8C8C] rounded-lg p-6 text-center">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B9AD9] mx-auto mb-4"></div>
		<p class="text-gray-600">Loading statistics...</p>
	</div>
{:else}
	<div class="space-y-6">
		<!-- Main metrics -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<!-- Total contacts -->
			<div class="bg-white border-2 border-[#6B9AD9] rounded-lg p-6">
				<div class="flex items-center justify-between">
					<div>
						<h3 class="text-sm font-medium text-gray-600 uppercase">Total Contacts</h3>
						<p class="text-3xl font-bold text-[#6B9AD9]">{formatNumber(safeStats.total)}</p>
					</div>
					<Users class="text-[#6B9AD9]" size={32} />
				</div>
			</div>

			<!-- Recruitment rate -->
			<div class="bg-white border-2 border-green-500 rounded-lg p-6">
				<div class="flex items-center justify-between">
					<div>
						<h3 class="text-sm font-medium text-gray-600 uppercase">Recruitment Rate</h3>
						<p class="text-3xl font-bold text-green-600">{recruitmentRate}%</p>
						<p class="text-sm text-gray-500">
							{formatNumber(getStatusCount('recruited'))} recruited
						</p>
					</div>
					<Target class="text-green-500" size={32} />
				</div>
			</div>

			<!-- Recommendations -->
			<div class="bg-white border-2 border-purple-500 rounded-lg p-6">
				<div class="flex items-center justify-between">
					<div>
						<h3 class="text-sm font-medium text-gray-600 uppercase">Recommendations</h3>
						<p class="text-3xl font-bold text-purple-600">{formatNumber(safeStats.pending_recommendations)}</p>
						<p class="text-sm text-gray-500">Pending</p>
					</div>
					<TrendingUp class="text-purple-500" size={32} />
				</div>
			</div>
		</div>

		<!-- Status breakdown -->
		<div class="bg-white border-2 border-[#8C8C8C] rounded-lg p-6">
			<div class="flex items-center gap-2 mb-6">
				<BarChart3 class="text-[#6B9AD9]" size={24} />
				<h3 class="text-lg font-semibold">Status Breakdown</h3>
			</div>

			{#if statusData.length > 0}
				<div class="space-y-3">
					{#each statusData as item}
						<div class="space-y-2">
							<div class="flex justify-between text-sm">
								<span class="flex items-center gap-2">
									<div
										class="w-3 h-3 rounded-full"
										style="background-color: {getStatusColor(item.status)}"
									></div>
									{getStatusLabel(item.status)}
								</span>
								<span class="font-medium">{formatNumber(item.count)} ({item.percentage}%)</span>
							</div>
							<div class="w-full bg-gray-200 rounded-full h-2">
								<div
									class="h-2 rounded-full transition-all duration-500"
									style="width: {Math.max(item.percentage, 2)}%; background-color: {getStatusColor(item.status)}"
								></div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-8 text-gray-500">
					<p>No status data available</p>
				</div>
			{/if}
		</div>

		<!-- Insights -->
		{#if safeStats.total > 0}
			<div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
				<h3 class="text-lg font-semibold text-blue-900 mb-4">Summary</h3>

				<div class="space-y-2 text-sm">
					{#if recruitmentRate >= 20}
						<p class="text-green-800">
							Excellent recruitment rate ({recruitmentRate}%)!
						</p>
					{:else if recruitmentRate >= 10}
						<p class="text-blue-800">
							Good recruitment rate ({recruitmentRate}%).
						</p>
					{:else}
						<p class="text-yellow-800">
							Low recruitment rate ({recruitmentRate}%).
						</p>
					{/if}

					{#if getStatusCount('to_follow_up') > 0}
						<p class="text-orange-800">
							{formatNumber(getStatusCount('to_follow_up'))} contact(s) to follow up.
						</p>
					{/if}

					{#if safeStats.pending_recommendations > 0}
						<p class="text-purple-800">
							{formatNumber(safeStats.pending_recommendations)} pending recommendation(s).
						</p>
					{/if}
				</div>
			</div>
		{:else}
			<div class="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 text-center">
				<Users size={48} class="mx-auto mb-4 text-gray-400" />
				<h3 class="text-lg font-semibold text-gray-600 mb-2">No recruitment contacts</h3>
				<p class="text-gray-500">Start by adding contacts to see statistics.</p>
			</div>
		{/if}
	</div>
{/if}