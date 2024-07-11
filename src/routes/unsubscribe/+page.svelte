<script lang='ts'>
    var unsubscribe_email = '';

    async function unsubscribe() {
        console.log('Unsubscribe');
        const data = {
            email: unsubscribe_email
        };

        try {
            const resMail = await fetch('/api/mailing/unsubscribe', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
        }
        catch (error) {
            console.error('Error sending email:', error);
        }
    }
</script>

<html lang='ts'>
<body>
    <h1>Unsubscribe</h1>
    <div>
        <label for="email">Email:</label>
        <input class="form-control border-black" 
        placeholder="email"
        type="email"
        bind:value={unsubscribe_email}
        required>
        <button class=" bg-blue-500 hover:bg-blue-700 text-white rounded"
        on:click={unsubscribe}>Unsubscribe</button>
    </div>
</body>
</html>