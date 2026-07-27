<!-- src/lib/components/recruitment/AddManualContactModal.svelte -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte'
	import { X, UserPlus, AlertTriangle } from 'lucide-svelte'
	import type { Section } from '$lib/types'
	import type { Contact } from '$lib/types/Contact'

	export let projectId: string
	let duplicateEmailContact: Contact | null = null
let duplicatePhoneContact: Contact | null = null
	const dispatch = createEventDispatcher()

	let formData = {
		contact_id: null as number | null,
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
	let existingRecruitmentContacts: any[] = []
	let selectedContact: Contact | null = null
	let saving = false
	let errors: Record<string, string> = {}
	let currentUserName = ''
	let loadingUser = true
	let showDuplicateWarning = false
	let duplicateWarnings: any[] = []
	let duplicateWarningSource: 'similar' | 'exact' = 'similar'
	let showManualAddResults = false
	let manualAddResultsTitle = 'Cannot Add Contact'
	let manualAddResults: {
		imported: any[];
		replaced?: any[];
		conflicts: any[];
		errors: string[];
		contact?: any;
		exactMatches?: any[];
	} | null = null

function isSimilar(a: string, b: string) {
	a = a.toLowerCase()
	b = b.toLowerCase()

	if (
		a.includes(b) ||
		b.includes(a)
	) {
		return true
	}

	let differences = 0

	for (let i = 0; i < Math.min(a.length, b.length); i++) {
		if (a[i] !== b[i]) {
			differences++
		}
	}

	differences += Math.abs(a.length - b.length)

	return differences <= 2
}

function normalizePhone(phone: string) {
	return phone
		.replace(/\s|\/|\.|-/g, '')
		.replace(/^\+32/, '0')
		.replace(/^0032/, '0')
}

	function closeModal() {
		clearForm()
		dispatch('close')
	}
function getFirstName(contact: any) {
	return contact.firstName || contact.first_name || ''
}

function getLastName(contact: any) {
	return contact.lastName || contact.last_name || ''
}

function normalizeWarningContact(contact: any) {
	return {
		id: contact?.id ?? null,
		first_name: contact?.first_name || contact?.firstName || '',
		last_name: contact?.last_name || contact?.lastName || '',
		email: contact?.email || null,
		phone: contact?.phone || null,
		messenger: contact?.messenger || null,
		status: contact?.status || 'Existing contact',
		source: contact?.source || 'Existing contact'
	}
}

function getCurrentFormContact() {
	return normalizeWarningContact({
		first_name: formData.first_name.trim(),
		last_name: formData.last_name.trim(),
		email: formData.email.trim() || null,
		phone: formData.phone.trim() || null,
		messenger: formData.messenger.trim() || null
	})
}

function isSelectedContactSnapshotMatchingForm(contact: Contact | null): boolean {
	if (!contact) return false

	return (
		getFirstName(contact).trim() === formData.first_name.trim() &&
		getLastName(contact).trim() === formData.last_name.trim() &&
		(contact.email || '') === formData.email.trim() &&
		(contact.phone || '') === formData.phone.trim() &&
		(contact.messenger || '') === formData.messenger.trim()
	)
}

function detachSelectedContactIfEdited() {
	if (!selectedContact) return
	if (isSelectedContactSnapshotMatchingForm(selectedContact)) return

	formData = {
		...formData,
		contact_id: null
	}
	selectedContact = null
	duplicateWarnings = []
	showDuplicateWarning = false
}

function handleIdentityInput() {
	detachSelectedContactIfEdited()
	searchContacts()
}

function showExactDuplicateResults(matches: any[], contact: any = getCurrentFormContact()) {
	manualAddResultsTitle = 'Cannot Add Contact'
	manualAddResults = {
		imported: [],
		replaced: [],
		conflicts: [],
		errors: [
			'This contact is already in this recruitment list. Exact duplicates are not allowed.'
		],
		contact: normalizeWarningContact(contact),
		exactMatches: matches.map((match) => normalizeWarningContact(match.contact || match))
	}
	showManualAddResults = true
}

function isExactRecruitmentDuplicateError(errorData: any, status?: number): boolean {
	return (
		status === 409 &&
		(
			errorData?.code === 'EXACT_RECRUITMENT_CONTACT_ALREADY_EXISTS' ||
			typeof errorData?.message === 'string' && errorData.message.toLowerCase().includes('already in the recruitment contact list')
		)
	)
}

function hasVisibleDuplicateMatches(warnings: any[]): boolean {
	return warnings.some((warning) => (warning.matches || []).length > 0)
}

function normalizeDuplicateWarnings(duplicates: any, fallbackContact: any = getCurrentFormContact()) {
	if (!Array.isArray(duplicates)) return []

	return duplicates.map((d) => {
		const matches = (d.matches || []).filter(Boolean).map((match: any) => ({
			...match,
			contact: normalizeWarningContact(match.contact || match)
		}))
		const seen = new Set()
		const uniqueMatches: any[] = []

		for (const m of matches) {
			const c = m.contact || m
			const key = c.id != null ? `id:${c.id}` : `${(c.first_name || '').toLowerCase()}|${(c.last_name || '').toLowerCase()}|${(c.email || '').toLowerCase()}|${(c.phone || '')}`
			if (!seen.has(key)) {
				seen.add(key)
				uniqueMatches.push(m)
			}
		}

		return {
			contact: normalizeWarningContact(d.contact || d.source_contact || fallbackContact),
			matches: uniqueMatches
		}
	})
}

function parseBackendErrorPayload(rawPayload: string) {
	if (!rawPayload) return null
	try {
		return JSON.parse(rawPayload)
	} catch (e) {
		return null
	}
}

function extractExactDuplicateMatchesFromPayload(errorData: any, fallbackContact: any = getCurrentFormContact()) {
	const duplicates = errorData?.duplicate_warnings || errorData?.duplicateWarnings || null
	const warnings = normalizeDuplicateWarnings(duplicates, fallbackContact)
	return getExactMatches(warnings)
}

function getManualAddResultsPayload() {
	const rawError = manualAddResults?.errors?.[0]
	if (!rawError) return null
	return parseBackendErrorPayload(rawError)
}

function getManualAddResultsContact() {
	if (manualAddResults?.contact) return manualAddResults.contact

	const payload = getManualAddResultsPayload()
	const duplicates = payload?.duplicate_warnings || payload?.duplicateWarnings || null
	const warnings = normalizeDuplicateWarnings(duplicates, getCurrentFormContact())
	return warnings[0]?.contact || null
}

function getManualAddResultsExactMatches() {
	if (manualAddResults?.exactMatches && manualAddResults.exactMatches.length > 0) {
		return manualAddResults.exactMatches
	}

	const payload = getManualAddResultsPayload()
	return extractExactDuplicateMatchesFromPayload(payload, getCurrentFormContact()).map((match: any) =>
		normalizeWarningContact(match.contact || match)
	)
}

function getManualAddDisplayedErrors() {
	const payload = getManualAddResultsPayload()
	const exactMatches = getManualAddResultsExactMatches()

	if (payload && exactMatches.length > 0) {
		return ['This contact is already in this recruitment list. Exact duplicates are not allowed.']
	}

	if (payload?.code === 'POTENTIAL_DUPLICATE_RECRUITMENT_CONTACT') {
		return ['The contact you are adding may already exist in this recruitment list. Review the similar contact(s) below.']
	}

	return manualAddResults?.errors || []
}

function getBackendErrorMessage(errorData: any, fallbackText: string | null = null, defaultText = 'Unable to create contact') {
	return errorData?.error || errorData?.message || fallbackText || defaultText
}

function handleManualRecruitmentDuplicateResponse(errorData: any): boolean {
	const normalizedWarnings = normalizeDuplicateWarnings(
		errorData?.duplicate_warnings || errorData?.duplicateWarnings || null,
		getCurrentFormContact()
	)
	const exactMatches = getExactMatches(normalizedWarnings)

	if (errorData?.code === 'POTENTIAL_DUPLICATE_RECRUITMENT_CONTACT') {
		duplicateWarnings = normalizedWarnings
		duplicateWarningSource = 'similar'
		showDuplicateWarning = true
		showManualAddResults = false
		manualAddResults = null
		return true
	}

	if (exactMatches.length > 0 || isExactRecruitmentDuplicateError(errorData, 409)) {
		showExactDuplicateResults(
			exactMatches.length > 0
				? exactMatches
				: (selectedContact ? [selectedContact] : [getCurrentFormContact()])
		)
		return true
	}

	if (normalizedWarnings.length > 0 && hasVisibleDuplicateMatches(normalizedWarnings)) {
		duplicateWarnings = normalizedWarnings
		duplicateWarningSource = 'similar'
		showDuplicateWarning = true
		showManualAddResults = false
		manualAddResults = null
		return true
	}

	return false
}

function getManualAddResultsSimilarWarnings() {
	const payload = getManualAddResultsPayload()
	return normalizeDuplicateWarnings(
		payload?.duplicate_warnings || payload?.duplicateWarnings || null,
		getCurrentFormContact()
	)
}

function isManualAddResultsPotentialDuplicate() {
	return getManualAddResultsPayload()?.code === 'POTENTIAL_DUPLICATE_RECRUITMENT_CONTACT'
}

async function confirmManualAddResultsPotentialDuplicate() {
	showManualAddResults = false
	manualAddResults = null
	await saveContact(true)
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
			contact_id: null,
			first_name: '',
			last_name: '',
			email: '',
			phone: '',
			messenger: '',
			section_id: null,
			notes: '',
			contacted_by: currentUserName
		}
		selectedContact = null
		errors = {}
		duplicateEmailContact = null
		duplicatePhoneContact = null
		foundContacts = []
		duplicateWarnings = []
		showDuplicateWarning = false
		showManualAddResults = false
		manualAddResults = null
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

	onMount(async () => {
		await fetchSections()
		await fetchExistingRecruitmentContacts()
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
	const activeField = (document.activeElement as HTMLInputElement)?.id

	const firstName = formData.first_name.trim()
	const lastName = formData.last_name.trim()

	if ((activeField === 'email' && !formData.email.trim()) || (activeField === 'phone' && !formData.phone.trim())) {
		duplicateEmailContact = null
		duplicatePhoneContact = null
		duplicateWarnings = []
		showDuplicateWarning = false
	}

	if (
	firstName.length < 2 &&
	lastName.length < 2 &&
	!formData.email.trim() &&
	!formData.phone.trim()
)  {
		foundContacts = []
		duplicateWarnings = []
		showDuplicateWarning = false
		return
	}

	const nameQuery = `${firstName} ${lastName}`.trim()
	const searchQuery =
		(formData.email.trim() || formData.phone.trim()) && nameQuery
			? nameQuery
			: formData.email.trim() || formData.phone.trim() || nameQuery

	const criteria: any = {
		name: nameQuery,
		email: formData.email.trim() || '',
		instruments: '',
		projects: ''
	}

	try {
		const response = await fetch(
			`/api/projects/${projectId}/management/recruitment/search-contacts`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					filter: searchQuery,
					criteria
				})
			}
		)

		if (response.ok) {
			const data = await response.json()
			const contacts = data.data || data || []

			duplicateEmailContact = null
duplicatePhoneContact = null

if (formData.email.trim() &&
	activeField === 'email') {
	duplicateEmailContact =
		contacts.find(
			(contact: Contact) =>
				contact.id !== formData.contact_id &&
				contact.email?.toLowerCase() ===
				formData.email.trim().toLowerCase()
		) || null
}

if (formData.phone.trim() &&
	activeField === 'phone') {
	const normalizedInputPhone = normalizePhone(formData.phone)

	duplicatePhoneContact =
		contacts.find((contact: Contact) => {
			if (!contact.phone) return false

			return (
				contact.id !== formData.contact_id &&
				normalizePhone(contact.phone) === normalizedInputPhone
			)
		}) || null
}


foundContacts = contacts.filter((contact: Contact) => {
	if (formData.contact_id && contact.id === formData.contact_id) {
		return false
	}

	const first = (contact.firstName || '').toLowerCase()
	const last = (contact.lastName || '').toLowerCase()
	const email = (contact.email || '').toLowerCase()
	const phone = contact.phone
		? normalizePhone(contact.phone)
		: ''

	const searchFirst = firstName.toLowerCase().trim()
	const searchLast = lastName.toLowerCase().trim()
	const searchEmail = formData.email.toLowerCase().trim()
	const searchPhone = normalizePhone(formData.phone)

	if (activeField === 'first_name') {
		return (
			searchFirst.length >= 2 &&
			isSimilar(first, searchFirst)
		)
	}

	if (activeField === 'last_name') {
		return (
			searchLast.length >= 2 &&
			isSimilar(last, searchLast)
		)
	}

	if (activeField === 'email') {
		return (
			searchEmail.length >= 3 &&
			(email.includes(searchEmail) || (
				searchFirst.length >= 2 &&
				searchLast.length >= 2 &&
				isSimilar(first, searchFirst) &&
				isSimilar(last, searchLast)
			))
		)
	}

	if (activeField === 'phone') {
		return (
			searchPhone.length >= 5 &&
			(phone.includes(searchPhone) || (
				searchFirst.length >= 2 &&
				searchLast.length >= 2 &&
				isSimilar(first, searchFirst) &&
				isSimilar(last, searchLast)
			))
		)
	}

	return false
})

		// Don't show duplicate warning automatically on input
		// This prevents autofill from triggering the warning before user clicks Save
		// The duplicate check will happen in saveContact() when user explicitly tries to add
		}
	} catch (error) {
		console.error('Error searching contacts:', error)
	}
}

	function contactToWarningMatch(contact: any) {
		const matchContact = normalizeWarningContact(contact)
		const currentFirstName = formData.first_name.trim().toLowerCase()
		const currentLastName = formData.last_name.trim().toLowerCase()
		const matchFirstName = (getFirstName(matchContact) || '').toLowerCase().trim()
		const matchLastName = (getLastName(matchContact) || '').toLowerCase().trim()
		const emailMatch = !!(formData.email && matchContact.email && (matchContact.email || '').toLowerCase().trim() === formData.email.trim().toLowerCase())
		const phoneMatch = !!(formData.phone && matchContact.phone && normalizePhone(matchContact.phone || '') === normalizePhone(formData.phone))
		const messengerMatch = !!(formData.messenger && matchContact.messenger && (matchContact.messenger || '').toLowerCase().trim() === formData.messenger.trim().toLowerCase())
		const sameName = matchFirstName === currentFirstName && matchLastName === currentLastName
		const similarName =
			!!currentFirstName &&
			!!currentLastName &&
			!!matchFirstName &&
			!!matchLastName &&
			isSimilar(matchFirstName, currentFirstName) &&
			isSimilar(matchLastName, currentLastName)

		if (!emailMatch && !phoneMatch && !messengerMatch && !sameName && !similarName) {
			return null
		}

		const sameContactDetails =
			(matchContact.email || '').toLowerCase().trim() === formData.email.trim().toLowerCase() &&
			normalizePhone(matchContact.phone || '') === normalizePhone(formData.phone) &&
			(matchContact.messenger || '').toLowerCase().trim() === formData.messenger.trim().toLowerCase()

		const type = sameName && sameContactDetails ? 'exact_contact' : 'similar'

		return {
			type,
			contact: matchContact
		}
	}

	async function fetchExistingRecruitmentContacts() {
		try {
			const response = await fetch(`/api/projects/${projectId}/management/recruitment?limit=500&page=1`)
			if (response.ok) {
				const responseData = await response.json()
				if (Array.isArray(responseData?.data?.data)) {
					existingRecruitmentContacts = responseData.data.data
				} else if (Array.isArray(responseData?.data)) {
					existingRecruitmentContacts = responseData.data
				} else {
					existingRecruitmentContacts = []
				}
			}
		} catch (error) {
			console.error('Error fetching existing recruitment contacts:', error)
			existingRecruitmentContacts = []
		}
	}

	function buildClientDuplicateWarnings() {
		const matches = existingRecruitmentContacts
			.map((contact) => contactToWarningMatch(contact))
			.filter(Boolean)
			.filter((match, index, self) => {
				const contact = match.contact || match
				const key = contact.id != null
					? `id:${contact.id}`
					: `${(contact.first_name||'').toLowerCase()}|${(contact.last_name||'').toLowerCase()}|${(contact.email||'').toLowerCase()}|${(contact.phone||'')}|${(contact.messenger||'').toLowerCase()}`
				return index === self.findIndex((item) => {
					const itemContact = item.contact || item
					const itemKey = itemContact.id != null
						? `id:${itemContact.id}`
						: `${(itemContact.first_name||'').toLowerCase()}|${(itemContact.last_name||'').toLowerCase()}|${(itemContact.email||'').toLowerCase()}|${(itemContact.phone||'')}|${(itemContact.messenger||'').toLowerCase()}`
					return itemKey === key
				})
			})

		if (matches.length === 0) return []

		// Deduplicate matches by id or name+email+phone
		const seen = new Set()
		const uniqueMatches: any[] = []
		for (const m of matches) {
			const c: any = m.contact || m
			const key = c.id != null ? `id:${c.id}` : `${(c.first_name||'').toLowerCase()}|${(c.last_name||'').toLowerCase()}|${(c.email||'').toLowerCase()}|${(c.phone||'')}`
			if (!seen.has(key)) {
				seen.add(key)
				uniqueMatches.push(m)
			}
		}

		return [{
			contact: getCurrentFormContact(),
			matches: uniqueMatches
		}]
	}

	function hasExactDuplicateWarning(warnings: any[]): boolean {
		return warnings.some((warning) =>
			(warning.matches || []).some((match: any) => {
				const matchContact: any = match.contact || match
				const sameName =
					(matchContact.first_name || '').toLowerCase().trim() === formData.first_name.trim().toLowerCase() &&
					(matchContact.last_name || '').toLowerCase().trim() === formData.last_name.trim().toLowerCase()
				const sameContactDetails =
					(matchContact.email || '').toLowerCase().trim() === formData.email.trim().toLowerCase() &&
					normalizePhone(matchContact.phone || '') === normalizePhone(formData.phone) &&
					(matchContact.messenger || '').toLowerCase().trim() === formData.messenger.trim().toLowerCase()

				return sameName && sameContactDetails && match.type === 'exact_contact'
			})
		)
	}

	function getExactMatches(warnings: any[]): any[] {
		const exact: any[] = []
		for (const warning of warnings) {
			for (const match of warning.matches || []) {
				const matchContact: any = match.contact || match
				const sameName =
					(matchContact.first_name || '').toLowerCase().trim() === formData.first_name.trim().toLowerCase() &&
					(matchContact.last_name || '').toLowerCase().trim() === formData.last_name.trim().toLowerCase()
				const sameContactDetails =
					(matchContact.email || '').toLowerCase().trim() === formData.email.trim().toLowerCase() &&
					normalizePhone(matchContact.phone || '') === normalizePhone(formData.phone) &&
					(matchContact.messenger || '').toLowerCase().trim() === formData.messenger.trim().toLowerCase()

				if (sameName && sameContactDetails && match.type === 'exact_contact') {
					exact.push(match)
				}
			}
		}
		return exact
	}

	async function saveContact(allowDuplicateName = false) {
		detachSelectedContactIfEdited()
		await fetchExistingRecruitmentContacts()
		showManualAddResults = false
		manualAddResults = null
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

		const isUsingSelectedExistingContact =
			selectedContact != null && isSelectedContactSnapshotMatchingForm(selectedContact)

		if (!allowDuplicateName && !isUsingSelectedExistingContact) {
			const warnings = buildClientDuplicateWarnings()
			if (warnings.length > 0) {
				duplicateWarnings = warnings
				duplicateWarningSource = hasExactDuplicateWarning(warnings) ? 'exact' : 'similar'
				showDuplicateWarning = true
				return
			}
		}

		saving = true

		try {
			const cleanData = {
				contact_id: selectedContact && isSelectedContactSnapshotMatchingForm(selectedContact) ? formData.contact_id : null,
				first_name: firstName,
				last_name: lastName,
				email: formData.email.trim() || null,
				phone: formData.phone.trim() || null,
				messenger: formData.messenger.trim() || null,
				section_id: formData.section_id,
				notes: formData.notes.trim() || null,
				contacted_by: formData.contacted_by.trim() || null,
				allow_duplicate_name: allowDuplicateName
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
				let handled = false
				const errorText = await response.clone().text().catch(() => '')
				const parsedErrorText = parseBackendErrorPayload(errorText)
				try {
					const errorData = await response.json()
					const duplicates = errorData.duplicate_warnings || errorData.duplicateWarnings || null
					if (response.status === 409 || errorData.code === 'POTENTIAL_DUPLICATE_RECRUITMENT_CONTACT' || errorData.code === 'EXACT_RECRUITMENT_CONTACT_ALREADY_EXISTS' || Array.isArray(duplicates)) {
						if (handleManualRecruitmentDuplicateResponse(errorData)) {
							handled = true
						} else {
							manualAddResultsTitle = 'Cannot Add Contact'
							manualAddResults = {
								imported: [],
								replaced: [],
								conflicts: [],
								errors: [
									`${getBackendErrorMessage(errorData, errorText, 'Unable to create contact')}`
								]
							}
							showManualAddResults = true
							handled = true
						}
					}
				} catch (jsonErr) {
					// response wasn't JSON — fall through to handle below
				}

				if (!handled && response.status === 409) {
					// Fallback: query existing contacts using the same search endpoint to build warnings
					try {
						const searchQuery = formData.email.trim() || formData.phone.trim() || `${firstName} ${lastName}`.trim()
						const resp = await fetch(`/api/projects/${projectId}/management/recruitment/search-contacts`, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ filter: searchQuery, criteria: { name: searchQuery, email: '', instruments: '', projects: '' } })
						})
						if (resp.ok) {
							const data = await resp.json()
							const contacts = data.data || data || []
							const matches = contacts.filter(Boolean).map(contactToWarningMatch)
							if (matches.length > 0) {
								const fallbackWarnings = [{
									contact: getCurrentFormContact(),
									matches
								}]
								if (allowDuplicateName) {
									const exactMatches = getExactMatches(fallbackWarnings)
									if (exactMatches.length > 0) {
										showExactDuplicateResults(exactMatches)
									} else {
										duplicateWarnings = fallbackWarnings
										duplicateWarningSource = hasExactDuplicateWarning(duplicateWarnings) ? 'exact' : 'similar'
										showDuplicateWarning = true
									}
								} else {
									if (hasExactDuplicateWarning(fallbackWarnings)) {
										showExactDuplicateResults(getExactMatches(fallbackWarnings))
									} else if (hasVisibleDuplicateMatches(fallbackWarnings)) {
										duplicateWarnings = fallbackWarnings
										duplicateWarningSource = 'similar'
										showDuplicateWarning = true
									} else {
										showExactDuplicateResults(selectedContact ? [selectedContact] : [getCurrentFormContact()])
									}
								}
								handled = true
							}
						}
					} catch (searchErr) {
						console.error('Error fetching duplicate search results:', searchErr)
					}
				}

				if (!handled) {
					// Last-resort: show generic error
					console.error('Error creating contact: status', response.status)
					if (response.status === 409) {
						const parsedErrorData = parsedErrorText
						if (handleManualRecruitmentDuplicateResponse(parsedErrorData)) {
							handled = true
						} else if (selectedContact) {
							showExactDuplicateResults([selectedContact])
						} else {
							const fallbackMessage = getBackendErrorMessage(
								parsedErrorData,
								errorText,
								'This contact is already in the recruitment contact list. Exact duplicates are not allowed'
							)

							manualAddResultsTitle = 'Cannot Add Contact'
							manualAddResults = {
								imported: [],
								replaced: [],
								conflicts: [],
								errors: [
									`${fallbackMessage}`
								]
							}
							showManualAddResults = true
						}
					} else {
						alert(`Error: ${errorText || 'Unable to create contact'}`)
					}
				}
			}
		} catch (error) {
			console.error('Error saving contact:', error)
			alert('Error saving contact')
		} finally {
			saving = false
		}
	}

	function cancelDuplicateWarning() {
		duplicateWarnings = []
		showDuplicateWarning = false
		duplicateWarningSource = 'similar'
	}

	async function confirmDuplicateWarning() {
		duplicateWarnings = []
		showDuplicateWarning = false
		duplicateWarningSource = 'similar'
		await saveContact(true)
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
							on:input={handleIdentityInput}
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
							on:input={handleIdentityInput}
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
					on:mousedown|preventDefault
					on:click={() => {
						formData.first_name = getFirstName(contact)
						formData.last_name = getLastName(contact)
						formData.contact_id = contact.id || null
						formData.email = contact.email || ''
						formData.phone = contact.phone || ''
						formData.messenger = contact.messenger || ''
						selectedContact = contact
						duplicateEmailContact = null
						duplicatePhoneContact = null
						duplicateWarnings = []
						showDuplicateWarning = false
						foundContacts = []
					}}
				>
					<div class="font-medium">
	{getFirstName(contact)} {getLastName(contact)}
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

{#if duplicateEmailContact}
	<div class="mt-3 p-3 border border-yellow-400 bg-yellow-50 rounded">
		⚠️ This email already belongs to
		<strong>
			{duplicateEmailContact.firstName}
			{duplicateEmailContact.lastName}
		</strong>
	</div>
{/if}

{#if duplicatePhoneContact}
	<div class="mt-3 p-3 border border-yellow-400 bg-yellow-50 rounded">
		⚠️ This phone number already belongs to
		<strong>
			{duplicatePhoneContact.firstName}
			{duplicatePhoneContact.lastName}
		</strong>
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
							on:input={handleIdentityInput}
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
							on:input={handleIdentityInput}
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
							on:input={handleIdentityInput}
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
					on:click={() => saveContact()}
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

{#if showDuplicateWarning}
	<div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
		<div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
			<div class="flex items-center gap-3 p-6 border-b bg-yellow-50">
				<AlertTriangle class="text-yellow-500" size={24} />
				<h3 class="text-lg font-semibold text-yellow-900">
					Potential duplicate(s) detected
				</h3>
			</div>

			<div class="p-6 space-y-5">
			<div class="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
				<p class="text-sm text-yellow-800">
					The contact you're adding may be a duplicate of existing contact(s). Review the similar contact(s) listed below.
				</p>
			</div>

				<div class="space-y-3">
					{#each duplicateWarnings as warning}
						<div class="border border-gray-200 rounded-lg p-3">
							<p class="font-semibold text-gray-900">
								{warning.contact?.first_name} {warning.contact?.last_name}
							</p>
							<div class="mt-2 space-y-1">
								{#each (warning.matches || []).slice(0, 3) as match}
									{@const matchContact = match.contact || match}
									{@const isExact = getExactMatches(duplicateWarnings).some(m => 
										m.contact.first_name === matchContact.first_name && 
										m.contact.last_name === matchContact.last_name
									)}
									<p class="text-sm" class:text-red-700={isExact} class:font-semibold={isExact} class:text-gray-600={!isExact}>
										{isExact ? '❌' : '⚠️'} {isExact ? 'Exact match:' : 'May be a duplicate of:'} {matchContact.first_name} {matchContact.last_name}
										{#if matchContact.email}
											({matchContact.email})
										{/if}
									</p>
								{/each}
							</div>
						</div>
					{/each}
				</div>

				<p class="text-sm text-gray-700">
					Do you still want to add this contact?
				</p>
			</div>

			<div class="flex justify-end gap-3 p-6 border-t bg-gray-50">
				<button
					type="button"
					on:click={cancelDuplicateWarning}
					class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
				>
					Cancel
				</button>
				<button
					type="button"
					on:click={confirmDuplicateWarning}
					disabled={saving}
					class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
				>
					{saving ? 'Adding...' : 'Add anyway'}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showManualAddResults}
	<div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
		<div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
			<div class="flex items-center gap-3 p-6 border-b" class:bg-yellow-50={isManualAddResultsPotentialDuplicate()} class:bg-red-50={!isManualAddResultsPotentialDuplicate()}>
				<AlertTriangle class={isManualAddResultsPotentialDuplicate() ? 'text-yellow-500' : 'text-red-500'} size={24} />
				<h3 class="text-lg font-semibold" class:text-yellow-900={isManualAddResultsPotentialDuplicate()} class:text-red-900={!isManualAddResultsPotentialDuplicate()}>{manualAddResultsTitle}</h3>
			</div>

			<div class="p-6 space-y-5">
				{#if manualAddResults?.errors && manualAddResults.errors.length > 0}
					<div class="border rounded-lg p-4" class:bg-yellow-50={isManualAddResultsPotentialDuplicate()} class:border-yellow-200={isManualAddResultsPotentialDuplicate()} class:bg-red-50={!isManualAddResultsPotentialDuplicate()} class:border-red-200={!isManualAddResultsPotentialDuplicate()}>
						<div class="mt-2 space-y-3">
							{#each getManualAddDisplayedErrors() as error}
								<p class="text-sm" class:text-yellow-800={isManualAddResultsPotentialDuplicate()} class:text-red-800={!isManualAddResultsPotentialDuplicate()}>{error}</p>
							{/each}

							{#if getManualAddResultsContact()}
								<p class="font-semibold" class:text-yellow-900={isManualAddResultsPotentialDuplicate()} class:text-red-900={!isManualAddResultsPotentialDuplicate()}>
									{getManualAddResultsContact().first_name} {getManualAddResultsContact().last_name}
								</p>
							{/if}

							{#if getManualAddResultsExactMatches().length > 0}
								<div class="space-y-1">
									{#each getManualAddResultsExactMatches() as match}
										<p class="text-sm text-red-800">
											❌ Exact match: {match.first_name} {match.last_name}{match.email ? ` (${match.email})` : ''}
										</p>
									{/each}
								</div>
							{/if}

							{#if isManualAddResultsPotentialDuplicate() && getManualAddResultsSimilarWarnings().length > 0}
								<div class="space-y-3">
									{#each getManualAddResultsSimilarWarnings() as warning}
										<div class="space-y-2">
											{#each warning.matches as match}
												{@const matchContact = match.contact || match}
												<p class="text-sm text-yellow-800">
													⚠️ May be a duplicate of: {matchContact.first_name} {matchContact.last_name}{matchContact.email ? ` (${matchContact.email})` : ''}
												</p>
											{/each}
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<div class="flex justify-end gap-3 p-6 border-t bg-gray-50">
				<button type="button" on:click={() => { showManualAddResults = false; manualAddResults = null }} class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">{isManualAddResultsPotentialDuplicate() ? 'Cancel' : 'Close'}</button>
				{#if isManualAddResultsPotentialDuplicate()}
					<button
						type="button"
						on:click={confirmManualAddResultsPotentialDuplicate}
						disabled={saving}
						class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
					>
						{saving ? 'Adding...' : 'Add anyway'}
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
