<!-- <script context="module" lang="ts">
    // Your type definitions remain here, as they are used internally and match the backend contract.
    // The UI simply chooses not to display all available data points.

interface SectionGroupResponse {
    id: number;
    name: string; // Direct property 'name'
}

interface UserResponse {
    id: number;
    fullName: string | null; // Direct property 'fullName'
    // firstName and lastName might not be needed if fullName is always present and sufficient for display
}

    export type RecruitmentStatus =
        | 'awaiting response'
        | 'interested'
        | 'participating'
        | 'registered'
        | 'not available'
        | 'to be contacted'
        | 'cancelled'
        | 'other'
        | 'withdrawn';

   export interface Recruitment {
    id: number;
    firstName: string;
    lastName: string;
    sectionGroupId: number;
    contactDate: string;
    contactedBy: number;
    status: RecruitmentStatus;
    statusUpdatedAt: string;
    comment: string | null;
    createdAt: string;
    updatedAt: string;
    // --- Add the related objects ---
    sectionGroup?: SectionGroupResponse;
    user?: UserResponse;
}
</script>

<script lang="ts">
    import { onMount } from 'svelte';

    function formatDate(isoString: string | null | undefined): string {
        if (!isoString) return 'N/A';
        try {
            const date = new Date(isoString);
            return date.toISOString().split('T')[0];
        } catch (e) {
            console.error('Invalid date string for formatting:', isoString, e);
            return 'Invalid Date';
        }
    }

    let recruitment: Recruitment[] = [];
    let sortColumn: keyof Recruitment = 'lastName';
    let sortDirection: 'asc' | 'desc' = 'asc';

    // --- REMOVED 'statusUpdatedAt', 'createdAt', 'updatedAt' from `columns` ---
    const columns: (keyof Recruitment)[] = [
        'firstName',
        'lastName',
        'sectionGroupId',
        'contactDate',
        'contactedBy',
        'status',
        'comment',
    ];

    function sortTable(column: keyof Recruitment): void {
        if (sortColumn === column) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortColumn = column;
            sortDirection = 'asc';
        }

        recruitment = [...recruitment].sort((a, b) => {
            const aValue = (a[column] ?? '').toString();
            const bValue = (b[column] ?? '').toString();
            if (sortDirection === 'asc') {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        });
    }

    let showModal: boolean = false;
    let isEditing: boolean = false;
    let editForm: Partial<Recruitment> = {};

    const statuses: RecruitmentStatus[] = [
        'awaiting response',
        'interested',
        'participating',
        'registered',
        'not available',
        "to be contacted",
        'cancelled',
        'other',
        'withdrawn'
    ];

    async function fetchRecruitment() {
        try {
            const res = await fetch('/api/recruitment', { method: 'GET' });
            if (res.ok) {
                recruitment = await res.json() as Recruitment[];
            } else {
                const errorBody = await res.text();
                console.error('Failed to fetch recruitment data:', res.status, errorBody);
                alert(`Failed to fetch recruitment data: ${res.statusText}`);
            }
        } catch (error) {
            console.error('Error fetching recruitment:', error);
            alert('Error fetching recruitment data.');
        }
    }

    function openAddModal(): void {
        isEditing = false;
        editForm = {
            firstName: '',
            lastName: '',
            sectionGroupId: 1,
            contactDate: new Date().toISOString().split('T')[0],
            contactedBy: 1,
            status: 'awaiting response',
            comment: null
        };
        showModal = true;
    }

    function openEditModal(recruit: Recruitment): void {
        isEditing = true;
        editForm = { ...recruit };
        if (editForm.contactDate) {
            editForm.contactDate = new Date(editForm.contactDate).toISOString().split('T')[0];
        }
        showModal = true;
    }

    async function saveRecruit(): Promise<void> {
        if (!editForm.firstName || !editForm.lastName || editForm.sectionGroupId === undefined || editForm.contactedBy === undefined || !editForm.status) {
            alert('First Name, Last Name, Section Group ID, Contacted By, and Status are required.');
            return;
        }

        try {
            let res: Response;
            if (isEditing) {
                const id = Number(editForm.id);
                if (isNaN(id)) {
                    alert('Invalid ID for editing.');
                    return;
                }

                const payload: Partial<Omit<Recruitment, 'id' | 'createdAt' | 'updatedAt' | 'statusUpdatedAt'>> = {
                    firstName: editForm.firstName,
                    lastName: editForm.lastName,
                    sectionGroupId: editForm.sectionGroupId,
                    contactDate: editForm.contactDate,
                    contactedBy: editForm.contactedBy,
                    status: editForm.status,
                    comment: editForm.comment === undefined ? null : editForm.comment,
                };

                res = await fetch(`/api/recruitment/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error(`Failed to update recruit: ${res.statusText}`);
                alert('Recruitment updated successfully!');

            } else {
                const payload: Omit<Recruitment, 'id' | 'createdAt' | 'updatedAt' | 'statusUpdatedAt'> = {
                    firstName: editForm.firstName,
                    lastName: editForm.lastName,
                    sectionGroupId: editForm.sectionGroupId,
                    contactDate: editForm.contactDate!,
                    contactedBy: editForm.contactedBy!,
                    status: editForm.status!,
                    comment: editForm.comment === undefined ? null : editForm.comment,
                };

                res = await fetch('/api/recruitment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error(`Failed to add recruit: ${res.statusText}`);
                alert('Recruitment added successfully!');
            }

            await fetchRecruitment();
            closeModal();
        } catch (error) {
            console.error('Error saving recruit:', error);
            alert('Failed to save recruit: ' + (error instanceof Error ? error.message : String(error)));
        }
    }

    function closeModal(): void {
        showModal = false;
        editForm = {};
    }

    async function deleteRecruit(id: number): Promise<void> {
        if (confirm('Are you sure you want to delete this recruit?')) {
            try {
                const res = await fetch(`/api/recruitment/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error(`Failed to delete recruit: ${res.statusText}`);
                alert('Recruitment deleted successfully!');
                await fetchRecruitment();
            } catch (error) {
                console.error('Error deleting recruit:', error);
                alert('Failed to delete recruit: ' + (error instanceof Error ? error.message : String(error)));
            }
        }
    }

    async function checkAndUpdateStatus(firstName: string, lastName: string, action: 'register' | 'withdraw'): Promise<void> {
        const recruit = recruitment.find(
            r => r.firstName.toLowerCase() === firstName.toLowerCase() && r.lastName.toLowerCase() === lastName.toLowerCase()
        );
        if (!recruit) {
            alert(`Recruitment for ${firstName} ${lastName} not found.`);
            return;
        }

        if (action === 'register' && !confirm(`Confirm registration for ${firstName} ${lastName}?`)) return;
        if (action === 'withdraw' && !confirm(`Confirm withdrawal for ${firstName} ${lastName}?`)) return;

        try {
            const updatedRecruitPayload: Partial<Recruitment> = {
                status: action === 'register' ? 'registered' : 'withdrawn'
            };

            const id = recruit.id;

            const res = await fetch(`/api/recruitment/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedRecruitPayload)
            });
            if (!res.ok) throw new Error(`Failed to ${action} recruit: ${res.statusText}`);
            alert(`Recruitment status updated to '${updatedRecruitPayload.status}' for ${firstName} ${lastName}!`);
            await fetchRecruitment();
        } catch (error) {
            console.error(`Error ${action}ing recruit:`, error);
            alert(`Failed to ${action} recruit: ` + (error instanceof Error ? error.message : String(error)));
        }
    }

    function registerRecruit(firstName: string, lastName: string): void {
        checkAndUpdateStatus(firstName, lastName, 'register');
    }

    function withdrawRecruit(firstName: string, lastName: string): void {
        checkAndUpdateStatus(firstName, lastName, 'withdraw');
    }

    onMount(fetchRecruitment);
</script>

<div class="container mx-auto p-4">
    <div class="mb-4 flex justify-between">
        <button
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            on:click={openAddModal}
        >
            Add New Recruit
        </button>
        <div class="space-x-2">
            <button
                class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                on:click={() => registerRecruit('John', 'Smith')}
            >
                Test Register John Smith
            </button>
            <button
                class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                on:click={() => withdrawRecruit('John', 'Smith')}
            >
                Test Withdraw John Smith
            </button>
        </div>
    </div>

    <div class="overflow-x-auto">
        <table class="min-w-full bg-white border border-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    {#each columns as column (column)}
                        <th
                            class="px-4 py-2 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                            on:click={() => sortTable(column)}
                        >
                            {column === 'sectionGroupId' ? 'Section Group ID' :
                            column === 'contactDate' ? 'Contact Date' :
                            column === 'contactedBy' ? 'Contacted By' :
                            // Removed these conditions, as the columns array no longer contains them
                            // column === 'statusUpdatedAt' ? 'Status Updated At' :
                            // column === 'createdAt' ? 'Created At' :
                            // column === 'updatedAt' ? 'Updated At' :
                            column.charAt(0).toUpperCase() + column.slice(1).replace(/([A-Z])/g, ' $1')}
                            {#if sortColumn === column}
                                {sortDirection === 'asc' ? '↑' : '↓'}
                            {/if}
                        </th>
                    {/each}
                    <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
            </thead>
            <tbody>
                {#each recruitment as recruit (recruit.id)}
    <tr class="border-t hover:bg-gray-50">
        <td class="px-4 py-2 text-sm text-gray-600">{recruit.firstName}</td>
        <td class="px-4 py-2 text-sm text-gray-600">{recruit.lastName}</td>
        <td class="px-4 py-2 text-sm text-gray-600">
            {recruit.sectionGroup?.name ?? recruit.sectionGroupId} </td>
        <td class="px-4 py-2 text-sm text-gray-600">{formatDate(recruit.contactDate)}</td>
        <td class="px-4 py-2 text-sm text-gray-600">
            {recruit.user?.fullName ?? recruit.contactedBy} </td>
        <td class="px-4 py-2 text-sm text-gray-600">{recruit.status}</td>
        <td class="px-4 py-2 text-sm text-gray-600">{recruit.comment ?? 'N/A'}</td>
        <td class="px-4 py-2 text-sm">
            <button
                class="text-blue-500 hover:text-blue-700 mr-2"
                on:click={() => openEditModal(recruit)}
            >
                Edit
            </button>
            <button
                class="text-red-500 hover:text-red-700"
                on:click={() => deleteRecruit(recruit.id)}
            >
                Delete
            </button>
        </td>
    </tr>
{/each}
            </tbody>
        </table>
    </div>

    {#if showModal}
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white px-4 py-2 rounded-lg max-w-lg w-full">
                <h2 class="text-xl font-semibold mb-4">{isEditing ? 'Edit Recruit' : 'Add Recruit'}</h2>
                <div class="grid grid-cols-1 gap-4">
                    <div class="flex gap-4">
                        <div class="w-1/2">
                            <label class="block text-sm font-medium text-gray-700">Last Name</label>
                            <input
                                type="text"
                                bind:value={editForm.lastName}
                                class="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            />
                        </div>
                        <div class="w-1/2">
                            <label class="block text-sm font-medium text-gray-700">First Name</label>
                            <input
                                type="text"
                                bind:value={editForm.firstName}
                                class="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            />
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Section Group ID</label>
                        <input
                            type="number"
                            bind:value={editForm.sectionGroupId}
                            class="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Contact Date</label>
                        <input
                            type="date"
                            bind:value={editForm.contactDate}
                            class="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Contacted By (User ID)</label>
                        <input
                            type="number"
                            bind:value={editForm.contactedBy}
                            class="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Status</label>
                        <select
                            bind:value={editForm.status}
                            class="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        >
                            {#each statuses as status}
                                <option value={status}>{status}</option>
                            {/each}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Comment</label>
                        <input
                            type="text"
                            bind:value={editForm.comment}
                            class="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        />
                    </div>
                </div>

                <div class="mt-4 flex justify-end gap-2">
                    <button
                        class="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                        on:click={closeModal}
                    >
                        Cancel
                    </button>
                    <button
                        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                        on:click={saveRecruit}
                    >
                        {isEditing ? 'Save Changes' : 'Add Recruit'}
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div> -->


 
<script context="module" lang="ts">
    // Your existing types for RecruitmentStatus and Recruitment
    export type RecruitmentStatus =
        | 'awaiting response'
        | 'interested'
        | 'participating'
        | 'registered'
        | 'not available'
        | 'to be contacted'
        | 'cancelled'
        | 'other'
        | 'withdrawn';

    export interface Recruitment {
        id: number;
        firstName: string;
        lastName: string;
        sectionGroupId: number;
        contactDate: string;
        contactedBy: number;
        status: RecruitmentStatus;
        statusUpdatedAt: string;
        comment: string | null;
        createdAt: string;
        updatedAt: string;
        sectionGroup?: { id: number; name: string }; // Expected from backend preload
        user?: { id: number; fullName: string | null }; // Expected from backend preload
    }

    // NEW: Types for the lookup data (users and section groups)
    interface LookupUser {
        id: number;
        fullName: string | null;
    }

    interface LookupSectionGroup {
        id: number;
        name: string;
    }
</script>

<script lang="ts">
  import toast from 'svelte-french-toast';
    import { onMount } from 'svelte';

    function formatDate(isoString: string | null | undefined): string {
        if (!isoString) return 'N/A';
        try {
            const date = new Date(isoString);
            return date.toISOString().split('T')[0];
        } catch (e) {
            console.error('Invalid date string for formatting:', isoString, e);
            return 'Invalid Date';
        }
    }

    let recruitment: Recruitment[] = [];
    // NEW: State variables to hold lookup data
    let users: LookupUser[] = [];
    let sectionGroups: LookupSectionGroup[] = [];

    let sortColumn: keyof Recruitment = 'lastName';
    let sortDirection: 'asc' | 'desc' = 'asc';

    const columns: (keyof Recruitment)[] = [
        'firstName',
        'lastName',
        'sectionGroupId',
        'contactDate',
        'contactedBy',
        'status',
        'comment',
    ];

    function sortTable(column: keyof Recruitment): void {
        if (sortColumn === column) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortColumn = column;
            sortDirection = 'asc';
        }

        recruitment = [...recruitment].sort((a, b) => {
            const aValue = (a[column] ?? '').toString();
            const bValue = (b[column] ?? '').toString();
            if (sortDirection === 'asc') {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        });
    }

    let showModal: boolean = false;
    let isEditing: boolean = false;
    let editForm: Partial<Recruitment> = {};

    const statuses: RecruitmentStatus[] = [
        'awaiting response',
        'interested',
        'participating',
        'registered',
        'not available',
        "to be contacted",
        'cancelled',
        'other',
        'withdrawn'
    ];

    // NEW: Fetch users function
    async function fetchUsers() {
        try {
            const res = await fetch('/api/users', { method: 'GET' });
            if (res.ok) {
                users = await res.json() as LookupUser[];
            } else {
                console.error('Failed to fetch users:', res.status, await res.text());
                toast.error('Failed to fetch user list.');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Error fetching user list.');
        }
    }

    // NEW: Fetch section groups function
    async function fetchSectionGroups() {
        try {
            const res = await fetch('/api/sectionGroups', { method: 'GET' });
            if (res.ok) {
                sectionGroups = await res.json() as LookupSectionGroup[];
            } else {
                console.error('Failed to fetch section groups:', res.status, await res.text());
                toast.error('Failed to fetch section group list.');
            }
        } catch (error) {
            console.error('Error fetching section groups:', error);
            toast.error('Error fetching section group list.');
        }
    }

    async function fetchRecruitment() {
        try {
            const res = await fetch('/api/recruitment', { method: 'GET' });
            if (res.ok) {
                recruitment = await res.json() as Recruitment[];
            } else {
                const errorBody = await res.text();
                console.error('Failed to fetch recruitment data:', res.status, errorBody);
                toast.error(`Failed to fetch recruitment data: ${res.statusText}`);
            }
        } catch (error) {
            console.error('Error fetching recruitment:', error);
            toast.error('Error fetching recruitment data.');
        }
    }

    // Updated openAddModal to default to first available ID if lists are populated
    function openAddModal(): void {
        isEditing = false;
        editForm = {
            firstName: '',
            lastName: '',
            sectionGroupId: sectionGroups.length > 0 ? sectionGroups[0].id : undefined, // Default to first ID or undefined
            contactDate: new Date().toISOString().split('T')[0],
            contactedBy: users.length > 0 ? users[0].id : undefined, // Default to first ID or undefined
            status: 'awaiting response',
            comment: null
        };
        showModal = true;
    }

    function openEditModal(recruit: Recruitment): void {
        isEditing = true;
        editForm = { ...recruit };
        if (editForm.contactDate) {
            editForm.contactDate = new Date(editForm.contactDate).toISOString().split('T')[0];
        }
        showModal = true;
    }

    async function saveRecruit(): Promise<void> {
        // Validation now checks for `undefined` if defaults aren't set
        if (!editForm.firstName || !editForm.lastName || editForm.sectionGroupId === undefined || editForm.contactedBy === undefined || !editForm.status) {
            toast.error('First Name, Last Name, Section Group, Contacted By, and Status are required.');
            return;
        }

        try {
            let res: Response;
            if (isEditing) {
                const id = Number(editForm.id);
                if (isNaN(id)) {
                    toast.error('Invalid ID for editing.');
                    return;
                }

                const payload: Partial<Omit<Recruitment, 'id' | 'createdAt' | 'updatedAt' | 'statusUpdatedAt' | 'sectionGroup' | 'user'>> = { // Omit related objects
                    firstName: editForm.firstName,
                    lastName: editForm.lastName,
                    sectionGroupId: editForm.sectionGroupId,
                    contactDate: editForm.contactDate,
                    contactedBy: editForm.contactedBy,
                    status: editForm.status,
                    comment: editForm.comment === undefined ? null : editForm.comment,
                };

                res = await fetch(`/api/recruitment/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error(`Failed to update recruit: ${res.statusText}`);
                toast.success('Recruitment updated successfully!');

            } else {
                const payload: Omit<Recruitment, 'id' | 'createdAt' | 'updatedAt' | 'statusUpdatedAt' | 'sectionGroup' | 'user'> = { // Omit related objects
                    firstName: editForm.firstName,
                    lastName: editForm.lastName,
                    sectionGroupId: editForm.sectionGroupId,
                    contactDate: editForm.contactDate!,
                    contactedBy: editForm.contactedBy!,
                    status: editForm.status!,
                    comment: editForm.comment === undefined ? null : editForm.comment,
                };

                res = await fetch('/api/recruitment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error(`Failed to add recruit: ${res.statusText}`);
                toast.success('Recruitment added successfully!');
            }

            await fetchRecruitment();
            closeModal();
        } catch (error) {
            console.error('Error saving recruit:', error);
            toast.error('Failed to save recruit: ' + (error instanceof Error ? error.message : String(error)));
        }
    }

    function closeModal(): void {
        showModal = false;
        editForm = {};
    }

    async function deleteRecruit(id: number): Promise<void> {
        if (confirm('Are you sure you want to delete this recruit?')) {
            try {
                const res = await fetch(`/api/recruitment/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error(`Failed to delete recruit: ${res.statusText}`);
                toast.success('Recruitment deleted successfully!');
                await fetchRecruitment();
            } catch (error) {
                console.error('Error deleting recruit:', error);
                toast.error('Failed to delete recruit: ' + (error instanceof Error ? error.message : String(error)));
            }
        }
    }

    async function checkAndUpdateStatus(firstName: string, lastName: string, action: 'register' | 'withdraw'): Promise<void> {
        const recruit = recruitment.find(
            r => r.firstName.toLowerCase() === firstName.toLowerCase() && r.lastName.toLowerCase() === lastName.toLowerCase()
        );
        if (!recruit) {
            toast.error(`Recruitment for ${firstName} ${lastName} not found.`);
            return;
        }

        if (action === 'register' && !confirm(`Confirm registration for ${firstName} ${lastName}?`)) return;
        if (action === 'withdraw' && !confirm(`Confirm withdrawal for ${firstName} ${lastName}?`)) return;

        try {
            const updatedRecruitPayload: Partial<Recruitment> = {
                status: action === 'register' ? 'registered' : 'withdrawn'
            };

            const id = recruit.id;

            const res = await fetch(`/api/recruitment/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedRecruitPayload)
            });
            if (!res.ok) throw new Error(`Failed to ${action} recruit: ${res.statusText}`);
            toast.success(`Recruitment status updated to '${updatedRecruitPayload.status}' for ${firstName} ${lastName}!`);
            await fetchRecruitment();
        } catch (error) {
            console.error(`Error ${action}ing recruit:`, error);
            toast.error(`Failed to ${action} recruit: ` + (error instanceof Error ? error.message : String(error)));
        }
    }

    function registerRecruit(firstName: string, lastName: string): void {
        checkAndUpdateStatus(firstName, lastName, 'register');
    }

    function withdrawRecruit(firstName: string, lastName: string): void {
        checkAndUpdateStatus(firstName, lastName, 'withdraw');
    }

    // Fetch all necessary data on component mount
    onMount(async () => {
        await Promise.all([
            fetchRecruitment(),
            fetchUsers(),
            fetchSectionGroups()
        ]);
    });
</script>

<div class="container mx-auto p-4">
    <div class="mb-4 flex justify-between">
        <button
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            on:click={openAddModal}
        >
            Add New Recruit
        </button>
        <div class="space-x-2">
            <button
                class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                on:click={() => registerRecruit('John', 'Smith')}
            >
                Test Register John Smith
            </button>
            <button
                class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                on:click={() => withdrawRecruit('John', 'Smith')}
            >
                Test Withdraw John Smith
            </button>
        </div>
    </div>

    <div class="overflow-x-auto">
        <table class="min-w-full bg-white border border-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    {#each columns as column (column)}
                        <th
                            class="px-4 py-2 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                            on:click={() => sortTable(column)}
                        >
                            {column === 'sectionGroupId' ? 'Section Group ID' :
                            column === 'contactDate' ? 'Contact Date' :
                            column === 'contactedBy' ? 'Contacted By' :
                            column.charAt(0).toUpperCase() + column.slice(1).replace(/([A-Z])/g, ' $1')}
                            {#if sortColumn === column}
                                {sortDirection === 'asc' ? '↑' : '↓'}
                            {/if}
                        </th>
                    {/each}
                    <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
            </thead>
            <tbody>
                {#each recruitment as recruit (recruit.id)}
                    <tr class="border-t hover:bg-gray-50">
                        <td class="px-4 py-2 text-sm text-gray-600">{recruit.firstName}</td>
                        <td class="px-4 py-2 text-sm text-gray-600">{recruit.lastName}</td>
                        <td class="px-4 py-2 text-sm text-gray-600">
                            {recruit.sectionGroup?.name ?? recruit.sectionGroupId} </td>
                        <td class="px-4 py-2 text-sm text-gray-600">{formatDate(recruit.contactDate)}</td>
                        <td class="px-4 py-2 text-sm text-gray-600">
                            {recruit.user?.fullName ?? recruit.contactedBy} </td>
                        <td class="px-4 py-2 text-sm text-gray-600">{recruit.status}</td>
                        <td class="px-4 py-2 text-sm text-gray-600">{recruit.comment ?? 'N/A'}</td>
                        <td class="px-4 py-2 text-sm">
                            <button
                                class="text-blue-500 hover:text-blue-700 mr-2"
                                on:click={() => openEditModal(recruit)}
                            >
                                Edit
                            </button>
                            <button
                                class="text-red-500 hover:text-red-700"
                                on:click={() => deleteRecruit(recruit.id)}
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>

    {#if showModal}
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white px-4 py-2 rounded-lg max-w-lg w-full">
                <h2 class="text-xl font-semibold mb-4">{isEditing ? 'Edit Recruit' : 'Add Recruit'}</h2>
                <div class="grid grid-cols-1 gap-4">
                    <div class="flex gap-4">
                        <div class="w-1/2">
                            <label class="block text-sm font-medium text-gray-700">Last Name</label>
                            <input
                                type="text"
                                bind:value={editForm.lastName}
                                class="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            />
                        </div>
                        <div class="w-1/2">
                            <label class="block text-sm font-medium text-gray-700">First Name</label>
                            <input
                                type="text"
                                bind:value={editForm.firstName}
                                class="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            />
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Section Group</label>
                        <select
                            bind:value={editForm.sectionGroupId}
                            class="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        >
                            {#if !editForm.sectionGroupId && !isEditing} <option value={undefined} disabled selected>Select a section group</option>
                            {/if}
                            {#each sectionGroups as sg (sg.id)}
                                <option value={sg.id}>{sg.name}</option>
                            {/each}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Contact Date</label>
                        <input
                            type="date"
                            bind:value={editForm.contactDate}
                            class="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Contacted By</label>
                        <select
                            bind:value={editForm.contactedBy}
                            class="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        >
                            {#if !editForm.contactedBy && !isEditing} <option value={undefined} disabled selected>Select a user</option>
                            {/if}
                            {#each users as user (user.id)}
                                <option value={user.id}>{user.fullName}</option>
                            {/each}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Status</label>
                        <select
                            bind:value={editForm.status}
                            class="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        >
                            {#each statuses as status}
                                <option value={status}>{status}</option>
                            {/each}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Comment</label>
                        <input
                            type="text"
                            bind:value={editForm.comment}
                            class="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        />
                    </div>
                </div>

                <div class="mt-4 flex justify-end gap-2">
                    <button
                        class="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                        on:click={closeModal}
                    >
                        Cancel
                    </button>
                    <button
                        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                        on:click={saveRecruit}
                    >
                        {isEditing ? 'Save Changes' : 'Add Recruit'}
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div> 