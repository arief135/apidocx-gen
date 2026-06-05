import ComponentContainer from "sap/ui/core/ComponentContainer";

// Entry module referenced by index.html (data-sap-ui-on-init).
// Creates the component container and places it in the page body.
new ComponentContainer({
	id: "container",
	name: "oneflux.apiref",
	settings: { id: "apiref" },
	async: true,
	manifest: true,
	height: "100%"
}).placeAt("content");
