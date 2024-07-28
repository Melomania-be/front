<script lang="ts">
	export let date: Date;
	let usableDate: string;

	$: if (date) {
		usableDate = date.toISOString().split('T')[0];
	}

	async function changeHandler(event: any) {
		const tmpDate = new Date(event.target.value);
		date = new Date(tmpDate.toISOString().split('T')[0] + 'T' + date.toISOString().split('T')[1]);
	}
</script>

<input type="date" value={usableDate} on:change={changeHandler} />
