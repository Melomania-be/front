<!-- src/lib/components/recruitment/RecommendationCard.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import { UserPlus, Mail, Phone, MessageCircle, Music, X, Calendar, User } from 'lucide-svelte'
	import type { RecruitmentRecommendation, Section } from '$lib/types'

	export let recommendation: RecruitmentRecommendation
	export let sections: Section[]

	const dispatch = createEventDispatcher()

	let showEmailModal = false
	let showManualModal = false
	let selectedSection: number | null = null
	let notes = ''
	let isProcessing = false

	function formatDate(dateString: string | null | undefined): string {
		if (!dateString) return 'Unknown date'

		try {
			let date: Date

			if (typeof dateString === 'string') {
				date = new Date(dateString)
			} else {
				date = dateString as any
			}

			if (isNaN(date.getTime())) {
				console.warn('Invalid date:', dateString)
				return 'Invalid date'
			}

			return date.toLocaleDateString('en-US', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			})
		} catch (error) {
			console.error('Error formatting date:', error, 'for date:', dateString)
			return 'Invalid date'
		}
	}

	async function handleAction(action: string, sectionId?: number, actionNotes?: string) {
		if (isProcessing) {
			return
		}

		isProcessing = true

		try {
			dispatch('handle', {
				action,
				sectionId: sectionId || null,
				notes: actionNotes || ''
			})

			closeModals()
		} catch (error) {
			console.error('Error handling action:', error)
		} finally {
			isProcessing = false
		}
	}

	function showEmailAction() {
		selectedSection = null
		notes = ''
		showEmailModal = true
		showManualModal = false
	}

	function showManualAction() {
		selectedSection = null
		notes = ''
		showManualModal = true
		showEmailModal = false
	}

	function closeModals() {
		showEmailModal = false
		showManualModal = false
		selectedSection = null
		notes = ''
	}

	function confirmEmailAction() {
		handleAction('contacted_email', selectedSection, notes)
	}

	function confirmManualAction() {
		handleAction('contacted_manual', selectedSection, notes)
	}

	$: safeRecommendation = {
		id: recommendation?.id || 0,
		recommended_first_name: recommendation?.recommended_first_name || 'First name',
		recommended_last_name: recommendation?.recommended_last_name || 'Last name',
		recommender_name: recommendation?.recommender_name || 'Anonymous',
		recommender_email: recommendation?.recommender_email || null,
		recommended_email: recommendation?.recommended_email || null,
		recommended_phone: recommendation?.recommended_phone || null,
		recommended_messenger: recommendation?.recommended_messenger || null,
		recommended_instrument: recommendation?.recommended_instrument || null,
		recommendation_message: recommendation?.recommendation_message || null,
		created_at: recommendation?.created_at || recommendation?.createdAt || null,
		status: recommendation?.status || 'pending'
	}

	$: displayName = `${safeRecommendation.recommended_first_name} ${safeRecommendation.recommended_last_name}`.trim()
	$: recommenderName = safeRecommendation.recommender_name || 'Anonymous recommender'
	$: hasContactInfo = !!(safeRecommendation.recommended_email || safeRecommendation.recommended_phone || safeRecommendation.recommended_messenger)
	$: canContactByEmail = !!(safeRecommendation.recommended_email && safeRecommendation.recommended_email.includes('@'))

	function getInitials(firstName: string, lastName: string): string {
		const first = firstName?.charAt(0)?.toUpperCase() || 'F'
		const last = lastName?.charAt(0)?.toUpperCase() || 'L'
		return `${first}${last}`
	}

	function getAvatarColor(name: string): string {
		const colors = [
			'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500',
			'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
		]
		const index = name.length % colors.length
		return colors[index]
	}

	$: initials = getInitials(safeRecommendation.recommended_first_name, safeRecommendation.recommended_last_name)
	$: avatarColor = getAvatarColor(displayName)
</script>

<div class="border border-yellow-200 bg-yellow-50 rounded-lg p-6 transition-all duration-200 hover:shadow-md">
	<div class="flex flex-col space-y-4">

		<!-- Header with avatar -->
		<div class="flex items-start justify-between">
			<div class="flex items-start gap-4 flex-1">
				<!-- Avatar with initials -->
				<div class="w-12 h-12 rounded-full {avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-md">
					{initials}
				</div>

				<div class="flex-1">
					<h4 class="font-semibold text-lg text-gray-800 mb-1">
						{displayName}
					</h4>

					<div class="flex items-center gap-2 text-sm text-gray-600 mb-2">
						<User size={14} class="text-gray-400" />
						<span>Recommended by <strong>{recommenderName}</strong></span>
					</div>

					{#if safeRecommendation.recommender_email}
						<div class="flex items-center gap-2 text-sm text-gray-500">
							<Mail size={12} class="text-gray-400" />
							<a href="mailto:{safeRecommendation.recommender_email}"
								 class="text-blue-600 hover:underline transition-colors">
								{safeRecommendation.recommender_email}
							</a>
						</div>
					{/if}

					<div class="flex items-center gap-2 text-xs text-gray-500 mt-2">
						<Calendar size={12} class="text-gray-400" />
						<span>{formatDate(safeRecommendation.created_at)}</span>
					</div>
				</div>
			</div>

			<!-- Status badge -->
			<div class="text-right">
				<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
					<span class="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
					New
				</span>
			</div>
		</div>

		<!-- Contact information -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div>
				<h5 class="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
					<Phone size={14} class="text-gray-500" />
					Contact information
				</h5>

				{#if hasContactInfo}
					<div class="space-y-2 text-sm">
						{#if safeRecommendation.recommended_email}
							<div class="flex items-center gap-3 p-2 bg-white rounded-md border border-gray-200">
								<Mail size={14} class="text-blue-500 flex-shrink-0" />
								<a href="mailto:{safeRecommendation.recommended_email}"
									 class="text-blue-600 hover:underline transition-colors flex-1 truncate">
									{safeRecommendation.recommended_email}
								</a>
							</div>
						{/if}

						{#if safeRecommendation.recommended_phone}
							<div class="flex items-center gap-3 p-2 bg-white rounded-md border border-gray-200">
								<Phone size={14} class="text-green-500 flex-shrink-0" />
								<a href="tel:{safeRecommendation.recommended_phone}"
									 class="text-green-600 hover:underline transition-colors flex-1">
									{safeRecommendation.recommended_phone}
								</a>
							</div>
						{/if}

						{#if safeRecommendation.recommended_messenger}
							<div class="flex items-center gap-3 p-2 bg-white rounded-md border border-gray-200">
								<MessageCircle size={14} class="text-purple-500 flex-shrink-0" />
								<span class="text-gray-700 flex-1 truncate">
									{safeRecommendation.recommended_messenger}
								</span>
							</div>
						{/if}

						{#if safeRecommendation.recommended_instrument}
							<div class="flex items-center gap-3 p-2 bg-white rounded-md border border-gray-200">
								<Music size={14} class="text-orange-500 flex-shrink-0" />
								<span class="text-gray-700 flex-1">
									{safeRecommendation.recommended_instrument}
								</span>
							</div>
						{/if}
					</div>
				{:else}
					<div class="p-3 bg-gray-100 rounded-md border-2 border-dashed border-gray-300">
						<div class="flex items-center gap-2 text-sm text-gray-500">
							<X size={14} class="text-gray-400" />
							<span class="italic">No contact information provided</span>
						</div>
					</div>
				{/if}
			</div>

			<!-- Recommendation message -->
			{#if safeRecommendation.recommendation_message}
				<div>
					<h5 class="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
						<MessageCircle size={14} class="text-gray-500" />
						Recommendation message
					</h5>
					<div class="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
						<p class="text-sm text-gray-700 leading-relaxed italic">
							"{safeRecommendation.recommendation_message}"
						</p>
					</div>
				</div>
			{:else}
				<div>
					<h5 class="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
						<MessageCircle size={14} class="text-gray-500" />
						Recommendation message
					</h5>
					<div class="p-3 bg-gray-100 rounded-md border-2 border-dashed border-gray-300">
						<p class="text-sm text-gray-500 italic">
							No recommendation message provided
						</p>
					</div>
				</div>
			{/if}
		</div>

		<!-- Actions -->
		<div class="border-t border-yellow-200 pt-4 mt-4">
			<div class="flex flex-wrap gap-3">
				<!-- Ignore button -->
				<button
					on:click={() => handleAction('ignore')}
					disabled={isProcessing}
					class="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50"
				>
					<X size={14} />
					<span>Ignore</span>
				</button>

				<!-- Contact by email -->
				{#if canContactByEmail}
					<button
						on:click={showEmailAction}
						disabled={isProcessing}
						class="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
					>
						<Mail size={14} />
						<span>Contact by email</span>
					</button>
				{:else}
					<div class="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
							 title="No email address provided">
						<Mail size={14} />
						<span>Email unavailable</span>
					</div>
				{/if}

				<!-- Contact manually -->
				<button
					on:click={showManualAction}
					disabled={isProcessing}
					class="inline-flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
				>
					<UserPlus size={14} />
					<span>Contact manually</span>
				</button>
			</div>

			<!-- Action summary -->
			<div class="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
				<p class="text-xs text-blue-700 leading-relaxed">
					<strong>Available actions:</strong>
					Ignore if the person is not suitable, contact by email for an automated process,
					or add manually for a personalized contact.
				</p>
			</div>
		</div>
	</div>
</div>

<!-- Modal for email contact -->
{#if showEmailModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
			<h3 class="text-lg font-semibold mb-4">Contact by email</h3>
			<p class="text-sm text-gray-600 mb-4">
				An email will be sent to <strong>{safeRecommendation.recommended_email}</strong>
			</p>

			<div class="space-y-4">
				<!-- Section selection -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">
						Section (optional)
					</label>
					<select
						bind:value={selectedSection}
						class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						<option value={null}>Select a section</option>
						{#each sections as section}
							<option value={section.id}>{section.name}</option>
						{/each}
					</select>
				</div>

				<!-- Notes -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">
						Notes (optional)
					</label>
					<textarea
						bind:value={notes}
						rows="2"
						class="w-full px-3 py-2 border border-gray-300 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="Notes about this contact..."
					></textarea>
				</div>
			</div>

			<!-- Modal actions -->
			<div class="flex justify-end gap-2 mt-6">
				<button
					on:click={closeModals}
					disabled={isProcessing}
					class="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					on:click={confirmEmailAction}
					disabled={isProcessing}
					class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
				>
					{isProcessing ? 'Processing...' : 'Send email'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Modal for manual contact -->
{#if showManualModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
			<h3 class="text-lg font-semibold mb-4">Contact manually</h3>
			<p class="text-sm text-gray-600 mb-4">
				The person will be added to your recruitment list with "Not yet contacted" status
			</p>

			<div class="space-y-4">
				<!-- Section selection -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">
						Section (optional)
					</label>
					<select
						bind:value={selectedSection}
						class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						<option value={null}>Select a section</option>
						{#each sections as section}
							<option value={section.id}>{section.name}</option>
						{/each}
					</select>
				</div>

				<!-- Notes -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">
						Notes (optional)
					</label>
					<textarea
						bind:value={notes}
						rows="2"
						class="w-full px-3 py-2 border border-gray-300 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="Notes about this contact..."
					></textarea>
				</div>
			</div>

			<!-- Modal actions -->
			<div class="flex justify-end gap-2 mt-6">
				<button
					on:click={closeModals}
					disabled={isProcessing}
					class="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					on:click={confirmManualAction}
					disabled={isProcessing}
					class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
				>
					{isProcessing ? 'Processing...' : 'Add to recruitment'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
    .transition-all {
        transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }

    a:hover {
        text-decoration-line: underline;
        text-decoration-style: solid;
        text-decoration-thickness: 2px;
        text-underline-offset: 2px;
    }

    .animate-pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
        0%, 100% {
            opacity: 1;
        }
        50% {
            opacity: .5;
        }
    }
</style>