<script lang="ts">
	export let startTime: string | Date;
	export let endTime: string | Date | null = null;
	export let withTime: boolean = false;
	export let withDate: boolean = true;
	export let multiLine: boolean = false;

	function toLocalDateTimeString(value: string | Date) {
		const d = new Date(value);

		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		const hours = String(d.getHours()).padStart(2, '0');
		const minutes = String(d.getMinutes()).padStart(2, '0');

		return `${year}-${month}-${day}T${hours}:${minutes}`;
	}

	function normalize(value: string | Date) {
		if (value instanceof Date) {
			return toLocalDateTimeString(value);
		}

		return value;
	}

	function getDate(value: string | Date) {
		if (!value) return '';

		const raw = String(value);
		const datePart = raw.includes('T') ? raw.split('T')[0] : raw.slice(0, 10);

		const [year, month, day] = datePart.split('-').map(Number);

		if (!year || !month || !day) return raw;

		const date = new Date(year, month - 1, day);

		return date.toLocaleDateString('en-GB', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	function getTime(value: string | Date) {
		if (!value) return '';

		const raw = String(value);

		const timePart = raw.includes('T')
			? raw.split('T')[1]?.slice(0, 5)
			: raw.slice(11,16);

		if (!timePart || !timePart.includes(':')) return raw;

		const [hourString, minute] = timePart.split(':');

		return `${hourString}:${minute}`;
	}
</script>

<span>
	{#if startTime}
		{#if multiLine}
			{getDate(startTime)}<br />
			{getTime(startTime)}
			{#if endTime}
				{' - '}{getTime(endTime)}
			{/if}
		{:else if withTime && withDate}
			{getTime(startTime)}
			{#if endTime}
				{' - '}{getTime(endTime)}
			{/if}
			{' | '}
			{getDate(startTime)}
		{:else if withTime}
			{getTime(startTime)}
			{#if endTime}
				{' - '}{getTime(endTime)}
			{/if}
		{:else if withDate}
			{getDate(startTime)}
		{/if}
	{:else}
		-
	{/if}
</span>