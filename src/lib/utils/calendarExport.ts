type CalendarEvent = {
	title: string;
	startDate: string | Date;
	endDate?: string | Date | null;
	location?: string;
	description?: string;
};

function formatDateForIcs(value: string | Date) {
	return new Date(value).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeIcsText(value = '') {
	return value
		.replace(/\\/g, '\\\\')
		.replace(/,/g, '\\,')
		.replace(/;/g, '\\;')
		.replace(/\n/g, '\\n');
}

export function downloadCalendarEvent(event: CalendarEvent) {
	const startDate = formatDateForIcs(event.startDate);
	const endDate = formatDateForIcs(
		buildEventEndDate(event.startDate, event.endDate)
	);

	const content = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Melomania//Calendar Export//EN',
		'BEGIN:VEVENT',
		`UID:${crypto.randomUUID()}@melomania`,
		`DTSTAMP:${formatDateForIcs(new Date())}`,
		`DTSTART:${startDate}`,
		`DTEND:${endDate}`,
		`SUMMARY:${escapeIcsText(event.title)}`,
		`LOCATION:${escapeIcsText(event.location)}`,
		`DESCRIPTION:${escapeIcsText(event.description)}`,
		'END:VEVENT',
		'END:VCALENDAR'
	].join('\r\n');

	const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
	const url = URL.createObjectURL(blob);

	const link = document.createElement('a');
	link.href = url;
	link.download = `${event.title.replace(/\s+/g, '_').toLowerCase()}.ics`;
	link.click();

	URL.revokeObjectURL(url);
}

function buildEventEndDate(
	startValue: string | Date,
	endValue?: string | Date | null
): Date {
	const start = new Date(startValue);

	if (!endValue) {
		return new Date(start.getTime() + 60 * 60 * 1000);
	}

	const originalEnd = new Date(endValue);

	const end = new Date(start);
	end.setUTCHours(
		originalEnd.getUTCHours(),
		originalEnd.getUTCMinutes(),
		originalEnd.getUTCSeconds(),
		originalEnd.getUTCMilliseconds()
	);

	// Handles events that finish after midnight.
	if (end <= start) {
		end.setUTCDate(end.getUTCDate() + 1);
	}

	return end;
}