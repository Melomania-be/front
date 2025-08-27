export function familyToStyle(family: string) {
	const normalized = family.trim().toLowerCase();
	switch (normalized) {
		case 'brass':
			return "text-orange-500 bg-orange-200";
		case 'misc':
			return "text-purple-500 bg-purple-200";
		case 'strings':
			return "text-blue-500 bg-blue-200";
		case 'percussions':
			return "text-green-500 bg-green-200";
		case 'woodwinds':
			return "text-yellow-500 bg-[#fff5aa]";
		case 'keyboards':
			return "text-rose-500 bg-rose-200";
		default:
			return "text-gray-500 bg-gray-200";
	}
}

export function levelToStyle(level: string) {
	const normalized = level.trim().toLowerCase();
	switch (normalized) {
		case 'amateur - low level':
			return "text-red-500 border-red-500";
		case 'amateur - medium':
			return "text-orange-500 border-orange-500";
		case 'amateur - high':
			return "text-yellow-500 border-yellow-500";
		case 'student':
			return "text-green-500 border-green-500";
		case 'professional':
			return "text-blue-500 border-blue-500";
		case 'high level professional':
			return "text-purple-500 border-purple-500";
		default:
			return 'text-gray-500 border-gray-500'
	}
}

export function familyToEmoji(family: string) {
	const normalized = family.trim().toLowerCase();
	switch (normalized) {
		case 'keyboards':
			return '🎹';
		case 'strings':
			return '🎻';
		case 'brass':
			return '🎺';
		case 'percussions':
			return '🥁';
		case 'misc':
			return '🎼';
		case 'woodwinds':
			return '🎷';
		default:
			return '🎶';
	}
}

export function levelSimplificator(level: string) {
	const normalized = level.trim().toLowerCase();
	switch (normalized) {
		case 'amateur - low level':
			return 'Low';
		case 'amateur - medium':
			return 'Medium';
		case 'student':
			return 'Student';
		case 'professional':
			return 'Pro';
		case 'amateur - high':
			return 'High';
		case 'high level professional':
			return 'High Pro';
		default:
			return 'Unknown'
	}
}