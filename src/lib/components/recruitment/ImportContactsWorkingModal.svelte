<!-- src/lib/components/recruitment/ImportContactsWorkingModal.svelte -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte'
	import { X, Upload, Search, Users, AlertTriangle, CheckCircle, Filter } from 'lucide-svelte'
	import AdvancedFilterer from '$lib/components/AdvancedFilterer.svelte'
	import QueryBuilder from '$lib/components/QueryBuilder.svelte'
	import type { Contact } from '$lib/types'
	import type { TableData } from '$lib/types/TableData'
	import {familyToEmoji, familyToStyle, levelSimplificator, levelToStyle} from '$lib/components/contact/StylesFunctions'

	export let projectId: string

	const dispatch = createEventDispatcher()

	let meta: any
	let data: TableData<Contact>
	let columns: any
	let options: {
		filters: {
			type: string;
			filtersDepth1: {
				type: string;
				filtersDepth2: { relation: string; column: string; operation: string; filter: string }[];
			}[];
		};
		page: number;
		limit: number;
		orderBy: string;
		order: string;
	} = {
		filters: {
			type: 'and',
			filtersDepth1: [
				{ type: 'or', filtersDepth2: [] },
				{ type: 'or', filtersDepth2: [] },
				{ type: 'or', filtersDepth2: [] },
				{ type: 'or', filtersDepth2: [] }
			]
		},
		page: 1,
		limit: 250,
		orderBy: 'id',
		order: 'asc'
	}

	let selectedContacts: Contact[] = []
	let importing = false
	let isLoaded = false
	let existingContacts: any[] = []

	let operations = ['none', '=', '!=', '>', '>=', '<', '<=', 'like']
	let typesOfWhere = ['and', 'or']
	let filterLevel: string[] = []
	let instrumentFamily: string[] = []
	let selectedLevelInstruments: [number, string | null][] = []

	let importResults: {
		imported: any[]
		replaced?: any[]
		conflicts: any[]
		errors: string[]
	} | null = null

	let showCompactErrorModal = false

	let showDuplicateConfirm = false
	let duplicateContact: Contact | null = null
	let duplicateMatches: any[] = []
	let duplicateSelectionMode: 'exact' | 'similar' = 'similar'
	let showAlreadyExistsWarning = false
	let alreadyExistsContact: Contact | null = null
	let alreadyExistsMatches: any[] = []
	let showImportDuplicateWarning = false
	let importDuplicateWarnings: any[] = []
	let duplicateWarningSource: 'client' | 'server' | 'server_exact' | null = null

	onMount(async () => {
		await Promise.all([fetchData(), fetchExistingContacts()])
	})

	async function fetchData() {
		try {
			let response = await fetch('/test/api', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(options)
			});

			if (response.status >= 400 && response.status < 500) {
				const jsonResponse = await response.json();
				const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
				alert(error);
				return;
			}

			if (response.ok) {
				const jsonResponse = await response.json();

				const mappedContacts = (jsonResponse.data.data || []).map(contact => ({
					...contact,
					firstName: contact.firstName || contact.first_name,
					lastName: contact.lastName || contact.last_name,
					email: contact.email || '',
					phone: contact.phone || '',
					messenger: contact.messenger || '',
					comments: contact.comments || '',
					projects: contact.projects || [],
					participants: contact.participants || []
				}));

				data = {
					data: mappedContacts,
					columns: ['id', 'firstName', 'lastName', 'email', 'messenger', 'phone', 'comments'],
					notOrderedColumns: ['instruments', 'projects']
				};
				meta = jsonResponse.data.meta;
				columns = jsonResponse.columns;
				isLoaded = true;
			}
		} catch (error) {
			alert('Error loading contacts');
		}
	}

	async function fetchExistingContacts() {
		try {
			const response = await fetch(`/api/projects/${projectId}/management/recruitment?limit=500&page=1`)
			if (response.ok) {
				const responseData = await response.json()
				if (Array.isArray(responseData?.data?.data)) {
					existingContacts = responseData.data.data
				} else if (Array.isArray(responseData?.data)) {
					existingContacts = responseData.data
				} else {
					existingContacts = []
				}

				if (data) {
					data = {
						...data,
						data: [...data.data]
					}
				}
			}
		} catch (error) {
			console.error('Error fetching existing contacts:', error)
		}
	}

	function isContactInProject(contact: Contact): boolean {
		return existingContacts.some((existing) => isExactExistingRecruitmentMatch(existing, contact))
	}

	function getContactFirstName(contact: any): string {
		return contact.firstName || contact.first_name || ''
	}

	function getContactLastName(contact: any): string {
		return contact.lastName || contact.last_name || ''
	}

	function getExistingRecruitmentFirstName(contact: any): string {
		return contact?.first_name || contact?.firstName || contact?.contact?.first_name || contact?.contact?.firstName || ''
	}

	function getExistingRecruitmentLastName(contact: any): string {
		return contact?.last_name || contact?.lastName || contact?.contact?.last_name || contact?.contact?.lastName || ''
	}

	function normalizeImportWarningContact(contact: any) {
		return {
			...contact,
			id: contact?.id ?? contact?.contact_id ?? contact?.contactId ?? null,
			first_name: getExistingRecruitmentFirstName(contact),
			last_name: getExistingRecruitmentLastName(contact),
			email: contact?.email || contact?.contact?.email || null,
			phone: contact?.phone || contact?.contact?.phone || null,
			messenger: contact?.messenger || contact?.contact?.messenger || null,
			status: contact?.status || contact?.contact?.status || 'Existing contact',
			source: contact?.source || contact?.contact?.source || null
		}
	}

	function normalizeImportWarningMatches(matches: any[] = []) {
		return matches
			.filter(Boolean)
			.map((match: any) => ({
				...match,
				contact: normalizeImportWarningContact(match.contact || match)
			}))
	}

	function getImportWarningContactDisplay(contact: any) {
		return normalizeImportWarningContact(contact || {})
	}

	function toComparisonContact(contact: any): Contact {
		return {
			...contact,
			id: contact?.id ?? contact?.contact_id ?? contact?.contactId ?? null,
			firstName: contact?.firstName || contact?.first_name || contact?.contact?.firstName || contact?.contact?.first_name || '',
			lastName: contact?.lastName || contact?.last_name || contact?.contact?.lastName || contact?.contact?.last_name || '',
			email: contact?.email || contact?.contact?.email || null,
			phone: contact?.phone || contact?.contact?.phone || null,
			messenger: contact?.messenger || contact?.contact?.messenger || null
		} as Contact
	}

	function getImportWarningMatches(warning: any) {
		const normalizedMatches = normalizeImportWarningMatches(warning?.matches || [])
		if (normalizedMatches.length > 0) {
			return normalizedMatches
		}

		const warningContact = warning?.contact || {}
		const fallbackContact = toComparisonContact(warningContact)

		const exactMatches = existingContacts
			.filter((existing) => isExactExistingRecruitmentMatch(existing, fallbackContact))
			.map((existing) => ({
				type: 'exact_contact',
				contact: normalizeImportWarningContact(existing)
			}))

		if (exactMatches.length > 0) {
			return exactMatches
		}

		const similarMatches = existingContacts
			.filter((existing) => {
				return areContactsSimilar(toComparisonContact(existing), fallbackContact)
			})
			.map((existing) => ({
				type: 'similar_contact',
				contact: normalizeImportWarningContact(existing)
			}))

		return similarMatches
	}

	function getDerivedImportDuplicateWarnings() {
		return selectedContacts
			.map((contact) => {
				const comparisonContact = toComparisonContact(contact)
				const exactMatches = existingContacts
					.filter((existing) => isExactExistingRecruitmentMatch(existing, comparisonContact))
					.map((existing) => ({
						type: 'exact_contact',
						contact: normalizeImportWarningContact(existing)
					}))

				const similarMatches = exactMatches.length > 0
					? exactMatches
					: existingContacts
						.filter((existing) => areContactsSimilar(toComparisonContact(existing), comparisonContact))
						.map((existing) => ({
							type: 'similar_contact',
							contact: normalizeImportWarningContact(existing)
						}))

				return {
					contact: normalizeImportWarningContact(contact),
					matches: similarMatches
				}
			})
			.filter((warning) => warning.matches.length > 0)
	}

	function getDisplayImportDuplicateWarnings() {
		if (importDuplicateWarnings.length > 0) {
			const enrichedWarnings = importDuplicateWarnings.map((warning) => ({
				...warning,
				contact: getImportWarningContactDisplay(warning.contact),
				matches: getImportWarningMatches(warning)
			}))

			if (enrichedWarnings.some((warning) => warning.matches.length > 0)) {
				return enrichedWarnings
			}
		}

		return getDerivedImportDuplicateWarnings()
	}

	function contactToDuplicateMatch(contact: any) {
		return {
			type: 'selected_contact',
			contact: {
				id: contact.id,
				first_name: getContactFirstName(contact),
				last_name: getContactLastName(contact),
				email: contact.email || null,
				phone: contact.phone || null,
				messenger: contact.messenger || null,
				status: 'Selected for import',
				source: 'Current selection'
			},
			match_id: contact.id,
			similarity: 1
		}
	}

	function isExactMatchType(match: any): boolean {
		return match?.type === 'exact_contact' || match?.type === 'exact_name'
	}

	function getImportMatchLabel(match: any): string {
		return isExactMatchType(match) ? '❌ Exact match:' : '⚠️ May be a duplicate of:'
	}

	function normalizePhone(value: string | null | undefined): string {
		return (value || '').replace(/\s|\/|\.|-/g, '').trim()
	}

	function normalizeMessenger(value: string | null | undefined): string {
		return (value || '').toLowerCase().trim()
	}

	function getExistingContactSourceId(existing: any): number | null {
		if (typeof existing?.contact_id === 'number') return existing.contact_id
		if (typeof existing?.contact?.id === 'number') return existing.contact.id
		return null
	}

	function hasIdenticalCommunicationDetails(first: any, second: any): boolean {
		return (
			((first?.email || '').toLowerCase().trim() === (second?.email || '').toLowerCase().trim()) &&
			(normalizePhone(first?.phone) === normalizePhone(second?.phone)) &&
			(normalizeMessenger(first?.messenger) === normalizeMessenger(second?.messenger))
		)
	}

	function hasExactExistingRecruitmentMatch(matches: any[], contact?: Contact | null): boolean {
		return matches.some((match) => {
			const matchContact = match.contact || match

			if (contact && isExactExistingRecruitmentMatch(matchContact, contact)) {
				return true
			}

			return isExactMatchType(match)
		})
	}

	function normalizeServerDuplicateWarnings(rawWarnings, defaultContact = null) {
		if (!rawWarnings) return []
		const arr = Array.isArray(rawWarnings) ? rawWarnings : [rawWarnings]
		return arr.map((item) => {
			if (item.contact) {
				return {
					contact: normalizeImportWarningContact(item.contact),
					matches: normalizeImportWarningMatches(Array.isArray(item.matches) ? item.matches : [])
				}
			}
			if (item.source_contact) {
				return {
					contact: normalizeImportWarningContact(item.source_contact),
					matches: normalizeImportWarningMatches(Array.isArray(item.matches) ? item.matches : [])
				}
			}
			if (Array.isArray(item.matches) && item.matches.length > 0) {
				return {
					contact: normalizeImportWarningContact(defaultContact || { first_name: '', last_name: '' }),
					matches: normalizeImportWarningMatches(item.matches)
				}
			}
			if (item.first_name || item.last_name || item.email) {
				return {
					contact: normalizeImportWarningContact({
						first_name: item.first_name || '',
						last_name: item.last_name || '',
						email: item.email || null,
						phone: item.phone || null,
						messenger: item.messenger || null
					}),
					matches: []
				}
			}
			return {
				contact: normalizeImportWarningContact(defaultContact || { first_name: '', last_name: '' }),
				matches: []
			}
		})
	}

	function hasExactWarningMatch(warning: any): boolean {
		const warningContact = warning?.contact || {}
		const warningFirstName = (warningContact.first_name || '').toLowerCase().trim()
		const warningLastName = (warningContact.last_name || '').toLowerCase().trim()
		return (warning?.matches || []).some((match: any) => {
			const matchContact = match.contact || match
			const matchFirstName = (matchContact.first_name || '').toLowerCase().trim()
			const matchLastName = (matchContact.last_name || '').toLowerCase().trim()

			const sameName = warningFirstName === matchFirstName && warningLastName === matchLastName
			return sameName && hasIdenticalCommunicationDetails(warningContact, matchContact) && isExactMatchType(match)
		})
	}

	function hasAnyExactImportWarnings(warnings: any[]): boolean {
		return warnings.some((warning) =>
			warning?.warning_type === 'exact_existing_contact' ||
			hasExactWarningMatch(warning) ||
			(warning?.matches || []).some((match: any) => isExactMatchType(match))
		)
	}

	function isExactExistingRecruitmentMatch(existing: any, contact: Contact): boolean {
		const existingSourceId = getExistingContactSourceId(existing)
		if (existingSourceId != null && contact.id != null) {
			if (existingSourceId === contact.id) {
				return hasIdenticalRecruitmentContactInformation(existing, contact)
			}
		}

		return hasIdenticalRecruitmentContactInformation(existing, contact)
	}

	function hasIdenticalRecruitmentContactInformation(existing: any, contact: Contact): boolean {
		const existingFirstName = getExistingRecruitmentFirstName(existing).toLowerCase().trim()
		const existingLastName = getExistingRecruitmentLastName(existing).toLowerCase().trim()
		const contactFirstName = getContactFirstName(contact).toLowerCase().trim()
		const contactLastName = getContactLastName(contact).toLowerCase().trim()

		return (
			existingFirstName === contactFirstName &&
			existingLastName === contactLastName &&
			hasIdenticalCommunicationDetails(existing, contact)
		)
	}

	function isExactDuplicateImportError(error: string): boolean {
		return error.includes('already in the recruitment contact list')
	}

	function parseImportErrorPayload(error: string) {
		if (!error) return null
		try {
			return JSON.parse(error)
		} catch {
			return null
		}
	}

	function getImportErrorExactWarnings() {
		if (!importResults?.errors?.length) return []

		const payloads = importResults.errors
			.map((error) => parseImportErrorPayload(error))
			.filter(Boolean)

		const warnings = payloads.flatMap((payload: any) =>
			normalizeServerDuplicateWarnings(payload?.duplicate_warnings || payload?.duplicateWarnings || null)
		)

		return warnings.filter((warning) => hasExactWarningMatch(warning) || warning?.warning_type === 'exact_existing_contact')
	}

	function getExactDuplicateMatchesForContact(contact: Contact): any[] {
		return existingContacts.filter((existing) => isExactExistingRecruitmentMatch(existing, contact))
	}

	function getExactDuplicateResultEntries() {
		if (!importResults || importResults.errors.length === 0) return []

		return selectedContacts
			.map((contact) => ({
				contact,
				matches: getExactDuplicateMatchesForContact(contact)
			}))
			.filter((entry) => entry.matches.length > 0)
	}

	function findSimilarContacts(contact: Contact): any[] {
		const similar = existingContacts.filter(existing => {
			if (existing.email && contact.email &&
				existing.email.toLowerCase() === contact.email.toLowerCase()) return true

			const firstName1 = (existing.first_name || '').toLowerCase().trim()
			const lastName1 = (existing.last_name || '').toLowerCase().trim()
			const firstName2 = getContactFirstName(contact).toLowerCase().trim()
			const lastName2 = getContactLastName(contact).toLowerCase().trim()

			if (firstName1 === firstName2 && lastName1 === lastName2) return true

			const similarity = calculateNameSimilarity(firstName1 + ' ' + lastName1, firstName2 + ' ' + lastName2)
			return similarity > 0.8
		})

		const selectedSimilar = selectedContacts
			.filter(selected => selected.id !== contact.id)
			.filter(selected => areContactsSimilar(selected, contact))
			.map(contactToDuplicateMatch)

		return [...similar, ...selectedSimilar]
	}

	function areContactsSimilar(firstContact: Contact, secondContact: Contact): boolean {
		if (firstContact.email && secondContact.email &&
			firstContact.email.toLowerCase() === secondContact.email.toLowerCase()) return true

		const firstName1 = getContactFirstName(firstContact).toLowerCase().trim()
		const lastName1 = getContactLastName(firstContact).toLowerCase().trim()
		const firstName2 = getContactFirstName(secondContact).toLowerCase().trim()
		const lastName2 = getContactLastName(secondContact).toLowerCase().trim()

		if (!firstName1 || !lastName1 || !firstName2 || !lastName2) return false
		if (firstName1 === firstName2 && lastName1 === lastName2) return true

		const similarity = calculateNameSimilarity(firstName1 + ' ' + lastName1, firstName2 + ' ' + lastName2)
		return similarity > 0.8
	}

	function calculateNameSimilarity(name1: string, name2: string): number {
		const longer = name1.length > name2.length ? name1 : name2
		const shorter = name1.length > name2.length ? name2 : name1

		if (longer.length === 0) return 1.0

		const editDistance = getEditDistance(longer, shorter)
		return (longer.length - editDistance) / longer.length
	}

	function getEditDistance(s1: string, s2: string): number {
		const costs = []
		for (let i = 0; i <= s2.length; i++) {
			let lastValue = i
			for (let j = 0; j <= s1.length; j++) {
				if (i === 0) {
					costs[j] = j
				} else if (j > 0) {
					let newValue = costs[j - 1]
					if (s1.charAt(j - 1) !== s2.charAt(i - 1)) {
						newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
					}
					costs[j - 1] = lastValue
					lastValue = newValue
				}
			}
			if (i > 0) {
				costs[s1.length] = lastValue
			}
		}
		return costs[s1.length]
	}

	function toggleContactSelection(contact: Contact) {
		const index = selectedContacts.findIndex(c => c.id === contact.id)
		if (index >= 0) {
			selectedContacts = selectedContacts.filter(c => c.id !== contact.id)
		} else {
			selectedContacts = [...selectedContacts, contact]
		}
	}

	function confirmDuplicateImport() {
		if (duplicateSelectionMode === 'exact') {
			cancelDuplicateImport()
			return
		}

		if (duplicateContact) {
			selectedContacts = [...selectedContacts, duplicateContact]
		}
		showDuplicateConfirm = false
		duplicateContact = null
		duplicateMatches = []
		duplicateSelectionMode = 'similar'
	}

	function cancelDuplicateImport() {
		showDuplicateConfirm = false
		duplicateContact = null
		duplicateMatches = []
		duplicateSelectionMode = 'similar'
	}

	function closeAlreadyExistsWarning() {
		showAlreadyExistsWarning = false
		alreadyExistsContact = null
		alreadyExistsMatches = []
	}

	function selectAllContacts() {
		const availableContacts = data.data.filter(contact => !isContactInProject(contact))
		selectedContacts = [...availableContacts]
	}

	function clearSelection() {
		selectedContacts = []
	}

	async function importSelectedContacts(allowDuplicateName = false, skipClientDuplicateCheck = false, replaceExisting = false) {
		if (selectedContacts.length === 0) {
			alert('No contact selected')
			return
		}

		await fetchExistingContacts()

		if (!allowDuplicateName && !skipClientDuplicateCheck) {
			const duplicateWarnings = findSelectedDuplicateWarnings()
			if (duplicateWarnings.length > 0) {
				importDuplicateWarnings = duplicateWarnings
				duplicateWarningSource = 'client'
				showImportDuplicateWarning = true
				return
			}
		}

		importing = true

		try {
			const response = await fetch(`/api/projects/${projectId}/management/recruitment/contacts/import`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contact_ids: selectedContacts.map(c => c.id).filter(id => id != null),
					allow_duplicate_name: allowDuplicateName,
					replace_existing: replaceExisting
				})
			})

			if (response.ok) {
				importResults = await response.json()

				if (importResults && (importResults.imported.length > 0 || (importResults.replaced || []).length > 0 || importResults.conflicts.length > 0)) {
					dispatch('contactsImported', importResults)
				}
			} else {
					const errorText = await response.text()
					let handled = false
					try {
						const errorData = JSON.parse(errorText)
						const duplicates = errorData.duplicate_warnings || errorData.duplicateWarnings || null
						if (response.status === 409 || errorData.code === 'POTENTIAL_DUPLICATE_RECRUITMENT_CONTACT' || errorData.code === 'EXACT_RECRUITMENT_CONTACT_ALREADY_EXISTS' || Array.isArray(duplicates)) {
							await fetchExistingContacts()
							const normalizedWarnings = normalizeServerDuplicateWarnings(duplicates || errorData)
							if (allowDuplicateName) {
								importResults = {
									imported: [],
									replaced: [],
									conflicts: [],
									errors: [
										hasAnyExactImportWarnings(normalizedWarnings) || errorData.code === 'EXACT_RECRUITMENT_CONTACT_ALREADY_EXISTS'
											? 'This contact is already in the recruitment contact list.'
											: (errorData.error || errorData.message || 'Import conflict detected.')
									]
								}
								importDuplicateWarnings = []
								duplicateWarningSource = null
								showImportDuplicateWarning = false
							} else if (hasAnyExactImportWarnings(normalizedWarnings) || errorData.code === 'EXACT_RECRUITMENT_CONTACT_ALREADY_EXISTS') {
								importResults = {
									imported: [],
									replaced: [],
									conflicts: [],
									errors: ['This contact is already in the recruitment contact list.']
								}
								importDuplicateWarnings = []
								duplicateWarningSource = null
								showImportDuplicateWarning = false
							} else {
								importDuplicateWarnings = normalizedWarnings
								duplicateWarningSource = 'server'
								showImportDuplicateWarning = true
							}
							handled = true
							return
						}
					} catch (e) {
						
					}
					if (!handled) {
						alert(`Import error: ${errorText}`)
					}
			}
		} catch (error) {
			alert('Error importing contacts')
		} finally {
			importing = false
		}
	}

	function cancelImportDuplicateWarning() {
		showImportDuplicateWarning = false
		importDuplicateWarnings = []
		duplicateWarningSource = null
	}

	async function confirmImportDuplicateWarning() {
		showImportDuplicateWarning = false
		importDuplicateWarnings = []
		duplicateWarningSource = null
		await importSelectedContacts(true, true, false)
	}

	function findSelectedDuplicateWarnings() {
		const warnings: any[] = []

		for (let i = 0; i < selectedContacts.length; i++) {
			const contact = selectedContacts[i]
			const matches = selectedContacts
				.slice(0, i)
				.filter(previousContact => areContactsSimilar(previousContact, contact))
				.map(contactToDuplicateMatch)

			if (matches.length > 0) {
				warnings.push({
					contact: {
						id: contact.id,
						first_name: getContactFirstName(contact),
						last_name: getContactLastName(contact),
						email: contact.email || null,
						phone: contact.phone || null,
						messenger: contact.messenger || null
					},
					matches
				})
			}
		}

		return warnings
	}

	function closeModal() {
		dispatch('close')
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal()
		}
	}

	function resetImport() {
		importResults = null
		selectedContacts = []
		options = {
			filters: {
				type: 'and',
				filtersDepth1: [
					{ type: 'or', filtersDepth2: [] },
					{ type: 'or', filtersDepth2: [] },
					{ type: 'or', filtersDepth2: [] },
					{ type: 'or', filtersDepth2: [] }
				]
			},
			page: 1,
			limit: 250,
			orderBy: 'id',
			order: 'asc'
		}
		fetchData()
	}

	function getContactInstruments(contact: Contact): string {
		if (!contact.instruments || contact.instruments.length === 0) return ''
		return contact.instruments.map(i => `${i.name} (${i.pivot_proficiency_level || 'Not specified'})`).join(', ')
	}

	function getContactProjects(contact: Contact): string {
		if (contact.projects && contact.projects.length > 0) {
			const projects = contact.projects
				.map(p => p.name)
				.filter(Boolean)
				.slice(0, 3)
			return projects.join(', ') + (contact.projects.length > 3 ? '...' : '')
		}

		if (contact.participants && contact.participants.length > 0) {
			const projects = contact.participants
				.map(p => p.project?.name)
				.filter(Boolean)
				.slice(0, 3)
			return projects.join(', ') + (contact.participants.length > 3 ? '...' : '')
		}

		return ''
	}

	$: showCompactErrorModal =
		!!importResults &&
		importResults.errors.length > 0 &&
		importResults.imported.length === 0 &&
		(importResults.replaced || []).length === 0 &&
		importResults.conflicts.length === 0
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
	<div class="bg-white rounded-lg shadow-xl w-full mx-4 overflow-y-auto {showCompactErrorModal ? 'max-w-2xl max-h-[80vh]' : 'max-w-7xl max-h-[95vh]'}">
		<!-- Header -->
		<div class="flex items-center justify-between p-6 border-b bg-gray-50">
			<div class="flex items-center gap-2">
				<Upload class="text-[#6B9AD9]" size={24} />
				<h2 class="text-xl font-semibold">Import Contacts from Database</h2>
			</div>
			<button
				on:click={closeModal}
				class="text-gray-400 hover:text-gray-600 transition-colors"
			>
				<X size={24} />
			</button>
		</div>

		<!-- Content -->
		<div class="p-6">
			{#if !importResults}
				<!-- Advanced Search -->
				<div class="space-y-6">
					{#if isLoaded && data && columns}
						<div class="bg-white rounded-lg border border-gray-200 p-4">
							<QueryBuilder
								bind:columns
								bind:options
								bind:operations
								bind:typesOfWhere
								bind:filterLevel
								bind:instrumentFamily
								bind:selectedLevelInstruments
								on:optionsUpdated={fetchData}
							/>
						</div>
					{/if}
				</div>

				<!-- Results -->
				{#if isLoaded && data}
					<div class="bg-white rounded-lg p-4 mt-6">
						<!-- Selection actions -->
						<div class="flex items-center justify-between mb-4">
							<h4 class="font-semibold text-gray-900 flex items-center gap-2">
								<Users size={20} class="text-[#6B9AD9]" />
								Available contacts ({data.data.length})
								{#if existingContacts.length > 0}
									<span class="text-sm text-gray-500">
										({data.data.filter(c => !isContactInProject(c)).length} not in project)
									</span>
								{/if}
							</h4>

							{#if data.data.length > 0}
								<div class="flex gap-2">
									<button
										on:click={selectAllContacts}
										class="px-3 py-1 text-sm bg-[#6B9AD9] text-white hover:bg-[#5a9bb4] rounded-lg font-semibold"
									>
										Select all available
									</button>
									{#if selectedContacts.length > 0}
										<button
											on:click={clearSelection}
											class="px-3 py-1 text-sm bg-red-500 text-white hover:bg-red-600 rounded-lg font-semibold"
										>
											Deselect ({selectedContacts.length})
										</button>
									{/if}
								</div>
							{/if}
						</div>

						{#if data.data.length === 0}
							<div class="text-center py-12">
								<Users size={64} class="mx-auto mb-4 opacity-30 text-gray-400" />
								<h3 class="text-lg font-medium text-gray-900">No contacts found</h3>
								<p class="text-gray-500 mt-2">
									Try modifying your search criteria or reset the filters.
								</p>
							</div>
						{:else}
							<!-- Contacts table -->
							<div class="border border-gray-200 rounded-lg overflow-hidden">
								<div class="max-h-96 overflow-y-auto">
									<table class="w-full text-sm">
										<thead class="bg-gray-50 sticky top-0">
										<tr>
											<th class="px-4 py-3 text-left w-12">
												<input
													type="checkbox"
													checked={selectedContacts.length === data.data.filter(c => !isContactInProject(c)).length && data.data.filter(c => !isContactInProject(c)).length > 0}
													on:change={(e) => e.target.checked ? selectAllContacts() : clearSelection()}
													class="rounded"
												/>
											</th>
											<th class="px-4 py-3 text-left font-semibold">Contact</th>
											<th class="px-4 py-3 text-left font-semibold">Instruments & Levels</th>
											<th class="px-4 py-3 text-left font-semibold">Past projects</th>
											<th class="px-4 py-3 text-left font-semibold">Status</th>
											<th class="px-4 py-3 text-left font-semibold">In Project</th>
										</tr>
										</thead>
										<tbody>
										{#each data.data as contact (contact.id)}
											{@const isInProject = isContactInProject(contact)}
											<tr class="border-t hover:bg-gray-50 {isInProject ? 'bg-yellow-50' : ''}">
												<td class="px-4 py-3">
													<input
														type="checkbox"
														checked={selectedContacts.some(c => c.id === contact.id)}
														on:change={() => toggleContactSelection(contact)}
														class="rounded"
													/>
												</td>
												<td class="px-4 py-3">
													<div class="flex items-center space-x-3">
														<div class="w-10 h-10 bg-[#6B9AD9] rounded-full flex items-center justify-center">
															<span class="text-white font-bold text-sm">
																{(contact.firstName || contact.first_name || 'F').charAt(0)}{(contact.lastName || contact.last_name || 'L').charAt(0)}
															</span>
														</div>
														<div>
															<div class="font-medium text-gray-900">
																{contact.firstName || contact.first_name || 'First name'} {contact.lastName || contact.last_name || 'Last name'}
															</div>
															{#if contact.messenger}
																<div class="text-sm text-gray-500">Messenger: {contact.messenger}</div>
															{/if}
														</div>
													</div>
												</td>
												<td class="px-4 py-3">
													<div class="text-sm text-gray-600">
														{#if contact.instruments && contact.instruments.length > 0}
															{#each contact.instruments as instrument}
																<div class="flex gap-2 my-1">
																	<div class="{familyToStyle(instrument.family)} font-semibold rounded-lg p-1 px-2">
																		{familyToEmoji(instrument.family)} {instrument.name}
																	</div>
																	{#if instrument.pivot_proficiency_level}
																		<div class="{levelToStyle(instrument.pivot_proficiency_level)} border-2 p-1 px-2 rounded-lg font-semibold">
																			{levelSimplificator(instrument.pivot_proficiency_level)}
																		</div>
																	{/if}
																</div>
															{/each}
														{:else}
															<span class="text-gray-400 italic">No instrument</span>
														{/if}
													</div>
												</td>
												<td class="px-4 py-3 text-sm text-gray-600">
													{getContactProjects(contact) || '-'}
												</td>
												<td class="px-4 py-3">
													<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {contact.validated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
														{contact.validated ? 'Validated' : 'Pending validation'}
													</span>
												</td>
												<td class="px-4 py-3">
													{#if isInProject}
														<div class="flex items-center gap-2">
															<CheckCircle size={16} class="text-green-500" />
															<span class="text-sm font-medium text-green-700">Already in project</span>
														</div>
													{:else}
														<div class="flex items-center gap-2">
															<X size={16} class="text-gray-400" />
															<span class="text-sm text-gray-500">Available</span>
														</div>
													{/if}
												</td>
											</tr>
										{/each}
										</tbody>
									</table>
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<!-- Initial loading -->
					<div class="text-center py-12">
						<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B9AD9] mx-auto mb-4"></div>
						<p class="text-gray-600">Loading contacts and filters...</p>
					</div>
				{/if}

				<!-- Import actions -->
				{#if selectedContacts.length > 0}
					<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
						<div class="flex items-center justify-between">
							<div>
								<h4 class="font-semibold text-blue-900">
									Ready to import {selectedContacts.length} contact(s)
								</h4>
								<p class="text-sm text-blue-700 mt-1">
									These contacts will be added to your recruitment list with "Not yet contacted" status.
								</p>
							</div>
							<button
								on:click={() => importSelectedContacts()}
								disabled={importing}
								class="px-6 py-3 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] disabled:opacity-50 flex items-center gap-2 font-semibold"
							>
								{#if importing}
									<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
								{/if}
								{importing ? 'Importing...' : 'Import contacts'}
							</button>
						</div>
					</div>
				{/if}

			{:else}
				<!-- Import results -->
				<div class="space-y-4">
					<h3 class="text-lg font-semibold text-gray-900">Import results</h3>

					<!-- Success -->
					{#if importResults.imported.length > 0}
						<div class="bg-green-50 border border-green-200 rounded-lg p-4">
							<div class="flex items-start gap-2">
								<CheckCircle class="text-green-500 mt-0.5 flex-shrink-0" size={20} />
								<div>
									<h4 class="font-semibold text-green-900">
										{importResults.imported.length} contact(s) imported successfully
									</h4>
									<div class="mt-2 max-h-32 overflow-y-auto">
										{#each importResults.imported as contact}
											<p class="text-sm text-green-800">
												{contact.first_name} {contact.last_name}
											</p>
										{/each}
									</div>
								</div>
							</div>
						</div>
					{/if}

					{#if (importResults.replaced || []).length > 0}
						<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<div class="flex items-start gap-2">
								<CheckCircle class="text-blue-500 mt-0.5 flex-shrink-0" size={20} />
								<div>
									<h4 class="font-semibold text-blue-900">
										{(importResults.replaced || []).length} existing contact(s) replaced
									</h4>
									<div class="mt-2 max-h-32 overflow-y-auto">
										{#each (importResults.replaced || []) as contact}
											<p class="text-sm text-blue-800">
												{contact.first_name} {contact.last_name}
											</p>
										{/each}
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Conflicts -->
					{#if importResults.conflicts.length > 0}
						<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
							<div class="flex items-start gap-2">
								<AlertTriangle class="text-yellow-500 mt-0.5 flex-shrink-0" size={20} />
								<div>
									<h4 class="font-semibold text-yellow-900">
										{importResults.conflicts.length} conflict(s) detected
									</h4>
									<p class="text-sm text-yellow-800 mt-1">
										These contacts are already in your recruitment list:
									</p>
									<div class="mt-2 max-h-32 overflow-y-auto">
										{#each importResults.conflicts as conflict}
											<p class="text-sm text-yellow-800">
												{conflict.contact.firstName} {conflict.contact.lastName}
												(current status: {conflict.existing_status})
											</p>
										{/each}
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Errors -->
					{#if importResults.errors.length > 0}
						<div class="bg-red-50 border border-red-200 rounded-lg p-4">
							<div class="flex items-start gap-2">
								<AlertTriangle class="text-red-500 mt-0.5 flex-shrink-0" size={20} />
								<div>
									<h4 class="font-semibold text-red-900">
										{importResults.errors.length} error(s)
									</h4>
									{#if showCompactErrorModal && ((importResults.errors.every(isExactDuplicateImportError) && getExactDuplicateResultEntries().length > 0) || getImportErrorExactWarnings().length > 0)}
										<div class="mt-3 space-y-4">
											<p class="text-sm text-red-800">
												This contact is already in this recruitment list. Exact duplicates are not allowed.
											</p>

											{#if getImportErrorExactWarnings().length > 0}
												{#each getImportErrorExactWarnings() as warning}
													<div class="space-y-2">
														<p class="font-semibold text-red-900">
															{warning.contact?.first_name} {warning.contact?.last_name}
														</p>
														{#each warning.matches as match}
															{@const matchContact = match.contact || match}
															<p class="text-sm text-red-800">
																❌ Exact match: {matchContact.first_name} {matchContact.last_name}{matchContact.email ? ` (${matchContact.email})` : ''}
															</p>
														{/each}
													</div>
												{/each}
											{:else}
											{#each getExactDuplicateResultEntries() as entry}
												<div class="space-y-2">
													<p class="font-semibold text-red-900">
														{getContactFirstName(entry.contact)} {getContactLastName(entry.contact)}
													</p>
													{#each entry.matches as match}
														<p class="text-sm text-red-800">
															❌ Exact match: {match.first_name} {match.last_name}{match.email ? ` (${match.email})` : ''}
														</p>
													{/each}
												</div>
											{/each}
											{/if}
										</div>
									{:else}
										<div class="mt-2 max-h-32 overflow-y-auto">
											{#each importResults.errors as error}
												<p class="text-sm text-red-800">{error}</p>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Footer -->
		<div class="flex justify-end gap-3 p-6 border-t bg-gray-50">
			<button
				type="button"
				on:click={closeModal}
				class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
			>
				{importResults ? 'Close' : 'Cancel'}
			</button>

			{#if importResults}
				<button
					type="button"
					on:click={resetImport}
					class="px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4]"
				>
					New import
				</button>
			{/if}
		</div>
	</div>
</div>

<!-- Modal de confirmation de doublon -->
{#if showDuplicateConfirm}
	<div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
		<div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
			<div class="flex items-center justify-between p-6 border-b bg-red-50">
				<div class="flex items-center gap-3">
					<AlertTriangle class="text-red-500" size={24} />
					<h3 class="text-lg font-semibold text-red-800">Potential Duplicate Detected</h3>
				</div>
			</div>

			<div class="p-6">
				<div class="mb-4">
					<h4 class="font-medium text-gray-900 mb-2">Contact to import:</h4>
					<div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
						<p class="font-semibold">
							{duplicateContact?.firstName || duplicateContact?.first_name} {duplicateContact?.lastName || duplicateContact?.last_name}
						</p>
						{#if duplicateContact?.email}
							<p class="text-sm text-gray-600">{duplicateContact.email}</p>
						{/if}
					</div>
				</div>

				<div class="mb-6">
					<h4 class="font-medium text-gray-900 mb-2">
						Similar contacts already in project:
					</h4>
					<div class="space-y-3">
						{#each duplicateMatches as match}
							{@const matchContact = match.contact || match}
							<p class="text-sm text-gray-700">
								{getImportMatchLabel(match)} {matchContact.first_name} {matchContact.last_name}{matchContact.email ? ` (${matchContact.email})` : ''}
							</p>
						{/each}
					</div>
				</div>

				<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
					<p class="text-sm text-red-700">
						<strong>Warning:</strong> This contact appears to be similar to existing contacts in your recruitment list.
						Importing duplicates may cause confusion in your recruitment process.
					</p>
				</div>

				<p class="text-gray-600 mb-6">
					Do you want to import this contact anyway?
				</p>
			</div>

			<div class="flex justify-end gap-3 p-6 border-t bg-gray-50">
				<button
					type="button"
					on:click={cancelDuplicateImport}
					class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
				>
					Cancel
				</button>
				<button
					type="button"
					on:click={confirmDuplicateImport}
					class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
				>
					Import anyway
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showAlreadyExistsWarning}
	<div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
		<div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
			<div class="flex items-center justify-between p-6 border-b bg-red-50">
				<div class="flex items-center gap-3">
					<AlertTriangle class="text-red-500" size={24} />
					<h3 class="text-lg font-semibold text-red-800">Contact Already in Recruitment</h3>
				</div>
			</div>

			<div class="p-6">
				<div class="mb-4">
					<h4 class="font-medium text-gray-900 mb-2">Contact:</h4>
					<div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
						<p class="font-semibold">
							{alreadyExistsContact?.firstName || alreadyExistsContact?.first_name} {alreadyExistsContact?.lastName || alreadyExistsContact?.last_name}
						</p>
						{#if alreadyExistsContact?.email}
							<p class="text-sm text-gray-600">{alreadyExistsContact.email}</p>
						{/if}
					</div>
				</div>

				<div class="mb-6">
					<h4 class="font-medium text-gray-900 mb-2">Existing recruitment contact:</h4>
					<div class="space-y-3">
						{#each alreadyExistsMatches as match}
							{@const matchContact = match.contact || match}
							<p class="text-sm text-gray-700">
								{getImportMatchLabel(match)} {matchContact.first_name} {matchContact.last_name}{matchContact.email ? ` (${matchContact.email})` : ''}
							</p>
						{/each}
					</div>
				</div>

				<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
					<p class="text-sm text-red-700">
						<strong>Warning:</strong> This contact already exists in your recruitment list and cannot be imported again.
					</p>
				</div>

				<p class="text-gray-600 mb-6">
					Close this message to keep the existing recruitment contact.
				</p>
			</div>

			<div class="flex justify-end gap-3 p-6 border-t bg-gray-50">
				<button
					type="button"
					on:click={closeAlreadyExistsWarning}
					class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showImportDuplicateWarning}
	<div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
		<div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
			<div class="flex items-center gap-3 p-6 border-b bg-yellow-50">
				<AlertTriangle class="text-yellow-500" size={24} />
				<h3 class="text-lg font-semibold text-yellow-900">Import conflicts detected</h3>
			</div>

			<div class="p-6 space-y-5">
				<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<p class="text-sm text-yellow-800 font-semibold mb-2">Duplicate or similar contact detected</p>
					<p class="text-sm text-yellow-700">
						One or more selected contacts look similar to contacts already in this recruitment list. You can import them anyway as separate entries.
					</p>
				</div>

				<div class="space-y-3">
					{#each getDisplayImportDuplicateWarnings() as warning}
						{@const warningContact = warning.contact}
						{@const warningMatches = warning.matches}
						<div class="border rounded-lg p-3 bg-yellow-50 border-yellow-200">
							<div class="flex items-start gap-2">
								<div class="flex-1">
									<p class="font-semibold text-gray-900">
										{warningContact.first_name} {warningContact.last_name}
									</p>
									{#if warningContact.email}
										<p class="text-xs text-gray-600 mt-1">Email: {warningContact.email}</p>
									{/if}
									{#if warningContact.phone}
										<p class="text-xs text-gray-600">Phone: {warningContact.phone}</p>
									{/if}
									{#if warningContact.messenger}
										<p class="text-xs text-gray-600">Messenger: {warningContact.messenger}</p>
									{/if}
									{#if warningMatches.length > 0}
										<div class="mt-2 pt-2 border-t border-gray-300">
											<p class="text-xs font-semibold text-gray-700 mb-1">Existing contact(s):</p>
											<div class="space-y-2">
												{#each warningMatches.slice(0, 3) as match}
													{@const matchContact = getImportWarningContactDisplay(match.contact || match)}
													<p class="text-sm text-gray-700">
														{getImportMatchLabel(match)} {matchContact.first_name} {matchContact.last_name}{matchContact.email ? ` (${matchContact.email})` : ''}
													</p>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="flex justify-end gap-3 p-6 border-t bg-gray-50">
				<button
						type="button"
						on:click={cancelImportDuplicateWarning}
						class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
					>
						Cancel
					</button>
					<button
						type="button"
						on:click={confirmImportDuplicateWarning}
						disabled={importing}
						class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
					>
						{importing ? 'Importing...' : 'Import anyway'}
					</button>
			</div>
		</div>
	</div>
{/if}
