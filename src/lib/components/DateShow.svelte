<script lang="ts">
	export let startTime: string | Date;
	export let endTime: string | Date | null = null;
	export let withTime: boolean = false;
	export let withDate: boolean = true;
	export let isRehearsal: boolean = false;

	console.log(endTime);
	let usableStartTime = new Date(startTime);
	console.log('start', usableStartTime);
	let usableEndTime = endTime
		? new Date(endTime)
		: new Date(
				usableStartTime.getTime() + (isRehearsal ? 3 * 60 * 60 * 1000 : 2.5 * 60 * 60 * 1000)
			);
	console.log('end', usableEndTime);

	const dateOptions: Intl.DateTimeFormatOptions = {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	};
	const timeOption: Intl.DateTimeFormatOptions = {
		hour: '2-digit',
		minute: '2-digit'
	};

	$: usableStartTime = new Date(startTime);
	$: usableEndTime = endTime
		? new Date(endTime)
		: new Date(
				usableStartTime.getTime() + (isRehearsal ? 3 * 60 * 60 * 1000 : 2.5 * 60 * 60 * 1000)
			);
</script>

<span>
	{#if startTime}
		{#if withTime && withDate}
			{usableStartTime.toLocaleTimeString(undefined, timeOption)}
			{' - '}
			{usableEndTime.toLocaleTimeString(undefined, timeOption)}
			{' | '}
			{usableStartTime.toLocaleDateString(undefined, dateOptions)}
		{:else if withTime}
			{usableStartTime.toLocaleTimeString(undefined, timeOption)}
			{' - '}
			{usableEndTime.toLocaleTimeString(undefined, timeOption)}
		{:else if withDate}
			{usableStartTime.toLocaleDateString(undefined, dateOptions)}
			{#if endTime}
				{' to '}
				{usableEndTime.toLocaleDateString(undefined, dateOptions)}
			{/if}
		{/if}
	{:else}
		-
	{/if}
</span>
