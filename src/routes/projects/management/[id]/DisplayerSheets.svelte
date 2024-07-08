<script lang="ts">
	export let project: any;
	export let participantsNotSeenCallsheet: Array<any>;
	export let participantsNotValidated: Array<any>;

	let mode: 'callsheets' | 'registration' = 'callsheets';
</script>

<div
	class="w-full bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
>
	<div class="sm:hidden">
		<label for="tabs" class="sr-only">Select tab</label>
		<select
			bind:value={mode}
			id="tabs"
			class="bg-gray-50 border-0 border-b border-gray-200 text-gray-900 text-sm rounded-t-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
		>
			<option value="callsheets">callsheets</option>
			<option value="registration">registration</option>
		</select>
	</div>

	<ul
		class="hidden sm:flex text-sm font-medium text-center text-gray-500 dark:divide-gray-600 dark:text-gray-400"
	>
		<li class="w-full">
			<button
				on:click={() => {
					mode = 'callsheets';
				}}
				type="button"
				role="tab"
				class="inline-block h-full w-full p-4 focus:outline-none dark:bg-gray-700 dark:hover:bg-gray-600 {mode ===
				'callsheets'
					? 'bg-gray-200 hover:bg-gray-200'
					: 'bg-gray-50 hover:bg-gray-100'}">callsheets</button
			>
		</li>
		<li class="w-full">
			<button
				on:click={() => {
					mode = 'registration';
				}}
				type="button"
				role="tab"
				class="inline-block w-full p-4 focus:outline-none dark:bg-gray-700 dark:hover:bg-gray-600 {mode ===
				'registration'
					? 'bg-gray-200 hover:bg-gray-200'
					: 'bg-gray-50 hover:bg-gray-100'}">registration</button
			>
		</li>
	</ul>

	<div class="border-t border-gray-200 dark:border-gray-600 w-full">
		{#if mode === 'callsheets'}
			<div class="p-4 bg-white rounded-lg md:p-8 dark:bg-gray-800 w-full">
				<ul class="divide-y divide-gray-200 dark:divide-gray-700">
					{#each project.callsheets.reverse() as callsheets}
						<li class="py-3 sm:py-4">
							<div class="flex items-center justify-between">
								<div class="flex items-center space-x-1">
									<h3 class="text-sm font-medium text-gray-900 dark:text-white">
										{callsheets.version}
									</h3>
								</div>
							</div>
						</li>
					{/each}
				</ul>
				<div class="flex justify-end">
					{#if project.callsheets.length === 0}
						<p class="text-sm">
							<a href="/projects/management/{project.id}/callsheets/add">Create a callsheet</a>
						</p>
					{:else}
						<a
							href="/projects/management/{project.id}/callsheets/add"
							class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
							>Add a new callsheet</a
						>
					{/if}
				</div>
				<div class="flex mt-1">
					<div class="w-full bg-gray-200 rounded-full dark:bg-gray-700">
						<div
							class="h-1 bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
							style="width: {((project.participants.length - participantsNotSeenCallsheet.length) /
								project.participants.length) *
								100}%;"
						></div>
					</div>
				</div>
				<div>
					{project.participants.length - participantsNotSeenCallsheet.length} / {project
						.participants.length} participants have seen the last callsheet
				</div>
				<div class="mt-2">
					<h3>Participants who have not seen the last callsheet :</h3>
					<ul>
						{#each participantsNotSeenCallsheet.slice(0, 3) as participant}
							<li class="text-sm">
								<a href="/projects/management/{project.id}/participants/{participant.id}">
									{participant.contact.firstName}
									{participant.contact.lastName}
									(Participant profile)
								</a>
								<a href="/contacts/{participant.contact.id}">(Profile)</a>
							</li>
						{/each}
						<li>...</li>
					</ul>
				</div>
			</div>
		{/if}
		{#if mode === 'registration'}
			<div class="p-4 bg-white rounded-lg md:p-8 dark:bg-gray-800 w-full">
				<ul class="divide-y divide-gray-200 dark:divide-gray-700">
					<li class="flex items-center space-x-1">
						<h3 class="font-medium text-gray-900 dark:text-white">Registration</h3>
						<a href="/projects/management/{project.id}/registration" class="text-blue-700"
							>Modify registration form</a
						>
					</li>
					<li>
						<h3>Validate registrations :</h3>
						<ul>
							{#if participantsNotValidated.length === 0}
								<li class="text-sm">No registration to validate</li>
							{:else}
								{#each participantsNotValidated.slice(0, 3) as participant}
									<li class="text-sm">
										<a href="/projects/management/{project.id}/participants/{participant.id}">
											{participant.contact.firstName}
											{participant.contact.lastName}
										</a>
									</li>
								{/each}
								<li>...</li>
							{/if}
						</ul>
					</li>
				</ul>
			</div>
		{/if}
	</div>
</div>
