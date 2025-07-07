

<script context="module" lang="ts">
  // --- Type Definitions ---

 export type RecruitmentStatus =
    | 'not yet contacted' // ADDED
    | 'awaiting response'
    | 'interested'
    | 'participating'
    | 'registered'
    | 'not available'
    | 'to follow up'      // Changed from 'to be contacted'
    | 'cancelled'
    | 'other';

  export interface LookupUser {
    id: number;
    fullName: string | null;
  }

  export interface LookupSectionGroup {
    id: number;
    name: string;
  }

   export interface CurrentUser {
    id: number;
    fullName: string;
    email: string;
    // Add other properties you might receive from /auth/me if needed, but keep it minimal
  }

  export interface Recruitment {
    id: number;
    firstName: string;
    lastName: string;
    sectionGroupId: number;
    // --- MODIFIED: contactDate can be string OR null ---
    contactDate: string | null;
    // --- MODIFIED: contactedBy can be number OR null ---
    contactedBy: number | null;
    status: RecruitmentStatus;
    comment: string | null;
    createdAt: string; // ISO string from backend DateTime
    updatedAt: string; // ISO string from backend DateTime
    sectionGroup?: LookupSectionGroup; // Optional, as it might not always be preloaded
    user?: LookupUser;                 // Optional, as it might not always be preloaded or contactedBy is null
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
  const SIMILARITY_THRESHOLD = 2;
  let isRecalculating = false;
  let currentLoggedInUser: CurrentUser | null = null;

  // New variable declaration for the datetime-local input binding
  let checkStatusDateTime: string | null = null;
 let selectedRecruitments: Set<number> = new Set();


   // --- NEW: Filter State Variables ---
  let filterFirstName: string = '';
  let filterLastName: string = '';
  let filterSectionGroupId: number | null = null; // For filtering by section group ID
  let filterContactDate: string = ''; // For filtering by exact contact date (YYYY-MM-DD)
  let filterContactedBy: number | null = null; // For filtering by contacted by user ID
  let filterStatus: RecruitmentStatus | '' = ''; // For filtering by status

  const statuses: RecruitmentStatus[] = [
   'not yet contacted', // ADDED
    'awaiting response',
    'interested',
    'participating',
    'registered',
    'not available',
    'to follow up',      // CHANGED from 'to be contacted'
    'cancelled',
    'other',
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

//   function sortTable(column: keyof Recruitment) {
//   if (sortColumn === column) {
//     sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
//   } else {
//     sortColumn = column;
//     sortDirection = 'asc';
//   }

//   recruitment = [...recruitment].sort((a, b) => {
//     let aVal: string | number | Date 
//     let bVal: string | number | Date 

//     switch (column) {
//       case 'contactDate':
//         aVal = a.contactDate ? new Date(a.contactDate) : new Date(0);
//         bVal = b.contactDate ? new Date(b.contactDate) : new Date(0);
//         break;

//       case 'sectionGroupId':
//         // Sort by sectionGroup name if available, else by id number
//         aVal = a.sectionGroup?.name?.toLowerCase() ?? a.sectionGroupId;
//         bVal = b.sectionGroup?.name?.toLowerCase() ?? b.sectionGroupId;
//         break;

//       case 'contactedBy':
//         // Sort by user fullName if available, else by contactedBy id
//         aVal = a.user?.fullName?.toLowerCase() ?? a.contactedBy;
//         bVal = b.user?.fullName?.toLowerCase() ?? b.contactedBy;
//         break;

//       default:
//         // For other columns, convert to lowercase string to compare
//         aVal = (a[column] ?? '').toString().toLowerCase();
//         bVal = (b[column] ?? '').toString().toLowerCase();
//     }

//     // Now compare aVal and bVal depending on their type
//     if (aVal instanceof Date && bVal instanceof Date) {
//       return sortDirection === 'asc' ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime();
//     }

//     if (typeof aVal === 'number' && typeof bVal === 'number') {
//       return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
//     }

//     // Default string comparison
//     return sortDirection === 'asc'
//       ? String(aVal).localeCompare(String(bVal))
//       : String(bVal).localeCompare(String(aVal));
//   });
// }


function sortTable(column: keyof Recruitment) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }

    recruitment = [...recruitment].sort((a, b) => {
      let aVal: string | number | Date; // Ensure this type is always met
      let bVal: string | number | Date; // Ensure this type is always met

      switch (column) {
        case 'contactDate':
          // Convert null dates to a very early date (Epoch) for consistent sorting.
          // This ensures null dates sort predictably (e.g., always at the beginning).
          aVal = a.contactDate ? new Date(a.contactDate) : new Date(0);
          bVal = b.contactDate ? new Date(b.contactDate) : new Date(0);
          break;

        case 'sectionGroupId':
          // Prefer sorting by sectionGroup name if available.
          // If sectionGroup or its name is null/undefined, use sectionGroupId.
          // If sectionGroupId is also null, use -1 to ensure consistent numerical sorting (e.g., at the start).
          if (a.sectionGroup?.name) {
            aVal = a.sectionGroup.name.toLowerCase();
          } else {
            // Fallback to sectionGroupId. If it's null, use -1.
            aVal = a.sectionGroupId ?? -1;
          }

          if (b.sectionGroup?.name) {
            bVal = b.sectionGroup.name.toLowerCase();
          } else {
            bVal = b.sectionGroupId ?? -1;
          }
          break;

        case 'contactedBy':
          // Prefer sorting by user fullName if available.
          // If user or fullName is null/undefined, use contactedBy ID.
          // If contactedBy is also null, use -1 to ensure consistent numerical sorting (e.g., at the start).
          if (a.user?.fullName) {
            aVal = a.user.fullName.toLowerCase();
          } else {
            // Fallback to contactedBy ID. If it's null, use -1.
            aVal = a.contactedBy ?? -1;
          }

          if (b.user?.fullName) {
            bVal = b.user.fullName.toLowerCase();
          } else {
            bVal = b.contactedBy ?? -1;
          }
          break;

        default:
          // For other columns, convert to lowercase string to compare.
          // Ensure null/undefined values become empty strings for consistent alphabetical sorting.
          aVal = (a[column] ?? '').toString().toLowerCase();
          bVal = (b[column] ?? '').toString().toLowerCase();
          break;
      }

      // Now compare aVal and bVal depending on their determined type
      if (aVal instanceof Date && bVal instanceof Date) {
        return sortDirection === 'asc' ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime();
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Default string comparison for all other cases
      return sortDirection === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }



// --- Utility Functions ---

// NEW: Levenshtein Distance function to check for similarity
function getLevenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

 /**
     * Toggles the selection of a single recruitment record.
     * @param id The ID of the recruitment record.
     */
    function toggleRecruitmentSelection(id: number) {
        if (selectedRecruitments.has(id)) {
            selectedRecruitments.delete(id);
        } else {
            selectedRecruitments.add(id);
        }
        // Important: Update the set reference to trigger Svelte reactivity
        selectedRecruitments = selectedRecruitments;
    }


    /**
     * Toggles selection of all currently displayed recruitment records.
     */
    function toggleAllRecruitmentsSelection() {
        if (selectedRecruitments.size === recruitment.length && recruitment.length > 0) {
            // If all are selected, deselect all
            selectedRecruitments.clear();
        } else {
            // If not all are selected, select all
            selectedRecruitments.clear(); // Clear first to avoid duplicates if partial selection
            recruitment.forEach(r => selectedRecruitments.add(r.id));
        }
        // Important: Update the set reference to trigger Svelte reactivity
        selectedRecruitments = selectedRecruitments;
    }


    /**
     * Checks if all currently displayed recruitment records are selected.
     * Used for the "select all" checkbox state.
     */
    function areAllRecruitmentsSelected(): boolean {
        if (recruitment.length === 0) return false;
        return selectedRecruitments.size === recruitment.length;
    }


  /**
     * Copies selected recruitment data to the clipboard in a CSV format suitable for Excel.
     */
      /**
     * Copies selected recruitment data to the clipboard in an HTML table format suitable for Excel.
     */
    async function copySelectedToExcel() {
        if (selectedRecruitments.size === 0) {
            toast.error('Please select at least one row to copy.');
            return;
        }

        const selectedData = recruitment.filter(r => selectedRecruitments.has(r.id));

        // Define the columns and their display names for the HTML table, in desired order
        const columnsToCopy = [
            { key: 'firstName', header: 'First Name' },
            { key: 'lastName', header: 'Last Name' },
            { key: 'sectionGroup', header: 'Section', getValue: (r: Recruitment) => r.sectionGroup?.name ?? `ID:${r.sectionGroupId}` },
            { key: 'contactDate', header: 'Contact Date', getValue: (r: Recruitment) => formatDate(r.contactDate) },
            { key: 'contactedBy', header: 'Contacted By', getValue: (r: Recruitment) => r.user?.fullName ?? `ID:${r.contactedBy}` },
            { key: 'status', header: 'Status' },
            { key: 'comment', header: 'Comment' },
            // { key: 'statusUpdatedAt', header: 'Status Updated At', getValue: (r: Recruitment) => formatDate(r.statusUpdatedAt) },
            { key: 'createdAt', header: 'Created At', getValue: (r: Recruitment) => formatDate(r.createdAt) },
            { key: 'updatedAt', header: 'Updated At', getValue: (r: Recruitment) => formatDate(r.updatedAt) },
        ];

        let htmlTableContent = '<table><thead><tr>';
        let csvContent = "\uFEFF"; // BOM for plain text fallback

        // --- Build Header Row (HTML & CSV) ---
        htmlTableContent += columnsToCopy.map(col => `<th>${escapeHtml(col.header)}</th>`).join('');
        csvContent += columnsToCopy.map(col => `"${col.header.replace(/"/g, '""')}"`).join(',') + "\n"; // CSV header

        htmlTableContent += '</tr></thead><tbody>';

        // --- Build Data Rows (HTML & CSV) ---
        selectedData.forEach(r => {
            htmlTableContent += '<tr>';
            const csvRowCells: string[] = [];

            columnsToCopy.forEach(col => {
                let value: any;
                if (col.getValue) {
                    value = col.getValue(r);
                } else {
                    value = r[col.key as keyof Recruitment];
                }

                if (value === null || value === undefined) {
                    value = "";
                }
                const stringValue = String(value);

                // For HTML: escape content to prevent breaking the HTML structure
                htmlTableContent += `<td>${escapeHtml(stringValue)}</td>`;

                // For CSV: escape quotes and enclose in quotes if necessary (or always)
                const escapedCsvValue = stringValue.replace(/"/g, '""');
                csvRowCells.push(`"${escapedCsvValue}"`);
            });
            htmlTableContent += '</tr>';
            csvContent += csvRowCells.join(',') + "\n"; // CSV data row
        });

        htmlTableContent += '</tbody></table>';

        try {
            // Write both HTML and Plain Text formats to the clipboard
            const htmlBlob = new Blob([htmlTableContent], { type: 'text/html' });
            const textBlob = new Blob([csvContent], { type: 'text/plain' });

            // Check for navigator.clipboard.write API support
            if (navigator.clipboard && typeof navigator.clipboard.write === 'function') {
                await navigator.clipboard.write([
                    new ClipboardItem({
                        'text/html': htmlBlob,
                        'text/plain': textBlob,
                    })
                ]);
                toast.success(`Copied ${selectedData.length} row(s) to clipboard (HTML & Text).`);
            } else {
                // Fallback for older browsers (only plain text)
                await navigator.clipboard.writeText(csvContent);
                toast.success(`Copied ${selectedData.length} row(s) to clipboard (Plain Text fallback).`);
            }

            // Optional: Deselect rows after copying
            selectedRecruitments.clear();
            selectedRecruitments = selectedRecruitments; // Trigger Svelte reactivity
        } catch (err) {
            console.error('Failed to copy text: ', err);
            toast.error('Failed to copy data to clipboard. Please check browser permissions or use a modern browser.');
        }
    }

    /**
     * Helper function to escape HTML entities for clipboard content.
     * Prevents issues if cell data contains HTML characters.
     */
    function escapeHtml(unsafe: string): string {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;"); // Use &#039; for single quotes
    }


  // --- CRUD & Status Check ---



 async function fetchRecruitment(shouldSort = true) {
    try {
      // Build query parameters from filter state
      const queryParams = new URLSearchParams();

      if (filterFirstName.trim()) {
        queryParams.append('firstName', filterFirstName.trim());
      }
      if (filterLastName.trim()) {
        queryParams.append('lastName', filterLastName.trim());
      }
      // For number/enum filters, ensure they are not null/empty string before appending
      if (filterSectionGroupId !== null) {
        queryParams.append('sectionGroupId', String(filterSectionGroupId));
      }
      if (filterContactDate.trim()) { // filterContactDate is YYYY-MM-DD string
        queryParams.append('contactDate', filterContactDate.trim());
      }
      if (filterContactedBy !== null) {
        queryParams.append('contactedBy', String(filterContactedBy));
      }
      if (filterStatus !== '') {
        queryParams.append('status', filterStatus);
      }

      // Construct the URL with query parameters
      const url = `/api/recruitment${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const res = await fetch(url); // Use the constructed URL
      if (res.ok) {
        recruitment = await res.json();

        if (shouldSort) {
          sortTable(sortColumn);
        }
      } else {
        toast.error('Failed to refresh recruitment data with filters.');
      }
    } catch {
      toast.error('Could not load recruitment data with filters.');
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


async function fetchCurrentUser() {
    try {
     
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const result = await res.json();
        currentLoggedInUser = result.data; // Assuming your backend returns { message: '...', data: User }
        // console.log('Logged-in user fetched:', currentLoggedInUser);
      } else {
        console.warn('Could not fetch logged-in user:', await res.text());
        currentLoggedInUser = null; // Ensure it's null if not logged in or error
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      currentLoggedInUser = null;
    }
  }

  async function fetchSectionGroups() {
    try {
      const res = await fetch('/api/sectionGroups');
      sectionGroups = res.ok ? await res.json() : [];
    } catch {
      toast.error('Failed to load section.');
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
        await fetchRecruitment(false);
      } else {
        toast.error(result.message || 'Status check failed.');
      }
    } catch (e) {
      console.error('Status check error:', e);
      toast.error('Server error during status check.');
    }
  }

// with similarity check
// async function saveRecruit() {
//   if (
//     !editForm.firstName?.trim() ||
//     !editForm.lastName?.trim() ||
//     editForm.sectionGroupId === undefined ||
//     editForm.contactedBy === undefined ||
//     !editForm.status
//   ) {
//     toast.error('Please fill all required fields.');
//     return;
//   }

//   // --- NEW: Duplicate and Similarity Check ---
//   if (!isEditing) { // Only run this check when creating a new recruit
//     const newFirstName = editForm.firstName.trim().toLowerCase();
//     const newLastName = editForm.lastName.trim().toLowerCase();
//     const newFullName = `${newFirstName} ${newLastName}`;

//     const exactMatches: Recruitment[] = [];
//     const similarMatches: Recruitment[] = [];

//     for (const r of recruitment) {
//       const existingFullName = `${r.firstName.toLowerCase()} ${r.lastName.toLowerCase()}`;
      
//       if (existingFullName === newFullName) {
//         exactMatches.push(r);
//         continue; // It's an exact match, no need to check for similarity
//       }
      
//       const distance = getLevenshteinDistance(newFullName, existingFullName);
//       if (distance > 0 && distance <= SIMILARITY_THRESHOLD) {
//         similarMatches.push(r);
//       }
//     }

//     if (exactMatches.length > 0) {
//       if (!confirm(`A recruit with the exact name "${editForm.firstName} ${editForm.lastName}" already exists. Are you sure you want to add another?`)) {
//         return; // Stop execution if the user clicks "Cancel"
//       }
//     } else if (similarMatches.length > 0) {
//       const similarNames = similarMatches.map(r => `${r.firstName} ${r.lastName}`).join(', ');
//       if (!confirm(`This name is very similar to existing recruits: ${similarNames}.\n\nThis could be a typo. Do you want to continue anyway?`)) {
//         return; // Stop execution if the user clicks "Cancel"
//       }
//     }
//   }
//   // --- End of New Check ---


//   const payload = {
//     firstName: editForm.firstName.trim(),
//     lastName: editForm.lastName.trim(),
//     sectionGroupId: editForm.sectionGroupId,
//     contactDate: editForm.contactDate,
//     contactedBy: editForm.contactedBy,
//     status: editForm.status,
//     comment: editForm.comment ?? null
//   };

//   try {
//     let res: Response;
//     if (isEditing && editForm.id) {
//       // The check is skipped for editing
//       res = await fetch(`/api/recruitment/${editForm.id}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//       });
//       toast.success('Recruitment updated successfully.');
//     } else {
//       // This path is taken after the check passes for new recruits
//       res = await fetch('/api/recruitment', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//       });
//       toast.success('Recruitment added successfully.');
//     }
//     if (!res.ok) throw new Error(await res.text());
//     await fetchRecruitment();
//     closeModal();
//   } catch (err) {
//     console.error('Error saving recruit:', err);
//     toast.error('Failed to save recruit.');
//   }
// }


async function saveRecruit() {
    // --- MODIFIED VALIDATION: Handles 'contactedBy' conditionally ---
    if (
      !editForm.firstName?.trim() ||
      !editForm.lastName?.trim() ||
      editForm.sectionGroupId === undefined ||
      !editForm.status // Status is always required
    ) {
      toast.error('Please fill all required fields: First Name, Last Name, Section, Status.');
      return;
    }

    // Conditional check for contactedBy based on status
    if (editForm.status !== 'not yet contacted' && (editForm.contactedBy === undefined || editForm.contactedBy === null)) {
        toast.error('Contacted By is required when status is not "not yet contacted".');
        return;
    }
    // --- END MODIFIED VALIDATION ---


    // --- Duplicate and Similarity Check (existing, no changes here) ---
    if (!isEditing) {
      const newFirstName = editForm.firstName.trim().toLowerCase();
      const newLastName = editForm.lastName.trim().toLowerCase();
      const newFullName = `${newFirstName} ${newLastName}`;

      const exactMatches: Recruitment[] = [];
      const similarMatches: Recruitment[] = [];

      for (const r of recruitment) {
        const existingFullName = `${r.firstName.toLowerCase()} ${r.lastName.toLowerCase()}`;
        if (existingFullName === newFullName) {
          exactMatches.push(r);
          continue;
        }
        const distance = getLevenshteinDistance(newFullName, existingFullName);
        if (distance > 0 && distance <= SIMILARITY_THRESHOLD) {
          similarMatches.push(r);
        }
      }

      if (exactMatches.length > 0) {
        if (!confirm(`A recruit with the exact name "${editForm.firstName} ${editForm.lastName}" already exists. Are you sure you want to add another?`)) {
          return;
        }
      } else if (similarMatches.length > 0) {
        const similarNames = similarMatches.map(r => `${r.firstName} ${r.lastName}`).join(', ');
        if (!confirm(`This name is very similar to existing recruits: ${similarNames}.\n\nThis could be a typo. Do you want to continue anyway?`)) {
          return;
        }
      }
    }
    // --- End Duplicate and Similarity Check ---


    // --- MODIFIED PAYLOAD CONSTRUCTION ---
    let contactDateToSend: string | null = null;
    let contactedByToSend: number | null = null;

    if (editForm.status === 'not yet contacted') {
      // If status is 'not yet contacted', contactDate and contactedBy must be null in payload.
      // This is because the backend expects null for this status.
      contactDateToSend = null;
      contactedByToSend = null;
    } else {
      // For other statuses:
      // contactDate: Use the provided date string from the form.
      // If it's empty from the form (e.g., user cleared it), convert it to null.
      // If it's a valid date string, keep it.
      contactDateToSend = editForm.contactDate && editForm.contactDate.trim() !== ''
                            ? editForm.contactDate
                            : null;

      // contactedBy: Use the provided number from the form.
      // It's already number | null | undefined from editForm, so just nullish coalesce to null if undefined.
      contactedByToSend = editForm.contactedBy ?? null;
    }

    const payload = {
      firstName: editForm.firstName.trim(),
      lastName: editForm.lastName.trim(),
      sectionGroupId: editForm.sectionGroupId,
      status: editForm.status,
      comment: editForm.comment ?? null,
      // --- Use the conditionally determined values ---
      contactDate: contactDateToSend,
      contactedBy: contactedByToSend,
    };
    // --- END MODIFIED PAYLOAD CONSTRUCTION ---


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
      if (!res.ok) {
        const errorText = await res.text(); // Get error text from response
        console.error('Backend save error:', errorText);
        throw new Error(errorText); // Throw it to be caught by the outer catch
      }
      await fetchRecruitment(false);
      closeModal();
    } catch (err: unknown) { // Explicitly type err as unknown for clarity, though it's default
      console.error('Error saving recruit:', err);

      // --- FIX APPLIED HERE: Type Narrowing for 'err' ---
      let errorMessage = 'Failed to save recruit: An unexpected error occurred.';

      if (err instanceof Error) { // Check if it's an Error object
        try {
          const errorParsed = JSON.parse(err.message);
          if (errorParsed.message) {
            errorMessage = errorParsed.message;
          } else if (errorParsed.errors && Array.isArray(errorParsed.errors) && errorParsed.errors.length > 0) {
            // For VineJS detailed errors like { message: "Validation failed", errors: [...] }
            errorMessage = errorParsed.message || 'Validation failed. See console for details.';
            // You might want to display specific field errors here if needed
            // e.g., toast.error(errorParsed.errors[0].message);
          } else {
            errorMessage = `Failed to save recruit: ${err.message}`;
          }
        } catch {
          // If err.message is not valid JSON, use it as a plain string
          errorMessage = `Failed to save recruit: ${err.message}`;
        }
      } else if (typeof err === 'string') { // Check if it's a plain string error
        try {
          const errorParsed = JSON.parse(err); // Try parsing the string itself
          if (errorParsed.message) {
              errorMessage = errorParsed.message;
          } else if (errorParsed.errors && Array.isArray(errorParsed.errors) && errorParsed.errors.length > 0) {
              errorMessage = errorParsed.message || 'Validation failed. See console for details.';
          } else {
              errorMessage = `Failed to save recruit: ${err}`;
          }
        } catch {
          errorMessage = `Failed to save recruit: ${err}`; // Use plain string if not JSON
        }
      }

      toast.error(errorMessage);
    }
  }


  // without similarity check
  // async function saveRecruit() {
  //   if (
  //     !editForm.firstName?.trim() ||
  //     !editForm.lastName?.trim() ||
  //     editForm.sectionGroupId === undefined ||
  //     editForm.contactedBy === undefined ||
  //     !editForm.status
  //   ) {
  //     toast.error('Please fill all required fields.');
  //     return;
  //   }

  //   const payload = {
  //     firstName: editForm.firstName.trim(),
  //     lastName: editForm.lastName.trim(),
  //     sectionGroupId: editForm.sectionGroupId,
  //     contactDate: editForm.contactDate,
  //     contactedBy: editForm.contactedBy,
  //     status: editForm.status,
  //     comment: editForm.comment ?? null
  //   };

  //   try {
  //     let res: Response;
  //     if (isEditing && editForm.id) {
  //       res = await fetch(`/api/recruitment/${editForm.id}`, {
  //         method: 'PUT',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify(payload)
  //       });
  //       toast.success('Recruitment updated successfully.');
  //     } else {
  //       res = await fetch('/api/recruitment', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify(payload)
  //       });
  //       toast.success('Recruitment added successfully.');
  //     }
  //     if (!res.ok) throw new Error(await res.text());
  //     await fetchRecruitment();
  //     closeModal();
  //   } catch (err) {
  //     console.error('Error saving recruit:', err);
  //     toast.error('Failed to save recruit.');
  //   }
  // }

  // async function deleteRecruit(id: number) {
  //   if (!confirm('Are you sure you want to delete this recruit?')) return;
  //   try {
  //     const res = await fetch(`/api/recruitment/${id}`, { method: 'DELETE' });
  //     if (!res.ok) throw new Error(await res.text());
  //     toast.success('Recruitment deleted.');
  //     await fetchRecruitment();
  //   } catch (err) {
  //     console.error('Delete error:', err);
  //     toast.error('Failed to delete recruit.');
  //   }
  // }

   async function deleteRecruit(id: number) {
    if (!confirm('Are you sure you want to delete this recruit?')) return;
    try {
      const res = await fetch(`/api/recruitment/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Recruitment deleted successfully.');
      await fetchRecruitment(false);
    } catch (err: unknown) {
      console.error('Error deleting recruit:', err);
      let errorMessage = 'Failed to delete recruit: An unexpected error occurred.';
      if (err instanceof Error) {
        try {
          const errorParsed = JSON.parse(err.message);
          errorMessage = errorParsed.message || errorMessage;
        } catch {
          errorMessage = err.message;
        }
      } else if (typeof err === 'string') {
          errorMessage = err;
      }
      toast.error(errorMessage);
    }
  }


   async function deleteSelectedRecruitments() {
    if (selectedRecruitments.size === 0) {
      toast.error('Please select at least one recruit to delete.');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedRecruitments.size} selected recruit(s)? This action cannot be undone.`)) {
      return;
    }

    let successfulDeletes = 0;
    let failedDeletes = 0;

    // Convert Set to Array to iterate, as Set might change during async operations
    const idsToDelete = Array.from(selectedRecruitments);

    // Perform deletions sequentially to avoid overwhelming the backend and for clearer error reporting
    for (const id of idsToDelete) {
      try {
        const res = await fetch(`/api/recruitment/${id}`, {
          method: 'DELETE'
        });
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`Failed to delete recruit ID ${id}:`, errorText);
          failedDeletes++;
          // Optionally, show a toast for each failure or collect them
          toast.error(`Failed to delete recruit ID ${id}.`);
        } else {
          successfulDeletes++;
        }
      } catch (err: unknown) {
        console.error(`Error deleting recruit ID ${id}:`, err);
        failedDeletes++;
        toast.error(`Error deleting recruit ID ${id}.`);
      }
    }

    if (successfulDeletes > 0) {
      toast.success(`Successfully deleted ${successfulDeletes} recruit(s).`);
    }
    if (failedDeletes > 0) {
      toast.error(`Failed to delete ${failedDeletes} recruit(s). Check console for details.`);
    }

    // Clear selection and refresh data after all attempts
    selectedRecruitments.clear();
    selectedRecruitments = selectedRecruitments; // Trigger reactivity
    await fetchRecruitment(false);
  }

  // function openAddModal() {
  //   isEditing = false;
  //   editForm = {
  //     firstName: '',
  //     lastName: '',
  //     sectionGroupId: sectionGroups[0]?.id,
  //     contactDate: new Date().toISOString().slice(0, 10),
  //     contactedBy: users[0]?.id,
  //     status: 'awaiting response',
  //     comment: null
  //   };
  //   showModal = true;
  // }

function openAddModal() {
    isEditing = false;
    editForm = {
      firstName: '',
      lastName: '',
      sectionGroupId: sectionGroups.length > 0 ? sectionGroups[0].id : undefined,
      contactDate: null, // Default to null for 'not yet contacted'
      contactedBy: currentLoggedInUser?.id ?? null, // Default to null for 'not yet contacted'
      status: 'not yet contacted', // NEW DEFAULT STATUS
      comment: null,
    };
    showModal = true;
  }

  // function openEditModal(r: Recruitment) {
  //   isEditing = true;
  //   editForm = {
  //     ...r,
  //     contactDate: r.contactDate.slice(0, 10)
  //   };
  //   showModal = true;
  // }

   function openEditModal(r: Recruitment) {
    isEditing = true;
    editForm = {
      ...r,
      // If contactDate is null, ensure input value is empty string for type="date"
      // Otherwise, slice to get YYYY-MM-DD for the input
      contactDate: r.contactDate ? new Date(r.contactDate).toISOString().slice(0, 10) : null // Keep as null if null from backend
    };
    showModal = true;
  }


  // function closeModal() {
  //   showModal = false;
  //   editForm = {};
  // }

  function closeModal() {
    showModal = false;
    selectedRecruitments.clear(); // Clear selection when modal closes
    selectedRecruitments = selectedRecruitments; // Trigger reactivity
  }

  // async function checkAndUpdateStatus(firstName: string, lastName: string, action: 'register' | 'withdraw') {
  //   const recruit = recruitment.find(
  //     (r) =>
  //       r.firstName.toLowerCase() === firstName.toLowerCase() &&
  //       r.lastName.toLowerCase() === lastName.toLowerCase()
  //   );
  //   if (!recruit) {
  //     toast.error(`${firstName} ${lastName} not found.`);
  //     return;
  //   }
  //   if (!confirm(`Confirm ${action} for ${firstName} ${lastName}?`)) return;

  //   try {
  //     const res = await fetch(`/api/recruitment/${recruit.id}`, {
  //       method: 'PUT',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ status: action === 'register' ? 'registered' : 'withdrawn' })
  //     });
  //     if (!res.ok) throw new Error(await res.text());
  //     toast.success(`Recruit ${action}ed.`);
  //     await fetchRecruitment();
  //   } catch (err) {
  //     console.error(`${action} error:`, err);
  //     toast.error(`Failed to ${action} recruit.`);
  //   }
  // }


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
      // newStatus will explicitly be 'registered' or 'cancelled'
      const newStatus: RecruitmentStatus = action === 'register' ? 'registered' : 'cancelled';
      const oldStatus: RecruitmentStatus = recruit.status;

      let contactDatePayload: string | null = null;
      let contactedByPayload: number | null = null;

      // --- SIMPLIFIED LOGIC FOR THIS FUNCTION'S SPECIFIC TRANSITIONS ---
      if (oldStatus === 'not yet contacted') {
        // If old status was 'not yet contacted' and we're moving to 'registered'/'cancelled'
        // Then set contactDate to now.
        contactDatePayload = getLocalDatetimeString(new Date()).slice(0, 10);
        // For contactedBy, if it was null, try to assign a default or existing.
        // For simplicity here, we'll keep the existing if it's there, otherwise null.
        // In a real app, you might want to force selection of 'contactedBy' when registering.
        contactedByPayload = recruit.contactedBy || null; // Will send null if currently null
      } else {
        // If old status was NOT 'not yet contacted', just retain current date/contactedBy.
        // This function does not otherwise modify these fields for other status changes.
        contactDatePayload = recruit.contactDate;
        contactedByPayload = recruit.contactedBy;
      }
      // --- END SIMPLIFIED LOGIC ---

      const res = await fetch(`/api/recruitment/${recruit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          contactDate: contactDatePayload,
          contactedBy: contactedByPayload
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Backend ${action} error (${res.status}):`, errorText);
        throw new Error(errorText);
      }
      toast.success(`Recruit ${action}ed. Status changed to '${newStatus}'.`);
      await fetchRecruitment(false);
    } catch (err: unknown) {
      console.error(`${action} error:`, err);
      let errorMessage = `Failed to ${action} recruit.`;
      if (err instanceof Error) {
        try {
          const errorParsed = JSON.parse(err.message);
          errorMessage = errorParsed.message || errorMessage;
        } catch {
          errorMessage = err.message;
        }
      } else if (typeof err === 'string') {
          errorMessage = err;
      }
      toast.error(errorMessage);
    }
  }

// async function updateStatuses() {
//   try {
//     console.log('Current daysThreshold value:', daysThreshold);
//     const res = await fetch('/api/recruitment/check-status', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({ daysThreshold })
//     });

//     const result = await res.json();

//     if (!res.ok) {
//       throw new Error(result.message || 'Status update failed');
//     }

//     toast.success(result.message || 'Statuses updated successfully.');
//   } catch (error) {
//     toast.error(error.message || 'An error occurred while updating statuses.');
//     console.error(error);
//   }
// }

async function updateStatuses() {
  isRecalculating = true;
  try {
    const numericThreshold = Number(daysThreshold);
    if (isNaN(numericThreshold) || numericThreshold <= 0) {
      toast.error('Please enter a valid number of days.');
      return;
    }

    const res = await fetch('/api/recruitment/check-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ daysThreshold: numericThreshold })
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || 'Status update failed');
    }

    toast.success(result.message || 'Statuses updated successfully.');
    
    // Call fetchRecruitment and pass false to prevent sorting
    await fetchRecruitment(false); 

  } catch (error: unknown) { // Use unknown for safety
      let errorMessage = 'An error occurred while updating statuses.';
      if (error instanceof Error) {
        try {
            const errorParsed = JSON.parse(error.message);
            errorMessage = errorParsed.message || errorMessage;
        } catch {
            errorMessage = error.message;
        }
      } else if (typeof error === 'string') {
          errorMessage = error;
      }
      toast.error(errorMessage);
      console.error(error);
    } finally {
      isRecalculating = false;
    }
  }

  
  function registerRecruit(firstName: string, lastName: string) {
    checkAndUpdateStatus(firstName, lastName, 'register');
  }

  function withdrawRecruit(firstName: string, lastName: string) {
    checkAndUpdateStatus(firstName, lastName, 'withdraw');
  }

  function clearFilters() {
    filterFirstName = '';
    filterLastName = '';
    filterSectionGroupId = null;
    filterContactDate = '';
    filterContactedBy = null;
    filterStatus = '';
     sortColumn = 'lastName';
    sortDirection = 'asc';
    fetchRecruitment(false); // Re-fetch data after clearing filters
  }


  // --- Lifecycle ---

  onMount(async () => {

     if (browser) {
      await fetchCurrentUser();
      // fetchRecruitment will automatically apply any initial filter values
      // (e.g., if you load them from localStorage later)
      await Promise.all([fetchRecruitment(false), fetchUsers(), fetchSectionGroups()]);
      await performStatusCheck('automatic');
    }

    selectedRecruitments.clear();
    selectedRecruitments = selectedRecruitments;
  
    // await fetchCurrentUser();
    // await Promise.all([fetchRecruitment(), fetchUsers(), fetchSectionGroups()]);
    // if (browser) await performStatusCheck('automatic');

    //  selectedRecruitments.clear();
    //   selectedRecruitments = selectedRecruitments;
  });
</script>


<div class="mb-4 p-4 border border-slate-200 rounded-xl bg-slate-50 shadow-sm">
    <div class="flex flex-wrap items-center gap-4">
        <div class="flex-grow">
            <h3 class="font-semibold text-gray-900">Automatic Status Update</h3>
            <p class="text-sm text-gray-600">
                This action will update any recruit from 'Awaiting Response' to 'To Follow Up' if the contact date is older than the specified delay.
            </p>
        </div>

        <div class="flex items-center gap-2">
            <input
                type="number"
                id="threshold-v2"
                bind:value={daysThreshold}
                min="1"
                max="365"
                disabled={isRecalculating}
                class=" px-4 py-2  block w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 sm:text-sm"
                aria-label="Status change delay in days"
            />
            <span class="text-sm text-gray-700">Days</span>
        </div>

        <button
            on:click={updateStatuses}
            disabled={isRecalculating}
            class="inline-flex items-center justify-center px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:bg-blue-400 disabled:cursor-wait"
        >
            {#if isRecalculating}
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
            {:else}
                Recalculate Statuses
            {/if}
        </button>
    </div>
</div>


<div class="mb-6 p-6 border border-slate-200 rounded-2xl bg-white shadow-sm">
  <h3 class="text-xl font-semibold text-gray-900 mb-6">🎯 Filter Recruitments</h3>

  <!-- Filters Grid -->
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 gap-6">
    <!-- First Name -->
    <div>
      <label for="filterFirstName" class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
      <input
        id="filterFirstName"
        type="text"
        bind:value={filterFirstName}
        placeholder="Filter by first name"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
      />
    </div>

    <!-- Last Name -->
    <div>
      <label for="filterLastName" class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
      <input
        id="filterLastName"
        type="text"
        bind:value={filterLastName}
        placeholder="Filter by last name"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
      />
    </div>

    <!-- Section Group -->
    <div>
      <label for="filterSectionGroup" class="block text-sm font-medium text-gray-700 mb-1">Section Group</label>
      <select
        id="filterSectionGroup"
        bind:value={filterSectionGroupId}
        class="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white focus:ring-blue-500 focus:border-blue-500 transition"
      >
        <option value={null}>All Section Groups</option>
        {#each sectionGroups as sg (sg.id)}
          <option value={sg.id}>{sg.name}</option>
        {/each}
      </select>
    </div>

    <!-- Contact Date -->
    <div>
      <label for="filterContactDate" class="block text-sm font-medium text-gray-700 mb-1">Contact Date</label>
      <input
        id="filterContactDate"
        type="date"
        bind:value={filterContactDate}
        class="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
      />
    </div>

    <!-- Contacted By -->
    <div>
      <label for="filterContactedBy" class="block text-sm font-medium text-gray-700 mb-1">Contacted By</label>
      <select
        id="filterContactedBy"
        bind:value={filterContactedBy}
        class="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white focus:ring-blue-500 focus:border-blue-500 transition"
      >
        <option value={null}>All Users</option>
        {#each users as user (user.id)}
          <option value={user.id}>{user.fullName ?? `User #${user.id}`}</option>
        {/each}
      </select>
    </div>

    <!-- Status -->
    <div>
      <label for="filterStatus" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
      <select
        id="filterStatus"
        bind:value={filterStatus}
        class="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white focus:ring-blue-500 focus:border-blue-500 transition"
      >
        <option value="">All Statuses</option>
        {#each statuses as s}
          <option value={s}>{s}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Buttons -->
  <div class="mt-4 flex flex-col sm:flex-row sm:justify-end gap-4">
    <button
      on:click={() => fetchRecruitment(false)}
      class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
    >
      Apply Filters
    </button>
    <button
      on:click={() => clearFilters()}
      class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-gray-800 bg-gray-200 rounded-lg shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
    >
      Clear Filters
    </button>
  </div>
</div>



<div class="container mx-auto p-4 font-inter antialiased">
    <div class="mb-6 flex flex-col sm:flex-row sm:justify-start gap-3">
        <button
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out"
            on:click={openAddModal}
        >
            Add New Recruit
        </button>

        <button
            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out"
            on:click={copySelectedToExcel}
            disabled={selectedRecruitments.size === 0}
        >
            Copy Selected to Excel ({selectedRecruitments.size})
        </button>

         <button
            class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out"
            on:click={deleteSelectedRecruitments}
            disabled={selectedRecruitments.size === 0}
        >
            Delete Selected ({selectedRecruitments.size})
        </button>
    </div>

    <div class="overflow-x-auto rounded-lg shadow-md">
        <table class="min-w-full bg-white border border-gray-200">
            <thead class="bg-gray-100">
                <tr>
                    <th class="px-4 py-3 text-left">
                        <input
                            type="checkbox"
                            class="form-checkbox h-4 w-4 text-blue-600 rounded"
                            on:change={toggleAllRecruitmentsSelection}
                            checked={areAllRecruitmentsSelected()}
                            disabled={recruitment.length === 0}
                        />
                    </th>
                    {#each columns as column (column)}
                        <th
                            class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                            on:click={() => sortTable(column)}
                        >
                            {column === 'sectionGroupId'
                                ? 'Section'
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
            <!-- <tbody class="divide-y divide-gray-200">
                {#each recruitment as r (r.id)}
                    <tr class="hover:bg-gray-50 transition duration-100 ease-in-out">
                        <td class="px-4 py-2">
                            <input
                                type="checkbox"
                                class="form-checkbox h-4 w-4 text-blue-600 rounded"
                                on:change={() => toggleRecruitmentSelection(r.id)}
                                checked={selectedRecruitments.has(r.id)}
                            />
                        </td>
                        <td class="px-4 py-2 text-sm text-gray-800">{r.firstName}</td>
                        <td class="px-4 py-2 text-sm text-gray-800">{r.lastName}</td>
                        <td class="px-4 py-2 text-sm text-gray-800">
                            {r.sectionGroup?.name ?? `ID: ${r.sectionGroupId}`}
                        </td>
                        <td class="px-4 py-2 text-sm text-gray-800">{formatDate(r.contactDate)}</td>
                        <td class="px-4 py-2 text-sm text-gray-800">
                            {r.user?.fullName ?? (r.contactedBy === null ? 'N/A' : `ID: ${r.contactedBy}`)} </td>
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
            </tbody> -->

             <tbody class="divide-y divide-gray-200">
            {#if recruitment.length === 0}
                <tr>
                    <!--
                        colspan should be the total number of columns in your table.
                        Count them:
                        1 (checkbox) +
                        7 (firstName, lastName, sectionGroup, contactDate, contactedBy, status, comment) +
                        1 (Actions)
                        = 9 columns.
                        If you have 'statusUpdatedAt' in your table, it would be 10.
                        Based on your `columns` array, you have 7 data columns.
                        So, 1 (checkbox) + 7 (data) + 1 (actions) = 9.
                        Let's use 9 for now. If your table has more, adjust accordingly.
                    -->
                    <td colspan="9" class="px-4 py-4 text-center text-gray-500">
                        No matching recruitment records found. Adjust your filters or add new recruits.
                    </td>
                </tr>
            {:else}
                {#each recruitment as r (r.id)}
                    <tr class="hover:bg-gray-50 transition duration-100 ease-in-out">
                        <td class="px-4 py-2">
                            <input
                                type="checkbox"
                                class="form-checkbox h-4 w-4 text-blue-600 rounded"
                                on:change={() => toggleRecruitmentSelection(r.id)}
                                checked={selectedRecruitments.has(r.id)}
                            />
                        </td>
                        <td class="px-4 py-2 text-sm text-gray-800">{r.firstName}</td>
                        <td class="px-4 py-2 text-sm text-gray-800">{r.lastName}</td>
                        <td class="px-4 py-2 text-sm text-gray-800">
                            {r.sectionGroup?.name ?? `ID: ${r.sectionGroupId}`}
                        </td>
                        <td class="px-4 py-2 text-sm text-gray-800">{formatDate(r.contactDate)}</td>
                        <td class="px-4 py-2 text-sm text-gray-800">
                            {r.user?.fullName ?? (r.contactedBy === null ? 'N/A' : `ID: ${r.contactedBy}`)}
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
            {/if}
        </tbody>
        </table>
    </div>

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
                            >Section <span class="text-red-500">*</span></label
                        >
                        <select
                            bind:value={editForm.sectionGroupId}
                            class="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        >
                            {#if editForm.sectionGroupId === undefined || sectionGroups.length === 0}
                                <option value="" disabled>Select a section</option>
                            {/if}
                            {#each sectionGroups as sg (sg.id)}
                                <option value={sg.id}>{sg.name}</option>
                            {/each}
                        </select>
                    </div>

                    <div>
                        <label
                            class="block text-sm font-semibold text-gray-700 mb-1"
                            >Contact Date
                            {#if editForm.status !== 'not yet contacted'}
                                <span class="text-red-500">*</span>
                            {/if}
                            </label
                        >
                        <input
                            type="date"
                            bind:value={editForm.contactDate}
                            disabled={editForm.status === 'not yet contacted'} class="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        />
                    </div>

                    <div>
                        <label
                            class="block text-sm font-semibold text-gray-700 mb-1"
                            >Contacted By
                            {#if editForm.status !== 'not yet contacted'}
                                <span class="text-red-500">*</span>
                            {/if}
                            </label
                        >
                        <select
                            bind:value={editForm.contactedBy}
                            disabled={editForm.status === 'not yet contacted'} class="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        >
                            {#if editForm.contactedBy === undefined || editForm.contactedBy === null || users.length === 0}
                                <option value={null} disabled={editForm.status !== 'not yet contacted'}>
                                  Select a user (or N/A for 'not yet contacted')
                                </option>
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
                            placeholder="Add any additional comments here..."
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

<style>
    :global(body) {
        @apply bg-gray-50;
    }
    /* Custom styles for form-checkbox from Tailwind Forms if not directly imported/configured */
    .form-checkbox {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        display: inline-block;
        height: 1rem;
        width: 1rem;
        border-width: 1px;
        border-color: #d1d5db; /* gray-300 */
        background-color: #fff;
        border-radius: 0.25rem; /* rounded */
        vertical-align: middle;
        position: relative;
    }

    .form-checkbox:checked {
        background-color: #2563eb; /* blue-600 */
        border-color: #2563eb; /* blue-600 */
        background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
        background-size: 100% 100%;
        background-position: center;
        background-repeat: no-repeat;
    }

    .form-checkbox:focus {
        outline: 2px solid transparent;
        outline-offset: 2px;
        box-shadow: 0 0 0 3px rgba(100, 150, 255, 0.45); /* blue-500 with opacity */
    }
</style>