<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<div
	class="m-1 relative max-w-xxl bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
>
	<div
		class="mb-5 font-bold tracking-tight text-gray-900 border-b-gray-200 shadow dark:text-white origin-center w-full flex justify-center"
	>
		<h1 class="text-3xl font-bold mb-2 p-3">Default Templates</h1>
	</div>
  
	<button
		class="
			py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700
			align-center"
		on:click={() => goto('/mailing/templates')}
	>
		<span class="size-3 icon-[line-md--arrow-left]"></span>
		Back to Template Manager
	</button>

    <div class="ml-10">
		<h2 class="text-lg font-bold tracking-tight dark:text-white underline">What are default templates ?</h2> <br />
        <p> They are the templates sent automatically or when you do a specific
		action.
        </p>
	<ul>
		<li>
			<span class="font-bold"> - Callsheet Notification</span> : sent to participants when you want to notify them about changes on a
			callsheet.
		</li>
		<li>
			<span class="font-bold"> - Recruitment Notification </span>: sent to all contacts (validated and subscribed to emails) when you
			want to make them know there is a new project they can apply to.
		</li>
		<li>
			<span class="font-bold"> - Participation Validation Notification</span> : sent to a contact when they are validated to
			participate in a project.
		</li>
		<li>
			<span class="font-bold"> - Recommended Notification</span> : sent to someone that has been recommended to propose them to apply
			to a project.
		</li>
	</ul>
    <p class="mt-5">You can edit them by clicking on the template you want to modify. Please note that these changes are permanent and you cannot revert back to a previous version.</p>
    </div>
</div>
