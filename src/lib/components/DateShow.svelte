<script lang="ts">
	export let date: any;
	export let withTime: boolean = false;

	let usableDate = new Date(date);

	const options : Intl.DateTimeFormatOptions = {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',	
	};

	$: usableDate = new Date(date);
</script>

<span>
	{#if date}
		{withTime ? usableDate.toLocaleTimeString() + " - " + usableDate.toLocaleDateString(undefined, options) : usableDate.toLocaleDateString(undefined, options)}
	{:else}
		-
	{/if}
</span>
