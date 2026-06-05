import UIComponent from "sap/ui/core/UIComponent";
import JSONModel from "sap/ui/model/json/JSONModel";
import { loadReference } from "./model/store";

/**
 * @namespace oneflux.apiref
 */
export default class Component extends UIComponent {
	public static metadata = {
		manifest: "json",
		interfaces: ["sap.ui.core.IAsyncContentCreation"]
	};

	public init(): void {
		super.init();

		// Main data model: the API reference document (seeded or restored).
		const model = new JSONModel(loadReference());
		model.setSizeLimit(1000);
		this.setModel(model);

		// UI state model (edit mode, current selection key).
		const ui = new JSONModel({ editMode: false, selectedKey: "overview" });
		this.setModel(ui, "ui");

		this.getRouter()?.initialize?.();
	}
}
