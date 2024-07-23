<script lang="ts">
	var unsubscribe_email = '';

	async function unsubscribe(unsubscribe_email: string) {
		const data = {
			email: unsubscribe_email
		};

		try {
			const resMail = await fetch('/api/unsubscribe', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});

			if (resMail.ok) {
				alert('unsubscribed');
			} else if (resMail.status === 404) {
				alert('This email is not linked to any account');
			} else {
				alert('Error unsubscribing');
			}
		} catch (error) {
			console.error('Error sending email:', error);
			alert('Error unsubscribing');
		}
	}
</script>

<html lang="ts">
	<body>
		<h1>Unsubscribe</h1>
		<div>
			<label for="email">Email:</label>
			<input
				class="form-control border-black"
				placeholder="email"
				type="email"
				bind:value={unsubscribe_email}
				required
			/>
			<button
				class=" bg-blue-500 hover:bg-blue-700 text-white rounded"
				on:click={() => unsubscribe(unsubscribe_email)}>Unsubscribe</button
			>
		</div>
	</body>
</html>
