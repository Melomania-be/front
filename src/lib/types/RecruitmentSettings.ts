// src/lib/types/RecruitmentSettings.ts
export interface RecruitmentSettings {
	id: number
	project_id: number
	follow_up_days: number
	auto_follow_up_enabled: boolean
	created_at: string
	updated_at: string
}