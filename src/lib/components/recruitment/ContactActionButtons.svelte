<!-- src/lib/components/recruitment/ContactActionButtons.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import { Mail, Phone, MessageCircle, Edit, Trash2, MoreVertical, CheckCircle, XCircle, Clock, User } from 'lucide-svelte'
	import type { RecruitmentContact } from '$lib/types'

	export let contact: RecruitmentContact

	const dispatch = createEventDispatcher()

	let showDropdown = false
	let notesModal = false
	let contactedByModal = false
	let currentNotes = contact.notes || ''
	let currentContactedBy = contact.contacted_by || ''

	function toggleDropdown() {
		showDropdown = !showDropdown
	}

	function updateStatus(status: string, notes?: string, contactedBy?: string) {
		const updateData: any = { status }
		if (notes !== undefined) updateData.notes = notes
		if (contactedBy !== undefined) updateData.contacted_by = contactedBy

		dispatch('updateStatus', updateData)
		showDropdown = false
	}

	function deleteContact() {
		if (confirm(`Remove ${contact.first_name} ${contact.last_name} from recruitment?`)) {
			dispatch('delete')
		}
		showDropdown = false
	}

	function openNotesModal() {
		currentNotes = contact.notes || ''
		notesModal = true
		showDropdown = false
	}

	function openContactedByModal() {
		currentContactedBy = contact.contacted_by || ''
		contactedByModal = true
		showDropdown = false
	}

	function saveNotes() {
		dispatch('updateStatus', {
			status: contact.status,
			notes: currentNotes,
			contacted_by: contact.contacted_by
		})
		notesModal = false
	}

	function saveContactedBy() {
		dispatch('updateStatus', {
			status: contact.status,
			notes: contact.notes,
			contacted_by: currentContactedBy
		})
		contactedByModal = false
	}

	function sendEmail() {
		if (contact.email) {
			window.location.href = `mailto:${contact.email}?subject=Recruitment project`
		}
	}

	function callPhone() {
		if (contact.phone) {
			window.location.href = `tel:${contact.phone}`
		}
	}

	function openMessenger() {
		if (contact.messenger) {
			window.open(`https://m.me/${contact.messenger}`, '_blank')
		}
	}

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
	<div class="flex flex-wrap items-center gap-1">
		{#if contact.email}
			<button
				on:click={sendEmail}
				class="p-1 text-blue-600 hover:bg-blue-100 rounded"
				title="Send email"
			>
				<Mail size={14} />
			</button>
		{/if}

		{#if contact.phone}
			<button
				on:click={callPhone}
				class="p-1 text-green-600 hover:bg-green-100 rounded"
				title="Call"
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

		{#if contact.status === 'not_yet_contacted'}
			<button
				on:click={() => updateStatus('awaiting_response')}
				class="p-1 text-blue-600 hover:bg-blue-100 rounded"
				title="Mark as contacted"
			>
				<Clock size={14} />
			</button>
		{/if}

		{#if contact.status === 'awaiting_response' || contact.status === 'to_follow_up'}
			<button
				on:click={() => updateStatus('recruited')}
				class="p-1 text-green-600 hover:bg-green-100 rounded"
				title="Mark as recruited"
			>
				<CheckCircle size={14} />
			</button>
			<button
				on:click={() => updateStatus('not_available')}
				class="p-1 text-red-600 hover:bg-red-100 rounded"
				title="Mark as not available"
			>
				<XCircle size={14} />
			</button>
		{/if}

		<button
			on:click={toggleDropdown}
			class="p-1 text-gray-600 hover:bg-gray-100 rounded"
			title="More actions"
		>
			<MoreVertical size={14} />
		</button>
	</div>

	{#if showDropdown}
		<div class="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[180px]">
			<div class="py-1">
				<div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b">
					Change status
				</div>

				<button
					on:click={() => updateStatus('not_yet_contacted')}
					class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 {contact.status === 'not_yet_contacted' ? 'bg-gray-100 font-medium' : ''}"
				>
					Not yet contacted
				</button>

				<button
					on:click={() => updateStatus('awaiting_response')}
					class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 {contact.status === 'awaiting_response' ? 'bg-gray-100 font-medium' : ''}"
				>
					Awaiting response
				</button>

				<button
					on:click={() => updateStatus('to_follow_up')}
					class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 {contact.status === 'to_follow_up' ? 'bg-gray-100 font-medium' : ''}"
				>
					Follow up
				</button>

				<button
					on:click={() => updateStatus('not_available')}
					class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 {contact.status === 'not_available' ? 'bg-gray-100 font-medium' : ''}"
				>
					Not available
				</button>

				<button
					on:click={() => updateStatus('pending_validation')}
					class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 {contact.status === 'pending_validation' ? 'bg-gray-100 font-medium' : ''}"
				>
					Pending validation
				</button>

				<button
					on:click={() => updateStatus('recruited')}
					class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 {contact.status === 'recruited' ? 'bg-gray-100 font-medium' : ''}"
				>
					Recruited
				</button>

				<button
					on:click={() => updateStatus('cancelled')}
					class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 {contact.status === 'cancelled' ? 'bg-gray-100 font-medium' : ''}"
				>
					Cancelled
				</button>

				<div class="border-t px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
					Actions
				</div>

				<button
					on:click={openNotesModal}
					class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
				>
					<Edit size={14} />
					Edit notes
				</button>

				<button
					on:click={openContactedByModal}
					class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
				>
					<User size={14} />
					Edit "Contacted by"
				</button>

				<button
					on:click={deleteContact}
					class="w-full px-3 py-2 text-left text-sm hover:bg-red-100 text-red-600 flex items-center gap-2"
				>
					<Trash2 size={14} />
					Delete
				</button>
			</div>
		</div>
	{/if}
</div>

{#if notesModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
			<h3 class="text-lg font-semibold mb-4">
				Edit notes - {contact.first_name} {contact.last_name}
			</h3>

			<textarea
				bind:value={currentNotes}
				placeholder="Add notes about this contact..."
				class="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			></textarea>

			<div class="flex justify-end gap-2 mt-4">
				<button
					on:click={() => notesModal = false}
					class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
				>
					Cancel
				</button>
				<button
					on:click={saveNotes}
					class="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
				>
					Save
				</button>
			</div>
		</div>
	</div>
{/if}

{#if contactedByModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
			<h3 class="text-lg font-semibold mb-4">
				Edit "Contacted by" - {contact.first_name} {contact.last_name}
			</h3>

			<div>
				<label for="contacted_by_input" class="block text-sm font-medium text-gray-700 mb-2">
					Person who made contact
				</label>
				<input
					id="contacted_by_input"
					type="text"
					bind:value={currentContactedBy}
					placeholder="Name of the person who made contact..."
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
				<p class="text-xs text-gray-500 mt-1">
					Indicate the name of the person who contacted this candidate.
				</p>
			</div>

			<div class="flex justify-end gap-2 mt-4">
				<button
					on:click={() => contactedByModal = false}
					class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
				>
					Cancel
				</button>
				<button
					on:click={saveContactedBy}
					class="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
				>
					Save
				</button>
			</div>
		</div>
	</div>
{/if}

<svelte:window on:beforeunload={() => document.removeEventListener('click', handleClickOutside)} />
