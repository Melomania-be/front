<!-- src/lib/components/RecruitmentAlertsModal.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import toast from 'svelte-french-toast'; // Toast is imported directly here
    import { goto } from '$app/navigation'; // goto is imported directly here

    // --- INTERFACE: RecruitmentAlert (Frontend) ---
    // This should match your backend RecruitmentAlert and Recruitment models' preloaded structure
    interface RecruitmentAlert {
        id: number;
        newRecruitmentId: number;
        similarToRecruitmentId: number | null;
        alertType: string; // e.g., 'similarity_conflict'
        message: string | null;
        isResolved: boolean;
        createdAt: string;
        updatedAt: string;
        // newRecruitment?: { id: number; firstName: string; lastName: string; projectId: number | null; status: string; project?: { id: number; name: string }; section?: { id: number; name: string };};
        // similarToRecruitment?: { id: number; firstName: string; lastName: string; projectId: number | null; project?: { id: number; name: string }; section?: { id: number; name: string };};
        newRecruitment?: {
            id: number;
            firstName: string;
            lastName: string;
            projectId: number | null;
            email: string | null;   // <--- ADDED
            phone: string | null;   // <--- ADDED
            comment: string | null; // <--- ADDED
            status: string;         // <--- ADDED
            project?: { id: number; name: string };
            section?: { id: number; name: string };
        };
        similarToRecruitment?: {
            id: number;
            firstName: string;
            lastName: string;
            projectId: number | null;
            email: string | null;   // <--- ADDED
            phone: string | null;   // <--- ADDED
            comment: string | null; // <--- ADDED
            status: string;         // <--- ADDED
            contactDate: string | null; // <--- ADDED (assuming ISO string from DateTime)
            project?: { id: number; name: string };
            section?: { id: number; name: string };
        };
    }
    // --- END INTERFACE ---

    // --- State for Alerts (moved from +page.svelte) ---
    let unresolvedAlerts: RecruitmentAlert[] = [];
    export let showAlertDialog: boolean = false; // Prop to control visibility from parent
    let isLoadingAlerts = false;
    let isResolvingAlert = false; // To show loading state for resolution actions
    // --- END State ---

    // --- Fetch Unresolved Alerts (moved from +page.svelte) ---
    async function fetchUnresolvedAlerts() {
        if (!browser) return;

        isLoadingAlerts = true;
        try {
            const res = await fetch('/api/recruitment-alerts?isResolved=false'); // Calls SvelteKit API route
            if (res.ok) {
                unresolvedAlerts = await res.json();
                console.log('Fetched unresolved alerts:', unresolvedAlerts);
                if (unresolvedAlerts.length > 0) {
                    showAlertDialog = true; // Automatically show modal if alerts exist
                }
            } else {
                toast.error('Failed to load recruitment alerts.');
                console.error('Failed to load alerts:', await res.text());
            }
        } catch (err) {
            toast.error('Could not load recruitment alerts.');
            console.error('Error fetching alerts:', err);
        } finally {
            isLoadingAlerts = false;
        }
    }

    // --- Handle Alert Resolution Actions (moved from +page.svelte) ---

    // Action 1: Approve as New (just mark alert as resolved)
    async function approveAsNew(alertId: number) {
        isResolvingAlert = true;
        try {
            const res = await fetch(`/api/recruitment-alerts/${alertId}/resolve`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                toast.success('Alert resolved: New recruit approved as distinct.');
                unresolvedAlerts = unresolvedAlerts.filter(alert => alert.id !== alertId);
                if (unresolvedAlerts.length === 0) {
                    showAlertDialog = false; // Close modal if no more alerts
                }
            } else {
                const errorText = await res.text();
                toast.error(`Failed to approve as new: ${errorText}`);
                console.error('Error approving as new:', errorText);
            }
        } catch (err) {
            toast.error('Error communicating with server for approval.');
            console.error('Error approving as new:', err);
        } finally {
            isResolvingAlert = false;
        }
    }

    // Action 2: Update Existing Status (and Delete New)
    async function updateExistingAndDeleteNew(alertId: number) {
        isResolvingAlert = true;
        try {
            const res = await fetch(`/api/recruitment-alerts/${alertId}/resolve-as-update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                toast.success('Alert resolved: Existing recruit status updated, new recruit deleted.');
                unresolvedAlerts = unresolvedAlerts.filter(alert => alert.id !== alertId);
                if (unresolvedAlerts.length === 0) {
                    showAlertDialog = false;
                }
            } else {
                const errorText = await res.text();
                toast.error(`Failed to resolve as update: ${errorText}`);
                console.error('Error resolving as update:', errorText);
            }
        } catch (err) {
            toast.error('Error communicating with server for resolution.');
            console.error('Error resolving as update:', err);
        } finally {
            isResolvingAlert = false;
        }
    }

    // Helper for navigation to recruitment detail (optional)
    function goToRecruitment(recruitmentId: number, projectId: number | null) {
        if (projectId) {
            goto(`/recruitments?projectId=${projectId}#recruitment-${recruitmentId}`);
        } else {
            goto(`/recruitments#recruitment-${recruitmentId}`);
        }
    }
    // --- END NEW FUNCTIONS ---

    // --- Lifecycle Hook for this component ---
    onMount(() => {
        fetchUnresolvedAlerts(); // Fetch alerts when this component mounts
    });
</script>

<!-- Recruitment Alerts Modal HTML (moved from +page.svelte) -->
{#if showAlertDialog && unresolvedAlerts.length > 0}
    <div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div class="bg-white p-8 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 class="text-3xl font-bold text-red-700 mb-6">
                <span class="mr-2">⚠️</span>Unresolved Recruitment Conflicts ({unresolvedAlerts.length})
            </h2>
            <p class="text-gray-700 mb-6">
                New registrations have names similar to existing recruits. Please review and resolve these conflicts.
            </p>

            <!-- <div class="space-y-6">
                {#each unresolvedAlerts as alert (alert.id)}
                    <div class="p-4 border border-yellow-400 rounded-lg bg-yellow-50 shadow-sm">
                        <h3 class="font-semibold text-lg text-yellow-800 mb-2">Similarity Conflict</h3>
                        <p class="text-gray-800 mb-2">
                            New recruit: <strong class="font-bold">
                                {alert.newRecruitment?.firstName} {alert.newRecruitment?.lastName}
                                ({alert.newRecruitment?.project?.name || 'No Project'})
                            </strong>
                            
                        </p>
                        <p class="text-gray-800 mb-4">
                            Similar to existing: <strong class="font-bold">
                                {alert.similarToRecruitment?.firstName} {alert.similarToRecruitment?.lastName}
                                ({alert.similarToRecruitment?.project?.name || 'No Project'})
                               
                            </strong>
                           
                        </p>
                        {#if alert.message}
                            <p class="text-sm text-gray-600 mb-4 italic">"{alert.message}"</p>
                        {/if}

                        <div class="flex flex-col sm:flex-row gap-3 mt-4">
                            <button
                                on:click={() => approveAsNew(alert.id)}
                                disabled={isResolvingAlert}
                                class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {#if isResolvingAlert}
                                    <span class="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></span>
                                {:else}
                                    Approve as New
                                {/if}
                            </button>
                            <button
                                on:click={() => updateExistingAndDeleteNew(alert.id)}
                                disabled={isResolvingAlert}
                                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {#if isResolvingAlert}
                                    <span class="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></span>
                                {:else}
                                    Update Existing & Delete New
                                {/if}
                            </button> -->
                            <!-- <button
                                on:click={() => goToRecruitment(alert.newRecruitmentId, alert.newRecruitment?.projectId || null)}
                                class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md shadow-md transition"
                            >
                                View New Recruit
                            </button> -->
                            <!-- <button
                                on:click={() => {
                                    // --- FIX APPLIED HERE ---
                                    // Safely check if similarToRecruitmentId exists before navigating
                                    if (alert.similarToRecruitmentId) {
                                        goToRecruitment(alert.similarToRecruitmentId, alert.similarToRecruitment?.projectId || null);
                                    } else {
                                        // Handle case where similarToRecruitmentId is null (e.g., show a toast or log)
                                        toast.error('Cannot view existing recruit: ID is missing.');
                                        console.warn('Attempted to view existing recruit with null similarToRecruitmentId for alert:', alert.id);
                                    }
                                    // --- END FIX ---
                                }}
                                class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md shadow-md transition"
                            >
                                View Existing Recruit
                            </button> -->
                        <!-- </div>
                    </div>
                {/each}
            </div> -->
<div class="space-y-6">
                {#each unresolvedAlerts as alert (alert.id)}
                    <div class="p-4 border border-yellow-400 rounded-lg bg-yellow-50 shadow-sm">
                        <h3 class="font-semibold text-lg text-yellow-800 mb-2">Similarity Conflict</h3>

                        <!-- Details for NEW Recruitment -->
                        <div class="mb-4 p-2 border-l-4 border-blue-500 bg-blue-50">
                            <h4 class="font-bold text-blue-800 text-md mb-1">New Recruitment Details:</h4>
                            <p><strong>Name:</strong> {alert.newRecruitment?.firstName} {alert.newRecruitment?.lastName}</p>
                            <p><strong>Project:</strong> {alert.newRecruitment?.project?.name || 'N/A'}</p>
                            {#if alert.newRecruitment?.section}<p><strong>Section:</strong> {alert.newRecruitment.section.name}</p>{/if}
                            {#if alert.newRecruitment?.email}<p><strong>Email:</strong> {alert.newRecruitment.email}</p>{/if}
                            {#if alert.newRecruitment?.phone}<p><strong>Phone:</strong> {alert.newRecruitment.phone}</p>{/if}
                            <p><strong>Current Status:</strong> {alert.newRecruitment?.status}</p>
                            <!-- {#if alert.newRecruitment?.comment}<p><strong>Comment:</strong> {alert.newRecruitment.comment}</p>{/if} -->
                        </div>

                        <!-- Details for SIMILAR TO (EXISTING) Recruitment -->
                        <div class="mb-4 p-2 border-l-4 border-green-500 bg-green-50">
                            <h4 class="font-bold text-green-800 text-md mb-1">Existing Recruitment Details:</h4>
                            <p><strong>Name:</strong> {alert.similarToRecruitment?.firstName} {alert.similarToRecruitment?.lastName}</p>
                            <p><strong>Project:</strong> {alert.similarToRecruitment?.project?.name || 'N/A'}</p>
                            {#if alert.similarToRecruitment?.section}<p><strong>Section:</strong> {alert.similarToRecruitment.section.name}</p>{/if}
                            {#if alert.similarToRecruitment?.email}<p><strong>Email:</strong> {alert.similarToRecruitment.email}</p>{/if}
                            {#if alert.similarToRecruitment?.phone}<p><strong>Phone:</strong> {alert.similarToRecruitment.phone}</p>{/if}
                            <p><strong>Current Status:</strong> {alert.similarToRecruitment?.status}</p>
                            {#if alert.similarToRecruitment?.contactDate}<p><strong>Last Contact:</strong> {new Date(alert.similarToRecruitment.contactDate).toLocaleDateString()}</p>{/if}
                            <!-- {#if alert.similarToRecruitment?.comment}<p><strong>Comment:</strong> {alert.similarToRecruitment.comment}</p>{/if} -->
                        </div>

                        {#if alert.message}
                            <p class="text-sm text-gray-600 mb-4 italic">"{alert.message}"</p>
                        {/if}

                        <div class="flex flex-col sm:flex-row gap-3 mt-4">
                            <button
                                on:click={() => approveAsNew(alert.id)}
                                disabled={isResolvingAlert}
                                class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {#if isResolvingAlert}
                                    <span class="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></span>
                                {:else}
                                    Approve as New
                                {/if}
                            </button>
                            <button
                                on:click={() => updateExistingAndDeleteNew(alert.id)}
                                disabled={isResolvingAlert}
                                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {#if isResolvingAlert}
                                    <span class="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></span>
                                {:else}
                                    Update Existing & Delete New
                                {/if}
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
            <div class="mt-8 text-right">
                <button
                    on:click={() => showAlertDialog = false}
                    class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition"
                >
                    Close
                </button>
            </div>
        </div>
    </div>
{/if}