<!-- src/routes/projects/[id]/management/validation/+page.svelte - VERSION AVEC DESIGN UNIFORME -->
<script lang="ts">
    import AttendancePicker from '$lib/components/participant/AttendancePicker.svelte';
    import RegistrationForm from '$lib/components/registration/RegistrationForm.svelte';
    import type { Participant } from '$lib/types/Participant.js';
    import type { Concert } from '$lib/types/Concert.js';
    import type { Rehearsal } from '$lib/types/Rehearsal.js';
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';
    import ProjectHeadDisplayer from '../ProjectHeadDisplayer.svelte';
    import ProjectPhoneDisplayer from '../ProjectPhoneDisplayer.svelte';

    export let data;

    let project: any = undefined;
    let participants: Array<Participant>;
    let currentParticipant: Participant | null;

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

    // Variables for PDF management by section
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

    // Variables for statistics
    let auditionStats: any = {
        total: 0,
        submitted: 0,
        pending: 0,
        expired: 0,
        totalFiles: 0,
        totalPdfs: 0
    };

    // 🆕 Variables pour synchroniser les données d'audition
    let auditionsData: any[] = [];

    // 🔧 NOUVEAU : Variables pour gérer le timing
    let participantsLoaded = false;
    let auditionsLoaded = false;
    let dataFullyLoaded = false;

    // Mobile detection
    let isMobile = false;

    const checkMobile = () => {
        if (browser) {
            isMobile = window.innerWidth <= 1000;
        }
    };

    // 🔧 NOUVEAU : Réactivité forcée pour la synchronisation
    $: {
        if (participantsLoaded && auditionsLoaded && !dataFullyLoaded) {
            console.log('🔄 Both datasets loaded, syncing...');
            syncAuditionStatuses();
            dataFullyLoaded = true;
        }
    }

    // 🔧 NOUVEAU : Forcer la mise à jour quand les données changent
    $: {
        if (auditionsData && participants) {
            // Trigger reactive updates
            participants = participants;
        }
    }

    onMount(() => {
        checkMobile();
        if (browser) {
            window.addEventListener('resize', checkMobile);
        }

        return () => {
            if (browser) {
                window.removeEventListener('resize', checkMobile);
            }
        };
    });

    onMount(async () => {
        console.log('🚀 Starting data loading...');

        // Charger les données en parallèle mais attendre la synchronisation
        await Promise.all([
            fetchProject(),
            loadParticipants(),
            loadAuditionsData(),
            loadProjectData(),
            loadQuill(),
            loadAuditionStats()
        ]);

        console.log('✅ All data loaded and synced');
    });

    onDestroy(() => {
        if (quill) {
            quill = null;
        }
        if (quillAudition) {
            quillAudition = null;
        }
    });

    async function fetchProject() {
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
                console.log('✅ Participants loaded:', participants.map(p => ({
                    id: p.id,
                    name: `${p.contact.firstName} ${p.contact.lastName}`,
                    audition_status: p.audition_status
                })));
            } else {
                console.error('❌ Failed to load participants');
            }
        } catch (error) {
            console.error('❌ Error loading participants:', error);
        }
    }

    // 🆕 Nouvelle fonction pour charger les données d'audition
    async function loadAuditionsData() {
        try {
            console.log('📥 Loading auditions data...');
            const response = await fetch(`/api/projects/${data.id}/management/auditions`);
            if (response.ok) {
                const responseData = await response.json();
                auditionsData = responseData.auditions || [];
                auditionsLoaded = true;
                console.log('✅ Auditions data loaded:', auditionsData.map(a => ({
                    id: a.id,
                    participant_id: a.participant.id,
                    name: `${a.participant.contact.firstName} ${a.participant.contact.lastName}`,
                    is_submitted: a.is_submitted,
                    submitted_at: a.submitted_at,
                    deadline: a.deadline
                })));
            }
        } catch (error) {
            console.error('❌ Error loading auditions data:', error);
        }
    }

    // 🔧 FONCTION AMÉLIORÉE : Synchroniser les statuts d'audition
    function syncAuditionStatuses() {
        if (!participants || !auditionsData) {
            console.log('⏳ Waiting for data to sync...');
            return;
        }

        console.log('🔄 Syncing audition statuses...');
        console.log('📊 Auditions data for sync:', auditionsData.length);

        participants = participants.map(participant => {
            const audition = auditionsData.find(a => a.participant && a.participant.id === participant.id);

            if (audition) {
                // Déterminer le statut basé sur les données d'audition
                let audition_status = 'pending';
                let audition_deadline = audition.deadline || null;

                if (audition.is_submitted && audition.submitted_at) {
                    audition_status = 'completed';
                }

                console.log('🔄 Syncing participant:', participant.contact.firstName, participant.contact.lastName, 'new status:', audition_status);

                return {
                    ...participant,
                    audition_status,
                    audition_deadline
                };
            }

            // Si pas d'audition trouvée, s'assurer que le statut est bien "none"
            return {
                ...participant,
                audition_status: 'none',
                audition_deadline: null
            };
        });

        console.log('✅ Participants after sync:', participants.map(p => ({
            id: p.id,
            name: `${p.contact.firstName} ${p.contact.lastName}`,
            audition_status: p.audition_status
        })));

        // 🔧 NOUVEAU : Forcer la mise à jour du participant actuel
        if (currentParticipant) {
            const updatedCurrentParticipant = participants.find(p => p.id === currentParticipant.id);
            if (updatedCurrentParticipant) {
                currentParticipant = updatedCurrentParticipant;
                console.log('🔄 Updated current participant:', currentParticipant.contact.firstName, 'status:', currentParticipant.audition_status);
            }
        }

        // ✅ FORCER la réactivité de Svelte
        participants = [...participants];
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

    // ✅ CORRECTION : S'assurer que loadAuditionStats existe et est robuste
    async function loadAuditionStats() {
        try {
            console.log('📊 Loading audition stats...');
            const response = await fetch(`/api/projects/${data.id}/management/auditions`);
            if (response.ok) {
                const responseData = await response.json();
                auditionStats = responseData.stats || {
                    total: 0,
                    submitted: 0,
                    pending: 0,
                    expired: 0,
                    totalFiles: 0,
                    totalPdfs: 0
                };
                console.log('✅ Audition stats loaded:', auditionStats);
            } else {
                console.warn('⚠️ Failed to load audition stats, using defaults');
                auditionStats = {
                    total: 0,
                    submitted: 0,
                    pending: 0,
                    expired: 0,
                    totalFiles: 0,
                    totalPdfs: 0
                };
            }
        } catch (error) {
            console.error('❌ Error loading audition stats:', error);
            // Utiliser des valeurs par défaut en cas d'erreur
            auditionStats = {
                total: 0,
                submitted: 0,
                pending: 0,
                expired: 0,
                totalFiles: 0,
                totalPdfs: 0
            };
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

    // ✅ CORRECTION : Fonction améliorée pour vérifier si un participant est en audition
    function isParticipantInAudition(participant: Participant | null): boolean {
        if (!participant) {
            console.log('🔍 No participant provided');
            return false;
        }

        console.log('🔍 Checking audition status for participant:', participant.contact.firstName, participant.contact.lastName);

        // ✅ Vérifier d'abord dans les données d'audition directement
        if (auditionsData && auditionsData.length > 0) {
            const audition = auditionsData.find(a => a.participant && a.participant.id === participant.id);
            if (audition) {
                console.log('✅ Found audition for participant:', audition.is_submitted ? 'completed' : 'pending');
                return true;
            }
        }

        // Fallback sur audition_status
        const hasAuditionStatus = participant.audition_status &&
          participant.audition_status !== 'none' &&
          participant.audition_status !== null &&
          participant.audition_status !== undefined;

        console.log('🔍 Fallback check - audition_status:', participant.audition_status, 'result:', hasAuditionStatus);

        return hasAuditionStatus;
    }

    // ✅ CORRECTION : Fonction pour obtenir le texte du statut d'audition
    function getAuditionStatusText(participant: Participant | null): string {
        if (!participant) return '';

        // Vérifier d'abord dans les données d'audition directement
        if (auditionsData && auditionsData.length > 0) {
            const audition = auditionsData.find(a => a.participant && a.participant.id === participant.id);
            if (audition) {
                if (audition.is_submitted && audition.submitted_at) {
                    return 'completed';
                } else {
                    return 'in progress';
                }
            }
        }

        // Fallback sur audition_status
        if (!participant.audition_status || participant.audition_status === 'none' || participant.audition_status === null || participant.audition_status === undefined) {
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

    // 🆕 Fonction pour obtenir les données d'audition d'un participant
    function getParticipantAudition(participant: Participant | null): any | null {
        if (!participant) return null;
        return auditionsData.find(a => a.participant && a.participant.id === participant.id) || null;
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
            // Send validation email
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

            // Validate participant
            const response = await fetch(`/api/projects/${data.id}/management/validation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: currentParticipant.id })
            });

            if (response.ok) {
                // 🆕 NOUVEAU : Supprimer l'audition du participant s'il en a une
                const audition = getParticipantAudition(currentParticipant);
                if (audition) {
                    console.log('Deleting audition for validated participant:', audition.id);

                    try {
                        const deleteResponse = await fetch(`/api/projects/${data.id}/management/auditions/${audition.id}`, {
                            method: 'DELETE'
                        });

                        if (deleteResponse.ok) {
                            console.log('Audition deleted successfully for validated participant');
                        } else {
                            console.warn('Failed to delete audition for validated participant');
                        }
                    } catch (deleteError) {
                        console.error('Error deleting audition for validated participant:', deleteError);
                    }
                }

                participants = participants.filter(
                  (participant) => participant.id !== currentParticipant!.id
                );
                currentParticipant = null;
                showNotification('Participant validated successfully', 'success');

                // Reload audition stats
                await loadAuditionStats();
                await loadAuditionsData();
            } else {
                alert('Error during validation');
            }
        } catch (error) {
            console.error('Error validating participant:', error);
            alert('Network error');
        }
    }

    // ✅ FONCTION CORRIGÉE : Ouvrir le modal d'audition avec vérifications renforcées
    function openAuditionModal() {
        console.log('🎭 Opening audition modal for participant:', currentParticipant);

        if (!currentParticipant) {
            alert('No participant selected');
            return;
        }

        // ✅ VÉRIFICATION RENFORCÉE : Multiples conditions
        if (isParticipantInAudition(currentParticipant)) {
            const statusText = getAuditionStatusText(currentParticipant);
            alert(`This participant is already in audition (status: ${statusText}). Cannot request another audition.`);
            console.log('🚫 Audition blocked - participant already in audition:', currentParticipant.audition_status);
            return;
        }

        // ✅ VÉRIFICATION SUPPLÉMENTAIRE : Contact validé
        if (!currentParticipant.contact.validated) {
            alert('Contact must be validated before requesting an audition');
            return;
        }

        console.log('✅ Opening audition modal - all checks passed');
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

    // ✅ CORRECTION : Fonction requestAudition corrigée
    async function requestAudition() {
        if (!currentParticipant) return;

        console.log('🎭 Starting audition request for:', currentParticipant?.contact?.firstName);
        console.log('🎭 Current auditionsData:', auditionsData?.length || 0);
        console.log('🎭 Current participants:', participants?.length || 0);

        // ✅ DOUBLE VÉRIFICATION avant la requête
        if (isParticipantInAudition(currentParticipant)) {
            const statusText = getAuditionStatusText(currentParticipant);
            alert(`Error: This participant is already in audition (status: ${statusText}). Cannot request another audition.`);
            closeAuditionModal();
            return;
        }

        isRequestingAudition = true;

        try {
            let finalInstructions = '';
            if (quillAudition) {
                const text = quillAudition.getText().trim();
                finalInstructions = text ? quillAudition.root.innerHTML : '';
            }

            // Clean and filter required files
            const filteredRequiredFiles = auditionRequiredFiles
              .filter(file => file && file.trim() !== '')
              .map(file => file.trim());

            // Build data with validation
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

            console.log('🎭 Response status:', response.status);
            console.log('🎭 Response headers:', response.headers);

            if (response.ok) {
                console.log('✅ Audition request successful');

                // ✅ CORRECTION : Reset des flags et rechargement des données
                participantsLoaded = false;
                auditionsLoaded = false;
                dataFullyLoaded = false;

                // ✅ CORRECTION : Recharger les données dans le bon ordre
                try {
                    await loadParticipants();
                    await loadAuditionsData();
                    await loadAuditionStats();

                    // Forcer la synchronisation
                    syncAuditionStatuses();

                    console.log('✅ Data reloaded successfully');

                    closeAuditionModal();
                    showNotification('Audition request sent successfully! The candidate will automatically receive PDFs for their section.', 'success');

                } catch (reloadError) {
                    console.error('❌ Error reloading data:', reloadError);
                    // Même si le rechargement échoue, on ferme le modal
                    closeAuditionModal();
                    showNotification('Audition request sent successfully, but interface may need manual refresh.', 'info');
                }

            } else {
                const errorText = await response.text();
                console.error('❌ Server response:', errorText);
                try {
                    const errorData = JSON.parse(errorText);
                    alert(`Error: ${errorData.message || errorData.error || 'Unknown error'}`);
                } catch {
                    alert(`Server error: ${errorText}`);
                }
            }

        } catch (error) {
            console.error('❌ Error requesting audition:', error);
            alert('Network error, please try again');
        } finally {
            isRequestingAudition = false;
        }
    }

    // Functions for refusal...
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
                showNotification('Refusal email sent and participant deleted successfully', 'success');

                // Reload stats
                await loadAuditionStats();
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

    // Function to get audition status badge
    function getAuditionStatusBadge(auditionStatus: string) {
        switch (auditionStatus) {
            case 'pending':
                return { text: 'Audition in progress', class: 'bg-yellow-100 text-yellow-800' };
            case 'completed':
                return { text: 'Audition completed', class: 'bg-blue-100 text-blue-800' };
            default:
                return null;
        }
    }

    // New functions to go to specialized pages
    function goToAuditions() {
        goto(`/projects/${data.id}/management/auditions`);
    }

    function goToPdfManagement() {
        goto(`/projects/${data.id}/management/auditions/pdfs`);
    }

    // Function for notifications
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

    // Function to get PDF count
    function getPdfCount(sectionId: number): number {
        // This function could be improved by loading real PDFs
        // For now, return 0 since we don't have this data here
        return 0;
    }

    // ✅ NOUVEAU : Fonction de rafraîchissement manuel
    async function manualRefresh() {
        console.log('🔄 Manual refresh triggered');
        participantsLoaded = false;
        auditionsLoaded = false;
        dataFullyLoaded = false;

        await Promise.all([
            loadParticipants(),
            loadAuditionsData(),
            loadAuditionStats()
        ]);
    }
</script>

<svelte:head>
    <title>Application Validation - Project {data.id}</title>
</svelte:head>

<ProjectHeadDisplayer {project} selectedTab={5} />

<!-- ✅ NOUVEAU DESIGN : Utilisation du même style que les autres pages -->
<div class="bg-[#E7E7E7] p-4 min-h-screen pb-[80px]">
    <div class="p-4 gap-4 flex flex-col">

        {#if !dataFullyLoaded}
            <!-- Loading state avec le même style -->
            <div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
                <div class="flex justify-center items-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <span class="ml-4 text-gray-600">Loading validation data...</span>
                </div>
            </div>
        {:else}

            <!-- Header Actions -->
            <div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
                <div class="flex {isMobile ? 'flex-col gap-3' : 'justify-between items-center'}">
                    <div>
                        <h1 class="font-bold text-lg">APPLICATION VALIDATION</h1>
                        <p class="text-sm text-gray-600 mt-1">
                            Manage applications, request auditions and track submissions • {auditionStats.submitted} submitted • {auditionStats.pending} pending
                        </p>
                    </div>
                    <div class="flex gap-3">

                        <button
                          on:click={goToPdfManagement}
                          class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-400 font-semibold"
                        >
                            📚 Manage PDFs ({auditionStats.totalPdfs})
                        </button>
                        <button
                          on:click={goToAuditions}
                          class="px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 font-semibold"
                        >
                            🎭 View Auditions
                            {#if auditionStats.submitted > 0}
                                <span class="ml-1 px-2 py-1 bg-blue-800 text-xs rounded-full">
                                    {auditionStats.submitted}
                                </span>
                            {/if}
                        </button>
                    </div>
                </div>
            </div>

            <!-- ✅ SYSTÈME DE DEUX COLONNES -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <!-- Colonne de gauche : Liste des participants -->
                <div class="bg-white border-2 border-[#8C8C8C] rounded-[10px]">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <div class="flex justify-between items-center">
                            <h2 class="text-xl font-semibold text-gray-900">
                                PENDING APPLICATIONS
                                {#if participants && participants.length > 0}
                                    <span class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                                        {participants.length}
                                    </span>
                                {/if}
                            </h2>
                            <button
                              on:click={manualRefresh}
                              class="text-blue-600 hover:text-blue-800 p-1"
                              title="Refresh data"
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

                                            <!-- ✅ AFFICHAGE AMÉLIORÉ du statut d'audition -->
                                            {#if isParticipantInAudition(participant)}
                                                {@const audition = getParticipantAudition(participant)}
                                                {#if audition}
                                                    {#if audition.is_submitted && audition.submitted_at}
                                                        <span class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mt-1">
                                                            Audition completed
                                                        </span>
                                                    {:else}
                                                        <span class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 mt-1">
                                                            Audition in progress
                                                        </span>
                                                    {/if}
                                                    {#if audition.deadline}
                                                        <p class="text-xs text-gray-500 mt-1">
                                                            Deadline: {new Date(audition.deadline).toLocaleDateString('en-GB')}
                                                        </p>
                                                    {/if}
                                                {:else}
                                                    {@const badge = getAuditionStatusBadge(participant.audition_status)}
                                                    {#if badge}
                                                        <span class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full {badge.class} mt-1">
                                                            {badge.text}
                                                        </span>
                                                    {/if}
                                                    {#if participant.audition_deadline}
                                                        <p class="text-xs text-gray-500 mt-1">
                                                            Deadline: {new Date(participant.audition_deadline).toLocaleDateString('en-GB')}
                                                        </p>
                                                    {/if}
                                                {/if}
                                            {/if}
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            {#if getParticipantAudition(participant)}
                                                {@const audition = getParticipantAudition(participant)}
                                                {#if audition.is_submitted && audition.submitted_at}
                                                    <span class="text-green-500" title="Audition completed">
                                                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                                        </svg>
                                                    </span>
                                                {:else}
                                                    <span class="text-yellow-500" title="Audition in progress">
                                                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                                                        </svg>
                                                    </span>
                                                {/if}
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
                    {:else}
                        <div class="text-center py-12">
                            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 class="mt-2 text-sm font-medium text-gray-900">No pending applications</h3>
                            <p class="mt-1 text-sm text-gray-500">All applications have been processed.</p>
                        </div>
                    {/if}
                </div>

                <!-- Colonne de droite : Détails du participant sélectionné -->
                <div class="bg-white border-2 border-[#8C8C8C] rounded-[10px]">
                    {#if currentParticipant}
                        <div class="px-6 py-4 border-b border-gray-200">
                            <h2 class="text-xl font-semibold text-gray-900">
                                APPLICATION FROM {currentParticipant.contact.firstName.toUpperCase()} {currentParticipant.contact.lastName.toUpperCase()}
                            </h2>
                        </div>

                        <div class="p-6 space-y-6">
                            <!-- Overlay if contact not validated -->
                            {#if !currentParticipant.contact.validated}
                                <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
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

                            <!-- ✅ AFFICHAGE AMÉLIORÉ du statut d'audition actuel -->
                            {#if isParticipantInAudition(currentParticipant)}
                                {#if getParticipantAudition(currentParticipant)}
                                    {@const audition = getParticipantAudition(currentParticipant)}
                                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div class="flex items-center justify-between">
                                            <div class="flex items-center">
                                                {#if audition.is_submitted && audition.submitted_at}
                                                    <span class="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        Audition completed
                                                    </span>
                                                {:else}
                                                    <span class="px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                        Audition in progress
                                                    </span>
                                                {/if}
                                                {#if audition.deadline}
                                                    <span class="ml-3 text-sm text-gray-600">
                                                        Deadline: {new Date(audition.deadline).toLocaleDateString('en-GB', {
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
                                                View audition →
                                            </button>
                                        </div>
                                        {#if audition.is_submitted && audition.submitted_at}
                                            <p class="text-sm text-green-600 mt-2 font-medium">
                                                ✅ The audition has been submitted! You can now evaluate it.
                                            </p>
                                        {:else}
                                            <p class="text-sm text-yellow-600 mt-2">
                                                ⏳ The audition is in progress. The candidate can download PDFs for their section and upload their recordings.
                                            </p>
                                        {/if}
                                    </div>
                                {:else}
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
                                                            Deadline: {new Date(currentParticipant.audition_deadline).toLocaleDateString('en-GB', {
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
                                                    View audition →
                                                </button>
                                            </div>
                                        </div>
                                    {/if}
                                {/if}
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

                            <!-- ✅ SECTION DES ACTIONS AMÉLIORÉE -->
                            <div class="border-t border-gray-200 pt-6">
                                <div class="flex flex-wrap gap-3">
                                    <!-- Validation -->
                                    <button
                                      class="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                      on:click={validateParticipant}
                                      disabled={!currentParticipant.contact.validated}
                                    >
                                        ✅ Validate and send confirmation
                                    </button>

                                    <!-- ✅ BOUTON D'AUDITION AMÉLIORÉ avec rayures horizontales -->
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
                                          class="flex-1 bg-gray-400 text-white font-medium py-3 px-4 rounded-lg cursor-not-allowed striked-button-horizontal relative overflow-hidden"
                                          disabled
                                          title="Audition already requested - Cannot request another audition"
                                        >
                                            <span class="relative z-10">🎭 Audition {getAuditionStatusText(currentParticipant)}</span>
                                        </button>
                                    {/if}

                                    <!-- Refusal -->
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

        {#if isMobile}
            <ProjectPhoneDisplayer {project} selectedTab={5} />
        {/if}
    </div>
</div>

<!-- Audition modal -->
{#if showAuditionModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="text-xl font-bold text-gray-900">
                    🎭 Request an audition
                </h2>
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
                            <p>The candidate will automatically receive all PDFs configured for their section. They can download them from their audition portal.</p>
                        </div>
                    </div>
                </div>

                <!-- Custom instructions for candidate -->
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
                    <p class="text-xs text-gray-500 mt-2">
                        Describe specific instructions, requested style, technical details, etc.
                    </p>
                </div>

                <!-- Required files/materials -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Specific required materials/files (optional)
                    </label>
                    {#each auditionRequiredFiles as file, index}
                        <div class="flex mb-2">
                            <input
                              type="text"
                              bind:value={auditionRequiredFiles[index]}
                              placeholder="e.g., Recording of piece X, 2-minute improvisation, etc."
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

                <!-- Deadline with auto-calculation -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Deadline (optional)
                    </label>

                    <!-- Info about automatic deadline -->
                    <div class="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div class="flex items-center">
                            <svg class="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                            </svg>
                            <div class="text-sm text-blue-700">
                                <p class="font-medium">📅 Automatic deadline</p>
                                <p>If you don't set a deadline, it will automatically be set to <strong>1 day before the first rehearsal</strong> of the project.</p>
                            </div>
                        </div>
                    </div>

                    <input
                      type="datetime-local"
                      bind:value={auditionDeadline}
                      class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isRequestingAudition}
                      placeholder="Leave empty to use automatic deadline"
                    />

                    <!-- Contextual help -->
                    <div class="text-xs text-gray-500 mt-1">
                        {#if auditionDeadline}
                            <span class="text-green-600">✅ Custom deadline set</span>
                        {:else}
                            <span class="text-blue-600">🤖 Automatic deadline: 1 day before first rehearsal</span>
                        {/if}
                    </div>
                </div>

                <!-- Warning about file types -->
                <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div class="flex items-center">
                        <svg class="h-5 w-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                        <div class="text-sm text-yellow-700">
                            <p class="font-medium">🎬 🎵 Accepted file types</p>
                            <p>The candidate can only upload <strong>audio</strong> (MP3, WAV, etc.) or <strong>video</strong> (MP4, AVI, MOV, etc.) files.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  class="px-4 py-2 text-gray-500 hover:text-gray-700 font-semibold"
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

<!-- Refusal modal -->
{#if showRefusalModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="text-xl font-bold text-gray-900">
                    Reject participation
                </h2>
            </div>

            <div class="px-6 py-4 space-y-4">
                <p class="text-gray-700">
                    You are about to reject the participation of <strong>{currentParticipant?.contact.firstName} {currentParticipant?.contact.lastName}</strong>.
                </p>
                <p class="text-sm text-gray-600">
                    A rejection email will be automatically sent to the participant. You can add a custom message below (optional).
                </p>

                <div>
                    <label for="refusal-message" class="block text-sm font-medium text-gray-700 mb-2">
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
            </div>

            <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  class="px-4 py-2 text-gray-500 hover:text-gray-700 font-semibold"
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
                    {isRefusing ? 'Sending...' : 'Reject and send email'}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    /* ✅ STYLES AMÉLIORÉS pour l'effet rayé horizontal */
    .striked-button-horizontal {
        position: relative;
        background: linear-gradient(to right, #9ca3af, #6b7280);
        opacity: 0.7;
        animation: subtle-pulse 2s ease-in-out infinite;
    }

    /* Rayures horizontales principales */
    .striked-button-horizontal::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: repeating-linear-gradient(
          0deg,
          transparent 0px,
          transparent 4px,
          rgba(220, 38, 38, 0.6) 4px,
          rgba(220, 38, 38, 0.6) 6px,
          transparent 6px,
          transparent 10px
        );
        pointer-events: none;
        z-index: 2;
        animation: stripes-move 3s linear infinite;
    }

    /* Overlay pour effet de profondeur */
    .striked-button-horizontal::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: repeating-linear-gradient(
          0deg,
          transparent 0px,
          transparent 2px,
          rgba(239, 68, 68, 0.4) 2px,
          rgba(239, 68, 68, 0.4) 3px,
          transparent 3px,
          transparent 8px
        );
        pointer-events: none;
        z-index: 3;
        animation: stripes-move-reverse 2s linear infinite;
    }

    /* Animation des rayures qui bougent */
    @keyframes stripes-move {
        0% { transform: translateY(0px); }
        100% { transform: translateY(10px); }
    }

    @keyframes stripes-move-reverse {
        0% { transform: translateY(0px); }
        100% { transform: translateY(-8px); }
    }

    /* Animation de pulsation subtile */
    @keyframes subtle-pulse {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 0.5; }
    }

    /* Effet au survol (même si désactivé, pour le feedback visuel) */
    .striked-button-horizontal:hover {
        transform: none;
        box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);
    }

    /* Assurer que le texte reste lisible */
    .striked-button-horizontal span {
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
        font-weight: 600;
    }

    /* Variante alternative avec des rayures plus épaisses */
    .striked-button-horizontal.thick-stripes::before {
        background: repeating-linear-gradient(
          0deg,
          transparent 0px,
          transparent 6px,
          rgba(220, 38, 38, 0.7) 6px,
          rgba(220, 38, 38, 0.7) 10px,
          transparent 10px,
          transparent 16px
        );
    }

    /* Effet "INTERDIT" plus visible */
    .striked-button-horizontal.forbidden::before {
        background: repeating-linear-gradient(
          0deg,
          rgba(220, 38, 38, 0.8) 0px,
          rgba(220, 38, 38, 0.8) 2px,
          transparent 2px,
          transparent 6px
        );
        animation: forbidden-flash 1.5s ease-in-out infinite;
    }

    @keyframes forbidden-flash {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 0.4; }
    }

    /* Style responsive pour mobile */
    @media (max-width: 768px) {
        .striked-button-horizontal::before {
            background: repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 3px,
              rgba(220, 38, 38, 0.6) 3px,
              rgba(220, 38, 38, 0.6) 5px,
              transparent 5px,
              transparent 8px
            );
        }
    }

    /* Styles for Quill Editor */
    :global(.ql-toolbar) {
        border-color: #d1d5db !important;
        background-color: #f9fafb !important;
    }

    :global(.ql-container) {
        border-color: #d1d5db !important;
        background-color: #ffffff !important;
    }

    /* Styles for Quill Editor in dark mode */
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

    /* Transitions and animations */
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