<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { File, Folder, Download, Trash2, Edit3, MoreVertical, Music, Image, Video, FileText } from 'lucide-svelte';
	import type { FileSystemItem } from '$lib/types/FileSystem';

	const dispatch = createEventDispatcher();

	export let items: FileSystemItem[] = [];
	export let showActions = true;

	let selectedItem: FileSystemItem | null = null;
	let showContextMenu = false;
	let contextMenuPosition = { x: 0, y: 0 };

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
				return Image;
			case 'mp3':
			case 'wav':
			case 'flac':
			case 'aac':
				return Music;
			case 'mp4':
			case 'avi':
			case 'mov':
			case 'mkv':
				return Video;
			default:
				return File;
		}
	}

	function getFileColor(item: FileSystemItem) {
		if (item.type === 'folder') return 'text-blue-600';

		const extension = item.name.split('.').pop()?.toLowerCase();
		switch (extension) {
			case 'pdf':
			case 'doc':
			case 'docx':
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
			case 'aac':
				return 'text-purple-600';
			case 'mp4':
			case 'avi':
			case 'mov':
			case 'mkv':
				return 'text-pink-600';
			default:
				return 'text-gray-600';
		}
	}

	function handleItemClick(item: FileSystemItem) {
		dispatch('itemClick', item);
	}

	function handleRightClick(event: MouseEvent, item: FileSystemItem) {
		event.preventDefault();
		selectedItem = item;
		contextMenuPosition = { x: event.clientX, y: event.clientY };
		showContextMenu = true;
	}

	async function downloadFile(item: FileSystemItem) {
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
				}
			} catch (error) {
				console.error('Error downloading file:', error);
			}
		}
	}

	async function deleteItem(item: FileSystemItem) {
		if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
			try {
				const endpoint = item.type === 'file' ? 'files' : 'folders';
				await fetch(`/api/filesystem/${endpoint}/${item.id}`, {
					method: 'DELETE'
				});
				dispatch('refresh');
			} catch (error) {
				console.error('Error deleting item:', error);
			}
		}
	}

	async function renameItem(item: FileSystemItem) {
		const newName = prompt('New name:', item.name);
		if (newName && newName !== item.name) {
			try {
				const endpoint = item.type === 'file' ? 'files' : 'folders';
				await fetch(`/api/filesystem/${endpoint}/${item.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: newName })
				});
				dispatch('refresh');
			} catch (error) {
				console.error('Error renaming item:', error);
			}
		}
	}

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="space-y-2">
	{#if items.length === 0}
		<div class="text-center py-12">
			<Folder class="mx-auto mb-4 text-gray-400" size={48} />
			<p class="text-gray-500">This folder is empty</p>
			<p class="text-sm text-gray-400 mt-2">Upload files or create folders to get started</p>
		</div>
	{:else}
		<div class="grid gap-2">
			{#each items as item}
				<div
					class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200 hover:border-[#6B9AD9] transition-all duration-200 cursor-pointer group"
					on:click={() => handleItemClick(item)}
					on:contextmenu={(e) => handleRightClick(e, item)}
				>
					<div class="flex items-center gap-3 flex-1 min-w-0">
						<div class="flex-shrink-0 p-2 bg-white rounded-lg border border-gray-200 group-hover:border-[#6B9AD9] transition-colors">
							<svelte:component this={getFileIcon(item)} size={20} class={getFileColor(item)} />
						</div>
						<div class="flex-1 min-w-0">
							<h4 class="font-medium text-gray-800 truncate">{item.name}</h4>
							<div class="flex items-center gap-4 mt-1">
								<p class="text-sm text-gray-500">
									{#if item.type === 'file'}
										{formatFileSize(item.size || 0)}
									{:else}
										Folder
									{/if}
								</p>
								<p class="text-sm text-gray-500">
									{formatDate(item.updatedAt)}
								</p>
								{#if item.type === 'folder' && item.children}
									<p class="text-sm text-gray-500">
										{item.children.length} item{item.children.length !== 1 ? 's' : ''}
									</p>
								{/if}
							</div>
						</div>
					</div>

					{#if showActions}
						<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
							{#if item.type === 'file'}
								<button
									class="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
									on:click|stopPropagation={() => downloadFile(item)}
									title="Download"
								>
									<Download size={16} />
								</button>
							{/if}

							<button
								class="p-2 text-gray-600 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
								on:click|stopPropagation={() => renameItem(item)}
								title="Rename"
							>
								<Edit3 size={16} />
							</button>

							<button
								class="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
								on:click|stopPropagation={() => deleteItem(item)}
								title="Delete"
							>
								<Trash2 size={16} />
							</button>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Context Menu -->
{#if showContextMenu && selectedItem}
	<div
		class="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-[150px]"
		style="left: {contextMenuPosition.x}px; top: {contextMenuPosition.y}px;"
		on:click|stopPropagation
	>
		{#if selectedItem.type === 'file'}
			<button
				class="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700"
				on:click={() => {
          downloadFile(selectedItem);
          showContextMenu = false;
        }}
			>
				<Download size={16} />
				Download
			</button>
		{/if}

		<button
			class="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700"
			on:click={() => {
        renameItem(selectedItem);
        showContextMenu = false;
      }}
		>
			<Edit3 size={16} />
			Rename
		</button>

		<hr class="my-1 border-gray-200" />

		<button
			class="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600 flex items-center gap-2"
			on:click={() => {
        deleteItem(selectedItem);
        showContextMenu = false;
      }}
		>
			<Trash2 size={16} />
			Delete
		</button>
	</div>
{/if}

<svelte:window on:click={() => showContextMenu = false} />