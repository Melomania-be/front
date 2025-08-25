<!-- src/lib/components/recruitment/RecruitmentContactsList.svelte -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte'
	import { browser } from '$app/environment'
	import { goto } from '$app/navigation'
	import SimpleFilterer from '$lib/components/SimpleFilterer.svelte'
	import {
		Mail,
		Phone,
		MessageCircle,
		Edit,
		Trash2,
		AlertCircle,
		CheckCircle,
		Clock,
		XCircle,
		UserCheck,
		Users,
		User,
		Filter,
		ChevronUp,
		ChevronDown,
		Plus,
		Settings
	} from 'lucide-svelte'
	import type { RecruitmentContact, RecruitmentSettings } from '$lib/types'
	import ContactStatusBadge from './ContactStatusBadge.svelte'
	import ContactActionButtons from './ContactActionButtons.svelte'

	export let projectId: string
	export let settings: RecruitmentSettings

	const dispatch = createEventDispatcher()

	let contacts: RecruitmentContact[] = []
	let meta: any = {}
	let options: any = {
		filter: '',
		limit: 50,
		page: 1,
		order: 'desc',
		orderBy: 'created_at'
	}

	let selectedContacts: number[] = []
	let showBulkActions = false
	let isMobile = false
	let isRefreshing = false
	let showFilters = false
	let sortColumn = ''
	let sortDirection = 'asc'
	let customStatuses: string[] = []
	let showStatusModal = false
	let newStatusName = ''
	let filters = {
		status: '',
		source: '',
		section: '',
		contacted_by: ''
	}

	$: dataHolder = {
		data: contacts,
		columns: ['id', 'created_at', 'contact_date'],
		notOrderedColumns: []
	}

	onMount(() => {
		checkMobile()
		window.addEventListener('resize', checkMobile)
		fetchContacts()
		loadCustomStatuses()

		return () => {
			window.removeEventListener('resize', checkMobile)
		}
	})

	function checkMobile() {
		if (browser) {
			isMobile = window.innerWidth <= 1000
		}
	}

	function loadCustomStatuses() {
		const saved = localStorage.getItem(`recruitment_custom_statuses_${projectId}`)
		if (saved) {
			try {
				customStatuses = JSON.parse(saved)
			} catch (error) {
				customStatuses = []
			}
		}
	}

	function saveCustomStatuses() {
		localStorage.setItem(`recruitment_custom_statuses_${projectId}`, JSON.stringify(customStatuses))
	}

	function addCustomStatus() {
		if (newStatusName.trim() && !customStatuses.includes(newStatusName.trim())) {
			customStatuses = [...customStatuses, newStatusName.trim()]
			saveCustomStatuses()
			newStatusName = ''
			showStatusModal = false
		}
	}

	function removeCustomStatus(status: string) {
		customStatuses = customStatuses.filter(s => s !== status)
		saveCustomStatuses()
	}

	function sortBy(column: string) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'
		} else {
			sortColumn = column
			sortDirection = 'asc'
		}
		applySorting()
	}

	function applySorting() {
		if (!sortColumn) return

		contacts.sort((a, b) => {
			let valueA = getSortValue(a, sortColumn)
			let valueB = getSortValue(b, sortColumn)

			if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1
			if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1
			return 0
		})

		contacts = [...contacts]
	}

	function getSortValue(contact: any, column: string): any {
		switch (column) {
			case 'name':
				return `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase()
			case 'status':
				return contact.status || ''
			case 'source':
				return getSourceDisplay(contact)
			case 'contact_date':
				return contact.contact_date ? new Date(contact.contact_date) : new Date(0)
			case 'section':
				return contact.section?.name || ''
			case 'contacted_by':
				return contact.contacted_by || ''
			default:
				return contact[column] || ''
		}
	}

	function applyFilters() {
		let filtered = [...contacts]

		if (filters.status) {
			filtered = filtered.filter(c => c.status === filters.status)
		}
		if (filters.source) {
			filtered = filtered.filter(c => c.source && c.source.toLowerCase().includes(filters.source.toLowerCase()))
		}
		if (filters.section) {
			filtered = filtered.filter(c => c.section?.name.toLowerCase().includes(filters.section.toLowerCase()))
		}
		if (filters.contacted_by) {
			filtered = filtered.filter(c => c.contacted_by && c.contacted_by.toLowerCase().includes(filters.contacted_by.toLowerCase()))
		}

		contacts = filtered
	}

	function clearFilters() {
		filters = {
			status: '',
			source: '',
			section: '',
			contacted_by: ''
		}
		fetchContacts()
	}

	async function fetchContacts() {
		if (isRefreshing) return
		isRefreshing = true

		let optionInUrls = `?page=${options.page}&limit=${options.limit}`
		optionInUrls += '&filter=' + encodeURIComponent(options.filter)
		optionInUrls += '&orderBy=' + options.orderBy
		optionInUrls += '&order=' + options.order

		if (browser) {
			goto(`/projects/${projectId}/management/recruitment${optionInUrls}`, {
				replaceState: true,
				noScroll: true
			})
		}

		try {
			const response = await fetch(`/api/projects/${projectId}/management/recruitment${optionInUrls}`)

			if (response.ok) {
				const data = await response.json()

				const safeContacts = Array.isArray(data.data) ? data.data.map(contact => ({
					...contact,
					first_name: contact.first_name || 'First name',
					last_name: contact.last_name || 'Last name',
					display_name: `${contact.first_name || 'First name'} ${contact.last_name || 'Last name'}`.trim(),
					contacted_by: contact.contacted_by || null
				})) : []

				contacts = safeContacts
				meta = data.meta || {}

				if (Object.values(filters).some(f => f !== '')) {
					applyFilters()
				}

				if (sortColumn) {
					applySorting()
				}
			} else {
				const errorText = await response.text()
				contacts = []
				meta = {}
			}
		} catch (error) {
			contacts = []
			meta = {}
		} finally {
			isRefreshing = false
		}
	}

	function refreshContactsList() {
		fetchContacts()
		dispatch('contactChange')
	}

	async function updateContactStatus(contactId: number, updateData: any) {
		try {
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/contacts/${contactId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...updateData,
					contact_date: updateData.status === 'awaiting_response' ? new Date().toISOString() : undefined
				})
			})

			if (response.ok) {
				refreshContactsList()
			} else {
				alert('Error updating status')
			}
		} catch (error) {
			alert('Error updating status')
		}
	}

	async function deleteContact(contactId: number) {
		if (!confirm('Are you sure you want to remove this contact from recruitment?')) {
			return
		}

		try {
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/contacts/${contactId}`, {
				method: 'DELETE'
			})

			if (response.ok) {
				refreshContactsList()
			} else {
				alert('Error deleting contact')
			}
		} catch (error) {
			alert('Error deleting contact')
		}
	}

	function toggleContactSelection(contactId: number) {
		if (selectedContacts.includes(contactId)) {
			selectedContacts = selectedContacts.filter(id => id !== contactId)
		} else {
			selectedContacts = [...selectedContacts, contactId]
		}
		showBulkActions = selectedContacts.length > 0
	}

	function selectAllContacts() {
		selectedContacts = contacts.map(c => c.id)
		showBulkActions = true
	}

	function clearSelection() {
		selectedContacts = []
		showBulkActions = false
	}

	async function bulkUpdateStatus(status: string) {
		if (!selectedContacts || selectedContacts.length === 0) {
			alert('No contact selected')
			return
		}

		try {
			const promises = selectedContacts.map(contactId =>
				updateContactStatus(contactId, { status })
			)
			await Promise.all(promises)
			clearSelection()
		} catch (error) {
			alert('Error updating contacts')
		}
	}

	async function sendBulkEmails() {
		if (!contacts || !Array.isArray(contacts)) {
			alert('Error: contacts list not available')
			return
		}

		if (!selectedContacts || selectedContacts.length === 0) {
			alert('No contact selected')
			return
		}

		const emailContacts = contacts.filter(c =>
			c &&
			selectedContacts.includes(c.id) &&
			c.email &&
			c.email.trim().length > 0
		)

		if (emailContacts.length === 0) {
			alert('No selected contact has a valid email address')
			return
		}

		const confirmMessage = `Send recruitment email to ${emailContacts.length} contact(s)?`

		if (!confirm(confirmMessage)) {
			return
		}

		try {
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/send-emails`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contact_ids: emailContacts.map(c => c.id)
				})
			})

			if (response.ok) {
				const result = await response.json()

				if (result.success) {
					const message = result.simulation_mode ?
						`SIMULATION: ${result.summary?.sent || 0} email(s) would have been sent.\nStatuses have been updated.` :
						`${result.summary?.sent || 0} emails sent successfully out of ${emailContacts.length}`

					alert(message)
				} else {
					alert(`Emails processed: ${result.sent?.length || 0}, Failed: ${result.failed?.length || 0}`)
				}

				refreshContactsList()
				clearSelection()
			} else {
				const errorData = await response.json()
				alert(`Error sending emails: ${errorData.error || 'Unknown error'}`)
			}
		} catch (error) {
			alert('Error sending emails')
		}
	}

	export function refreshContacts() {
		refreshContactsList()
	}

	function getStatusColor(status: string): string {
		const colors = {
			'not_yet_contacted': 'bg-gray-100 text-gray-800',
			'awaiting_response': 'bg-blue-100 text-blue-800',
			'to_follow_up': 'bg-yellow-100 text-yellow-800',
			'not_available': 'bg-red-100 text-red-800',
			'pending_validation': 'bg-purple-100 text-purple-800',
			'cancelled': 'bg-red-100 text-red-800',
			'recruited': 'bg-green-100 text-green-800'
		}
		return colors[status] || 'bg-orange-100 text-orange-800'
	}

	function getStatusIcon(status: string) {
		const icons = {
			'not_yet_contacted': AlertCircle,
			'awaiting_response': Clock,
			'to_follow_up': AlertCircle,
			'not_available': XCircle,
			'pending_validation': Clock,
			'cancelled': XCircle,
			'recruited': CheckCircle
		}
		return icons[status] || AlertCircle
	}

	function getStatusLabel(status: string): string {
		if (customStatuses.includes(status)) {
			return status
		}

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

	function getDaysSinceContact(contactDate: string | null): number | null {
		if (!contactDate) return null
		try {
			const diffTime = Date.now() - new Date(contactDate).getTime()
			return Math.floor(diffTime / (1000 * 60 * 60 * 24))
		} catch (error) {
			return null
		}
	}

	function shouldHighlightFollowUp(contact: RecruitmentContact): boolean {
		if (!contact || contact.status !== 'awaiting_response' || !contact.contact_date || !settings) return false
		const days = getDaysSinceContact(contact.contact_date)
		return days !== null && days >= settings.follow_up_days
	}

	function formatContactDate(contactDate: string | null): string {
		if (!contactDate) return '-'

		if (typeof contactDate === 'string' && contactDate.match(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/)) {
			return contactDate
		}

		try {
			let date: Date

			if (typeof contactDate === 'string') {
				date = new Date(contactDate)
			} else {
				date = new Date(contactDate)
			}

			if (isNaN(date.getTime())) {
				console.warn('Invalid date received:', contactDate)
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
			console.error('Error formatting date:', error, 'Input:', contactDate)
			return 'Invalid date'
		}
	}

	$: safeContacts = Array.isArray(contacts) ? contacts.filter(c => c && c.id) : []
	$: allStatuses = [
		'not_yet_contacted',
		'awaiting_response',
		'to_follow_up',
		'not_available',
		'pending_validation',
		'cancelled',
		'recruited',
		...customStatuses
	]

	function getSortIcon(column: string) {
		if (sortColumn !== column) return null
		return sortDirection === 'asc' ? ChevronUp : ChevronDown
	}

	function handleQuickStatusUpdate(contactId: number, newStatus: string) {
		updateContactStatus(contactId, { status: newStatus })
	}

	// FONCTION PRINCIPALE POUR AFFICHER LA SOURCE AVEC RECOMMANDEUR
	function getSourceDisplay(contact: RecruitmentContact): string {
		// Si c'est une recommandation et qu'on a le nom du recommandeur
		if (contact.recommended_by) {
			return contact.recommended_by
		}

		// Si c'est une recommandation mais anonyme
		if (contact.source === 'recommendation') {
			return 'Recommended (anonymous)'
		}

		// Sinon, afficher la source normale
		return contact.source === 'database' ? 'Database' :
			contact.source === 'manual' ? 'Manual' :
				contact.source || 'Other'
	}

	function getSourceStyle(contact: RecruitmentContact): string {
		if (contact.recommended_by || contact.source === 'recommendation') {
			return 'bg-purple-100 text-purple-700 border-purple-200'
		}

		return contact.source === 'database' ? 'bg-blue-100 text-blue-700 border-blue-200' :
			contact.source === 'manual' ? 'bg-gray-100 text-gray-700 border-gray-200' :
				'bg-green-100 text-green-700 border-green-200'
	}

	function getSourceIcon(contact: RecruitmentContact) {
		if (contact.recommended_by || contact.source === 'recommendation') {
			return UserCheck
		}
		return null
	}
</script>

<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
	<div class="flex items-center space-x-3 mb-4">
		<div class="flex items-center justify-center w-10 h-10 bg-[#6B9AD9] rounded-[8px]">
			<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
			</svg>
		</div>
		<div class="flex-1">
			<h1 class="font-bold text-lg">RECRUITMENT CONTACTS ({safeContacts.length})</h1>
		</div>

		<!-- Filter and Status Management -->
		<div class="flex gap-2 {isMobile ? 'flex-col w-full' : ''}">
			<button
				on:click={() => showFilters = !showFilters}
				class="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 font-semibold flex items-center gap-1"
				disabled={isRefreshing}
			>
				<Filter size={14} />
				Filters
			</button>

			<button
				on:click={() => showStatusModal = true}
				class="px-3 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 font-semibold flex items-center gap-1"
				disabled={isRefreshing}
			>
				<Plus size={14} />
				Statuses
			</button>

			{#if safeContacts.length > 0}
				<button
					on:click={selectAllContacts}
					class="px-3 py-2 text-sm bg-[#6B9AD9] text-white rounded hover:bg-blue-600 font-semibold"
					disabled={isRefreshing}
				>
					Select all
				</button>
				{#if selectedContacts.length > 0}
					<button
						on:click={clearSelection}
						class="px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 font-semibold"
					>
						Deselect ({selectedContacts.length})
					</button>
				{/if}
			{/if}
		</div>
	</div>

	<!-- Filters Panel -->
	{#if showFilters}
		<div class="bg-gray-50 border-2 border-gray-200 rounded-[10px] p-4 mb-4">
			<div class="flex items-center justify-between mb-3">
				<h3 class="font-semibold text-gray-800">Filters</h3>
				<button
					on:click={clearFilters}
					class="text-sm text-blue-600 hover:text-blue-800 underline"
				>
					Clear all
				</button>
			</div>

			<div class="grid grid-cols-1 {isMobile ? '' : 'md:grid-cols-4'} gap-3">
				<div>
					<label class="block text-xs font-medium text-gray-700 mb-1">Status</label>
					<select
						bind:value={filters.status}
						on:change={applyFilters}
						class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
					>
						<option value="">All statuses</option>
						{#each allStatuses as status}
							<option value={status}>{getStatusLabel(status)}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="block text-xs font-medium text-gray-700 mb-1">Source</label>
					<input
						type="text"
						bind:value={filters.source}
						on:input={applyFilters}
						placeholder="Filter by source..."
						class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
					/>
				</div>

				<div>
					<label class="block text-xs font-medium text-gray-700 mb-1">Section</label>
					<input
						type="text"
						bind:value={filters.section}
						on:input={applyFilters}
						placeholder="Filter by section..."
						class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
					/>
				</div>

				<div>
					<label class="block text-xs font-medium text-gray-700 mb-1">Contacted by</label>
					<input
						type="text"
						bind:value={filters.contacted_by}
						on:input={applyFilters}
						placeholder="Filter by contact person..."
						class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
					/>
				</div>
			</div>
		</div>
	{/if}

	{#if isRefreshing}
		<div class="p-4 text-center">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B9AD9] mx-auto mb-2"></div>
			<p class="text-sm text-gray-600">Updating...</p>
		</div>
	{/if}

	<!-- Bulk actions -->
	{#if showBulkActions}
		<div class="mb-4 bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
			<div class="flex items-center space-x-3 mb-4">
				<div class="flex items-center justify-center w-10 h-10 bg-[#6B9AD9] rounded-[8px]">
					<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
					</svg>
				</div>
				<div>
					<h1 class="font-bold text-lg">BULK ACTIONS</h1>
					<p class="text-sm text-gray-600 font-medium">{selectedContacts.length} contact(s) selected</p>
				</div>
			</div>

			<div class="bg-blue-50 border-2 border-blue-200 rounded-[8px] p-4">
				<div class="flex flex-wrap gap-2">
					<button
						on:click={sendBulkEmails}
						class="px-3 py-2 text-sm bg-blue-600 text-white rounded-[6px] hover:bg-blue-700 font-semibold flex items-center space-x-1"
						disabled={isRefreshing}
					>
						<Mail size={14} />
						<span>Send emails</span>
					</button>
					{#each allStatuses as status}
						<button
							on:click={() => bulkUpdateStatus(status)}
							class="px-3 py-2 text-sm rounded-[6px] font-semibold {getStatusColor(status)} border hover:opacity-80"
							disabled={isRefreshing}
						>
							{getStatusLabel(status)}
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	{#if safeContacts.length === 0 && !isRefreshing}
		<div class="text-center py-12">
			<svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
			</svg>
			<h3 class="mt-2 text-sm font-medium text-gray-900">No recruitment contacts</h3>
			<p class="mt-1 text-sm text-gray-500">Start by adding contacts manually or importing from the database.</p>
		</div>
	{:else}
		<SimpleFilterer
			bind:data={dataHolder}
			bind:meta
			bind:options
			uniqueUrl={`/projects/${projectId}/management/recruitment`}
			on:optionsUpdated={fetchContacts}
		>
			{#if isMobile}
				<!-- Mobile version with cards -->
				<div class="space-y-3">
					{#each safeContacts as contact (contact.id)}
						<div class="border-2 border-[#8C8C8C] rounded-[10px] p-4 hover:bg-gray-50 {shouldHighlightFollowUp(contact) ? 'bg-yellow-50' : ''} {contact.is_duplicate ? 'bg-orange-50' : ''}">

							<!-- Header with selection and name -->
							<div class="flex items-start justify-between mb-3">
								<div class="flex items-center space-x-3 flex-1 min-w-0">
									<input
										type="checkbox"
										checked={selectedContacts.includes(contact.id)}
										on:change={() => toggleContactSelection(contact.id)}
										class="rounded mt-1"
										disabled={isRefreshing}
									/>
									<div class="w-10 h-10 bg-[#6B9AD9] rounded-[8px] flex items-center justify-center flex-shrink-0">
										<span class="text-white font-bold text-sm">
											{contact.first_name?.charAt(0)}{contact.last_name?.charAt(0)}
										</span>
									</div>
									<div class="flex-1 min-w-0">
										<h3 class="font-bold text-gray-900 truncate">
											{contact.first_name || 'First name'} {contact.last_name || 'Last name'}
										</h3>
										<p class="text-sm text-blue-600 font-medium">
											{contact.section?.name || 'No section defined'}
										</p>
									</div>
								</div>
								<!-- Quick status update dropdown in mobile -->
								<div class="relative">
									<select
										on:change={(e) => handleQuickStatusUpdate(contact.id, e.target.value)}
										value={contact.status}
										class="text-xs px-2 py-1 border border-gray-300 rounded {getStatusColor(contact.status)} font-medium"
									>
										{#each allStatuses as status}
											<option value={status}>{getStatusLabel(status)}</option>
										{/each}
									</select>
								</div>
							</div>

							<!-- Contact information -->
							<div class="mb-3">
								<div class="bg-white border-2 border-[#8C8C8C] rounded-[8px] p-3">
									<div class="flex items-center space-x-3 mb-3">
										<div class="flex items-center justify-center w-8 h-8 bg-[#6B9AD9] rounded-[6px]">
											<Mail size={14} class="text-white" />
										</div>
										<h3 class="font-bold text-sm text-gray-900 uppercase">CONTACT</h3>
									</div>
									<div class="bg-gray-50 border-2 border-gray-200 rounded-[6px] p-3 space-y-2">
										{#if contact.email}
											<div class="flex items-center text-sm text-gray-700 break-all">
												<Mail size={12} class="mr-2 flex-shrink-0 text-blue-600" />
												<span class="font-medium">{contact.email}</span>
											</div>
										{/if}
										{#if contact.phone}
											<div class="flex items-center text-sm text-gray-700">
												<Phone size={12} class="mr-2 flex-shrink-0 text-green-600" />
												<span class="font-medium">{contact.phone}</span>
											</div>
										{/if}
										{#if contact.messenger}
											<div class="flex items-center text-sm text-gray-700">
												<MessageCircle size={12} class="mr-2 flex-shrink-0 text-purple-600" />
												<span class="font-medium">{contact.messenger}</span>
											</div>
										{/if}
										{#if !contact.email && !contact.phone && !contact.messenger}
											<p class="text-sm text-gray-500 italic">No contact information available</p>
										{/if}
									</div>
								</div>
							</div>

							<!-- Source info avec nom du recommandeur (MOBILE) -->
							<div class="mb-3">
								<div class="bg-white border-2 border-[#8C8C8C] rounded-[8px] p-3">
									<div class="flex items-center space-x-3 mb-3">
										<div class="flex items-center justify-center w-8 h-8 bg-[#6B9AD9] rounded-[6px]">
											{#if getSourceIcon(contact)}
												<svelte:component this={getSourceIcon(contact)} size={14} class="text-white" />
											{:else}
												<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z"></path>
												</svg>
											{/if}
										</div>
										<h3 class="font-bold text-sm text-gray-900 uppercase">SOURCE</h3>
									</div>
									<div class="space-y-2">
										{#if contact.is_duplicate}
											<div class="bg-orange-50 border-2 border-orange-200 rounded-[6px] p-2">
												<span class="text-xs text-orange-700 font-bold">Potential duplicate</span>
											</div>
										{/if}
										<div class="{getSourceStyle(contact)} border-2 rounded-[6px] p-2">
											<span class="text-xs font-bold">{getSourceDisplay(contact)}</span>
										</div>
									</div>
								</div>
							</div>

							<!-- Status & timing -->
							<div class="mb-3">
								<div class="bg-white border-2 border-[#8C8C8C] rounded-[8px] p-3">
									<div class="flex items-center space-x-3 mb-3">
										<div class="flex items-center justify-center w-8 h-8 bg-[#6B9AD9] rounded-[6px]">
											<Clock size={14} class="text-white" />
										</div>
										<h3 class="font-bold text-sm text-gray-900 uppercase">STATUS & TIMING</h3>
									</div>
									<div class="grid grid-cols-1 gap-3">
										<div class="bg-gray-50 border-2 border-gray-300 rounded-[6px] p-3">
											<div class="flex items-center mb-2">
												<svg class="w-3 h-3 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
												</svg>
												<span class="text-xs font-bold text-gray-600 uppercase">Contact Date</span>
											</div>
											{#if contact.contact_date}
												<p class="text-sm font-bold text-gray-900">
													{formatContactDate(contact.contact_date)}
												</p>
												{#if getDaysSinceContact(contact.contact_date)}
													<p class="text-xs text-gray-500 mt-1">
														{getDaysSinceContact(contact.contact_date)} day(s) ago
													</p>
												{/if}
											{:else}
												<p class="text-sm font-bold text-gray-400">Not contacted</p>
											{/if}
										</div>
									</div>
								</div>
							</div>

							<!-- Contacted by -->
							{#if contact.contacted_by}
								<div class="mb-3 p-3 bg-blue-50 border-2 border-blue-200 rounded-[8px]">
									<div class="flex items-center">
										<User size={14} class="text-blue-600 mr-2" />
										<span class="text-sm font-bold text-blue-700">Contacted by: {contact.contacted_by}</span>
									</div>
								</div>
							{/if}

							<!-- Actions -->
							<div class="pt-3 border-t-2 border-gray-200">
								<ContactActionButtons
									{contact}
									on:updateStatus={(e) => updateContactStatus(contact.id, e.detail)}
									on:delete={() => deleteContact(contact.id)}
								/>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<!-- Desktop table version -->
				<div class="w-full overflow-x-auto">
					<table class="w-full min-w-[1200px] text-sm text-left text-gray-500">
						<thead class="bg-gray-100 text-xs text-gray-700 uppercase">
						<tr>
							<th class="px-4 py-3">
								<input
									type="checkbox"
									on:change={(e) => e.target.checked ? selectAllContacts() : clearSelection()}
									checked={selectedContacts.length === safeContacts.length && safeContacts.length > 0}
									class="rounded"
									disabled={isRefreshing}
								/>
							</th>
							<th class="px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors" on:click={() => sortBy('name')}>
								<div class="flex items-center gap-1">
									Contact
									<svelte:component this={getSortIcon('name')} size={12} />
								</div>
							</th>
							<th class="px-4 py-3">Section</th>
							<th class="px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors" on:click={() => sortBy('status')}>
								<div class="flex items-center gap-1">
									Status
									<svelte:component this={getSortIcon('status')} size={12} />
								</div>
							</th>
							<th class="px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors" on:click={() => sortBy('contact_date')}>
								<div class="flex items-center gap-1">
									Contact date
									<svelte:component this={getSortIcon('contact_date')} size={12} />
								</div>
							</th>
							<th class="px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors" on:click={() => sortBy('contacted_by')}>
								<div class="flex items-center gap-1">
									Contacted by
									<svelte:component this={getSortIcon('contacted_by')} size={12} />
								</div>
							</th>
							<th class="px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors" on:click={() => sortBy('source')}>
								<div class="flex items-center gap-1">
									Source
									<svelte:component this={getSortIcon('source')} size={12} />
								</div>
							</th>
							<th class="px-4 py-3">Actions</th>
						</tr>
						</thead>
						<tbody>
						{#each safeContacts as contact (contact.id)}
							<tr class="border-b hover:bg-gray-50 {shouldHighlightFollowUp(contact) ? 'bg-yellow-50' : ''} {contact.is_duplicate ? 'bg-orange-50' : ''}">
								<td class="px-4 py-3">
									<input
										type="checkbox"
										checked={selectedContacts.includes(contact.id)}
										on:change={() => toggleContactSelection(contact.id)}
										class="rounded"
										disabled={isRefreshing}
									/>
								</td>

								<td class="px-4 py-3">
									<div class="flex items-center space-x-3">
										<div class="w-8 h-8 bg-[#6B9AD9] rounded-[6px] flex items-center justify-center">
											<span class="text-white font-bold text-xs">
												{contact.first_name?.charAt(0)}{contact.last_name?.charAt(0)}
											</span>
										</div>
										<div>
											<div class="font-medium text-gray-900">
												{contact.first_name || 'First name'} {contact.last_name || 'Last name'}
											</div>
											<div class="text-sm text-gray-500 space-y-1">
												{#if contact.email}
													<div class="flex items-center gap-1">
														<Mail size={12} />
														{contact.email}
													</div>
												{/if}
												{#if contact.phone}
													<div class="flex items-center gap-1">
														<Phone size={12} />
														{contact.phone}
													</div>
												{/if}
												{#if contact.messenger}
													<div class="flex items-center gap-1">
														<MessageCircle size={12} />
														{contact.messenger}
													</div>
												{/if}
											</div>
											{#if contact.is_duplicate}
												<div class="text-xs text-orange-600 font-medium mt-1">
													Potential duplicate
												</div>
											{/if}
										</div>
									</div>
								</td>

								<td class="px-4 py-3">
									<span class="text-blue-600 font-medium">
										{contact.section?.name || '-'}
									</span>
								</td>

								<td class="px-4 py-3">
									<!-- Quick status update dropdown -->
									<select
										on:change={(e) => handleQuickStatusUpdate(contact.id, e.target.value)}
										value={contact.status}
										class="text-xs px-2 py-1 border border-gray-300 rounded {getStatusColor(contact.status)} font-medium min-w-[120px]"
									>
										{#each allStatuses as status}
											<option value={status}>{getStatusLabel(status)}</option>
										{/each}
									</select>
									{#if shouldHighlightFollowUp(contact)}
										<div class="text-xs text-yellow-600 font-medium mt-1">Follow up needed</div>
									{/if}
								</td>

								<td class="px-4 py-3">
									{#if contact.contact_date}
										<div class="text-sm">
											{formatContactDate(contact.contact_date)}
											{#if getDaysSinceContact(contact.contact_date)}
												<div class="text-xs text-gray-500">
													{getDaysSinceContact(contact.contact_date)} day(s) ago
												</div>
											{/if}
										</div>
									{:else}
										<span class="text-gray-400">-</span>
									{/if}
								</td>

								<td class="px-4 py-3">
									{#if contact.contacted_by}
										<div class="bg-blue-50 border border-blue-200 rounded-[4px] p-2">
											<div class="flex items-center gap-1">
												<User size={12} class="text-blue-600" />
												<span class="text-sm font-medium text-blue-700">{contact.contacted_by}</span>
											</div>
										</div>
									{:else}
										<div class="bg-gray-50 border border-gray-200 rounded-[4px] p-2">
											<span class="text-gray-400 text-sm">Not defined</span>
										</div>
									{/if}
								</td>

								<!-- COLONNE SOURCE MODIFIÉE POUR AFFICHER LE RECOMMANDEUR -->
								<td class="px-4 py-3">
									<div class="space-y-1">
										<div class="inline-block">
											<span class="text-xs px-2 py-1 rounded-[4px] border font-bold {getSourceStyle(contact)}">
												{#if getSourceIcon(contact)}
													<svelte:component this={getSourceIcon(contact)} size={12} class="inline mr-1" />
												{/if}
												{getSourceDisplay(contact)}
											</span>
										</div>
									</div>
								</td>

								<td class="px-4 py-3">
									<div class="bg-white border border-[#8C8C8C] rounded-[6px] p-2">
										<div class="flex items-center space-x-2 mb-2">
											<div class="flex items-center justify-center w-6 h-6 bg-[#6B9AD9] rounded-[4px]">
												<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
												</svg>
											</div>
											<span class="text-xs font-bold text-gray-700 uppercase">Actions</span>
										</div>
										<ContactActionButtons
											{contact}
											on:updateStatus={(e) => updateContactStatus(contact.id, e.detail)}
											on:delete={() => deleteContact(contact.id)}
										/>
									</div>
								</td>
							</tr>
						{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</SimpleFilterer>
	{/if}
</div>

<!-- Modal pour gérer les statuts personnalisés -->
{#if showStatusModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
			<div class="flex items-center justify-between p-6 border-b">
				<div class="flex items-center gap-2">
					<Settings class="text-[#6B9AD9]" size={20} />
					<h3 class="text-lg font-semibold">Manage Custom Statuses</h3>
				</div>
				<button
					on:click={() => showStatusModal = false}
					class="text-gray-400 hover:text-gray-600"
				>
					<X size={20} />
				</button>
			</div>

			<div class="p-6">
				<!-- Add new status -->
				<div class="mb-4">
					<label class="block text-sm font-medium text-gray-700 mb-2">
						Add new custom status
					</label>
					<div class="flex gap-2">
						<input
							type="text"
							bind:value={newStatusName}
							placeholder="Status name..."
							class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							on:keydown={(e) => e.key === 'Enter' && addCustomStatus()}
						/>
						<button
							on:click={addCustomStatus}
							disabled={!newStatusName.trim()}
							class="px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] disabled:opacity-50"
						>
							Add
						</button>
					</div>
				</div>

				<!-- Existing custom statuses -->
				<div class="mb-4">
					<h4 class="text-sm font-medium text-gray-700 mb-2">Custom statuses:</h4>
					{#if customStatuses.length === 0}
						<p class="text-sm text-gray-500 italic">No custom statuses defined</p>
					{:else}
						<div class="space-y-2">
							{#each customStatuses as status}
								<div class="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
									<span class="text-sm font-medium">{status}</span>
									<button
										on:click={() => removeCustomStatus(status)}
										class="text-red-600 hover:text-red-800"
									>
										<X size={16} />
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Default statuses info -->
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
					<h4 class="text-sm font-medium text-blue-900 mb-1">Default statuses:</h4>
					<p class="text-xs text-blue-700">
						Not yet contacted, Awaiting response, Follow up, Not available, Pending validation, Cancelled, Recruited
					</p>
				</div>
			</div>

			<div class="flex justify-end gap-3 p-6 border-t bg-gray-50">
				<button
					type="button"
					on:click={() => showStatusModal = false}
					class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}