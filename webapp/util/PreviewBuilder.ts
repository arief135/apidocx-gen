import { ApiReference, ApiEndpoint } from "../model/types";

/** Escape a string for safe insertion into HTML text/attributes. */
function esc(value: string): string {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function methodClass(method: string): string {
	return "afx-method afx-method-" + esc((method || "post").toLowerCase());
}

function paramsTable(ep: ApiEndpoint): string {
	if (!ep.params || ep.params.length === 0) {
		return "";
	}
	const rows = ep.params
		.map(
			(p) =>
				`<tr>` +
				`<td class="afx-code-cell">${esc(p.field)}</td>` +
				`<td>${esc(p.type)}</td>` +
				`<td class="${p.required ? "afx-required" : ""}">${p.required ? "Yes" : "No"}</td>` +
				`<td>${esc(p.description)}</td>` +
				`</tr>`
		)
		.join("");
	return (
		`<div class="afx-label">REQUEST PARAMETERS</div>` +
		`<table class="afx-params"><thead><tr>` +
		`<th>Field</th><th>Type</th><th>Required</th><th>Description</th>` +
		`</tr></thead><tbody>${rows}</tbody></table>`
	);
}

function endpointSection(ep: ApiEndpoint, baseUrl: string): string {
	if (ep.placeholder) {
		return (
			`<section class="afx-endpoint" id="${esc(ep.id)}">` +
			`<h1 class="afx-h1">${esc(ep.title)}</h1>` +
			`<p class="afx-pending">${esc(ep.description)}</p>` +
			`</section>`
		);
	}

	const fullPath = (ep.path || "").startsWith("http") ? ep.path : baseUrl + ep.path;

	const parts: string[] = [];
	parts.push(`<section class="afx-endpoint" id="${esc(ep.id)}">`);
	parts.push(`<h1 class="afx-h1">${esc(ep.title)}</h1>`);
	parts.push(`<p class="afx-desc">${esc(ep.description)}</p>`);

	parts.push(`<div class="afx-label">ENDPOINT</div>`);
	parts.push(
		`<div class="afx-endpoint-bar">` +
			`<span class="${methodClass(ep.method)}">${esc(ep.method)}</span>` +
			`<code class="afx-url">${esc(fullPath)}</code>` +
			`</div>`
	);

	parts.push(paramsTable(ep));

	parts.push(`<div class="afx-label">REQUEST BODY</div>`);
	parts.push(`<pre class="afx-code">${esc(ep.requestBody)}</pre>`);

	parts.push(`<div class="afx-label">RESPONSE</div>`);
	const note = ep.responseNote ? `<span class="afx-resnote">${esc(ep.responseNote)}</span>` : "";
	if (ep.responseStatus) {
		parts.push(`<div class="afx-status-line"><span class="afx-status">${esc(ep.responseStatus)}</span>${note}</div>`);
	}
	parts.push(`<pre class="afx-code">${esc(ep.responseBody)}</pre>`);

	parts.push(`</section>`);
	return parts.join("");
}

/** Build the full preview document HTML for a reference. */
export function buildPreviewHtml(ref: ApiReference): string {
	const out: string[] = [];
	out.push(`<div class="afx-doc">`);

	// Title block
	out.push(`<header class="afx-title">`);
	out.push(`<div class="afx-product">${esc(ref.productName)}</div>`);
	out.push(`<div class="afx-subtitle">${esc(ref.subtitle)}</div>`);
	out.push(`<div class="afx-environment">${esc(ref.environment)}</div>`);
	out.push(
		`<div class="afx-meta">${esc(ref.changeRequest)}${ref.changeRequest && ref.version ? " &nbsp;\u00b7&nbsp; " : ""}${esc(ref.version)}</div>`
	);
	out.push(`</header>`);

	// Overview
	out.push(`<section class="afx-overview" id="overview">`);
	out.push(`<h1 class="afx-h1">Overview</h1>`);
	out.push(`<p class="afx-desc">${esc(ref.overview)}</p>`);

	out.push(`<h2 class="afx-h2">Base URL</h2>`);
	out.push(`<p class="afx-desc">All endpoints share the following base URL in the development environment:</p>`);
	out.push(`<pre class="afx-code">${esc(ref.baseUrl)}</pre>`);

	out.push(`<h2 class="afx-h2">Conventions</h2>`);
	out.push(
		`<ul class="afx-bullets">${ref.conventions.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>`
	);

	// Endpoint summary
	out.push(`<h2 class="afx-h2">Endpoint Summary</h2>`);
	const summaryRows = ref.endpoints
		.filter((e) => !e.placeholder)
		.map(
			(e) =>
				`<tr><td>${esc(e.title)}</td>` +
				`<td class="afx-code-cell"><span class="${methodClass(e.method)} afx-method-sm">${esc(e.method)}</span></td>` +
				`<td class="afx-code-cell">${esc(e.path)}</td></tr>`
		)
		.join("");
	out.push(
		`<table class="afx-summary"><thead><tr><th>Service</th><th>Method</th><th>Path</th></tr></thead>` +
			`<tbody>${summaryRows}</tbody></table>`
	);
	out.push(`</section>`);

	// Endpoints
	ref.endpoints.forEach((ep) => out.push(endpointSection(ep, ref.baseUrl)));

	out.push(`</div>`);
	return out.join("");
}
