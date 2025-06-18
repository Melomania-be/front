<!-- src/routes/projects/[id]/management/validation/+page.svelte - Version améliorée -->
<script lang="ts">
	import AttendancePicker from '$lib/components/participant/AttendancePicker.svelte';
	import RegistrationForm from '$lib/components/registration/RegistrationForm.svelte';
	import type { Participant } from '$lib/types/Participant.js';
	import type { Concert } from '$lib/types/Concert.js';
	import type { Rehearsal } from '$lib/types/Rehearsal.js';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation'; // Ajout pour navigation

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

	// Variables for Quill
	let quillContainer: HTMLElement;
	let quillAuditionContainer: HTMLElement;
	let quill: any;
	let quillAudition: any;
	let quillLoaded = false;

	// Variables to store ALL project dates
	let allConcerts: Concert[] = [];
	let allRehearsals: Rehearsal[] = [];

	onMount(async () => {
		await loadParticipants();
		await loadProjectData();
		await loadQuill();
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

	onDestroy(() => {
		if (quill) {
			quill = null;
		}
		if (quillAudition) {
			quillAudition = null;
		}
	});

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

				// Mettre à jour le participant actuel
				if (currentParticipant) {
					const updatedParticipant = participants.find(p => p.id === currentParticipant!.id);
					if (updatedParticipant) {
						currentParticipant = updatedParticipant;
					}
				}

				closeAuditionModal();
				alert('Demande d\'audition envoyée avec succès');
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
				alert('Email de refus envoyé et participant supprimé avec succès');
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

	// Nouvelle fonction pour aller à la page des auditions
	function goToAuditions() {
		goto(`/projects/${data.id}/management/auditions`);
	}
</script>

<div class="m-4 p-4 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
	<!-- En-tête avec boutons de navigation -->
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Validation des candidatures</h1>
		<div class="flex gap-3">
			<button
				on:click={goToAuditions}
				class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
			>
				📋 Voir les auditions
			</button>
			<button
				on:click={() => goto(`/projects/${data.id}/management`)}
				class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
			>
				Retour au projet
			</button>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		{#if participants && participants.length > 0}
			<div>
				<h2 class="text-2xl mb-4">Vous devez valider l'inscription de {participants.length} personne(s) :</h2>
				<div class="overflow-x-auto">
					<table class="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
						<thead class="bg-gray-50 dark:bg-gray-700">
						<tr>
							<th class="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b">Prénom</th>
							<th class="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b">Nom</th>
							<th class="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b">Section</th>
							<th class="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b">Statut</th>
							<th class="py-3 px-4 border-b"></th>
						</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
						{#each participants as participant}
							<tr class="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
								<td class="py-3 px-4 border-b" on:click={() => (currentParticipant = participant)}>
									{participant.contact.firstName}
								</td>
								<td class="py-3 px-4 border-b" on:click={() => (currentParticipant = participant)}>
									{participant.contact.lastName}
								</td>
								<td class="py-3 px-4 border-b" on:click={() => (currentParticipant = participant)}>
									{participant.section.name}
								</td>
								<td class="py-3 px-4 border-b" on:click={() => (currentParticipant = participant)}>
									{#if participant.audition_status && participant.audition_status !== 'none'}
										{@const badge = getAuditionStatusBadge(participant.audition_status)}
										{#if badge}
                                            <span class="px-2 py-1 text-xs font-semibold rounded-full {badge.class}">
                                                {badge.text}
                                            </span>
										{/if}
									{:else}
                                        <span class="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200">
                                            En attente
                                        </span>
									{/if}
								</td>
								<td class="py-3 px-4 border-b text-right">
									<button
										class="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50"
										on:click={() => (currentParticipant = participant)}
										title="Voir les détails"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
										</svg>
									</button>
								</td>
							</tr>
						{/each}
						</tbody>
					</table>
				</div>
			</div>
		{:else}
			<div class="text-center py-12">
				<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
				<h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucun participant à valider</h3>
				<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Toutes les candidatures ont été traitées.</p>
			</div>
		{/if}

		{#if currentParticipant}
			<div class="relative border p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
				<div class={currentParticipant.contact.validated ? '' : 'opacity-50 pointer-events-none'}>
					<h2 class="text-2xl text-center mb-4 text-gray-900 dark:text-white">Demande de participation :</h2>

					<!-- Affichage du statut d'audition -->
					{#if currentParticipant.audition_status && currentParticipant.audition_status !== 'none'}
						{@const badge = getAuditionStatusBadge(currentParticipant.audition_status)}
						{#if badge}
							<div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
								<div class="flex items-center justify-between">
                                    <span class="px-2 py-1 text-sm font-semibold rounded-full {badge.class}">
                                        {badge.text}
                                    </span>
									<button
										on:click={goToAuditions}
										class="text-blue-600 hover:text-blue-800 text-sm font-medium"
									>
										Voir les auditions →
									</button>
								</div>
								{#if currentParticipant.audition_deadline}
									<p class="text-sm text-gray-600 dark:text-gray-300 mt-2">
										Échéance : {new Date(currentParticipant.audition_deadline).toLocaleDateString('fr-FR')}
									</p>
								{/if}
							</div>
						{/if}
					{/if}

					<!-- Informations de contact -->
					<div class="mb-6">
						<h3 class="text-xl mb-3 text-gray-900 dark:text-white">Contact :</h3>
						<div class="border p-4 rounded-lg bg-white dark:bg-gray-800 space-y-2">
							<div class="flex">
								<span class="font-semibold text-gray-700 dark:text-gray-300 w-20">Nom :</span>
								<span class="text-gray-900 dark:text-white">{currentParticipant.contact.firstName} {currentParticipant.contact.lastName}</span>
							</div>
							<div class="flex">
								<span class="font-semibold text-gray-700 dark:text-gray-300 w-20">Email :</span>
								<a href="mailto:{currentParticipant.contact.email}" class="text-blue-500 hover:text-blue-700">{currentParticipant.contact.email}</a>
							</div>
							<div class="flex">
								<span class="font-semibold text-gray-700 dark:text-gray-300 w-20">Téléphone :</span>
								<span class="text-gray-900 dark:text-white">{currentParticipant.contact.phone || 'Non renseigné'}</span>
							</div>
							<div class="flex">
								<span class="font-semibold text-gray-700 dark:text-gray-300 w-20">Messenger :</span>
								<span class="text-gray-900 dark:text-white">{currentParticipant.contact.messenger || 'Non renseigné'}</span>
							</div>
							{#if currentParticipant.contact.comments}
								<div class="flex">
									<span class="font-semibold text-gray-700 dark:text-gray-300 w-20">Commentaires :</span>
									<span class="text-gray-900 dark:text-white">{currentParticipant.contact.comments}</span>
								</div>
							{/if}
						</div>
					</div>

					<!-- Formulaire d'inscription -->
					<div class="mb-6">
						<h3 class="text-xl mb-3 text-gray-900 dark:text-white">Formulaire d'inscription :</h3>
						<div class="border p-4 rounded-lg bg-white dark:bg-gray-800 space-y-4">
							<div>
								<span class="font-semibold text-gray-700 dark:text-gray-300">Section :</span>
								<span class="text-gray-900 dark:text-white">{currentParticipant.section.name}</span>
							</div>

							{#if currentParticipant.answers.length > 0}
								<div>
									<span class="font-semibold text-gray-700 dark:text-gray-300">Réponses au formulaire :</span>
									<div class="mt-2 space-y-2">
										{#each currentParticipant.answers as answer}
											{#if answer.form}
												<RegistrationForm forms={[]} bind:answer disabled />
											{/if}
										{/each}
									</div>
								</div>
							{/if}

							<div>
								<h4 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Concerts</h4>
								<AttendancePicker
									concertsOrRehearsals={allConcerts}
									type="concert"
									participants={[currentParticipant]}
									disabled
								/>
							</div>

							<div>
								<h4 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Répétitions</h4>
								<AttendancePicker
									concertsOrRehearsals={allRehearsals}
									type="rehearsal"
									participants={[currentParticipant]}
									disabled
								/>
							</div>
						</div>
					</div>

					<!-- Boutons d'action -->
					<div class="flex flex-wrap gap-3 justify-center">
						<button
							class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
							on:click={validateParticipant}
						>
							✅ Valider et envoyer confirmation
						</button>

						<!-- Bouton d'audition -->
						{#if !currentParticipant.audition_status || currentParticipant.audition_status === 'none'}
							<button
								class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
								on:click={openAuditionModal}
							>
								🎭 Demander une audition
							</button>
						{:else}
							<button
								class="bg-gray-400 text-white font-bold py-2 px-4 rounded-lg cursor-not-allowed"
								disabled
								title="Audition déjà demandée"
							>
								🎭 Audition {currentParticipant.audition_status === 'pending' ? 'en cours' : 'terminée'}
							</button>
						{/if}

						<button
							class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
							on:click={openRefusalModal}
						>
							❌ Refuser et supprimer
						</button>
					</div>
				</div>

				<!-- Overlay si contact non validé -->
				{#if !currentParticipant.contact.validated}
					<div class="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-95 p-4 rounded-lg flex items-center justify-center">
						<div class="text-center">
							<h3 class="text-xl mb-2 text-gray-900 dark:text-white">Vous devez d'abord valider cette personne !</h3>
							<a href="/contacts/validation" class="text-blue-500 hover:text-blue-700 font-medium">
								→ Page de validation des contacts
							</a>
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<div class="border p-8 rounded-lg bg-gray-50 dark:bg-gray-900 text-center">
				<svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
				</svg>
				<h3 class="text-xl text-gray-900 dark:text-white">Aucun participant sélectionné</h3>
				<p class="text-gray-600 dark:text-gray-400 mt-2">Cliquez sur un participant dans la liste pour voir ses détails</p>
			</div>
		{/if}
	</div>
</div>

<!-- Modal d'audition -->
{#if showAuditionModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
			<h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">
				🎭 Demander une audition
			</h2>
			<p class="mb-4 text-gray-700 dark:text-gray-300">
				Vous allez demander une audition à <strong>{currentParticipant?.contact.firstName} {currentParticipant?.contact.lastName}</strong>.
			</p>

			<div class="mb-6">
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Instructions pour le candidat
				</label>
				<div
					bind:this={quillAuditionContainer}
					class="bg-white border border-gray-300 rounded-lg min-h-[200px] {isRequestingAudition ? 'opacity-50 pointer-events-none' : ''}"
					style="font-family: inherit;"
				></div>
				{#if !quillLoaded}
					<div class="text-sm text-gray-500 mt-2">Chargement de l'éditeur...</div>
				{/if}
			</div>

			<div class="mb-6">
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Fichiers/matériels requis
				</label>
				{#each auditionRequiredFiles as file, index}
					<div class="flex mb-2">
						<input
							type="text"
							bind:value={auditionRequiredFiles[index]}
							placeholder="ex: Vidéo d'interprétation de la pièce X, enregistrement audio, etc."
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

			<!-- ✅ SECTION MODIFIÉE : Date limite avec auto-calcul -->
			<div class="mb-6">
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Date limite (optionnel)
				</label>

				<!-- ✅ NOUVEAU : Info sur la deadline automatique -->
				<div class="mb-3 p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
					<div class="flex items-center">
						<svg class="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
						</svg>
						<div class="text-sm text-blue-700 dark:text-blue-300">
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

				<!-- ✅ NOUVEAU : Aide contextuelle -->
				<div class="text-xs text-gray-500 mt-1">
					{#if auditionDeadline}
						<span class="text-green-600">✅ Date limite personnalisée définie</span>
					{:else}
						<span class="text-blue-600">🤖 Deadline automatique : 1 jour avant la première répétition</span>
					{/if}
				</div>
			</div>

			<!-- ✅ NOUVEAU : Avertissement sur les types de fichiers -->
			<div class="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
				<div class="flex items-center">
					<svg class="h-5 w-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
					</svg>
					<div class="text-sm text-yellow-700 dark:text-yellow-300">
						<p class="font-medium">🎬 🎵 Types de fichiers acceptés</p>
						<p>Le candidat ne pourra uploader que des fichiers <strong>audio</strong> (MP3, WAV, etc.) ou <strong>vidéo</strong> (MP4, AVI, MOV, etc.).</p>
					</div>
				</div>
			</div>

			<div class="flex justify-end space-x-3">
				<button
					class="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
			<h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">
				Refuser la participation
			</h2>
			<p class="mb-4 text-gray-700 dark:text-gray-300">
				Vous allez refuser la participation de <strong>{currentParticipant?.contact.firstName} {currentParticipant?.contact.lastName}</strong>.
			</p>
			<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
				Un email de refus sera automatiquement envoyé au participant. Vous pouvez ajouter un message personnalisé ci-dessous (optionnel).
			</p>

			<div class="mb-6">
				<label for="refusal-message" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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

			<div class="flex justify-end space-x-3">
				<button
					class="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
</style>