type PushPermissionStatus = {
	receive: 'granted' | 'denied' | 'prompt' | string;
};

type PushRegistrationToken = {
	value: string;
	token?: string;
};

type PushNotificationAction = {
	notification?: {
		data?: Record<string, any>;
	};
};

type PushNotificationsPlugin = {
	checkPermissions?: () => Promise<PushPermissionStatus>;
	requestPermissions: () => Promise<PushPermissionStatus>;
	register: () => Promise<void>;
	addListener: (
		eventName: 'registration' | 'registrationError' | 'pushNotificationActionPerformed',
		listener: (payload: any) => void
	) => Promise<any> | any;
};

type CapacitorGlobal = {
	isNativePlatform?: () => boolean;
	getPlatform?: () => string;
	Plugins?: {
		PushNotifications?: PushNotificationsPlugin;
	};
};

declare global {
	interface Window {
		Capacitor?: CapacitorGlobal;
		__melomaniaPushInitialized?: boolean;
	}
}

async function registerDeviceToken(token: string, platform: string) {
	const response = await fetch('/api/notifications/register-device', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			token,
			platform,
			provider: 'fcm',
			device_label: navigator.userAgent,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text().catch(() => '');
		throw new Error(errorText || `Unable to register push token (status ${response.status})`);
	}
}

function extractPushToken(payload: PushRegistrationToken | string | null | undefined) {
	if (!payload) return null;
	if (typeof payload === 'string') return payload.trim() || null;

	const value = payload.value || payload.token || '';
	return value.trim() || null;
}

function handleNotificationNavigation(action: PushNotificationAction) {
	const data = action.notification?.data || {};

	if (data.project_id) {
		window.location.href = `/projects/${data.project_id}/management`;
		return;
	}

	if (data.piece_id) {
		window.location.href = '/library/pieces';
	}
}

export async function initMobilePushNotifications() {
	if (typeof window === 'undefined') return;
	if (window.__melomaniaPushInitialized) return;

	const capacitor = window.Capacitor;
	const pushNotifications = capacitor?.Plugins?.PushNotifications;

	if (!capacitor?.isNativePlatform?.() || !pushNotifications) {
		return;
	}

	window.__melomaniaPushInitialized = true;

	console.info('Initializing mobile push notifications on platform:', capacitor.getPlatform?.() || 'unknown');

	pushNotifications.addListener('registration', async (token: PushRegistrationToken | string) => {
		try {
			const tokenValue = extractPushToken(token);
			console.info('Push registration payload received:', token);

			if (!tokenValue) {
				console.error('Push registration payload did not contain a usable token.');
				return;
			}

			console.info('Registering push token with backend.');
			await registerDeviceToken(tokenValue, capacitor.getPlatform?.() || 'android');
			console.info('Push token successfully registered with backend.');
		} catch (error) {
			console.error('Error registering push token:', error);
		}
	});

	pushNotifications.addListener('registrationError', (error: unknown) => {
		console.error('Push registration error:', error);
	});

	pushNotifications.addListener(
		'pushNotificationActionPerformed',
		(action: PushNotificationAction) => {
			handleNotificationNavigation(action);
		}
	);

	try {
		const currentPermissions =
			(await pushNotifications.checkPermissions?.()) || ({ receive: 'prompt' } as PushPermissionStatus);
		console.info('Current push permission state:', currentPermissions.receive);

		const permissionStatus =
			currentPermissions.receive === 'prompt'
				? await pushNotifications.requestPermissions()
				: currentPermissions;
		console.info('Resolved push permission state:', permissionStatus.receive);

		if (permissionStatus.receive !== 'granted') {
			console.warn('Push permission was not granted.');
			return;
		}

		console.info('Requesting native push registration.');
		await pushNotifications.register();
	} catch (error) {
		console.error('Error initializing push notifications:', error);
	}
}
