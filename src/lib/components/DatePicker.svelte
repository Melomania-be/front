<script lang="ts">
	export let date: Date | string | null;

	let usableDate: string | null = null;

	function getLocalDateString(value: Date | string) {
		const d = new Date(value);

		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');

		return `${year}-${month}-${day}`;
	}

	function getLocalTimeString(value: Date | string) {
		const d = new Date(value);

		const hours = String(d.getHours()).padStart(2, '0');
		const minutes = String(d.getMinutes()).padStart(2, '0');
		const seconds = String(d.getSeconds()).padStart(2, '0');

		return `${hours}:${minutes}:${seconds}`;
	}

	$: usableDate = date ? getLocalDateString(date) : null;

	function changeHandler(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = target.value;

		if (value) {
			const timePart = date ? getLocalTimeString(date) : '00:00:00';
			date = new Date(`${value}T${timePart}`);
		} else {
			date = null;
		}
	}
</script>

<input type="date" value={usableDate} on:change={changeHandler} />