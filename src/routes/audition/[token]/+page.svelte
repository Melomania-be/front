<!-- src/routes/audition/[token]/+page.svelte - Version complète corrigée avec gestion d'erreurs améliorée -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	export let data;

	// DÉTECTION AUTOMATIQUE D'ENVIRONNEMENT CORRIGÉE
	function getApiBaseUrl(): string {
		if (typeof window !== 'undefined') {
			const hostname = window.location.hostname;
			const protocol = window.location.protocol;

			console.log('🌐 Frontend environment detection:', {
				hostname,
				protocol,
				fullUrl: window.location.href
			});

			// Développement local
			if (hostname === 'localhost' || hostname === '127.0.0.1') {
				console.log('🔧 Using LOCAL development API');
				return 'http://localhost:3333';
			}

			// SERVEUR DE TEST Universe.wf - API SUR SOUS-DOMAINE SÉPARÉ
			if (hostname === 'tool.sc1ciro3903.universe.wf' || hostname.includes('universe.wf')) {
				console.log('🧪 Using TEST server API (universe.wf)');
				// API sur sous-domaine api.sc1ciro3903.universe.wf
				return 'http://api.sc1ciro3903.universe.wf';
			}

			// PRODUCTION Melomania - UTILISE HTTPS
			if (hostname === 'tool.melomania.be' || hostname.includes('melomania.be')) {
				console.log('🚀 Using PRODUCTION API (melomania.be)');
				return 'https://tool.melomania.be';
			}

			// Fallback - utilise window.location.origin (protocole + hostname + port si présent)
			console.log('⚡ Using FALLBACK API configuration');
			return window.location.origin;
		}

		// Server-side fallback
		console.log('🔧 Using SERVER-SIDE fallback API');
		return 'http://localhost:3333';
	}

	// VÉRIFICATION SUPPLÉMENTAIRE - s'assurer qu'aucun port indésirable n'est ajouté
	function sanitizeApiUrl(url: string): string {
		// Pour universe.wf, s'assurer qu'il n'y a pas de port :3333
		if (url.includes('universe.wf') && url.includes(':3333')) {
			const cleanUrl = url.replace(':3333', '');
			console.warn('⚠️ Removed unwanted port :3333 from universe.wf URL:', cleanUrl);
			return cleanUrl;
		}

		// Pour melomania.be, s'assurer qu'il n'y a pas de port :3333
		if (url.includes('melomania.be') && url.includes(':3333')) {
			const cleanUrl = url.replace(':3333', '');
			console.warn('⚠️ Removed unwanted port :3333 from melomania.be URL:', cleanUrl);
			return cleanUrl;
		}

		return url;
	}

	// UTILISATION FINALE
	const rawApiUrl = getApiBaseUrl();
	const API_BASE_URL = sanitizeApiUrl(rawApiUrl);

	console.log('✅ FINAL API_BASE_URL:', API_BASE_URL);

	// Vérification finale avant chaque requête
	function buildApiUrl(endpoint: string): string {
		const fullUrl = `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
		const cleanUrl = sanitizeApiUrl(fullUrl);
		console.log('🔗 API Request URL:', cleanUrl);
		return cleanUrl;
	}

	let audition: any = null;
	let loading = true;
	let error = '';
	let uploading = false;
	let submitting = false;
	let candidateNotes = '';
	let saving = false;

	// ✅ AMÉLIORATION : Détails d'erreur pour meilleure UX
	let errorDetails = {
		type: '',
		message: '',
		canRetry: false,
		supportContact: ''
	};

	// Variables for upload - RESTRICTED to audio/video only
	let selectedFiles: FileList | null = null;
	let fileInput: HTMLInputElement;
	let fileType = 'video'; // Default to video
	let fileDescription = '';
	let uploadProgress = 0;
	let fileValidationError = '';

	// Variables for PDFs
	let pdfFiles: any[] = [];
	let loadingPdfs = false;

	// ======= DATE FORMATTING FUNCTIONS =======

	function formatDateSafe(dateValue: any): string {
		if (!dateValue) return 'Date not available';

		try {
			let date: Date;

			// If it's already a Date object
			if (dateValue instanceof Date) {
				date = dateValue;
			}
			// If it's an ISO string
			else if (typeof dateValue === 'string') {
				date = new Date(dateValue);
			}
			// If it's a timestamp
			else if (typeof dateValue === 'number') {
				date = new Date(dateValue);
			}
			// Otherwise, try to convert
			else {
				date = new Date(dateValue);
			}

			// Check if date is valid
			if (isNaN(date.getTime())) {
				console.error('Invalid date received:', dateValue);
				return 'Invalid date';
			}

			return date.toLocaleDateString('en-GB', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch (error) {
			console.error('Date formatting error:', error, 'for value:', dateValue);
			return 'Date error';
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
				return 'Invalid date';
			}

			return date.toLocaleDateString('en-GB');
		} catch (error) {
			console.error('Short date formatting error:', error);
			return 'Error';
		}
	}

	// ======= FILE VALIDATION FUNCTIONS - AUDIO/VIDEO RESTRICTION =======

	function isValidFileType(file, allowedTypes) {
		const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
		return allowedTypes.includes(fileExtension);
	}

	// RESTRICTION: Only audio and video
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

		// Check file type
		if (!isValidFileType(file, acceptedTypes)) {
			fileValidationError = `File type not allowed. Accepted types for ${fileType}: ${acceptedTypes.join(', ')}`;
			return;
		}

		// Check file size (50MB max)
		const maxSize = 50 * 1024 * 1024;
		if (file.size > maxSize) {
			fileValidationError = `File too large: ${formatFileSize(file.size)}. Maximum size: 50MB`;
			return;
		}

		console.log('File selected and validated:', {
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

	// ✅ FONCTION DE TÉLÉCHARGEMENT PDF AVEC DÉTECTION AUTO
	function downloadPdf(pdfId: number, fileName: string) {
		console.log(`📥 Downloading PDF ${pdfId}: ${fileName}`);

		// ✅ Utilisation de l'API détectée automatiquement
		const downloadUrl = buildApiUrl(`/audition/${data.token}/pdf/${pdfId}/download`);
		console.log(`🔗 Download URL: ${downloadUrl}`);

		const link = document.createElement('a');
		link.href = downloadUrl;
		link.download = fileName;
		link.style.display = 'none';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		console.log(`✅ PDF download initiated: ${fileName}`);
		showNotification(`Download started: ${fileName}`, 'success');
	}

	// ✅ FONCTION DE NOTIFICATION
	function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
		const notification = document.createElement('div');
		const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
		notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm`;
		notification.textContent = message;
		document.body.appendChild(notification);

		setTimeout(() => {
			notification.remove();
		}, 5000);
	}

	// ✅ AMÉLIORATION : Fonction loadAudition avec gestion d'erreurs détaillée
	async function loadAudition() {
		try {
			const apiUrl = buildApiUrl(`/audition/${data.token}`);
			console.log(`🔄 Loading audition from: ${apiUrl}`);
			const response = await fetch(apiUrl);

			if (response.ok) {
				audition = await response.json();

				// Load existing notes if they exist
				if (audition.candidate_notes) {
					candidateNotes = audition.candidate_notes;
				}

				// Get PDFs from audition data
				if (audition.pdfs) {
					pdfFiles = audition.pdfs;
				}

				console.log('✅ Audition data loaded successfully');
				loading = false;
				error = ''; // Clear any previous errors
				errorDetails = { type: '', message: '', canRetry: false, supportContact: '' };
			} else {
				// ✅ AMÉLIORATION : Gestion détaillée des erreurs selon le status
				let errorData = null;
				try {
					errorData = await response.json();
				} catch (parseError) {
					console.warn('Could not parse error response');
				}

				switch (response.status) {
					case 400:
						errorDetails = {
							type: 'invalid_link',
							message: 'Invalid audition link',
							canRetry: false,
							supportContact: 'Please contact the project organizers for a valid audition link.'
						};
						break;
					case 404:
						errorDetails = {
							type: 'not_found',
							message: 'Audition not found',
							canRetry: false,
							supportContact: 'This audition link is invalid or has expired. Please contact the project organizers.'
						};
						break;
					case 410:
						errorDetails = {
							type: 'expired',
							message: 'Audition deadline has passed',
							canRetry: false,
							supportContact: 'The deadline for this audition has passed. Please contact the project organizers if you need assistance.'
						};
						break;
					case 500:
						errorDetails = {
							type: 'server_error',
							message: 'Server error',
							canRetry: true,
							supportContact: 'A temporary server error occurred. Please try again in a few moments.'
						};
						break;
					default:
						errorDetails = {
							type: 'unknown',
							message: 'Unknown error occurred',
							canRetry: true,
							supportContact: 'An unexpected error occurred. Please try again or contact support.'
						};
				}

				error = errorData?.message || errorDetails.message;
				loading = false;
			}
		} catch (err) {
			console.error('❌ Network error loading audition:', err);
			errorDetails = {
				type: 'network_error',
				message: 'Network connection error',
				canRetry: true,
				supportContact: 'Please check your internet connection and try again.'
			};
			error = 'Network error, please check your connection and try again';
			loading = false;
		}
	}

	// ✅ AMÉLIORATION : Fonction loadPdfs avec gestion d'erreurs améliorée
	async function loadPdfs() {
		loadingPdfs = true;
		try {
			const apiUrl = buildApiUrl(`/audition/${data.token}/pdfs`);
			console.log(`📚 Loading PDFs from: ${apiUrl}`);
			const response = await fetch(apiUrl);

			if (response.ok) {
				pdfFiles = await response.json();
				console.log('✅ PDFs loaded:', pdfFiles.length);
			} else if (response.status === 404) {
				console.log('📚 No PDFs found for this audition (404)');
				pdfFiles = []; // Set empty array instead of error
			} else {
				console.warn('⚠️ Error loading PDFs:', response.status);
				pdfFiles = []; // Continue without PDFs
			}
		} catch (error) {
			console.warn('⚠️ Network error loading PDFs:', error);
			pdfFiles = []; // Continue without PDFs instead of failing
		} finally {
			loadingPdfs = false;
		}
	}

	// ✅ NOUVELLE FONCTION : Retry loading
	async function retryLoading() {
		loading = true;
		error = '';
		errorDetails = { type: '', message: '', canRetry: false, supportContact: '' };

		await Promise.all([
			loadAudition(),
			loadPdfs()
		]);
	}

	// ======= FONCTIONS PRINCIPALES =======

	onMount(async () => {
		console.log(`🎭 Initializing audition page with API: ${API_BASE_URL}`);
		await loadAudition();
		await loadPdfs();
	});

	// ✅ FONCTION UPLOAD AVEC DÉTECTION AUTO
	async function uploadFile() {
		if (!selectedFiles || selectedFiles.length === 0) {
			showNotification('Please select a file', 'error');
			return;
		}

		if (!fileDescription.trim()) {
			showNotification('Please add a description', 'error');
			return;
		}

		if (fileValidationError) {
			showNotification(`Validation error: ${fileValidationError}`, 'error');
			return;
		}

		const file = selectedFiles[0];

		// Double check validation
		const acceptedTypes = getAcceptedTypes();
		if (!isValidFileType(file, acceptedTypes)) {
			showNotification(`File type not allowed for ${fileType}`, 'error');
			return;
		}

		const maxSize = 50 * 1024 * 1024;
		if (file.size > maxSize) {
			showNotification('File is too large. Maximum allowed size: 50MB', 'error');
			return;
		}

		uploading = true;
		uploadProgress = 0;

		try {
			const apiUrl = buildApiUrl(`/audition/${data.token}/upload`);
			console.log(`🚀 Starting file upload to: ${apiUrl}`);

			const formData = new FormData();
			formData.append('file', file);
			formData.append('fileType', fileType);
			formData.append('description', fileDescription.trim());

			const response = await fetch(apiUrl, {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				const result = await response.json();
				console.log('✅ Upload successful:', result);

				// IMPORTANT: Reload data after successful upload
				await loadAudition();

				// Reset form AFTER success
				resetFileSelection();

				showNotification('File uploaded successfully!', 'success');
			} else {
				let errorMessage = `Upload failed (Status: ${response.status})`;

				try {
					const contentType = response.headers.get('content-type');
					if (contentType && contentType.includes('application/json')) {
						const errorData = await response.json();
						errorMessage = errorData.error || errorData.message || errorMessage;
					}
				} catch (parseError) {
					console.error('Error parsing response:', parseError);
				}

				showNotification(`Error: ${errorMessage}`, 'error');
			}
		} catch (err) {
			console.error('❌ Network error during upload:', err);
			showNotification('Network error during upload', 'error');
		} finally {
			uploading = false;
			uploadProgress = 0;
		}
	}

	// ✅ FONCTION DELETE AVEC DÉTECTION AUTO
	async function deleteFile(fileId: number) {
		if (!confirm('Are you sure you want to delete this file?')) {
			return;
		}

		try {
			const apiUrl = buildApiUrl(`/audition/${data.token}/files/${fileId}`);
			console.log(`🗑️ Deleting file from: ${apiUrl}`);
			const response = await fetch(apiUrl, {
				method: 'DELETE'
			});

			if (response.ok) {
				await loadAudition();
				showNotification('File deleted successfully', 'success');
			} else {
				showNotification('Error deleting file', 'error');
			}
		} catch (err) {
			console.error('❌ Error deleting file:', err);
			showNotification('Network error', 'error');
		}
	}

	// ✅ FONCTION SAVE AND EXIT AVEC DÉTECTION AUTO
	async function saveAndExit() {
		saving = true;

		try {
			if (candidateNotes.trim()) {
				const apiUrl = buildApiUrl(`/audition/${data.token}/save-notes`);
				console.log(`💾 Saving notes to: ${apiUrl}`);
				const response = await fetch(apiUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						notes: candidateNotes.trim()
					})
				});

				if (response.ok) {
					showNotification('Your notes have been saved. You can return later.', 'success');
				} else {
					showNotification('Error saving notes, but you can exit.', 'error');
				}
			} else {
				showNotification('Session closed. You can return later.', 'info');
			}

			setTimeout(() => {
				if (window.opener) {
					window.close();
				} else {
					window.location.href = 'about:blank';
				}
			}, 2000);
		} catch (error) {
			console.error('❌ Save error:', error);
			showNotification('Error saving.', 'error');
		} finally {
			saving = false;
		}
	}

	// ✅ FONCTION SUBMIT AVEC DÉTECTION AUTO
	async function submitAudition() {
		if (!audition.files || audition.files.length === 0) {
			showNotification('You must upload at least one file before submitting your audition.', 'error');
			return;
		}

		if (!confirm('Are you sure you want to submit your audition? You will not be able to modify it after submission.')) {
			return;
		}

		submitting = true;

		try {
			const apiUrl = buildApiUrl(`/audition/${data.token}/submit`);
			console.log(`🎯 Submitting audition to: ${apiUrl}`);
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					notes: candidateNotes
				})
			});

			if (response.ok) {
				// IMPORTANT: Completely reload data after submission
				await loadAudition();
				showNotification('Audition submitted successfully!', 'success');
			} else if (response.status === 409) {
				// Audition already submitted
				await loadAudition();
			} else {
				const errorData = await response.json().catch(() => null);
				showNotification('Error during submission: ' + (errorData?.error || 'Unknown error'), 'error');
			}
		} catch (err) {
			console.error('❌ Submission error:', err);
			showNotification('Network error during submission', 'error');
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

		if (diff <= 0) return 'Expired';

		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

		if (days > 0) return `${days} day(s) ${hours}h`;
		if (hours > 0) return `${hours}h ${minutes}min`;
		return `${minutes} minute(s)`;
	}

	// SAFE FILE DISPLAY FUNCTION
	function getFileDisplayInfo(auditionFile: any) {
		return {
			name: auditionFile?.file?.name || auditionFile?.name || 'Filename not available',
			description: auditionFile?.description || 'Description not available',
			fileType: auditionFile?.file_type || 'Unknown type',
			uploadedAt: auditionFile?.uploaded_at || auditionFile?.createdAt || null
		};
	}
</script>

<svelte:head>
	<title>Audition - {audition?.project?.name || 'Melomania'}</title>
</svelte:head>

<!-- ✅ DESIGN UNIFORME : Même background que la page d'auditions -->
<div class="bg-[#E7E7E7] p-4 min-h-screen">
	<div class="max-w-4xl mx-auto">

		<!-- ✅ Header avec design uniforme et info de debug -->
		<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6 mb-4">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="font-bold text-2xl text-gray-900">🎭 AUDITION PORTAL</h1>
					<p class="text-gray-600 mt-2">Melomania - Collaborative Musicians Platform</p>
					<p class="text-sm text-blue-600 mt-1 font-medium">🎵 Accepted files: Audio and Video only</p>
					<!-- Debug info pour les développeurs -->
					<p class="text-xs text-gray-400 mt-1">🔧 API: {API_BASE_URL}</p>
				</div>
				<div class="text-right">
					{#if audition?.deadline && !audition?.is_submitted}
						<p class="text-sm text-gray-500">Time remaining:</p>
						<p class="text-lg font-semibold text-orange-600">{getTimeRemaining()}</p>
					{/if}
				</div>
			</div>
		</div>

		{#if loading}
			<!-- ✅ Loading state avec design uniforme -->
			<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-8">
				<div class="flex justify-center items-center py-12">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
					<span class="ml-4 text-gray-600">Loading your audition...</span>
				</div>
			</div>
		{:else if error}
			<!-- ✅ AMÉLIORATION : Interface d'erreur plus détaillée -->
			<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
				<div class="text-center py-8">
					<!-- Icône selon le type d'erreur -->
					{#if errorDetails.type === 'expired'}
						<div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
							<svg class="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
					{:else if errorDetails.type === 'not_found' || errorDetails.type === 'invalid_link'}
						<div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
							<svg class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
							</svg>
						</div>
					{:else}
						<div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
							<svg class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
					{/if}

					<!-- Titre et message d'erreur -->
					<h3 class="text-lg font-medium text-gray-900 mb-2">{errorDetails.message}</h3>
					<p class="text-sm text-gray-600 mb-6">{errorDetails.supportContact}</p>

					<!-- Boutons d'action -->
					<div class="flex flex-col sm:flex-row gap-3 justify-center">
						{#if errorDetails.canRetry}
							<button
								on:click={retryLoading}
								class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center space-x-2"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
								</svg>
								<span>Try Again</span>
							</button>
						{/if}

						<!-- Bouton pour copier le token (debug) -->
						{#if errorDetails.type === 'not_found' || errorDetails.type === 'invalid_link'}
							<button
								on:click={() => {
									navigator.clipboard.writeText(data.token);
									showNotification('Token copied to clipboard', 'info');
								}}
								class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
							>
								Copy Token for Support
							</button>
						{/if}
					</div>

					<!-- Informations techniques pour le support -->
					{#if errorDetails.type !== 'expired'}
						<div class="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-left">
							<h4 class="text-sm font-medium text-gray-900 mb-2">Technical Information:</h4>
							<div class="text-xs text-gray-600 space-y-1">
								<p><strong>Error Type:</strong> {errorDetails.type}</p>
								<p><strong>Token:</strong> {data.token}</p>
								<p><strong>API URL:</strong> {API_BASE_URL}</p>
								<p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{:else if audition}
			<!-- ✅ AUDITION DÉJÀ SOUMISE - Design uniforme -->
			{#if audition.is_submitted}
				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6 mb-4">
					<h1 class="font-bold text-lg mb-4 text-center">✅ AUDITION SUBMITTED</h1>
					<div class="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6 text-center">
						<div class="max-w-md mx-auto">
							<div class="flex justify-center mb-4">
								<div class="bg-green-100 rounded-full p-3">
									<svg class="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
										<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
									</svg>
								</div>
							</div>
							<h2 class="text-xl font-bold text-gray-900 mb-2">
								{audition.participant?.contact?.firstName || 'Candidate'} {audition.participant?.contact?.lastName || ''}
							</h2>
							<h3 class="text-lg font-semibold text-green-800 mb-4">
								You have already submitted your audition!
							</h3>
							<p class="text-gray-700 mb-4">
								Your audition was successfully submitted on <strong>{formatDateSafe(audition.submitted_at)}</strong>.
							</p>
							<div class="bg-white border border-green-200 rounded-lg p-4 mb-4">
								<p class="text-green-800 font-medium">
									Our team will contact you as soon as possible to inform you about your application.
								</p>
							</div>
							<div class="text-sm text-gray-600 space-y-1">
								<p><strong>Files submitted:</strong> {audition.files?.length || 0}</p>
								<p><strong>Project:</strong> {audition.project?.name || 'Project not specified'}</p>
								<p><strong>Section:</strong> {audition.participant?.section?.name || 'Section not specified'}</p>
							</div>

							{#if audition.candidate_notes}
								<div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-left">
									<p class="text-sm font-medium text-blue-800 mb-1">Your notes:</p>
									<p class="text-sm text-blue-700">{audition.candidate_notes}</p>
								</div>
							{/if}

							<!-- SAFE DISPLAY OF SUBMITTED FILES -->
							{#if audition.files && audition.files.length > 0}
								<div class="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
									<h4 class="text-sm font-semibold text-gray-800 mb-3">Submitted files:</h4>
									<div class="space-y-2">
										{#each audition.files as auditionFile}
											{@const fileInfo = getFileDisplayInfo(auditionFile)}
											<div class="flex items-center justify-between text-sm">
												<div class="text-left">
													<p class="font-medium text-gray-700">{fileInfo.name}</p>
													<p class="text-xs text-gray-500">{fileInfo.description}</p>
													{#if fileInfo.uploadedAt}
														<p class="text-xs text-gray-400">
															Uploaded on {formatDateShort(fileInfo.uploadedAt)}
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
				</div>
			{:else}
				<!-- ✅ PDFs DISPONIBLES - Design uniforme -->
				{#if pdfFiles && pdfFiles.length > 0}
					<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6 mb-4">
						<h1 class="font-bold text-lg mb-4">📚 REQUIRED SHEET MUSIC AND DOCUMENTS</h1>

						<div class="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
							<div class="flex items-center">
								<svg class="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
								</svg>
								<p class="text-sm text-blue-700 font-medium">
									<strong>Documents for your audition:</strong> Download and study the sheet music below. You will then need to upload your audio or video interpretation.
								</p>
							</div>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							{#each pdfFiles as pdf}
								<div class="border-2 border-gray-300 rounded-lg p-4 bg-gray-50 hover:shadow-md transition-shadow">
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
											<p class="text-xs text-blue-600 font-medium">Section: {pdf.section}</p>
										</div>
										<button
											on:click={() => downloadPdf(pdf.file.id, pdf.file.name)}
											class="ml-3 px-3 py-2 bg-[#6B9AD9] text-white text-xs rounded hover:bg-blue-600 font-semibold transition-colors"
										>
											📥 Download
										</button>
									</div>
								</div>
							{/each}
						</div>

						{#if loadingPdfs}
							<div class="text-center py-4">
								<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
								<p class="text-sm text-gray-600 mt-2">Loading documents...</p>
							</div>
						{/if}
					</div>
				{/if}

				<!-- ✅ INFORMATIONS D'AUDITION - Design uniforme -->
				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6 mb-4">
					<h1 class="font-bold text-lg mb-4">YOUR AUDITION INFORMATION</h1>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
						<div>
							<p class="text-sm text-gray-500 font-medium">Candidate</p>
							<p class="font-semibold text-gray-900">
								{audition.participant?.contact?.firstName || 'First name'} {audition.participant?.contact?.lastName || 'Last name'}
							</p>
						</div>
						<div>
							<p class="text-sm text-gray-500 font-medium">Project</p>
							<p class="font-semibold text-blue-600">{audition.project?.name || 'Project not specified'}</p>
						</div>
						<div>
							<p class="text-sm text-gray-500 font-medium">Section</p>
							<p class="font-semibold text-purple-600">{audition.participant?.section?.name || 'Section not specified'}</p>
						</div>
						{#if audition.deadline}
							<div>
								<p class="text-sm text-gray-500 font-medium">Deadline</p>
								<p class="font-semibold text-orange-600">{formatDateSafe(audition.deadline)}</p>
							</div>
						{/if}
					</div>

					{#if audition.instructions}
						<div class="mb-6">
							<h3 class="text-lg font-medium text-gray-900 mb-2">Instructions</h3>
							<div class="prose max-w-none text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
								{@html audition.instructions}
							</div>
						</div>
					{/if}

					{#if audition.required_files && audition.required_files.length > 0}
						<div class="mb-6">
							<h3 class="text-lg font-medium text-gray-900 mb-2">Required files</h3>
							<ul class="list-disc list-inside text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
								{#each audition.required_files as file}
									<li>{file}</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>

				<!-- ✅ UPLOAD DE FICHIERS - Design uniforme -->
				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6 mb-4">
					<h1 class="font-bold text-lg mb-4">UPLOAD AUDIO/VIDEO FILES</h1>

					<!-- Alert about restriction -->
					<div class="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
						<div class="flex items-center">
							<svg class="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
							</svg>
							<p class="text-sm text-blue-700 font-medium">
								<strong>Important:</strong> Only audio and video files can be uploaded for this audition.
							</p>
						</div>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">File type</label>
							<select
								bind:value={fileType}
								on:change={() => {
									resetFileSelection();
								}}
								class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
								disabled={uploading}
							>
								<option value="video">🎬 Video (.mp4, .avi, .mov, .mkv, etc.)</option>
								<option value="audio">🎵 Audio (.mp3, .wav, .aac, .flac, etc.)</option>
							</select>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								File
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
								<div class="mt-2 p-2 bg-red-50 border-2 border-red-200 rounded text-sm text-red-700 font-medium">
									⚠️ {fileValidationError}
								</div>
							{/if}

							{#if selectedFiles && selectedFiles.length > 0 && !fileValidationError}
								<div class="mt-2 p-2 bg-green-50 border-2 border-green-200 rounded text-sm text-green-700">
									✅ File selected: <strong>{selectedFiles[0].name}</strong>
									<br>
									Size: <strong>{formatFileSize(selectedFiles[0].size)}</strong>
								</div>
							{/if}
						</div>
					</div>

					<div class="mb-4">
						<label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
						<input
							type="text"
							bind:value={fileDescription}
							placeholder="e.g. Interpretation of Bach Invention No.1"
							maxlength="255"
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							disabled={uploading}
						/>
						<div class="text-xs text-gray-500 mt-1">
							{fileDescription.length}/255 characters
						</div>
					</div>

					<!-- ACCEPTED TYPES - AUDIO/VIDEO ONLY -->
					<div class="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
						<h4 class="text-sm font-medium text-blue-800 mb-2">Accepted file types:</h4>
						<div class="text-xs text-blue-700 space-y-1">
							<div><strong>🎬 Video:</strong> MP4, AVI, MOV, WMV, FLV, MKV, WebM, M4V</div>
							<div><strong>🎵 Audio:</strong> MP3, WAV, AAC, FLAC, OGG, M4A, WMA</div>
						</div>
						<div class="text-xs text-blue-600 mt-2 font-medium">
							<strong>Maximum size:</strong> 50MB per file
						</div>
					</div>

					<div class="flex items-center justify-between">
						<button
							on:click={uploadFile}
							disabled={uploading || !selectedFiles || !fileDescription.trim() || fileValidationError}
							class="bg-[#6B9AD9] text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{#if uploading}
								<div class="flex items-center">
									<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
									Uploading...
								</div>
							{:else}
								📤 Upload file
							{/if}
						</button>

						{#if selectedFiles && selectedFiles.length > 0 && !uploading}
							<button
								on:click={resetFileSelection}
								class="text-gray-500 hover:text-gray-700 text-sm font-medium"
							>
								Cancel selection
							</button>
						{/if}
					</div>

					{#if uploadProgress > 0 && uploading}
						<div class="mt-4">
							<div class="bg-gray-200 rounded-full h-2">
								<div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: {uploadProgress}%"></div>
							</div>
							<p class="text-sm text-gray-600 mt-1 text-center">{uploadProgress}% uploaded</p>
						</div>
					{/if}
				</div>

				<!-- ✅ FICHIERS UPLOADÉS - Design uniforme -->
				{#if audition.files && audition.files.length > 0}
					<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6 mb-4">
						<h1 class="font-bold text-lg mb-4">UPLOADED FILES ({audition.files.length})</h1>

						<div class="space-y-3">
							{#each audition.files as auditionFile}
								{@const fileInfo = getFileDisplayInfo(auditionFile)}
								<div class="flex items-center justify-between p-3 border-2 border-gray-300 rounded-lg bg-gray-50">
									<div class="flex-1">
										<div class="flex items-center space-x-2 mb-1">
											<!-- Icon by type -->
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
											<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded capitalize font-semibold">
												{fileInfo.fileType}
											</span>
										</div>
										<p class="font-medium text-gray-900">{fileInfo.name}</p>
										<p class="text-sm text-gray-500">{fileInfo.description}</p>
										{#if fileInfo.uploadedAt}
											<p class="text-xs text-gray-400">
												Uploaded on {formatDateShort(fileInfo.uploadedAt)}
											</p>
										{/if}
									</div>
									<button
										on:click={() => deleteFile(auditionFile.id)}
										class="text-red-600 hover:text-red-800 ml-4 p-2 hover:bg-red-50 rounded transition-colors"
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

				<!-- ✅ FINALISATION - Design uniforme -->
				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
					<h1 class="font-bold text-lg mb-4">FINALIZE YOUR AUDITION</h1>

					<div class="mb-4">
						<label class="block text-sm font-medium text-gray-700 mb-2">Personal notes (optional)</label>
						<textarea
							bind:value={candidateNotes}
							rows="4"
							placeholder="Add any information you would like to share..."
							class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							disabled={submitting}
						></textarea>
					</div>

					<div class="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
						<div class="flex">
							<div class="flex-shrink-0">
								<svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
								</svg>
							</div>
							<div class="ml-3">
								<h3 class="text-sm font-medium text-yellow-800">Warning</h3>
								<p class="mt-1 text-sm text-yellow-700 font-medium">
									Once your audition is submitted, you will not be able to modify or add files.
								</p>
							</div>
						</div>
					</div>

					<!-- Action buttons -->
					<div class="flex flex-col sm:flex-row gap-3 justify-between">
						<!-- Save and exit button -->
						<button
							on:click={saveAndExit}
							disabled={saving}
							class="px-4 py-3 bg-gray-500 text-white rounded-md font-semibold hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{#if saving}
								<div class="flex items-center justify-center">
									<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
									Saving...
								</div>
							{:else}
								💾 Save and exit
							{/if}
						</button>

						<!-- Submit button -->
						<button
							on:click={submitAudition}
							disabled={submitting || (audition.files && audition.files.length === 0)}
							class="px-4 py-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1 sm:flex-none"
						>
							{submitting ? 'Submitting...' : '🎯 Submit my audition permanently'}
						</button>
					</div>

					{#if audition.files && audition.files.length === 0}
						<p class="text-sm text-red-600 text-center mt-4 font-medium">
							⚠️ You must upload at least one audio or video file before submitting your audition.
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