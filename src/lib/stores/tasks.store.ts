import { writable } from 'svelte/store'
import { TasksService, type Task } from '../services/tasks.service'

function createTasksStore() {
	const { subscribe, set, update } = writable<Task[]>([])

	return {
		subscribe,

		// Charger la liste depuis l'API
		async loadTasks(filters?: { projectId?: number; eventId?: number; sectionId?: number }) {
			try {
				const tasks = await TasksService.fetchTasks(filters)
				set(tasks)
			} catch (error) {
				console.error('Erreur lors du chargement des tâches:', error)
			}
		},

		// Ajouter une nouvelle tâche dans le store et via l'API
		async addTask(taskData: Partial<Task>) {
			try {
				const newTask = await TasksService.createTask(taskData)
				update(tasks => [newTask, ...tasks])
				return newTask
			} catch (error) {
				console.error('Erreur lors de la création:', error)
				throw error
			}
		},

		// Mettre à jour une tâche (ex: changer de statut)
		async updateTask(id: number, taskData: Partial<Task>) {
			try {
				// Mise à jour optimiste (le visuel change instantanément)
				update(tasks => tasks.map(t => (t.id === id ? { ...t, ...taskData } : t)))

				// Confirmation API
				const updatedTask = await TasksService.updateTask(id, taskData)

				// Synchronisation définitive
				update(tasks => tasks.map(t => (t.id === id ? updatedTask : t)))
			} catch (error) {
				console.error('Erreur lors de la mise à jour:', error)
				throw error
			}
		},

		// Supprimer une tâche
		async removeTask(id: number) {
			try {
				await TasksService.deleteTask(id)
				update(tasks => tasks.filter(t => t.id !== id))
			} catch (error) {
				console.error('Erreur lors de la suppression:', error)
				throw error
			}
		}
	}
}

export const tasksStore = createTasksStore()