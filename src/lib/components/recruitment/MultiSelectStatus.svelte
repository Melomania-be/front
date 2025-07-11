<!-- src/lib/components/recruitment/MultiSelectStatus.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { RecruitmentStatus } from '../../types/recruitment'; // Adjust path if needed

  // Props
  export let statuses: RecruitmentStatus[]; // All available status options
  export let selectedStatuses: RecruitmentStatus[]; // Currently selected statuses (bound from parent)
  export let label: string = 'Status'; // Label for the dropdown

  // Internal state
  let isOpen = false; // Controls dropdown visibility
  let dropdownRef: HTMLElement; // Reference to the dropdown element for click outside
  let buttonRef: HTMLButtonElement; // Reference to the button for click outside

  const dispatch = createEventDispatcher();

  // Function to toggle selection of a status
  function toggleStatus(status: RecruitmentStatus) {
    const index = selectedStatuses.indexOf(status);
    if (index > -1) {
      // Status is currently selected, deselect it
      selectedStatuses = selectedStatuses.filter(s => s !== status);
    } else {
      // Status is not selected, select it
      selectedStatuses = [...selectedStatuses, status];
    }
    // Dispatch an event to update the parent's bound value
    dispatch('change', selectedStatuses);
  }

  // Function to handle clicks outside the dropdown
  function handleClickOutside(event: MouseEvent) {
    if (dropdownRef && !dropdownRef.contains(event.target as Node) &&
        buttonRef && !buttonRef.contains(event.target as Node)) {
      isOpen = false;
    }
  }

  // Lifecycle hook for click outside listener
  import { onMount, onDestroy } from 'svelte';
  onMount(() => {
    document.addEventListener('click', handleClickOutside);
  });
  onDestroy(() => {
    document.removeEventListener('click', handleClickOutside);
  });

  // Reactive statement to update the displayed text
  $: displayText = selectedStatuses.length === 0
    ? `All ${label}es`
    : selectedStatuses.length === statuses.length
    ? `All ${label}es`
    : selectedStatuses.join(', ');

</script>

<div class="relative w-full">
  <label for="multi-select-status" class="block text-sm font-medium text-gray-700 mb-1">{label}</label>
  <button
    id="multi-select-status"
    bind:this={buttonRef}
    on:click={() => isOpen = !isOpen}
    class="relative w-full flex justify-between items-center px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm cursor-pointer transition-colors duration-200 ease-in-out"
    aria-haspopup="listbox"
    aria-expanded={isOpen}
  >
    <span>{displayText}</span>
    <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
    </svg>
  </button>

  {#if isOpen}
    <div
      bind:this={dropdownRef}
      class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm max-h-60 overflow-y-auto custom-scroll-bar"
      role="listbox"
    >
      {#each statuses as statusOption (statusOption)}
        <div
          class="flex items-center px-3 py-2 cursor-pointer hover:bg-blue-50"
          on:click={() => toggleStatus(statusOption)}
          role="option"
          aria-selected={selectedStatuses.includes(statusOption)}
        >
          <input
            type="checkbox"
            class="form-checkbox h-4 w-4 text-blue-600 rounded"
            checked={selectedStatuses.includes(statusOption)}
            on:change={() => toggleStatus(statusOption)}
            tabindex="-1"
          />
          <span class="ml-3 block truncate text-gray-900">{statusOption}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Custom scrollbar for multi-select (optional, but improves appearance) -->
<style>
  .custom-scroll-bar::-webkit-scrollbar {
      width: 8px;
  }

  .custom-scroll-bar::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
  }

  .custom-scroll-bar::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 10px;
  }

  .custom-scroll-bar::-webkit-scrollbar-thumb:hover {
      background: #555;
  }
</style>