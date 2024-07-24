<script lang="ts">
	export let open = false;
	export let folder;
	import { slide } from 'svelte/transition';
	import type { File } from '$lib/types/File';
	const handleClick = () => (open = !open);

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
</script>

<div id="accordion-flush" data-accordion="collapse" data-active-classes="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" data-inactive-classes="text-gray-500 dark:text-gray-400">
	<div class="header">
		<button
			type="button"
			class="flex items-center justify-between w-full font-medium rtl:text-right"
			data-accordion-target="#accordion-color-body-1"
			aria-expanded="true"
			aria-controls="accordion-color-body-1"
			on:click={handleClick}
		>
			{folder.name}
			<svg
				data-accordion-icon
				class="w-3 h-3 rotate-180 shrink-0"
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 10 6"
			>
				<path
					stroke="currentColor"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 5 5 1 1 5"
				/>
			</svg>
		</button>
	</div>

	{#if open}
		<div class="details w-1/2 bg-blend-color" transition:slide>
			{#each folder.files as file}
				{#if file !== undefined}
					<div>
							{file.name}
							<button
							on:click={() => downloadFile(file)}
							class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
							>
								Download
							</button>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>