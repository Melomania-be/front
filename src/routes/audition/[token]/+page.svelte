<!-- src/routes/audition/[token]/+page.svelte - VERSION CORRIGÉE AVEC PDFS -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	export let data;

	let audition: any = null;
	let loading = true;
	let error = '';
	let uploading = false;
	let submitting = false;
	let candidateNotes = '';
	let saving = false;

	// Variables pour l'upload - CORRIGÉES avec restriction audio/vidéo
	let selectedFiles: FileList | null = null;
	let fileInput: HTMLInputElement;
	let fileType = 'video'; // Par défaut vidéo
	let fileDescription = '';
	let uploadProgress = 0;
	let fileValidationError = '';

	// ✅ NOUVELLES VARIABLES pour les PDFs
	let pdfFiles: any[] = [];
	let loadingPdfs = false;

	// ======= FONCTIONS DE FORMATAGE DE DATE CORRIGÉES =======

	function formatDateSafe(dateValue: any): string {
		if (!dateValue) return 'Date non disponible';

		try {
			let date: Date;

			// Si c'est déjà un objet Date
			if (dateValue instanceof Date) {
				date = dateValue;
			}
			// Si c'est une string ISO
			else if (typeof dateValue === 'string') {
				date = new Date(dateValue);
			}
			// Si c'est un timestamp
			else if (typeof dateValue === 'number') {
				date = new Date(dateValue);
			}
			// Sinon, essayer de convertir
			else {
				date = new Date(dateValue);
			}

			// Vérifier si la date est valide
			if (isNaN(date.getTime())) {
				console.error('Date invalide reçue:', dateValue);
				return 'Date invalide';
			}

			return date.toLocaleDateString('fr-FR', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch (error) {
			console.error('Erreur formatage date:', error, 'pour valeur:', dateValue);
			return 'Erreur de date';
		}
	}

	function formatDateShort(dateValue: any): string {
		if (!dateValue) return 'N/A';

		try {
			let date: Date;

			if (dateValue instanceof Date) {
				date = dateValue;
			} else if (typeof dateValue === 'string') {
				date = new Date(dateValue);
			} else {
				date = new Date(dateValue);
			}

			if (isNaN(date.getTime())) {
				return 'Date invalide';
			}

			return date.toLocaleDateString('fr-FR');
		} catch (error) {
			console.error('Erreur formatage date courte:', error);
			return 'Erreur';
		}
	}

	// ======= FONCTIONS DE VALIDATION FICHIER - RESTRICTION AUDIO/VIDÉO =======

	function isValidFileType(file, allowedTypes) {
		const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
		return allowedTypes.includes(fileExtension);
	}

	// RESTRICTION: Seulement audio et vidéo
	function getAcceptedTypes() {
		const typeMap = {
			video: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm', '.m4v'],
			audio: ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a', '.wma']
		};

		return typeMap[fileType] || [];
	}

	function handleFileSelection() {
		fileValidationError = '';

		if (!selectedFiles || selectedFiles.length === 0) {
			return;
		}

		const file = selectedFiles[0];
		const acceptedTypes = getAcceptedTypes();

		// Vérifier le type de fichier
		if (!isValidFileType(file, acceptedTypes)) {
			fileValidationError = `Type de fichier non autorisé. Types acceptés pour ${fileType}: ${acceptedTypes.join(', ')}`;
			return;
		}

		// Vérifier la taille (50MB max)
		const maxSize = 50 * 1024 * 1024;
		if (file.size > maxSize) {
			fileValidationError = `Fichier trop volumineux: ${formatFileSize(file.size)}. Taille maximum: 50MB`;
			return;
		}

		console.log('Fichier sélectionné et validé:', {
			name: file.name,
			size: formatFileSize(file.size),
			type: file.type
		});
	}

	function resetFileSelection() {
		selectedFiles = null;
		fileDescription = '';
		fileValidationError = '';
		if (fileInput) {
			fileInput.value = '';
		}
	}

	// ✅ NOUVELLES FONCTIONS POUR LES PDFS

	async function loadPdfs() {
		loadingPdfs = true;
		try {
			const response = await fetch(`/api/audition/${data.token}/pdfs`);
			if (response.ok) {
				pdfFiles = await response.json();
				console.log('PDFs chargés:', pdfFiles);
			} else {
				console.error('Erreur lors du chargement des PDFs');
			}
		} catch (error) {
			console.error('Erreur réseau lors du chargement des PDFs:', error);
		} finally {
			loadingPdfs = false;
		}
	}

	function downloadPdf(pdfId: number, fileName: string) {
		const downloadUrl = `/api/audition/${data.token}/pdf/${pdfId}/download`;
		const link = document.createElement('a');
		link.href = downloadUrl;
		link.download = fileName;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	// ======= FONCTIONS EXISTANTES =======

	onMount(async () => {
		await loadAudition();
		await loadPdfs(); // ✅ Charger les PDFs aussi
	});

	async function loadAudition() {
		try {
			const response = await fetch(`/api/audition/${data.token}`);

			if (response.ok) {
				audition = await response.json();

				// Charger les notes existantes si elles existent
				if (audition.candidate_notes) {
					candidateNotes = audition.candidate_notes;
				}

				// ✅ NOUVEAU : Récupérer les PDFs depuis les données d'audition
				if (audition.pdfs) {
					pdfFiles = audition.pdfs;
				}

				// Debug des données reçues
				console.log('Données d\'audition chargées:', {
					submitted_at: audition.submitted_at,
					is_submitted: audition.is_submitted,
					files_count: audition.files?.length || 0,
					pdfs_count: audition.pdfs?.length || 0
				});

				loading = false;
			} else if (response.status === 404) {
				error = 'Audition non trouvée ou token invalide';
				loading = false;
			} else if (response.status === 410) {
				error = 'La date limite pour cette audition est dépassée';
				loading = false;
			} else {
				error = 'Erreur lors du chargement de l\'audition';
				loading = false;
			}
		} catch (err) {
			error = 'Erreur réseau, veuillez réessayer';
			loading = false;
		}
	}

	// ✅ FONCTION D'UPLOAD CORRIGÉE
	async function uploadFile() {
		if (!selectedFiles || selectedFiles.length === 0) {
			alert('Veuillez sélectionner un fichier');
			return;
		}

		if (!fileDescription.trim()) {
			alert('Veuillez ajouter une description');
			return;
		}

		if (fileValidationError) {
			alert(`Erreur de validation: ${fileValidationError}`);
			return;
		}

		const file = selectedFiles[0];

		// Double vérification de la validation
		const acceptedTypes = getAcceptedTypes();
		if (!isValidFileType(file, acceptedTypes)) {
			alert(`Type de fichier non autorisé pour ${fileType}`);
			return;
		}

		const maxSize = 50 * 1024 * 1024;
		if (file.size > maxSize) {
			alert('Le fichier est trop volumineux. Taille maximum autorisée : 50MB');
			return;
		}

		uploading = true;
		uploadProgress = 0;

		try {
			console.log('🚀 Début upload fichier...');

			const formData = new FormData();
			formData.append('file', file);
			formData.append('fileType', fileType);
			formData.append('description', fileDescription.trim());

			const controller = new AbortController();
			const timeoutId = setTimeout(() => {
				controller.abort();
			}, 10 * 60 * 1000); // 10 minutes timeout

			let response;

			try {
				response = await fetch(`/api/audition/${data.token}/upload`, {
					method: 'POST',
					body: formData,
					signal: controller.signal
				});
			} catch (fetchError) {
				clearTimeout(timeoutId);
				// Essayer URL directe en cas d'échec
				console.log('❌ Proxy échoué, essai URL directe...');
				const directUrl = `http://localhost:3333/api/audition/${data.token}/upload`;

				const retryController = new AbortController();
				const retryTimeoutId = setTimeout(() => {
					retryController.abort();
				}, 10 * 60 * 1000);

				try {
					response = await fetch(directUrl, {
						method: 'POST',
						body: formData,
						signal: retryController.signal
					});
					clearTimeout(retryTimeoutId);
				} catch (retryError) {
					clearTimeout(retryTimeoutId);
					throw retryError;
				}
			}

			clearTimeout(timeoutId);

			if (response.ok) {
				const result = await response.json();
				console.log('✅ Upload réussi:', result);

				// IMPORTANT: Recharger les données après upload réussi
				await loadAudition();

				// Reset form APRÈS succès
				resetFileSelection();

				alert('Fichier uploadé avec succès !');
			} else {
				let errorMessage = `Échec de l'upload (Status: ${response.status})`;

				try {
					const contentType = response.headers.get('content-type');
					if (contentType && contentType.includes('application/json')) {
						const errorData = await response.json();
						errorMessage = errorData.error || errorData.message || errorMessage;
					}
				} catch (parseError) {
					console.error('Erreur parsing réponse:', parseError);
				}

				alert(`Erreur: ${errorMessage}`);
			}
		} catch (err) {
			console.error('❌ Erreur réseau upload:', err);

			let errorMessage = 'Erreur réseau lors de l\'upload.';
			if (err.name === 'AbortError') {
				errorMessage = 'Timeout: l\'upload a pris trop de temps.';
			}

			alert(errorMessage);
		} finally {
			uploading = false;
			uploadProgress = 0;
		}
	}

	async function deleteFile(fileId: number) {
		if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
			return;
		}

		try {
			const response = await fetch(`/api/audition/${data.token}/files/${fileId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await loadAudition();
				alert('Fichier supprimé avec succès');
			} else {
				alert('Erreur lors de la suppression');
			}
		} catch (err) {
			alert('Erreur réseau');
		}
	}

	async function saveAndExit() {
		saving = true;

		try {
			if (candidateNotes.trim()) {
				const response = await fetch(`/api/audition/${data.token}/save-notes`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						notes: candidateNotes.trim()
					})
				});

				if (response.ok) {
					alert('Vos notes ont été sauvegardées. Vous pouvez revenir plus tard.');
				} else {
					alert('Erreur lors de la sauvegarde des notes, mais vous pouvez quitter.');
				}
			} else {
				alert('Session fermée. Vous pouvez revenir plus tard.');
			}

			if (window.opener) {
				window.close();
			} else {
				window.location.href = 'about:blank';
			}
		} catch (error) {
			console.error('Erreur sauvegarde:', error);
			alert('Erreur lors de la sauvegarde.');
		} finally {
			saving = false;
		}
	}

	// ✅ FONCTION SUBMIT CORRIGÉE
	async function submitAudition() {
		if (!audition.files || audition.files.length === 0) {
			alert('Vous devez uploader au moins un fichier avant de soumettre votre audition.');
			return;
		}

		if (!confirm('Êtes-vous sûr de vouloir soumettre votre audition ? Vous ne pourrez plus modifier après soumission.')) {
			return;
		}

		submitting = true;

		try {
			const response = await fetch(`/api/audition/${data.token}/submit`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					notes: candidateNotes
				})
			});

			if (response.ok) {
				// IMPORTANT: Recharger complètement les données après soumission
				await loadAudition();
				// Le message de succès sera affiché automatiquement
			} else if (response.status === 409) {
				// Audition déjà soumise
				await loadAudition();
			} else {
				const errorData = await response.json().catch(() => null);
				alert('Erreur lors de la soumission : ' + (errorData?.error || 'Erreur inconnue'));
			}
		} catch (err) {
			console.error('Erreur soumission:', err);
			alert('Erreur réseau lors de la soumission');
		} finally {
			submitting = false;
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function getTimeRemaining(): string {
		if (!audition?.deadline) return '';

		const now = new Date();
		const deadline = new Date(audition.deadline);
		const diff = deadline.getTime() - now.getTime();

		if (diff <= 0) return 'Expiré';

		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

		if (days > 0) return `${days} jour(s) ${hours}h`;
		if (hours > 0) return `${hours}h ${minutes}min`;
		return `${minutes} minute(s)`;
	}

	// ✅ FONCTION D'AFFICHAGE SÉCURISÉ DES FICHIERS
	function getFileDisplayInfo(auditionFile: any) {
		return {
			name: auditionFile?.file?.name || auditionFile?.name || 'Nom de fichier non disponible',
			description: auditionFile?.description || 'Description non disponible',
			fileType: auditionFile?.file_type || 'Type inconnu',
			uploadedAt: auditionFile?.uploaded_at || auditionFile?.createdAt || null
		};
	}
</script>

<svelte:head>
	<title>Audition - {audition?.project?.name || 'Melomania'}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-4xl mx-auto px-4">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-md p-6 mb-6">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Portail d'Audition</h1>
					<p class="text-gray-600 mt-2">Melomania - Plateforme collaborative des musiciens</p>
					<p class="text-sm text-blue-600 mt-1">🎵 Fichiers acceptés : Audio et Vidéo uniquement</p>
				</div>
				<div class="text-right">
					{#if audition?.deadline && !audition?.is_submitted}
						<p class="text-sm text-gray-500">Temps restant:</p>
						<p class="text-lg font-semibold text-orange-600">{getTimeRemaining()}</p>
					{/if}
				</div>
			</div>
		</div>

		{#if loading}
			<div class="bg-white rounded-lg shadow-md p-8 text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
				<p class="mt-4 text-gray-600">Chargement de votre audition...</p>
			</div>
		{:else if error}
			<div class="bg-red-50 border border-red-200 rounded-lg p-6">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
						</svg>
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-red-800">Erreur</h3>
						<p class="mt-1 text-sm text-red-700">{error}</p>
					</div>
				</div>
			</div>
		{:else if audition}
			<!-- ✅ MESSAGE AMÉLIORÉ POUR AUDITION SOUMISE - FORMATAGE DATES CORRIGÉ -->
			{#if audition.is_submitted}
				<div class="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-8 text-center mb-6">
					<div class="max-w-md mx-auto">
						<div class="flex justify-center mb-4">
							<div class="bg-green-100 rounded-full p-3">
								<svg class="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
								</svg>
							</div>
						</div>
						<h2 class="text-2xl font-bold text-gray-900 mb-2">
							{audition.participant?.contact?.firstName || 'Candidat'} {audition.participant?.contact?.lastName || ''}
						</h2>
						<h3 class="text-xl font-semibold text-green-800 mb-4">
							Vous avez déjà soumis votre audition !
						</h3>
						<p class="text-gray-700 mb-4">
							Votre audition a été soumise avec succès le <strong>{formatDateSafe(audition.submitted_at)}</strong>.
						</p>
						<div class="bg-white border border-green-200 rounded-lg p-4 mb-4">
							<p class="text-green-800 font-medium text-lg">
								Notre équipe vous recontactera au plus vite pour vous informer de votre candidature.
							</p>
						</div>
						<div class="text-sm text-gray-600 space-y-1">
							<p><strong>Fichiers soumis :</strong> {audition.files?.length || 0}</p>
							<p><strong>Projet :</strong> {audition.project?.name || 'Projet non spécifié'}</p>
							<p><strong>Section :</strong> {audition.participant?.section?.name || 'Section non spécifiée'}</p>
						</div>

						{#if audition.candidate_notes}
							<div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-left">
								<p class="text-sm font-medium text-blue-800 mb-1">Vos notes :</p>
								<p class="text-sm text-blue-700">{audition.candidate_notes}</p>
							</div>
						{/if}

						<!-- ✅ AFFICHAGE SÉCURISÉ DES FICHIERS SOUMIS -->
						{#if audition.files && audition.files.length > 0}
							<div class="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
								<h4 class="text-sm font-semibold text-gray-800 mb-3">Fichiers soumis :</h4>
								<div class="space-y-2">
									{#each audition.files as auditionFile}
										{@const fileInfo = getFileDisplayInfo(auditionFile)}
										<div class="flex items-center justify-between text-sm">
											<div class="text-left">
												<p class="font-medium text-gray-700">{fileInfo.name}</p>
												<p class="text-xs text-gray-500">{fileInfo.description}</p>
												{#if fileInfo.uploadedAt}
													<p class="text-xs text-gray-400">
														Uploadé le {formatDateShort(fileInfo.uploadedAt)}
													</p>
												{/if}
											</div>
											<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded capitalize">
												{fileInfo.fileType}
											</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>
			{:else}
				<!-- ✅ NOUVEAU : Affichage des PDFs disponibles -->
				{#if pdfFiles && pdfFiles.length > 0}
					<div class="bg-white rounded-lg shadow-md p-6 mb-6">
						<h2 class="text-xl font-semibold text-gray-900 mb-4">📚 Partitions et documents requis</h2>

						<div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
							<div class="flex items-center">
								<svg class="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
								</svg>
								<p class="text-sm text-blue-700">
									<strong>Documents pour votre audition :</strong> Téléchargez et étudiez les partitions ci-dessous. Vous devrez ensuite uploader votre interprétation audio ou vidéo.
								</p>
							</div>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							{#each pdfFiles as pdf}
								<div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
									<div class="flex items-start justify-between">
										<div class="flex-1">
											<div class="flex items-center mb-2">
												<svg class="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
												</svg>
												<h3 class="text-sm font-semibold text-gray-900">{pdf.title}</h3>
											</div>
											{#if pdf.description}
												<p class="text-xs text-gray-600 mb-2">{pdf.description}</p>
											{/if}
											<p class="text-xs text-gray-500">Section : {pdf.section}</p>
										</div>
										<button
											on:click={() => downloadPdf(pdf.id, pdf.file.name)}
											class="ml-3 px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
										>
											📥 Télécharger
										</button>
									</div>
								</div>
							{/each}
						</div>

						{#if loadingPdfs}
							<div class="text-center py-4">
								<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
								<p class="text-sm text-gray-600 mt-2">Chargement des documents...</p>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Informations de l'audition -->
				<div class="bg-white rounded-lg shadow-md p-6 mb-6">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">Informations sur votre audition</h2>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
						<div>
							<p class="text-sm text-gray-500">Candidat</p>
							<p class="font-medium">
								{audition.participant?.contact?.firstName || 'Prénom'} {audition.participant?.contact?.lastName || 'Nom'}
							</p>
						</div>
						<div>
							<p class="text-sm text-gray-500">Projet</p>
							<p class="font-medium">{audition.project?.name || 'Projet non spécifié'}</p>
						</div>
						<div>
							<p class="text-sm text-gray-500">Section</p>
							<p class="font-medium">{audition.participant?.section?.name || 'Section non spécifiée'}</p>
						</div>
						{#if audition.deadline}
							<div>
								<p class="text-sm text-gray-500">Date limite</p>
								<p class="font-medium">{formatDateSafe(audition.deadline)}</p>
							</div>
						{/if}
					</div>

					{#if audition.instructions}
						<div class="mb-6">
							<h3 class="text-lg font-medium text-gray-900 mb-2">Instructions</h3>
							<div class="prose max-w-none text-gray-700">
								{@html audition.instructions}
							</div>
						</div>
					{/if}

					{#if audition.required_files && audition.required_files.length > 0}
						<div class="mb-6">
							<h3 class="text-lg font-medium text-gray-900 mb-2">Fichiers requis</h3>
							<ul class="list-disc list-inside text-gray-700">
								{#each audition.required_files as file}
									<li>{file}</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>

				<!-- ✅ UPLOAD DE FICHIERS - RESTRICTION AUDIO/VIDÉO -->
				<div class="bg-white rounded-lg shadow-md p-6 mb-6">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">Upload de fichiers audio/vidéo</h2>

					<!-- Alerte sur la restriction -->
					<div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
						<div class="flex items-center">
							<svg class="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
							</svg>
							<p class="text-sm text-blue-700">
								<strong>Important :</strong> Seuls les fichiers audio et vidéo peuvent être uploadés pour cette audition.
							</p>
						</div>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Type de fichier</label>
							<select
								bind:value={fileType}
								on:change={() => {
									resetFileSelection();
								}}
								class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
								disabled={uploading}
							>
								<option value="video">🎬 Vidéo (.mp4, .avi, .mov, .mkv, etc.)</option>
								<option value="audio">🎵 Audio (.mp3, .wav, .aac, .flac, etc.)</option>
							</select>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Fichier
								<span class="text-xs text-gray-500">(Max: 50MB)</span>
							</label>
							<input
								type="file"
								bind:this={fileInput}
								bind:files={selectedFiles}
								on:change={handleFileSelection}
								accept={getAcceptedTypes().join(',')}
								class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
								disabled={uploading}
							/>

							{#if fileValidationError}
								<div class="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
									⚠️ {fileValidationError}
								</div>
							{/if}

							{#if selectedFiles && selectedFiles.length > 0 && !fileValidationError}
								<div class="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
									✅ Fichier sélectionné: <strong>{selectedFiles[0].name}</strong>
									<br>
									Taille: <strong>{formatFileSize(selectedFiles[0].size)}</strong>
								</div>
							{/if}
						</div>
					</div>

					<div class="mb-4">
						<label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
						<input
							type="text"
							bind:value={fileDescription}
							placeholder="ex: Interprétation de Bach Invention No.1"
							maxlength="255"
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							disabled={uploading}
						/>
						<div class="text-xs text-gray-500 mt-1">
							{fileDescription.length}/255 caractères
						</div>
					</div>

					<!-- ✅ TYPES ACCEPTÉS CORRIGÉS - AUDIO/VIDÉO SEULEMENT -->
					<div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
						<h4 class="text-sm font-medium text-blue-800 mb-2">Types de fichiers acceptés :</h4>
						<div class="text-xs text-blue-700 space-y-1">
							<div><strong>🎬 Vidéo :</strong> MP4, AVI, MOV, WMV, FLV, MKV, WebM, M4V</div>
							<div><strong>🎵 Audio :</strong> MP3, WAV, AAC, FLAC, OGG, M4A, WMA</div>
						</div>
						<div class="text-xs text-blue-600 mt-2">
							<strong>Taille maximum :</strong> 50MB par fichier
						</div>
					</div>

					<div class="flex items-center justify-between">
						<button
							on:click={uploadFile}
							disabled={uploading || !selectedFiles || !fileDescription.trim() || fileValidationError}
							class="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{#if uploading}
								<div class="flex items-center">
									<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
									Upload en cours...
								</div>
							{:else}
								📤 Upload le fichier
							{/if}
						</button>

						{#if selectedFiles && selectedFiles.length > 0 && !uploading}
							<button
								on:click={resetFileSelection}
								class="text-gray-500 hover:text-gray-700 text-sm"
							>
								Annuler la sélection
							</button>
						{/if}
					</div>

					{#if uploadProgress > 0 && uploading}
						<div class="mt-4">
							<div class="bg-gray-200 rounded-full h-2">
								<div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: {uploadProgress}%"></div>
							</div>
							<p class="text-sm text-gray-600 mt-1 text-center">{uploadProgress}% uploadé</p>
						</div>
					{/if}
				</div>

				<!-- ✅ FICHIERS UPLOADÉS - AFFICHAGE SÉCURISÉ -->
				{#if audition.files && audition.files.length > 0}
					<div class="bg-white rounded-lg shadow-md p-6 mb-6">
						<h2 class="text-xl font-semibold text-gray-900 mb-4">Fichiers uploadés ({audition.files.length})</h2>

						<div class="space-y-3">
							{#each audition.files as auditionFile}
								{@const fileInfo = getFileDisplayInfo(auditionFile)}
								<div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
									<div class="flex-1">
										<div class="flex items-center space-x-2 mb-1">
											<!-- Icône selon le type -->
											{#if fileInfo.fileType === 'video'}
												<svg class="h-5 w-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
													<path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
												</svg>
											{:else if fileInfo.fileType === 'audio'}
												<svg class="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 010 1.414A4.98 4.98 0 0117 12a4.98 4.98 0 01-1.343 4.243 1 1 0 01-1.414-1.414A2.98 2.98 0 0015 12a2.98 2.98 0 00-.757-1.829 1 1 0 010-1.414z" clip-rule="evenodd" />
												</svg>
											{:else}
												<svg class="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
												</svg>
											{/if}
											<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded capitalize">
												{fileInfo.fileType}
											</span>
										</div>
										<p class="font-medium text-gray-900">{fileInfo.name}</p>
										<p class="text-sm text-gray-500">{fileInfo.description}</p>
										{#if fileInfo.uploadedAt}
											<p class="text-xs text-gray-400">
												Uploadé le {formatDateShort(fileInfo.uploadedAt)}
											</p>
										{/if}
									</div>
									<button
										on:click={() => deleteFile(auditionFile.id)}
										class="text-red-600 hover:text-red-800 ml-4"
									>
										<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
											<path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 112 0v6a1 1 0 11-2 0V9zm4 0a1 1 0 112 0v6a1 1 0 11-2 0V9z" clip-rule="evenodd" />
										</svg>
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Soumission finale -->
				<div class="bg-white rounded-lg shadow-md p-6">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">Finaliser votre audition</h2>

					<div class="mb-4">
						<label class="block text-sm font-medium text-gray-700 mb-2">Notes personnelles (optionnel)</label>
						<textarea
							bind:value={candidateNotes}
							rows="4"
							placeholder="Ajoutez ici toute information que vous souhaitez transmettre..."
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							disabled={submitting}
						></textarea>
					</div>

					<div class="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
						<div class="flex">
							<div class="flex-shrink-0">
								<svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
								</svg>
							</div>
							<div class="ml-3">
								<h3 class="text-sm font-medium text-yellow-800">Attention</h3>
								<p class="mt-1 text-sm text-yellow-700">
									Une fois votre audition soumise, vous ne pourrez plus modifier ou ajouter de fichiers.
								</p>
							</div>
						</div>
					</div>

					<!-- Boutons d'action -->
					<div class="flex flex-col sm:flex-row gap-3 justify-between">
						<!-- Bouton Sauvegarder et quitter -->
						<button
							on:click={saveAndExit}
							disabled={saving}
							class="px-4 py-3 bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{#if saving}
								<div class="flex items-center justify-center">
									<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
									Sauvegarde...
								</div>
							{:else}
								💾 Sauvegarder et quitter
							{/if}
						</button>

						<!-- Bouton Soumettre -->
						<button
							on:click={submitAudition}
							disabled={submitting || (audition.files && audition.files.length === 0)}
							class="px-4 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1 sm:flex-none"
						>
							{submitting ? 'Soumission en cours...' : '🎯 Soumettre définitivement mon audition'}
						</button>
					</div>

					{#if audition.files && audition.files.length === 0}
						<p class="text-sm text-red-600 text-center mt-4 font-medium">
							⚠️ Vous devez uploader au moins un fichier audio ou vidéo avant de soumettre votre audition.
						</p>
					{/if}
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
    .prose {
        max-width: none;
    }

    .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
        color: inherit;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
    }

    .prose p {
        margin-bottom: 1rem;
    }

    .prose ul, .prose ol {
        margin-bottom: 1rem;
        padding-left: 1.5rem;
    }

    .prose li {
        margin-bottom: 0.25rem;
    }
</style>