<script lang="ts">
	export let date: Date;
	let usableTime: string;

	$: if (date) {
		usableTime = date.toISOString().split('T')[1].slice(0,5)
	}

	async function changeHandler(event: any) {
		date.setHours(Number(event.target.value.split(':')[0]))
		date.setMinutes(Number(event.target.value.split(':')[1]))
	}
</script>

<input type="time" value={usableTime} on:change={changeHandler} />
