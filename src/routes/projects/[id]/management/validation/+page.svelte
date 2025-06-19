<!-- src/routes/projects/[id]/management/validation/+page.svelte - Version complète -->
<script lang="ts">
	import AttendancePicker from '$lib/components/participant/AttendancePicker.svelte';
	import RegistrationForm from '$lib/components/registration/RegistrationForm.svelte';
	import type { Participant } from '$lib/types/Participant.js';
	import type { Concert } from '$lib/types/Concert.js';
	import type { Rehearsal } from '$lib/types/Rehearsal.js';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';

	export let data;
	let participants: Array<Participant>;
	let currentParticipant: Participant | null;

	// Variables pour le modal de refus
	let showRefusalModal = false;
	let refusalMessage = '';
	let isRefusing = false;

	// Variables pour le modal d'audition
	let showAuditionModal = false;
	let auditionInstructions = '';
	let auditionRequiredFiles = [''];
	let auditionDeadline = '';
	let isRequestingAudition = false;

	// Variables pour la gestion des PDFs par section
	let showPdfModal = false;
	let availablePdfs: any[] = [];
	let selectedPdfs: any[] = [];
	let loadingPdfs = false;
	let sendingPdfs = false;

	// Variables for Quill
	let quillContainer: HTMLElement;
	let quillAuditionContainer: HTMLElement;
	let quill: any;
	let quillAudition: any;
	let quillLoaded = false;

	// Variables to store ALL project dates
	let allConcerts: Concert[] = [];
	let allRehearsals: Rehearsal[] = [];

	// Variables pour les statistiques
	let auditionStats: any = {
		total: 0,
		submitted: 0,
		pending: 0,
		expired: 0,
		totalFiles: 0,
		totalPdfs: 0
	};

	// Auto-refresh
	let refreshInterval: any = null;

	onMount(async () => {
		await loadParticipants();
		await loadProjectData();
		await loadQuill();
		await loadAuditionStats();

		// Auto-refresh des stats toutes les 2 minutes
		refreshInterval = setInterval(async () => {
			await loadAuditionStats();
		}, 120000);
	});

	onDestroy(() => {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
		if (quill) {
			quill = null;
		}
		if (quillAudition) {
			quillAudition = null;
		}
	});

	async function loadParticipants() {
		try {
			const responseParticipants = await fetch(`/api/projects/${data.id}/management/validation`);
			if (responseParticipants.ok) {
				participants = await responseParticipants.json();
			} else {
				console.error('Failed to load participants');
			}
		} catch (error) {
			console.error('Error loading participants:', error);
		}
	}

	async function loadProjectData() {
		try {
			// Fetch ALL project dates
			const responseAttendance = await fetch(`/api/projects/${data.id}/management/attendance`);
			if (responseAttendance.ok) {
				const attendanceData = await responseAttendance.json();
				allConcerts = attendanceData.concerts;
				allRehearsals = attendanceData.rehearsals;
			}
		} catch (error) {
			console.error('Error loading project data:', error);
		}
	}

	async function loadAuditionStats() {
		try {
			const response = await fetch(`/api/projects/${data.id}/management/auditions`);
			if (response.ok) {
				const data = await response.json();
				auditionStats = data.stats || {
					total: 0,
					submitted: 0,
					pending: 0,
					expired: 0,
					totalFiles: 0,
					totalPdfs: 0
				};
			}
		} catch (error) {
			console.error('Error loading audition stats:', error);
		}
	}

	async function loadQuill() {
		try {
			if (typeof window !== 'undefined' && !window.Quill) {
				// Load CSS
				const linkElement = document.createElement('link');
				linkElement.rel = 'stylesheet';
				linkElement.href = 'https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.snow.min.css';
				document.head.appendChild(linkElement);

				// Load JS
				const scriptElement = document.createElement('script');
				scriptElement.src = 'https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.min.js';

				await new Promise((resolve, reject) => {
					scriptElement.onload = resolve;
					scriptElement.onerror = reject;
					document.head.appendChild(scriptElement);
				});
			}
			quillLoaded = true;
		} catch (error) {
			console.error('Error loading Quill:', error);
		}
	}

	function initializeQuill() {
		if (quillLoaded && quillContainer && window.Quill && !quill) {
			quill = new window.Quill(quillContainer, {
				theme: 'snow',
				placeholder: 'Vous pouvez expliquer les raisons du refus ici...',
				modules: {
					toolbar: [
						[{ 'header': [1, 2, 3, false] }],
						['bold', 'italic', 'underline'],
						[{ 'list': 'ordered'}, { 'list': 'bullet' }],
						[{ 'color': [] }, { 'background': [] }],
						['link'],
						['clean']
					]
				}
			});

			quill.on('text-change', () => {
				const html = quill.root.innerHTML;
				const text = quill.getText();
				refusalMessage = text.trim() === '' ? '' : html;
			});

			if (refusalMessage) {
				quill.root.innerHTML = refusalMessage;
			}
		}
	}

	function initializeAuditionQuill() {
		if (quillLoaded && quillAuditionContainer && window.Quill && !quillAudition) {
			quillAudition = new window.Quill(quillAuditionContainer, {
				theme: 'snow',
				placeholder: 'Décrivez ce que le candidat doit préparer pour l\'audition...',
				modules: {
					toolbar: [
						[{ 'header': [1, 2, 3, false] }],
						['bold', 'italic', 'underline'],
						[{ 'list': 'ordered'}, { 'list': 'bullet' }],
						[{ 'color': [] }, { 'background': [] }],
						['link'],
						['clean']
					]
				}
			});

			quillAudition.on('text-change', () => {
				const html = quillAudition.root.innerHTML;
				const text = quillAudition.getText();
				auditionInstructions = text.trim() === '' ? '' : html;
			});

			if (auditionInstructions) {
				quillAudition.root.innerHTML = auditionInstructions;
			}
		}
	}

	// Fonctions existantes...
	async function deleteParticipant() {
		if (!currentParticipant) return;

		try {
			const response = await fetch(
				`/api/projects/${data.id}/management/participants/${currentParticipant.id}`,
				{
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);

			if (response.ok) {
				participants = participants.filter(
					(participant) => participant.id !== currentParticipant!.id
				);
				currentParticipant = null;
			} else {
				alert('Erreur lors de la suppression');
			}
		} catch (error) {
			console.error('Error deleting participant:', error);
			alert('Erreur réseau');
		}
	}

	async function validateParticipant() {
		if (!currentParticipant) return;

		try {
			// Envoyer l'email de validation
			const responseEmail = await fetch(`/api/mailing/sendParticipationValidationNotifications`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ projectId: data.id, contactId: currentParticipant.contact.id })
			});

			if (!responseEmail.ok) {
				console.error('Failed to send email');
			}

			// Valider le participant
			const response = await fetch(`/api/projects/${data.id}/management/validation`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ id: currentParticipant.id })
			});

			if (response.ok) {
				participants = participants.filter(
					(participant) => participant.id !== currentParticipant!.id
				);
				currentParticipant = null;
				alert('Participant validé avec succès');

				// Recharger les stats d'audition
				await loadAuditionStats();
			} else {
				alert('Erreur lors de la validation');
			}
		} catch (error) {
			console.error('Error validating participant:', error);
			alert('Erreur réseau');
		}
	}

	// Nouvelles fonctions pour les auditions
	function openAuditionModal() {
		showAuditionModal = true;
		auditionInstructions = '';
		auditionRequiredFiles = [''];
		auditionDeadline = '';

		setTimeout(() => {
			initializeAuditionQuill();
		}, 100);
	}

	function closeAuditionModal() {
		showAuditionModal = false;
		auditionInstructions = '';
		auditionRequiredFiles = [''];
		auditionDeadline = '';
		isRequestingAudition = false;

		if (quillAudition) {
			quillAudition.setText('');
		}
	}

	function addRequiredFile() {
		auditionRequiredFiles = [...auditionRequiredFiles, ''];
	}

	function removeRequiredFile(index: number) {
		auditionRequiredFiles = auditionRequiredFiles.filter((_, i) => i !== index);
	}

	async function requestAudition() {
		if (!currentParticipant) return;

		isRequestingAudition = true;

		try {
			let finalInstructions = '';
			if (quillAudition) {
				const text = quillAudition.getText().trim();
				finalInstructions = text ? quillAudition.root.innerHTML : '';
			}

			// Nettoyer et filtrer les fichiers requis
			const filteredRequiredFiles = auditionRequiredFiles
				.filter(file => file && file.trim() !== '')
				.map(file => file.trim());

			// Construire les données avec validation
			const auditionData = {
				instructions: finalInstructions || '',
				required_files: filteredRequiredFiles,
				deadline: auditionDeadline || null
			};

			console.log('Sending audition data:', auditionData);

			const url = `/api/projects/${data.id}/management/participants/${currentParticipant.id}/request-audition`;
			console.log('Request URL:', url);

			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(auditionData)
			});

			if (response.ok) {
				// Recharger les participants pour obtenir le statut mis à jour
				await loadParticipants();
				await loadAuditionStats();

				// Mettre à jour le participant actuel
				if (currentParticipant) {
					const updatedParticipant = participants.find(p => p.id === currentParticipant!.id);
					if (updatedParticipant) {
						currentParticipant = updatedParticipant;
					}
				}

				closeAuditionModal();
				showNotification('Demande d\'audition envoyée avec succès ! Le candidat recevra les PDFs de sa section automatiquement.', 'success');
			} else {
				const errorText = await response.text();
				console.error('Server response:', errorText);
				try {
					const errorData = JSON.parse(errorText);
					alert(`Erreur: ${errorData.message || errorData.error || 'Erreur inconnue'}`);
				} catch {
					alert(`Erreur serveur: ${errorText}`);
				}
			}

		} catch (error) {
			console.error('Error requesting audition:', error);
			alert('Erreur réseau, veuillez réessayer');
		} finally {
			isRequestingAudition = false;
		}
	}

	// Fonctions pour le refus...
	function openRefusalModal() {
		showRefusalModal = true;
		refusalMessage = '';

		setTimeout(() => {
			initializeQuill();
		}, 100);
	}

	function closeRefusalModal() {
		showRefusalModal = false;
		refusalMessage = '';
		isRefusing = false;

		if (quill) {
			quill.setText('');
		}
	}

	async function refuseParticipant() {
		if (!currentParticipant) return;

		isRefusing = true;

		try {
			let finalMessage = '';
			if (quill) {
				const text = quill.getText().trim();
				finalMessage = text ? quill.root.innerHTML : '';
			}

			const emailResponse = await fetch(`/api/mailing/sendRefusalEmailToParticipant`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					projectId: data.id,
					participantId: currentParticipant.id,
					customMessage: finalMessage || null
				})
			});

			if (!emailResponse.ok) {
				const errorData = await emailResponse.json();
				alert(`Erreur envoi email: ${errorData.message || 'Erreur inconnue'}`);
				return;
			}

			const deleteResponse = await fetch(
				`/api/projects/${data.id}/management/participants/${currentParticipant.id}`,
				{
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);

			if (deleteResponse.ok) {
				participants = participants.filter(
					(participant) => participant.id !== currentParticipant!.id
				);
				currentParticipant = null;
				closeRefusalModal();
				showNotification('Email de refus envoyé et participant supprimé avec succès', 'success');

				// Recharger les stats
				await loadAuditionStats();
			} else {
				alert('Email envoyé mais erreur lors de la suppression du participant');
			}

		} catch (error) {
			console.error('Error during refusal:', error);
			alert('Erreur réseau, veuillez réessayer');
		} finally {
			isRefusing = false;
		}
	}

	// Fonction pour obtenir le badge de statut d'audition
	function getAuditionStatusBadge(auditionStatus: string) {
		switch (auditionStatus) {
			case 'pending':
				return { text: 'Audition en cours', class: 'bg-yellow-100 text-yellow-800' };
			case 'completed':
				return { text: 'Audition terminée', class: 'bg-blue-100 text-blue-800' };
			default:
				return null;
		}
	}

	// Nouvelles fonctions pour aller aux pages spécialisées
	function goToAuditions() {
		goto(`/projects/${data.id}/management/auditions`);
	}

	function goToPdfManagement() {
		goto(`/projects/${data.id}/management/auditions/pdfs`);
	}

	// Fonction pour les notifications
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

	// Fonction pour obtenir le nombre de PDFs configurés
	function getPdfCount(sectionId: number): number {
		// Cette fonction pourrait être améliorée en chargeant les PDFs réels
		// Pour l'instant, on retourne 0 car on n'a pas ces données ici
		return 0;
	}

	// Auto-refresh des participants toutes les 30 secondes
	let participantRefreshInterval: any = null;

	onMount(() => {
		participantRefreshInterval = setInterval(async () => {
			await loadParticipants();
		}, 30000);

		return () => {
			if (participantRefreshInterval) {
				clearInterval(participantRefreshInterval);
			}
		};
	});
</script>

<svelte:head>
	<title>Validation des candidatures - Projet {data.id}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header amélioré -->
	<div class="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
		<div class="flex justify-between items-center">
			<div>
				<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Validation des candidatures</h1>
				<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
					Gérez les candidatures, demandez des auditions et suivez les soumissions
				</p>
			</div>
			<div class="flex gap-3">
				<!-- Statistiques rapides auditions -->
				{#if auditionStats.total > 0}
					<div class="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
						<div class="flex items-center space-x-2 text-sm">
							<span class="font-medium text-purple-900">🎭 Auditions:</span>
							<span class="text-purple-700">{auditionStats.submitted} soumises</span>
							<span class="text-purple-600">{auditionStats.pending} en cours</span>
						</div>
					</div>
				{/if}

				<button
					on:click={goToPdfManagement}
					class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
				>
					📚 Gérer PDFs par section
				</button>

				<button
					on:click={goToAuditions}
					class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
				>
					🎭 Voir les auditions
					{#if auditionStats.submitted > 0}
						<span class="ml-1 px-2 py-1 bg-purple-800 text-xs rounded-full">
							{auditionStats.submitted}
						</span>
					{/if}
				</button>

				<button
					on:click={() => goto(`/projects/${data.id}/management`)}
					class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
				>
					← Retour au projet
				</button>
			</div>
		</div>
	</div>

	<div class="p-6">
		<!-- Alerte pour les auditions en cours -->
		{#if auditionStats.submitted > 0}
			<div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<span class="text-2xl mr-3">🎉</span>
						<div>
							<h3 class="font-bold text-green-900">
								{auditionStats.submitted} audition{auditionStats.submitted > 1 ? 's ont été soumises' : ' a été soumise'} !
							</h3>
							<p class="text-sm text-green-700">
								Vous pouvez maintenant les évaluer et prendre des décisions.
							</p>
						</div>
					</div>
					<button
						on:click={goToAuditions}
						class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
					>
						Évaluer maintenant
					</button>
				</div>
			</div>
		{/if}

		<!-- Alerte pour configurer les PDFs -->
		{#if auditionStats.total > 0 && auditionStats.totalPdfs === 0}
			<div class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<span class="text-2xl mr-3">📚</span>
						<div>
							<h3 class="font-bold text-yellow-900">Aucun PDF configuré pour les auditions</h3>
							<p class="text-sm text-yellow-700">
								Ajoutez des partitions et exercices pour que les candidats sachent quoi jouer.
							</p>
						</div>
					</div>
					<button
						on:click={goToPdfManagement}
						class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
					>
						Configurer PDFs
					</button>
				</div>
			</div>
		{/if}

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Liste des participants -->
			<div class="bg-white rounded-lg shadow border border-gray-200">
				<div class="px-6 py-4 border-b border-gray-200">
					<div class="flex justify-between items-center">
						<h2 class="text-xl font-semibold text-gray-900">
							Candidatures en attente
							{#if participants && participants.length > 0}
								<span class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
									{participants.length}
								</span>
							{/if}
						</h2>
						<button
							on:click={loadParticipants}
							class="text-blue-600 hover:text-blue-800 p-1"
							title="Actualiser"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
							</svg>
						</button>
					</div>
				</div>

				{#if participants && participants.length > 0}
					<div class="divide-y divide-gray-200 max-h-96 overflow-y-auto">
						{#each participants as participant}
							<div
								class="p-4 hover:bg-gray-50 cursor-pointer transition-colors {currentParticipant?.id === participant.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}"
								on:click={() => (currentParticipant = participant)}
							>
								<div class="flex justify-between items-start">
									<div class="flex-1">
										<h3 class="font-medium text-gray-900">
											{participant.contact.firstName} {participant.contact.lastName}
										</h3>
										<p class="text-sm text-gray-600">{participant.contact.email}</p>
										<p class="text-sm text-blue-600 font-medium">{participant.section.name}</p>

										<!-- Statut d'audition -->
										{#if participant.audition_status && participant.audition_status !== 'none'}
											{@const badge = getAuditionStatusBadge(participant.audition_status)}
											{#if badge}
												<span class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full {badge.class} mt-1">
													{badge.text}
												</span>
											{/if}
											{#if participant.audition_deadline}
												<p class="text-xs text-gray-500 mt-1">
													Échéance: {new Date(participant.audition_deadline).toLocaleDateString('fr-FR')}
												</p>
											{/if}
										{/if}
									</div>
									<div class="flex items-center space-x-2">
										{#if participant.audition_status === 'completed'}
											<span class="text-green-500" title="Audition terminée">
												<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
												</svg>
											</span>
										{:else if participant.audition_status === 'pending'}
											<span class="text-yellow-500" title="Audition en cours">
												<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
												</svg>
											</span>
										{/if}
										<button
											class="text-blue-500 hover:text-blue-700 p-1"
											on:click|stopPropagation={() => (currentParticipant = participant)}
											title="Voir les détails"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
											</svg>
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-12">
						<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						<h3 class="mt-2 text-sm font-medium text-gray-900">Aucune candidature en attente</h3>
						<p class="mt-1 text-sm text-gray-500">Toutes les candidatures ont été traitées.</p>
					</div>
				{/if}
			</div>

			<!-- Détails du participant sélectionné -->
			<div class="bg-white rounded-lg shadow border border-gray-200">
				{#if currentParticipant}
					<div class="px-6 py-4 border-b border-gray-200">
						<h2 class="text-xl font-semibold text-gray-900">
							Candidature de {currentParticipant.contact.firstName} {currentParticipant.contact.lastName}
						</h2>
					</div>

					<div class="p-6 space-y-6">
						<!-- Overlay si contact non validé -->
						{#if !currentParticipant.contact.validated}
							<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
								<div class="flex items-center">
									<svg class="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
									</svg>
									<div>
										<h3 class="text-red-800 font-medium">Contact non validé</h3>
										<p class="text-red-700 text-sm">
											Vous devez d'abord valider cette personne dans la page de validation des contacts.
										</p>
										<a href="/contacts/validation" class="text-red-600 hover:text-red-800 text-sm font-medium underline">
											→ Aller à la validation des contacts
										</a>
									</div>
								</div>
							</div>
						{/if}

						<!-- Statut d'audition actuel -->
						{#if currentParticipant.audition_status && currentParticipant.audition_status !== 'none'}
							{@const badge = getAuditionStatusBadge(currentParticipant.audition_status)}
							{#if badge}
								<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
									<div class="flex items-center justify-between">
										<div class="flex items-center">
											<span class="px-3 py-1 text-sm font-semibold rounded-full {badge.class}">
												{badge.text}
											</span>
											{#if currentParticipant.audition_deadline}
												<span class="ml-3 text-sm text-gray-600">
													Échéance: {new Date(currentParticipant.audition_deadline).toLocaleDateString('fr-FR', {
													year: 'numeric',
													month: 'long',
													day: 'numeric',
													hour: '2-digit',
													minute: '2-digit'
												})}
												</span>
											{/if}
										</div>
										<button
											on:click={goToAuditions}
											class="text-blue-600 hover:text-blue-800 text-sm font-medium"
										>
											Voir l'audition →
										</button>
									</div>
									{#if currentParticipant.audition_status === 'completed'}
										<p class="text-sm text-green-600 mt-2 font-medium">
											✅ L'audition a été soumise ! Vous pouvez maintenant l'évaluer.
										</p>
									{:else if currentParticipant.audition_status === 'pending'}
										<p class="text-sm text-yellow-600 mt-2">
											⏳ L'audition est en cours. Le candidat peut télécharger les PDFs de sa section et uploader ses enregistrements.
										</p>
									{/if}
								</div>
							{/if}
						{/if}

						<!-- Informations de contact -->
						<div>
							<h3 class="text-lg font-medium text-gray-900 mb-3">Informations de contact</h3>
							<div class="bg-gray-50 rounded-lg p-4 space-y-2">
								<div class="grid grid-cols-2 gap-4">
									<div>
										<span class="text-sm font-medium text-gray-700">Nom complet:</span>
										<p class="text-gray-900">{currentParticipant.contact.firstName} {currentParticipant.contact.lastName}</p>
									</div>
									<div>
										<span class="text-sm font-medium text-gray-700">Email:</span>
										<a href="mailto:{currentParticipant.contact.email}" class="text-blue-600 hover:text-blue-800">
											{currentParticipant.contact.email}
										</a>
									</div>
									<div>
										<span class="text-sm font-medium text-gray-700">Téléphone:</span>
										<p class="text-gray-900">{currentParticipant.contact.phone || 'Non renseigné'}</p>
									</div>
									<div>
										<span class="text-sm font-medium text-gray-700">Messenger:</span>
										<p class="text-gray-900">{currentParticipant.contact.messenger || 'Non renseigné'}</p>
									</div>
								</div>
								{#if currentParticipant.contact.comments}
									<div>
										<span class="text-sm font-medium text-gray-700">Commentaires:</span>
										<p class="text-gray-900 mt-1">{currentParticipant.contact.comments}</p>
									</div>
								{/if}
							</div>
						</div>

						<!-- Section et formulaire -->
						<div>
							<h3 class="text-lg font-medium text-gray-900 mb-3">Candidature</h3>
							<div class="bg-gray-50 rounded-lg p-4 space-y-4">
								<div>
									<span class="text-sm font-medium text-gray-700">Section demandée:</span>
									<p class="text-gray-900 font-medium">{currentParticipant.section.name}</p>
								</div>

								{#if currentParticipant.answers.length > 0}
									<div>
										<span class="text-sm font-medium text-gray-700">Réponses au formulaire:</span>
										<div class="mt-2 space-y-2">
											{#each currentParticipant.answers as answer}
												{#if answer.form}
													<RegistrationForm forms={[]} bind:answer disabled />
												{/if}
											{/each}
										</div>
									</div>
								{/if}

								<!-- Disponibilités concerts -->
								<div>
									<h4 class="text-sm font-medium text-gray-700 mb-2">Disponibilités - Concerts</h4>
									<AttendancePicker
										concertsOrRehearsals={allConcerts}
										type="concert"
										participants={[currentParticipant]}
										disabled
									/>
								</div>

								<!-- Disponibilités répétitions -->
								<div>
									<h4 class="text-sm font-medium text-gray-700 mb-2">Disponibilités - Répétitions</h4>
									<AttendancePicker
										concertsOrRehearsals={allRehearsals}
										type="rehearsal"
										participants={[currentParticipant]}
										disabled
									/>
								</div>
							</div>
						</div>

						<!-- Actions -->
						<div class="border-t border-gray-200 pt-6">
							<div class="flex flex-wrap gap-3">
								<!-- Validation -->
								<button
									class="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
									on:click={validateParticipant}
									disabled={!currentParticipant.contact.validated}
								>
									✅ Valider et envoyer confirmation
								</button>

								<!-- Audition -->
								{#if !currentParticipant.audition_status || currentParticipant.audition_status === 'none'}
									<button
										class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
										on:click={openAuditionModal}
										disabled={!currentParticipant.contact.validated}
									>
										🎭 Demander une audition
									</button>
								{:else}
									<button
										class="flex-1 bg-gray-400 text-white font-medium py-3 px-4 rounded-lg cursor-not-allowed"
										disabled
										title="Audition déjà demandée"
									>
										🎭 Audition {currentParticipant.audition_status === 'pending' ? 'en cours' : 'terminée'}
									</button>
								{/if}

								<!-- Refus -->
								<button
									class="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
									on:click={openRefusalModal}
								>
									❌ Refuser
								</button>
							</div>

							{#if !currentParticipant.contact.validated}
								<p class="text-sm text-red-600 mt-2 text-center">
									⚠️ Le contact doit être validé avant toute action
								</p>
							{/if}
						</div>
					</div>
				{:else}
					<div class="p-12 text-center">
						<svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
						</svg>
						<h3 class="text-lg font-medium text-gray-900">Aucune candidature sélectionnée</h3>
						<p class="text-gray-600 mt-1">Cliquez sur une candidature dans la liste pour voir ses détails</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Modal d'audition -->
{#if showAuditionModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-xl font-bold text-gray-900">
					🎭 Demander une audition
				</h2>
				<p class="text-gray-700 mt-1">
					Vous allez demander une audition à <strong>{currentParticipant?.contact.firstName} {currentParticipant?.contact.lastName}</strong>
					(section: <strong>{currentParticipant?.section.name}</strong>).
				</p>
			</div>

			<div class="px-6 py-4 space-y-6">
				<!-- Informations importantes -->
				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<div class="flex items-center">
						<svg class="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
						</svg>
						<div class="text-sm text-blue-700">
							<p class="font-medium">📚 PDFs automatiques</p>
							<p>Le candidat recevra automatiquement tous les PDFs configurés pour sa section. Il pourra les télécharger depuis son portail d'audition.</p>
						</div>
					</div>
				</div>

				<!-- Instructions pour le candidat -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						Instructions personnalisées pour le candidat
					</label>
					<div
						bind:this={quillAuditionContainer}
						class="bg-white border border-gray-300 rounded-lg min-h-[200px] {isRequestingAudition ? 'opacity-50 pointer-events-none' : ''}"
						style="font-family: inherit;"
					></div>
					{#if !quillLoaded}
						<div class="text-sm text-gray-500 mt-2">Chargement de l'éditeur...</div>
					{/if}
					<p class="text-xs text-gray-500 mt-2">
						Décrivez les instructions spécifiques, le style demandé, les détails techniques, etc.
					</p>
				</div>

				<!-- Fichiers/matériels requis -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						Matériels/fichiers spécifiques requis (optionnel)
					</label>
					{#each auditionRequiredFiles as file, index}
						<div class="flex mb-2">
							<input
								type="text"
								bind:value={auditionRequiredFiles[index]}
								placeholder="ex: Enregistrement de la pièce X, improvisation de 2 minutes, etc."
								class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								disabled={isRequestingAudition}
							/>
							<button
								type="button"
								on:click={() => removeRequiredFile(index)}
								class="px-3 py-2 bg-red-500 text-white rounded-r-md hover:bg-red-600 disabled:opacity-50"
								disabled={auditionRequiredFiles.length === 1 || isRequestingAudition}
							>
								Supprimer
							</button>
						</div>
					{/each}
					<button
						type="button"
						on:click={addRequiredFile}
						class="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
						disabled={isRequestingAudition}
					>
						Ajouter un fichier requis
					</button>
				</div>

				<!-- Date limite avec auto-calcul -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						Date limite (optionnel)
					</label>

					<!-- Info sur la deadline automatique -->
					<div class="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
						<div class="flex items-center">
							<svg class="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
							</svg>
							<div class="text-sm text-blue-700">
								<p class="font-medium">📅 Deadline automatique</p>
								<p>Si vous ne définissez pas de date limite, elle sera automatiquement fixée à <strong>1 jour avant la première répétition</strong> du projet.</p>
							</div>
						</div>
					</div>

					<input
						type="datetime-local"
						bind:value={auditionDeadline}
						class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						disabled={isRequestingAudition}
						placeholder="Laissez vide pour utiliser la deadline automatique"
					/>

					<!-- Aide contextuelle -->
					<div class="text-xs text-gray-500 mt-1">
						{#if auditionDeadline}
							<span class="text-green-600">✅ Date limite personnalisée définie</span>
						{:else}
							<span class="text-blue-600">🤖 Deadline automatique : 1 jour avant la première répétition</span>
						{/if}
					</div>
				</div>

				<!-- Avertissement sur les types de fichiers -->
				<div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
					<div class="flex items-center">
						<svg class="h-5 w-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
						</svg>
						<div class="text-sm text-yellow-700">
							<p class="font-medium">🎬 🎵 Types de fichiers acceptés</p>
							<p>Le candidat ne pourra uploader que des fichiers <strong>audio</strong> (MP3, WAV, etc.) ou <strong>vidéo</strong> (MP4, AVI, MOV, etc.).</p>
						</div>
					</div>
				</div>
			</div>

			<div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
				<button
					class="px-4 py-2 text-gray-500 hover:text-gray-700"
					on:click={closeAuditionModal}
					disabled={isRequestingAudition}
				>
					Annuler
				</button>
				<button
					class="px-4 py-2 bg-purple-500 hover:bg-purple-700 text-white font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed"
					on:click={requestAudition}
					disabled={isRequestingAudition}
				>
					{isRequestingAudition ? 'Envoi...' : 'Envoyer la demande d\'audition'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Modal de refus -->
{#if showRefusalModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-xl font-bold text-gray-900">
					Refuser la participation
				</h2>
			</div>

			<div class="px-6 py-4 space-y-4">
				<p class="text-gray-700">
					Vous allez refuser la participation de <strong>{currentParticipant?.contact.firstName} {currentParticipant?.contact.lastName}</strong>.
				</p>
				<p class="text-sm text-gray-600">
					Un email de refus sera automatiquement envoyé au participant. Vous pouvez ajouter un message personnalisé ci-dessous (optionnel).
				</p>

				<div>
					<label for="refusal-message" class="block text-sm font-medium text-gray-700 mb-2">
						Message personnalisé (optionnel)
					</label>
					<div
						bind:this={quillContainer}
						class="bg-white border border-gray-300 rounded-lg min-h-[200px] {isRefusing ? 'opacity-50 pointer-events-none' : ''}"
						style="font-family: inherit;"
					></div>
					{#if !quillLoaded}
						<div class="text-sm text-gray-500 mt-2">Chargement de l'éditeur...</div>
					{/if}
				</div>
			</div>

			<div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
				<button
					class="px-4 py-2 text-gray-500 hover:text-gray-700"
					on:click={closeRefusalModal}
					disabled={isRefusing}
				>
					Annuler
				</button>
				<button
					class="px-4 py-2 bg-red-500 hover:bg-red-700 text-white font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed"
					on:click={refuseParticipant}
					disabled={isRefusing}
				>
					{isRefusing ? 'Envoi...' : 'Refuser et envoyer email'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
    /* Styles pour Quill Editor */
    :global(.ql-toolbar) {
        border-color: #d1d5db !important;
        background-color: #f9fafb !important;
    }

    :global(.ql-container) {
        border-color: #d1d5db !important;
        background-color: #ffffff !important;
    }

    /* Styles pour Quill Editor en mode sombre */
    :global(.dark .ql-toolbar) {
        border-color: #374151 !important;
        background-color: #1f2937 !important;
    }

    :global(.dark .ql-container) {
        border-color: #374151 !important;
        background-color: #1f2937 !important;
        color: #f9fafb !important;
    }

    :global(.dark .ql-editor) {
        color: #f9fafb !important;
    }

    :global(.dark .ql-toolbar .ql-stroke) {
        stroke: #9ca3af !important;
    }

    :global(.dark .ql-toolbar .ql-fill) {
        fill: #9ca3af !important;
    }

    :global(.dark .ql-toolbar button:hover .ql-stroke) {
        stroke: #f3f4f6 !important;
    }

    :global(.dark .ql-toolbar button:hover .ql-fill) {
        fill: #f3f4f6 !important;
    }

    :global(.dark .ql-picker-label) {
        color: #9ca3af !important;
    }

    :global(.dark .ql-picker-options) {
        background-color: #1f2937 !important;
        border-color: #374151 !important;
    }

    :global(.dark .ql-picker-item) {
        color: #f9fafb !important;
    }

    :global(.dark .ql-picker-item:hover) {
        background-color: #374151 !important;
    }

    /* Transitions et animations */
    .transition-colors {
        transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
    }

    /* Responsive improvements */
    @media (max-width: 1024px) {
        .grid.lg\\:grid-cols-2 {
            grid-template-columns: 1fr;
        }
    }
</style>