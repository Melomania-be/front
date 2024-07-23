<script lang="ts">
	export let date: any;
	const options = {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	};
</script>

<span>
	{#if date}
		{(new Date(date)).toLocaleDateString(undefined, options)}
	{:else}
		-
	{/if}
</span>
