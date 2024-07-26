<script lang="ts">
	export let date: string | Date;
	export let withTime: boolean = false;

	let usableDate = new Date(date);

	const dateOptions : Intl.DateTimeFormatOptions = {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',	
	};

	const timeOption: Intl.DateTimeFormatOptions = {
		hour: '2-digit',
		minute: '2-digit'
	};

	$: usableDate = new Date(date);
</script>

<span>
	{#if date}
		{withTime ? usableDate.toLocaleTimeString(undefined, timeOption) + " - " + usableDate.toLocaleDateString(undefined, dateOptions) : usableDate.toLocaleDateString(undefined, dateOptions)}
	{:else}
		-
	{/if}
</span>
