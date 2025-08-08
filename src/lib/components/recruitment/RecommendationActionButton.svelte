<!-- src/lib/components/recruitment/RecommendationActionButton.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import type { RecruitmentRecommendation, Section } from '$lib/types'

	export let recommendation: RecruitmentRecommendation
	export let sections: Section[]
	export let action: string
	export let label: string
	export let icon: any
	export let className: string

	const dispatch = createEventDispatcher()

	let showModal = false
	let selectedSection: number | null = null
	let notes = ''

	function handleAction() {
		dispatch('handle', {
			action,
			sectionId: selectedSection,
			notes
		})
		closeModal()
	}

	function closeModal() {
		showModal = false
		selectedSection = null
		notes = ''
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement
		const modal = document.getElementById(`modal-${action}-${recommendation.id}`)
		if (modal && !modal.contains(target)) {
			closeModal()
		}
	}

	$: if (typeof window !== 'undefined') {
		if (showModal) {
			document.addEventListener('click', handleClickOutside)
		} else {
			document.removeEventListener('click', handleClickOutside)
		}
	}
</script>

<div class="relative">
	<button
		on:click={() => showModal = true}
		class="px-3 py-2 text-sm rounded flex items-center gap-1 {className}"
	>
		<svelte:component this={icon} size={14} />
		{label}
	</button>

	{#if showModal}
		<div
			id="modal-{action}-{recommendation.id}"
			class="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[300px] z-10"
		>
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
						on:click={closeModal}
						class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
					>
						Annuler
					</button>
					<button
						on:click={handleAction}
						class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
					>
						Confirmer
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<svelte:window on:beforeunload={() => document.removeEventListener('click', handleClickOutside)} />