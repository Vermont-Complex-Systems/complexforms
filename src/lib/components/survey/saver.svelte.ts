export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// Shared "Saving… / Saved ✓ / Error ✗" state machine used by every question
// component, so the transient-feedback logic lives in exactly one place. Pass
// the actual save as a thunk so the caller's latest props are read at call time.
export function createSaver() {
	let status = $state<SaveStatus>('idle');
	let message = $state('');

	function reset() {
		status = 'idle';
		message = '';
	}

	async function save(run: () => Promise<unknown>) {
		status = 'saving';
		message = 'Saving...';
		try {
			await run();
			status = 'saved';
			message = 'Saved ✓';
			setTimeout(reset, 2000);
		} catch (error) {
			console.error('Failed to save answer:', error);
			status = 'error';
			message = 'Error ✗';
			setTimeout(reset, 3000);
		}
	}

	return {
		get status() {
			return status;
		},
		get message() {
			return message;
		},
		save
	};
}
