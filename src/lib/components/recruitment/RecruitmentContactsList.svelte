<!-- src/lib/components/recruitment/RecruitmentContactsList.svelte - Version unifiée avec design moderne -->
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
		User
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

	$: dataHolder = {
		data: contacts,
		columns: ['id', 'created_at', 'contact_date'],
		notOrderedColumns: []
	}

	onMount(() => {
		checkMobile()
		window.addEventListener('resize', checkMobile)
		fetchContacts()

		return () => {
			window.removeEventListener('resize', checkMobile)
		}
	})

	function checkMobile() {
		if (browser) {
			isMobile = window.innerWidth <= 1000
		}
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
					first_name: contact.first_name || 'Prénom',
					last_name: contact.last_name || 'Nom',
					display_name: `${contact.first_name || 'Prénom'} ${contact.last_name || 'Nom'}`.trim(),
					contacted_by: contact.contacted_by || null
				})) : []

				contacts = safeContacts
				meta = data.meta || {}
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
				alert('Erreur lors de la mise à jour du statut')
			}
		} catch (error) {
			alert('Erreur lors de la mise à jour du statut')
		}
	}

	async function deleteContact(contactId: number) {
		if (!confirm('Êtes-vous sûr de vouloir supprimer ce contact du recrutement ?')) {
			return
		}

		try {
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/contacts/${contactId}`, {
				method: 'DELETE'
			})

			if (response.ok) {
				refreshContactsList()
			} else {
				alert('Erreur lors de la suppression')
			}
		} catch (error) {
			alert('Erreur lors de la suppression')
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
			alert('Aucun contact sélectionné')
			return
		}

		try {
			const promises = selectedContacts.map(contactId =>
				updateContactStatus(contactId, { status })
			)
			await Promise.all(promises)
			clearSelection()
		} catch (error) {
			alert('Erreur lors de la mise à jour groupée')
		}
	}

	async function sendBulkEmails() {
		if (!contacts || !Array.isArray(contacts)) {
			alert('Erreur: liste des contacts non disponible')
			return
		}

		if (!selectedContacts || selectedContacts.length === 0) {
			alert('Aucun contact sélectionné')
			return
		}

		const emailContacts = contacts.filter(c =>
			c &&
			selectedContacts.includes(c.id) &&
			c.email &&
			c.email.trim().length > 0
		)

		if (emailContacts.length === 0) {
			alert('Aucun contact sélectionné n\'a d\'adresse email valide')
			return
		}

		const confirmMessage = `SIMULATION : Envoyer un email de recrutement à ${emailContacts.length} contact(s) ?\n\n⚠️ En mode développement, les emails seront simulés (pas d'envoi réel).`

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
						`SIMULATION : ${result.summary?.sent || 0} email(s) auraient été envoyés.\nLes status ont été mis à jour.` :
						`${result.summary?.sent || 0} emails envoyés avec succès sur ${emailContacts.length}`

					alert(message)
				} else {
					alert(`Emails traités: ${result.sent?.length || 0}, Échecs: ${result.failed?.length || 0}`)
				}

				refreshContactsList()
				clearSelection()
			} else {
				const errorData = await response.json()
				alert(`Erreur lors de l'envoi des emails: ${errorData.error || 'Erreur inconnue'}`)
			}
		} catch (error) {
			alert('Erreur lors de l\'envoi des emails')
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
			'cancelled': 'bg-gray-100 text-gray-500',
			'recruited': 'bg-green-100 text-green-800'
		}
		return colors[status] || 'bg-gray-100 text-gray-800'
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
		try {
			const date = new Date(contactDate)
			if (isNaN(date.getTime())) {
				return 'Date invalide'
			}
			return date.toLocaleDateString('fr-FR')
		} catch (error) {
			return 'Date invalide'
		}
	}

	$: safeContacts = Array.isArray(contacts) ? contacts.filter(c => c && c.id) : []
</script>

<!-- Design Unifié avec le même style que All Auditions -->
<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
	<div class="flex items-center space-x-3 mb-4">
		<div class="flex items-center justify-center w-10 h-10 bg-[#6B9AD9] rounded-[8px]">
			<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
			</svg>
		</div>
		<div class="flex-1">
			<h1 class="font-bold text-lg">CONTACTS DE RECRUTEMENT ({safeContacts.length})</h1>
		</div>

		{#if safeContacts.length > 0}
			<div class="flex gap-2 {isMobile ? 'flex-col w-full' : ''}">
				<button
					on:click={selectAllContacts}
					class="px-3 py-2 text-sm bg-[#6B9AD9] text-white rounded hover:bg-blue-600 font-semibold"
					disabled={isRefreshing}
				>
					Tout sélectionner
				</button>
				{#if selectedContacts.length > 0}
					<button
						on:click={clearSelection}
						class="px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 font-semibold"
					>
						Désélectionner ({selectedContacts.length})
					</button>
				{/if}
			</div>
		{/if}
	</div>

	{#if isRefreshing}
		<div class="p-4 text-center">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B9AD9] mx-auto mb-2"></div>
			<p class="text-sm text-gray-600">Mise à jour en cours...</p>
		</div>
	{/if}

	<!-- Actions groupées avec le style AUDITION DETAILS -->
	{#if showBulkActions}
		<div class="mb-4 bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
			<div class="flex items-center space-x-3 mb-4">
				<div class="flex items-center justify-center w-10 h-10 bg-[#6B9AD9] rounded-[8px]">
					<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
					</svg>
				</div>
				<div>
					<h1 class="font-bold text-lg">ACTIONS GROUPÉES</h1>
					<p class="text-sm text-gray-600 font-medium">{selectedContacts.length} contact(s) sélectionné(s)</p>
				</div>
			</div>

			<div class="bg-blue-50 border-2 border-blue-200 rounded-[8px] p-4">
				<div class="grid grid-cols-2 {isMobile ? 'gap-2' : 'md:grid-cols-4 gap-3'}">
					<button
						on:click={sendBulkEmails}
						class="px-3 py-2 text-sm bg-blue-600 text-white rounded-[6px] hover:bg-blue-700 font-semibold flex items-center justify-center space-x-1"
						disabled={isRefreshing}
					>
						<Mail size={14} />
						<span>Envoyer emails</span>
					</button>
					<button
						on:click={() => bulkUpdateStatus('awaiting_response')}
						class="px-3 py-2 text-sm bg-yellow-600 text-white rounded-[6px] hover:bg-yellow-700 font-semibold"
						disabled={isRefreshing}
					>
						En attente
					</button>
					<button
						on:click={() => bulkUpdateStatus('not_available')}
						class="px-3 py-2 text-sm bg-red-600 text-white rounded-[6px] hover:bg-red-700 font-semibold"
						disabled={isRefreshing}
					>
						Non disponible
					</button>
					<button
						on:click={() => bulkUpdateStatus('recruited')}
						class="px-3 py-2 text-sm bg-green-600 text-white rounded-[6px] hover:bg-green-700 font-semibold"
						disabled={isRefreshing}
					>
						Recruté
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if safeContacts.length === 0 && !isRefreshing}
		<div class="text-center py-12">
			<svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
			</svg>
			<h3 class="mt-2 text-sm font-medium text-gray-900">Aucun contact de recrutement</h3>
			<p class="mt-1 text-sm text-gray-500">Commencez par ajouter des contacts manuellement ou en important depuis la base de données.</p>
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
				<!-- Version Mobile avec Cards Design Unifié -->
				<div class="space-y-3">
					{#each safeContacts as contact (contact.id)}
						<div class="border-2 border-[#8C8C8C] rounded-[10px] p-4 hover:bg-gray-50 {shouldHighlightFollowUp(contact) ? 'bg-yellow-50' : ''} {contact.is_duplicate ? 'bg-orange-50' : ''}">

							<!-- Header avec Sélection et Nom -->
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
											{contact.first_name || 'Prénom'} {contact.last_name || 'Nom'}
										</h3>
										<p class="text-sm text-blue-600 font-medium">
											{contact.section?.name || 'Section non définie'}
										</p>
									</div>
								</div>
								<ContactStatusBadge
									status={contact.status}
									shouldFollowUp={shouldHighlightFollowUp(contact)}
								/>
							</div>

							<!-- Informations de Contact avec le style AUDITION DETAILS -->
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
											<p class="text-sm text-gray-500 italic">Aucune information de contact disponible</p>
										{/if}
									</div>
								</div>
							</div>

							<!-- Badges et Informations avec le style AUDITION DETAILS -->
							<div class="mb-3">
								<div class="bg-white border-2 border-[#8C8C8C] rounded-[8px] p-3">
									<div class="flex items-center space-x-3 mb-3">
										<div class="flex items-center justify-center w-8 h-8 bg-[#6B9AD9] rounded-[6px]">
											<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z"></path>
											</svg>
										</div>
										<h3 class="font-bold text-sm text-gray-900 uppercase">INFORMATIONS</h3>
									</div>
									<div class="space-y-2">
										{#if contact.is_duplicate}
											<div class="bg-orange-50 border-2 border-orange-200 rounded-[6px] p-2">
												<span class="text-xs text-orange-700 font-bold">⚠️ Doublon potentiel</span>
											</div>
										{/if}
										{#if contact.recommended_by}
											<div class="bg-blue-50 border-2 border-blue-200 rounded-[6px] p-2">
												<span class="text-xs text-blue-700 font-bold">Recommandé par {contact.recommended_by}</span>
											</div>
										{/if}
										<div class="bg-gray-50 border-2 border-gray-200 rounded-[6px] p-2">
											<span class="text-xs font-bold {
												contact.source === 'database' ? 'text-blue-700' :
												contact.source === 'manual' ? 'text-gray-700' :
												contact.source === 'recommendation' ? 'text-purple-700' :
												'text-green-700'
											}">
												Source: {contact.source === 'database' ? 'Base de données' :
												contact.source === 'manual' ? 'Manuel' :
													contact.source === 'recommendation' ? 'Recommandation' :
														contact.source || 'Autre'}
											</span>
										</div>
									</div>
								</div>
							</div>

							<!-- Grille d'Informations avec le style AUDITION DETAILS -->
							<div class="mb-3">
								<div class="bg-white border-2 border-[#8C8C8C] rounded-[8px] p-3">
									<div class="flex items-center space-x-3 mb-3">
										<div class="flex items-center justify-center w-8 h-8 bg-[#6B9AD9] rounded-[6px]">
											<Clock size={14} class="text-white" />
										</div>
										<h3 class="font-bold text-sm text-gray-900 uppercase">STATUT & TIMING</h3>
									</div>
									<div class="grid grid-cols-2 gap-3">
										<div class="bg-gray-50 border-2 border-gray-300 rounded-[6px] p-3">
											<div class="flex items-center mb-2">
												<svg class="w-3 h-3 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
												</svg>
												<span class="text-xs font-bold text-gray-600 uppercase">Méthode</span>
											</div>
											<p class="text-sm font-bold text-gray-900 capitalize">
												{contact.contact_method || 'Non définie'}
											</p>
										</div>
										<div class="bg-gray-50 border-2 border-gray-300 rounded-[6px] p-3">
											<div class="flex items-center mb-2">
												<svg class="w-3 h-3 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
												</svg>
												<span class="text-xs font-bold text-gray-600 uppercase">Contact</span>
											</div>
											{#if contact.contact_date}
												<p class="text-sm font-bold text-gray-900">
													{formatContactDate(contact.contact_date)}
												</p>
												{#if getDaysSinceContact(contact.contact_date)}
													<p class="text-xs text-gray-500 mt-1">
														Il y a {getDaysSinceContact(contact.contact_date)} jour(s)
													</p>
												{/if}
											{:else}
												<p class="text-sm font-bold text-gray-400">Non contacté</p>
											{/if}
										</div>
									</div>
								</div>
							</div>

							<!-- Contacté par -->
							{#if contact.contacted_by}
								<div class="mb-3 p-3 bg-blue-50 border-2 border-blue-200 rounded-[8px]">
									<div class="flex items-center">
										<User size={14} class="text-blue-600 mr-2" />
										<span class="text-sm font-bold text-blue-700">Contacté par: {contact.contacted_by}</span>
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
				<!-- Version Desktop Table -->
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
							<th class="px-4 py-3">Contact</th>
							<th class="px-4 py-3">Section</th>
							<th class="px-4 py-3">Statut</th>
							<th class="px-4 py-3">Méthode</th>
							<th class="px-4 py-3">Date contact</th>
							<th class="px-4 py-3">Contacté par</th>
							<th class="px-4 py-3">Source</th>
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
												{contact.first_name || 'Prénom'} {contact.last_name || 'Nom'}
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
													⚠️ Doublon potentiel
												</div>
											{/if}
											{#if contact.recommended_by}
												<div class="text-xs text-blue-600 mt-1">
													Recommandé par {contact.recommended_by}
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
									<ContactStatusBadge
										status={contact.status}
										shouldFollowUp={shouldHighlightFollowUp(contact)}
									/>
								</td>

								<td class="px-4 py-3">
									<span class="text-sm capitalize">{contact.contact_method || '-'}</span>
								</td>

								<td class="px-4 py-3">
									{#if contact.contact_date}
										<div class="text-sm">
											{formatContactDate(contact.contact_date)}
											{#if getDaysSinceContact(contact.contact_date)}
												<div class="text-xs text-gray-500">
													Il y a {getDaysSinceContact(contact.contact_date)} jour(s)
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
											<span class="text-gray-400 text-sm">Non défini</span>
										</div>
									{/if}
								</td>

								<td class="px-4 py-3">
									<div class="inline-block">
										<span class="text-xs px-2 py-1 rounded-[4px] border font-bold {
											contact.source === 'database' ? 'bg-blue-100 text-blue-700 border-blue-200' :
											contact.source === 'manual' ? 'bg-gray-100 text-gray-700 border-gray-200' :
											contact.source === 'recommendation' ? 'bg-purple-100 text-purple-700 border-purple-200' :
											'bg-green-100 text-green-700 border-green-200'
										}">
											{contact.source === 'database' ? 'Base de données' :
												contact.source === 'manual' ? 'Manuel' :
													contact.source === 'recommendation' ? 'Recommandation' :
														contact.source || 'Autre'}
										</span>
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