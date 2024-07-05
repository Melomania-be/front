<script lang="ts">
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import type { Project } from '$lib/types/Project';
	import type { Instrument } from '$lib/types/Instrument';
	import type { SectionGroup } from '$lib/types/SectionGroup';
	import type { Piece } from '$lib/types/Piece';

	import DateShow from '../DateShow.svelte';

	export let project: Project;
	export let pieces: Array<Piece>;
	export let sectionGroups: Array<SectionGroup>;
	export let mode: 'modify' | 'create';

	let allowModification = mode === 'modify' ? false : true;

	let selectedSectionGroup: SectionGroup;
	let newSectionGroup: SectionGroup = {
		id: null,
		name: '',
		updatedAt: new Date(),
		sections: []
	};

	console.log(sectionGroups);
	console.log('project', project);
	console.log('pieces', pieces); //undefined

	let allPieces: Array<Piece> = [];

	function addRehearsalDate() {
		project.rehearsals = [...project.rehearsals, { id: null, date: '', comment: '', place: '' }];
	}

	function removeRehearsalDate(index: number) {
		project.rehearsals = project.rehearsals.filter((_, i) => i !== index);
	}

    function removeConcertDate(index: number) {
        project.concerts = project.concerts.filter((_, i) => i !== index);
    }

    function addConcertDate() {
        project.concerts = [...project.concerts, { id: null, date: '', place: '', comment: '', project_id: null}];
    }

	//Créer :
	// nom
	// sectionGroup (créer ou sélectionner si existant)
	// registration (toutes les informations, création de champs particuliers à remplir à faire en DERNIER)
	// répétitions
	// pièces (TOUT)
	// concerts 
</script>

<main>
	<div
		class="m-1 relative max-w-xxl bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
	>
		{#if mode === 'modify'}
			<div class="absolute top-0 right-0 p-1">
				<button
					on:click={() => (allowModification = !allowModification)}
					class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
				>
					{#if !allowModification}
						<span class="icon-[tabler--edit]" style="width: 1.2rem; height: 1.2rem; color: black;"
						></span>
					{:else}
						Stop editing
					{/if}
				</button>
			</div>
		{/if}

		<div class="p-5">
			<div class="w-full mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
				<input
					class="ml-0.5"
					bind:value={project.name}
					placeholder="Project name"
					disabled={!allowModification}
				/>
			</div>

			<h3 class="w-full text-center m-1">Project informations</h3>

			<h4>Section Group</h4>
			<div class="m-1">
				{#if !allowModification}
					aezr
				{:else}
					<select class="flex w-1/2" bind:value={sectionGroups}>
						<optgroup label="All section groups">
							<option value={null}>None</option>
							{#if sectionGroups}
								{#each sectionGroups as sectionGroup}
									<option value={sectionGroup}>{sectionGroup.name}</option>
								{/each}
							{/if}
						</optgroup>
					</select>
				{/if}
			</div>

			<!--

            <h4> Pieces</h4>
			<div class="m-1">
                {#if !allowModification}
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Composer</th>
                            <th>Arranger</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each project.pieces as piece}
                            <tr>
                                <td>{piece.name}</td>
                                <td>{piece.composer}</td>
                                <td>{piece.arranger}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
                {:else}
                    <select class="flex w-1/2" bind:value={pieces} multiple>
                        <optgroup label="All pieces">
                            <option value={null}>None</option>
                            {#if pieces}
                                {#each pieces as piece}
                                    <option value={piece}>{piece.name}</option>
                                {/each}
                            {/if}
                        </optgroup>
                    </select>
                    <p>Selected Pieces: {allPieces.map(piece => piece.name).join(', ')}</p>
                {/if}
            </div>
        -->
			<h4>Rehearsals</h4>
			<div class="m-1">
				{#if !allowModification}
					<table>
						<thead>
							<tr>
								<th>Date</th>
								<th>Place</th>
                                <th>Comment</th>
							</tr>
						</thead>
						<tbody>
							{#each project.rehearsals as rehearsal}
								<tr>
									<td><DateShow date={rehearsal.date} /></td>
									<td>{rehearsal.place}</td>
                                    <td>{rehearsal.comment}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{:else}
					<div>
						{#each project.rehearsals as rehearsal, index}
							<div class="rehearsal-entry">
								<input
									class="p-1"
									bind:value={rehearsal.date}
									placeholder="enter a rehearsal date"
									type="date"
								/>
								<input
									class="p-1"
									bind:value={rehearsal.place}
									placeholder="enter a rehearsal place"
									type="text"
								/>
                                <input
                                    class="p-1"
                                    bind:value={rehearsal.comment}
                                    placeholder="enter a comment if needed"
                                    type="text"
                                />
								<button
									class="bg-red-700 text-sm px-2 py-1 rounded-lg text-white hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 text-center"
									on:click={() => removeRehearsalDate(index)}>Remove</button
								>
							</div>
						{/each}
						<button
							class="bg-blue-700 text-sm px-2 py-1 rounded-lg text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 text-center"
							on:click={addRehearsalDate}>Add Rehearsal Date</button
						>
					</div>
				{/if}
			</div>

            <h4>Concerts</h4>
            <div class="m-1">
                {#if !allowModification}
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Place</th>
                                <th>Comment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each project.concerts as concert}
                                <tr>
                                    <td><DateShow date={concert.date} /></td>
                                    <td>{concert.place}</td>
                                    <td>{concert.comment}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                {:else}
                    <div>
                        {#each project.concerts as concert, index}
                            <div class="concert-entry">
                                <input
                                    class="p-1"
                                    bind:value={concert.date}
                                    placeholder="enter a concert date"
                                    type="date"
                                />
                                <input
                                    class="p-1"
                                    bind:value={concert.place}
                                    placeholder="enter a concert place"
                                    type="text"
                                />
                                <input
                                    class="p-1"
                                    bind:value={concert.comment}
                                    placeholder="enter a comment if needed"
                                    type="text"
                                />
                                <button
                                    class="bg-red-700 text-sm px-2 py-1 rounded-lg text-white hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 text-center"
                                    on:click={() => removeConcertDate(index)}>Remove</button
                                >
                            </div>
                        {/each}
                        <button
                            class="bg-blue-700 text-sm px-2 py-1 rounded-lg text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 text-center"
                            on:click={addConcertDate}>Add Concert Date</button
                        >
                    </div>
                {/if}
            </div>
		</div>
	</div>
</main>
