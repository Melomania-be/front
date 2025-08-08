<!-- src/routes/projects/[id]/recommend/+page.svelte -->
<script lang="ts">
	import { page } from '$app/stores'
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { UserPlus, Music, Mail, Phone, MessageCircle, Plus, Trash2, CheckCircle } from 'lucide-svelte'
	import type { Project } from '$lib/types'

	let project: Project | undefined
	let loading = true
	let submitting = false
	let submitted = false

	// Données du formulaire
	let recommenderInfo = {
		name: '',
		email: ''
	}

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
	]

	let errors: Record<string, string> = {}

	$: projectId = $page.params.id

	onMount(async () => {
		await fetchProject()
		loading = false
	})

	async function fetchProject() {
		try {
			const response = await fetch(`/api/projects/${projectId}`)
			if (response.ok) {
				project = await response.json()
			} else {
				goto('/') // Rediriger si le projet n'existe pas
			}
		} catch (error) {
			console.error('Error fetching project:', error)
			goto('/')
		}
	}

	function addRecommendation() {
		if (recommendations.length < 5) {
			recommendations = [...recommendations, {
				first_name: '',
				last_name: '',
				email: '',
				phone: '',
				messenger: '',
				instrument: '',
				message: ''
			}]
		}
	}

	function removeRecommendation(index: number) {
		if (recommendations.length > 1) {
			recommendations = recommendations.filter((_, i) => i !== index)
		}
	}

	function validateForm(): boolean {
		errors = {}

		// Validation du recommandeur
		if (!recommenderInfo.name.trim()) {
			errors['recommender_name'] = 'Votre nom est requis'
		}

		if (recommenderInfo.email && !isValidEmail(recommenderInfo.email)) {
			errors['recommender_email'] = 'Format d\'email invalide'
		}

		// Validation des recommandations
		let hasValidRecommendation = false

		recommendations.forEach((rec, index) => {
			const prefix = `rec_${index}`

			if (!rec.first_name.trim() && !rec.last_name.trim() && !rec.email && !rec.phone && !rec.messenger) {
				// Recommandation vide, on l'ignore
				return
			}

			hasValidRecommendation = true

			if (!rec.first_name.trim()) {
				errors[`${prefix}_first_name`] = 'Prénom requis'
			}

			if (!rec.last_name.trim()) {
				errors[`${prefix}_last_name`] = 'Nom requis'
			}

			if (!rec.email && !rec.phone && !rec.messenger) {
				errors[`${prefix}_contact`] = 'Au moins un moyen de contact est requis'
			}

			if (rec.email && !isValidEmail(rec.email)) {
				errors[`${prefix}_email`] = 'Format d\'email invalide'
			}
		})

		if (!hasValidRecommendation) {
			errors['general'] = 'Au moins une recommandation complète est requise'
		}

		return Object.keys(errors).length === 0
	}

	async function submitRecommendations() {
		if (!validateForm()) {
			return
		}

		submitting = true

		// Filtrer les recommandations vides
		const validRecommendations = recommendations.filter(rec =>
			rec.first_name.trim() || rec.last_name.trim() || rec.email || rec.phone || rec.messenger
		)

		try {
			const response = await fetch(`/api/projects/${projectId}/recommend`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					recommender_name: recommenderInfo.name,
					recommender_email: recommenderInfo.email || null,
					recommendations: validRecommendations
				})
			})

			if (response.ok) {
				submitted = true
			} else {
				const errorData = await response.json()
				alert(`Erreur: ${errorData.message || 'Impossible de soumettre les recommandations'}`)
			}
		} catch (error) {
			console.error('Error submitting recommendations:', error)
			alert('Erreur lors de l\'envoi des recommandations')
		} finally {
			submitting = false
		}
	}

	function isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		return emailRegex.test(email)
	}

	function resetForm() {
		submitted = false
		recommenderInfo = { name: '', email: '' }
		recommendations = [{
			first_name: '',
			last_name: '',
			email: '',
			phone: '',
			messenger: '',
			instrument: '',
			message: ''
		}]
		errors = {}
	}
</script>

<svelte:head>
	<title>Recommander des musiciens - {project?.name || 'Projet'}</title>
	<meta name="description" content="Recommandez des musiciens talentueux pour le projet {project?.name || ''}" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
	{#if loading}
		<div class="flex items-center justify-center min-h-screen">
			<div class="text-center">
				<div class="animate-spin rounded-full h-16 w-16 border-b-2 border-[#6B9AD9] mx-auto mb-4"></div>
				<p class="text-gray-600">Chargement...</p>
			</div>
		</div>
	{:else if !project}
		<div class="flex items-center justify-center min-h-screen">
			<div class="text-center">
				<h1 class="text-2xl font-bold text-gray-800 mb-4">Projet non trouvé</h1>
				<p class="text-gray-600">Le projet demandé n'existe pas ou n'est plus accessible.</p>
			</div>
		</div>
	{:else if submitted}
		<!-- Page de confirmation -->
		<div class="container mx-auto px-4 py-16">
			<div class="max-w-2xl mx-auto text-center">
				<div class="bg-white rounded-lg shadow-xl p-8">
					<CheckCircle class="mx-auto mb-6 text-green-500" size={64} />
					<h1 class="text-3xl font-bold text-gray-800 mb-4">Merci pour vos recommandations !</h1>
					<p class="text-lg text-gray-600 mb-6">
						Vos recommandations pour le projet <strong>{project.name}</strong> ont été transmises avec succès.
					</p>
					<p class="text-gray-600 mb-8">
						L'équipe du projet examinera vos suggestions et contactera les personnes recommandées si approprié.
					</p>

					<div class="flex flex-col sm:flex-row gap-4 justify-center">
						<button
							on:click={resetForm}
							class="px-6 py-3 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] transition-colors"
						>
							Faire une nouvelle recommandation
						</button>
						<a
							href="/"
							class="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
						>
							Retour à l'accueil
						</a>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- Formulaire de recommandation -->
		<div class="container mx-auto px-4 py-8">
			<div class="max-w-4xl mx-auto">
				<!-- En-tête -->
				<div class="text-center mb-8">
					<div class="bg-white rounded-lg shadow-lg p-8 mb-8">
						<UserPlus class="mx-auto mb-4 text-[#6B9AD9]" size={48} />
						<h1 class="text-3xl font-bold text-gray-800 mb-4">
							Recommandez des musiciens
						</h1>
						<p class="text-xl text-gray-600 mb-2">
							pour le projet <strong class="text-[#6B9AD9]">{project.name}</strong>
						</p>
						<p class="text-gray-600">
							Vous connaissez des musiciens talentueux qui pourraient être intéressés par ce projet ?
							Partagez leurs coordonnées ci-dessous !
						</p>
					</div>
				</div>

				<form on:submit|preventDefault={submitRecommendations} class="space-y-8">
					<!-- Informations du recommandeur -->
					<div class="bg-white rounded-lg shadow-lg p-6">
						<h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
							<UserPlus size={20} />
							Vos informations
						</h2>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label for="recommender_name" class="block text-sm font-medium text-gray-700 mb-1">
									Votre nom *
								</label>
								<input
									id="recommender_name"
									type="text"
									bind:value={recommenderInfo.name}
									class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent {errors.recommender_name ? 'border-red-500' : 'border-gray-300'}"
									placeholder="Votre nom complet"
								/>
								{#if errors.recommender_name}
									<p class="text-sm text-red-600 mt-1">{errors.recommender_name}</p>
								{/if}
							</div>

							<div>
								<label for="recommender_email" class="block text-sm font-medium text-gray-700 mb-1">
									Votre email (optionnel)
								</label>
								<input
									id="recommender_email"
									type="email"
									bind:value={recommenderInfo.email}
									class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent {errors.recommender_email ? 'border-red-500' : 'border-gray-300'}"
									placeholder="votre@email.com"
								/>
								{#if errors.recommender_email}
									<p class="text-sm text-red-600 mt-1">{errors.recommender_email}</p>
								{/if}
								<p class="text-xs text-gray-500 mt-1">
									Pour vous recontacter si nécessaire
								</p>
							</div>
						</div>
					</div>

					<!-- Recommandations -->
					<div class="space-y-6">
						<div class="flex items-center justify-between">
							<h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
								<Music size={20} />
								Personnes à recommander
							</h2>

							{#if recommendations.length < 5}
								<button
									type="button"
									on:click={addRecommendation}
									class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
								>
									<Plus size={16} />
									Ajouter une personne
								</button>
							{/if}
						</div>

						{#if errors.general}
							<div class="bg-red-50 border border-red-200 rounded-lg p-4">
								<p class="text-red-800">{errors.general}</p>
							</div>
						{/if}

						{#each recommendations as recommendation, index}
							<div class="bg-white rounded-lg shadow-lg p-6 relative">
								<div class="flex items-center justify-between mb-4">
									<h3 class="text-lg font-semibold text-gray-800">
										Personne {index + 1}
									</h3>

									{#if recommendations.length > 1}
										<button
											type="button"
											on:click={() => removeRecommendation(index)}
											class="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
											title="Supprimer cette recommandation"
										>
											<Trash2 size={16} />
										</button>
									{/if}
								</div>

								<!-- Erreur de contact général -->
								{#if errors[`rec_${index}_contact`]}
									<div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
										<p class="text-sm text-red-800">{errors[`rec_${index}_contact`]}</p>
									</div>
								{/if}

								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<!-- Informations personnelles -->
									<div>
										<label class="block text-sm font-medium text-gray-700 mb-1">
											Prénom *
										</label>
										<input
											type="text"
											bind:value={recommendation.first_name}
											class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent {errors[`rec_${index}_first_name`] ? 'border-red-500' : 'border-gray-300'}"
											placeholder="Prénom"
										/>
										{#if errors[`rec_${index}_first_name`]}
											<p class="text-sm text-red-600 mt-1">{errors[`rec_${index}_first_name`]}</p>
										{/if}
									</div>

									<div>
										<label class="block text-sm font-medium text-gray-700 mb-1">
											Nom *
										</label>
										<input
											type="text"
											bind:value={recommendation.last_name}
											class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent {errors[`rec_${index}_last_name`] ? 'border-red-500' : 'border-gray-300'}"
											placeholder="Nom de famille"
										/>
										{#if errors[`rec_${index}_last_name`]}
											<p class="text-sm text-red-600 mt-1">{errors[`rec_${index}_last_name`]}</p>
										{/if}
									</div>

									<!-- Contact -->
									<div>
										<label class="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
											<Mail size={14} />
											Email
										</label>
										<input
											type="email"
											bind:value={recommendation.email}
											class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent {errors[`rec_${index}_email`] ? 'border-red-500' : 'border-gray-300'}"
											placeholder="email@exemple.com"
										/>
										{#if errors[`rec_${index}_email`]}
											<p class="text-sm text-red-600 mt-1">{errors[`rec_${index}_email`]}</p>
										{/if}
									</div>

									<div>
										<label class="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
											<Phone size={14} />
											Téléphone
										</label>
										<input
											type="tel"
											bind:value={recommendation.phone}
											class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
											placeholder="+33 6 12 34 56 78"
										/>
									</div>

									<div>
										<label class="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
											<MessageCircle size={14} />
											Messenger
										</label>
										<input
											type="text"
											bind:value={recommendation.messenger}
											class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
											placeholder="@username ou lien"
										/>
									</div>

									<div>
										<label class="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
											<Music size={14} />
											Instrument
										</label>
										<input
											type="text"
											bind:value={recommendation.instrument}
											class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
											placeholder="Violon, Piano, Chant..."
										/>
									</div>
								</div>

								<!-- Message de recommandation -->
								<div class="mt-4">
									<label class="block text-sm font-medium text-gray-700 mb-1">
										Pourquoi recommandez-vous cette personne ?
									</label>
									<textarea
										bind:value={recommendation.message}
										rows="3"
										class="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										placeholder="Qualités musicales, expérience, personnalité..."
									></textarea>
								</div>
							</div>
						{/each}
					</div>

					<!-- Bouton de soumission -->
					<div class="text-center">
						<button
							type="submit"
							disabled={submitting}
							class="px-8 py-4 bg-[#6B9AD9] text-white text-lg font-semibold rounded-lg hover:bg-[#5a9bb4] disabled:opacity-50 transition-colors flex items-center gap-2 mx-auto"
						>
							{#if submitting}
								<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
							{/if}
							{submitting ? 'Envoi en cours...' : 'Envoyer les recommandations'}
						</button>

						<p class="text-sm text-gray-500 mt-4">
							En soumettant ce formulaire, vous acceptez que vos recommandations soient transmises à l'équipe du projet.
						</p>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>