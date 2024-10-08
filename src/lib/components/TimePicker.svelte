<script lang="ts">
    export let date: Date | null;
    let hours: number = 0;
    let minutes: number = 0;

    function roundToNearestFive(num: number): number {
        return Math.round(num / 5) * 5;
    }

    $: if (date) {
        hours = date.getHours();
        minutes = roundToNearestFive(date.getMinutes());
        date.setMinutes(minutes); // Ensure the date object is updated the first time
    }

    const hoursOptions = Array.from({ length: 24 }, (_, i) => i);
    const minutesOptions = Array.from({ length: 12 }, (_, i) => i * 5);

    function updateTime() {
        if (date) {
            date.setHours(hours);
            date.setMinutes(minutes);
        }
    }
</script>

<div>
    <select bind:value={hours} on:change={updateTime}>
        {#each hoursOptions as hour}
            <option value={hour}>{hour.toString().padStart(2, '0')}</option>
        {/each}
    </select>
    :
    <select bind:value={minutes} on:change={updateTime}>
        {#each minutesOptions as minute}
            <option value={minute}>{minute.toString().padStart(2, '0')}</option>
        {/each}
    </select>
</div>