<script lang="ts">
	export let date: Date | null;
	let usableTime: string;

	$: if (date) {
		usableTime = date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
	}

	async function changeHandler(event: any) {
        if (date) {
            date.setHours(Number(event.target.value.split(':')[0]));
            date.setMinutes(Number(event.target.value.split(':')[1]));
        }
	}
</script>

<input type="time" value={usableTime} on:change={changeHandler} />
