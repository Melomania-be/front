<!-- src/lib/components/recruitment/RecommendationCard.svelte - Version complète corrigée -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import { UserPlus, Mail, Phone, MessageCircle, Music, X, Calendar, User } from 'lucide-svelte'
	import type { RecruitmentRecommendation, Section } from '$lib/types'
	import RecommendationActionButton from './RecommendationActionButton.svelte'

	export let recommendation: RecruitmentRecommendation
	export let sections: Section[]

	const dispatch = createEventDispatcher()

	// ✅ FONCTION DE FORMATAGE DE DATE SÉCURISÉE
	function formatDate(dateString: string | null | undefined): string {
		if (!dateString) return 'Date inconnue'

		try {
			// Gérer différents formats de date possibles
			let date: Date

			if (typeof dateString === 'string') {
				// Si c'est une chaîne, essayer de la parser
				date = new Date(dateString)
			} else {
				// Si c'est déjà un objet Date
				date = dateString as any
			}

			// Vérifier si la date est valide
			if (isNaN(date.getTime())) {
				console.warn('Invalid date:', dateString)
				return 'Date invalide'
			}

			return date.toLocaleDateString('fr-FR', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			})
		} catch (error) {
			console.error('Error formatting date:', error, 'for date:', dateString)
			return 'Date invalide'
		}
	}

	function handleAction(action: string, sectionId?: number, notes?: string) {
		console.log('🎯 Handling recommendation action:', action, 'for recommendation:', recommendation?.id)
		dispatch('handle', {
			action,
			sectionId,
			notes
		})
	}

	// ✅ PROTECTION CONTRE LES VALEURS UNDEFINED/NULL
	$: safeRecommendation = {
		id: recommendation?.id || 0,
		recommended_first_name: recommendation?.recommended_first_name || 'Prénom',
		recommended_last_name: recommendation?.recommended_last_name || 'Nom',
		recommender_name: recommendation?.recommender_name || 'Anonyme',
		recommender_email: recommendation?.recommender_email || null,
		recommended_email: recommendation?.recommended_email || null,
		recommended_phone: recommendation?.recommended_phone || null,
		recommended_messenger: recommendation?.recommended_messenger || null,
		recommended_instrument: recommendation?.recommended_instrument || null,
		recommendation_message: recommendation?.recommendation_message || null,
		created_at: recommendation?.created_at || recommendation?.createdAt || null,
		status: recommendation?.status || 'pending'
	}

	// ✅ VARIABLES CALCULÉES SÉCURISÉES
	$: displayName = `${safeRecommendation.recommended_first_name} ${safeRecommendation.recommended_last_name}`.trim()
	$: recommenderName = safeRecommendation.recommender_name || 'Recommandeur anonyme'
	$: hasContactInfo = !!(safeRecommendation.recommended_email || safeRecommendation.recommended_phone || safeRecommendation.recommended_messenger)
	$: canContactByEmail = !!(safeRecommendation.recommended_email && safeRecommendation.recommended_email.includes('@'))

	// ✅ FONCTION UTILITAIRE : Obtenir les initiales pour l'avatar
	function getInitials(firstName: string, lastName: string): string {
		const first = firstName?.charAt(0)?.toUpperCase() || 'P'
		const last = lastName?.charAt(0)?.toUpperCase() || 'N'
		return `${first}${last}`
	}

	// ✅ FONCTION UTILITAIRE : Obtenir la couleur de l'avatar basée sur le nom
	function getAvatarColor(name: string): string {
		const colors = [
			'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500',
			'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
		]
		const index = name.length % colors.length
		return colors[index]
	}

	$: initials = getInitials(safeRecommendation.recommended_first_name, safeRecommendation.recommended_last_name)
	$: avatarColor = getAvatarColor(displayName)
</script>

<div class="border border-yellow-200 bg-yellow-50 rounded-lg p-6 transition-all duration-200 hover:shadow-md">
	<div class="flex flex-col space-y-4">

		<!-- ✅ EN-TÊTE AMÉLIORÉ avec avatar -->
		<div class="flex items-start justify-between">
			<div class="flex items-start gap-4 flex-1">
				<!-- Avatar avec initiales -->
				<div class="w-12 h-12 rounded-full {avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-md">
					{initials}
				</div>

				<div class="flex-1">
					<h4 class="font-semibold text-lg text-gray-800 mb-1">
						{displayName}
					</h4>

					<div class="flex items-center gap-2 text-sm text-gray-600 mb-2">
						<User size={14} class="text-gray-400" />
						<span>Recommandé par <strong>{recommenderName}</strong></span>
					</div>

					{#if safeRecommendation.recommender_email}
						<div class="flex items-center gap-2 text-sm text-gray-500">
							<Mail size={12} class="text-gray-400" />
							<a href="mailto:{safeRecommendation.recommender_email}"
								 class="text-blue-600 hover:underline transition-colors">
								{safeRecommendation.recommender_email}
							</a>
						</div>
					{/if}

					<div class="flex items-center gap-2 text-xs text-gray-500 mt-2">
						<Calendar size={12} class="text-gray-400" />
						<span>{formatDate(safeRecommendation.created_at)}</span>
					</div>
				</div>
			</div>

			<!-- Badge de statut -->
			<div class="text-right">
				<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
					<span class="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
					Nouveau
				</span>
			</div>
		</div>

		<!-- ✅ INFORMATIONS DE CONTACT AMÉLIORÉES -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div>
				<h5 class="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
					<Phone size={14} class="text-gray-500" />
					Informations de contact
				</h5>

				{#if hasContactInfo}
					<div class="space-y-2 text-sm">
						{#if safeRecommendation.recommended_email}
							<div class="flex items-center gap-3 p-2 bg-white rounded-md border border-gray-200">
								<Mail size={14} class="text-blue-500 flex-shrink-0" />
								<a href="mailto:{safeRecommendation.recommended_email}"
									 class="text-blue-600 hover:underline transition-colors flex-1 truncate">
									{safeRecommendation.recommended_email}
								</a>
							</div>
						{/if}

						{#if safeRecommendation.recommended_phone}
							<div class="flex items-center gap-3 p-2 bg-white rounded-md border border-gray-200">
								<Phone size={14} class="text-green-500 flex-shrink-0" />
								<a href="tel:{safeRecommendation.recommended_phone}"
									 class="text-green-600 hover:underline transition-colors flex-1">
									{safeRecommendation.recommended_phone}
								</a>
							</div>
						{/if}

						{#if safeRecommendation.recommended_messenger}
							<div class="flex items-center gap-3 p-2 bg-white rounded-md border border-gray-200">
								<MessageCircle size={14} class="text-purple-500 flex-shrink-0" />
								<span class="text-gray-700 flex-1 truncate">
									{safeRecommendation.recommended_messenger}
								</span>
							</div>
						{/if}

						{#if safeRecommendation.recommended_instrument}
							<div class="flex items-center gap-3 p-2 bg-white rounded-md border border-gray-200">
								<Music size={14} class="text-orange-500 flex-shrink-0" />
								<span class="text-gray-700 flex-1">
									{safeRecommendation.recommended_instrument}
								</span>
							</div>
						{/if}
					</div>
				{:else}
					<div class="p-3 bg-gray-100 rounded-md border-2 border-dashed border-gray-300">
						<div class="flex items-center gap-2 text-sm text-gray-500">
							<X size={14} class="text-gray-400" />
							<span class="italic">Aucun moyen de contact fourni</span>
						</div>
					</div>
				{/if}
			</div>

			<!-- ✅ MESSAGE DE RECOMMANDATION -->
			{#if safeRecommendation.recommendation_message}
				<div>
					<h5 class="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
						<MessageCircle size={14} class="text-gray-500" />
						Message de recommandation
					</h5>
					<div class="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
						<p class="text-sm text-gray-700 leading-relaxed italic">
							"{safeRecommendation.recommendation_message}"
						</p>
					</div>
				</div>
			{:else}
				<div>
					<h5 class="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
						<MessageCircle size={14} class="text-gray-500" />
						Message de recommandation
					</h5>
					<div class="p-3 bg-gray-100 rounded-md border-2 border-dashed border-gray-300">
						<p class="text-sm text-gray-500 italic">
							Aucun message de recommandation fourni
						</p>
					</div>
				</div>
			{/if}
		</div>

		<!-- ✅ ACTIONS AMÉLIORÉES -->
		<div class="border-t border-yellow-200 pt-4 mt-4">
			<div class="flex flex-wrap gap-3">
				<!-- Bouton Ignorer -->
				<button
					on:click={() => handleAction('ignore')}
					class="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
				>
					<X size={14} />
					<span>Ignorer</span>
				</button>

				<!-- Contacter par email (si email disponible) -->
				{#if canContactByEmail}
					<RecommendationActionButton
						recommendation={recommendation}
						{sections}
						action="contact_email"
						label="Contacter par email"
						icon={Mail}
						className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
						on:handle={(e) => handleAction(e.detail.action, e.detail.sectionId, e.detail.notes)}
					/>
				{:else}
					<div class="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
							 title="Aucune adresse email fournie">
						<Mail size={14} />
						<span>Email non disponible</span>
					</div>
				{/if}

				<!-- Contacter manuellement -->
				<RecommendationActionButton
					recommendation={recommendation}
					{sections}
					action="contact_manual"
					label="Contacter manuellement"
					icon={UserPlus}
					className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
					on:handle={(e) => handleAction(e.detail.action, e.detail.sectionId, e.detail.notes)}
				/>
			</div>

			<!-- ✅ RÉSUMÉ DES ACTIONS POSSIBLES -->
			<div class="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
				<p class="text-xs text-blue-700 leading-relaxed">
					💡 <strong>Actions disponibles :</strong>
					Ignorez si la personne ne convient pas, contactez par email pour un processus automatisé,
					ou ajoutez-la manuellement pour un contact personnalisé.
				</p>
			</div>
		</div>
	</div>
</div>

<style>
    /* Animations pour les transitions */
    .transition-all {
        transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Amélioration du hover pour les liens */
    a:hover {
        text-decoration-line: underline;
        text-decoration-style: solid;
        text-decoration-thickness: 2px;
        text-underline-offset: 2px;
    }

    /* Style pour les badges avec animation */
    .animate-pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
        0%, 100% {
            opacity: 1;
        }
        50% {
            opacity: .5;
        }
    }
</style>