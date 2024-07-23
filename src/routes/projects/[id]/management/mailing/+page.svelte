<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	export let data;

	let url = '';
	if (typeof window !== 'undefined') {
		url = window.location.origin;
	}

	let project = data;

	let lastRecommendationNotificationSent = 0;
	let lastCallsheetNotificationSent = 0;

	let isSendingRegistrationEmail = false;
	let isSendingCallsheetNotification = false;

	$: id = $page.params.id;

	onMount(async () => {
		console.log('onMount');
		console.log('id', id);
		const mailRes = await fetch(`/api/projects/${id}/management/mailing`);

		if (mailRes.ok) {
			const mailData = await mailRes.json();
			console.log('mailData', mailData);
			lastRecommendationNotificationSent = mailData.lastRecommendationNotificationSent;
			lastCallsheetNotificationSent = mailData.lastCallsheetNotificationSent;
			console.log('lastRecommendationNotificationSent', lastRecommendationNotificationSent);
			console.log('lastCallsheetNotificationSent', lastCallsheetNotificationSent);
		} else {
			console.error('Error fetching mailing data');
		}
	});

	async function sendRegistrationEmail() {
		console.log('Send Registration Notification');
		isSendingRegistrationEmail = true;

		const data = {
			projectId: id
		};

		try {
			const resMail = await fetch('/api/mailing/sendRecommendationNotifications', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});
			if (resMail.ok) {
				alert('Mail successfully sent');
			} else if (resMail.status === 400) {
				const errorData = await resMail.json();
				alert(`Error: ${errorData.message}`);
			} else if (resMail.status === 500) {
				alert('Internal server error, please try again later');
			} else {
				alert('Unknown error occurred, please try again');
			}
		} catch (error) {
			console.error('Error sending email:', error);
			alert('Network error, please try again');
		} finally {
			isSendingRegistrationEmail = false;
		}
	}

	async function sendCallsheetNotification() {
		isSendingCallsheetNotification = true;
		console.log('Sends Callsheet Notification to all participants');

		const data = {
			projectId: id
		};

		try {
			const resMail = await fetch('/api/mailing/sendCallsheetNotifications', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});
			if (resMail.ok) {
				alert('Mail successfully sent');
			} else if (resMail.status === 400) {
				const errorData = await resMail.json();
				alert(
					`Check if all the fields required to send this mail are filled (Participants : ${url}/projects/${id}/management/participants , Callsheet : ${url}/projects/${id}/management/callsheets, Responsible : ${url}/projects/${id}/management/modify) Error: ${errorData.message}`
				);
			} else if (resMail.status === 500) {
				alert('Internal server error, please try again later');
			} else {
				alert('Unknown error occurred, please try again');
			}
		} catch (error) {
			console.error('Error sending email:', error);
			alert('Network error, please try again');
		} finally {
			isSendingCallsheetNotification = false;
		}
	}
</script>

<div class="w-full">
	<div class="border border-red-300 w-fit">
		<h2 class="m-2 text-lg">Important informations</h2>
		<ul>
			<li>
				Last registration email sent : {#if lastRecommendationNotificationSent !== 0}{lastRecommendationNotificationSent}{:else}Never{/if}
			</li>
			<li>
				Last callsheet notification sent : {#if lastCallsheetNotificationSent !== 0}{lastCallsheetNotificationSent}{:else}Never{/if}
			</li>
		</ul>
	</div>
	<div class="flex flex-col md:flex-row">
		<div
			class="grid grid-cols-1 space-y-1 w-full md:w-5/12 m-1 p-6 bg-white border border-black rounded-tl-lg shadow dark:bg-gray-800 dark:border-gray-700"
		>
			<div class="text-sm">
				<button
					class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
					on:click={sendRegistrationEmail}
					disabled={isSendingRegistrationEmail}
				>
					{isSendingRegistrationEmail ? 'Sending...' : 'Send a registration email'}
				</button>
				<br />
				Note : this will send a mail to every contact registered that has been validated to ask them
				to participate in this project.
			</div>
			<div class="text-sm pt-8">
				<button
					class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
					on:click={sendCallsheetNotification}
					disabled={isSendingCallsheetNotification}
				>
					{isSendingCallsheetNotification ? 'Sending...' : 'Send a callsheet notification'}
				</button>
				<br />
				Note : this will send a mail to every participant validated in this project asking them to take
				a look at the callsheet.
			</div>
		</div>
	</div>
</div>
