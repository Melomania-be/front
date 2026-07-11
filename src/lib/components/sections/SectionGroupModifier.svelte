<script lang="ts">
	import type { Instrument } from '$lib/types/Instrument';
	import type { Section } from '$lib/types/Section';
	import type { SectionGroup } from '$lib/types/SectionGroup';
	import { onMount } from 'svelte';
	import Sortable from 'sortablejs';
	import Fa from 'svelte-fa';
	import {
		faPlus,
		faEdit,
		faTrash,
		faSave,
		faXmark,
		faCopy,
		faUsers,
		faMusic
	} from '@fortawesome/free-solid-svg-icons';
	import { slide } from 'svelte/transition';

	let sectionsGroups: SectionGroup[] = [];
	let sections: Section[] = [];
	let instruments: Instrument[] = [];

	let popUpGroup = false;
	let popUpSection = false;
	let popUpInstrument = false;

	let editingGroup: SectionGroup | null = null;
	let editingSection: Section | null = null;
	let editingInstrument: Instrument | null = null;

	let groupName = '';
	let sectionName = '';
	let sectionSize = 1;
	let instrumentName = '';
	let instrumentFamily = '';

	let selectedInstruments: number[] = [];
	let selectedSections: number[] = [];
	let sectionsGroupTmpContainer: HTMLElement;

	let isMobile = false;

	const checkMobile = () => {
		isMobile = window.innerWidth <= 1000;
	};

	onMount(async () => {
		checkMobile();
		window.addEventListener('resize', checkMobile);

		await fetchData();

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});

	async function fetchData() {
		const responseSectionsGroups = await fetch(`/api/sectionGroups`, {
			method: 'GET'
		});

		if (responseSectionsGroups.ok) {
			const fetchedSectionGroups: SectionGroup[] = await responseSectionsGroups.json();
			sectionsGroups = fetchedSectionGroups.map((group) => ({
				...group,
				sections: normalizeSectionOrder(group.sections || [])
			}));
		} else {
			alert('Error loading section groups');
		}

		const responseSections = await fetch(`/api/sections`, {
			method: 'GET'
		});

		if (responseSections.ok) {
			sections = await responseSections.json();
		} else {
			alert('Error loading sections');
		}

		const responseInstruments = await fetch(`/api/instruments`, {
			method: 'GET'
		});

		if (responseInstruments.ok) {
			instruments = await responseInstruments.json();
		} else {
			alert('Error loading instruments');
		}
	}

	function openGroupPopup(group: SectionGroup | null = null) {
		if (group) {
			const orderedSections = normalizeSectionOrder(group.sections || []);
			editingGroup = { ...group, sections: orderedSections };
			groupName = group.name;
			selectedSections = orderedSections
				.map((s) => s.id)
				.filter((id): id is number => id !== null && id !== undefined);
		} else {
			editingGroup = null;
			groupName = '';
			selectedSections = [];
		}
		popUpGroup = true;
	}

	function openSectionPopup(section: Section | null = null) {
		if (section) {
			editingSection = section;
			sectionName = section.name;
			sectionSize = section.size;
			selectedInstruments =
				section.instruments?.map((i) => i.id).filter((id): id is number => id !== null) || [];
		} else {
			editingSection = null;
			sectionName = '';
			sectionSize = 1;
			selectedInstruments = [];
		}
		popUpSection = true;
	}

	function openInstrumentPopup(instrument: Instrument | null = null) {
		if (instrument) {
			editingInstrument = instrument;
			instrumentName = instrument.name;
			instrumentFamily = instrument.family;
		} else {
			editingInstrument = null;
			instrumentName = '';
			instrumentFamily = '';
		}
		popUpInstrument = true;
	}

	function normalizeSectionOrder(groupSections: Section[]) {
		const indexedSections = groupSections.map((section, index) => ({ section, index }));
		const hasExistingOrder = indexedSections.some(({ section }) => (section.pivot_order ?? 0) > 0);

		const orderedSections = hasExistingOrder
			? indexedSections.sort((sectionA, sectionB) => {
					const orderA =
						(sectionA.section.pivot_order ?? 0) > 0
							? sectionA.section.pivot_order!
							: Number.MAX_SAFE_INTEGER;
					const orderB =
						(sectionB.section.pivot_order ?? 0) > 0
							? sectionB.section.pivot_order!
							: Number.MAX_SAFE_INTEGER;

					return orderA - orderB || sectionA.index - sectionB.index;
				})
			: indexedSections;

		return orderedSections.map(({ section }, index) => ({
			...section,
			pivot_order: index + 1
		}));
	}

	function getOrderedSelectedSections() {
		return selectedSections
			.map((sectionId) => {
				return sections.find((section) => section.id === sectionId);
			})
			.filter((section): section is Section => section !== undefined)
			.map((section, index) => ({
				...section,
				pivot_order: index + 1
			}));
	}

	async function saveGroup() {
		if (!groupName.trim()) {
			alert('Please enter a group name');
			return;
		}

		const selectedSectionObjects = getOrderedSelectedSections();

		const payload = editingGroup
			? { ...editingGroup, name: groupName, sections: selectedSectionObjects }
			: { id: null, name: groupName, sections: selectedSectionObjects };

		const response = await fetch(`/api/sectionGroups`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		if (response.ok) {
			popUpGroup = false;
			await fetchData();
		} else {
			alert('Error saving section group');
		}
	}

	async function saveSection() {
		if (!sectionName.trim()) {
			alert('Please enter a section name');
			return;
		}

		const selectedInstrumentObjects = instruments.filter(
			(i) => i.id !== null && i.id !== undefined && selectedInstruments.includes(i.id)
		);

		const payload = editingSection
			? {
					...editingSection,
					name: sectionName,
					size: sectionSize,
					instruments: selectedInstrumentObjects
				}
			: { id: null, name: sectionName, size: sectionSize, instruments: selectedInstrumentObjects };

		const response = await fetch(`/api/sections`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		if (response.ok) {
			popUpSection = false;
			await fetchData();
		} else {
			alert('Error saving section');
		}
	}

	async function saveInstrument() {
		if (!instrumentName.trim() || !instrumentFamily.trim()) {
			alert('Please enter both instrument name and family');
			return;
		}

		const payload = editingInstrument
			? { ...editingInstrument, name: instrumentName, family: instrumentFamily }
			: { id: null, name: instrumentName, family: instrumentFamily };

		const response = await fetch(`/api/instruments`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		if (response.ok) {
			popUpInstrument = false;
			await fetchData();
		} else {
			alert('Error saving instrument');
		}
	}

	async function deleteGroup(group: SectionGroup) {
		if (!confirm(`Are you sure you want to delete "${group.name}"?`)) return;

		if (group.id) {
			const response = await fetch(`/api/sectionGroups/${group.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await fetchData();
			} else {
				alert('Error deleting section group');
			}
		}
	}

	async function deleteSection(section: Section) {
		if (!confirm(`Are you sure you want to delete "${section.name}"?`)) return;

		if (section.id) {
			const response = await fetch(`/api/sections/${section.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await fetchData();
			} else {
				alert('Error deleting section');
			}
		}
	}

	async function deleteInstrument(instrument: Instrument) {
		if (!confirm(`Are you sure you want to delete "${instrument.name}"?`)) return;

		if (instrument.id) {
			const response = await fetch(`/api/instruments/${instrument.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await fetchData();
			} else {
				alert('Error deleting instrument');
			}
		}
	}

	async function duplicateGroup(group: SectionGroup) {
		const payload = {
			id: null,
			name: group.name + ' (Copy)',
			sections: normalizeSectionOrder(group.sections || [])
		};

		const response = await fetch(`/api/sectionGroups`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		if (response.ok) {
			await fetchData();
		} else {
			alert('Error duplicating section group');
		}
	}

	async function duplicateSection(section: Section) {
		const payload = {
			id: null,
			name: section.name + ' (Copy)',
			size: section.size,
			instruments: section.instruments
		};

		const response = await fetch(`/api/sections`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		if (response.ok) {
			await fetchData();
		} else {
			alert('Error duplicating section');
		}
	}

	async function duplicateInstrument(instrument: Instrument) {
		const payload = {
			id: null,
			name: instrument.name + ' (Copy)',
			family: instrument.family
		};

		const response = await fetch(`/api/instruments`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		if (response.ok) {
			await fetchData();
		} else {
			alert('Error duplicating instrument');
		}
	}

	function toggleInstrument(instrumentId: number | null | undefined) {
		if (instrumentId === null || instrumentId === undefined) return;

		if (selectedInstruments.includes(instrumentId)) {
			selectedInstruments = selectedInstruments.filter((id) => id !== instrumentId);
		} else {
			selectedInstruments = [...selectedInstruments, instrumentId];
		}
	}

	function toggleSection(sectionId: number | null | undefined) {
		if (sectionId === null || sectionId === undefined) return;

		if (selectedSections.includes(sectionId)) {
			selectedSections = selectedSections.filter((id) => id !== sectionId);
		} else {
			selectedSections = [...selectedSections, sectionId];
		}
	}

	function closeAllPopups() {
		popUpGroup = false;
		popUpSection = false;
		popUpInstrument = false;
	}
</script>

<!-- Group Popup -->
{#if popUpGroup}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
		<div
			class="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center {isMobile
				? 'w-[90%] max-h-[90vh]'
				: 'w-[50%] max-h-[80vh]'} relative overflow-y-auto"
		>
			<button on:click={closeAllPopups} class="absolute top-2 right-3">
				<Fa icon={faXmark} class="text-[20px]" style="color: #6b7280;" />
			</button>
			<h2 class="text-xl text-gray-500 font-bold mb-8 uppercase">
				{editingGroup ? 'Edit' : 'New'} Group
			</h2>
			<div class="w-full flex flex-col gap-4">
				<div class="flex flex-col w-full">
					<div
						class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500"
						style="width: fit-content;"
					>
						Group Name
					</div>
					<input
						class="p-3 border-2 border-gray-500 rounded-xl focus:outline-none"
						bind:value={groupName}
						placeholder="Enter group name"
						required
					/>
				</div>
				<div class="flex flex-col w-full">
					<h3 class="font-semibold text-gray-600 mb-2">Sections</h3>
					<div class="border-2 border-gray-400 rounded-xl p-4 max-h-64 overflow-y-auto">
						{#if sections.length > 0}
							<div class="grid grid-cols-2 gap-2">
								{#each sections as section}
									{#if section.id !== null && section.id !== undefined}
										<label
											class="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
										>
											<input
												type="checkbox"
												checked={selectedSections.includes(section.id)}
												on:change={() => toggleSection(section.id)}
												class="w-4 h-4 text-blue-600 rounded"
											/>
											<span class="text-sm text-gray-700">{section.name}</span>
										</label>
									{/if}
								{/each}
							</div>
						{:else}
							<p class="text-gray-500 text-center">No sections available</p>
						{/if}
					</div>
				</div>
			</div>
			<div class="w-full gap-8 flex justify-center mt-8">
				<button
					class="w-[30%] px-4 py-2 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500"
					on:click={closeAllPopups}>Cancel</button
				>
				<button
					class="w-[30%] px-4 py-2 bg-[#6b9ad9] text-white rounded-lg font-semibold hover:bg-[#4f7cb7]"
					on:click={saveGroup}>Save</button
				>
			</div>
		</div>
	</div>
{/if}

<!-- Section Popup -->
{#if popUpSection}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
		<div
			class="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center {isMobile
				? 'w-[90%] max-h-[90vh]'
				: 'w-[50%] max-h-[80vh]'} relative overflow-y-auto"
		>
			<button on:click={closeAllPopups} class="absolute top-2 right-3">
				<Fa icon={faXmark} class="text-[20px]" style="color: #6b7280;" />
			</button>
			<h2 class="text-xl text-gray-500 font-bold mb-8 uppercase">
				{editingSection ? 'Edit' : 'New'} Section
			</h2>
			<div class="w-full flex flex-col gap-4">
				<div class="flex flex-col w-full">
					<div
						class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500"
						style="width: fit-content;"
					>
						Section Name
					</div>
					<input
						class="p-3 border-2 border-gray-500 rounded-xl focus:outline-none"
						bind:value={sectionName}
						placeholder="Enter section name"
						required
					/>
				</div>
				<div class="flex flex-col w-full">
					<div
						class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500"
						style="width: fit-content;"
					>
						Size
					</div>
					<input
						type="number"
						class="p-3 border-2 border-gray-500 rounded-xl focus:outline-none"
						bind:value={sectionSize}
						min="1"
						required
					/>
				</div>
				<div class="flex flex-col w-full">
					<h3 class="font-semibold text-gray-600 mb-2">Instruments</h3>
					<div class="border-2 border-gray-400 rounded-xl p-4 max-h-64 overflow-y-auto">
						{#if instruments.length > 0}
							<div class="grid grid-cols-2 gap-2">
								{#each instruments as instrument}
									{#if instrument.id !== null && instrument.id !== undefined}
										<label
											class="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
										>
											<input
												type="checkbox"
												checked={selectedInstruments.includes(instrument.id)}
												on:change={() => toggleInstrument(instrument.id)}
												class="w-4 h-4 text-blue-600 rounded"
											/>
											<span class="text-sm text-gray-700">{instrument.name}</span>
										</label>
									{/if}
								{/each}
							</div>
						{:else}
							<p class="text-gray-500 text-center">No instruments available</p>
						{/if}
					</div>
				</div>
			</div>
			<div class="w-full gap-8 flex justify-center mt-8">
				<button
					class="w-[30%] px-4 py-2 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500"
					on:click={closeAllPopups}>Cancel</button
				>
				<button
					class="w-[30%] px-4 py-2 bg-[#6b9ad9] text-white rounded-lg font-semibold hover:bg-[#4f7cb7]"
					on:click={saveSection}>Save</button
				>
			</div>
		</div>
	</div>
{/if}

<!-- Instrument Popup -->
{#if popUpInstrument}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
		<div
			class="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center {isMobile
				? 'w-[90%]'
				: 'w-[40%]'} relative"
		>
			<button on:click={closeAllPopups} class="absolute top-2 right-3">
				<Fa icon={faXmark} class="text-[20px]" style="color: #6b7280;" />
			</button>
			<h2 class="text-xl text-gray-500 font-bold mb-8 uppercase">
				{editingInstrument ? 'Edit' : 'New'} Instrument
			</h2>
			<div class="w-full flex flex-col gap-4">
				<div class="flex flex-col w-full">
					<div
						class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500"
						style="width: fit-content;"
					>
						Instrument Name
					</div>
					<input
						class="p-3 border-2 border-gray-500 rounded-xl focus:outline-none"
						bind:value={instrumentName}
						placeholder="Enter instrument name"
						required
					/>
				</div>
				<div class="flex flex-col w-full">
					<div
						class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500"
						style="width: fit-content;"
					>
						Family
					</div>
					<input
						class="p-3 border-2 border-gray-500 rounded-xl focus:outline-none"
						bind:value={instrumentFamily}
						placeholder="Enter instrument family"
						required
					/>
				</div>
			</div>
			<div class="w-full gap-8 flex justify-center mt-8">
				<button
					class="w-[30%] px-4 py-2 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500"
					on:click={closeAllPopups}>Cancel</button
				>
				<button
					class="w-[30%] px-4 py-2 bg-[#6b9ad9] text-white rounded-lg font-semibold hover:bg-[#4f7cb7]"
					on:click={saveInstrument}>Save</button
				>
			</div>
		</div>
	</div>
{/if}

<!-- Main Content -->
<div class="w-full min-h-screen p-4 bg-[#E7E7E7]">
	<div class="mb-4">
		<a
			href="/projects"
			class="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2"
		>
			&larr; Back to Projects
		</a>
	</div>

	<!-- Section Groups -->
	<div class="bg-white border-2 rounded-xl border-gray-400 p-4 mb-4">
		<div class="flex mb-6 items-center">
			<h1 class="font-bold text-lg">GROUPS</h1>
			<button
				on:click={() => openGroupPopup()}
				class="bg-[#6B9AD9] ml-auto px-4 py-2 rounded-lg text-sm hover:bg-[#4f7cb7] text-white font-semibold"
			>
				Add New
			</button>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-sm text-left text-gray-500">
				<thead class="text-xs text-gray-700 uppercase border-b-2 border-gray-300 text-center">
					<tr class="font-semibold text-md">
						<th class="p-3">Name</th>
						<th class="p-3">Sections</th>
						<th class="p-3">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#if sectionsGroups && sectionsGroups.length > 0}
						{#each sectionsGroups as group}
							<tr class="border-b hover:bg-gray-50">
								<td class="p-3 font-semibold text-gray-700">{group.name}</td>
								<td class="p-3 text-center">
									<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold">
										{group.sections?.length || 0}
									</span>
								</td>
								<td class="p-3">
									<div class="flex justify-center gap-2">
										<button
											on:click={() => openGroupPopup(group)}
											class="text-blue-600 hover:text-blue-800"
											title="Edit"
										>
											<Fa icon={faEdit} class="text-[16px]" />
										</button>
										<button
											on:click={() => duplicateGroup(group)}
											class="text-green-600 hover:text-green-800"
											title="Duplicate"
										>
											<Fa icon={faCopy} class="text-[16px]" />
										</button>
										<button
											on:click={() => deleteGroup(group)}
											class="text-red-600 hover:text-red-800"
											title="Delete"
										>
											<Fa icon={faTrash} class="text-[16px]" />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					{:else}
						<tr>
							<td colspan="3" class="text-center p-8 text-gray-500">No section groups found</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Sections -->
	<div class="bg-white border-2 rounded-xl border-gray-400 p-4 mb-4">
		<div class="flex mb-6 items-center">
			<h1 class="font-bold text-lg">SECTIONS</h1>
			<button
				on:click={() => openSectionPopup()}
				class="bg-[#6B9AD9] ml-auto px-4 py-2 rounded-lg text-sm hover:bg-[#4f7cb7] text-white font-semibold"
			>
				Add New
			</button>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-sm text-left text-gray-500">
				<thead class="text-xs text-gray-700 uppercase border-b-2 border-gray-300 text-center">
					<tr class="font-semibold text-md">
						<th class="p-3">Name</th>
						<th class="p-3">Size</th>
						<th class="p-3">Instruments</th>
						<th class="p-3">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#if sections && sections.length > 0}
						{#each sections as section}
							<tr class="border-b hover:bg-gray-50">
								<td class="p-3 font-semibold text-gray-700">{section.name}</td>
								<td class="p-3 text-center">
									<span
										class="bg-purple-100 text-purple-800 px-2 py-1 rounded font-semibold flex items-center justify-center gap-1"
									>
										<Fa icon={faUsers} class="text-[12px]" />
										{section.size}
									</span>
								</td>
								<td class="p-3 text-center">
									<span class="text-gray-600">
										{section.instruments?.map((i) => i.name).join(', ') || 'None'}
									</span>
								</td>
								<td class="p-3">
									<div class="flex justify-center gap-2">
										<button
											on:click={() => openSectionPopup(section)}
											class="text-blue-600 hover:text-blue-800"
											title="Edit"
										>
											<Fa icon={faEdit} class="text-[16px]" />
										</button>
										<button
											on:click={() => duplicateSection(section)}
											class="text-green-600 hover:text-green-800"
											title="Duplicate"
										>
											<Fa icon={faCopy} class="text-[16px]" />
										</button>
										<button
											on:click={() => deleteSection(section)}
											class="text-red-600 hover:text-red-800"
											title="Delete"
										>
											<Fa icon={faTrash} class="text-[16px]" />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					{:else}
						<tr>
							<td colspan="4" class="text-center p-8 text-gray-500">No sections found</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Instruments -->
	<div class="bg-white border-2 rounded-xl border-gray-400 p-4">
		<div class="flex mb-6 items-center">
			<h1 class="font-bold text-lg">INSTRUMENTS</h1>
			<button
				on:click={() => openInstrumentPopup()}
				class="bg-[#6B9AD9] ml-auto px-4 py-2 rounded-lg text-sm hover:bg-[#4f7cb7] text-white font-semibold"
			>
				Add New
			</button>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-sm text-left text-gray-500">
				<thead class="text-xs text-gray-700 uppercase border-b-2 border-gray-300 text-center">
					<tr class="font-semibold text-md">
						<th class="p-3">Name</th>
						<th class="p-3">Family</th>
						<th class="p-3">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#if instruments && instruments.length > 0}
						{#each instruments as instrument}
							<tr class="border-b hover:bg-gray-50">
								<td class="p-3 font-semibold text-gray-700 flex items-center gap-2">
									<Fa icon={faMusic} class="text-[14px] text-blue-500" />
									{instrument.name}
								</td>
								<td class="p-3 text-center">
									<span class="bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">
										{instrument.family}
									</span>
								</td>
								<td class="p-3">
									<div class="flex justify-center gap-2">
										<button
											on:click={() => openInstrumentPopup(instrument)}
											class="text-blue-600 hover:text-blue-800"
											title="Edit"
										>
											<Fa icon={faEdit} class="text-[16px]" />
										</button>
										<button
											on:click={() => duplicateInstrument(instrument)}
											class="text-green-600 hover:text-green-800"
											title="Duplicate"
										>
											<Fa icon={faCopy} class="text-[16px]" />
										</button>
										<button
											on:click={() => deleteInstrument(instrument)}
											class="text-red-600 hover:text-red-800"
											title="Delete"
										>
											<Fa icon={faTrash} class="text-[16px]" />
										</button>
									</div>
								</td>
							</tr>
						{/each}
					{:else}
						<tr>
							<td colspan="3" class="text-center p-8 text-gray-500">No instruments found</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>
