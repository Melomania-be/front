<script lang="ts">
    import AttendancePicker from '$lib/components/participant/AttendancePicker.svelte';
    import RegistrationForm from '$lib/components/registration/RegistrationForm.svelte';
    import type { Participant } from '$lib/types/Participant.js';
    import type { Concert } from '$lib/types/Concert.js';
    import type { Rehearsal } from '$lib/types/Rehearsal.js';
    import { onMount, onDestroy } from 'svelte';

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
        const responseParticipants = await fetch(`/api/projects/${data.id}/management/validation`);

        if (responseParticipants.ok) {
            participants = await responseParticipants.json();
        }

        // Fetch ALL project dates
        const responseAttendance = await fetch(`/api/projects/${data.id}/management/attendance`);
        if (responseAttendance.ok) {
            const attendanceData = await responseAttendance.json();
            allConcerts = attendanceData.concerts;
            allRehearsals = attendanceData.rehearsals;
        }

        // Load Quill dynamically
        await loadQuill();
    });

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
                placeholder: 'You can explain the reasons for refusal here...',
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
                placeholder: 'Describe what the candidate should prepare for the audition...',
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
        const response = await fetch(
          `/api/projects/${data.id}/management/participants/${currentParticipant!.id}`,
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
        }
    }

    async function validateParticipant() {
        const responseEmail = await fetch(`/api/mailing/sendParticipationValidationNotifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ projectId: data.id, contactId: currentParticipant!.contact.id })
        });

        if (!responseEmail.ok) {
            console.error('Failed to send email');
        }

        const response = await fetch(`/api/projects/${data.id}/management/validation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: currentParticipant!.id })
        });

        if (response.ok) {
            participants = participants.filter(
              (participant) => participant.id !== currentParticipant!.id
            );
            currentParticipant = null;
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

            const filteredRequiredFiles = auditionRequiredFiles.filter(file => file.trim() !== '');

            const auditionData = {
                instructions: finalInstructions,
                required_files: filteredRequiredFiles,
                deadline: auditionDeadline ? new Date(auditionDeadline) : null
            };

            const response = await fetch(
              `/api/projects/${data.id}/management/participants/${currentParticipant.id}/request-audition`,
              {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(auditionData)
              }
            );

            if (response.ok) {
                // Mettre à jour le statut du participant localement
                const participantIndex = participants.findIndex(p => p.id === currentParticipant!.id);
                if (participantIndex !== -1) {
                    participants[participantIndex].audition_status = 'pending';
                    participants = [...participants]; // Trigger reactivity
                }

                closeAuditionModal();
                alert('Demande d\'audition envoyée avec succès');
            } else {
                const errorData = await response.json();
                alert(`Erreur: ${errorData.error || 'Erreur inconnue'}`);
            }

        } catch (error) {
            console.error('Error requesting audition:', error);
            alert('Erreur réseau, veuillez réessayer');
        } finally {
            isRequestingAudition = false;
        }
    }

    // Fonctions existantes pour le refus...
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
                alert(`Error sending email: ${errorData.message || 'Unknown error'}`);
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
                alert('Refusal email sent and participant successfully deleted');
            } else {
                alert('Email sent but error occurred while deleting participant');
            }

        } catch (error) {
            console.error('Error during refusal:', error);
            alert('Network error, please try again');
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
</script>

<div class="m-4 p-4 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#if participants && participants.length > 0}
            <div>
                <h1 class="text-2xl mb-4">You need to validate the registration of {participants.length} person(s):</h1>
                <table class="min-w-full bg-white dark:bg-gray-800">
                    <thead>
                    <tr>
                        <th class="py-2 px-4 border-b">First Name</th>
                        <th class="py-2 px-4 border-b">Last Name</th>
                        <th class="py-2 px-4 border-b">Section</th>
                        <th class="py-2 px-4 border-b">Status</th>
                        <th class="py-2 px-4 border-b"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {#each participants as participant}
                        <tr class="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                            <td class="py-2 px-4 border-b" on:click={() => (currentParticipant = participant)}>
                                {participant.contact.firstName}
                            </td>
                            <td class="py-2 px-4 border-b" on:click={() => (currentParticipant = participant)}>
                                {participant.contact.lastName}
                            </td>
                            <td class="py-2 px-4 border-b" on:click={() => (currentParticipant = participant)}>
                                {participant.section.name}
                            </td>
                            <td class="py-2 px-4 border-b" on:click={() => (currentParticipant = participant)}>
                                {#if participant.audition_status && participant.audition_status !== 'none'}
                                    {@const badge = getAuditionStatusBadge(participant.audition_status)}
                                    {#if badge}
                                        <span class="px-2 py-1 text-xs font-semibold rounded-full {badge.class}">
                                            {badge.text}
                                        </span>
                                    {/if}
                                {:else}
                                    <span class="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                        En attente
                                    </span>
                                {/if}
                            </td>
                            <td class="py-2 px-4 border-b text-right">
                                <button class="text-blue-500 hover:text-blue-700" on:click={() => (currentParticipant = participant)}>
                                    <span class="icon-[formkit--arrowright]"></span>
                                </button>
                            </td>
                        </tr>
                    {/each}
                    </tbody>
                </table>
            </div>
        {:else}
            <h1 class="text-2xl">There is no participant to validate</h1>
        {/if}

        {#if currentParticipant}
            <div class="relative border p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div class={currentParticipant.contact.validated ? '' : 'opacity-50 pointer-events-none'}>
                    <h1 class="text-2xl text-center mb-4">Participant request:</h1>

                    <!-- Affichage du statut d'audition -->
                    {#if currentParticipant.audition_status && currentParticipant.audition_status !== 'none'}
                        {@const badge = getAuditionStatusBadge(currentParticipant.audition_status)}
                        {#if badge}
                            <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <span class="px-2 py-1 text-sm font-semibold rounded-full {badge.class}">
                                    {badge.text}
                                </span>
                                {#if currentParticipant.audition_deadline}
                                    <p class="text-sm text-gray-600 mt-2">
                                        Deadline: {new Date(currentParticipant.audition_deadline).toLocaleDateString()}
                                    </p>
                                {/if}
                            </div>
                        {/if}
                    {/if}

                    <div class="mb-4">
                        <h2 class="text-xl mb-2">Contact:</h2>
                        <div class="border p-2 rounded-lg bg-white dark:bg-gray-800">
                            <div class="mb-2">
                                <span class="font-semibold">Name:</span> {currentParticipant.contact.firstName} {currentParticipant.contact.lastName}
                            </div>
                            <div class="mb-2">
                                <span class="font-semibold">Email:</span> <a href="mailto:{currentParticipant.contact.email}" class="text-blue-500">{currentParticipant.contact.email}</a>
                            </div>
                            <div class="mb-2">
                                <span class="font-semibold">Phone:</span> {currentParticipant.contact.phone}
                            </div>
                            <div class="mb-2">
                                <span class="font-semibold">Messenger:</span> {currentParticipant.contact.messenger}
                            </div>
                            <div class="mb-2">
                                <span class="font-semibold">Comments:</span> {currentParticipant.contact.comments ?? 'No comments'}
                            </div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <h2 class="text-xl mb-2">Registration form:</h2>
                        <div class="border p-2 rounded-lg bg-white dark:bg-gray-800">
                            <div class="mb-2">
                                <span class="font-semibold">Section:</span> {currentParticipant.section.name}
                            </div>
                            <div class="mb-2">
                                <span class="font-semibold">Custom form:</span>
                                {#if currentParticipant.answers.length > 0}
                                    {#each currentParticipant.answers as answer}
                                        {#if answer.form}
                                            <RegistrationForm forms={[]} bind:answer disabled />
                                        {/if}
                                    {/each}
                                {:else}
                                    <span>No custom form</span>
                                {/if}
                            </div>
                            <div class="mb-2">
                                <h3 class="text-lg">Concerts</h3>
                                <AttendancePicker
                                  concertsOrRehearsals={allConcerts}
                                  type="concert"
                                  participants={[currentParticipant]}
                                  disabled
                                />
                            </div>
                            <div class="mb-2">
                                <h3 class="text-lg">Rehearsals</h3>
                                <AttendancePicker
                                  concertsOrRehearsals={allRehearsals}
                                  type="rehearsal"
                                  participants={[currentParticipant]}
                                  disabled
                                />
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-between flex-wrap gap-2">
                        <button
                          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                          on:click={() => {
                                validateParticipant();
                            }}
                        >
                            Validate and send confirmation email
                        </button>

                        <!-- Nouveau bouton d'audition -->
                        {#if !currentParticipant.audition_status || currentParticipant.audition_status === 'none'}
                            <button
                              class="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                              on:click={openAuditionModal}
                            >
                                Request audition
                            </button>
                        {:else}
                            <button
                              class="bg-gray-400 text-white font-bold py-2 px-4 rounded cursor-not-allowed"
                              disabled
                            >
                                Audition {currentParticipant.audition_status}
                            </button>
                        {/if}

                        <button
                          class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                          on:click={openRefusalModal}
                        >
                            Refuse and delete participant
                        </button>
                    </div>
                </div>

                {#if !currentParticipant.contact.validated}
                    <div class="absolute top-0 left-0 right-0 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                        <h1 class="text-2xl mb-2">You need to validate this person first!</h1>
                        <a href="/contacts/validation" class="text-blue-500">Contact validation page</a>
                    </div>
                {/if}
            </div>
        {:else}
            <div class="border p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                <h1 class="text-2xl">No participant selected</h1>
            </div>
        {/if}
    </div>
</div>

<!-- Modal d'audition -->
{#if showAuditionModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Request Audition
            </h2>
            <p class="mb-4 text-gray-700 dark:text-gray-300">
                You are about to request an audition from <strong>{currentParticipant?.contact.firstName} {currentParticipant?.contact.lastName}</strong>.
            </p>

            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Instructions for the candidate
                </label>
                <div
                  bind:this={quillAuditionContainer}
                  class="bg-white border border-gray-300 rounded-lg min-h-[200px] {isRequestingAudition ? 'opacity-50 pointer-events-none' : ''}"
                  style="font-family: inherit;"
                ></div>
                {#if !quillLoaded}
                    <div class="text-sm text-gray-500 mt-2">Loading editor...</div>
                {/if}
            </div>

            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Required files/materials
                </label>
                {#each auditionRequiredFiles as file, index}
                    <div class="flex mb-2">
                        <input
                          type="text"
                          bind:value={auditionRequiredFiles[index]}
                          placeholder="e.g., Video performance of piece X, CV, etc."
                          class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={isRequestingAudition}
                        />
                        <button
                          type="button"
                          on:click={() => removeRequiredFile(index)}
                          class="px-3 py-2 bg-red-500 text-white rounded-r-md hover:bg-red-600 disabled:opacity-50"
                          disabled={auditionRequiredFiles.length === 1 || isRequestingAudition}
                        >
                            Remove
                        </button>
                    </div>
                {/each}
                <button
                  type="button"
                  on:click={addRequiredFile}
                  class="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  disabled={isRequestingAudition}
                >
                    Add required file
                </button>
            </div>

            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Deadline (optional)
                </label>
                <input
                  type="datetime-local"
                  bind:value={auditionDeadline}
                  class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isRequestingAudition}
                />
            </div>

            <div class="flex justify-end space-x-3">
                <button
                  class="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  on:click={closeAuditionModal}
                  disabled={isRequestingAudition}
                >
                    Cancel
                </button>
                <button
                  class="px-4 py-2 bg-purple-500 hover:bg-purple-700 text-white font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  on:click={requestAudition}
                  disabled={isRequestingAudition}
                >
                    {isRequestingAudition ? 'Sending...' : 'Send audition request'}
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Modal de refus (existant, pas de modification) -->
{#if showRefusalModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Refuse Participation
            </h2>
            <p class="mb-4 text-gray-700 dark:text-gray-300">
                You are about to refuse the participation of <strong>{currentParticipant?.contact.firstName} {currentParticipant?.contact.lastName}</strong>.
            </p>
            <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
                A refusal email will be automatically sent to the participant. You can add a custom message below (optional).
            </p>

            <div class="mb-6">
                <label for="refusal-message" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custom message (optional)
                </label>
                <div
                  bind:this={quillContainer}
                  class="bg-white border border-gray-300 rounded-lg min-h-[200px] {isRefusing ? 'opacity-50 pointer-events-none' : ''}"
                  style="font-family: inherit;"
                ></div>
                {#if !quillLoaded}
                    <div class="text-sm text-gray-500 mt-2">Loading editor...</div>
                {/if}
            </div>

            <div class="flex justify-end space-x-3">
                <button
                  class="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  on:click={closeRefusalModal}
                  disabled={isRefusing}
                >
                    Cancel
                </button>
                <button
                  class="px-4 py-2 bg-red-500 hover:bg-red-700 text-white font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  on:click={refuseParticipant}
                  disabled={isRefusing}
                >
                    {isRefusing ? 'Sending...' : 'Refuse and send email'}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
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