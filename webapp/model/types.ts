/** A single request/response field documented in a parameter table. */
export interface ApiParam {
	field: string;
	type: string;
	required: boolean;
	description: string;
}

/** One documented endpoint. */
export interface ApiEndpoint {
	/** Stable key used for navigation and as a DOM anchor. */
	id: string;
	title: string;
	description: string;
	method: string; // GET | POST | PUT | PATCH | DELETE ...
	path: string; // e.g. /NotifStatus  (relative to baseUrl)
	params: ApiParam[];
	requestBody: string; // JSON example (free text)
	responseStatus: string; // e.g. "200 OK"
	responseNote: string; // e.g. "132 ms · 364 B"
	responseBody: string; // JSON example (free text)
	/** When true, the section is rendered as "documentation pending". */
	placeholder?: boolean;
}

/** The whole document. */
export interface ApiReference {
	productName: string;
	subtitle: string;
	environment: string;
	changeRequest: string;
	version: string;
	baseUrl: string;
	overview: string;
	conventions: string[];
	endpoints: ApiEndpoint[];
}
