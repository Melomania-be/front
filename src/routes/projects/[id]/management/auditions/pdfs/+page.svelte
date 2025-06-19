<!-- src/routes/projects/[id]/management/auditions/pdfs/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	export let data;

	let sections: any[] = [];
	let loading = true;
	let selectedSection: any = null;
	let showUploadModal = false;
	let showSendModal = false;

	// Variables pour l'upload
	let uploadFile: File | null = null;
	let uploadTitle = '';
	let uploadDescription = '';
	let uploadOrder = 0;
	let isUploading = false;

	// Variables pour l'envoi en masse
	let selectedPdfs: any[] = [];
	let isSending = false;

	// Variables pour les statistiques
	let totalPdfs = 0;
	let totalSections = 0;
	let totalAuditions = 0;

	onMount(async () => {
		console.log('Project ID from data:', data.id);
		await loadSectionPdfs();
	});

	async function loadSectionPdfs() {
		loading = true;
		try {
			console.log('Loading PDFs for project:', data.id);

			const response = await fetch(`/api/projects/${data.id}/management/auditions/section-pdfs`);

			if (response.ok) {
				// ✅ CORRECTION : Changement du nom de variable pour éviter l'ombrage
				const responseData = await response.json();
				sections = responseData.sections || [];
				totalSections = responseData.total_sections || 0;
				totalPdfs = responseData.total_unique_pdfs || 0;
				totalAuditions = sections.reduce((sum, section) => sum + section.auditions_count, 0);

				console.log('Loaded sections:', sections);
			} else {
				const errorText = await response.text();
				console.error('Failed to load section PDFs. Status:', response.status, 'Response:', errorText);
			}
		} catch (error) {
			console.error('Error loading section PDFs:', error);
		} finally {
			loading = false;
		}
	}

	function openUploadModal(section: any) {
		selectedSection = section;
		showUploadModal = true;
		uploadFile = null;
		uploadTitle = '';
		uploadDescription = '';
		uploadOrder = 0;
	}

	function closeUploadModal() {
		showUploadModal = false;
		selectedSection = null;
		uploadFile = null;
		uploadTitle = '';
		uploadDescription = '';
		uploadOrder = 0;
		isUploading = false;
	}

	function openSendModal(section: any) {
		selectedSection = section;
		selectedPdfs = [];
		showSendModal = true;
	}

	function closeSendModal() {
		showSendModal = false;
		selectedSection = null;
		selectedPdfs = [];
		isSending = false;
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			uploadFile = target.files[0];

			// Auto-générer le titre basé sur le nom du fichier
			if (!uploadTitle) {
				const fileName = uploadFile.name.replace(/\.[^/.]+$/, ""); // Enlever l'extension
				uploadTitle = fileName;
			}
		}
	}

	async function uploadPdf() {
		if (!uploadFile || !uploadTitle || !selectedSection) return;

		isUploading = true;

		try {
			const formData = new FormData();
			formData.append('file', uploadFile);
			formData.append('title', uploadTitle);
			formData.append('description', uploadDescription);
			formData.append('section_id', selectedSection.section_id.toString());
			formData.append('order', uploadOrder.toString());

			console.log('Uploading PDF for project:', data.id, 'section:', selectedSection.section_id);

			const response = await fetch(`/api/projects/${data.id}/management/auditions/section-pdfs`, {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				await loadSectionPdfs();
				closeUploadModal();
				showNotification('PDF uploadé avec succès', 'success');
			} else {
				const errorText = await response.text();
				console.error('Upload failed. Status:', response.status, 'Response:', errorText);

				try {
					const errorData = JSON.parse(errorText);
					showNotification(`Erreur: ${errorData.error || 'Échec de l\'upload'}`, 'error');
				} catch {
					showNotification(`Erreur HTTP ${response.status}: ${errorText}`, 'error');
				}
			}
		} catch (error) {
			console.error('Error uploading PDF:', error);
			showNotification('Erreur réseau lors de l\'upload', 'error');
		} finally {
			isUploading = false;
		}
	}

	function togglePdfSelection(pdf: any) {
		const index = selectedPdfs.findIndex(p => p.file_id === pdf.file_id && p.title === pdf.title);
		if (index > -1) {
			selectedPdfs = selectedPdfs.filter((_, i) => i !== index);
		} else {
			selectedPdfs = [...selectedPdfs, pdf];
		}
	}

	async function sendPdfsToSection() {
		if (selectedPdfs.length === 0 || !selectedSection) return;

		isSending = true;

		try {
			console.log('Sending PDFs to section:', selectedSection.section_id, 'for project:', data.id);

			const response = await fetch(`/api/projects/${data.id}/management/auditions/bulk-send-pdfs`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					section_id: selectedSection.section_id,
					pdf_files: selectedPdfs.map(pdf => ({
						file_id: pdf.file_id,
						title: pdf.title,
						description: pdf.description,
						order: pdf.order
					}))
				})
			});

			if (response.ok) {
				const result = await response.json();
				await loadSectionPdfs();
				closeSendModal();
				showNotification(
					`PDFs envoyés avec succès à ${result.stats.successful_auditions} auditions de la section ${result.stats.section_name}`,
					'success'
				);
			} else {
				const errorText = await response.text();
				console.error('Bulk send failed. Status:', response.status, 'Response:', errorText);

				try {
					const errorData = JSON.parse(errorText);
					showNotification(`Erreur: ${errorData.error || 'Échec de l\'envoi'}`, 'error');
				} catch {
					showNotification(`Erreur HTTP ${response.status}: ${errorText}`, 'error');
				}
			}
		} catch (error) {
			console.error('Error sending PDFs:', error);
			showNotification('Erreur réseau lors de l\'envoi', 'error');
		} finally {
			isSending = false;
		}
	}

	async function deletePdf(pdf: any, section: any) {
		if (!confirm(`Êtes-vous sûr de vouloir supprimer "${pdf.title}" de la section ${section.section_name}?`)) {
			return;
		}

		try {
			console.log('Deleting PDF:', pdf.file_id, 'from project:', data.id);

			const response = await fetch(
				`/api/projects/${data.id}/management/auditions/section-pdfs?pdfFileId=${pdf.file_id}`,
				{
					method: 'DELETE'
				}
			);

			if (response.ok) {
				await loadSectionPdfs();
				showNotification('PDF supprimé avec succès', 'success');
			} else {
				const errorText = await response.text();
				console.error('Delete failed. Status:', response.status, 'Response:', errorText);

				try {
					const errorData = JSON.parse(errorText);
					showNotification(`Erreur: ${errorData.error || 'Échec de la suppression'}`, 'error');
				} catch {
					showNotification(`Erreur HTTP ${response.status}: ${errorText}`, 'error');
				}
			}
		} catch (error) {
			console.error('Error deleting PDF:', error);
			showNotification('Erreur réseau lors de la suppression', 'error');
		}
	}

	function showNotification(message: string, type: 'success' | 'error') {
		const notification = document.createElement('div');
		notification.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm ${
			type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
		}`;
		notification.textContent = message;
		document.body.appendChild(notification);

		setTimeout(() => {
			notification.remove();
		}, 5000);
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function goBack() {
		goto(`/projects/${data.id}/management/auditions`);
	}
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<div class="bg-white border-b border-gray-200 px-6 py-4">
		<div class="flex justify-between items-center">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Gestion des PDFs par Section</h1>
				<p class="text-sm text-gray-600 mt-1">
					Gérez les documents à distribuer aux candidats selon leur section
				</p>
				<!-- Debug info -->
				{#if data?.id}
					<p class="text-xs text-green-600 mt-1">✅ Projet ID: {data.id}</p>
				{:else}
					<p class="text-xs text-red-600 mt-1">❌ Aucun ID de projet trouvé</p>
				{/if}
			</div>
			<div class="flex gap-3">
				<button
					on:click={() => loadSectionPdfs()}
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
					disabled={loading}
				>
					{#if loading}
						<div class="flex items-center">
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
							Actualisation...
						</div>
					{:else}
						🔄 Actualiser
					{/if}
				</button>
				<button
					on:click={goBack}
					class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
				>
					← Retour aux auditions
				</button>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="p-6">
		{#if !data?.id}
			<div class="text-center py-12">
				<div class="text-red-500">
					<svg class="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
					<h3 class="text-lg font-medium text-red-900">Erreur de chargement</h3>
					<p class="text-sm text-red-600">ID du projet non disponible. Vérifiez que vous êtes sur la bonne page.</p>
				</div>
			</div>
		{:else if loading}
			<div class="flex justify-center items-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
				<span class="ml-4 text-gray-600">Chargement des PDFs...</span>
			</div>
		{:else}
			<!-- Statistics Cards -->
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
				<div class="bg-blue-50 p-4 rounded-lg">
					<div class="text-2xl font-bold text-blue-600">{totalSections}</div>
					<div class="text-sm text-blue-600">Sections</div>
				</div>
				<div class="bg-green-50 p-4 rounded-lg">
					<div class="text-2xl font-bold text-green-600">{totalPdfs}</div>
					<div class="text-sm text-green-600">PDFs Uniques</div>
				</div>
				<div class="bg-purple-50 p-4 rounded-lg">
					<div class="text-2xl font-bold text-purple-600">{totalAuditions}</div>
					<div class="text-sm text-purple-600">Auditions Actives</div>
				</div>
				<div class="bg-yellow-50 p-4 rounded-lg">
					<div class="text-2xl font-bold text-yellow-600">
						{sections.reduce((sum, s) => sum + s.pdfs.length, 0)}
					</div>
					<div class="text-sm text-yellow-600">Associations Totales</div>
				</div>
			</div>

			<!-- Instructions -->
			<div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
				<div class="flex items-center">
					<svg class="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
					</svg>
					<div class="text-sm text-blue-700">
						<p class="font-medium">📚 Fonctionnement</p>
						<p>
							1. <strong>Uploadez</strong> des PDFs pour chaque section
							• 2. <strong>Envoyez en masse</strong> les PDFs à toutes les auditions d'une section
							• 3. Les candidats pourront <strong>télécharger</strong> et jouer les morceaux
							• 4. Ils renverront leurs <strong>enregistrements audio/vidéo</strong>
						</p>
					</div>
				</div>
			</div>

			<!-- Sections List -->
			{#if sections.length === 0}
				<div class="text-center py-12">
					<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					<h3 class="mt-2 text-sm font-medium text-gray-900">Aucune section trouvée</h3>
					<p class="mt-1 text-sm text-gray-500">Assurez-vous que le projet a des sections configurées.</p>
				</div>
			{:else}
				<div class="space-y-6">
					{#each sections as section}
						<div class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
							<!-- Section Header -->
							<div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
								<div class="flex justify-between items-center">
									<div>
										<h3 class="text-lg font-medium text-gray-900">{section.section_name}</h3>
										<div class="flex items-center space-x-4 text-sm text-gray-600 mt-1">
											<span class="flex items-center">
												<span class="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
												{section.auditions_count} audition{section.auditions_count > 1 ? 's' : ''} active{section.auditions_count > 1 ? 's' : ''}
											</span>
											<span class="flex items-center">
												<span class="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
												{section.pdfs.length} PDF{section.pdfs.length > 1 ? 's' : ''}
											</span>
										</div>
									</div>
									<div class="flex space-x-2">
										<button
											on:click={() => openUploadModal(section)}
											class="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
										>
											📄 Ajouter PDF
										</button>
										{#if section.pdfs.length > 0}
											<button
												on:click={() => openSendModal(section)}
												class="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
												disabled={section.auditions_count === 0}
											>
												📤 Envoyer en masse
											</button>
										{/if}
									</div>
								</div>
							</div>

							<!-- PDFs List -->
							<div class="px-6 py-4">
								{#if section.pdfs.length === 0}
									<div class="text-center py-8 text-gray-500">
										<svg class="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
										</svg>
										<p class="text-sm">Aucun PDF pour cette section</p>
										<button
											on:click={() => openUploadModal(section)}
											class="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
										>
											Ajouter le premier PDF →
										</button>
									</div>
								{:else}
									<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
										{#each section.pdfs as pdf}
											<div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
												<div class="flex items-start justify-between mb-2">
													<div class="flex-1">
														<h4 class="font-medium text-gray-900">{pdf.title}</h4>
														{#if pdf.description}
															<p class="text-sm text-gray-600 mt-1">{pdf.description}</p>
														{/if}
													</div>
													<button
														on:click={() => deletePdf(pdf, section)}
														class="text-red-500 hover:text-red-700 p-1"
														title="Supprimer"
													>
														<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16" />
														</svg>
													</button>
												</div>
												<div class="flex items-center justify-between text-xs text-gray-500">
													<span>{pdf.file.name}</span>
													<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded">
														Utilisé {pdf.usage_count} fois
													</span>
												</div>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Upload Modal -->
{#if showUploadModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg shadow-lg max-w-md w-full">
			<div class="px-6 py-4 border-b border-gray-200">
				<h3 class="text-lg font-medium text-gray-900">
					Ajouter un PDF à {selectedSection?.section_name}
				</h3>
			</div>

			<div class="px-6 py-4">
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Fichier PDF *
						</label>
						<input
							type="file"
							accept=".pdf"
							on:change={handleFileSelect}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							disabled={isUploading}
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Titre *
						</label>
						<input
							type="text"
							bind:value={uploadTitle}
							placeholder="ex: Partition principale, Exercice technique"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							disabled={isUploading}
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Description (optionnel)
						</label>
						<textarea
							bind:value={uploadDescription}
							placeholder="Description détaillée du document"
							rows="3"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							disabled={isUploading}
						></textarea>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Ordre d'affichage
						</label>
						<input
							type="number"
							bind:value={uploadOrder}
							min="0"
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							disabled={isUploading}
						/>
					</div>
				</div>
			</div>

			<div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
				<button
					on:click={closeUploadModal}
					class="px-4 py-2 text-gray-500 hover:text-gray-700"
					disabled={isUploading}
				>
					Annuler
				</button>
				<button
					on:click={uploadPdf}
					class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={!uploadFile || !uploadTitle || isUploading}
				>
					{#if isUploading}
						<div class="flex items-center">
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
							Upload...
						</div>
					{:else}
						📄 Uploader PDF
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Send Modal -->
{#if showSendModal && selectedSection}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
			<div class="px-6 py-4 border-b border-gray-200">
				<h3 class="text-lg font-medium text-gray-900">
					Envoyer PDFs à {selectedSection.section_name}
				</h3>
				<p class="text-sm text-gray-600 mt-1">
					Sélectionnez les PDFs à envoyer aux {selectedSection.auditions_count} auditions actives
				</p>
			</div>

			<div class="px-6 py-4">
				{#if selectedSection.pdfs.length === 0}
					<div class="text-center py-8 text-gray-500">
						<p>Aucun PDF disponible pour cette section</p>
					</div>
				{:else}
					<div class="space-y-3">
						{#each selectedSection.pdfs as pdf}
							<div class="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
								<input
									type="checkbox"
									checked={selectedPdfs.some(p => p.file_id === pdf.file_id && p.title === pdf.title)}
									on:change={() => togglePdfSelection(pdf)}
									class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
									disabled={isSending}
								/>
								<div class="flex-1">
									<h4 class="font-medium text-gray-900">{pdf.title}</h4>
									{#if pdf.description}
										<p class="text-sm text-gray-600">{pdf.description}</p>
									{/if}
									<p class="text-xs text-gray-500">{pdf.file.name}</p>
								</div>
								<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
									Utilisé {pdf.usage_count} fois
								</span>
							</div>
						{/each}
					</div>

					<div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
						<div class="flex items-center">
							<svg class="h-5 w-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
							</svg>
							<div class="text-sm text-yellow-700">
								<p><strong>Action :</strong> Les PDFs sélectionnés seront associés à toutes les auditions actives de cette section.</p>
								<p><strong>Résultat :</strong> {selectedSection.auditions_count} candidat{selectedSection.auditions_count > 1 ? 's' : ''} pourront télécharger ces documents.</p>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
				<button
					on:click={closeSendModal}
					class="px-4 py-2 text-gray-500 hover:text-gray-700"
					disabled={isSending}
				>
					Annuler
				</button>
				<button
					on:click={sendPdfsToSection}
					class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={selectedPdfs.length === 0 || isSending}
				>
					{#if isSending}
						<div class="flex items-center">
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
							Envoi...
						</div>
					{:else}
						📤 Envoyer {selectedPdfs.length} PDF{selectedPdfs.length > 1 ? 's' : ''}
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}