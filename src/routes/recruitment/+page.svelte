

<script context="module" lang="ts">
  // --- Type Definitions ---

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

  export interface LookupUser {
    id: number;
    fullName: string | null;
  }

  export interface LookupSectionGroup {
    id: number;
    name: string;
  }

  export interface Recruitment {
    id: number;
    firstName: string;
    lastName: string;
    sectionGroupId: number;
    contactDate: string;
    contactedBy: number;
    status: RecruitmentStatus;
    comment: string | null;
    createdAt: string;
    updatedAt: string;
    sectionGroup?: LookupSectionGroup;
    user?: LookupUser;
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import toast from 'svelte-french-toast';

  // --- State ---
  let recruitment: Recruitment[] = [];
  let users: LookupUser[] = [];
  let sectionGroups: LookupSectionGroup[] = [];
  let sortColumn: keyof Recruitment = 'lastName';
  let sortDirection: 'asc' | 'desc' = 'asc';
  let showModal = false;
  let isEditing = false;
  let editForm: Partial<Recruitment> = {};
  let daysThreshold = 14;

  // New variable declaration for the datetime-local input binding
  let checkStatusDateTime: string | null = null;

  const statuses: RecruitmentStatus[] = [
    'awaiting response',
    'interested',
    'participating',
    'registered',
    'not available',
    'to be contacted',
    'cancelled',
    'other',
    'withdrawn'
  ];

  const columns: (keyof Recruitment)[] = [
    'firstName',
    'lastName',
    'sectionGroupId',
    'contactDate',
    'contactedBy',
    'status',
    'comment'
  ];

  // --- Utility Functions ---
  function formatDate(iso: string | null | undefined): string {
    if (!iso) return 'N/A';
    try {
      return new Date(iso).toISOString().split('T')[0];
    } catch {
      return 'Invalid Date';
    }
  }

  function getLocalDatetimeString(date: Date): string {
    const [yyyy, mm, dd, hh, min] = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
      String(date.getHours()).padStart(2, '0'),
      String(date.getMinutes()).padStart(2, '0')
    ];
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  function sortTable(column: keyof Recruitment) {
  if (sortColumn === column) {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn = column;
    sortDirection = 'asc';
  }

  recruitment = [...recruitment].sort((a, b) => {
    let aVal: string | number | Date | undefined;
    let bVal: string | number | Date | undefined;

    switch (column) {
      case 'contactDate':
        aVal = a.contactDate ? new Date(a.contactDate) : new Date(0);
        bVal = b.contactDate ? new Date(b.contactDate) : new Date(0);
        break;

      case 'sectionGroupId':
        // Sort by sectionGroup name if available, else by id number
        aVal = a.sectionGroup?.name?.toLowerCase() ?? a.sectionGroupId;
        bVal = b.sectionGroup?.name?.toLowerCase() ?? b.sectionGroupId;
        break;

      case 'contactedBy':
        // Sort by user fullName if available, else by contactedBy id
        aVal = a.user?.fullName?.toLowerCase() ?? a.contactedBy;
        bVal = b.user?.fullName?.toLowerCase() ?? b.contactedBy;
        break;

      default:
        // For other columns, convert to lowercase string to compare
        aVal = (a[column] ?? '').toString().toLowerCase();
        bVal = (b[column] ?? '').toString().toLowerCase();
    }

    // Now compare aVal and bVal depending on their type
    if (aVal instanceof Date && bVal instanceof Date) {
      return sortDirection === 'asc' ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime();
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }

    // Default string comparison
    return sortDirection === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });
}

  // --- CRUD & Status Check ---

  async function fetchRecruitment() {
    try {
      const res = await fetch('/api/recruitment');
      if (res.ok) {
        recruitment = await res.json();
        sortTable(sortColumn);
      } else {
        toast.error('Failed to refresh recruitment data.');
      }
    } catch {
      toast.error('Could not load recruitment data.');
    }
  }

  async function fetchUsers() {
    try {
      const res = await fetch('/api/users');
      users = res.ok ? await res.json() : [];
    } catch {
      toast.error('Failed to load users.');
    }
  }

  async function fetchSectionGroups() {
    try {
      const res = await fetch('/api/sectionGroups');
      sectionGroups = res.ok ? await res.json() : [];
    } catch {
      toast.error('Failed to load section groups.');
    }
  }

  async function performStatusCheck(trigger: 'manual' | 'automatic') {
    if (!daysThreshold || daysThreshold <= 0) {
      if (trigger === 'manual') toast.error('Please enter a valid number of days.');
      return;
    }

    try {
      const res = await fetch('/api/recruitment/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysThreshold })
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(result.message || 'Status check completed.');
        await fetchRecruitment();
      } else {
        toast.error(result.message || 'Status check failed.');
      }
    } catch (e) {
      console.error('Status check error:', e);
      toast.error('Server error during status check.');
    }
  }

  async function saveRecruit() {
    if (
      !editForm.firstName?.trim() ||
      !editForm.lastName?.trim() ||
      editForm.sectionGroupId === undefined ||
      editForm.contactedBy === undefined ||
      !editForm.status
    ) {
      toast.error('Please fill all required fields.');
      return;
    }

    const payload = {
      firstName: editForm.firstName.trim(),
      lastName: editForm.lastName.trim(),
      sectionGroupId: editForm.sectionGroupId,
      contactDate: editForm.contactDate,
      contactedBy: editForm.contactedBy,
      status: editForm.status,
      comment: editForm.comment ?? null
    };

    try {
      let res: Response;
      if (isEditing && editForm.id) {
        res = await fetch(`/api/recruitment/${editForm.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        toast.success('Recruitment updated successfully.');
      } else {
        res = await fetch('/api/recruitment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        toast.success('Recruitment added successfully.');
      }
      if (!res.ok) throw new Error(await res.text());
      await fetchRecruitment();
      closeModal();
    } catch (err) {
      console.error('Error saving recruit:', err);
      toast.error('Failed to save recruit.');
    }
  }

  async function deleteRecruit(id: number) {
    if (!confirm('Are you sure you want to delete this recruit?')) return;
    try {
      const res = await fetch(`/api/recruitment/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Recruitment deleted.');
      await fetchRecruitment();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete recruit.');
    }
  }

  function openAddModal() {
    isEditing = false;
    editForm = {
      firstName: '',
      lastName: '',
      sectionGroupId: sectionGroups[0]?.id,
      contactDate: new Date().toISOString().slice(0, 10),
      contactedBy: users[0]?.id,
      status: 'awaiting response',
      comment: null
    };
    showModal = true;
  }

  function openEditModal(r: Recruitment) {
    isEditing = true;
    editForm = {
      ...r,
      contactDate: r.contactDate.slice(0, 10)
    };
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editForm = {};
  }

  async function checkAndUpdateStatus(firstName: string, lastName: string, action: 'register' | 'withdraw') {
    const recruit = recruitment.find(
      (r) =>
        r.firstName.toLowerCase() === firstName.toLowerCase() &&
        r.lastName.toLowerCase() === lastName.toLowerCase()
    );
    if (!recruit) {
      toast.error(`${firstName} ${lastName} not found.`);
      return;
    }
    if (!confirm(`Confirm ${action} for ${firstName} ${lastName}?`)) return;

    try {
      const res = await fetch(`/api/recruitment/${recruit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'register' ? 'registered' : 'withdrawn' })
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`Recruit ${action}ed.`);
      await fetchRecruitment();
    } catch (err) {
      console.error(`${action} error:`, err);
      toast.error(`Failed to ${action} recruit.`);
    }
  }

  function registerRecruit(firstName: string, lastName: string) {
    checkAndUpdateStatus(firstName, lastName, 'register');
  }

  function withdrawRecruit(firstName: string, lastName: string) {
    checkAndUpdateStatus(firstName, lastName, 'withdraw');
  }

  // --- Lifecycle ---

  onMount(async () => {
    await Promise.all([fetchRecruitment(), fetchUsers(), fetchSectionGroups()]);
    if (browser) await performStatusCheck('automatic');
  });
</script>

<div class="mb-4 p-4 border rounded-lg bg-yellow-50 flex flex-wrap items-center space-x-4">
  <label
    for="thresholdInput"
    class="text-sm font-medium text-gray-700 whitespace-nowrap"
  >
    Change status to <strong>"To Be Contacted"</strong> if <strong>"Awaiting Response"</strong> and contact is older than:
  </label>
  <input
    id="thresholdInput"
    type="number"
    min="1"
    bind:value={daysThreshold}
    class="w-20 border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
  />
  <span class="text-sm text-gray-700">days</span>
  <button
    class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out"
    on:click={() => performStatusCheck('manual')}
  >
    Run Status Check Now
  </button>
</div>

<div class="container mx-auto p-4 font-inter antialiased">

 

  <!-- {#if checkStatusDateTime}
    <p class="text-sm text-gray-500 mb-4">
      Next automatic check scheduled for:
      <strong>{new Date(checkStatusDateTime).toLocaleString()}</strong>
    </p>
  {/if} -->


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
              {column === 'sectionGroupId'
                ? 'Section Group'
                : column === 'contactDate'
                ? 'Contact Date'
                : column === 'contactedBy'
                ? 'Contacted By'
                : column.charAt(0).toUpperCase() +
                  column.slice(1).replace(/([A-Z])/g, ' $1')}
              {#if sortColumn === column}
                <span class="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              {/if}
            </th>
          {/each}
          <th
            class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
          >
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        {#each recruitment as r (r.id)}
          <tr class="hover:bg-gray-50 transition duration-100 ease-in-out">
            <td class="px-4 py-2 text-sm text-gray-800">{r.firstName}</td>
            <td class="px-4 py-2 text-sm text-gray-800">{r.lastName}</td>
            <td class="px-4 py-2 text-sm text-gray-800">
              {r.sectionGroup?.name ?? `ID: ${r.sectionGroupId}`}
            </td>
            <td class="px-4 py-2 text-sm text-gray-800">{formatDate(r.contactDate)}</td>
            <td class="px-4 py-2 text-sm text-gray-800">
              {r.user?.fullName ?? `ID: ${r.contactedBy}`}
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
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full transform transition-all duration-300 scale-100 opacity-100"
      >
        <h2 class="text-2xl font-bold mb-4 text-gray-800">
          {isEditing ? 'Edit Recruit' : 'Add Recruit'}
        </h2>

        <div class="grid grid-cols-1 gap-4">
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1">
              <label
                class="block text-sm font-semibold text-gray-700 mb-1"
                >First Name <span class="text-red-500">*</span></label
              >
              <input
                type="text"
                bind:value={editForm.firstName}
                class="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
            </div>
            <div class="flex-1">
              <label
                class="block text-sm font-semibold text-gray-700 mb-1"
                >Last Name <span class="text-red-500">*</span></label
              >
              <input
                type="text"
                bind:value={editForm.lastName}
                class="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
            </div>
          </div>

          <div>
            <label
              class="block text-sm font-semibold text-gray-700 mb-1"
              >Section Group <span class="text-red-500">*</span></label
            >
            <select
              bind:value={editForm.sectionGroupId}
              class="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            >
              {#if editForm.sectionGroupId === undefined || sectionGroups.length === 0}
                <option value="" disabled>Select a section group</option>
              {/if}
              {#each sectionGroups as sg (sg.id)}
                <option value={sg.id}>{sg.name}</option>
              {/each}
            </select>
          </div>

          <div>
            <label
              class="block text-sm font-semibold text-gray-700 mb-1"
              >Contact Date <span class="text-red-500">*</span></label
            >
            <input
              type="date"
              bind:value={editForm.contactDate}
              class="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
          </div>

          <div>
            <label
              class="block text-sm font-semibold text-gray-700 mb-1"
              >Contacted By <span class="text-red-500">*</span></label
            >
            <select
              bind:value={editForm.contactedBy}
              class="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            >
              {#if editForm.contactedBy === undefined || users.length === 0}
                <option value="" disabled>Select a user</option>
              {/if}
              {#each users as user (user.id)}
                <option value={user.id}>{user.fullName ?? `User #${user.id}`}</option>
              {/each}
            </select>
          </div>

          <div>
            <label
              class="block text-sm font-semibold text-gray-700 mb-1"
              >Status <span class="text-red-500">*</span></label
            >
            <select
              bind:value={editForm.status}
              class="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            >
              {#each statuses as s}
                <option value={s}>{s}</option>
              {/each}
            </select>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">
              Comment
            </label>
            <textarea
              rows="3"
              bind:value={editForm.comment}
              class="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            ></textarea>
          </div>

          <div class="flex justify-end space-x-2 pt-4">
            <button
              class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
              on:click={closeModal}
              type="button"
            >
              Cancel
            </button>
            <button
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out"
              on:click={saveRecruit}
              type="button"
            >
              {isEditing ? 'Save Changes' : 'Add Recruit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
