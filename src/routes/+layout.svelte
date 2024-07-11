<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';

	import Fa from 'svelte-fa';
	import { faPersonDigging } from '@fortawesome/free-solid-svg-icons';

	export let data;

	$: currentPath = $page.url.pathname;

	const menu = [
		{ icon: faPersonDigging, text: 'call-sheets', href: '/call_sheets' },
		{ icon: faPersonDigging, text: 'registration', href: '/registration' },
		{ icon: faPersonDigging, text: 'recommendation', href: '/recommendation' },
		{ icon: faPersonDigging, text: 'projects', href: '/projects' },
		{ icon: faPersonDigging, text: 'contacts', href: '/contacts' },
		{ icon: faPersonDigging, text: 'users', href: '/users' },
		{ icon: faPersonDigging, text: 'mailing', href: '/mailing' },
		{ icon: faPersonDigging, text: 'files', href: '/files' },
		{ icon: faPersonDigging, text: 'composer and piece', href: '/library' },
		{ icon: faPersonDigging, text: 'log out', href: '/api/sign_out' }
	];
</script>

{#if data.connected}
	<div class="flex justify-center items-center flex-wrap w-full border-2 border-rose-500">
		<nav class="flex gap-12 p-4">
			{#each menu as item}
				<a
					href={item.href}
					class="btn items-center justify-start"
					class:variant-soft-primary={currentPath === item.href}
					class:variant-soft={currentPath !== item.href}
				>
					<Fa icon={item.icon} />
					<span>{item.text}</span>
				</a>
			{/each}
		</nav>
	</div>
{/if}

<slot />
