<script lang="ts">
	import DateShow from '$lib/components/DateShow.svelte';

	export let project: any;
	export let participantsNotSeenCallsheet: Array<any>;
	export let participantsNotValidated: Array<any>;
	export let participantsWithoutEmail: Array<any>;
</script>

<div>
	<div>
		<h2 class="m-2 text-lg">Basic project infos</h2>

		<a
			href="/projects/management/{project.id}/modify"
			class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
		>
			Modify project infos
		</a>

		<a
			href="/projects/management/{project.id}/participants"
			class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
		>
			Participants
		</a>
		<a
			href="/projects/management/{project.id}/attendance"
			class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
		>
			See attendance
		</a>
		<a
			href="/projects/management/{project.id}/mails"
			class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
		>
			Mail manager
		</a>
	</div>
	<!-- accès à la fiche d'inscription -->
	<div class="border w-fit">
		<h2 class="m-2 text-lg">Registration</h2>
		<a
			href="/projects/management/{project.id}/registration"
			class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
		>
			Access to the registration form
		</a>
		<!-- envoyer un mail à une liste de contacts -->

		<!-- inscriptions à valider -->
		<!-- liste des participant avec comme champ validated à false -->
		<div class="border m-1">
			<h3>Validate registration</h3>
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
		</div>
	</div>
	<!-- dernières callsheet -->
	<div class="border w-fit">
		<h2 class="m-2 text-lg">Last callsheets</h2>
		<a
			href="/projects/management/{project.id}/callsheets/add"
			class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
			>Create a new callsheet</a
		>
		<ul>
			{#if project.callsheets.length === 0}
				<li class="text-sm">
					<a href="/projects/management/{project.id}/callsheets/add"> Create a callsheet </a>
				</li>
			{:else}
				{#each project.callsheets.slice(0, 3) as callsheet}
					<li class="text-sm">
						<a href="/projects/management/{project.id}/callsheets/{callsheet.id}/modify">
							{callsheet.version}
						</a>
					</li>
				{/each}
				<li>...</li>
			{/if}
		</ul>

		{#if participantsNotSeenCallsheet.length === 0}
			<h2 class="m-2 text-lg">All participants have seen the last callsheet</h2>
		{:else}
			<h2 class="m-2 text-lg">
				Last Callsheet not seen by {participantsNotSeenCallsheet.length} persons
			</h2>
			<ul>
				{#each participantsNotSeenCallsheet.slice(0, 3) as participant}
					<li class="text-sm">
						<a href="/projects/management/{project.id}/participants/{participant.id}">
							{participant.contact.firstName}
							{participant.contact.lastName}
						</a>
					</li>
				{/each}
				<li>...</li>
			</ul>
		{/if}
	</div>

	<div class="border w-fit">
		<h2 class="m-2 text-lg">Participants without email</h2>
		<ul>
			{#if participantsWithoutEmail.length === 0}
				<li class="text-sm">No participant without email</li>
			{:else}
				{#each participantsWithoutEmail as participant}
					<li class="text-sm">
						<a href="/projects/management/{project.id}/participants/{participant.id}">
							{participant.contact.firstName}
							{participant.contact.lastName}
							(Participant profile)
						</a>
						<a href="/contacts/{participant.contact.id}">(Profile)</a>
					</li>
				{/each}
			{/if}
		</ul>
	</div>

	<div class="border w-fit">
		<h2 class="m-2 text-lg">Rehearsals</h2>
		<ul>
			{#if project.rehearsals.length === 0}
				<li class="text-sm">No rehearsal planned</li>
			{:else}
				{#each project.rehearsals as rehearsal}
					<li class="text-sm">
						<a href="/projects/management/{project.id}/rehearsals/{rehearsal.id}">
							{rehearsal.place}
							<DateShow date={rehearsal.date} />
						</a>
					</li>
				{/each}
			{/if}
		</ul>
	</div>

	<div class="border w-fit">
		<h2 class="m-2 text-lg">Concerts</h2>
		<ul>
			{#if project.concerts.length === 0}
				<li class="text-sm">No concert planned</li>
			{:else}
				{#each project.concerts as concert}
					<li class="text-sm">
						<a href="/projects/management/{project.id}/concerts/{concert.id}">
							{concert.place}
							<DateShow date={concert.date} />
						</a>
					</li>
				{/each}
			{/if}
		</ul>
	</div>

	<!-- envoyer un mail à une liste de contacts -->
	<!-- callsheet non ouverte -->
	<!-- création/modification de callsheet -->
	<!-- prochaines répétitions -->
	<!-- prochains concerts -->
	<!-- modifier les informations du projets -->
	<!-- liste des participants -->
	<!-- participant ne pouvant pas être contacté par mail -->
</div>
