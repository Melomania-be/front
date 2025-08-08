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
		Users
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
		let optionInUrls = `?page=${options.page}&limit=${options.limit}`
		optionInUrls += '&filter=' + options.filter
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
				contacts = data.data
				meta = data.meta
			}
		} catch (error) {
			console.error('Error fetching contacts:', error)
		}
	}

	async function updateContactStatus(contactId: number, status: string, notes?: string) {
		try {
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/contacts/${contactId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					status,
					notes,
					contact_date: status === 'awaiting_response' ? new Date().toISOString() : undefined
				})
			})

			if (response.ok) {
				await fetchContacts()
				dispatch('contactChange')
			}
		} catch (error) {
			console.error('Error updating contact status:', error)
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
				await fetchContacts()
				dispatch('contactChange')
			}
		} catch (error) {
			console.error('Error deleting contact:', error)
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
		if (selectedContacts.length === 0) return

		try {
			const promises = selectedContacts.map(contactId =>
				updateContactStatus(contactId, status)
			)
			await Promise.all(promises)
			clearSelection()
		} catch (error) {
			console.error('Error bulk updating status:', error)
		}
	}

	async function sendBulkEmails() {
		const emailContacts = contacts.filter(c =>
			selectedContacts.includes(c.id) && c.email
		)

		if (emailContacts.length === 0) {
			alert('Aucun contact sélectionné n\'a d\'adresse email')
			return
		}

		if (!confirm(`Envoyer un email de recrutement à ${emailContacts.length} contact(s) ?`)) {
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
				alert(`Emails envoyés: ${result.sent.length}, Échecs: ${result.failed.length}`)
				await fetchContacts()
				dispatch('contactChange')
				clearSelection()
			}
		} catch (error) {
			console.error('Error sending bulk emails:', error)
		}
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
		const diffTime = Date.now() - new Date(contactDate).getTime()
		return Math.floor(diffTime / (1000 * 60 * 60 * 24))
	}

	function shouldHighlightFollowUp(contact: RecruitmentContact): boolean {
		if (contact.status !== 'awaiting_response' || !contact.contact_date) return false
		const days = getDaysSinceContact(contact.contact_date)
		return days !== null && days >= settings.follow_up_days
	}
</script>

<div class="bg-white border-2 border-[#8C8C8C] rounded-lg">
	<div class="p-4 border-b">
		<div class="flex items-center justify-between {isMobile ? 'flex-col gap-3' : ''}">
			<h2 class="font-bold text-lg">Contacts de Recrutement</h2>

			<!-- Actions de sélection -->
			{#if contacts.length > 0}
				<div class="flex gap-2 {isMobile ? 'w-full' : ''}">
					<button
						on:click={selectAllContacts}
						class="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
					>
						Tout sélectionner
					</button>
					{#if selectedContacts.length > 0}
						<button
							on:click={clearSelection}
							class="px-3 py-1 text-sm bg-red-200 hover:bg-red-300 rounded"
						>
							Désélectionner ({selectedContacts.length})
						</button>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Actions groupées -->
		{#if showBulkActions}
			<div class="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
				<p class="text-sm font-semibold text-blue-800 mb-2">
					{selectedContacts.length} contact(s) sélectionné(s)
				</p>
				<div class="flex flex-wrap gap-2">
					<button
						on:click={sendBulkEmails}
						class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
					>
						<Mail size={14} class="inline mr-1" />
						Envoyer emails
					</button>
					<button
						on:click={() => bulkUpdateStatus('awaiting_response')}
						class="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
					>
						Marquer "En attente"
					</button>
					<button
						on:click={() => bulkUpdateStatus('not_available')}
						class="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
					>
						Marquer "Non disponible"
					</button>
					<button
						on:click={() => bulkUpdateStatus('recruited')}
						class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
					>
						Marquer "Recruté"
					</button>
				</div>
			</div>
		{/if}
	</div>

	<SimpleFilterer
		bind:data={dataHolder}
		bind:meta
		bind:options
		uniqueUrl={`/projects/${projectId}/management/recruitment`}
		on:optionsUpdated={fetchContacts}
	>
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-gray-100 border-b">
				<tr>
					<th class="px-4 py-3 text-left">
						<input
							type="checkbox"
							on:change={(e) => e.target.checked ? selectAllContacts() : clearSelection()}
							checked={selectedContacts.length === contacts.length && contacts.length > 0}
							class="rounded"
						/>
					</th>
					<th class="px-4 py-3 text-left font-semibold">Contact</th>
					<th class="px-4 py-3 text-left font-semibold">Section</th>
					<th class="px-4 py-3 text-left font-semibold">Statut</th>
					<th class="px-4 py-3 text-left font-semibold">Méthode</th>
					<th class="px-4 py-3 text-left font-semibold">Date contact</th>
					<th class="px-4 py-3 text-left font-semibold">Source</th>
					<th class="px-4 py-3 text-left font-semibold">Actions</th>
				</tr>
				</thead>
				<tbody>
				{#each contacts as contact (contact.id)}
					<tr
						class="border-b hover:bg-gray-50 {shouldHighlightFollowUp(contact) ? 'bg-yellow-50' : ''} {contact.is_duplicate ? 'bg-orange-50' : ''}"
					>
						<td class="px-4 py-3">
							<input
								type="checkbox"
								checked={selectedContacts.includes(contact.id)}
								on:change={() => toggleContactSelection(contact.id)}
								class="rounded"
							/>
						</td>

						<td class="px-4 py-3">
							<div class="font-medium">{contact.first_name} {contact.last_name}</div>
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
									👥 Recommandé par {contact.recommended_by}
								</div>
							{/if}
						</td>

						<td class="px-4 py-3">
							{contact.section?.name || '-'}
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
									{new Date(contact.contact_date).toLocaleDateString('fr-FR')}
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
                <span class="text-xs px-2 py-1 rounded {
                  contact.source === 'database' ? 'bg-blue-100 text-blue-800' :
                  contact.source === 'manual' ? 'bg-gray-100 text-gray-800' :
                  contact.source === 'recommendation' ? 'bg-purple-100 text-purple-800' :
                  'bg-green-100 text-green-800'
                }">
                  {contact.source === 'database' ? 'Base de données' :
										contact.source === 'manual' ? 'Manuel' :
											contact.source === 'recommendation' ? 'Recommandation' :
												contact.source || 'Autre'}
                </span>
						</td>

						<td class="px-4 py-3">
							<ContactActionButtons
								{contact}
								on:updateStatus={(e) => updateContactStatus(contact.id, e.detail.status, e.detail.notes)}
								on:delete={() => deleteContact(contact.id)}
							/>
						</td>
					</tr>
				{/each}
				</tbody>
			</table>

			{#if contacts.length === 0}
				<div class="text-center py-8 text-gray-500">
					<Users size={48} class="mx-auto mb-4 opacity-50" />
					<p>Aucun contact de recrutement pour le moment.</p>
					<p class="text-sm">Commencez par ajouter des contacts manuellement ou en important depuis la base de données.</p>
				</div>
			{/if}
		</div>
	</SimpleFilterer>
</div>