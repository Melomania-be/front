<script lang="ts">
    import AttendancePicker from '$lib/components/participant/AttendancePicker.svelte';
    import RegistrationForm from '$lib/components/registration/RegistrationForm.svelte';
    import type { Participant } from '$lib/types/Participant.js';
    import type { Concert } from '$lib/types/Concert.js';
    import type { Rehearsal } from '$lib/types/Rehearsal.js';
    import { onMount } from 'svelte';

    export let data;
    let participants: Array<Participant>;
    let currentParticipant: Participant | null;

    // Variables pour le modal de refus
    let showRefusalModal = false;
    let refusalMessage = '';
    let isRefusing = false;

    // Ajout des variables pour stocker TOUTES les dates du projet
    let allConcerts: Concert[] = [];
    let allRehearsals: Rehearsal[] = [];

    onMount(async () => {
        const responseParticipants = await fetch(`/api/projects/${data.id}/management/validation`);

        if (responseParticipants.ok) {
            participants = await responseParticipants.json();
        }

        // Récupérer TOUTES les dates du projet (comme dans attendance/+page.svelte)
        const responseAttendance = await fetch(`/api/projects/${data.id}/management/attendance`);
        if (responseAttendance.ok) {
            const attendanceData = await responseAttendance.json();
            allConcerts = attendanceData.concerts;
            allRehearsals = attendanceData.rehearsals;
        }
    });

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

    function openRefusalModal() {
        showRefusalModal = true;
        refusalMessage = '';
    }

    function closeRefusalModal() {
        showRefusalModal = false;
        refusalMessage = '';
        isRefusing = false;
    }

    async function refuseParticipant() {
        if (!currentParticipant) return;

        isRefusing = true;

        try {
            // Envoyer l'email de refus
            const emailResponse = await fetch(`/api/mailing/sendRefusalEmailToParticipant`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: currentParticipant.contact.email,
                    subject: `Refus de participation au projet`,
                    message: refusalMessage.trim() || `Bonjour ${currentParticipant.contact.firstName},\n\nMerci pour votre candidature, mais nous ne pouvons pas y donner suite.\n\nCordialement.`
                })
            });

            if (!emailResponse.ok) {
                const errorData = await emailResponse.json();
                alert(`Erreur lors de l'envoi de l'email: ${errorData.message || 'Erreur inconnue'}`);
                return;
            }

            // Supprimer le participant
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
            console.error('Erreur lors du refus:', error);
            alert('Erreur réseau, veuillez réessayer');
        } finally {
            isRefusing = false;
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
                        <th class="py-2 px-4 border-b">Firstname</th>
                        <th class="py-2 px-4 border-b">Lastname</th>
                        <th class="py-2 px-4 border-b">Section</th>
                        <th class="py-2 px-4 border-b"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {#each participants as participant}
                        <tr class="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                            <td class="py-2 px-4 border-b" on:click={() => (currentParticipant = participant)}>{participant.contact.firstName}</td>
                            <td class="py-2 px-4 border-b" on:click={() => (currentParticipant = participant)}>{participant.contact.lastName}</td>
                            <td class="py-2 px-4 border-b" on:click={() => (currentParticipant = participant)}>{participant.section.name}</td>
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
                                <span class="font-semibold">Comments:</span> {currentParticipant.contact.comments ?? 'no comments'}
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
                                <!-- Utiliser TOUS les concerts du projet au lieu de seulement ceux du participant -->
                                <AttendancePicker
                                  concertsOrRehearsals={allConcerts}
                                  type="concert"
                                  participants={[currentParticipant]}
                                  disabled
                                />
                            </div>
                            <div class="mb-2">
                                <h3 class="text-lg">Rehearsals</h3>
                                <!-- Utiliser TOUTES les répétitions du projet au lieu de seulement celles du participant -->
                                <AttendancePicker
                                  concertsOrRehearsals={allRehearsals}
                                  type="rehearsal"
                                  participants={[currentParticipant]}
                                  disabled
                                />
                            </div>
                        </div>
                    </div>
                    <div class="flex justify-between">
                        <button
                          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                          on:click={() => {
                                validateParticipant();
                            }}
                        >
                            Validate and send confirmation email
                        </button>
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

<!-- Modal de refus -->
{#if showRefusalModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Refuser la participation
            </h2>
            <p class="mb-4 text-gray-700 dark:text-gray-300">
                Vous êtes sur le point de refuser la participation de <strong>{currentParticipant?.contact.firstName} {currentParticipant?.contact.lastName}</strong>.
            </p>
            <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Un email de refus sera automatiquement envoyé au participant. Vous pouvez ajouter un message personnalisé ci-dessous (optionnel).
            </p>

            <div class="mb-4">
                <label for="refusal-message" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message personnalisé (optionnel)
                </label>
                <textarea
                  id="refusal-message"
                  bind:value={refusalMessage}
                  placeholder="Vous pouvez expliquer les raisons du refus ici..."
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  rows="4"
                  disabled={isRefusing}
                ></textarea>
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
                    {isRefusing ? 'Envoi en cours...' : 'Refuser et envoyer l\'email'}
                </button>
            </div>
        </div>
    </div>
{/if}