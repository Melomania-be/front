<script lang="ts">
  import { writable } from 'svelte/store';
  import { onMount } from 'svelte';

  // Define Person interface
  interface Person {
    id: string;
    lastName: string;
    firstName: string;
    instrument: string;
    contactDate: string;
    contactedPerson: string;
    contactChannel: string;
    status: string;
    comment: string;
  }

  // Data store for people
  const people = writable<Person[]>([]);
  
  // Sorting state
  let sortColumn: keyof Person = 'lastName';
  let sortDirection: 'asc' | 'desc' = 'asc';

  // Define columns explicitly as keyof Person
  const columns: (keyof Person)[] = [
    'lastName',
    'firstName',
    'instrument',
    'contactDate',
    'contactedPerson',
    'contactChannel',
    'status',
    'comment'
  ];

  // Sort table
  function sortTable(column: keyof Person): void {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }

    people.update(p => [...p].sort((a, b) => {
      const aValue = a[column] || '';
      const bValue = b[column] || '';
      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    }));
  }

  // ... (rest of the script remains unchanged)
  let showModal: boolean = false;
  let isEditing: boolean = false;
  let editForm: Partial<Person> = {};

  const statuses: string[] = [
    'awaiting response',
    'interested',
    'participating',
    'registered',
    'not available',
    'cancelled',
    'other',
    'withdrawn'
  ];

  function openAddModal(): void {
    isEditing = false;
    editForm = {
      lastName: '',
      firstName: '',
      instrument: '',
      contactDate: new Date().toISOString().split('T')[0],
      contactedPerson: 'application',
      contactChannel: 'mail (app)',
      status: 'awaiting response',
      comment: ''
    };
    showModal = true;
  }

  function openEditModal(person: Person): void {
    isEditing = true;
    editForm = { ...person };
    showModal = true;
  }

  function savePerson(): void {
    if (isEditing) {
      people.update(p => 
        p.map(person => 
          person.id === editForm.id ? { ...editForm } as Person : person
        )
      );
    } else {
      const newPerson: Person = {
        id: crypto.randomUUID(),
        ...editForm
      } as Person;
      people.update(p => [...p, newPerson]);
    }
    closeModal();
  }

  function closeModal(): void {
    showModal = false;
    editForm = {};
  }

  function deletePerson(id: string): void {
    people.update(p => p.filter(person => person.id !== id));
  }

  function checkAndUpdateStatus(firstName: string, lastName: string, action: 'register' | 'withdraw'): void {
    people.update(p => p.map(person => {
      if (
        person.firstName.toLowerCase() === firstName.toLowerCase() &&
        person.lastName.toLowerCase() === lastName.toLowerCase()
      ) {
        if (action === 'register') {
          if (confirm(`Confirm registration for ${firstName} ${lastName}?`)) {
            return { ...person, status: 'registered' };
          }
        } else if (action === 'withdraw') {
          if (confirm(`Confirm withdrawal for ${firstName} ${lastName}?`)) {
            return { ...person, status: 'withdrawn' };
          }
        }
      }
      return person;
    }));
  }

  function registerPerson(firstName: string, lastName: string): void {
    checkAndUpdateStatus(firstName, lastName, 'register');
  }

  function withdrawPerson(firstName: string, lastName: string): void {
    checkAndUpdateStatus(firstName, lastName, 'withdraw');
  }

  onMount(() => {
    people.set([
      {
        id: crypto.randomUUID(),
        lastName: 'Smith',
        firstName: 'John',
        instrument: 'Guitar',
        contactDate: '2025-06-11',
        contactedPerson: 'application',
        contactChannel: 'mail (app)',
        status: 'awaiting response',
        comment: 'Initial contact'
      }
    ]);
  });
</script>


<div class="container mx-auto p-4">
  <div class="mb-4 flex justify-between">
    <button 
      class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
      on:click={openAddModal}
    >
      Add New Person
    </button>
    <div class="space-x-2">
      <button 
        class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        on:click={() => registerPerson('John', 'Smith')}
      >
        Test Register John Smith
      </button>
      <button 
        class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        on:click={() => withdrawPerson('John', 'Smith')}
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
              {column.charAt(0).toUpperCase() + column.slice(1).replace(/([A-Z])/g, ' $1')}
              {#if sortColumn === column}
                {sortDirection === 'asc' ? '↑' : '↓'}
              {/if}
            </th>
          {/each}
          <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each $people as person (person.id)}
          <tr class="border-t hover:bg-gray-50">
            <td class="px-4 py-2 text-sm text-gray-600">{person.lastName}</td>
            <td class="px-4 py-2 text-sm text-gray-600">{person.firstName}</td>
            <td class="px-4 py-2 text-sm text-gray-600">{person.instrument}</td>
            <td class="px-4 py-2 text-sm text-gray-600">{person.contactDate}</td>
            <td class="px-4 py-2 text-sm text-gray-600">{person.contactedPerson}</td>
            <td class="px-4 py-2 text-sm text-gray-600">{person.contactChannel}</td>
            <td class="px-4 py-2 text-sm text-gray-600">{person.status}</td>
            <td class="px-4 py-2 text-sm text-gray-600">{person.comment}</td>
            <td class="px-4 py-2 text-sm">
              <button 
                class="text-blue-500 hover:text-blue-700 mr-2"
                on:click={() => openEditModal(person)}
              >
                Edit
              </button>
              <button 
                class="text-red-500 hover:text-red-700"
                on:click={() => deletePerson(person.id)}
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
        <h2 class="text-xl font-semibold mb-4">{isEditing ? 'Edit Person' : 'Add Person'}</h2>
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
            <label class="block text-sm font-medium text-gray-700">Instrument</label>
            <input 
              type="text" 
              bind:value={editForm.instrument}
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
            <label class="block text-sm font-medium text-gray-700">Contacted Person</label>
            <input 
              type="text" 
              bind:value={editForm.contactedPerson}
              class="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Contact Channel</label>
            <input 
              type="text" 
              bind:value={editForm.contactChannel}
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
        <div class="mt-3 flex justify-end space-x-2">
          <button 
            class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
            on:click={closeModal}
          >
            Cancel
          </button>
          <button 
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            on:click={savePerson}
          >
            {isEditing ? 'Save' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>