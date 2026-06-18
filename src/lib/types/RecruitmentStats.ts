// src/lib/types/RecruitmentStats.ts
// src/lib/types/RecruitmentStats.ts
import type { RecruitmentStatus } from '$lib/types/RecruitmentContact';

export interface RecruitmentStats {
	total: number
	by_status: Array<{
		status: RecruitmentStatus
		count: number
	}>
	pending_recommendations: number
}
