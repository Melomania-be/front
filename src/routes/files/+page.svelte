<script lang="ts">
	import { onMount } from 'svelte';

	type File = {
		id: number;
		name: string;
		type: string;
		path: string;
		content: string;
		createdAt: string;
		updatedAt: string;
	};

	type Folder = {
		id: number;
		name: string;
		files: File[];
		createdAt: string;
		updatedAt: string;
	};

	let allFiles: File[] = [];
	let allFolders: Folder[] = [];
	let listOfFiles: File[] = [];
	let listOfFolders: Folder[] = [];
	let files: FileList | null = null;
	let loading = true;
	let folderName = '';

	let lockedFiles = false;
	let lockedFolders = false;
	let insideFolder: Folder | null = null;

	let fileDragged: File | null = null;

	let searchFile = '';
	let searchFolder = '';

	onMount(async () => {
		let response = await fetch('/api/files', {
			method: 'GET'
		});

		let data = await response.json();

		allFiles = data;
		listOfFiles = data;

		response = await fetch('/api/folders', {
			method: 'GET'
		});

		data = await response.json();

		allFolders = data;
		listOfFolders = data;

		loading = false;
	});

	$: {
		searchFile = searchFile.toLowerCase();
		if (searchFile !== '') {
			lockedFiles = true;
		} else {
			lockedFiles = false;
		}
		listOfFiles = allFiles.filter((file) => {
			return file.name.toLowerCase().includes(searchFile);
		});
	}

	$: {
		searchFolder = searchFolder.toLowerCase();
		if (searchFolder !== '') {
			lockedFolders = true;
		} else {
			lockedFolders = false;
		}
		listOfFolders = allFolders.filter((folder) => {
			return folder.name.toLowerCase().includes(searchFolder);
		});
	}

	async function submitFiles() {
		var fd = new FormData();

		if (!files) {
			alert('Please select a file');
			return;
		}

		if (files.length === 1) {
			fd.append('file', files[0]);
		} else {
			for (let i = 0; i < files.length; i++) {
				fd.append('files', files[i]);
			}
		}

		let response = await fetch('/api/files', {
			method: 'POST',
			body: fd
		});

		if (response.status >= 400 && response.status < 500) {
			const jsonResponse = await response.json();
			const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
			alert(error);
		}

		if (response.status >= 500) {
			alert('Server error');
		}

		if (response.status === 200) {
			window.location.reload();
		}
	}

	async function submitFolder() {
		let response = await fetch('/api/folders', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ name: folderName })
		});

		if (response.status >= 400 && response.status < 500) {
			const jsonResponse = await response.json();
			const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
			alert(error);
		}

		if (response.status >= 500) {
			alert('Server error');
		}

		if (response.status === 200) {
			window.location.reload();
		}
	}

	async function dropHandle(folder: Folder) {
		if (!fileDragged) return;

		folder.files.push(fileDragged);

		const request = await fetch(`/api/folders/`, {
			method: 'POST',
			body: JSON.stringify({ ...folder })
		});

		if (request.status >= 400 && request.status < 500) {
			const jsonResponse = await request.json();
			const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
			alert(error);
		}

		if (request.status >= 500) {
			alert('Server error');
		}

		if (request.status === 200) {
			window.location.reload();
		}
	}

	function fastFilterIn(folder: Folder) {
		listOfFiles = folder.files;
		insideFolder = folder;
	}

	function fastFilterOut() {
		if (lockedFiles) return;
		listOfFiles = allFiles;
		insideFolder = null;
	}

	function clearFilesFilter() {
		insideFolder = null;
		searchFile = '';
		lockedFiles = false;
		listOfFiles = allFiles;
	}

	function clearFoldersFilter() {
		searchFolder = '';
		lockedFolders = false;
		listOfFolders = allFolders;
	}

	async function downloadFile(file: File) {
		const response = await fetch(`/api/files/${file.id}`, {
			method: 'GET'
		});

		if (response.status >= 400 && response.status < 500) {
			const jsonResponse = await response.json();
			const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
			alert(error);
		}

		if (response.status >= 500) {
			alert('Server error');
		}

		if (response.status === 200) {
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
		}
	}

	async function renameFile(file: File) {
		const newName = prompt('Enter the new name of the file');

		if (!newName) return;

		const request = await fetch(`/api/files/${file.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ name: newName })
		});

		if (request.status >= 400 && request.status < 500) {
			const jsonResponse = await request.json();
			const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
			alert(error);
		}

		if (request.status >= 500) {
			alert('Server error');
		}

		if (request.status === 200) {
			window.location.reload();
		}
	}

	async function deleteFile(file: File) {
		const validated = confirm('Are you sure you want to delete this file ?');

		if (!validated) return;

		const request = await fetch(`/api/files/${file.id}`, {
			method: 'DELETE'
		});

		if (request.status >= 400 && request.status < 500) {
			const jsonResponse = await request.json();
			const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
			alert(error);
		}

		if (request.status >= 500) {
			alert('Server error');
		}

		if (request.status === 200) {
			window.location.reload();
		}
	}

	async function deleteFolder(folder: Folder) {
		const validated = confirm('Are you sure you want to delete this folder ?');

		if (!validated) return;

		const request = await fetch(`/api/folders/${folder.id}`, {
			method: 'DELETE'
		});

		if (request.status >= 400 && request.status < 500) {
			const jsonResponse = await request.json();
			const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
			alert(error);
		}

		if (request.status >= 500) {
			alert('Server error');
		}

		if (request.status === 200) {
			window.location.reload();
		}
	}

	async function unlinkFile(file: File) {
		const validated = confirm('Are you sure you want to unlink this file ?');

		if (!validated) return;

		if (!insideFolder) return;

		const request = await fetch(`/api/folders/`, {
			method: 'POST',
			body: JSON.stringify({
				...insideFolder,
				files: insideFolder.files.filter((f) => f.id !== file.id)
			})
		});

		if (request.status >= 400 && request.status < 500) {
			const jsonResponse = await request.json();
			const error = jsonResponse.errors ? jsonResponse.errors[0].message : jsonResponse.message;
			alert(error);
		}

		if (request.status >= 500) {
			alert('Server error');
		}

		if (request.status === 200) {
			window.location.reload();
		}
	}
</script>

<div class="w-full h-full">
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-4">
		<!-- File Upload Section -->
		<div class="col-span-1 sm:col-span-2 lg:col-span-3 p-1">
			<div class="border p-4 border-red-950 w-full h-min mb-1">
				<label for="files">Upload files:</label>
				<input id="files" multiple type="file" bind:files />

				<button type="submit" on:click={submitFiles}>Submit</button>
			</div>
			<div class="flex mb-4">
				<input
					type="text"
					placeholder={insideFolder ? `Searching files in ${insideFolder.name}` : 'Search files'}
					class="flex-1 w-full p-2 border border-gray-200 rounded-lg shadow"
					bind:value={searchFile}
					disabled={insideFolder !== null}
				/>

				{#if lockedFiles}
					<button class="ml-2" on:click={clearFilesFilter}>
						<span class="icon-[charm--cross]"></span>
					</button>
				{/if}
			</div>
			<div class="flex-1 w-full p-2 rounded-lg shadow mb-1">
				<span class="align-middle mr-1">
					<span class="icon-[mdi--information-slab-box]" style="color: black;"></span>
				</span>
				You can drag a file to a folder to link it!
			</div>
			<div class="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
				{#if loading}
					<div>loading...</div>
				{:else if allFiles instanceof Array && allFiles.length === 0}
					<div>No files</div>
				{:else}
					{#each listOfFiles as file}
						<div
							class="group text-sm break-words block max-w-xs p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 hover:max-h-full"
							draggable="true"
							on:dragstart={() => (fileDragged = file)}
							on:dragend={() => (fileDragged = null)}
							role="contentinfo"
						>
							<div class="flex justify-between">
								<span class="icon-[mdi--file]"></span>
								<button
									class="p-1 w-6 h-6 rounded-full ml-2 border border-gray-300"
									on:click={() => downloadFile(file)}
									title="Download file"
								>
									<span class="icon-[line-md--download-outline]"></span>
								</button>
								<button
									class="p-1 w-6 h-6 rounded-full ml-2 border border-gray-300"
									on:click={() => renameFile(file)}
									title="Rename file"
								>
									<span class="icon-[line-md--edit]"></span>
								</button>
								<button
									class="w-6 h-6 rounded-full ml-2"
									on:click={() => deleteFile(file)}
									title="Delete file"
								>
									<span class="icon-[material-symbols--delete-outline]" style="color: red;"></span>
								</button>
							</div>
							<h6 class="mb-2 font-bold tracking-tight text-gray-900 dark:text-white">{file.name}</h6>
							<p class="text-gray-700 dark:text-gray-300">Type: {file.type}</p>
							<p class="text-gray-700 dark:text-gray-300">Path: {file.path}</p>
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<!-- Folder Creation Section -->
		<div class="col-span-1 sm:col-span-2 lg:col-span-2 p-1">
			<div class="border p-4 border-red-950 w-full h-min mb-1">
				<label for="folders">Create folder:</label>
				<input id="folders" type="text" bind:value={folderName} />

				<button type="submit" on:click={submitFolder}>Submit</button>
			</div>
			<div class="flex mb-4">
				<input
					type="text"
					placeholder="Search folders"
					class="flex-1 w-full p-2 border border-gray-200 rounded-lg shadow"
					bind:value={searchFolder}
				/>
				{#if lockedFolders}
					<button class="ml-2" on:click={clearFoldersFilter}>
						<span class="icon-[charm--cross]"></span>
					</button>
				{/if}
			</div>
			<div class="flex-1 w-full p-2 rounded-lg shadow mb-1">
				<span class="align-middle mr-1">
					<span class="icon-[mdi--information-slab-box]" style="color: black;"></span>
				</span>
				Hover over a folder to see its content
			</div>
			{#if loading}
				<div>loading...</div>
			{:else if allFolders instanceof Array && allFolders.length === 0}
				<div>No folders</div>
			{:else}
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
					{#each listOfFolders as folder}
						<div
							class="grid grid-cols-1 group text-sm max-w-xs p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 hover:max-h-full"
							role="region"
							on:drop={() => dropHandle(folder)}
							on:dragover={(e) => e.preventDefault()}
							on:mouseover={() => fastFilterIn(folder)}
							on:mouseout={() => fastFilterOut()}
							on:focus={() => fastFilterIn(folder)}
							on:blur={() => fastFilterOut()}
						>
							<div class="flex justify-between">
								<span class="icon-[mdi--folder]"></span>
								<button
									class="p-1 w-6 h-6 rounded-full ml-2 mr-1 border border-gray-300"
									on:click={() => {
										lockedFiles = true;
										insideFolder = folder;
									}}
									title="Keep folder opened"
								>
									<span class="flex icon-[mdi--pin-outline]"></span>
								</button>
								<button
									class="w-6 h-6 rounded-full ml-2 mr-2"
									on:click={() => deleteFolder(folder)}
									title="Delete folder"
								>
									<span class="icon-[material-symbols--delete-outline]" style="color: red;"></span>
								</button>
							</div>
							<h6 class="mb-2 font-bold tracking-tight text-gray-900 dark:text-white">{folder.name}</h6>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
