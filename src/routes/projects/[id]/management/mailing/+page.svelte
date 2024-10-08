<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import DateShow from '$lib/components/DateShow.svelte';
	import HtmlEditor from '../../../../mailing/HtmlEditor.svelte';
	import type { Folder } from '$lib/types/Folder';
	import type { Project } from '$lib/types/Project.js';
	import { onMount } from 'svelte';
	import type { MailTemplate } from '$lib/types/MailTemplate';

	let project: Project;
	let folders : Array<Folder>
	let selectedFolder: Folder;
	let OutputSrc = '';
	let html = '';
	let uniqueSubject = '';
	let selectedTemplate : MailTemplate;
	let templates : Array<MailTemplate>

	let url = '';
	if (typeof window !== 'undefined') {
		url = window.location.origin;
	}

	let lastRecruitmentNotificationSent = '';
	let lastCallsheetNotificationSent = '';

	let isSendingRecruitmentEmail = false;
	let isSendingCallsheetNotification = false;

	let useTemplate = false;

	$: id = $page.params.id;

	onMount(async () => {
		console.log('onMount');
		console.log('id', id);

		const projectRes = await fetch(`/api/projects/${id}`);
		if (projectRes.ok) {
			project = await projectRes.json();
		} else {
			console.error('Error fetching project data');
		}

		console.log('project', project);

		const resFolders = await fetch('/api/folders');
		const dataFolders = await resFolders.json();
		folders = dataFolders;

		console.log(folders);

		const res = await fetch('/api/templates');
		const data = await res.json();
		templates = data;

		const mailRes = await fetch(`/api/projects/${id}/management/mailing`);

		if (mailRes.ok) {
			const mailData = await mailRes.json();
			console.log('mailData', mailData);
			lastRecruitmentNotificationSent = mailData.lastRecruitmentNotificationSent;
			lastCallsheetNotificationSent = mailData.lastCallsheetNotificationSent;
			console.log('lastRecommendationNotificationSent', lastRecruitmentNotificationSent);
			console.log('lastCallsheetNotificationSent', lastCallsheetNotificationSent);
		} else {
			console.error('Error fetching mailing data');
		}
	});

	async function sendRecruitmentEmail() {
		console.log('Send Recruitment Notification');
		let confirmSend = confirm('Are you sure you want to send a recruitment email to every contact ?');
		if (!confirmSend) {
			return;
		}

		isSendingRecruitmentEmail = true;

		const data = {
			projectId: id
		};

		try {
			const resMail = await fetch('/api/mailing/sendRecruitmentNotifications', {
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
			lastRecruitmentNotificationSent = new Date().toString();
			isSendingRecruitmentEmail = false;
		}
	}

	async function sendCallsheetNotification() {
		let confirmSend = confirm('Are you sure you want to send a callsheet notification to all participants ?');
		if (!confirmSend) {
			return;
		}
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
			lastCallsheetNotificationSent = new Date().toString();
			isSendingCallsheetNotification = false;
		}
	}

	function addImages(file: { path: any }) {
		OutputSrc = `<img file=${file.path}/>`;
	}

	async function sendMail(){
		console.log('Send mail');
		let confirmSend = confirm(
			`Are you sure you want to send this unique mail to the participants?`
		);
		if (!confirmSend) {
			return;
		}

		const data = {
			projectId: id,
			type: 'unique',
			templateId: null,
			subject: uniqueSubject,
			content: html
		};

		try {
			const resMail = await fetch('/api/mailing/sendMailToParticipants', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});
			if (resMail.ok) {
				alert('Mail successfully sent');
			} else {
				alert('An error occurred');
			}
		} catch (error) {
			console.error('Error sending email:', error);
			alert('Network error, please try again');
		}
	}

	async function sendTemplateToParticipants(){
		let confirmSend = confirm(
			`Are you sure you want to send this template to the participants?`
		);
		if (!confirmSend) {
			return;
		}

		const data = {
			projectId: id,
			type: 'template',
			templateId: selectedTemplate.id,
			subject: uniqueSubject,
			content: selectedTemplate.content
		};

		try {
			const resMail = await fetch('/api/mailing/sendMailToParticipants', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});
			if (resMail.ok) {
				alert('Mail successfully sent');
			} else {
				alert('An error occurred');
			}
		} catch (error) {
			console.error('Error sending email:', error);
			alert('Network error, please try again');
		}
	}
</script>

<div
	class="m-1 relative max-w-xxl bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
>
	<div
		class="mb-5 font-bold tracking-tight text-gray-900 border-b-gray-200 shadow dark:text-white origin-center w-full flex justify-center"
	>
		<h1 class="text-3xl font-bold mb-2 p-3">Project Mailing</h1>
	</div>
	{#if project}
		<div class="ml-5 w-full">
			<h2 class="text-xl underline">Project : {project.name}</h2>
		</div>
	{/if}

	<div class="grid grid-cols-[1fr_2fr] gap-4">
		<div class="col-span-1 m-5 border-2 rounded-lg border-red-400 w-1/2">
			<div class="p-3">
				<h2 class="m-2 text-lg">Important informations</h2>
				<ul>
					<li>
						Last recruitment email sent : {#if lastRecruitmentNotificationSent !== '' && lastRecruitmentNotificationSent !== null && lastRecruitmentNotificationSent !== undefined}<DateShow
								startTime={lastRecruitmentNotificationSent.toString()}
							/>{:else}Never{/if}
					</li>
					<li>
						Last callsheet notification sent : {#if lastCallsheetNotificationSent !== '' && lastCallsheetNotificationSent !== null && lastCallsheetNotificationSent !== undefined}<DateShow
								startTime={lastCallsheetNotificationSent.toString()}
							/>{:else}Never{/if}
					</li>
				</ul>
			</div>
		</div>

		<div class="col-span-1">
			<div class="mb-3">
				<p class="text-lg">
					To take a look or modify these default templates please go to
					<button
						class="text-blue-800 cursor-pointer hover:text-blue-400"
						on:click={() => goto('/mailing/templates/default')}
					>
						the default template editor.
					</button>
				</p>
			</div>
			<div class="">
				<div class="text-sm">
					<button
						class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
						on:click={sendRecruitmentEmail}
						disabled={isSendingRecruitmentEmail}
					>
						{isSendingRecruitmentEmail ? 'Sending...' : 'Send a recruitment email'}
					</button>
					<br>
					Note : Sending a recruitment notification will send an email to every contact (who accepts to receive emails and is validated) to ask them
					to participate in this project. The mail sent is based on the default recruitment template. (recruitment_notification.html)
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
					Note : Sending a callsheet notification will send an email to every participant accepted in this project asking them to
					take a look at the callsheet. The mail is based on the default callsheet template. (callsheet_notification.html)
				</div>
			</div>
		</div>
	</div>

	{#if useTemplate === false}
		<h2 class="mt-10 text-2xl font-bold mb-2 text-center underline">Unique mail</h2>
		<button
			class="ml-10 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
			on:click={() => (useTemplate = true)}>Use a template</button
		>
		<p class="ml-10">This email will be sent to every accepted participant in this project. </p>
		<div class="ml-10 mb-10 pt-5 grid grid-cols-2 gap-10">
			<div
				class="col-span-1 border border-gray-500 rounded p-5 bg-white dark:bg-gray-800 dark:border-gray-700"
			>
				<h2 class="text-xl font-bold mb-4">Write your email</h2>
				<div>
					<p>
						To add an image select a folder and click on the name of the image you want to add. You
						can now paste the appropriate line in the html below.
						<br />
						The image cannot appear in the preview but will be sent in the mail.
					</p>
					<br />
					{#if folders && folders.length > 0}
						<p>
							Select your folder : <select bind:value={selectedFolder}>
								{#each folders as folder}
									<option value={folder}>{folder.name}</option>
								{/each}
							</select>
						</p>
					{:else}
						<p>No folders found</p>
					{/if}
				</div>
				{#if selectedFolder && selectedFolder.files && selectedFolder.files.length > 0}
					<div>
						<p>Images in the folder :</p>
						{#each selectedFolder.files as file}
							{#if file.type === 'image'}
								<button
									class="text-blue-900 cursor-pointer"
									on:click={() => {
										addImages(file);
										const imageEmbedCode = OutputSrc;
										navigator.clipboard.writeText(imageEmbedCode);
										alert('Image link copied to clipboard');
									}}
								>
									{file.name}
								</button>
								<br />
							{/if}
						{/each}
						<br />
					</div>
				{/if}
				<input
					type="text"
					bind:value={uniqueSubject}
					placeholder="Email Subject"
					class="mb-2 block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
				/>
				<HtmlEditor bind:content={html} />
				<button
					class="mt-5 focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
					on:click={sendMail}>Send</button
				>
			</div>
			<div
				class="col-span-1 border border-gray-500 rounded p-5 bg-white dark:bg-gray-800 dark:border-gray-700"
			>
				<h2 class="text-xl font-bold mb-4">Preview</h2>
				<div class="p-4 bg-gray-100 rounded dark:bg-gray-900" style="min-height: 200px;">
					{@html html}
				</div>
			</div>
		</div>
	{/if}

	{#if useTemplate === true}
		<h2 class="mt-10 text-2xl font-bold mb-2 p-3 text-center underline">Template mail</h2>
		<button
			class="ml-10 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
			on:click={() => (useTemplate = false)}>Use unique mail</button
		>
		<div class="ml-10 mb-10 pt-5 grid grid-cols-2 gap-10">
			<div
				class="col-span-1 border border-gray-500 rounded p-5 bg-white dark:bg-gray-800 dark:border-gray-700"
			>
				<h2 class="text-xl font-bold mb-4">Complete the template informations</h2>
				<p>
					Please select the template you want to use :
					<select class="m-2" bind:value={selectedTemplate}>
						{#each templates as template}
							<option value={template}>{template.name}</option>
						{/each}
					</select>
				</p>
				{#if selectedTemplate}					
					<button
						class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
						on:click={sendTemplateToParticipants}>Send</button
					>
				{/if}
			</div>
			<div
				class="col-span-1 border border-gray-500 rounded p-5 bg-white dark:bg-gray-800 dark:border-gray-700"
			>
				{#if selectedTemplate}
					<div class="m-2">
						
						<h2 class="text-xl font-bold mb-4">{selectedTemplate.name}</h2>
					</div>
					<div class="m-2 border border-gray-500 rounded">
						{@html selectedTemplate.content}
					</div>
				{:else}
					<p>Please select a template to see its content</p>
				{/if}
			</div>
		</div>
	{/if}


</div>