<!-- 
 
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
    import { onMount, onDestroy } from 'svelte';

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


// NEW: State for the check status date/time input
      let checkStatusDateTime: string | null = null; // Will store YYYY-MM-DDTHH:mm string
      
    // NEW: Function to get current local datetime in YYYY-MM-DDTHH:mm format
     function getLocalDatetimeString(date: Date): string {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    async function performStatusCheck(trigger: 'manual' | 'automatic'): Promise<void> {
        if (!checkStatusDateTime) {
            if (trigger === 'manual') {
                alert('Please select a date and time for the status check to run.');
            }
            return; // If no time is set, we can't perform a check
        }

        // Convert the user's set time (string) to a Date object for comparison
        // Note: new Date() will interpret 'YYYY-MM-DDTHH:mm' as local time.
        const userSetThreshold = new Date(checkStatusDateTime);

        // Crucial logic: If it's an automatic check AND the user's set time is in the future,
        // then do NOT make the backend API call yet.
        if (trigger === 'automatic' && userSetThreshold.getTime() > Date.now()) {
            console.log(`Automatic status check: User-set time (${checkStatusDateTime}) is in the future. Skipping API call.`);
            // Optional: You could show a subtle message to the user that it's scheduled
            // alert(`Status check is scheduled for ${checkStatusDateTime}.`);
            return;
        }

        // If we reach here, it's either a manual trigger, or an automatic trigger where the time has passed.
        try {
            const res = await fetch('/api/recruitment/check-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ checkDateTime: checkStatusDateTime }) // Send the user's set time
            });

            if (res.ok) {
                const result = await res.json();
                alert(result.message);
                await fetchRecruitment(); // Refresh the table data

                // --- CHANGE 3: Persist the checkStatusDateTime after a successful manual run ---
                if (trigger === 'manual') {
                    localStorage.setItem('lastCheckStatusDateTime', checkStatusDateTime);
                }

            } else {
                const errorBody = await res.text();
                console.error('Failed to perform status check:', res.status, errorBody);
                alert(`Failed to perform status check: ${res.statusText}`);
            }
        } catch (error) {
            console.error('Error performing status check:', error);
            alert('Error communicating with the server for status check.');
        }
    }


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

   

    // Fetch all necessary data on component mount
    onMount(async () => {
        // Load persisted checkStatusDateTime from localStorage
        const persistedTime = localStorage.getItem('lastCheckStatusDateTime');
        if (persistedTime) {
            checkStatusDateTime = persistedTime;
        } else {
            // Optional: You can set a default value in the input field if no value is persisted,
            // but remember it won't trigger the check automatically unless its time has passed.
            // For example, to default to current time for display:
            // checkStatusDateTime = getLocalDatetimeString(new Date());
        }

        await Promise.all([
            fetchRecruitment(), // Initial data fetch
            fetchUsers(),
            fetchSectionGroups()
        ]);

        // Perform an automatic check based on the loaded (or null) checkStatusDateTime.
        // This will only make the API call if checkStatusDateTime is set AND its time has passed.
        await performStatusCheck('automatic');
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
       
    </div>


     <div class="mb-4 p-4 border rounded-lg bg-yellow-50 flex items-center space-x-4">
        <label for="statusCheckTime" class="text-sm font-medium text-gray-700">Change Status to "To Be Contacted" if "Awaiting Response" and `statusUpdatedAt` is BEFORE:</label>
        <input
            type="datetime-local"
            id="statusCheckTime"
            bind:value={checkStatusDateTime}
            class="mt-1 block border border-gray-300 rounded-md p-2"
        />
        <button
            class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
            on:click={() => performStatusCheck('manual')}
        >
            Run Status Check
        </button>
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
                            <label class="block text-sm font-medium text-gray-700">First Name</label>
                            <input
                                type="text"
                                bind:value={editForm.firstName}
                                class="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            />
                        </div>

                        <div class="w-1/2">
                            <label class="block text-sm font-medium text-gray-700">Last Name</label>
                            <input
                                type="text"
                                bind:value={editForm.lastName}
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
</div>  -->


<!-- <script context="module" lang="ts">
  // Types for RecruitmentStatus and Recruitment
  export type RecruitmentStatus =
    | 'awaiting response'
    | 'interested'
    | 'participating'
    | 'registered'
    | 'not available'
    | 'to be contacted'
    | 'cancelled'
    | 'other'
    | 'withdrawn'

  export interface Recruitment {
    id: number
    firstName: string
    lastName: string
    sectionGroupId: number
    contactDate: string
    contactedBy: number
    status: RecruitmentStatus
    statusUpdatedAt: string
    comment: string | null
    createdAt: string
    updatedAt: string
    sectionGroup?: { id: number; name: string }
    user?: { id: number; fullName: string | null }
  }

  interface LookupUser {
    id: number
    fullName: string | null
  }

  interface LookupSectionGroup {
    id: number
    name: string
  }
</script>

<script lang="ts">
  import toast from 'svelte-french-toast'
  import { onMount, onDestroy } from 'svelte'
  import { browser } from '$app/environment' // Import for browser check

  // Format date for display
  function formatDate(isoString: string | null | undefined): string {
    if (!isoString) return 'N/A'
    try {
      const date = new Date(isoString)
      return date.toISOString().split('T')[0]
    } catch (e) {
      console.error('Invalid date string for formatting:', isoString, e)
      return 'Invalid Date'
    }
  }

  let recruitment: Recruitment[] = []
  let users: LookupUser[] = []
  let sectionGroups: LookupSectionGroup[] = []

  let sortColumn: keyof Recruitment = 'lastName'
  let sortDirection: 'asc' | 'desc' = 'asc'

  const columns: (keyof Recruitment)[] = [
    'firstName',
    'lastName',
    'sectionGroupId',
    'contactDate',
    'contactedBy',
    'status',
    'comment',
  ]

  function sortTable(column: keyof Recruitment): void {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'
    } else {
      sortColumn = column
      sortDirection = 'asc'
    }

    recruitment = [...recruitment].sort((a, b) => {
      const aValue = (a[column] ?? '').toString()
      const bValue = (b[column] ?? '').toString()
      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue)
      } else {
        return bValue.localeCompare(aValue) // Fixed sorting bug
      }
    })
  }

  let showModal: boolean = false
  let isEditing: boolean = false
  let editForm: Partial<Recruitment> = {}

  const statuses: RecruitmentStatus[] = [
    'awaiting response',
    'interested',
    'participating',
    'registered',
    'not available',
    'to be contacted',
    'cancelled',
    'other',
    'withdrawn',
  ]

  let checkStatusDateTime: string | null = null
  let statusCheckTimeout: number | null = null // Use number for browser setTimeout

  // Persist checkStatusDateTime and schedule check when it changes
  $: if (browser) { // Guard with browser check
    if (checkStatusDateTime) {
      localStorage.setItem('lastCheckStatusDateTime', checkStatusDateTime)
      scheduleStatusCheck()
    } else {
      localStorage.removeItem('lastCheckStatusDateTime')
      if (statusCheckTimeout) {
        clearTimeout(statusCheckTimeout)
        statusCheckTimeout = null
      }
    }
  }

  // Schedule status check for when checkStatusDateTime is reached
  function scheduleStatusCheck() {
    if (statusCheckTimeout) {
      clearTimeout(statusCheckTimeout)
    }

    if (!checkStatusDateTime) return

    const userSetThreshold = new Date(checkStatusDateTime).getTime()
    const now = Date.now()
    const delay = userSetThreshold - now

    if (delay > 0) {
      console.log(`Scheduling status check for ${checkStatusDateTime} (${delay / 1000} seconds from now)`)
      toast.success(`Status check scheduled for ${new Date(checkStatusDateTime).toLocaleString()}`)
      statusCheckTimeout = setTimeout(() => {
        performStatusCheck('automatic')
      }, delay)
    } else if (delay <= 0) {
      performStatusCheck('automatic')
    }
  }

  let hasStatusBeenChecked = false // Track once per session

async function performStatusCheck(trigger: 'manual' | 'automatic'): Promise<void> {
  if (!checkStatusDateTime) {
    if (trigger === 'manual') {
  const selectedTime = new Date(checkStatusDateTime!).getTime()
  if (isNaN(selectedTime)) {
    toast.error('Invalid date/time selected.')
    return
  }

  if (selectedTime > Date.now()) {
    toast.error('The selected date/time is in the future. Please wait or use automatic scheduling.')
    return
  }
}

  // 🛡️ Prevent repeated automatic checks
  if (trigger === 'automatic') {
    if (hasStatusBeenChecked) {
      console.log('Automatic check skipped: already done this session.')
      return
    }

    const userSetThreshold = new Date(checkStatusDateTime!).getTime()
    if (userSetThreshold > Date.now()) {
      console.log(`Automatic status check: Time (${checkStatusDateTime}) is still in the future.`)
      return
    }

    hasStatusBeenChecked = true // ✅ Mark as done
  }

  try {
    const res = await fetch('/api/recruitment/check-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkDateTime: checkStatusDateTime }),
    })

    if (res.ok) {
      const result = await res.json()
      toast.success(result.message)
      await fetchRecruitment()
      if (statusCheckTimeout) {
        clearTimeout(statusCheckTimeout)
        statusCheckTimeout = null
      }
    } else {
      const errorBody = await res.json()
      console.error('Failed to perform status check:', res.status, errorBody)
      toast.error(errorBody.message || `Failed to perform status check: ${res.statusText}`)
    }
  } catch (error) {
    console.error('Error performing status check:', error)
    toast.error('Error communicating with the server for status check.')
  }
}


  async function fetchUsers() {
    try {
      const res = await fetch('/api/users', { method: 'GET' })
      if (res.ok) {
        users = (await res.json()) as LookupUser[]
      } else {
        console.error('Failed to fetch users:', res.status, await res.text())
        toast.error('Failed to fetch user list.')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Error fetching user list.')
    }
  }

  async function fetchSectionGroups() {
    try {
      const res = await fetch('/api/sectionGroups', { method: 'GET' })
      if (res.ok) {
        sectionGroups = (await res.json()) as LookupSectionGroup[]
      } else {
        console.error('Failed to fetch section groups:', res.status, await res.text())
        toast.error('Failed to fetch section group list.')
      }
    } catch (error) {
      console.error('Error fetching section groups:', error)
      toast.error('Error fetching section group list.')
    }
  }

  async function fetchRecruitment() {
    try {
      const res = await fetch('/api/recruitment', { method: 'GET' })
      if (res.ok) {
        recruitment = (await res.json()) as Recruitment[]
      } else {
        const errorBody = await res.text()
        console.error('Failed to fetch recruitment data:', res.status, errorBody)
        toast.error(`Failed to fetch recruitment data: ${res.statusText}`)
      }
    } catch (error) {
      console.error('Error fetching recruitment:', error)
      toast.error('Error fetching recruitment data.')
    }
  }

  function openAddModal(): void {
    isEditing = false
    editForm = {
      firstName: '',
      lastName: '',
      sectionGroupId: sectionGroups.length > 0 ? sectionGroups[0].id : undefined,
      contactDate: new Date().toISOString().split('T')[0],
      contactedBy: users.length > 0 ? users[0].id : undefined,
      status: 'awaiting response',
      comment: null,
    }
    showModal = true
  }

  function openEditModal(recruit: Recruitment): void {
    isEditing = true
    editForm = { ...recruit }
    if (editForm.contactDate) {
      editForm.contactDate = new Date(editForm.contactDate).toISOString().split('T')[0]
    }
    showModal = true
  }

  async function saveRecruit(): Promise<void> {
    if (
      !editForm.firstName ||
      !editForm.lastName ||
      editForm.sectionGroupId === undefined ||
      editForm.contactedBy === undefined ||
      !editForm.status
    ) {
      toast.error('First Name, Last Name, Section Group, Contacted By, and Status are required.')
      return
    }

    try {
      let res: Response
      if (isEditing) {
        const id = Number(editForm.id)
        if (isNaN(id)) {
          toast.error('Invalid ID for editing.')
          return
        }

        const payload: Partial<Omit<Recruitment, 'id' | 'createdAt' | 'updatedAt' | 'statusUpdatedAt' | 'sectionGroup' | 'user'>> = {
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          sectionGroupId: editForm.sectionGroupId,
          contactDate: editForm.contactDate,
          contactedBy: editForm.contactedBy,
          status: editForm.status,
          comment: editForm.comment === undefined ? null : editForm.comment,
        }

        res = await fetch(`/api/recruitment/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(`Failed to update recruit: ${res.statusText}`)
        toast.success('Recruitment updated successfully!')
      } else {
        const payload: Omit<Recruitment, 'id' | 'createdAt' | 'updatedAt' | 'statusUpdatedAt' | 'sectionGroup' | 'user'> = {
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          sectionGroupId: editForm.sectionGroupId!,
          contactDate: editForm.contactDate!,
          contactedBy: editForm.contactedBy!,
          status: editForm.status!,
          comment: editForm.comment === undefined ? null : editForm.comment,
        }

        res = await fetch('/api/recruitment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(`Failed to add recruit: ${res.statusText}`)
        toast.success('Recruitment added successfully!')
      }

      await fetchRecruitment()
      closeModal()
    } catch (error) {
      console.error('Error saving recruit:', error)
      toast.error('Failed to save recruit: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  function closeModal(): void {
    showModal = false
    editForm = {}
  }

  async function deleteRecruit(id: number): Promise<void> {
    if (confirm('Are you sure you want to delete this recruit?')) {
      try {
        const res = await fetch(`/api/recruitment/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error(`Failed to delete recruit: ${res.statusText}`)
        toast.success('Recruitment deleted successfully!')
        await fetchRecruitment()
      } catch (error) {
        console.error('Error deleting recruit:', error)
        toast.error('Failed to delete recruit: ' + (error instanceof Error ? error.message : String(error)))
      }
    }
  }

  async function checkAndUpdateStatus(firstName: string, lastName: string, action: 'register' | 'withdraw'): Promise<void> {
    const recruit = recruitment.find(
      (r) => r.firstName.toLowerCase() === firstName.toLowerCase() && r.lastName.toLowerCase() === lastName.toLowerCase()
    )
    if (!recruit) {
      toast.error(`Recruitment for ${firstName} ${lastName} not found.`)
      return
    }

    if (action === 'register' && !confirm(`Confirm registration for ${firstName} ${lastName}?`)) return
    if (action === 'withdraw' && !confirm(`Confirm withdrawal for ${firstName} ${lastName}?`)) return

    try {
      const updatedRecruitPayload: Partial<Recruitment> = {
        status: action === 'register' ? 'registered' : 'withdrawn',
      }

      const id = recruit.id

      const res = await fetch(`/api/recruitment/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRecruitPayload),
      })
      if (!res.ok) throw new Error(`Failed to ${action} recruit: ${res.statusText}`)
      toast.success(`Recruitment status updated to '${updatedRecruitPayload.status}' for ${firstName} ${lastName}!`)
      await fetchRecruitment()
    } catch (error) {
      console.error(`Error ${action}ing recruit:`, error)
      toast.error(`Failed to ${action} recruit: ` + (error instanceof Error ? error.message : String(error)))
    }
  }

  onMount(async () => {
    if (browser) { // Load persisted time only in browser
      const persistedTime = localStorage.getItem('lastCheckStatusDateTime')
      if (persistedTime) {
        checkStatusDateTime = persistedTime
      }
    }
    await Promise.all([fetchRecruitment(), fetchUsers(), fetchSectionGroups()])
    scheduleStatusCheck()
  })

  onDestroy(() => {
    if (statusCheckTimeout) {
      clearTimeout(statusCheckTimeout)
    }
  })
}
</script>

<div class="container mx-auto p-4">
  <div class="mb-4 flex justify-between">
    <button
      class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
      on:click={openAddModal}
    >
      Add New Recruit
    </button>
  </div>

  <div class="mb-4 p-4 border rounded-lg bg-yellow-50 flex items-center space-x-4">
    <label for="statusCheckTime" class="text-sm font-medium text-gray-700">
      Change Status to "To Be Contacted" if "Awaiting Response" at or after:
    </label>
   <input
  type="datetime-local"
  id="statusCheckTime"
  bind:value={checkStatusDateTime}
  min={new Date().toISOString().slice(0, 16)} 
  class="mt-1 block border border-gray-300 rounded-md p-2"
/>
    <button
      class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
      on:click={() => performStatusCheck('manual')}
    >
      Run Status Check Now
    </button>
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
              {column === 'sectionGroupId'
                ? 'Section Group ID'
                : column === 'contactDate'
                  ? 'Contact Date'
                  : column === 'contactedBy'
                    ? 'Contacted By'
                    : column.charAt(0).toUpperCase() + column.slice(1).replace(/([A-Z])/g, ' $1')}
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
            <td class="px-4 py-2 text-sm text-gray-600">{recruit.sectionGroup?.name ?? recruit.sectionGroupId}</td>
            <td class="px-4 py-2 text-sm text-gray-600">{formatDate(recruit.contactDate)}</td>
            <td class="px-4 py-2 text-sm text-gray-600">{recruit.user?.fullName ?? recruit.contactedBy}</td>
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

    // here
    {#if checkStatusDateTime}
  <p class="text-sm text-gray-500">
    Scheduled check: <strong>{new Date(checkStatusDateTime).toLocaleString()}</strong>
  </p>
{/if}
  </div>

  {#if showModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white px-4 py-2 rounded-lg max-w-lg w-full">
        <h2 class="text-xl font-semibold mb-4">{isEditing ? 'Edit Recruit' : 'Add Recruit'}</h2>
        <div class="grid grid-cols-1 gap-4">
          <div class="flex gap-4">
            <div class="w-1/2">
              <label class="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                bind:value={editForm.firstName}
                class="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div class="w-1/2">
              <label class="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                bind:value={editForm.lastName}
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
              {#if !editForm.sectionGroupId && !isEditing}
                <option value={undefined} disabled selected>Select a section group</option>
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
              {#if !editForm.contactedBy && !isEditing}
                <option value={undefined} disabled selected>Select a user</option>
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
</div> -->







<script context="module" lang="ts">
    // --- Type Definitions for Frontend Model and Lookups ---

    // Recruitment Statuses: Matches the enum defined in the backend
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

    // Interface for a user object as returned by the lookup API
    interface LookupUser {
        id: number;
        fullName: string | null; // Matches the 'fullName' property on the backend User model
    }

    // Interface for a section group object as returned by the lookup API
    interface LookupSectionGroup {
        id: number;
        name: string; // Matches the 'name' property on the backend SectionGroup model
    }

    // Main Recruitment interface: Matches the backend model after eager loading and serialization
    export interface Recruitment {
        id: number;
        firstName: string;
        lastName: string;
        sectionGroupId: number; // Foreign key ID
        contactDate: string; // ISO date string (YYYY-MM-DD)
        contactedBy: number; // Foreign key ID
        status: RecruitmentStatus;
        // statusUpdatedAt: string; // ISO timestamp string
        comment: string | null; // Nullable string
        createdAt: string; // ISO timestamp string
        updatedAt: string; // ISO timestamp string
        // Eager-loaded relationships (optional as they might not always be preloaded or exist)
        sectionGroup?: LookupSectionGroup;
        user?: LookupUser;
    }
</script>

<script lang="ts">
    import toast from 'svelte-french-toast'; // For toast notifications
    import { onMount, onDestroy } from 'svelte'; // Svelte lifecycle hooks
    import { browser } from '$app/environment'; // To check if code is running in the browser

    // --- State Variables ---
    let recruitment: Recruitment[] = []; // Main array of recruitment records
    let users: LookupUser[] = []; // Array for user lookup dropdown
    let sectionGroups: LookupSectionGroup[] = []; // Array for section group lookup dropdown

    // --- Sorting State ---
    let sortColumn: keyof Recruitment = 'lastName'; // Default sort column
    let sortDirection: 'asc' | 'desc' = 'asc'; // Default sort direction

    // --- Modal State for Add/Edit Form ---
    let showModal = false; // Controls modal visibility
    let isEditing = false; // True if editing, false if adding new
    let editForm: Partial<Recruitment> = {}; // Form data for modal (Partial to allow incomplete object)

    // --- Status Check Scheduling State ---
    // Stores the datetime string from the user's input for status check.
    // Initialized to null, will be loaded from localStorage.
    let checkStatusDateTime: string | null = null;
    // Timeout ID for the scheduled automatic check
    let statusCheckTimeout: ReturnType<typeof setTimeout> | null = null;
    // Flag to prevent redundant automatic checks on a single page load
    let hasStatusBeenChecked = false;

    // --- Status Options (matches backend enum) ---
    const statuses: RecruitmentStatus[] = [
        'awaiting response',
        'interested',
        'participating',
        'registered',
        'not available',
        'to be contacted',
        'cancelled',
        'other',
        'withdrawn',
    ];

    // --- Columns for Table Display (determines order and headers) ---
    const columns: (keyof Recruitment)[] = [
        'firstName',
        'lastName',
        'sectionGroupId', // Displays Section Group Name via `recruit.sectionGroup?.name`
        'contactDate',
        'contactedBy', // Displays User Full Name via `recruit.user?.fullName`
        'status',
        'comment',
    ];

    // --- Utility Functions ---

    /**
     * Formats an ISO datetime string to YYYY-MM-DD for display.
     * Handles null/undefined inputs gracefully.
     * @param isoString The ISO datetime string.
     * @returns Formatted date string or 'N/A'/'Invalid Date'.
     */
    function formatDate(isoString: string | null | undefined): string {
        if (!isoString) return 'N/A';
        try {
            return new Date(isoString).toISOString().split('T')[0];
        } catch {
            return 'Invalid Date';
        }
    }

    /**
     * Generates a YYYY-MM-DDTHH:mm string from a Date object for datetime-local input.
     * @param date The Date object.
     * @returns Formatted local datetime string.
     */
    function getLocalDatetimeString(date: Date): string {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    /**
     * Sorts the recruitment table by the specified column and direction.
     * @param column The column to sort by.
     */
    function sortTable(column: keyof Recruitment) {
        if (sortColumn === column) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortColumn = column;
            sortDirection = 'asc';
        }

        // Create a copy to trigger Svelte's reactivity for array updates
        recruitment = [...recruitment].sort((a, b) => {
            // Access values using bracket notation, handle null/undefined, convert to string, then to lowercase for case-insensitive sort
            const aVal = (a[column] ?? '').toString().toLowerCase();
            const bVal = (b[column] ?? '').toString().toLowerCase();

            if (sortDirection === 'asc') return aVal.localeCompare(bVal);
            else return bVal.localeCompare(aVal); // Corrected descending sort
        });
    }

    /**
     * Schedules the automatic status check based on `checkStatusDateTime`.
     * Clears any existing timeout before setting a new one.
     */
    function scheduleStatusCheck() {
        if (statusCheckTimeout) clearTimeout(statusCheckTimeout); // Clear existing timeout
        if (!checkStatusDateTime) return; // Don't schedule if no time is set

        const scheduledTime = new Date(checkStatusDateTime).getTime(); // Convert user-set string to milliseconds
        const now = Date.now(); // Current time in milliseconds
        const delay = scheduledTime - now; // Calculate delay

        if (delay > 0) {
            // Schedule if time is in the future
            toast.success(`Status check scheduled for ${new Date(checkStatusDateTime).toLocaleString()}`);
            statusCheckTimeout = setTimeout(() => performStatusCheck('automatic'), delay);
        } else {
            // If the scheduled time is in the past or now, run immediately (automatic trigger)
            performStatusCheck('automatic');
        }
    }

    /**
     * Performs the status update check on the backend.
     * Can be triggered manually by a user or automatically by a scheduler.
     * @param trigger 'manual' for user click, 'automatic' for scheduled/on-load check.
     */
   async function performStatusCheck(trigger: 'manual' | 'automatic') {
    if (!checkStatusDateTime) {
        if (trigger === 'manual') {
            toast.error('Please select a date and time for the status check.');
        }
        return;
    }
        const utcISO = new Date(checkStatusDateTime).toISOString();
    try {
        const res = await fetch('/api/recruitment/check-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ checkDateTime: utcISO })
        });

        const result = await res.json();

        if (res.ok) {
            toast.success(result.message || 'Status check completed.');
            await fetchRecruitment(); // Refresh table
        } else {
            // Attempt to parse JSON error message from backend
            let errorMsg = `Failed to perform status check: ${res.statusText}`;
            try {
                const errorBody = await res.json();
                if (errorBody && typeof errorBody.message === 'string') {
                    errorMsg = errorBody.message;
                }
            } catch {
                // If JSON parsing fails, keep the generic errorMsg
            }
            toast.error(errorMsg);
        }
    } catch (error) {
        console.error('Error performing status check:', error);
        toast.error('Server communication error during status check.');
    }
}


    /**
     * Fetches all recruitment records from the backend.
     */
    async function fetchRecruitment() {
        try {
            const res = await fetch('/api/recruitment'); // SvelteKit proxy will handle /api/v1 prefix
            if (res.ok) {
                recruitment = await res.json() as Recruitment[];
                sortTable(sortColumn); // Sort initial data
            } else {
                toast.error('Failed to refresh recruitment data.');
            }
        } catch {
            toast.error('Could not load recruitment data.');
        }
    }

    /**
     * Fetches the list of users for dropdowns.
     */
    async function fetchUsers() {
        try {
            const res = await fetch('/api/users'); // SvelteKit proxy will handle /api/v1 prefix
            if (res.ok) users = await res.json() as LookupUser[];
            else toast.error('Failed to load users.');
        } catch {
            toast.error('Failed to load users.');
        }
    }

    /**
     * Fetches the list of section groups for dropdowns.
     * Corrected URL to '/api/section-groups' with hyphen.
     */
    async function fetchSectionGroups() {
        try {
            const res = await fetch('/api/sectionGroups'); // Corrected URL with hyphen
            if (res.ok) sectionGroups = await res.json() as LookupSectionGroup[];
            else toast.error('Failed to load section groups.');
        } catch {
            toast.error('Failed to load section groups.');
        }
    }

    /**
     * Opens the modal for adding a new recruit.
     * Initializes editForm with default values.
     */
    function openAddModal() {
        isEditing = false;
        editForm = {
            firstName: '',
            lastName: '',
            // Set default sectionGroupId and contactedBy from fetched lists if available, else undefined
            sectionGroupId: sectionGroups.length > 0 ? sectionGroups[0].id : undefined,
            contactDate: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
            contactedBy: users.length > 0 ? users[0].id : undefined,
            status: 'awaiting response',
            comment: null, // Initialize as null for nullable field
        };
        showModal = true;
    }

    /**
     * Opens the modal for editing an existing recruit.
     * Copies existing recruit data to editForm.
     * @param r The recruitment object to edit.
     */
    function openEditModal(r: Recruitment) {
        isEditing = true;
        editForm = { ...r }; // Create a shallow copy
        // Ensure contactDate is in YYYY-MM-DD format for type="date" input
        if (editForm.contactDate) {
            editForm.contactDate = new Date(editForm.contactDate).toISOString().slice(0, 10);
        }
        showModal = true;
    }

    /**
     * Closes the modal and resets the edit form.
     */
    function closeModal() {
        showModal = false;
        editForm = {};
    }

    /**
     * Saves a recruit (either adds new or updates existing).
     * Performs client-side validation before sending to backend.
     */
    async function saveRecruit() {
        // Client-side validation for required fields
        if (
            !editForm.firstName?.trim() ||
            !editForm.lastName?.trim() ||
            editForm.sectionGroupId === undefined || // Check for undefined directly
            editForm.contactedBy === undefined ||   // Check for undefined directly
            !editForm.status
        ) {
            toast.error('Please fill all required fields.');
            return;
        }

        try {
            let res: Response;
            // Payload for backend, omitting auto-generated/derived fields
            const basePayload = {
                firstName: editForm.firstName.trim(),
                lastName: editForm.lastName.trim(),
                sectionGroupId: editForm.sectionGroupId,
                contactDate: editForm.contactDate,
                contactedBy: editForm.contactedBy,
                status: editForm.status,
                comment: editForm.comment === undefined ? null : editForm.comment, // Handle undefined to null
            };

            if (isEditing) {
                if (!editForm.id) {
                    toast.error('Invalid recruit ID for editing.');
                    return;
                }
                const id = editForm.id;
                res = await fetch(`/api/recruitment/${id}`, {
                    method: 'PUT', // Matches backend PUT route
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(basePayload),
                });
                if (!res.ok) throw new Error(`Update failed: ${res.statusText}`);
                toast.success('Recruitment updated successfully.');
            } else {
                res = await fetch('/api/recruitment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(basePayload),
                });
                if (!res.ok) throw new Error(`Add failed: ${res.statusText}`);
                toast.success('Recruitment added successfully.');
            }

            await fetchRecruitment(); // Refresh data after successful operation
            closeModal();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save recruit.');
            console.error('Error saving recruit:', error);
        }
    }

    /**
     * Deletes a recruit record by ID after user confirmation.
     * @param id The ID of the recruit to delete.
     */
    async function deleteRecruit(id: number) {
        if (!confirm('Are you sure you want to delete this recruit?')) return;

        try {
            const res = await fetch(`/api/recruitment/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(`Delete failed: ${res.statusText}`);
            toast.success('Recruitment deleted.');
            await fetchRecruitment(); // Refresh data
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete recruit.');
            console.error('Error deleting recruit:', error);
        }
    }

    // --- Special Status Update Functions (Register/Withdraw) ---
    // These functions allow direct status updates from the main table UI.
    async function checkAndUpdateStatus(firstName: string, lastName: string, action: 'register' | 'withdraw') {
        const recruit = recruitment.find(
            (r) => r.firstName.toLowerCase() === firstName.toLowerCase() && r.lastName.toLowerCase() === lastName.toLowerCase()
        );
        if (!recruit) {
            toast.error(`Recruitment for ${firstName} ${lastName} not found.`);
            return;
        }

        if (action === 'register' && !confirm(`Confirm registration for ${firstName} ${lastName}?`)) return;
        if (action === 'withdraw' && !confirm(`Confirm withdrawal for ${firstName} ${lastName}?`)) return;

        try {
            const updatedRecruitPayload: Partial<Recruitment> = {
                status: action === 'register' ? 'registered' : 'withdrawn',
            };

            const id = recruit.id;

            const res = await fetch(`/api/recruitment/${id}`, {
                method: 'PUT', // Matches backend PUT route for update
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedRecruitPayload),
            });
            if (!res.ok) throw new Error(`Failed to ${action} recruit: ${res.statusText}`);
            toast.success(`Status updated for ${firstName} ${lastName} to '${updatedRecruitPayload.status}'!`);
            await fetchRecruitment(); // Refresh data
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

   function toUTCISOString(datetimeLocal: string): string {
    const localDate = new Date(datetimeLocal);
    const timezoneOffset = localDate.getTimezoneOffset(); // in minutes
    const utcDate = new Date(localDate.getTime() - timezoneOffset * 60000);
    return utcDate.toISOString();
}

    // onMount runs when the component is first mounted to the DOM.
    // It's used here for initial data fetching and loading persisted state.
  onMount(async () => {
    if (browser) {
        // Only load from localStorage, do NOT set default time
        const persistedTime = localStorage.getItem('lastCheckStatusDateTime');
        if (persistedTime) {
            checkStatusDateTime = persistedTime;
        }
    }

    // Fetch all necessary data concurrently
    try {
        await Promise.all([
            fetchRecruitment(),
            fetchUsers(),
            fetchSectionGroups()
        ]);
    } catch (error) {
        toast.error('Initial data load failed.');
        console.error('Error on initial data load:', error);
    }

    // Perform automatic status check ONLY if time is in the past
    if (browser) {
        await performStatusCheck('automatic');
    }
});

    // onDestroy runs when the component is unmounted from the DOM.
    // Used to clean up the scheduled timeout.
    onDestroy(() => {
        if (statusCheckTimeout) clearTimeout(statusCheckTimeout);
    });

    // --- Reactive Statements ---
    // This reactive statement runs whenever `checkStatusDateTime` changes.
    // It's responsible for persisting the value and rescheduling the automatic check.
    $: if (browser && checkStatusDateTime) {
	localStorage.setItem('lastCheckStatusDateTime', checkStatusDateTime);
   toast.success(`Next automatic check scheduled for ${new Date(checkStatusDateTime).toLocaleString()}`);
}
</script>

<div class="container mx-auto p-4 font-inter antialiased">
    <!-- Status check scheduling section -->
    <div class="mb-4 p-4 border rounded-lg bg-yellow-50 flex flex-wrap items-center space-x-4">
        <label for="statusCheckTime" class="text-sm font-medium text-gray-700 whitespace-nowrap">
            Change status to "To Be Contacted" if "Awaiting Response" and `statusUpdatedAt` is BEFORE:
        </label>
        <input
            type="datetime-local"
            id="statusCheckTime"
            bind:value={checkStatusDateTime}
            min={getLocalDatetimeString(new Date())} 
            class="flex-1 min-w-[200px] border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
        />
        <button
            class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out"
            on:click={() => performStatusCheck('manual')}
        >
            Run Status Check Now
        </button>
    </div>

    {#if checkStatusDateTime}
        <p class="text-sm text-gray-500 mb-4">
            Next automatic check scheduled for: <strong>{new Date(checkStatusDateTime).toLocaleString()}</strong>
        </p>
    {/if}

    <!-- Add new recruit button -->
    <div class="mb-4">
        <button
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out"
            on:click={openAddModal}
        >
            Add New Recruit
        </button>
    </div>

    <!-- Recruitment table -->
    <div class="overflow-x-auto rounded-lg shadow-md">
        <table class="min-w-full bg-white border border-gray-200">
            <thead class="bg-gray-100">
                <tr>
                    {#each columns as column (column)}
                        <th
                            class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                            on:click={() => sortTable(column)}
                        >
                            {column === 'sectionGroupId' ? 'Section Group' : // Updated header for clarity
                            column === 'contactDate' ? 'Contact Date' :
                            column === 'contactedBy' ? 'Contacted By' : // Updated header for clarity
                            column.charAt(0).toUpperCase() + column.slice(1).replace(/([A-Z])/g, ' $1')}
                            {#if sortColumn === column}
                                <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            {/if}
                        </th>
                    {/each}
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
                {#each recruitment as r (r.id)}
                    <tr class="hover:bg-gray-50 transition duration-100 ease-in-out">
                        <td class="px-4 py-2 text-sm text-gray-800">{r.firstName}</td>
                        <td class="px-4 py-2 text-sm text-gray-800">{r.lastName}</td>
                        <td class="px-4 py-2 text-sm text-gray-800">
                            {r.sectionGroup?.name ?? `ID: ${r.sectionGroupId}`} <!-- Display name or ID with label -->
                        </td>
                        <td class="px-4 py-2 text-sm text-gray-800">{formatDate(r.contactDate)}</td>
                        <td class="px-4 py-2 text-sm text-gray-800">
                            {r.user?.fullName ?? `ID: ${r.contactedBy}`} <!-- Display full name or ID with label -->
                        </td>
                        <td class="px-4 py-2 text-sm text-gray-800">{r.status}</td>
                        <td class="px-4 py-2 text-sm text-gray-800">{r.comment ?? 'N/A'}</td>
                        <td class="px-4 py-2 text-sm flex space-x-2">
                            <button
                                class="text-blue-600 hover:text-blue-800 transition duration-150 ease-in-out"
                                on:click={() => openEditModal(r)}
                            >
                                Edit
                            </button>
                            <button
                                class="text-red-600 hover:text-red-800 transition duration-150 ease-in-out"
                                on:click={() => deleteRecruit(r.id)}
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>

    <!-- Modal for Add/Edit Recruit -->
    {#if showModal}
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full transform transition-all duration-300 scale-100 opacity-100">
                <h2 class="text-2xl font-bold mb-4 text-gray-800">{isEditing ? 'Edit Recruit' : 'Add Recruit'}</h2>

                <div class="grid grid-cols-1 gap-4">
                    <div class="flex flex-col sm:flex-row gap-4">
                        <div class="flex-1">
                            <label class="block text-sm font-semibold text-gray-700 mb-1">First Name <span class="text-red-500">*</span></label>
                            <input
                                type="text"
                                bind:value={editForm.firstName}
                                class="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                            />
                        </div>
                        <div class="flex-1">
                            <label class="block text-sm font-semibold text-gray-700 mb-1">Last Name <span class="text-red-500">*</span></label>
                            <input
                                type="text"
                                bind:value={editForm.lastName}
                                class="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">Section Group <span class="text-red-500">*</span></label>
                        <select
                            bind:value={editForm.sectionGroupId}
                            class="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        >
                            {#if editForm.sectionGroupId === undefined || sectionGroups.length === 0}
                                <option value={undefined} disabled selected>Select a section group</option>
                            {/if}
                            {#each sectionGroups as sg (sg.id)}
                                <option value={sg.id}>{sg.name}</option>
                            {/each}
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">Contact Date <span class="text-red-500">*</span></label>
                        <input
                            type="date"
                            bind:value={editForm.contactDate}
                            class="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">Contacted By <span class="text-red-500">*</span></label>
                        <select
                            bind:value={editForm.contactedBy}
                            class="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        >
                            {#if editForm.contactedBy === undefined || users.length === 0}
                                <option value={undefined} disabled selected>Select a user</option>
                            {/if}
                            {#each users as user (user.id)}
                                <option value={user.id}>{user.fullName}</option>
                            {/each}
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">Status <span class="text-red-500">*</span></label>
                        <select
                            bind:value={editForm.status}
                            class="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        >
                            {#each statuses as statusOption (statusOption)}
                                <option value={statusOption}>{statusOption}</option>
                            {/each}
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">Comment (optional)</label>
                        <textarea
                            rows="3"
                            bind:value={editForm.comment}
                            class="w-full border border-gray-300 rounded-md p-2 resize-y focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                            placeholder="Add any additional comments here..."
                        ></textarea>
                    </div>
                </div>

                <div class="mt-6 flex justify-end space-x-4">
                    <button
                        class="bg-gray-300 hover:bg-gray-400 rounded-md px-4 py-2 transition duration-150 ease-in-out shadow-sm"
                        on:click={closeModal}
                    >
                        Cancel
                    </button>
                    <button
                        class="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 transition duration-150 ease-in-out shadow-sm"
                        on:click={saveRecruit}
                    >
                        {isEditing ? 'Save Changes' : 'Add Recruit'}
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    /* Add any custom styles here if not fully covered by Tailwind */
    :global(body) {
        @apply bg-gray-50;
    }
</style>
