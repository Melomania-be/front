<script lang="ts">
	import { page } from '$app/stores';
	import DateShow from '$lib/components/DateShow.svelte';
	import { onMount } from 'svelte';

    
	export let data;

    let project = data;
    console.log(project);
    
    let lastRegistrationEmailSent = 0;
    let lastCallsheetNotificationSent = 0;
    
	let isSendingRegistrationEmail = false;
	let isSendingCallsheetNotification = false;

    $: id = $page.params.id;

    onMount(() => {
        console.log(id);
        const res = fetch(`/api/projects/${id}/management/mailing`);
        res.then((res) => res.json()).then((data) => {
            lastRegistrationEmailSent = data.lastRegistrationEmailSent;
            lastCallsheetNotificationSent = data.lastCallsheetNotificationSent;
        });
    });

    async function sendRegistrationEmail(){
		console.log('Send Recommendation Notification');

		const data = {
			projectId: id,
		};

		try {
			const resMail = await fetch('/api/mailing/sendRecommendationNotifications', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
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
		}
        
    }

    async function sendCallsheetNotification(){
		isSendingCallsheetNotification = true;
		console.log('Sends Callsheet Notification to all participants');
        
		const data = {
			projectId: id,
		};

		try {
			const resMail = await fetch('/api/mailing/sendCallsheetNotifications', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			if (resMail.ok) {
				alert('Mail successfully sent');
			} else if (resMail.status === 404) {
				alert('This email is not linked to any account');
			} else {
				alert('Error unsubscribing');
			}

		} catch (error) {
			console.error('Error sending email:', error);
		}
		finally {
			isSendingCallsheetNotification = false;
		}
    }
	
</script>

<div class="w-full">
	<div class="border border-red-300 w-fit">
		<h2 class="m-2 text-lg">Important informations</h2>
		<ul>
			<li>
                Last registration email sent : <DateShow date={lastRegistrationEmailSent} />
            </li>
            <li>
                Last callsheet notification sent : <DateShow date={lastCallsheetNotificationSent} />
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
                <br>
                Note : this will send a mail to every contact registered that has been validated to ask them to participate in this project.
            </div>
			<div class="text-sm pt-8">
				<button 
					class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
					on:click={sendCallsheetNotification}
					disabled={isSendingCallsheetNotification}
				>
					{isSendingCallsheetNotification ? 'Sending...' : 'Send a callsheet notification'}
				</button>
                <br>
                Note : this will send a mail to every participant validated in this project asking them to take a look at the callsheet.
			</div>
			
        </div>
	</div>

</div>
