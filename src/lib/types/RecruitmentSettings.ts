export interface RecruitmentSettings {
	id: number
	project_id: number
	follow_up_days: number
	auto_follow_up_enabled: boolean
	auto_import_enabled?: boolean
	last_auto_import?: string | null
	created_at: string
	updated_at: string
}

export interface RecruitmentSettingsUpdate {
	follow_up_days: number
	auto_follow_up_enabled: boolean
	auto_import_enabled?: boolean
}

export interface RecruitmentSettingsValidation {
	follow_up_days: {
		min: number
		max: number
		type: 'number'
	}
	auto_follow_up_enabled: {
		type: 'boolean'
	}
	auto_import_enabled: {
		type: 'boolean'
	}
}

export const RECRUITMENT_SETTINGS_DEFAULTS: Partial<RecruitmentSettings> = {
	follow_up_days: 7,
	auto_follow_up_enabled: true,
	auto_import_enabled: false
}

export const RECRUITMENT_SETTINGS_VALIDATION: RecruitmentSettingsValidation = {
	follow_up_days: {
		min: 1,
		max: 30,
		type: 'number'
	},
	auto_follow_up_enabled: {
		type: 'boolean'
	},
	auto_import_enabled: {
		type: 'boolean'
	}
}