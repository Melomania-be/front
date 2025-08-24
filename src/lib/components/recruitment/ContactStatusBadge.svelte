<!-- src/lib/components/recruitment/ContactStatusBadge.svelte -->
<script lang="ts">
	import { AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-svelte'
	import type { RecruitmentStatus } from '$lib/types'

	export let status: RecruitmentStatus
	export let shouldFollowUp: boolean = false

	function getStatusConfig(status: RecruitmentStatus) {
		const configs = {
			'not_yet_contacted': {
				label: 'Not yet contacted',
				color: 'bg-gray-100 text-gray-800 border-gray-300',
				icon: AlertCircle
			},
			'awaiting_response': {
				label: 'Awaiting response',
				color: 'bg-blue-100 text-blue-800 border-blue-300',
				icon: Clock
			},
			'to_follow_up': {
				label: 'Follow up',
				color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
				icon: AlertCircle
			},
			'not_available': {
				label: 'Not available',
				color: 'bg-red-100 text-red-800 border-red-300',
				icon: XCircle
			},
			'pending_validation': {
				label: 'Pending validation',
				color: 'bg-purple-100 text-purple-800 border-purple-300',
				icon: Clock
			},
			'cancelled': {
				label: 'Cancelled',
				color: 'bg-red-100 text-red-800 border-red-300',
				icon: XCircle
			},
			'recruited': {
				label: 'Recruited',
				color: 'bg-green-100 text-green-800 border-green-300',
				icon: CheckCircle
			}
		}
		return configs[status] || configs['not_yet_contacted']
	}

	$: config = getStatusConfig(status)
	$: IconComponent = config.icon
</script>

<div class="inline-flex items-center gap-1">
  <span class="px-2 py-1 text-xs font-medium rounded-full border {config.color} {shouldFollowUp ? 'animate-pulse ring-2 ring-yellow-400' : ''}">
    <svelte:component this={IconComponent} size={12} class="inline mr-1" />
		{config.label}
  </span>

	{#if shouldFollowUp}
		<span class="text-xs text-yellow-600 font-medium">Follow up</span>
	{/if}
</div>