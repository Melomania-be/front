<script lang="ts">
	import { updated } from '$app/stores';
	import type { Instrument } from '$lib/types/Instrument';
	import type { Section } from '$lib/types/Section';
	import type { SectionGroup } from '$lib/types/SectionGroup';
	import { Checkbox } from 'flowbite-svelte';
	import { onMount } from 'svelte';

	let sectionsGroups: SectionGroup[];
	let sections: Section[];
	let instruments: Instrument[];

	let sectionsGroupTmp: SectionGroup;
	let sectionTmp: Section;
	let instrumentTmp: Instrument;

	onMount(async () => {
		const responseSectionsGroups = await fetch(`/api/sectionGroups`, {
			method: 'GET'
		});

		if (responseSectionsGroups.ok) {
			sectionsGroups = await responseSectionsGroups.json();
			sectionsGroupTmp = sectionsGroups[0] ?? null;
		} else {
			alert('server error');
		}

		const responseSections = await fetch(`/api/sections`, {
			method: 'GET'
		});

		if (responseSections.ok) {
			sections = await responseSections.json();
			sectionTmp = sections[0] ?? null;
		} else {
			alert('server error');
		}

		const responseInstruments = await fetch(`/api/instruments`, {
			method: 'GET'
		});

		if (responseInstruments.ok) {
			instruments = await responseInstruments.json();
			instrumentTmp = instruments[0] ?? null;
		} else {
			alert('server error');
		}
	});

	async function saveInstruments() {
		for (const instrument of instruments) {
			await fetch(`/api/instruments`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(instrument)
			});
		}

		window.location.reload();
	}

	async function deleteInstrument(instrument: Instrument) {
		if (instrument.id) {
			await fetch(`/api/instruments/${instrument.id}`, {
				method: 'DELETE'
			});
			instruments = instruments.filter((i) => i !== instrument);
		}

		instrumentTmp = instruments[0] ?? null;
		instruments.filter((i) => i !== instrument);

		window.location.reload();
	}

	async function saveSections() {
		for (const section of sections) {
			await fetch(`/api/sections`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(section)
			});
		}

		window.location.reload();
	}

	async function saveSectionsGroups() {
		for (const sectionGroup of sectionsGroups) {
			await fetch(`/api/sectionGroups`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(sectionGroup)
			});
		}

		window.location.reload();
	}

	async function deleteSection(section: Section) {
		if (section.id) {
			await fetch(`/api/sections/${section.id}`, {
				method: 'DELETE'
			});
			sections = sections.filter((s) => s !== section);
		}

		sectionTmp = sections[0] ?? null;
		sections.filter((s) => s !== section);

		window.location.reload();
	}

	async function deleteSectionGroup(sectionGroup: SectionGroup) {
		if (sectionGroup.id) {
			await fetch(`/api/sectionGroups/${sectionGroup.id}`, {
				method: 'DELETE'
			});
			sectionsGroups = sectionsGroups.filter((s) => s !== sectionGroup);
		}

		sectionsGroupTmp = sectionsGroups[0] ?? null;
		sectionsGroups.filter((s) => s !== sectionGroup);

		window.location.reload();
	}
</script>

<div class="m-1 grid md:grid-cols-2">
	{#if sectionsGroups}
		<div class="bg-gray-200 m-2 p-2 border border-gray-500 rounded-lg grid lg:grid-cols-2">
			<div class="m-1">
				<button
					class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
					on:click={() => {
						sectionsGroups.push({
							id: null,
							updatedAt: new Date(),
							name: 'New group',
							sections: []
						});
						sectionsGroupTmp = sectionsGroups[sectionsGroups.length - 1];
					}}>Add group</button
				>
				<div class="m-0.5 border border-gray-400 rounded">
					{#each sectionsGroups as group}
						<button
							class="m-0.5 flex justify-center items-center rounded {sectionsGroupTmp === group
								? 'bg-slate-300'
								: ''}"
							on:click={() => (sectionsGroupTmp = group)}
							>{group.name} <span class="icon-[formkit--arrowright] hover:text-black"></span>
						</button>
						<button on:click={() => deleteSectionGroup(group)}>
							<span class="icon-[formkit--trash]"></span>
						</button>
					{/each}
				</div>
			</div>
			<div>
				<div>
					{#if sectionsGroupTmp}
						<div class="flex">
							<h3>Name :</h3>
							<input class="ml-1" type="text" bind:value={sectionsGroupTmp.name} />
						</div>
						<div>
							<h3>Sections :</h3>
							<table>
								<thead>
									<tr>
										<th>Name</th>
										<th>Size</th>
										<th>Instruments</th>
										<th></th>
									</tr>
								</thead>
								<tbody>
									{#each sectionsGroupTmp.sections as section}
										<tr>
											<td>{section.name}</td>
											<td>{section.size}</td>
											<td>{section.instruments.map((i) => i.name).join(', ')}</td>
											<td>
												<button
													class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
													on:click={() => {
														sectionsGroupTmp.sections = sectionsGroupTmp.sections.filter(
															(s) => s !== section
														);
														sectionsGroupTmp = sectionsGroupTmp;
													}}>Remove</button
												>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
						<div class="p-1 border-gray-300 border rounded">
							{#if sections && sections.length > 0}
								<select bind:value={sectionTmp}>
									{#each sections as section}
										<option value={section}>{section.name}</option>
									{/each}
								</select>
								{#if sectionTmp}
									<button
										class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
										on:click={() => {
											if (sectionsGroupTmp && sectionTmp) {
												sectionsGroupTmp.sections.push(sectionTmp);
												sectionsGroupTmp = sectionsGroupTmp;
											}
										}}>Add section</button
									>
								{/if}
							{/if}
						</div>
					{/if}
				</div>
			</div>
			<div class="lg:col-span-2">
				<button
					class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
					on:click={() => saveSectionsGroups()}>Save</button
				>
			</div>
		</div>
	{/if}
	{#if sections}
		<div class="bg-gray-200 m-2 p-2 border border-gray-500 rounded-lg grid lg:grid-cols-2">
			<div class="m-1">
				<button
					class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
					on:click={() => {
						sections.push({
							id: null,
							name: 'New section',
							size: 1,
							instruments: []
						});
						sectionTmp = sections[sections.length - 1];
					}}>Add section</button
				>

				<div class="m-0.5 border border-gray-400 rounded">
					{#each sections as section}
						<button
							class="m-0.5 flex justify-center items-center rounded {sectionTmp === section
								? 'bg-slate-300'
								: ''}"
							on:click={() => (sectionTmp = section)}
							>{section.name} <span class="icon-[formkit--arrowright] hover:text-black"></span>
						</button>
						<button on:click={() => deleteSection(section)}>
							<span class="icon-[formkit--trash]"></span>
						</button>
					{/each}
				</div>
			</div>
			<div>
				{#if sectionTmp && instruments}
					<div class="flex">
						<h3>Name :</h3>
						<input class="ml-1" bind:value={sectionTmp.name} />
					</div>
					<div class="flex mt-1">
						<h3>Size :</h3>
						<input type="number" bind:value={sectionTmp.size} />
					</div>
					{#if instruments && instruments.length > 0}
						<ul
							class="m-1 p-1 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-600 divide-y divide-gray-200 dark:divide-gray-600"
						>
							{#each instruments as instrument}
								<span>
									<Checkbox
										checked={sectionTmp.instruments.includes(instrument)}
										on:change={() => {
											if (sectionTmp) {
												if (sectionTmp.instruments.includes(instrument)) {
													sectionTmp.instruments = sectionTmp.instruments.filter(
														(i) => i !== instrument
													);
												} else {
													sectionTmp.instruments.push(instrument);
												}
											}
											sectionTmp = sectionTmp;
											sectionsGroupTmp = sectionsGroupTmp;
										}}>{instrument.name}</Checkbox
									>
								</span>
							{/each}
						</ul>
					{/if}
				{/if}
			</div>

			<div class="lg:col-span-2">
				<button
					class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
					on:click={() => saveSections()}>Save</button
				>
			</div>
		</div>
	{/if}
	{#if instrumentTmp}
		<div class="bg-gray-200 m-2 p-2 border border-gray-500 rounded-lg grid lg:grid-cols-2">
			<div class="m-1">
				<button
					class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
					on:click={() => {
						instruments.push({
							id: null,
							name: 'New instrument',
							family: 'Family',
							updatedAt: new Date(),
							createdAt: new Date()
						});
						instrumentTmp = instruments[instruments.length - 1];
					}}>Add instrument</button
				>
				<div class="m-0.5 border border-gray-400 rounded">
					{#each instruments as instrument}
						<div class="flex p-1">
							<button
								class="m-0.5 flex justify-center items-center rounded {instrumentTmp === instrument
									? 'bg-slate-300'
									: ''}"
								on:click={() => (instrumentTmp = instrument)}
								>{instrument.name} <span class="icon-[formkit--arrowright] hover:text-black"></span>
							</button>
							<button on:click={() => deleteInstrument(instrument)}>
								<span class="icon-[formkit--trash]"></span>
							</button>
						</div>
					{/each}
				</div>
			</div>
			<div>
				{#if instrumentTmp}
					<div class="flex">
						<h3>Name :</h3>
						<input class="ml-1" bind:value={instrumentTmp.name} />
					</div>
					<div class="flex mt-1">
						<h3>Family :</h3>
						<input class="ml-1" bind:value={instrumentTmp.family} />
					</div>
				{/if}
			</div>
			<div class="lg:col-span-2">
				<button
					class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
					on:click={() => saveInstruments()}>Save</button
				>
			</div>
		</div>
	{/if}
</div>
