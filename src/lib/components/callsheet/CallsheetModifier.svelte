<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Callsheet } from '$lib/types/Callsheet';
	import { onMount } from 'svelte';
	import CallsheetShow from './CallsheetShow.svelte';
	import RichTextEditor from './RichTextEditor.svelte'

	export let callsheet: Callsheet | null = null;
	export let mode: 'modify' | 'create';

	let allowModification = mode === 'modify' ? false : true;
	let isLoading = false;
	let errorMessage = '';
	let successMessage = '';
	let loadingError = '';
	let callsheetLoaded = false;

	// Initialisation sécurisée des contenus
	$: if (callsheet && !callsheet.contents) {
		callsheet.contents = [];
	}

	// Compteur pour générer des IDs uniques pour les nouveaux contenus
	$: contentIdCounter = Math.max(...(callsheet?.contents?.map(c => c.id || 0) || [0])) + 1;

	// Validation des champs requis
	function validateCallsheet() {
		const errors = [];

		if (!callsheet) {
			errors.push('Callsheet non chargée');
			return errors;
		}

		if (!callsheet.version || callsheet.version.trim() === '') {
			errors.push('La version est requise');
		}

		if (!callsheet.contents || callsheet.contents.length === 0) {
			errors.push('Au moins un contenu est requis');
		} else {
			// Vérifier que tous les contenus ont un titre
			const emptyTitles = callsheet.contents.filter(content => !content.title || content.title.trim() === '');
			if (emptyTitles.length > 0) {
				errors.push('Tous les contenus doivent avoir un titre');
			}
		}

		return errors;
	}

	async function saveCallsheet() {
		if (!callsheet) {
			errorMessage = 'Callsheet non disponible';
			return;
		}

		// Réinitialiser les messages
		errorMessage = '';
		successMessage = '';

		// Validation côté client
		const validationErrors = validateCallsheet();
		if (validationErrors.length > 0) {
			errorMessage = validationErrors.join(', ');
			return;
		}

		isLoading = true;

		try {
			const tmpCallsheet = {
				id: callsheet.id,
				project_id: callsheet.projectId,
				version: callsheet.version.trim(),
				contents: (callsheet.contents || []).map((content) => {
					return {
						id: content.id,
						title: content.title.trim(),
						text: content.text
					};
				})
			};

			console.log('Saving callsheet:', tmpCallsheet);

			const response = await fetch(`/api/projects/${callsheet.projectId}/management/callsheets`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(tmpCallsheet)
			});

			if (response.ok) {
				successMessage = 'Callsheet enregistrée avec succès !';
				setTimeout(() => {
					goto(`/projects/${callsheet.projectId}/management/callsheets`);
				}, 1500);
			} else {
				// Gestion des erreurs du serveur
				const errorData = await response.json().catch(() => null);
				if (errorData && errorData.message) {
					errorMessage = `Erreur serveur : ${errorData.message}`;
				} else {
					errorMessage = `Erreur ${response.status} : Impossible d'enregistrer la callsheet`;
				}
			}
		} catch (error) {
			console.error('Erreur lors de la sauvegarde:', error);
			errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet.';
		} finally {
			isLoading = false;
		}
	}

	// Fonction pour charger la callsheet avec gestion d'erreur
	async function loadCallsheet(projectId: string, callsheetId: string) {
		try {
			loadingError = '';
			const response = await fetch(`/api/projects/${projectId}/management/callsheets/${callsheetId}`);

			if (!response.ok) {
				if (response.status === 404) {
					loadingError = 'Callsheet non trouvée';
				} else if (response.status === 500) {
					loadingError = 'Erreur serveur. Vérifiez les logs du serveur.';
				} else {
					loadingError = `Erreur ${response.status}: ${response.statusText}`;
				}
				return null;
			}

			const data = await response.json();
			callsheetLoaded = true;
			return data;
		} catch (error) {
			console.error('Erreur lors du chargement de la callsheet:', error);
			loadingError = 'Erreur de connexion au serveur';
			return null;
		}
	}

	onMount(async () => {
		try {
			const res = await fetch(`/api/folders`);
		} catch (error) {
			console.warn('Erreur lors du chargement des dossiers:', error);
		}
	});

	async function deleteCallsheet() {
		if (!callsheet) {
			errorMessage = 'Callsheet non disponible';
			return;
		}

		let confirmDelete = confirm('Êtes-vous sûr de vouloir supprimer cette callsheet ?');
		if (!confirmDelete) {
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			const response = await fetch(
				`/api/projects/${callsheet.projectId}/management/callsheets/${callsheet.id}`,
				{
					method: 'DELETE'
				}
			);

			if (response.ok) {
				successMessage = 'Callsheet supprimée avec succès !';
				setTimeout(() => {
					goto(`/projects/${callsheet.projectId}/management/callsheets`);
				}, 1000);
			} else {
				errorMessage = `Erreur ${response.status} : Impossible de supprimer la callsheet`;
			}
		} catch (error) {
			console.error('Erreur lors de la suppression:', error);
			errorMessage = 'Erreur de connexion lors de la suppression.';
		} finally {
			isLoading = false;
		}
	}

	// Fonction pour vérifier si un champ est valide
	function isFieldValid(field: string) {
		return field && field.trim() !== '';
	}

	// Fonction pour supprimer un contenu spécifique
	function removeContent(contentToRemove: any) {
		if (!callsheet || !callsheet.contents) return;

		callsheet.contents = callsheet.contents.filter(content => content !== contentToRemove);
		callsheet = callsheet; // Force la réactivité
	}

	// Fonction pour ajouter un nouveau contenu
	function addNewContent() {
		if (!callsheet) return;

		if (!callsheet.contents) {
			callsheet.contents = [];
		}

		const newContent = {
			title: '',
			text: '',
			callsheet_id: 0,
			id: contentIdCounter++, // ID temporaire unique
			createdAt: new Date(),
			updatedAt: new Date()
		};
		callsheet.contents.push(newContent);
		callsheet = callsheet; // Force la réactivité
	}
</script>

<!-- Gestion des erreurs de chargement -->
{#if loadingError}
	<div class="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded dark:bg-red-900 dark:border-red-600 dark:text-red-300">
		<div class="flex items-center gap-2">
			<span class="icon-[tabler--alert-circle]" style="width: 1.5rem; height: 1.5rem;"></span>
			<div>
				<h3 class="font-semibold">Erreur de chargement</h3>
				<p>{loadingError}</p>
				<button
					on:click={() => window.location.reload()}
					class="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
				>
					Recharger la page
				</button>
			</div>
		</div>
	</div>
{/if}

<div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
	{#if callsheet}
		<div
			class="m-1 relative max-w-xxl bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
		>
			{#if mode === 'modify'}
				<div class="absolute top-0 right-0 p-1">
					<button
						on:click={() => (allowModification = !allowModification)}
						class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
						disabled={isLoading}
						aria-label="Activer/désactiver la modification"
					>
						{#if !allowModification}
							<span class="icon-[tabler--edit]" style="width: 1.2rem; height: 1.2rem; color: black;"></span>
						{:else}
							Stop editing
						{/if}
					</button>
				</div>
			{/if}

			<div class="m-1">
				<h1 class="text-2xl font-bold">Callsheet</h1>

				<!-- Messages d'erreur et de succès -->
				{#if errorMessage}
					<div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded dark:bg-red-900 dark:border-red-600 dark:text-red-300">
						<div class="flex items-center gap-2">
							<span class="icon-[tabler--alert-circle]" style="width: 1.2rem; height: 1.2rem;"></span>
							{errorMessage}
						</div>
					</div>
				{/if}

				{#if successMessage}
					<div class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded dark:bg-green-900 dark:border-green-600 dark:text-green-300">
						<div class="flex items-center gap-2">
							<span class="icon-[tabler--check]" style="width: 1.2rem; height: 1.2rem;"></span>
							{successMessage}
						</div>
					</div>
				{/if}

				<div class="mb-4">
					<label for="version-input" class="block text-lg font-medium mb-2">
						Version <span class="text-red-500">*</span>
					</label>
					<input
						id="version-input"
						class={`border rounded px-3 py-2 w-full ${
							allowModification && !isFieldValid(callsheet.version)
								? 'border-red-400 bg-red-50 dark:bg-red-900 dark:border-red-600'
								: 'border-gray-300 dark:border-gray-600'
						} ${!allowModification ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}`}
						type="text"
						placeholder="Entrez la version (ex: 1.0, v2.1, etc.)"
						bind:value={callsheet.version}
						disabled={!allowModification || isLoading}
					/>
					{#if allowModification && !isFieldValid(callsheet.version)}
						<p class="text-red-500 text-sm mt-1">La version est requise</p>
					{/if}
				</div>

				{#if callsheet.id}
					<div class="mb-4">
						<a class="text-blue-600 hover:text-blue-800 dark:text-blue-400" href="/call_sheets/{callsheet.projectId}/-1">
							<h2 class="text-lg flex items-center gap-2">
								<span class="icon-[tabler--external-link]" style="width: 1rem; height: 1rem;"></span>
								Link to the callsheet
							</h2>
						</a>
					</div>
				{/if}

				<div class="mb-5">
					<h2 class="text-lg font-medium mb-2">
						Contents <span class="text-red-500">*</span>
					</h2>
					{#if allowModification}
						<button
							class="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded m-1 disabled:opacity-50"
							disabled={isLoading}
							on:click={addNewContent}
							aria-label="Ajouter un nouveau contenu"
						>
							<span class="flex items-center gap-2">
								<span class="icon-[tabler--plus]" style="width: 1rem; height: 1rem;"></span>
								Add content
							</span>
						</button>
					{/if}
					<div>
						{#if callsheet.contents && callsheet.contents.length > 0}
							{#each callsheet.contents as content (content.id || content)}
								<div class="grid grid-cols-1 gap-1 mb-4 p-3 border rounded-lg bg-gray-50 dark:bg-gray-700">
									<div class="flex items-center justify-center">
										<label for="content-title-{content.id}" class="sr-only">
											Titre du contenu
										</label>
										<input
											id="content-title-{content.id}"
											class={`border rounded px-3 py-2 flex-1 ${
												allowModification && !isFieldValid(content.title)
													? 'border-red-400 bg-red-50 dark:bg-red-900'
													: 'border-gray-300 dark:border-gray-600'
											} ${!allowModification ? 'bg-gray-100 dark:bg-gray-600' : 'bg-white dark:bg-gray-800'}`}
											type="text"
											placeholder="Titre du contenu *"
											bind:value={content.title}
											disabled={!allowModification || isLoading}
										/>
										{#if allowModification}
											<button
												class="m-1 p-2 text-red-500 hover:text-red-700 disabled:opacity-50"
												disabled={isLoading}
												on:click={() => removeContent(content)}
												aria-label="Supprimer ce contenu"
											>
												<span
													class="icon-[tabler--trash]"
													style="width: 1.2rem; height: 1.2rem;"
												></span>
											</button>
										{/if}
									</div>
									{#if allowModification && !isFieldValid(content.title)}
										<p class="text-red-500 text-sm">Le titre est requis</p>
									{/if}
									{#if allowModification}
										<RichTextEditor
											value={content.text}
											onChange={(v) => content.text = v}
										/>
									{:else}
										<div class="prose dark:prose-invert max-w-none">{@html content.text}</div>
									{/if}
								</div>
							{/each}
						{:else if allowModification}
							<p class="text-gray-500 italic p-4 text-center border-2 border-dashed rounded-lg">
								Aucun contenu ajouté. Cliquez sur "Ajouter du contenu" pour commencer.
							</p>
						{/if}
					</div>
				</div>

				{#if allowModification}
					<div class="flex justify-end gap-3">
						<button
							on:click={saveCallsheet}
							disabled={isLoading}
							class="bg-blue-500 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded flex items-center gap-2"
						>
							{#if isLoading}
								<span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
							{:else}
								<span class="icon-[tabler--device-floppy]" style="width: 1rem; height: 1rem;"></span>
							{/if}
							{isLoading ? 'Sauvegarde...' : 'Save'}
						</button>
						{#if mode == 'modify'}
							<button
								on:click={deleteCallsheet}
								disabled={isLoading}
								class="bg-red-500 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded flex items-center gap-2"
							>
								{#if isLoading}
									<span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
								{:else}
									<span class="icon-[tabler--trash]" style="width: 1rem; height: 1rem;"></span>
								{/if}
								{isLoading ? 'Suppression...' : 'Delete'}
							</button>
						{/if}
					</div>
				{/if}
			</div>
		</div>
		<CallsheetShow {callsheet} />
	{:else}
		<div class="flex justify-center items-center h-64 col-span-full">
			<div class="text-center">
				<div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
				<p class="text-gray-600 dark:text-gray-400">Chargement de la callsheet...</p>
				<p class="text-sm text-gray-500 dark:text-gray-500 mt-2">
					Si le chargement prend trop de temps, vérifiez votre connexion ou rechargez la page.
				</p>
			</div>
		</div>
	{/if}
</div>