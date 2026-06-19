<script lang="ts">
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'primary';
	export let className: string = '';
	export let disabled: boolean = false;
	export let href: string | null = null;

	const baseClasses = "inline-flex justify-center items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

	const variants = {
		primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
		secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500",
		danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
		ghost: "bg-transparent hover:bg-gray-100 text-gray-700 shadow-none"
	};
</script>

{#if href}
	<a {href} class="{baseClasses} {variants[variant]} {className}">
		<slot />
	</a>
{:else}
	<button {type} {disabled} class="{baseClasses} {variants[variant]} {className}" on:click>
		<slot />
	</button>
{/if}