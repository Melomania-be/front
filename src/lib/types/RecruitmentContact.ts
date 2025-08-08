import { Contact, Section } from 'lucide-svelte';

// src/lib/types/RecruitmentContact.ts
export type RecruitmentStatus =
	| 'not_yet_contacted'
	| 'awaiting_response'
	| 'to_follow_up'
	| 'not_available'
	| 'pending_validation'
	| 'cancelled'
	| 'recruited'

export type ContactMethod = 'manual' | 'email' | 'messenger' | 'phone'

export interface RecruitmentContact {
	id: number
	project_id: number
	contact_id: number | null
	first_name: string
	last_name: string
	email: string | null
	phone: string | null
	messenger: string | null
	section_id: number | null
	status: RecruitmentStatus
	contact_method: ContactMethod
	contact_date: string | null
	last_follow_up: string | null
	notes: string | null
	recommended_by: string | null
	recommender_contact_id: number | null
	is_duplicate: boolean
	source: string | null
	created_at: string
	updated_at: string

	// Relations
	contact?: Contact
	section?: Section
	recommender?: Contact
}
