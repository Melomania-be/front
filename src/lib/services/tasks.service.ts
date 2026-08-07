export interface Task {
	id: number
	title: string
	description: string | null
	status: 'todo' | 'in_progress' | 'done'
	priority: 'low' | 'medium' | 'high'
	taskType: 'logistic' | 'musical' | 'administrative' | 'communication'
	visibility: 'private' | 'section' | 'all'
	dueDate: string | null
	isRecurring: boolean
	recurrenceRule: string | null
	projectId?: number
	eventId?: number
	pieceId?: number
	sectionId?: number
	assigneeId?: number
	createdBy: number
	createdAt: string
	updatedAt: string

	assignee?: any
	creator?: any
	section?: any
	piece?: any
}

const API_URL = '/api/tasks';

export const TasksService = {

	async fetchTasks(filters?: { projectId?: number; eventId?: number; sectionId?: number }): Promise<Task[]> {
		const queryParams = new URLSearchParams()
		if (filters?.projectId) queryParams.append('projectId', filters.projectId.toString())
		if (filters?.eventId) queryParams.append('eventId', filters.eventId.toString())
		if (filters?.sectionId) queryParams.append('sectionId', filters.sectionId.toString())

		const url = `${API_URL}?${queryParams.toString()}`

		const response = await fetch(url, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include' // <-- Laisse passer l'authentification
		})

		if (!response.ok) throw new Error('Failed to fetch tasks')
		return await response.json()
	},

	async createTask(taskData: Partial<Task>): Promise<Task> {
		const response = await fetch(API_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include', // <-- Laisse passer l'authentification
			body: JSON.stringify(taskData)
		})

		if (!response.ok) throw new Error('Failed to create task')
		return await response.json()
	},

	async updateTask(id: number, taskData: Partial<Task>): Promise<Task> {
		const response = await fetch(`${API_URL}/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include', // <-- Laisse passer l'authentification
			body: JSON.stringify(taskData)
		})

		if (!response.ok) throw new Error('Failed to update task')
		return await response.json()
	},

	async deleteTask(id: number): Promise<void> {
		const response = await fetch(`${API_URL}/${id}`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include' //
		})

		if (!response.ok) throw new Error('Failed to delete task')
	}
}