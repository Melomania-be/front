<script lang="ts">
	import type { Accounting } from '$lib/types/Accounting';
	import Fa from 'svelte-fa';
	import {
		faArrowsDownToLine,
		faChevronDown,
		faChevronUp,
		faDownload,
		faEye,
		faPenToSquare,
		faSort,
		faSortDown,
		faSortUp,
		faTrashCan,
		faTriangleExclamation,
		faXmark
	} from '@fortawesome/free-solid-svg-icons';
	import {
		File,
		Folder,
		Download,
		Trash2,
		Edit3,
		MoreVertical,
		Music,
		Image,
		Video,
		FileText,
		Eye,
		Upload,
		ChevronDown,
		ChevronRight,
		Plus,
		Info,
		X,
		ArrowDownToLine
	} from 'lucide-svelte';
	import type { ExpenseCategory } from '$lib/types/ExpenseCategory';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import SimpleFilterer from './SimpleFilterer.svelte';
	import type { Contact } from '$lib/types/Contact';
	import type { TableData } from '$lib/types/TableData';
	import { browser } from '$app/environment';
	import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
	import type { Project } from '$lib/types/Project';
	import FileUploader from './filesystem/FileUploader.svelte';
	import { Package } from 'lucide-svelte';
	import FileSystemExplorer from './filesystem/FileSystemExplorer.svelte';
	import type { FileSystemItem } from '$lib/types/FileSystem';
	import FilePreview from './filesystem/FilePreview.svelte';
	import type { CustomParticipant } from '$lib/types/CustomParticipant';
	import type { Participant } from '$lib/types/Participant';
	import { slide } from 'svelte/transition';
	import { tick } from 'svelte';

	type Files = {
		id: number;
		name: string;
		type: string;
		path: string;
		content: string;
		createdAt: string;
		updatedAt: string;
	};

	type Folders = {
		id: number;
		name: string;
		files: Files[];
		createdAt: string;
		updatedAt: string;
	};

	export let accountings: Accounting[] = [];
	export let categories: ExpenseCategory[] = [];
	export let showStatistic = true;
	export let showAttachments = true;
	export let currentParticipant: Participant | CustomParticipant | null = null;
	export let contact: Contact | null = null;
	export let showProject = false;
	export let projectConcerts: Map<number, Date> = new Map();

	const projectId = get(page).params.id;
	const today = new Date();

	let popUpAdd = false;
	let updateMode = false;
	let updateAttachmentMode = false;

	function showPopUpAdd() {
		popUpAdd = true;
		fetchContacts();
		if (currentParticipant) {
			AccountingpaymentToIndiv = true;
			AccountingcontactId = currentParticipant.contact.id;
			AccountingNamecontactSelected =
				currentParticipant.contact.firstName + ' ' + currentParticipant.contact.lastName;
		}
		if (contact) {
			AccountingpaymentToIndiv = true;
			AccountingcontactId = contact.id;
			AccountingNamecontactSelected = contact.firstName + ' ' + contact.lastName;
		}
	}

	let AccountingName: string | null = null;
	let AccountingBillDate: string = '';
	let AccountingPaymentDate: string = '';
	let AccountingCategory: number | null = null;
	let AccountingAmount: number | null = null;
	let AccountingId: number | null = null;
	let AccountingpaymentToIndiv: boolean = false;
	let AccountingAttachments: number[] = [];

	let AccountingcontactId: Number | null = null;
	let AccountingNamecontactSelected: string = '';
	let AccountingIsMusicianFee: boolean = true;

	let showPreview = false;
	let previewFile: FileSystemItem | null = null;

	let isMobile = false;

	const checkMobile = () => {
		isMobile = window.innerWidth <= 1000;
	};

	onMount(() => {
		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});

	let allFiles: Files[] = [];
	let accountingFolder: Folders;

	let categoriesToDisplay = categories || [];

	$: if (AccountingpaymentToIndiv && categories) {
		// Pour les paiements individuels, on affiche les catégories liées aux musiciens
		categoriesToDisplay = categories.filter((cat) =>
			cat.name.toLowerCase().includes('musician') ||
			cat.name.toLowerCase().includes('musicien') ||
			cat.id === 1 || cat.id === 2  // Garde la compatibilité avec les anciens IDs
		);

		// Si aucune catégorie trouvée, afficher les deux premières catégories par défaut
		if (categoriesToDisplay.length === 0 && categories.length > 0) {
			categoriesToDisplay = categories.slice(0, 2);
		}
	} else if (categories) {
		categoriesToDisplay = categories;
	}

	$: if (categories && categories.length > 0) {
		console.log('📊 Categories loaded:', categories.map(c => ({
			id: c.id,
			name: c.name,
			color: c.color,
			isDefault: c.isDefault
		})));
		console.log('🔍 Categories to display:', categoriesToDisplay.map(c => ({
			id: c.id,
			name: c.name
		})));
		console.log('💳 Payment to individual mode:', AccountingpaymentToIndiv);
	}

	onMount(async () => {
		let response = await fetch('/api/folders', {
			method: 'GET'
		});

		if (response.ok) {
			let data = await response.json();
			const allFolders = data;

			if (allFolders.find((f: Folders) => f.name == 'Accountings Attachments')) {
				accountingFolder = allFolders.find((f: Folders) => f.name == 'Accountings Attachments');
			} else {
				const folderName = 'Accountings Attachments';
				let response = await fetch('/api/folders', {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ name: folderName })
				});

				if (response.ok) {
					accountingFolder = await response.json();
				} else if (response.status >= 400 && response.status < 500) {
					const jsonResponse = await response.json();
					const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
					alert(error);
				} else if (response.status >= 500) {
					alert('Server error');
				}
			}

			if (accountingFolder) {
				fetchAccountingFolder();
			}
		}
	});

	async function addAccounting() {
		if (!AccountingAmount || !AccountingName) {
			alert('Please fill in required fields: Name and Amount');
			return;
		}

		let payload;
		let billDateISO;
		let paymentDateISO;

		if (AccountingBillDate) {
			billDateISO = new Date(AccountingBillDate).toISOString().split('T')[0];
		} else {
			billDateISO = null;
		}
		if (AccountingPaymentDate) {
			paymentDateISO = new Date(AccountingPaymentDate).toISOString().split('T')[0];
		} else {
			paymentDateISO = null;
		}

		if (AccountingNamecontactSelected != '' && AccountingpaymentToIndiv) {
			AccountingName = 'Payment ' + AccountingNamecontactSelected + ' : ' + AccountingName;
		}

		if (AccountingpaymentToIndiv) {
			if (AccountingCategory == 1) {
				AccountingIsMusicianFee = true;
			} else {
				AccountingIsMusicianFee = false;
			}
		}

		if (!AccountingpaymentToIndiv) {
			AccountingNamecontactSelected = '';
			AccountingcontactId = null;
			AccountingIsMusicianFee = false;
		}

		let attachment = AccountingAttachments.length > 0 ? AccountingAttachments.join('/') : null;

		if (updateMode && AccountingId) {
			payload = {
				id: AccountingId,
				name: AccountingName,
				bill_date: billDateISO,
				payment_date: paymentDateISO,
				amount: AccountingAmount,
				category_id: AccountingCategory,
				contact_id: AccountingcontactId,
				attachment: attachment,
				is_individual_payment: AccountingpaymentToIndiv,
				is_musician_fee: AccountingIsMusicianFee,
				project: {
					id: +projectId
				}
			};
		} else {
			payload = {
				name: AccountingName,
				bill_date: billDateISO,
				payment_date: paymentDateISO,
				amount: AccountingAmount,
				category_id: AccountingCategory,
				contact_id: AccountingcontactId,
				attachment: attachment,
				is_individual_payment: AccountingpaymentToIndiv,
				is_musician_fee: AccountingIsMusicianFee,
				project: {
					id: +projectId
				}
			};
		}

		try {
			const res = await fetch(`/api/projects/${projectId}/management/accounting`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			if (!res.ok) {
				const errorResponse = await res.json();
				console.error('Error creating/updating accounting:', errorResponse);
				alert('Error: ' + (errorResponse.error || 'Unknown error'));
				return;
			}

			const newAccounting: Accounting = await res.json();

			if (updateMode) {
				accountings = accountings
					.map((acc) => (acc.id === newAccounting.id ? newAccounting : acc))
					.sort((a, b) => a.id - b.id);
				accountingsDisplayed = accountings;
			} else {
				accountings = [newAccounting, ...accountings].sort((a, b) => a.id - b.id);
				accountingsDisplayed = accountings;
			}

			if (!updateAttachmentMode) {
				resetInput();
			}
		} catch (error) {
			console.error('Network error:', error);
			alert('Network error: ' + error.message);
		}
	}

	function resetInput() {
		AccountingName = '';
		AccountingBillDate = '';
		AccountingPaymentDate = '';
		AccountingAmount = null;
		AccountingCategory = null;
		AccountingpaymentToIndiv = false;
		AccountingNamecontactSelected = '';
		AccountingcontactId = null;
		AccountingIsMusicianFee = true;
		AccountingAttachments = [];
		popUpAdd = false;
		updateMode = false;
		selectedFiles = [];
		selectedAttachements = [];
	}

	async function deleteItem(item: FileSystemItem) {
		try {
			let d = true;
			if (!accountingDeletion) {
				d = confirm(`Are you sure you want to delete "${item.name}"?`);
			}
			if (!d) return;

			if (AccountingAttachments) {
				AccountingAttachments = AccountingAttachments.filter((a) => a !== item.id);
				addAccounting();
			}

			if (!updateMode && accountings) {
				for (const acc of accountings) {
					if (acc.attachment) {
						const att = acc.attachment.split('/').map(Number);
						if (att.find((a) => a == item.id)) {
							AccountingAttachments = att.filter((a) => a !== item.id);
							AccountingName = acc.name;
							const match = acc.name.match(/^Payment\s(.+?)\s*:\s*(.+)$/);
							if (match) {
								AccountingpaymentToIndiv = true;
								AccountingNamecontactSelected = match[1].trim();
								AccountingName = match[2].trim();
							} else {
								AccountingName = acc.name;
							}
							if (acc.billDate) {
								AccountingBillDate = acc.billDate;
							}
							if (acc.paymentDate) {
								AccountingPaymentDate = acc.paymentDate;
							}
							AccountingAmount = acc.amount;
							AccountingCategory = acc.categoryId;
							AccountingIsMusicianFee = acc.isMusicianFee;
							AccountingId = acc.id;
							updateMode = true;

							addAccounting();
						}
					}
				}
			}

			const endpoint = item.type === 'file' ? 'files' : 'folders';
			const response = await fetch(`/api/filesystem/${endpoint}/${item.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				fetchAccountingFolder();
			} else {
				console.error('Delete failed:', response.status);
				alert('Error deleting item');
			}
		} catch (error) {
			console.error('Error deleting item:', error);
			alert('Delete error: ' + error.message);
		}
	}

	let accountingDeletion = false;

	async function deleteAccounting() {
		if (!AccountingId) {
			alert('No accounting entry selected for deletion');
			return;
		}

		accountingDeletion = true;
		try {
			const confirmed = window.confirm('Are you sure you want to delete this accounting?');

			if (!confirmed) {
				accountingDeletion = false;
				return;
			}

			const res = await fetch(`/api/projects/${projectId}/management/accounting/${AccountingId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!res.ok) {
				const errorResponse = await res.json();
				console.error('Error deleting accounting:', errorResponse);
				alert('Error: ' + (errorResponse.error || 'Unknown error'));
				accountingDeletion = false;
				return;
			}

			alert('Accounting entry deleted successfully.');
			if (folder.children) {
				let files = folder.children.filter((child) => AccountingAttachments.includes(child.id));
				for (const file of files) {
					deleteItem(file);
				}
			}
			window.location.reload();
		} catch (error) {
			console.error('Network error:', error);
			alert('Network error: ' + error.message);
		}
		accountingDeletion = false;
	}

	let totalExpenses = 0;
	let currentExpenses = 0;
	let futureExpenses = 0;

	let totalIncomes = 0;
	let currentIncomes = 0;
	let futureIncomes = 0;

	let totalBalance = 0;
	let currentBalance = 0;
	let futureBalance = 0;

$: if (accountings && accountings.length > 0) {
    totalExpenses = 0;
    currentExpenses = 0;
    futureExpenses = 0;

    totalIncomes = 0;
    currentIncomes = 0;
    futureIncomes = 0;

    const now = new Date();

    for (const acc of accountings) {
        const amount = Number(acc.amount);
        const bankDate = acc.paymentDate ? new Date(acc.paymentDate) : null;

        if (amount < 0) {
            totalExpenses += amount;
            if (bankDate && bankDate < now) {
                currentExpenses += amount;
            } else {
                futureExpenses += amount;
            }
        } else {
            totalIncomes += amount;
            if (bankDate && bankDate < now) {
                currentIncomes += amount;
            } else {
                futureIncomes += amount;
            }
        }
    }

    totalBalance = totalIncomes + totalExpenses;
    currentBalance = currentIncomes + currentExpenses;
    futureBalance = futureIncomes + futureExpenses;
}

	let search = '';
	let accountingsDisplayed: Accounting[] = [];

	$: if (accountings && accountingsDisplayed.length === 0) {
		accountingsDisplayed = [...accountings];
	}

	function filterAccountings(term: string) {
		if (!accountings) return;

		search = term.toLowerCase().trim();
		let accountingsDisplayed2 = accountings.filter((acc) =>
			acc.name.toLowerCase().includes(search)
		);
		accountingsDisplayed = [...accountingsDisplayed2];
	}

	let sorting: string = 'id';

	function sortAccountingsBy(key: keyof Accounting, ascending = true) {
		if (!accountings) return;

		let accountingsDisplayed2 = [...accountingsDisplayed].sort((a, b) => {
			const aVal = a[key];
			const bVal = b[key];

			if (aVal == null) return 1;
			if (bVal == null) return -1;

			if (key === 'amount' || key === 'categoryId' || key === 'id') {
				return ascending ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
			}

			else if (typeof aVal === 'string' && typeof bVal === 'string') {
				return ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
			}

			if (
				typeof aVal === 'string' &&
				typeof bVal === 'string' &&
				/^\d{4}-\d{2}-\d{2}$/.test(aVal)
			) {
				return ascending
					? new Date(aVal).getTime() - new Date(bVal).getTime()
					: new Date(bVal).getTime() - new Date(aVal).getTime();
			}

			return 0;
		});
		accountingsDisplayed = [...accountingsDisplayed2];
	}

	let contacts: Contact[] = [];
	let meta: any = {};
	let options: any = {
		filter: '',
		limit: 250,
		page: 1,
		order: 'asc',
		orderBy: 'id'
	};
	let url: string = '/api/contacts';

	let dataHolder: TableData<Contact>;

	async function fetchContacts() {
		let optionInUrls = `?page=${options.page}&limit=${options.limit}`;
		optionInUrls += '&filter=' + options.filter;
		optionInUrls += '&orderBy=' + options.orderBy;
		optionInUrls += '&order=' + options.order;

		const response = await fetch(`${url}${optionInUrls}`, {
			method: 'GET'
		});

		const responseHandler = new ResponseHandlerClient();

		responseHandler.handle(response, async () => {
			const data = await response.json();

			contacts = data.data;
			displayedContacts = contacts;
			meta = data.meta;

			dataHolder = {
				data: contacts,
				columns: ['firstName', 'lastName'],
				notOrderedColumns: []
			};
		});
	}

	let displayedContacts: Contact[] = [];

	function filterContacts(search: string) {
		AccountingcontactId = null;
		let filteredContacts;
		if (search.trim() === '') {
			filteredContacts = [...contacts];
		} else {
			filteredContacts = contacts.filter(
				(c) =>
					c.firstName.toLowerCase().includes(search.toLowerCase()) ||
					c.lastName.toLowerCase().includes(search.toLowerCase())
			);
		}
		displayedContacts = [...filteredContacts];
	}

	let submited = false;

	async function handleGeneralUpload(files: FileList) {
		const formData = new FormData();

		if (files.length === 1) {
			formData.append('file', files[0]);
		} else {
			Array.from(files).forEach((file) => {
				formData.append('files', file);
			});
		}

		if (accountingFolder) {
			formData.append('parentId', accountingFolder.id.toString());
		}

		try {
			const response = await fetch('/api/filesystem/upload', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (response.ok && result.success) {
				showGeneralUploader = false;
			} else {
				console.error('General upload failed:', result.error);
				alert('Upload failed: ' + (result.error || 'Unknown error'));
			}
		} catch (error) {
			console.error('Error uploading general files:', error);
			alert('Error uploading files: ' + error.message);
		}
	}

	async function submitFiles() {
		var fd = new FormData();

		if (!selectedFiles || selectedFiles.length === 0) {
			alert('Please select a file');
			return;
		}

		if (accountingFolder) {
			fd.append('parentId', accountingFolder.id.toString());
		}

		if (selectedFiles.length === 1) {
			fd.append('file', selectedFiles[0]);
		} else {
			for (let i = 0; i < selectedFiles.length; i++) {
				fd.append('files', selectedFiles[i]);
			}
		}

		let response = await fetch('/api/filesystem/upload', {
			method: 'POST',
			body: fd
		});

		if (response.ok) {
			submited = true;
			const uploadedFiles = await response.json();
			if (uploadedFiles.files) {
				for (const file of uploadedFiles.files) {
					AccountingAttachments.push(file.id);
				}
				if (accountingFolder?.files) {
					accountingFolder.files.push(...uploadedFiles.files);
				}
			}

			if (accountingFolder) {
				const request = await fetch(`/api/folders/`, {
					method: 'POST',
					body: JSON.stringify({ ...accountingFolder })
				});

				if (!request.ok) {
					if (request.status >= 400 && request.status < 500) {
						const jsonResponse = await request.json();
						const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
						alert(error);
					} else if (request.status >= 500) {
						alert('Server error');
					}
				}
			}
		} else {
			if (response.status >= 400 && response.status < 500) {
				const jsonResponse = await response.json();
				const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
				alert(error);
			} else if (response.status >= 500) {
				alert('Server error');
			}
		}
	}

	let selectedFiles: File[] = [];

	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = input.files;

		if (files) {
			selectedFiles = Array.from(files);
		}
	}

	function removeFile(index: number) {
		selectedFiles = selectedFiles.filter((_, i) => i !== index);
	}

	let popUpAttachement = false;
	let selectedAttachements: Files[] = [];

	async function downloadFile(file: Files) {
		try {
			const response = await fetch(`/api/files/${file.id}`, {
				method: 'GET'
			});

			if (!response.ok) {
				if (response.status >= 400 && response.status < 500) {
					const jsonResponse = await response.json();
					const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
					alert(error);
				} else if (response.status >= 500) {
					alert('Server error');
				}
				return;
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');

			a.href = window.URL.createObjectURL(
				new Blob([blob], {
					type: file.type
				})
			);
			a.download = file.name;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			console.error('Error downloading file:', error);
			alert('Error downloading file: ' + error.message);
		}
	}

	async function deleteFile(file: Files) {
		try {
			const request = await fetch(`/api/files/${file.id}`, {
				method: 'DELETE'
			});

			if (!request.ok) {
				if (request.status >= 400 && request.status < 500) {
					const jsonResponse = await request.json();
					const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
					alert(error);
				} else if (request.status >= 500) {
					alert('Server error');
				}
			}
		} catch (error) {
			console.error('Error deleting file:', error);
			alert('Error deleting file: ' + error.message);
		}
	}

	let showGeneralUploader = false;

	let folder: FileSystemItem = {
		id: 0,
		name: '',
		type: 'folder',
		path: '',
		createdAt: new Date(),
		updatedAt: new Date(),
		children: [],
		materials: []
	};

	async function fetchAccountingFolder() {
		if (!accountingFolder || !accountingFolder.id) {
			return;
		}
		try {
			const response = await fetch(`/api/filesystem/folders/${accountingFolder.id}/contents`);
			if (response.ok) {
				const contents = await response.json();

				if (folder.name === 'Scores') {
					const enrichedContents = await Promise.all(
						contents.map(async (item) => {
							if (item.type === 'folder' && item.pieceId) {
								try {
									const materialsResponse = await fetch(`/api/materials/piece/${item.pieceId}`);
									if (materialsResponse.ok) {
										const materials = await materialsResponse.json();
										item.materials = materials;
									}
								} catch (error) {
									console.error('Error loading materials for piece:', item.pieceId, error);
									item.materials = [];
								}
							}
							return item;
						})
					);

					folder.children = enrichedContents.map((item) => ({
						...item,
						updatedAt: new Date(item.updatedAt),
						createdAt: new Date(item.createdAt)
					}));
				} else {
					folder.children = contents.map((item) => ({
						...item,
						updatedAt: new Date(item.updatedAt),
						createdAt: new Date(item.createdAt)
					}));
				}

				folder = { ...folder };
			}
		} catch (error) {
			console.error('Error loading folder contents:', error);
		}
	}

	async function handleGeneralRefresh() {
		if (folder) {
			await fetchAccountingFolder();
		}
	}

	function previewFileFunction(item: FileSystemItem) {
		previewFile = item;
		showPreview = true;
	}

	async function downloadFileFunction(item: FileSystemItem) {
		if (item.type === 'file') {
			try {
				const response = await fetch(`/api/files/download/${item.id}`);
				if (response.ok) {
					const blob = await response.blob();
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = item.name;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					URL.revokeObjectURL(url);
				} else {
					console.error('Download failed:', response.status);
					alert('Error downloading file');
				}
			} catch (error) {
				console.error('Error downloading file:', error);
				alert('Download error: ' + error.message);
			}
		}
	}

	async function renameItem(item: FileSystemItem) {
		const newName = prompt('New name:', item.name);
		if (newName && newName !== item.name) {
			try {
				const endpoint = item.type === 'file' ? 'files' : 'folders';
				const response = await fetch(`/api/filesystem/${endpoint}/${item.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: newName })
				});

				if (response.ok) {
					window.location.reload();
				} else {
					console.error('Rename failed:', response.status);
					alert('Error renaming item');
				}
			} catch (error) {
				console.error('Error renaming item:', error);
				alert('Rename error: ' + error.message);
			}
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function getFileIcon(item: FileSystemItem) {
		if (item.type === 'folder') return Folder;

		const extension = item.name.split('.').pop()?.toLowerCase();
		switch (extension) {
			case 'pdf':
			case 'doc':
			case 'docx':
				return FileText;
			case 'jpg':
			case 'jpeg':
			case 'png':
			case 'gif':
			case 'webp':
			case 'svg':
			case 'tiff':
				return Image;
			case 'mp3':
			case 'wav':
			case 'flac':
			case 'aac':
			case 'ogg':
			case 'm4a':
				return Music;
			case 'mp4':
			case 'avi':
			case 'mov':
			case 'mkv':
			case 'webm':
				return Video;
			default:
				return File;
		}
	}

	function getFileColor(item: FileSystemItem): string {
		if (item.type === 'folder') return 'text-blue-600';

		const extension = item.name.split('.').pop()?.toLowerCase();
		switch (extension) {
			case 'pdf':
				return 'text-red-600';
			case 'jpg':
			case 'jpeg':
			case 'png':
			case 'gif':
			case 'webp':
				return 'text-green-600';
			case 'mp3':
			case 'wav':
			case 'flac':
				return 'text-purple-600';
			case 'mp4':
			case 'avi':
			case 'mov':
				return 'text-orange-600';
			default:
				return 'text-gray-700';
		}
	}

	async function fetchProject(projectId: number) {
		if (!projectId || projectConcerts.has(projectId)) return;

		try {
			const response = await fetch(`/api/projects/${projectId}`);
			if (!response.ok) {
				// Si le projet n'existe pas, on marque qu'on a tenté de le charger
				// pour éviter de retry sans cesse
				projectConcerts.set(projectId, new Date(0)); // Date très ancienne
				projectConcerts = new Map(projectConcerts);
				return;
			}

			const data = await response.json();

			if (Array.isArray(data.concerts) && data.concerts.length > 0) {
				const sortedConcerts = data.concerts
					.map((c) => new Date(c.startDate))
					.sort((a, b) => b.getTime() - a.getTime());

				projectConcerts.set(projectId, sortedConcerts[0]);
				projectConcerts = new Map(projectConcerts);
			} else {
				// Pas de concerts, on met une date très ancienne
				projectConcerts.set(projectId, new Date(0));
				projectConcerts = new Map(projectConcerts);
			}
		} catch (error) {
			// Erreur silencieuse, on marque juste qu'on a essayé
			projectConcerts.set(projectId, new Date(0));
			projectConcerts = new Map(projectConcerts);
		}
	}

	onMount(() => {
		if (projectId) {
			fetchProject(Number(projectId));
		}
	});

	let displayAttachments = false;
	let chevronAttachments: any = faChevronDown;
</script>

{#if popUpAttachement}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
		<div
			class="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center h-[80%] {isMobile
				? 'w-[90%]'
				: 'w-[60%]'} relative"
		>
			<button
				on:click={() => {
					popUpAttachement = false;
					resetInput();
					updateAttachmentMode = false;
				}}
				class="absolute top-2 right-3"
			>
				<Fa icon={faXmark} class="text-[20px]" style="color: #6b7280;" />
			</button>
			<h2 class="text-lg text-gray-500 font-bold mb-8 uppercase">{AccountingName}</h2>
			<div class="w-full p-4">
				<div class="gap-4 flex flex-col">
					{#if accountingFolder && folder.children}
						{#each folder.children.filter( (child) => AccountingAttachments.includes(child.id) ) as file}
							<div class="flex w-full border-2 rounded-full p-2 px-4">
								<div class="flex w-[60%] items-center">
									<div
										class="flex-shrink-0 w-10 h-10 border-gray-300 group-hover:border-[#6B9AD9] transition-colors flex items-center justify-center"
									>
										<svelte:component
											this={getFileIcon(file)}
											size={isMobile ? 20 : 24}
											class={getFileColor(file)}
										/>
									</div>
									<div class={isMobile ? 'text-xs gap-2 h-14' : 'flex w-full'}>
										<h3
											class="font-bold text-gray-500 truncate text-sm py-2 {isMobile
												? ' w-[20vw]'
												: ''}"
											title={file.name}
										>
											{file.name}
										</h3>
										<span
											class="bg-blue-100 text-blue-800 h-8 ml-auto {isMobile
												? 'text-xs'
												: 'text-sm'} mr-0 px-2 py-1 rounded font-semibold border border-blue-300"
										>
											{formatFileSize(file.size || 0)}
										</span>
									</div>
								</div>
								<div class="grid grid-cols-3 ml-auto mr-0">
									<button
										class="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700 font-semibold"
										on:click={() => {
											previewFileFunction(file);
										}}
									>
										<Fa icon={faEye} class="text-[16px]" style="color: #6b7280;" />
									</button>

									<button
										class="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700 font-semibold"
										on:click={() => {
											downloadFileFunction(file);
										}}
									>
										<Fa icon={faDownload} class="text-[16px]" style="color: #6b7280;" />
									</button>
									<button
										class="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-400 flex items-center gap-2 font-semibold"
										on:click={() => {
											deleteItem(file);
										}}
									>
										<Fa icon={faTrashCan} class="text-[16px]" style="color: #f87171;" />
									</button>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

{#if popUpAdd}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
		<div
			class="bg-white p-6 rounded-xl max-h-[80vh] shadow-xl flex flex-col items-center {isMobile
				? 'w-[90%]'
				: 'w-[60%]'} {AccountingpaymentToIndiv ? 'h-[80%]' : 'h-auto'}  relative"
		>
			<button
				on:click={() => {
					popUpAdd = false;
					resetInput();
				}}
				class="absolute top-2 right-3"
			>
				<Fa icon={faXmark} class="text-[20px]" style="color: #6b7280;" />
			</button>
			<h2 class="text-lg text-gray-500 font-bold mb-8">{updateMode ? 'Edit' : 'New'}</h2>
			<div class="h-full w-full flex overflow-y-auto">
				<div class="flex flex-col gap-2 items-center w-full">
					<div class="flex gap-2 text-gray-500 items-center font-semibold">
						<input
							bind:checked={AccountingpaymentToIndiv}
							type="checkbox"
							class="w-4 h-4 text-blue-400 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
						/>
						<span>Payment to individual </span>
					</div>
					<div class="w-full h-full h-max-[40%] {isMobile ? 'mb-2' : 'flex'}">
						<div class="flex flex-1 flex-col w-full items-center">
							<div
								class="flex flex-col {isMobile
									? 'w-[70%]'
									: AccountingpaymentToIndiv
										? 'w-[80%]'
										: 'w-[50%]'}"
							>
								<div
									class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500"
									style="width: fit-content;"
								>
									Name
								</div>
								<textarea
									class="p-2 px-3 border-2 border-gray-500 h-11 rounded-xl focus:outline-none"
									bind:value={AccountingName}
									placeholder="Name"
									required
								/>
							</div>
							<div
								class="flex flex-col {isMobile
									? 'w-[70%]'
									: AccountingpaymentToIndiv
										? 'w-[80%]'
										: 'w-[50%]'}"
							>
								<div
									class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500"
									style="width: fit-content;"
								>
									Bill Date
								</div>
								<input
									type="date"
									class="p-2 px-3 border-2 border-gray-500 rounded-xl focus:outline-none"
									bind:value={AccountingBillDate}
									placeholder="Bill Date"
									required
								/>
							</div>
							<div
								class="flex flex-col {isMobile
									? 'w-[70%]'
									: AccountingpaymentToIndiv
										? 'w-[80%]'
										: 'w-[50%]'}"
							>
								<div
									class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500"
									style="width: fit-content;"
								>
									Bank Date
								</div>
								<input
									type="date"
									class="p-2 px-3 border-2 border-gray-500 rounded-xl focus:outline-none"
									bind:value={AccountingPaymentDate}
									placeholder="Payment Date"
									required
								/>
							</div>
							<div
								class="flex flex-col {isMobile
									? 'w-[70%]'
									: AccountingpaymentToIndiv
										? 'w-[80%]'
										: 'w-[50%]'} relative"
							>
								<div
									class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500"
									style="width: fit-content;"
								>
									Amount
								</div>
								<input
									type="number"
									step="0.01"
									class="p-2 pr-10 px-3 border-2 border-gray-500 rounded-xl focus:outline-none"
									bind:value={AccountingAmount}
									placeholder="Amount"
									required
								/>
								<span
									class="absolute right-5 top-5 text-gray-500 pointer-events-none font-semibold text-md"
								>€</span
								>
							</div>
							<div
								class="flex flex-col {isMobile
									? 'w-[70%]'
									: AccountingpaymentToIndiv
										? 'w-[80%]'
										: 'w-[50%]'} relative mb-8"
							>
								<div
									class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500"
									style="width: fit-content;"
								>
									Expense Category
								</div>
								<select
									bind:value={AccountingCategory}
									class="p-2 px-3 border-2 border-gray-500 rounded-xl focus:outline-none"
									required
								>
									<option value={null}>Select category</option>
									{#each categoriesToDisplay as cat}
										<option value={cat.id}>{cat.name}</option>
									{/each}
								</select>
							</div>
							<div class="border-2 rounded-xl p-4 border-gray-500 w-[80%] h-min mb-1">
								<p class="font-bold uppercase text-gray-600">Upload files</p>
								<label
									for="files"
									class="block w-full p-6 text-center border-2 border-dashed border-gray-400 rounded-lg cursor-pointer hover:border-gray-600 transition-colors duration-300"
								>
									Click or drag files here to upload
									<input
										id="files"
										multiple
										type="file"
										class="hidden"
										on:change={handleFileChange}
									/>
								</label>

								{#if selectedFiles.length > 0}
									<div class="mt-2 text-gray-600 italic">
										Selected files:
										<div class="grid grid-cols-1 gap-4">
											{#each selectedFiles as file, index}
												<div class="border-2 rounded-xl border-gray-500 p-2 flex gap-4">
													<p>{file.name}</p>
													<button
														class="rounded-lg bg-red-400 text-white p-1 px-2 ml-auto mr-0"
														on:click={() => removeFile(index)}
													>
														<Fa icon={faTrashCan} class="text-[16px]" style="color: white;" />
													</button>
												</div>
											{/each}
										</div>
									</div>
								{:else}
									<div class="mt-2 text-gray-500 italic">No files selected</div>
								{/if}
								<button
									class="p-1 mt-4 px-3 bg-blue-400 text-white rounded-lg font-semibold"
									type="submit"
									on:click={submitFiles}>Submit</button
								>
								{#if submited}
									<span class="text-green-600">✅ File Submitted </span>
								{/if}
							</div>
						</div>
						{#if AccountingpaymentToIndiv}
							<div
								class="border-2 {isMobile
									? 'mb-2'
									: 'max-h-full h-full min-h-64'} border-gray-500 rounded-full flex"
							></div>
							<div class="flex-1 flex flex-col justify-center items-center h-full mt-10">
								<div
									class="flex flex-col {isMobile
										? 'w-[70%]'
										: AccountingpaymentToIndiv
											? 'w-[80%]'
											: 'w-[50%]'}"
								>
									<div
										class="-mb-2 text-[12px] bg-white z-20 ml-6 font-semibold pl-3 pr-3 text-gray-500"
										style="width: fit-content;"
									>
										Person Name
									</div>
									<input
										class="p-2 px-3 border-2 border-gray-500 h-11 rounded-xl focus:outline-none"
										bind:value={AccountingNamecontactSelected}
										on:input={() => filterContacts(AccountingNamecontactSelected)}
										placeholder="Person Name"
										required
									/>
								</div>
								<div
									class="rounded-xl my-4 border-2 pt-4 border-gray-400 bg-gray-200 flex w-[95%] h-full"
								>
									<div class="grid grid-cols-2 gap-4 p-4 max-h-[460px] overflow-y-auto w-full">
										{#if contacts}
											{#each displayedContacts as contact}
												<div
													class="flex h-10 items-center p-4 border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 bg-white dark:bg-gray-800"
												>
													<input
														type="radio"
														bind:group={AccountingcontactId}
														on:change={() => {
															AccountingNamecontactSelected =
																contact.firstName + ' ' + contact.lastName;
														}}
														value={contact.id}
														class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
													/>
													<div class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
														{contact.firstName}
														{contact.lastName}
													</div>
												</div>
											{/each}
										{/if}
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
			<div class="w-full gap-8 flex justify-center">
				{#if updateMode}
					<button
						class="mt-4 w-[30%] px-4 py-2 bg-red-400 text-white rounded font-semibold"
						on:click={() => {
							deleteAccounting();
						}}>Delete</button
					>
				{:else}
					<button
						class="mt-4 w-[30%] px-4 py-2 bg-[#6b9ad9] text-white rounded font-semibold"
						on:click={() => {
							popUpAdd = false;
							resetInput();
						}}>Cancel</button
					>
				{/if}
				<button
					class="mt-4 w-[30%] px-4 py-2 bg-[#6b9ad9] text-white rounded font-semibold"
					on:click={() => {
						addAccounting();
						if (!updateAttachmentMode) {
							popUpAdd = false;
						}
					}}
				>
					{#if updateMode}
						<p>Save</p>
					{:else}
						<p>Add</p>
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if categories}
	<div class="grid grid-cols-1 w-full border-2 rounded-xl border-gray-400 p-4 bg-white mb-4">
		{#if showStatistic}
			<h1 class="font-bold text-lg mb-4">ACCOUNTING</h1>
		{/if}
		<div class="flex mb-6">
			<div class=" {isMobile ? 'w-[60%] text-sm' : 'w-[70%]'}">
				{#if accountings && showStatistic}
					<div
						class="h-auto w-full items-center flex flex-cols {isMobile
							? 'flex-col'
							: ''} gap-4 text-gray-600 font-bold"
					>
						<div class="border-2 w-full rounded-xl border-gray-400 p-2 px-4">
							<div>
								Total Expenses :
								<span class="text-blue-500">{totalExpenses} €</span>
							</div>
							<div>
								Current Expenses :
								<span class="text-red-500"> {currentExpenses} € </span>
							</div>
							<div>
								Expenses To Come :
								<span class="text-green-500">{futureExpenses} €</span>
							</div>
						</div>
						<div class="border-2 w-full rounded-xl border-gray-400 p-2 px-4">
							<div>
								Total Incomes :
								<span class="text-blue-500">{totalIncomes} €</span>
							</div>
							<div>
								Current Incomes :
								<span class="text-red-500"> {currentIncomes} € </span>
							</div>
							<div>
								Incomes To Come :
								<span class="text-green-500">{futureIncomes} €</span>
							</div>
						</div>
						<div class="border-2 w-full rounded-xl border-gray-400 p-2 px-4">
							<div>
								Total Balance :
								<span class="text-blue-500">{totalBalance} €</span>
							</div>
							<div>
								Current Balance :
								<span class="text-red-500"> {currentBalance} € </span>
							</div>
							<div>
								Future Balance :
								<span class="text-green-500">{futureBalance} €</span>
							</div>
						</div>
					</div>
				{/if}
			</div>
			{#if !contact}
				<button
					on:click={() => showPopUpAdd()}
					class="bg-[#6B9AD9] {isMobile
						? 'h-10'
						: ''} px-4 mb-4 rounded-lg text-sm hover:bg-blue-700 text-white font-semibold ml-auto p-2"
				>Add New</button
				>
			{/if}
		</div>

		<div class="w-full mb-2">
			<div class="flex items-center {isMobile ? 'w-full' : 'w-[40%]'}  relative">
				<input
					value={search}
					on:input={(e) => filterAccountings(e.target.value)}
					type="text"
					placeholder="Search..."
					class="w-full px-4 py-2 rounded-full border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
				/>
				<button
					class="absolute right-4"
					on:click={() => {
						search = '';
						filterAccountings('');
					}}
				>
					<Fa icon={faXmark} class="text-[16px]" style="color: #9ca3af;" />
				</button>
			</div>
		</div>
		<div class="overflow-x-auto mt-2">
			<table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
				<thead
					class="text-xs text-gray-700 uppercase border-b-2 border-gray-300 text-center dark:bg-gray-700 dark:text-gray-400 h-8"
				>
				<tr class="font-semibold text-md">
					{#if showProject}
						<th class="min-w-20 text-left">Project</th>
					{/if}
					<th class="min-w-60">
						<div class="flex relative items-center">
							<p>Name</p>
							<button
								class="absolute left-12"
								on:click={() => {
										if (sorting === 'nameA') {
											sorting = 'nameD';
											sortAccountingsBy('name', false);
										} else if (sorting === 'nameD') {
											sorting = 'id';
											sortAccountingsBy('id');
										} else {
											sorting = 'nameA';
											sortAccountingsBy('name');
										}
									}}
							>
								{#if sorting === 'nameA'}
									<div class="absolute top-[-7px]">
										<Fa icon={faSortUp} class="text-[14px] absolute" style="color: #6b7280;" />
										<Fa icon={faSortDown} class="text-[14px] absolute" style="color: #d1d5db;" />
									</div>
								{:else if sorting === 'nameD'}
									<div class="absolute top-[-7px]">
										<Fa icon={faSortUp} class="text-[14px] absolute" style="color: #d1d5db;" />
										<Fa icon={faSortDown} class="text-[14px] absolute" style="color: #6b7280;" />
									</div>
								{:else}
									<Fa icon={faSort} class="text-[14px]" style="color: #6b7280;" />
								{/if}
							</button>
						</div>
					</th>
					<th class="min-w-24">
						<div class="flex relative items-center">
							<p>Bill Date</p>
							<button
								class="absolute left-[70px]"
								on:click={() => {
										if (sorting === 'billDateA') {
											sorting = 'billDateD';
											sortAccountingsBy('billDate', false);
										} else if (sorting === 'billDateD') {
											sorting = 'id';
											sortAccountingsBy('id');
										} else {
											sorting = 'billDateA';
											sortAccountingsBy('billDate');
										}
									}}
							>
								{#if sorting === 'billDateA'}
									<div class="absolute top-[-7px]">
										<Fa icon={faSortUp} class="text-[14px] absolute" style="color: #6b7280;" />
										<Fa icon={faSortDown} class="text-[14px] absolute" style="color: #d1d5db;" />
									</div>
								{:else if sorting === 'billDateD'}
									<div class="absolute top-[-7px]">
										<Fa icon={faSortUp} class="text-[14px] absolute" style="color: #d1d5db;" />
										<Fa icon={faSortDown} class="text-[14px] absolute" style="color: #6b7280;" />
									</div>
								{:else}
									<Fa icon={faSort} class="text-[14px]" style="color: #6b7280;" />
								{/if}
							</button>
						</div>
					</th>
					<th class="min-w-24">
						<div class="flex relative items-center">
							<p>Bank Date</p>
							<button
								class="absolute left-[70px]"
								on:click={() => {
										if (sorting === 'paymentDateA') {
											sorting = 'paymentDateD';
											sortAccountingsBy('paymentDate', false);
										} else if (sorting === 'paymentDateD') {
											sorting = 'id';
											sortAccountingsBy('id');
										} else {
											sorting = 'paymentDateA';
											sortAccountingsBy('paymentDate');
										}
									}}
							>
								{#if sorting === 'paymentDateA'}
									<div class="absolute top-[-7px]">
										<Fa icon={faSortUp} class="text-[14px] absolute" style="color: #6b7280;" />
										<Fa icon={faSortDown} class="text-[14px] absolute" style="color: #d1d5db;" />
									</div>
								{:else if sorting === 'paymentDateD'}
									<div class="absolute top-[-7px]">
										<Fa icon={faSortUp} class="text-[14px] absolute" style="color: #d1d5db;" />
										<Fa icon={faSortDown} class="text-[14px] absolute" style="color: #6b7280;" />
									</div>
								{:else}
									<Fa icon={faSort} class="text-[14px]" style="color: #6b7280;" />
								{/if}
							</button>
						</div>
					</th>
					<th class="min-w-24">
						<div class="flex relative items-center">
							<p>Amount</p>
							<button
								class="absolute left-[65px]"
								on:click={() => {
										if (sorting === 'amountA') {
											sorting = 'amountD';
											sortAccountingsBy('amount', false);
										} else if (sorting === 'amountD') {
											sorting = 'id';
											sortAccountingsBy('id');
										} else {
											sorting = 'amountA';
											sortAccountingsBy('amount');
										}
									}}
							>
								{#if sorting === 'amountA'}
									<div class="absolute top-[-7px]">
										<Fa icon={faSortUp} class="text-[14px] absolute" style="color: #6b7280;" />
										<Fa icon={faSortDown} class="text-[14px] absolute" style="color: #d1d5db;" />
									</div>
								{:else if sorting === 'amountD'}
									<div class="absolute top-[-7px]">
										<Fa icon={faSortUp} class="text-[14px] absolute" style="color: #d1d5db;" />
										<Fa icon={faSortDown} class="text-[14px] absolute" style="color: #6b7280;" />
									</div>
								{:else}
									<Fa icon={faSort} class="text-[14px]" style="color: #6b7280;" />
								{/if}
							</button>
						</div>
					</th>
					<th class="min-w-28">
						<div class="flex relative items-center">
							<p>Category</p>
							<button
								class="absolute left-[70px]"
								on:click={() => {
										if (sorting === 'categoryA') {
											sorting = 'categoryD';
											sortAccountingsBy('categoryId', false);
										} else if (sorting === 'categoryD') {
											sorting = 'id';
											sortAccountingsBy('id');
										} else {
											sorting = 'categoryA';
											sortAccountingsBy('categoryId');
										}
									}}
							>
								{#if sorting === 'categoryA'}
									<div class="absolute top-[-7px]">
										<Fa icon={faSortUp} class="text-[14px] absolute" style="color: #6b7280;" />
										<Fa icon={faSortDown} class="text-[14px] absolute" style="color: #d1d5db;" />
									</div>
								{:else if sorting === 'categoryD'}
									<div class="absolute top-[-7px]">
										<Fa icon={faSortUp} class="text-[14px] absolute" style="color: #d1d5db;" />
										<Fa icon={faSortDown} class="text-[14px] absolute" style="color: #6b7280;" />
									</div>
								{:else}
									<Fa icon={faSort} class="text-[14px]" style="color: #6b7280;" />
								{/if}
							</button>
						</div>
					</th>
					<th>Attachments</th>
					<th>Action</th>
				</tr>
				</thead>
				<tbody>
				{#if accountingsDisplayed && accountingsDisplayed.length > 0}
					{#each accountingsDisplayed as accounting}
						<tr
							class="font-semibold text-gray-400 border-b border-gray-200 hover:bg-gray-50 {accounting.isIndividualPayment
									? accounting.isMusicianFee
										? 'bg-blue-100'
										: 'bg-orange-100'
									: ''}"
						>
							{#if showProject}
								<td class="p-3 w-4">{accounting.projectId}</td>
							{/if}
							<td class="p-3">
								{#if projectConcerts.get(accounting.projectId) < today && !accounting.paymentDate && accounting.isIndividualPayment}
									<div>
										<div class="flex items-center gap-2">
											<Fa
												icon={faTriangleExclamation}
												class="text-[14px]"
												style="color: #ef4444;"
											/>
											<span class="text-red-500">{accounting.name}</span>
										</div>
										<div class="bg-red-100 border border-red-500 rounded-lg p-1 w-[85%] m-1">
											<p class="text-[10px] leading-none text-red-500">
												This payment hasn't been made yet, but the date of the project's last
												concert is past.
											</p>
										</div>
									</div>
								{:else}
									<span>{accounting.name}</span>
								{/if}
							</td>
							<td class="p-3">{accounting.billDate ? accounting.billDate : 'unknown'}</td>
							<td class="p-3">{accounting.paymentDate ? accounting.paymentDate : 'unpaid'}</td>
							<td class="p-3">
								{#if accounting.amount < 0}
									<p class=" text-red-500">{accounting.amount} €</p>
								{:else}
									<p class="text-green-500">+{accounting.amount} €</p>
								{/if}
							</td>
							<td class="p-3">
								{#if categories.find((c) => c.id === accounting.categoryId)}
									<p
										style="color: {categories.find((c) => c.id === accounting.categoryId)?.color}"
										class="font-semibold"
									>
										{categories.find((c) => c.id === accounting.categoryId)?.name}
									</p>
								{:else}
									<p class="text-gray-400">x</p>
								{/if}
							</td>
							<td class="p-3">
								{#if accounting.attachment}
									<button
										class="flex justify-center w-full"
										on:click={() => {
												popUpAttachement = true;
												const match = accounting.name.match(/^Payment\s(.+?)\s*:\s*(.+)$/);
												if (match) {
													AccountingpaymentToIndiv = true;
													AccountingNamecontactSelected = match[1].trim();
													AccountingName = match[2].trim();
												} else {
													AccountingName = accounting.name;
												}
												if (accounting.billDate) {
													AccountingBillDate = accounting.billDate;
												}
												if (accounting.paymentDate) {
													AccountingPaymentDate = accounting.paymentDate;
												}
												AccountingAmount = accounting.amount;
												AccountingCategory = accounting.categoryId;
												AccountingIsMusicianFee = accounting.isMusicianFee;
												AccountingId = accounting.id;
												updateMode = true;
												updateAttachmentMode = true;
												if (accounting.attachment) {
													AccountingAttachments = accounting.attachment.split('/').map(Number);
													for (const att of AccountingAttachments) {
														let file;
														if (accountingFolder?.files && accountingFolder.files.find((f) => f.id === att)) {
															file = accountingFolder.files.find((f) => f.id === att);
															if (file) {
																selectedAttachements.push(file);
															}
														}
													}
												}
											}}
									>
										<Fa icon={faEye} class="text-[16px]" style="color: #6B9AD9;" />
									</button>
								{/if}
							</td>
							<td class="p-3">
								<button
									on:click={() => {
											fetchContacts();
											const match = accounting.name.match(/^Payment\s(.+?)\s*:\s*(.+)$/);
											if (match) {
												AccountingpaymentToIndiv = true;
												AccountingNamecontactSelected = match[1].trim();
												AccountingName = match[2].trim();
											} else {
												AccountingName = accounting.name;
											}
											if (accounting.billDate) {
												AccountingBillDate = accounting.billDate;
											}
											if (accounting.paymentDate) {
												AccountingPaymentDate = accounting.paymentDate;
											}
											if (accounting.attachment) {
												AccountingAttachments = accounting.attachment.split('/').map(Number);
											}
											AccountingAmount = accounting.amount;
											AccountingCategory = accounting.categoryId;
											AccountingcontactId = accounting.contactId;
											AccountingIsMusicianFee = accounting.isMusicianFee;
											AccountingId = accounting.id;
											popUpAdd = true;
											updateMode = true;
										}}
								>
									<Fa icon={faPenToSquare} class="text-[16px]" style="color: #6B9AD9;" />
								</button>
							</td>
						</tr>
					{/each}
				{:else}
					<tr>
						<td colspan="8" class="text-center p-4 text-gray-500">No accounting entries found</td>
					</tr>
				{/if}
				</tbody>
			</table>
		</div>
	</div>
{/if}

{#if showPreview && previewFile}
	<FilePreview
		fileId={previewFile.id}
		fileName={previewFile.name}
		fileType={previewFile.mimeType || ''}
		onClose={() => {
			showPreview = false;
			previewFile = null;
		}}
	/>
{/if}

{#if accountingFolder && folder.children && showAttachments}
	<div class="bg-white border-2 rounded-xl border-gray-400 p-4">
		<div class="flex items-center gap-4">
			<h1 class="font-bold text-lg mb-4">ATTACHMENTS</h1>
			<button
				class="mb-4"
				on:click={() => {
					displayAttachments = !displayAttachments;
					if (chevronAttachments === faChevronDown) {
						chevronAttachments = faChevronUp;
					} else {
						chevronAttachments = faChevronDown;
					}
				}}
			>
				<Fa icon={chevronAttachments} style="color : black" />
			</button>
		</div>
		{#if displayAttachments}
			<div in:slide={{ duration: 300 }} out:slide={{ duration: 200 }}>
				{#if folder.children.length}
					<div class="gap-4 flex flex-col">
						{#each folder.children as file}
							<div class="flex w-full border-2 rounded-full p-2 px-4">
								<div class="flex w-[60%] items-center">
									<div
										class="flex-shrink-0 w-10 h-10 border-gray-300 group-hover:border-[#6B9AD9] transition-colors flex items-center justify-center"
									>
										<svelte:component
											this={getFileIcon(file)}
											size={isMobile ? 20 : 24}
											class={getFileColor(file)}
										/>
									</div>
									<div class={isMobile ? 'text-xs gap-2 h-14' : 'flex w-full'}>
										<h3
											class="font-bold text-gray-500 truncate text-sm py-2 {isMobile
												? ' w-[20vw]'
												: ''}"
											title={file.name}
										>
											{file.name}
										</h3>
										<span
											class="bg-blue-100 text-blue-800 h-8 ml-auto {isMobile
												? 'text-xs'
												: 'text-sm'} mr-0 px-2 py-1 rounded font-semibold border border-blue-300"
										>
											{formatFileSize(file.size || 0)}
										</span>
									</div>
								</div>
								<div class="grid grid-cols-3 ml-auto mr-0">
									<button
										class="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700 font-semibold"
										on:click={() => {
											previewFileFunction(file);
										}}
									>
										<Fa icon={faEye} class="text-[16px]" style="color: #6b7280;" />
									</button>

									<button
										class="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700 font-semibold"
										on:click={() => {
											downloadFileFunction(file);
										}}
									>
										<Fa icon={faDownload} class="text-[16px]" style="color: #6b7280;" />
									</button>
									<button
										class="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-400 flex items-center gap-2 font-semibold"
										on:click={() => {
											deleteItem(file);
										}}
									>
										<Fa icon={faTrashCan} class="text-[16px]" style="color: #f87171;" />
									</button>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-gray-500 text-center mb-8 font-semibold">No Attachments</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}