<!-- src/lib/components/recruitment/AddManualContactModal.svelte -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte'
	import { X, UserPlus, AlertTriangle } from 'lucide-svelte'
	import type { Section } from '$lib/types'
	import type { Contact } from '$lib/types/Contact'

	export let projectId: string

	const dispatch = createEventDispatcher()

	let formData = {
		first_name: '',
		last_name: '',
		email: '',
		phone: '',
		messenger: '',
		section_id: null as number | null,
		notes: '',
		contacted_by: ''
	}

	let sections: Section[] = []
	let foundContacts: Contact[] = []
	let saving = false
	let errors: Record<string, string> = {}
	let currentUserName = ''
	let loadingUser = true

	onMount(async () => {
		await fetchSections()
		await getCurrentUser()
	})

	async function fetchSections() {
		try {
			const response = await fetch('/api/sections')
			if (response.ok) {
				sections = await response.json()
			}
		} catch (error) {
			console.error('Error fetching sections:', error)
		}
	}

	async function getCurrentUser() {
		loadingUser = true
		try {
			const response = await fetch('/api/users/current')
			if (response.ok) {
				const userData = await response.json()
				currentUserName = userData.fullName || userData.email || 'Current user'
				formData.contacted_by = currentUserName
			} else {
				currentUserName = 'Current user'
				formData.contacted_by = currentUserName
			}
		} catch (error) {
			console.error('Error fetching current user:', error)
			currentUserName = 'Current user'
			formData.contacted_by = currentUserName
		} finally {
			loadingUser = false
		}
	}

	async function searchContacts() {
	const firstName = formData.first_name.trim()
	const lastName = formData.last_name.trim()

	if (firstName.length < 2 && lastName.length < 2) {
		foundContacts = []
		return
	}

	const filter = `${firstName} ${lastName}`

	try {
		const response = await fetch(
			`/api/contacts?filter=${encodeURIComponent(filter)}`
		)

		if (response.ok) {
			const data = await response.json()
			console.log(data)
			foundContacts = Array.isArray(data)
	? data
	: Array.isArray(data.data)
		? data.data
		: []
			console.log(data.data)
		}
	} catch (error) {
		console.error('Error searching contacts:', error)
	}
}

	async function saveContact() {
		errors = {}

		const firstName = formData.first_name.trim()
		const lastName = formData.last_name.trim()

		if (!firstName) {
			errors.first_name = 'First name is required'
		}

		if (!lastName) {
			errors.last_name = 'Last name is required'
		}

		if (formData.email && !isValidEmail(formData.email)) {
			errors.email = 'Invalid email format'
		}

		if (!formData.email && !formData.phone && !formData.messenger) {
			errors.contact = 'At least one contact method is required (email, phone or messenger)'
		}

		if (Object.keys(errors).length > 0) {
			return
		}

		saving = true

		try {
			const cleanData = {
				first_name: firstName,
				last_name: lastName,
				email: formData.email.trim() || null,
				phone: formData.phone.trim() || null,
				messenger: formData.messenger.trim() || null,
				section_id: formData.section_id,
				notes: formData.notes.trim() || null,
				contacted_by: formData.contacted_by.trim() || null
			}

			const response = await fetch(`/api/projects/${projectId}/management/recruitment/contacts`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(cleanData)
			})

			if (response.ok) {
				const newContact = await response.json()
				dispatch('contactAdded', newContact)
				closeModal()
			} else {
				const errorData = await response.json()
				console.error('Error creating contact:', errorData)
				alert(`Error: ${errorData.error || 'Unable to create contact'}`)
			}
		} catch (error) {
			console.error('Error saving contact:', error)
			alert('Error saving contact')
		} finally {
			saving = false
		}
	}

	function closeModal() {
		clearForm()
		dispatch('close')
	}

	function isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		return emailRegex.test(email)
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal()
		}
	}

	function clearForm() {
		formData = {
			first_name: '',
			last_name: '',
			email: '',
			phone: '',
			messenger: '',
			section_id: null,
			notes: '',
			contacted_by: currentUserName
		}
		errors = {}
	}

	$: {
		if (formData.first_name.trim() && errors.first_name) {
			delete errors.first_name
		}
		if (formData.last_name.trim() && errors.last_name) {
			delete errors.last_name
		}
		if ((formData.email || formData.phone || formData.messenger) && errors.contact) {
			delete errors.contact
		}
		if (formData.email && isValidEmail(formData.email) && errors.email) {
			delete errors.email
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
	<div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
		<div class="flex items-center justify-between p-6 border-b">
			<div class="flex items-center gap-2">
				<UserPlus class="text-[#6B9AD9]" size={24} />
				<h2 class="text-xl font-semibold">Add Manual Contact</h2>
			</div>
			<button
				on:click={closeModal}
				class="text-gray-400 hover:text-gray-600 transition-colors"
				disabled={saving}
			>
				<X size={24} />
			</button>
		</div>

		<div class="p-6 space-y-6">
			<div class="space-y-4">
				<h3 class="text-lg font-semibold text-gray-900">Personal Information</h3>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label for="first_name" class="block text-sm font-medium text-gray-700 mb-1">
							First Name *
						</label>
						<input
							id="first_name"
							type="text"
							bind:value={formData.first_name}
							on:input={searchContacts}
							class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent {errors.first_name ? 'border-red-500' : 'border-gray-300'}"
							placeholder="First name"
							disabled={saving}
						/>
						{#if errors.first_name}
							<p class="text-sm text-red-600 mt-1">{errors.first_name}</p>
						{/if}
					</div>

					<div>
						<label for="last_name" class="block text-sm font-medium text-gray-700 mb-1">
							Last Name *
						</label>
						<input
							id="last_name"
							type="text"
							bind:value={formData.last_name}
							on:input={searchContacts}
							class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent {errors.last_name ? 'border-red-500' : 'border-gray-300'}"
							placeholder="Last name"
							disabled={saving}
						/>
						{#if errors.last_name}
							<p class="text-sm text-red-600 mt-1">{errors.last_name}</p>
						{/if}
					</div>
				</div>
			</div>

{#if foundContacts.length > 0}
	<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
		<h4 class="font-medium text-yellow-800 mb-2">
			Possible existing contacts
		</h4>

		<div class="space-y-2">
			{#each foundContacts as contact}
				<button
					type="button"
					class="w-full text-left p-3 bg-white border rounded hover:bg-gray-50"
					on:click={() => {
						formData.first_name = contact.firstName || ''
						formData.last_name = contact.lastName || ''
						formData.email = contact.email || ''
						formData.phone = contact.phone || ''
						formData.messenger = contact.messenger || ''

						foundContacts = []
					}}
				>
					<div class="font-medium">
						{contact.firstName} {contact.lastName}
					</div>

					{#if contact.email}
						<div class="text-sm text-gray-600">
							{contact.email}
						</div>
					{/if}

					{#if contact.phone}
						<div class="text-sm text-gray-600">
							{contact.phone}
						</div>
					{/if}
				</button>
			{/each}
		</div>
	</div>
{/if}

			<div class="space-y-4">
				<h3 class="text-lg font-semibold text-gray-900">Contact Information</h3>
				<p class="text-sm text-gray-600">At least one contact method is required</p>

				<div class="space-y-4">
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
							Email
						</label>
						<input
							id="email"
							type="email"
							bind:value={formData.email}
							class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent {errors.email ? 'border-red-500' : 'border-gray-300'}"
							placeholder="example@email.com"
							disabled={saving}
						/>
						{#if errors.email}
							<p class="text-sm text-red-600 mt-1">{errors.email}</p>
						{/if}
					</div>

					<div>
						<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
							Phone
						</label>
						<input
							id="phone"
							type="tel"
							bind:value={formData.phone}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="+1 (555) 123-4567"
							disabled={saving}
						/>
					</div>

					<div>
						<label for="messenger" class="block text-sm font-medium text-gray-700 mb-1">
							Messenger
						</label>
						<input
							id="messenger"
							type="text"
							bind:value={formData.messenger}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="@username or Messenger link"
							disabled={saving}
						/>
					</div>

					{#if errors.contact}
						<div class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
							<AlertTriangle size={16} class="text-red-500 mt-0.5 flex-shrink-0" />
							<p class="text-sm text-red-700">{errors.contact}</p>
						</div>
					{/if}
				</div>
			</div>

			<div class="space-y-4">
				<h3 class="text-lg font-semibold text-gray-900">Section</h3>

				<div>
					<label for="section" class="block text-sm font-medium text-gray-700 mb-1">
						Musical Section
					</label>
					<select
						id="section"
						bind:value={formData.section_id}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						disabled={saving}
					>
						<option value={null}>Select a section</option>
						{#each sections as section}
							<option value={section.id}>{section.name}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="space-y-4">
				<h3 class="text-lg font-semibold text-gray-900">Tracking</h3>

				<div>
					<label for="contacted_by" class="block text-sm font-medium text-gray-700 mb-1">
						Contacted by
					</label>
					<input
						id="contacted_by"
						type="text"
						bind:value={formData.contacted_by}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="Name of the person making contact"
						disabled={saving}
					/>
					<p class="text-xs text-gray-500 mt-1">
						By default, your name is used. You can modify it if necessary.
					</p>
				</div>
			</div>

			<div class="space-y-4">
				<h3 class="text-lg font-semibold text-gray-900">Notes</h3>

				<div>
					<label for="notes" class="block text-sm font-medium text-gray-700 mb-1">
						Additional Notes
					</label>
					<textarea
						id="notes"
						bind:value={formData.notes}
						rows="3"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="Notes about this contact, meeting context, recommendation..."
						disabled={saving}
					></textarea>
				</div>
			</div>

			{#if formData.first_name.trim() || formData.last_name.trim()}
				<div class="bg-gray-50 rounded-lg p-4">
					<h4 class="font-medium text-gray-900 mb-2">Contact Preview</h4>
					<div class="text-sm space-y-1">
						<p><span class="font-medium">Name:</span> {formData.first_name.trim()} {formData.last_name.trim()}</p>
						{#if formData.email.trim()}
							<p><span class="font-medium">Email:</span> {formData.email.trim()}</p>
						{/if}
						{#if formData.phone.trim()}
							<p><span class="font-medium">Phone:</span> {formData.phone.trim()}</p>
						{/if}
						{#if formData.messenger.trim()}
							<p><span class="font-medium">Messenger:</span> {formData.messenger.trim()}</p>
						{/if}
						{#if formData.section_id}
							<p><span class="font-medium">Section:</span> {sections.find(s => s.id === formData.section_id)?.name}</p>
						{/if}
						{#if formData.contacted_by.trim()}
							<p><span class="font-medium">Contacted by:</span> {formData.contacted_by.trim()}</p>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<div class="flex justify-between p-6 border-t bg-gray-50">
			<button
				type="button"
				on:click={clearForm}
				class="px-4 py-2 text-gray-600 hover:text-gray-800"
				disabled={saving}
			>
				Clear form
			</button>

			<div class="flex gap-3">
				<button
					type="button"
					on:click={closeModal}
					disabled={saving}
					class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="button"
					on:click={saveContact}
					disabled={saving || Object.keys(errors).length > 0}
					class="px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] disabled:opacity-50 flex items-center gap-2"
				>
					{#if saving}
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
					{/if}
					{saving ? 'Adding...' : 'Add contact'}
				</button>
			</div>
		</div>
	</div>
</div>