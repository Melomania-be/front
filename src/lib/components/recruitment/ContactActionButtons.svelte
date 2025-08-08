<!-- src/lib/components/recruitment/ContactActionButtons.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import { Mail, Phone, MessageCircle, Edit, Trash2, MoreVertical, CheckCircle, XCircle, Clock } from 'lucide-svelte'
	import type { RecruitmentContact } from '$lib/types'

	export let contact: RecruitmentContact

	const dispatch = createEventDispatcher()

	let showDropdown = false
	let notesModal = false
	let currentNotes = contact.notes || ''

	function toggleDropdown() {
		showDropdown = !showDropdown
	}

	function updateStatus(status: string, notes?: string) {
		dispatch('updateStatus', { status, notes })
		showDropdown = false
	}

	function deleteContact() {
		if (confirm(`Supprimer ${contact.first_name} ${contact.last_name} du recrutement ?`)) {
			dispatch('delete')
		}
		showDropdown = false
	}

	function openNotesModal() {
		currentNotes = contact.notes || ''
		notesModal = true
		showDropdown = false
	}

	function saveNotes() {
		dispatch('updateStatus', { status: contact.status, notes: currentNotes })
		notesModal = false
	}

	function sendEmail() {
		if (contact.email) {
			window.location.href = `mailto:${contact.email}?subject=Projet de recrutement`
		}
	}

	function callPhone() {
		if (contact.phone) {
			window.location.href = `tel:${contact.phone}`
		}
	}

	function openMessenger() {
		if (contact.messenger) {
			// Logique pour ouvrir Messenger - à adapter selon le format
			window.open(`https://m.me/${contact.messenger}`, '_blank')
		}
	}

	// Fermer le dropdown si on clique ailleurs
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement
		const dropdown = document.getElementById(`dropdown-${contact.id}`)
		if (dropdown && !dropdown.contains(target)) {
			showDropdown = false
		}
	}

	$: if (typeof window !== 'undefined') {
		if (showDropdown) {
			document.addEventListener('click', handleClickOutside)
		} else {
			document.removeEventListener('click', handleClickOutside)
		}
	}
</script>

<div class="relative" id="dropdown-{contact.id}">
	<!-- Actions rapides -->
	<div class="flex items-center gap-1">
		<!-- Contact direct -->
		{#if contact.email}
			<button
				on:click={sendEmail}
				class="p-1 text-blue-600 hover:bg-blue-100 rounded"
				title="Envoyer un email"
			>
				<Mail size={14} />
			</button>
		{/if}

		{#if contact.phone}
			<button
				on:click={callPhone}
				class="p-1 text-green-600 hover:bg-green-100 rounded"
				title="Appeler"
			>
				<Phone size={14} />
			</button>
		{/if}

		{#if contact.messenger}
			<button
				on:click={openMessenger}
				class="p-1 text-purple-600 hover:bg-purple-100 rounded"
				title="Messenger"
			>
				<MessageCircle size={14} />
			</button>
		{/if}

		<!-- Actions de statut rapides -->
		{#if contact.status === 'not_yet_contacted'}
			<button
				on:click={() => updateStatus('awaiting_response')}
				class="p-1 text-blue-600 hover:bg-blue-100 rounded"
				title="Marquer comme contacté"
			>
				<Clock size={14} />
			</button>
		{/if}

		{#if contact.status === 'awaiting_response' || contact.status === 'to_follow_up'}
			<button
				on:click={() => updateStatus('recruited')}
				class="p-1 text-green-600 hover:bg-green-100 rounded"
				title="Marquer comme recruté"
			>
				<CheckCircle size={14} />
			</button>
			<button
				on:click={() => updateStatus('not_available')}
				class="p-1 text-red-600 hover:bg-red-100 rounded"
				title="Marquer comme non disponible"
			>
				<XCircle size={14} />
			</button>
		{/if}

		<!-- Menu plus d'actions -->
		<button
			on:click={toggleDropdown}
			class="p-1 text-gray-600 hover:bg-gray-100 rounded"
			title="Plus d'actions"
		>
			<MoreVertical size={14} />
		</button>
	</div>

	<!-- Dropdown menu -->
	{#if showDropdown}
		<div class="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[180px]">
			<div class="py-1">
				<!-- Changer de statut -->
				<div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b">
					Changer le statut
				</div>

				<button
					on:click={() => updateStatus('not_yet_contacted')}
					class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 {contact.status === 'not_yet_contacted' ? 'bg-gray-100 font-medium' : ''}"
				>
					Pas encore contacté
				</button>

				<button
					on:click={() => updateStatus('awaiting_response')}
					class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 {contact.status === 'awaiting_response' ? 'bg-gray-100 font-medium' : ''}"
				>
					En attente de réponse
				</button>

				<button
					on:click={() => updateStatus('to_follow_up')}
					class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 {contact.status === 'to_follow_up' ? 'bg-gray-100 font-medium' : ''}"
				>
					À relancer
				</button>

				<button
					on:click={() => updateStatus('not_available')}
					class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 {contact.status === 'not_available' ? 'bg-gray-100 font-medium' : ''}"
				>
					Non disponible
				</button>

				<button
					on:click={() => updateStatus('pending_validation')}
					class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 {contact.status === 'pending_validation' ? 'bg-gray-100 font-medium' : ''}"
				>
					En validation
				</button>

				<button
					on:click={() => updateStatus('recruited')}
					class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 {contact.status === 'recruited' ? 'bg-gray-100 font-medium' : ''}"
				>
					Recruté
				</button>

				<button
					on:click={() => updateStatus('cancelled')}
					class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 {contact.status === 'cancelled' ? 'bg-gray-100 font-medium' : ''}"
				>
					Annulé
				</button>

				<!-- Autres actions -->
				<div class="border-t px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
					Actions
				</div>

				<button
					on:click={openNotesModal}
					class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
				>
					<Edit size={14} />
					Modifier les notes
				</button>

				<button
					on:click={deleteContact}
					class="w-full px-3 py-2 text-left text-sm hover:bg-red-100 text-red-600 flex items-center gap-2"
				>
					<Trash2 size={14} />
					Supprimer
				</button>
			</div>
		</div>
	{/if}
</div>

<!-- Modal de notes -->
{#if notesModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
			<h3 class="text-lg font-semibold mb-4">
				Modifier les notes - {contact.first_name} {contact.last_name}
			</h3>

			<textarea
				bind:value={currentNotes}
				placeholder="Ajouter des notes sur ce contact..."
				class="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			></textarea>

			<div class="flex justify-end gap-2 mt-4">
				<button
					on:click={() => notesModal = false}
					class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
				>
					Annuler
				</button>
				<button
					on:click={saveNotes}
					class="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
				>
					Sauvegarder
				</button>
			</div>
		</div>
	</div>
{/if}

<svelte:window on:beforeunload={() => document.removeEventListener('click', handleClickOutside)} />