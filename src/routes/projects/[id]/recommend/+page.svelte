<!-- src/routes/projects/[id]/recommend/+page.svelte - Design style callsheet -->
<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		UserPlus,
		Music,
		Mail,
		Phone,
		MessageCircle,
		Plus,
		Trash2,
		CheckCircle,
		Star,
		Calendar,
		MapPin
	} from 'lucide-svelte';
	import type { Project } from '$lib/types';
	import logo from '$lib/assets/image1.png';

	let project: Project | undefined;
	let loading = true;
	let submitting = false;
	let submitted = false;

	// Form data
	let recommenderInfo = {
		name: '',
		email: ''
	};

	let recommendations = [
		{
			first_name: '',
			last_name: '',
			email: '',
			phone: '',
			messenger: '',
			instrument: '',
			message: ''
		}
	];

	let errors: Record<string, string> = {};

	$: projectId = $page.params.id;

	onMount(async () => {
		await fetchProject();
		loading = false;
	});

	async function fetchProject() {
		try {
			const response = await fetch(`/api/projects/${projectId}`);
			if (response.ok) {
				project = await response.json();
			} else {
				goto('/'); // Redirect if project doesn't exist
			}
		} catch (error) {
			console.error('Error fetching project:', error);
			goto('/');
		}
	}

	function addRecommendation() {
		if (recommendations.length < 5) {
			recommendations = [
				...recommendations,
				{
					first_name: '',
					last_name: '',
					email: '',
					phone: '',
					messenger: '',
					instrument: '',
					message: ''
				}
			];
		}
	}

	function removeRecommendation(index: number) {
		if (recommendations.length > 1) {
			recommendations = recommendations.filter((_, i) => i !== index);
		}
	}

	function validateForm(): boolean {
		errors = {};

		// Recommender validation
		if (!recommenderInfo.name.trim()) {
			errors['recommender_name'] = 'Your name is required';
		}

		if (recommenderInfo.email && !isValidEmail(recommenderInfo.email)) {
			errors['recommender_email'] = 'Invalid email format';
		}

		// Recommendations validation
		let hasValidRecommendation = false;

		recommendations.forEach((rec, index) => {
			const prefix = `rec_${index}`;

			if (
				!rec.first_name.trim() &&
				!rec.last_name.trim() &&
				!rec.email &&
				!rec.phone &&
				!rec.messenger
			) {
				// Empty recommendation, ignore it
				return;
			}

			hasValidRecommendation = true;

			if (!rec.first_name.trim()) {
				errors[`${prefix}_first_name`] = 'First name required';
			}

			if (!rec.last_name.trim()) {
				errors[`${prefix}_last_name`] = 'Last name required';
			}

			if (!rec.email && !rec.phone && !rec.messenger) {
				errors[`${prefix}_contact`] = 'At least one contact method is required';
			}

			if (rec.email && !isValidEmail(rec.email)) {
				errors[`${prefix}_email`] = 'Invalid email format';
			}
		});

		if (!hasValidRecommendation) {
			errors['general'] = 'At least one complete recommendation is required';
		}

		return Object.keys(errors).length === 0;
	}

	async function submitRecommendations() {
		if (!validateForm()) {
			return;
		}

		submitting = true;

		// Filter empty recommendations
		const validRecommendations = recommendations.filter(
			(rec) =>
				rec.first_name.trim() || rec.last_name.trim() || rec.email || rec.phone || rec.messenger
		);

		try {
			const response = await fetch(`/api/projects/${projectId}/recommend`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					recommender_name: recommenderInfo.name,
					recommender_email: recommenderInfo.email || null,
					recommendations: validRecommendations
				})
			});

			if (response.ok) {
				submitted = true;
			} else {
				const errorData = await response.json();
				alert(`Error: ${errorData.message || 'Unable to submit recommendations'}`);
			}
		} catch (error) {
			console.error('Error submitting recommendations:', error);
			alert('Error sending recommendations');
		} finally {
			submitting = false;
		}
	}

	function isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	function resetForm() {
		submitted = false;
		recommenderInfo = { name: '', email: '' };
		recommendations = [
			{
				first_name: '',
				last_name: '',
				email: '',
				phone: '',
				messenger: '',
				instrument: '',
				message: ''
			}
		];
		errors = {};
	}
</script>

<svelte:head>
	<title>Recommend Musicians - {project?.name || 'Project'}</title>
	<meta
		name="description"
		content="Recommend talented musicians for the project {project?.name || ''}"
	/>
</svelte:head>

<div
	class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900"
>
	{#if loading}
		<div class="flex items-center justify-center min-h-screen">
			<div class="text-center">
				<div
					class="animate-spin rounded-full h-16 w-16 border-b-2 border-[#6B9AD9] mx-auto mb-4"
				></div>
				<p class="text-gray-600">Loading...</p>
			</div>
		</div>
	{:else if !project}
		<div class="flex items-center justify-center min-h-screen">
			<div class="text-center">
				<h1 class="text-2xl font-bold text-gray-800 mb-4">Project not found</h1>
				<p class="text-gray-600">
					The requested project does not exist or is no longer accessible.
				</p>
			</div>
		</div>
	{:else if submitted}
		<!-- Confirmation page callsheet style -->
		<div class="relative w-full py-6 px-4 sm:px-6 lg:px-8">
			<div class="flex flex-col gap-10 max-w-4xl mx-auto">
				<!-- Section with image and overlaid content -->
				<div class="relative">
					<!-- Cover image -->
					<div class="w-full h-[200px] sm:h-[280px] md:h-[350px] lg:h-[400px] xl:h-[450px]">
						<img src={logo} alt="logo" class="w-full h-full object-cover rounded object-center" />

						<!-- Overlaid title -->
						<div
							class="absolute top-8 sm:top-12 md:top-16 lg:top-20 xl:top-24 left-1/2 transform -translate-x-1/2 text-center w-full px-4"
						>
							<h1
								class="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white drop-shadow-md break-words"
							>
								RECOMMENDATION - {project.name}
							</h1>
						</div>
					</div>

					<!-- White container overlapping the image -->
					<div
						class="relative -mt-[80px] sm:-mt-[120px] md:-mt-[150px] lg:-mt-[180px] xl:-mt-[200px] mx-2 z-10"
					>
						<div
							class="bg-white dark:bg-gray-900 shadow-lg rounded-xl px-3 sm:px-4 md:px-6 py-4 sm:py-6 max-w-4xl mx-auto border border-white/20 backdrop-blur-sm"
						>
							<!-- Success confirmation -->
							<div class="text-center py-8">
								<div
									class="flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mx-auto mb-6"
								>
									<CheckCircle class="text-green-500" size={48} />
								</div>

								<h2 class="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
									Thank you for your recommendations!
								</h2>

								<div class="max-w-2xl mx-auto space-y-4 text-gray-600">
									<p class="text-lg">
										Your recommendations for the project <strong class="text-[#6B9AD9]"
											>{project.name}</strong
										> have been successfully submitted.
									</p>
									<p>
										The project team will review your suggestions and contact the recommended
										individuals if appropriate.
									</p>
								</div>

								<!-- Recommendations summary -->
								<div class="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
									<h3 class="text-lg font-semibold text-blue-900 mb-4">
										Summary of your recommendations
									</h3>
									<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
										{#each recommendations.filter((r) => r.first_name.trim() || r.last_name.trim()) as rec, index}
											<div class="bg-white p-4 rounded-lg border border-blue-200">
												<div class="font-medium text-gray-800">
													{rec.first_name}
													{rec.last_name}
												</div>
												{#if rec.instrument}
													<div class="text-sm text-gray-600 flex items-center gap-1 mt-1">
														<Music size={12} />
														{rec.instrument}
													</div>
												{/if}
												{#if rec.email}
													<div class="text-sm text-gray-600 flex items-center gap-1 mt-1">
														<Mail size={12} />
														{rec.email}
													</div>
												{/if}
											</div>
										{/each}
									</div>
								</div>

								<!-- Actions -->
								<div class="flex flex-col sm:flex-row gap-4 justify-center mt-8">
									<button
										on:click={resetForm}
										class="px-6 py-3 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] transition-colors flex items-center justify-center gap-2"
									>
										<Plus size={20} />
										Make a new recommendation
									</button>
									<a
										href="/"
										class="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
									>
										Back to home
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- Recommendation form callsheet style -->
		<div class="relative w-full py-6 px-4 sm:px-6 lg:px-8">
			<div class="flex flex-col gap-10 max-w-6xl mx-auto">
				<!-- Section with image and overlaid content -->
				<div class="relative">
					<!-- Cover image -->
					<div class="w-full h-[200px] sm:h-[280px] md:h-[350px] lg:h-[400px] xl:h-[450px]">
						<img src={logo} alt="logo" class="w-full h-full object-cover rounded object-center" />

						<!-- Overlaid title -->
						<div
							class="absolute top-8 sm:top-12 md:top-16 lg:top-20 xl:top-24 left-1/2 transform -translate-x-1/2 text-center w-full px-4"
						>
							<h1
								class="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white drop-shadow-md break-words"
							>
								RECOMMENDATION - {project.name}
							</h1>
						</div>
					</div>

					<!-- White container overlapping the image -->
					<div
						class="relative -mt-[80px] sm:-mt-[120px] md:-mt-[150px] lg:-mt-[180px] xl:-mt-[200px] mx-2 z-10"
					>
						<div
							class="bg-white dark:bg-gray-900 shadow-lg rounded-xl px-3 sm:px-4 md:px-6 py-4 sm:py-6 max-w-4xl mx-auto border border-white/20 backdrop-blur-sm"
						>
							<!-- Introduction -->
							<div class="text-center mb-8">
								<div
									class="flex items-center justify-center w-16 h-16 bg-[#6B9AD9] rounded-xl mx-auto mb-4"
								>
									<UserPlus class="text-white" size={32} />
								</div>
								<h2 class="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
									Recommend talented musicians
								</h2>
								<div class="max-w-2xl mx-auto space-y-2 text-gray-600">
									<p class="text-lg">
										for the project <strong class="text-[#6B9AD9]">{project.name}</strong>
									</p>
									<p>
										Do you know talented musicians who might be interested in this project? Share
										their contact information below!
									</p>
								</div>
							</div>

							<form on:submit|preventDefault={submitRecommendations} class="space-y-8">
								<!-- Recommender information -->
								<div
									class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200"
								>
									<h3 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
										<div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
											<UserPlus class="text-white" size={16} />
										</div>
										Your information
									</h3>

									<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div>
											<label
												for="recommender_name"
												class="block text-sm font-medium text-gray-700 mb-2"
											>
												Your name *
											</label>
											<input
												id="recommender_name"
												type="text"
												bind:value={recommenderInfo.name}
												class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors {errors.recommender_name
													? 'border-red-500 bg-red-50'
													: 'border-gray-300'}"
												placeholder="Your full name"
											/>
											{#if errors.recommender_name}
												<p class="text-sm text-red-600 mt-1">{errors.recommender_name}</p>
											{/if}
										</div>

										<div>
											<label
												for="recommender_email"
												class="block text-sm font-medium text-gray-700 mb-2"
											>
												Your email (optional)
											</label>
											<input
												id="recommender_email"
												type="email"
												bind:value={recommenderInfo.email}
												class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors {errors.recommender_email
													? 'border-red-500 bg-red-50'
													: 'border-gray-300'}"
												placeholder="your@email.com"
											/>
											{#if errors.recommender_email}
												<p class="text-sm text-red-600 mt-1">{errors.recommender_email}</p>
											{/if}
											<p class="text-xs text-gray-500 mt-2">To contact you back if necessary</p>
										</div>
									</div>
								</div>

								<!-- Recommendations -->
								<div class="space-y-6">
									<div class="flex items-center justify-between">
										<h3 class="text-xl font-bold text-gray-800 flex items-center gap-2">
											<div
												class="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center"
											>
												<Music class="text-white" size={16} />
											</div>
											People to recommend
										</h3>

										{#if recommendations.length < 5}
											<button
												type="button"
												on:click={addRecommendation}
												class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
											>
												<Plus size={16} />
												Add a person
											</button>
										{/if}
									</div>

									{#if errors.general}
										<div class="bg-red-50 border border-red-200 rounded-lg p-4">
											<p class="text-red-800 flex items-center gap-2">
												<CheckCircle size={16} />
												{errors.general}
											</p>
										</div>
									{/if}

									{#each recommendations as recommendation, index}
										<div
											class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 relative"
										>
											<div class="flex items-center justify-between mb-6">
												<h4 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
													<div
														class="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold"
													>
														{index + 1}
													</div>
													Person {index + 1}
												</h4>

												{#if recommendations.length > 1}
													<button
														type="button"
														on:click={() => removeRecommendation(index)}
														class="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
														title="Remove this recommendation"
													>
														<Trash2 size={16} />
													</button>
												{/if}
											</div>

											<!-- General contact error -->
											{#if errors[`rec_${index}_contact`]}
												<div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
													<p class="text-sm text-red-800">{errors[`rec_${index}_contact`]}</p>
												</div>
											{/if}

											<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
												<!-- Personal information -->
												<div>
													<label class="block text-sm font-medium text-gray-700 mb-2">
														First name *
													</label>
													<input
														type="text"
														bind:value={recommendation.first_name}
														class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors {errors[
															`rec_${index}_first_name`
														]
															? 'border-red-500 bg-red-50'
															: 'border-gray-300'}"
														placeholder="First name"
													/>
													{#if errors[`rec_${index}_first_name`]}
														<p class="text-sm text-red-600 mt-1">
															{errors[`rec_${index}_first_name`]}
														</p>
													{/if}
												</div>

												<div>
													<label class="block text-sm font-medium text-gray-700 mb-2">
														Last name *
													</label>
													<input
														type="text"
														bind:value={recommendation.last_name}
														class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors {errors[
															`rec_${index}_last_name`
														]
															? 'border-red-500 bg-red-50'
															: 'border-gray-300'}"
														placeholder="Last name"
													/>
													{#if errors[`rec_${index}_last_name`]}
														<p class="text-sm text-red-600 mt-1">
															{errors[`rec_${index}_last_name`]}
														</p>
													{/if}
												</div>

												<!-- Contact -->
												<div>
													<label
														class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"
													>
														<Mail size={14} />
														Email
													</label>
													<input
														type="email"
														bind:value={recommendation.email}
														class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors {errors[
															`rec_${index}_email`
														]
															? 'border-red-500 bg-red-50'
															: 'border-gray-300'}"
														placeholder="email@example.com"
													/>
													{#if errors[`rec_${index}_email`]}
														<p class="text-sm text-red-600 mt-1">{errors[`rec_${index}_email`]}</p>
													{/if}
												</div>

												<div>
													<label
														class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"
													>
														<Phone size={14} />
														Phone
													</label>
													<input
														type="tel"
														bind:value={recommendation.phone}
														class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
														placeholder="+1 234 567 8900"
													/>
												</div>

												<div>
													<label
														class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"
													>
														<MessageCircle size={14} />
														Messenger
													</label>
													<input
														type="text"
														bind:value={recommendation.messenger}
														class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
														placeholder="@username or link"
													/>
												</div>

												<div>
													<label
														class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"
													>
														<Music size={14} />
														Instrument
													</label>
													<input
														type="text"
														bind:value={recommendation.instrument}
														class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
														placeholder="Violin, Piano, Voice..."
													/>
												</div>
											</div>

											<!-- Recommendation message -->
											<div class="mt-6">
												<label class="block text-sm font-medium text-gray-700 mb-2">
													Why do you recommend this person?
												</label>
												<textarea
													bind:value={recommendation.message}
													rows="4"
													class="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
													placeholder="Musical qualities, experience, personality, context of your meeting..."
												></textarea>
											</div>
										</div>
									{/each}
								</div>

								<!-- Submit button -->
								<div class="text-center py-6">
									<button
										type="submit"
										disabled={submitting}
										class="px-8 py-4 bg-[#6B9AD9] text-white text-lg font-semibold rounded-lg hover:bg-[#5a9bb4] disabled:opacity-50 transition-colors flex items-center gap-3 mx-auto shadow-lg"
									>
										{#if submitting}
											<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
										{:else}
											<Star size={24} />
										{/if}
										{submitting ? 'Sending...' : 'Send recommendations'}
									</button>

									<p class="text-sm text-gray-500 mt-4">
										By submitting this form, you agree that your recommendations will be transmitted
										to the project team.
									</p>
								</div>
							</form>
						</div>
					</div>
				</div>

				<!-- Footer -->
				<div class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center mt-8 sm:mt-10">
					Recommendation form - {project.name}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Subtle animation for the container */
	.content-container {
		animation: slideUp 0.6s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Improvement for very small screens */
	@media (max-width: 360px) {
		h1 {
			font-size: 0.9rem !important;
			line-height: 1.2 !important;
		}
	}

	@media (max-width: 320px) {
		h1 {
			font-size: 0.8rem !important;
			line-height: 1.1 !important;
		}
	}

	/* Image optimization for large screens */
	@media (min-width: 768px) {
		img {
			object-position: center;
		}
	}
</style>
