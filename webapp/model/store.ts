import { ApiReference } from "./types";
import { seedReference } from "./seedData";

const STORAGE_KEY = "oneflux.apiref.document.v1";

function clone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

/** Load the saved document, or a fresh copy of the seed if none/invalid. */
export function loadReference(): ApiReference {
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw) as ApiReference;
			if (parsed && Array.isArray(parsed.endpoints)) {
				return parsed;
			}
		}
	} catch (e) {
		// Ignore corrupt storage and fall back to the seed.
	}
	return clone(seedReference);
}

/** Persist the current document to localStorage. */
export function saveReference(ref: ApiReference): void {
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ref));
	} catch (e) {
		// Storage may be unavailable (private mode / quota) — non-fatal.
	}
}

/** Remove the saved document and return a fresh seed copy. */
export function resetReference(): ApiReference {
	try {
		window.localStorage.removeItem(STORAGE_KEY);
	} catch (e) {
		// non-fatal
	}
	return clone(seedReference);
}
