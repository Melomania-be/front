<script lang="ts">
	export let data: {
		numberContact: number;
		numberListe: number;
		numberValidationContact: number;
		numberRecommendedContact: number;
	};
</script>

<div class="relative overflow-x-auto shadow-md sm:rounded-lg">
	<table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
		<thead class="text-xs text-gray-700 uppercase dark:text-gray-400">
			<tr>
				<th scope="col" class="px-6 py-3 bg-gray-50 dark:bg-gray-800"> link page all </th>
				<th scope="col" class="px-6 py-3"> Infos </th>
				<th scope="col" class="px-6 py-3"> link page create </th>
			</tr>
		</thead>
		<tbody>
			<tr class="border-b border-gray-200 dark:border-gray-700">
				<th
					scope="row"
					class="px-6 py-4 font-medium text-blue-600 dark:text-blue-500 hover:underline"
				>
					<a
						href="/contacts/search"
						class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
						>All contact</a
					>
				</th>
				<td class="px-6 py-4">
					{data.numberContact} contacts
				</td>
				<th scope="col" class="px-6 py-3">
					<a
						href="/contacts/create"
						class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
						>create new contact</a
					>
				</th>
			</tr>
			<tr class="border-b border-gray-200 dark:border-gray-700">
				<th
					scope="row"
					class="px-6 py-4 font-medium text-blue-600 dark:text-blue-500 hover:underline"
				>
					<a
						href="/contacts/lists"
						class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
						>all lists</a
					>
				</th>
				<td class="px-6 py-4">
					{data.numberListe} Lists
				</td>
				<th scope="col" class="px-6 py-3">
					<a
						href="/contacts/lists/create"
						class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
						>create new list</a
					>
				</th>
			</tr>
			<tr class="border-b border-gray-200 dark:border-gray-700">
				<th
					scope="row"
					class="px-6 py-4 font-medium text-blue-600 dark:text-blue-500 hover:underline"
				>
					<a
						href="/contacts/validation"
						class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
						>To validate</a
					>
				</th>
				<td class="px-6 py-4">
					<span
						class="inline-flex items-center justify-center w-3 h-3 p-3 ms-3 text-sm font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300"
						>{data.numberValidationContact}</span
					>
					to validate
				</td>
			</tr>
			<tr class="border-b border-gray-200 dark:border-gray-700">
				<th
					scope="row"
					class="px-6 py-4 font-medium text-blue-600 dark:text-blue-500 hover:underline"
				>
					<a
						href="/contacts/recommended"
						class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
						>Recommended</a
					>
				</th>
				<td class="px-6 py-4">
					<span
						class="inline-flex items-center justify-center w-3 h-3 p-3 ms-3 text-sm font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300"
						>{data.numberRecommendedContact}</span
					>
					recommended
				</td>
			</tr>
		</tbody>
	</table>
</div>
