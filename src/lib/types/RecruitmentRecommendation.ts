// src/lib/types/RecruitmentRecommendation.ts - Version complète corrigée
export type RecommendationStatus = 'pending' | 'ignored' | 'contact_email' | 'contact_manual';

export interface RecruitmentRecommendation {
	id: number;
	project_id: number;
	recommender_name: string;
	recommender_email: string | null;
	recommended_first_name: string;
	recommended_last_name: string;
	recommended_email: string | null;
	recommended_phone: string | null;
	recommended_messenger: string | null;
	recommended_instrument: string | null;
	recommendation_message: string | null;
	status: RecommendationStatus;
	recruitment_contact_id: number | null;
	created_at: string;
	updated_at: string;

	// ✅ AJOUT : Propriétés calculées optionnelles pour l'affichage
	recommended_display_name?: string;
	formatted_created_at?: string;
	created_at_iso?: string;
	updated_at_iso?: string;

	// Relations
	recruitment_contact?: RecruitmentContact;
	project?: {
		id: number;
		name: string;
	};
}

// ✅ AJOUT : Import du type RecruitmentContact pour la relation
import type { RecruitmentContact } from './RecruitmentContact';
