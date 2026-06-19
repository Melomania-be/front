<script lang="ts">
	import Button from '$lib/components/Button.svelte';

	export let data: {
		numberContact: number;
		numberListe: number;
		numberValidationContact: number;
		numberRecommendedContact: number;
	};
</script>

<div class="relative overflow-x-auto shadow-md sm:rounded-lg">
	<table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
		<thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
		<tr>
			<th scope="col" class="px-4 py-3">Link</th>
			<th scope="col" class="px-4 py-3">Infos</th>
			<th scope="col" class="px-4 py-3">Action</th>
		</tr>
		</thead>
		<tbody>
		<tr class="border-b border-gray-200 dark:border-gray-700">
			<th scope="row" class="px-4 py-4 font-medium text-blue-600 dark:text-blue-500 hover:underline">
				<Button href="/contacts/search" className="text-xs sm:text-sm px-3 sm:px-5 py-2">
					All contact
				</Button>
			</th>
			<td class="px-4 py-4">{data.numberContact} contacts</td>
			<th>
				<Button href="/contacts/create" className="text-xs sm:text-sm px-3 sm:px-5 py-2">
					Create new contact
				</Button>
			</th>
		</tr>
		<tr class="border-b border-gray-200 dark:border-gray-700">
			<th scope="row" class="px-4 py-4 font-medium text-blue-600 dark:text-blue-500 hover:underline">
				<Button href="/contacts/lists" className="text-xs sm:text-sm px-3 sm:px-5 py-2">
					All lists
				</Button>
			</th>
			<td class="px-4 py-4">{data.numberListe} Lists</td>
			<th>
				<Button href="/contacts/lists/create" className="text-xs sm:text-sm px-3 sm:px-5 py-2">
					Create new list
				</Button>
			</th>
		</tr>
		<tr class="border-b border-gray-200 dark:border-gray-700">
			<th scope="row" class="px-4 py-4 font-medium text-blue-600 dark:text-blue-500 hover:underline">
				<Button href="/contacts/validation" className="text-xs sm:text-sm px-3 sm:px-5 py-2">
					To validate
				</Button>
			</th>
			<td class="px-4 py-4">
      <span class="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300">
       {data.numberValidationContact}
      </span>
				<span class="ml-2">to validate</span>
			</td>
		</tr>
		<tr class="border-b border-gray-200 dark:border-gray-700">
			<th scope="row" class="px-4 py-4 font-medium text-blue-600 dark:text-blue-500 hover:underline">
				<Button href="/contacts/recommended" className="text-xs sm:text-sm px-3 sm:px-5 py-2">
					Recommended
				</Button>
			</th>
			<td class="px-4 py-4">
      <span class="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300">
       {data.numberRecommendedContact}
      </span>
				<span class="ml-2">recommended</span>
			</td>
		</tr>
		</tbody>
	</table>
</div>