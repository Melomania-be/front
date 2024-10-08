<script lang="ts">
    export let date: Date | null;
    let usableDate: string | null = null;

    $: if (date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        usableDate = date.toISOString().split('T')[0];
    } else {
        usableDate = null;
    }

    async function changeHandler(event: any) {
        const value = event.target.value;
        if (value) {
            const tmpDate = new Date(value);
            if (date) {
                date = new Date(tmpDate.toISOString().split('T')[0] + 'T' + date.toISOString().split('T')[1]);
            } else {
                date = tmpDate;
            }
        } else {
            date = null;
        }
    }
</script>

<input type="date" value={usableDate} on:change={changeHandler} />