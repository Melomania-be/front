<script lang="ts">
	export let data: {
	numberContact: number;
	numberListe: number;
	numberValidationContact: number;
	numberRecommendedContact: number;
	numberOrganization: number;
};
</script>

<div class="relative overflow-x-auto shadow-md sm:rounded-lg">
	<table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
		<thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
			<tr>
				<th scope="col" class="px-2 sm:px-4 py-3 whitespace-nowrap">Link</th>
				<th scope="col" class="px-2 sm:px-4 py-3 whitespace-nowrap">Infos</th>
				<th scope="col" class="px-2 sm:px-4 py-3 whitespace-nowrap">Action</th>
			</tr>
		</thead>
		<tbody>
			<tr class="border-b border-gray-200 dark:border-gray-700">
				<th scope="row" class="px-2 sm:px-4 py-3 font-medium text-blue-600 dark:text-blue-500 hover:underline">
					<a
						href="/contacts/search"
						class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-xs sm:text-sm px-2 sm:px-5 py-1.5 sm:py-2 whitespace-nowrap dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
					>
						<span class="hidden sm:inline">All contact</span>
						<span class="inline sm:hidden">All</span>
					</a>
				</th>
				<td class="px-2 sm:px-4 py-3 whitespace-nowrap">{data.numberContact} contacts</td>
				<th>
					<a
						href="/contacts/create"
						class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-xs sm:text-sm px-2 sm:px-5 py-1.5 sm:py-2 whitespace-nowrap dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
					>
						<span class="hidden sm:inline">Create new contact</span>
						<span class="inline sm:hidden">Create</span>
					</a>
				</th>
			</tr>
			<tr class="border-b border-gray-200 dark:border-gray-700">
				<th scope="row" class="px-2 sm:px-4 py-3 font-medium text-blue-600 dark:text-blue-500 hover:underline">
					<a
						href="/contractors"
						class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-xs sm:text-sm px-2 sm:px-5 py-1.5 sm:py-2 whitespace-nowrap dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
					>
						<span class="hidden sm:inline">Contractor contacts</span>
						<span class="inline sm:hidden">Contractors</span>
					</a>
				</th>
				<td class="px-2 sm:px-4 py-3 whitespace-nowrap">External contacts database</td>
				<th>
					<a
						href="/contractors/create"
						class="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-xs sm:text-sm px-2 sm:px-5 py-1.5 sm:py-2 whitespace-nowrap"
					>
						<span class="hidden sm:inline">Create contractor</span>
						<span class="inline sm:hidden">Create</span>
					</a>
				</th>
			</tr>
			<tr class="border-b border-gray-200 dark:border-gray-700">

	<th
		scope="row"
		class="px-2 sm:px-4 py-3 font-medium text-blue-600 dark:text-blue-500 hover:underline"
	>
		<a
			href="/testrog"
			class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-xs sm:text-sm px-2 sm:px-5 py-1.5 sm:py-2 whitespace-nowrap dark:bg-blue-600 dark:hover:bg-blue-700"
		>
			<span class="hidden sm:inline">
				Organizations
			</span>

			<span class="inline sm:hidden">
				Orgs
			</span>
		</a>
	</th>

	<td class="px-2 sm:px-4 py-3 whitespace-nowrap">
		{data.numberOrganization} organizations
	</td>

	<th>
		<a
			href="/testrog"
			class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-xs sm:text-sm px-2 sm:px-5 py-1.5 sm:py-2 whitespace-nowrap dark:bg-blue-600 dark:hover:bg-blue-700"
		>
			<span class="hidden sm:inline">
				View organizations
			</span>

			<span class="inline sm:hidden">
				Open
			</span>
		</a>
	</th>

</tr>
			<tr class="border-b border-gray-200 dark:border-gray-700">
				<th scope="row" class="px-2 sm:px-4 py-3 font-medium text-blue-600 dark:text-blue-500 hover:underline">
					<a
						href="/contacts/lists"
						class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-xs sm:text-sm px-2 sm:px-5 py-1.5 sm:py-2 whitespace-nowrap dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
					>
						<span class="hidden sm:inline">All lists</span>
						<span class="inline sm:hidden">All</span>
					</a>
				</th>
				<td class="px-2 sm:px-4 py-3 whitespace-nowrap">{data.numberListe} Lists</td>
				<th>
					<a
						href="/contacts/lists/create"
						class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-xs sm:text-sm px-2 sm:px-5 py-1.5 sm:py-2 whitespace-nowrap dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
					>
						<span class="hidden sm:inline">Create new list</span>
						<span class="inline sm:hidden">Create</span>
					</a>
				</th>
			</tr>
			<tr class="border-b border-gray-200 dark:border-gray-700">
				<th scope="row" class="px-2 sm:px-4 py-3 font-medium text-blue-600 dark:text-blue-500 hover:underline">
					<a
						href="/contacts/validation"
						class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-xs sm:text-sm px-2 sm:px-5 py-1.5 sm:py-2 whitespace-nowrap dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
					>
						To validate
					</a>
				</th>
				<td class="px-2 sm:px-4 py-3 whitespace-nowrap">
					<span class="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300">
						{data.numberValidationContact}
					</span>
					<span class="ml-2">to validate</span>
				</td>
				<td></td>
			</tr>
			<tr class="border-b border-gray-200 dark:border-gray-700">
				<th scope="row" class="px-2 sm:px-4 py-3 font-medium text-blue-600 dark:text-blue-500 hover:underline">
					<a
						href="/contacts/recommended"
						class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-xs sm:text-sm px-2 sm:px-5 py-1.5 sm:py-2 whitespace-nowrap dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
					>
						Recommended
					</a>
				</th>
				<td class="px-2 sm:px-4 py-3 whitespace-nowrap">
					<span class="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300">
						{data.numberRecommendedContact}
					</span>
					<span class="ml-2">recommended</span>
				</td>
				<td></td>
			</tr>
		</tbody>
	</table>
</div>
