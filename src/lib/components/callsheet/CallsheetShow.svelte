<script lang="ts">
	import type { Callsheet } from '$lib/types/Callsheet';
	import type { File } from '$lib/types/File';
	import Accordion from '$lib/components/Accordion.svelte';
	import DateShow from '../DateShow.svelte';

	export let callsheet: Callsheet;
</script>

<div
	class="m-1 relative max-w-xxl bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
>
	{#if callsheet}
		<div class="p-5">
			<div
				class="mb-5 font-bold tracking-tight text-gray-900 border-b-gray-200 shadow dark:text-white origin-center w-full flex justify-center"
			>
				<h1 class="text-3xl font-bold mb-2">
					CALLSHEET (V. {callsheet.version}) - {callsheet.project.name}
				</h1>
			</div>

			{#if callsheet.contents && callsheet.contents.length > 0}
				{#each callsheet.contents as content}
					<div class="mb-8 ml-20">
						<h2
							class="text-2xl font-bold tracking-tight text-blue-900 dark:text-white underline mb-5"
						>
							{content.title}
						</h2>
						<div class="w-full flex">
							<p class="text-gray-800 dark:text-gray-400">{content.text}</p>
						</div>
					</div>
				{/each}
			{/if}

			<div class="mb-2 ml-20">
				<h2 class="text-2xl font-bold tracking-tight text-blue-900 dark:text-white underline mb-5">
					Program and scores
				</h2>
				<div class="w-full flex">
					<table class="w-2/3 text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
						<thead
							class="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400"
						>
							<tr>
								<th scope="col" class="px-6 py-3"> Composer </th>
								<th scope="col" class="px-6 py-3"> Name </th>
								<th scope="col" class="px-6 py-3"> Files (Partitions) </th>
							</tr>
						</thead>
						<tbody>
							{#if callsheet.project?.pieces}
								{#each callsheet.project.pieces as piece}
									<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
										<td class="px-6 py-4">
											{piece.composer.shortName}
										</td>
										<th
											scope="row"
											class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
										>
											{piece.name}
										</th>
										<td class="px-6 py-4">
											{#if piece.folder !== null && piece.folder !== undefined && piece.folder.files.length > 0}
												<Accordion bind:folder={piece.folder}></Accordion>
											{:else}
												<span class="italic text-red-500">x</span>
											{/if}
										</td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>
			</div>
			<div class="pt-10 mb-2 ml-20">
				<h2 class="text-2xl font-bold tracking-tight text-blue-900 dark:text-white underline mb-5">
					Planning and addresses
				</h2>
				<div class="w-full flex">
					<table class="w-2/3 text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
						<thead
							class="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400"
						>
							<tr>
								<th scope="col" class="px-6 py-3">Date</th>
								<th scope="col" class="px-6 py-3">Place</th>
								<th scope="col" class="px-6 py-3">Comment</th>
							</tr>
						</thead>
						<tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
							{#if callsheet.project?.rehearsals && callsheet.project.rehearsals.length > 0}
								{#each callsheet.project.rehearsals as rehearsal}
									<tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
										<th
											scope="row"
											class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
											><DateShow date={rehearsal.date} withTime></DateShow></th
										>
										<td class="px-6 py-4">{rehearsal.place}</td>
										<td class="px-6 py-4">{rehearsal.comment}</td>
									</tr>
								{/each}
							{:else}
								<tr>
									<td class="px-6 py-4" colspan="3">No rehearsal found</td>
								</tr>
							{/if}
						</tbody>
					</table>
				</div>
			</div>
			<div class="pt-10 mb-2 ml-20">
				<h2 class="text-2xl font-bold tracking-tight text-blue-900 dark:text-white underline">
					Contact Information
				</h2>
				<div class="w-full flex mt-2 mb-5">
					<p class="text-base text-gray-800 dark:text-gray-400">
						Below are the project managers. Please don't hesitate to call or email one of us for
						questions or remarks.
					</p>
				</div>
				<div class="flex flex-col-5">
					{#if callsheet.project?.responsibles && callsheet.project.responsibles.length > 0}
						{#each callsheet.project.responsibles as responsible}
							<div
								class="flex-col-1 block max-w-sm p-6 bg-white border border-blue-900 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 ml-5"
							>
								<h5 class="mb-2 text-xl tracking-tight text-gray-900 dark:text-white">
									{responsible.firstName}
									{responsible.lastName}
								</h5>
								<p class="font-normal text-gray-700 dark:text-gray-400">
									{#if responsible.email}
										<span class="text-gray-900">Email :</span> {responsible.email} <br />
									{/if}
									{#if responsible.phone !== '' && responsible.phone !== null && responsible.phone !== undefined && responsible.phone !== '/'}
										<span class="text-gray-900">Phone :</span> {responsible.phone} <br />
									{/if}
									{#if responsible.messenger !== '' && responsible.messenger !== null && responsible.messenger !== undefined && responsible.messenger !== '/'}
										<span class="text-gray-900">Messenger :</span> {responsible.messenger} <br />
									{/if}
								</p>
							</div>
						{/each}
					{:else}
						<p>No responsible found</p>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<div class="p-5">
			<p>
				We encountered a problem retrieving the call sheet, please reload the page or try again
				later.
			</p>
		</div>
	{/if}
</div>
