<!-- src/routes/projects/[id]/management/validation/+page.svelte - VERSION MODERNISÉE -->
<script lang="ts">
    import AttendancePicker from '$lib/components/participant/AttendancePicker.svelte';
    import RegistrationForm from '$lib/components/registration/RegistrationForm.svelte';
    import type { Participant } from '$lib/types/Participant.js';
    import type { Concert } from '$lib/types/Concert.js';
    import type { Rehearsal } from '$lib/types/Rehearsal.js';
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import ProjectHeadDisplayer from '../ProjectHeadDisplayer.svelte';
    import ProjectPhoneDisplayer from '../ProjectPhoneDisplayer.svelte';
    import type { Project } from '$lib/types/Project';

    export let data;
    let participants: Array<Participant>;
    let currentParticipant: Participant | null;

    let project: Project | undefined;

    // Variables for refusal modal
    let showRefusalModal = false;
    let refusalMessage = '';
    let isRefusing = false;

    // Variables for audition modal
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

    // Variables for statistics
    let validationStats = {
        total: 0,
        validated: 0,
        refused: 0,
        auditionsRequested: 0
    };

    // Loading states
    let participantsLoaded = false;
    let dataFullyLoaded = false;
    let loading = true;

    // Auto-refresh
    let refreshInterval: any = null;

    // Mobile detection
    let isMobile = false;

    const checkMobile = () => {
        isMobile = window.innerWidth < 768;
    };

    onMount(async () => {
        checkMobile();
        const handleResize = () => {
            isMobile = window.innerWidth < 768;
        };
        window.addEventListener('resize', handleResize);

        console.log('🚀 Starting validation data loading...');

        await Promise.all([
            loadParticipants(),
            loadProject(),
            loadProjectData(),
            loadQuill()
        ]);

        console.log('✅ All validation data loaded');
        loading = false;
        dataFullyLoaded = true;

        // Auto-refresh every 2 minutes
        refreshInterval = setInterval(async () => {
            await loadParticipants();
            updateStats();
        }, 120000);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
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

    async function loadProject() {
        if (!data?.id) return;

        const response = await fetch(`/api/projects/${data.id}`, {
            method: 'GET'
        });

        if (!response.ok) {
            console.error('Failed to fetch project');
            return;
        }

        project = await response.json();
    }

    async function loadParticipants() {
        try {
            console.log('📥 Loading participants...');
            const responseParticipants = await fetch(`/api/projects/${data.id}/management/validation`);
            if (responseParticipants.ok) {
                participants = await responseParticipants.json();
                participantsLoaded = true;
                updateStats();
                console.log('✅ Participants loaded:', participants.length);
            } else {
                console.error('❌ Failed to load participants');
            }
        } catch (error) {
            console.error('❌ Error loading participants:', error);
        }
    }

    async function loadProjectData() {
        try {
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

    function updateStats() {
        if (!participants) return;

        validationStats = {
            total: participants.length,
            validated: 0, // Ce compteur augmentera quand on valide
            refused: 0,   // Ce compteur augmentera quand on refuse
            auditionsRequested: participants.filter(p => p.audition_status && p.audition_status !== 'none').length
        };
    }

    async function loadQuill() {
        try {
            if (typeof window !== 'undefined' && !window.Quill) {
                const linkElement = document.createElement('link');
                linkElement.rel = 'stylesheet';
                linkElement.href = 'https://cdnjs.cloudflare.com/ajax/libs/quill/1.3.7/quill.snow.min.css';
                document.head.appendChild(linkElement);

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
                placeholder: 'You can explain the reasons for rejection here...',
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

    // Existing functions...
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
                updateStats();
            } else {
                alert('Error during deletion');
            }
        } catch (error) {
            console.error('Error deleting participant:', error);
            alert('Network error');
        }
    }

    async function validateParticipant() {
        if (!currentParticipant) return;

        try {
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
                updateStats();
                showSuccessPopup('Participant validated successfully! Confirmation email sent.');
            } else {
                alert('Error during validation');
            }
        } catch (error) {
            console.error('Error validating participant:', error);
            alert('Network error');
        }
    }

    function openAuditionModal() {
        if (!currentParticipant) {
            alert('No participant selected');
            return;
        }

        if (!currentParticipant.contact.validated) {
            alert('Contact must be validated before requesting an audition');
            return;
        }

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

            const filteredRequiredFiles = auditionRequiredFiles
              .filter(file => file && file.trim() !== '')
              .map(file => file.trim());

            const auditionData = {
                instructions: finalInstructions || '',
                required_files: filteredRequiredFiles,
                deadline: auditionDeadline || null
            };

            const url = `/api/projects/${data.id}/management/participants/${currentParticipant.id}/request-audition`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(auditionData)
            });

            if (response.ok) {
                await loadParticipants();
                closeAuditionModal();
                showSuccessPopup('Audition request sent successfully! The candidate will automatically receive PDFs for their section.');
            } else {
                const errorText = await response.text();
                console.error('Server response:', errorText);
                try {
                    const errorData = JSON.parse(errorText);
                    alert(`Error: ${errorData.message || errorData.error || 'Unknown error'}`);
                } catch {
                    alert(`Server error: ${errorText}`);
                }
            }

        } catch (error) {
            console.error('Error requesting audition:', error);
            alert('Network error, please try again');
        } finally {
            isRequestingAudition = false;
        }
    }

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
                alert(`Email sending error: ${errorData.message || 'Unknown error'}`);
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
                updateStats();
                showSuccessPopup('Refusal email sent and participant deleted successfully');
            } else {
                alert('Email sent but error during participant deletion');
            }

        } catch (error) {
            console.error('Error during refusal:', error);
            alert('Network error, please try again');
        } finally {
            isRefusing = false;
        }
    }

    function showSuccessPopup(message: string) {
        const popup = document.createElement('div');
        popup.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';

        popup.innerHTML = `
			<div class="bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all duration-300 ease-out scale-95 animate-bounce-in">
				<div class="p-6 text-center">
					<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-gray-900 mb-2">Success!</h3>
					<p class="text-gray-600">${message}</p>
					<button onclick="this.closest('.fixed').remove()" class="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
						Great!
					</button>
				</div>
			</div>
		`;

        const style = document.createElement('style');
        style.textContent = `
			@keyframes bounce-in {
				0% { transform: scale(0.3); opacity: 0; }
				50% { transform: scale(1.05); opacity: 0.8; }
				70% { transform: scale(0.9); opacity: 0.9; }
				100% { transform: scale(1); opacity: 1; }
			}
			.animate-bounce-in {
				animation: bounce-in 0.6s ease-out;
			}
		`;
        document.head.appendChild(style);

        document.body.appendChild(popup);

        setTimeout(() => {
            if (popup.parentNode) {
                popup.remove();
            }
        }, 5000);
    }

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

    function formatDate(dateString) {
        if (!dateString) return 'Unknown date';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            return date.toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Date error';
        }
    }

    function goToAuditions() {
        goto(`/projects/${data.id}/management/auditions`);
    }

    function isParticipantInAudition(participant: Participant | null): boolean {
        if (!participant) return false;
        return participant.audition_status && participant.audition_status !== 'none';
    }

    function getAuditionStatusText(participant: Participant | null): string {
        if (!participant || !participant.audition_status || participant.audition_status === 'none') {
            return '';
        }
        switch (participant.audition_status) {
            case 'pending':
                return 'in progress';
            case 'completed':
                return 'completed';
            default:
                return participant.audition_status;
        }
    }
</script>

<svelte:head>
    <title>Application Validation - Project {data.id}</title>
</svelte:head>

<ProjectHeadDisplayer {project} selectedTab={1} />

<div class="min-h-screen bg-gray-50">
    <!-- Enhanced Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div class="flex justify-between items-center">
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Application Validation</h1>
                <p class="text-sm text-gray-600 mt-1">
                    Manage applications, request auditions and make decisions
                </p>
            </div>
            <div class="flex gap-3">
                {#if validationStats.auditionsRequested > 0}
                    <div class="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
                        <div class="flex items-center space-x-2 text-sm">
                            <span class="font-medium text-purple-900">🎭 Auditions:</span>
                            <span class="text-purple-700">{validationStats.auditionsRequested} requested</span>
                        </div>
                    </div>
                {/if}

                <button
                  on:click={goToAuditions}
                  class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    🎭 View Auditions
                </button>

                <button
                  on:click={() => goto(`/projects/${data.id}/management`)}
                  class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                    ← Back to Project
                </button>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="p-6 {isMobile ? 'pb-20' : ''}">
        {#if loading}
            <div class="flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span class="ml-4 text-gray-600">Loading validation data...</span>
            </div>
        {:else if !participants || participants.length === 0}
            <div class="text-center py-12">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">No pending applications</h3>
                <p class="mt-1 text-sm text-gray-500">All applications have been processed.</p>

                <div class="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      on:click={() => goto(`/projects/${data.id}/management/participants`)}
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        View All Participants
                    </button>
                    <button
                      on:click={() => goto(`/projects/${data.id}/management`)}
                      class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        {:else}
            <!-- Statistics Cards -->
            <div class="grid grid-cols-2 {isMobile ? 'gap-2 mb-4' : 'md:grid-cols-4 gap-4 mb-6'}">
                <div class="bg-blue-50 p-3 rounded-lg">
                    <div class="text-xl {isMobile ? '' : '2xl'} font-bold text-blue-600">{validationStats.total}</div>
                    <div class="text-xs {isMobile ? '' : 'sm'} text-blue-600">Pending</div>
                </div>
                <div class="bg-green-50 p-3 rounded-lg">
                    <div class="text-xl {isMobile ? '' : '2xl'} font-bold text-green-600">{validationStats.validated}</div>
                    <div class="text-xs {isMobile ? '' : 'sm'} text-green-600">Validated</div>
                </div>
                <div class="bg-red-50 p-3 rounded-lg">
                    <div class="text-xl {isMobile ? '' : '2xl'} font-bold text-red-600">{validationStats.refused}</div>
                    <div class="text-xs {isMobile ? '' : 'sm'} text-red-600">Refused</div>
                </div>
                <div class="bg-purple-50 p-3 rounded-lg">
                    <div class="text-xl {isMobile ? '' : '2xl'} font-bold text-purple-600">{validationStats.auditionsRequested}</div>
                    <div class="text-xs {isMobile ? '' : 'sm'} text-purple-600">Auditions</div>
                </div>
            </div>

            {#if isMobile}
                <!-- Mobile Layout -->
                <div class="space-y-4">
                    {#if currentParticipant}
                        <!-- Current participant details for mobile -->
                        <div class="bg-white rounded-lg shadow border border-gray-200 p-4">
                            <div class="flex justify-between items-start mb-4">
                                <h2 class="text-lg font-semibold text-gray-900">
                                    {currentParticipant.contact.firstName} {currentParticipant.contact.lastName}
                                </h2>
                                <button
                                  on:click={() => currentParticipant = null}
                                  class="text-gray-400 hover:text-gray-600"
                                >
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>

                            <!-- Contact not validated warning -->
                            {#if !currentParticipant.contact.validated}
                                <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                    <div class="flex items-center">
                                        <svg class="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                                        </svg>
                                        <div>
                                            <h3 class="text-red-800 font-medium text-sm">Contact not validated</h3>
                                            <a href="/contacts/validation" class="text-red-600 text-xs underline">
                                                → Go to contact validation
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            {/if}

                            <!-- Audition status -->
                            {#if isParticipantInAudition(currentParticipant)}
                                <div class="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                                    <div class="flex items-center justify-between">
										<span class="text-sm font-medium text-purple-800">
											🎭 Audition {getAuditionStatusText(currentParticipant)}
										</span>
                                        <button
                                          on:click={goToAuditions}
                                          class="text-purple-600 text-xs font-medium"
                                        >
                                            View →
                                        </button>
                                    </div>
                                </div>
                            {/if}

                            <!-- Contact info -->
                            <div class="space-y-2 text-sm">
                                <div><span class="font-medium">Email:</span> {currentParticipant.contact.email}</div>
                                <div><span class="font-medium">Section:</span> {currentParticipant.section.name}</div>
                                {#if currentParticipant.contact.phone}
                                    <div><span class="font-medium">Phone:</span> {currentParticipant.contact.phone}</div>
                                {/if}
                            </div>

                            <!-- Form responses -->
                            {#if currentParticipant.answers.length > 0}
                                <div class="mt-4">
                                    <h4 class="font-medium text-sm mb-2">Form responses:</h4>
                                    {#each currentParticipant.answers as answer}
                                        {#if answer.form}
                                            <RegistrationForm forms={[]} bind:answer disabled />
                                        {/if}
                                    {/each}
                                </div>
                            {/if}

                            <!-- Actions -->
                            <div class="mt-6 space-y-2">
                                <button
                                  class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
                                  on:click={validateParticipant}
                                  disabled={!currentParticipant.contact.validated}
                                >
                                    ✅ Validate
                                </button>

                                {#if !isParticipantInAudition(currentParticipant)}
                                    <button
                                      class="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
                                      on:click={openAuditionModal}
                                      disabled={!currentParticipant.contact.validated}
                                    >
                                        🎭 Request Audition
                                    </button>
                                {/if}

                                <button
                                  class="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg"
                                  on:click={openRefusalModal}
                                >
                                    ❌ Reject
                                </button>
                            </div>
                        </div>
                    {/if}

                    <!-- Participants list for mobile -->
                    <div class="bg-white rounded-lg shadow border border-gray-200">
                        <div class="px-4 py-3 border-b border-gray-200">
                            <h2 class="text-lg font-semibold text-gray-900">
                                Pending Applications ({participants.length})
                            </h2>
                        </div>
                        <div class="divide-y divide-gray-200">
                            {#each participants as participant}
                                <div
                                  class="p-4 hover:bg-gray-50 cursor-pointer {currentParticipant?.id === participant.id ? 'bg-blue-50' : ''}"
                                  on:click={() => (currentParticipant = participant)}
                                >
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <h3 class="font-medium text-gray-900 text-sm">
                                                {participant.contact.firstName} {participant.contact.lastName}
                                            </h3>
                                            <p class="text-xs text-gray-600">{participant.contact.email}</p>
                                            <p class="text-xs text-blue-600 font-medium">{participant.section.name}</p>

                                            {#if isParticipantInAudition(participant)}
												<span class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 mt-1">
													🎭 Audition {getAuditionStatusText(participant)}
												</span>
                                            {/if}
                                        </div>
                                        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                        </svg>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            {:else}
                <!-- Desktop Layout -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Participants list -->
                    <div class="bg-white rounded-lg shadow border border-gray-200">
                        <div class="px-6 py-4 border-b border-gray-200">
                            <div class="flex justify-between items-center">
                                <h2 class="text-xl font-semibold text-gray-900">
                                    Pending Applications
                                    <span class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
										{participants.length}
									</span>
                                </h2>
                                <button
                                  on:click={async () => {
										loading = true;
										await loadParticipants();
										loading = false;
									}}
                                  class="text-blue-600 hover:text-blue-800 p-1"
                                  title="Refresh"
                                >
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>

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

                                            {#if isParticipantInAudition(participant)}
												<span class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 mt-1">
													🎭 Audition {getAuditionStatusText(participant)}
												</span>
                                            {/if}
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            {#if isParticipantInAudition(participant)}
												<span class="text-purple-500" title="Audition requested">
													<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
														<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
													</svg>
												</span>
                                            {/if}
                                            <button
                                              class="text-blue-500 hover:text-blue-700 p-1"
                                              on:click|stopPropagation={() => (currentParticipant = participant)}
                                              title="View details"
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
                    </div>

                    <!-- Selected participant details -->
                    <div class="bg-white rounded-lg shadow border border-gray-200">
                        {#if currentParticipant}
                            <div class="px-6 py-4 border-b border-gray-200">
                                <h2 class="text-xl font-semibold text-gray-900">
                                    Application from {currentParticipant.contact.firstName} {currentParticipant.contact.lastName}
                                </h2>
                            </div>

                            <div class="p-6 space-y-6">
                                <!-- Contact not validated warning -->
                                {#if !currentParticipant.contact.validated}
                                    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div class="flex items-center">
                                            <svg class="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                                            </svg>
                                            <div>
                                                <h3 class="text-red-800 font-medium">Contact not validated</h3>
                                                <p class="text-red-700 text-sm">
                                                    You must first validate this person in the contact validation page.
                                                </p>
                                                <a href="/contacts/validation" class="text-red-600 hover:text-red-800 text-sm font-medium underline">
                                                    → Go to contact validation
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                {/if}

                                <!-- Audition status -->
                                {#if isParticipantInAudition(currentParticipant)}
                                    <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                        <div class="flex items-center justify-between">
                                            <div class="flex items-center">
												<span class="px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
													🎭 Audition {getAuditionStatusText(currentParticipant)}
												</span>
                                                {#if currentParticipant.audition_deadline}
													<span class="ml-3 text-sm text-gray-600">
														Deadline: {formatDate(currentParticipant.audition_deadline)}
													</span>
                                                {/if}
                                            </div>
                                            <button
                                              on:click={goToAuditions}
                                              class="text-purple-600 hover:text-purple-800 text-sm font-medium"
                                            >
                                                View audition →
                                            </button>
                                        </div>
                                    </div>
                                {/if}

                                <!-- Contact information -->
                                <div>
                                    <h3 class="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
                                    <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                                        <div class="grid grid-cols-2 gap-4">
                                            <div>
                                                <span class="text-sm font-medium text-gray-700">Full name:</span>
                                                <p class="text-gray-900">{currentParticipant.contact.firstName} {currentParticipant.contact.lastName}</p>
                                            </div>
                                            <div>
                                                <span class="text-sm font-medium text-gray-700">Email:</span>
                                                <a href="mailto:{currentParticipant.contact.email}" class="text-blue-600 hover:text-blue-800">
                                                    {currentParticipant.contact.email}
                                                </a>
                                            </div>
                                            <div>
                                                <span class="text-sm font-medium text-gray-700">Phone:</span>
                                                <p class="text-gray-900">{currentParticipant.contact.phone || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <span class="text-sm font-medium text-gray-700">Messenger:</span>
                                                <p class="text-gray-900">{currentParticipant.contact.messenger || 'Not provided'}</p>
                                            </div>
                                        </div>
                                        {#if currentParticipant.contact.comments}
                                            <div>
                                                <span class="text-sm font-medium text-gray-700">Comments:</span>
                                                <p class="text-gray-900 mt-1">{currentParticipant.contact.comments}</p>
                                            </div>
                                        {/if}
                                    </div>
                                </div>

                                <!-- Section and form -->
                                <div>
                                    <h3 class="text-lg font-medium text-gray-900 mb-3">Application</h3>
                                    <div class="bg-gray-50 rounded-lg p-4 space-y-4">
                                        <div>
                                            <span class="text-sm font-medium text-gray-700">Requested section:</span>
                                            <p class="text-gray-900 font-medium">{currentParticipant.section.name}</p>
                                        </div>

                                        {#if currentParticipant.answers.length > 0}
                                            <div>
                                                <span class="text-sm font-medium text-gray-700">Form responses:</span>
                                                <div class="mt-2 space-y-2">
                                                    {#each currentParticipant.answers as answer}
                                                        {#if answer.form}
                                                            <RegistrationForm forms={[]} bind:answer disabled />
                                                        {/if}
                                                    {/each}
                                                </div>
                                            </div>
                                        {/if}

                                        <!-- Concert availability -->
                                        <div>
                                            <h4 class="text-sm font-medium text-gray-700 mb-2">Availability - Concerts</h4>
                                            <AttendancePicker
                                              concertsOrRehearsals={allConcerts}
                                              type="concert"
                                              participants={[currentParticipant]}
                                              disabled
                                            />
                                        </div>

                                        <!-- Rehearsal availability -->
                                        <div>
                                            <h4 class="text-sm font-medium text-gray-700 mb-2">Availability - Rehearsals</h4>
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
                                        <button
                                          class="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                          on:click={validateParticipant}
                                          disabled={!currentParticipant.contact.validated}
                                        >
                                            ✅ Validate and send confirmation
                                        </button>

                                        {#if !isParticipantInAudition(currentParticipant)}
                                            <button
                                              class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                              on:click={openAuditionModal}
                                              disabled={!currentParticipant.contact.validated}
                                            >
                                                🎭 Request an audition
                                            </button>
                                        {:else}
                                            <button
                                              class="flex-1 bg-gray-400 text-white font-medium py-3 px-4 rounded-lg cursor-not-allowed"
                                              disabled
                                              title="Audition already requested"
                                            >
                                                🎭 Audition {getAuditionStatusText(currentParticipant)}
                                            </button>
                                        {/if}

                                        <button
                                          class="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                                          on:click={openRefusalModal}
                                        >
                                            ❌ Reject
                                        </button>
                                    </div>

                                    {#if !currentParticipant.contact.validated}
                                        <p class="text-sm text-red-600 mt-2 text-center">
                                            ⚠️ Contact must be validated before any action
                                        </p>
                                    {/if}
                                </div>
                            </div>
                        {:else}
                            <div class="p-12 text-center">
                                <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <h3 class="text-lg font-medium text-gray-900">No application selected</h3>
                                <p class="text-gray-600 mt-1">Click on an application in the list to view its details</p>
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}
        {/if}
    </div>
</div>

<!-- Audition Modal -->
{#if showAuditionModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="text-xl font-bold text-gray-900">🎭 Request an audition</h2>
                <p class="text-gray-700 mt-1">
                    You are about to request an audition from <strong>{currentParticipant?.contact.firstName} {currentParticipant?.contact.lastName}</strong>
                    (section: <strong>{currentParticipant?.section.name}</strong>).
                </p>
            </div>

            <div class="px-6 py-4 space-y-6">
                <!-- Important information -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex items-center">
                        <svg class="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                        </svg>
                        <div class="text-sm text-blue-700">
                            <p class="font-medium">📚 Automatic PDFs</p>
                            <p>The candidate will automatically receive all PDFs configured for their section.</p>
                        </div>
                    </div>
                </div>

                <!-- Custom instructions -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Custom instructions for the candidate
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

                <!-- Required files -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Specific required materials/files (optional)
                    </label>
                    {#each auditionRequiredFiles as file, index}
                        <div class="flex mb-2">
                            <input
                              type="text"
                              bind:value={auditionRequiredFiles[index]}
                              placeholder="e.g., Recording of piece X, 2-minute improvisation"
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

                <!-- Deadline -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Deadline (optional)
                    </label>
                    <input
                      type="datetime-local"
                      bind:value={auditionDeadline}
                      class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isRequestingAudition}
                    />
                </div>
            </div>

            <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  class="px-4 py-2 text-gray-500 hover:text-gray-700"
                  on:click={closeAuditionModal}
                  disabled={isRequestingAudition}
                >
                    Cancel
                </button>
                <button
                  class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded disabled:opacity-50"
                  on:click={requestAudition}
                  disabled={isRequestingAudition}
                >
                    {isRequestingAudition ? 'Sending...' : 'Send audition request'}
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Refusal Modal -->
{#if showRefusalModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="text-xl font-bold text-gray-900">Reject participation</h2>
            </div>

            <div class="px-6 py-4 space-y-4">
                <p class="text-gray-700">
                    You are about to reject the participation of <strong>{currentParticipant?.contact.firstName} {currentParticipant?.contact.lastName}</strong>.
                </p>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Custom message (optional)
                    </label>
                    <div
                      bind:this={quillContainer}
                      class="bg-white border border-gray-300 rounded-lg min-h-[200px] {isRefusing ? 'opacity-50 pointer-events-none' : ''}"
                      style="font-family: inherit;"
                    ></div>
                </div>
            </div>

            <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  class="px-4 py-2 text-gray-500 hover:text-gray-700"
                  on:click={closeRefusalModal}
                  disabled={isRefusing}
                >
                    Cancel
                </button>
                <button
                  class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded disabled:opacity-50"
                  on:click={refuseParticipant}
                  disabled={isRefusing}
                >
                    {isRefusing ? 'Sending...' : 'Reject and send email'}
                </button>
            </div>
        </div>
    </div>
{/if}

{#if isMobile}
    <ProjectPhoneDisplayer {project} selectedTab={1} />
{/if}

<style>
    /* Styles for Quill Editor */
    :global(.ql-toolbar) {
        border-color: #d1d5db !important;
        background-color: #f9fafb !important;
    }

    :global(.ql-container) {
        border-color: #d1d5db !important;
        background-color: #ffffff !important;
    }

    /* Transitions */
    .transition-colors {
        transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
    }

    /* Mobile responsive */
    @media (max-width: 1024px) {
        .grid.lg\\:grid-cols-2 {
            grid-template-columns: 1fr;
        }
    }
</style>