// src/lib/types/RecruitmentRecommendation.ts
export type RecommendationStatus = 'pending' | 'ignored' | 'contacted_email' | 'contacted_manual'

export interface RecruitmentRecommendation {
	id: number
	project_id: number
	recommender_name: string
	recommender_email: string | null
	recommended_first_name: string
	recommended_last_name: string
	recommended_email: string | null
	recommended_phone: string | null
	recommended_messenger: string | null
	recommended_instrument: string | null
	recommendation_message: string | null
	status: RecommendationStatus
	recruitment_contact_id: number | null
	created_at: string
	updated_at: string

	// Relations
	recruitment_contact?: RecruitmentContact
}
