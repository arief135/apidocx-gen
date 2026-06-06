import Controller from "sap/ui/core/mvc/Controller";
import JSONModel from "sap/ui/model/json/JSONModel";
import UI5Event from "sap/ui/base/Event";
import ManagedObject from "sap/ui/base/ManagedObject";
import MessageToast from "sap/m/MessageToast";
import MessageBox from "sap/m/MessageBox";
import Dialog from "sap/m/Dialog";
import HTML from "sap/ui/core/HTML";
import NavigationList from "sap/tnt/NavigationList";
import NavigationListItem from "sap/tnt/NavigationListItem";
import { ApiReference, ApiEndpoint } from "../model/types";
import { saveReference, resetReference } from "../model/store";
import { buildPreviewHtml } from "../util/PreviewBuilder";
import { buildDocxBlob } from "../util/DocxExporter";
import { buildPdfBlob, printAsPdf } from "../util/PdfExporter";

/**
 * @namespace id.apnv.apps.apidocxgen.controller
 */
export default class App extends Controller {
    private _endpointDialog?: Dialog;
    private _docInfoDialog?: Dialog;

    public onInit(): void {
        // bind component model to view
        this.getView()!.setModel(this.getOwnerComponent()!.getModel());
        this.getView()!.setModel(this.getOwnerComponent()!.getModel("ui"), "ui");

        const model = this._data();
        // Re-render and persist whenever a two-way binding writes to the model.
        model.attachPropertyChange(this._onModelChange, this);
        this._rebuildNav();
        this._render();
    }

    /* ---------- helpers ---------- */

    private _data(): JSONModel {
        return this.getView()!.getModel() as JSONModel;
    }

    private _ui(): JSONModel {
        return this.getView()!.getModel("ui") as JSONModel;
    }

    private _ref(): ApiReference {
        return this._data().getData() as ApiReference;
    }

    private _onModelChange(): void {
        this._render();
        this._persist();
    }

    private _persist(): void {
        saveReference(this._ref());
    }

    private _render(): void {
        const html = this.byId("preview") as HTML;
        html.setContent(buildPreviewHtml(this._ref()));
    }

    private _rebuildNav(): void {
        const navList = this.byId("navList") as NavigationList;
        navList.destroyItems();
        navList.addItem(
            new NavigationListItem({ text: "Overview", key: "overview", icon: "sap-icon://document-text" })
        );
        this._ref().endpoints.forEach((ep: ApiEndpoint) => {
            navList.addItem(
                new NavigationListItem({
                    text: ep.title || "(untitled)",
                    key: ep.id,
                    icon: ep.placeholder ? "sap-icon://pending" : "sap-icon://chain-link"
                })
            );
        });
    }

    private _scrollTo(key: string): void {
        const html = this.byId("preview") as HTML;
        const dom = html.getDomRef() as HTMLElement | null;
        const target = dom ? (dom.querySelector("#" + CSS.escape(key)) as HTMLElement | null) : null;
        if (target && typeof target.scrollIntoView === "function") {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    private _indexOfKey(key: string): number {
        return this._ref().endpoints.findIndex((e) => e.id === key);
    }

    private _newId(base: string): string {
        const ids = new Set(this._ref().endpoints.map((e) => e.id));
        let candidate = base;
        let n = 1;
        while (ids.has(candidate)) {
            candidate = base + "-" + n++;
        }
        return candidate;
    }

    /* ---------- navigation ---------- */

    public onNavSelect(oEvent: UI5Event): void {
        const item = oEvent.getParameter("item" as never) as NavigationListItem;
        const key = item.getKey();
        this._ui().setProperty("/selectedKey", key);
        this._scrollTo(key);
    }

    /* ---------- edit mode ---------- */

    public onToggleEdit(): void {
        // Switch already bound to ui>/editMode; nothing else required.
    }

    /* ---------- endpoint editing ---------- */

    public async onAddEndpoint(): Promise<void> {
        const ref = this._ref();
        const id = this._newId("endpoint");
        const fresh: ApiEndpoint = {
            id,
            title: "New Endpoint",
            description: "",
            method: "POST",
            path: "/NewEndpoint",
            params: [],
            requestBody: "{\n\n}",
            responseStatus: "200 OK",
            responseBody: "{\n\n}"
        };
        // Insert before any trailing placeholder sections.
        let insertAt = ref.endpoints.length;
        while (insertAt > 0 && ref.endpoints[insertAt - 1].placeholder) {
            insertAt--;
        }
        ref.endpoints.splice(insertAt, 0, fresh);
        this._data().refresh(true);
        this._rebuildNav();
        this._render();
        this._persist();
        this._ui().setProperty("/selectedKey", id);
        await this._openEndpointDialog(id);
    }

    public async onEditSelected(): Promise<void> {
        const key = this._ui().getProperty("/selectedKey") as string;
        if (key === "overview") {
            await this.onEditDocInfo();
            return;
        }
        if (this._indexOfKey(key) < 0) {
            MessageToast.show("Select an endpoint in the navigation first.");
            return;
        }
        await this._openEndpointDialog(key);
    }

    private async _openEndpointDialog(key: string): Promise<void> {
        const idx = this._indexOfKey(key);
        if (idx < 0) {
            return;
        }
        if (!this._endpointDialog) {
            this._endpointDialog = (await this.loadFragment({ name: "id.apnv.apps.apidocxgen.view.EditEndpoint" })) as Dialog;
            this.getView()!.addDependent(this._endpointDialog);
        }
        this._endpointDialog.bindElement("/endpoints/" + idx);
        this._endpointDialog.open();
    }

    public onCloseEndpointDialog(): void {
        this._endpointDialog?.close();
        this._rebuildNav();
        this._render();
        this._persist();
    }

    public onDeleteEndpoint(): void {
        const ctx = this._endpointDialog?.getBindingContext();
        if (!ctx) {
            return;
        }
        const path = ctx.getPath(); // /endpoints/N
        const idx = parseInt(path.split("/").pop() as string, 10);
        const title = this._ref().endpoints[idx]?.title ?? "this endpoint";
        MessageBox.confirm("Delete \u201c" + title + "\u201d?", {
            onClose: (action: string | null) => {
                if (action === MessageBox.Action.OK) {
                    this._ref().endpoints.splice(idx, 1);
                    this._data().refresh(true);
                    this._endpointDialog?.close();
                    this._ui().setProperty("/selectedKey", "overview");
                    this._rebuildNav();
                    this._render();
                    this._persist();
                }
            }
        });
    }

    public onAddParam(): void {
        const ctx = this._endpointDialog?.getBindingContext();
        if (!ctx) {
            return;
        }
        const ep = ctx.getObject() as ApiEndpoint;
        ep.params.push({ field: "", type: "string", required: false, description: "" });
        this._data().refresh(true);
        this._render();
        this._persist();
    }

    public onImportXsd(): void {
        const ctx = this._endpointDialog?.getBindingContext();
        if (!ctx) {
            return;
        }
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".xsd,.xml";
        input.addEventListener("change", () => {
            const file = input.files && input.files[0];
            if (!file) {
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const text = String(reader.result);
                    const doc = new DOMParser().parseFromString(text, "application/xml");
                    const parseError = doc.getElementsByTagName("parsererror")[0];
                    if (parseError) {
                        MessageBox.error("Failed to parse XSD file:\n\n" + (parseError.textContent ?? "Unknown parse error."));
                        return;
                    }
                    const NS = "http://www.w3.org/2001/XMLSchema";
                    const schemaEl = doc.getElementsByTagNameNS(NS, "schema")[0];
                    const allElements = Array.from(doc.getElementsByTagNameNS(NS, "element"));
                    // Skip direct children of xs:schema (root type declarations, not params)
                    const paramElements = allElements.filter((el) => el.parentElement !== schemaEl);
                    if (paramElements.length === 0) {
                        MessageBox.error("No xs:element descendants found in the XSD file.");
                        return;
                    }
                    const params = paramElements.map((el) => {
                        // Strip namespace prefix from type attribute (e.g. xs:string → string)
                        const rawType = el.getAttribute("type") ?? "";
                        const type = rawType.includes(":") ? rawType.split(":").pop()! : (rawType || "string");
                        // minOccurs absent defaults to "1" (required); "0" means optional
                        const minOccurs = el.getAttribute("minOccurs");
                        const required = minOccurs === null || minOccurs !== "0";
                        // Extract xs:annotation/xs:documentation text if present
                        let description = "";
                        const annotationEl = Array.from(el.childNodes).find(
                            (n): n is Element => (n as Element).localName === "annotation"
                        ) as Element | undefined;
                        if (annotationEl) {
                            const docEl = Array.from(annotationEl.childNodes).find(
                                (n): n is Element => (n as Element).localName === "documentation"
                            ) as Element | undefined;
                            if (docEl) {
                                description = (docEl.textContent ?? "").trim();
                            }
                        }
                        return {
                            field: el.getAttribute("name") ?? "",
                            type,
                            required,
                            description
                        };
                    });
                    const ep = ctx.getObject() as ApiEndpoint;
                    ep.params = params;
                    this._data().refresh(true);
                    this._render();
                    this._persist();
                    MessageToast.show("Imported " + params.length + " parameter(s) from XSD.");
                } catch (e) {
                    MessageBox.error("Import failed: " + String(e));
                }
            };
            reader.readAsText(file);
        });
        input.click();
    }

    public onDeleteParam(oEvent: UI5Event): void {
        const src = oEvent.getSource() as unknown as ManagedObject;
        const ctx = src.getBindingContext();
        if (!ctx) {
            return;
        }
        const path = ctx.getPath(); // /endpoints/N/params/M
        const parts = path.split("/");
        const paramIdx = parseInt(parts.pop() as string, 10);
        parts.pop(); // remove "params"
        const epIdx = parseInt(parts.pop() as string, 10);
        this._ref().endpoints[epIdx].params.splice(paramIdx, 1);
        this._data().refresh(true);
        this._render();
        this._persist();
    }

    /* ---------- document info ---------- */

    public async onEditDocInfo(): Promise<void> {
        if (!this._docInfoDialog) {
            this._docInfoDialog = (await this.loadFragment({ name: "id.apnv.apps.apidocxgen.view.EditDocInfo" })) as Dialog;
            this.getView()!.addDependent(this._docInfoDialog);
        }
        // Mirror the conventions array into the multi-line text area.
        const ta = this.byId("conventionsArea") as unknown as { setValue(v: string): void } | undefined;
        ta?.setValue(this._ref().conventions.join("\n"));
        this._docInfoDialog.open();
    }

    public onCloseDocInfoDialog(): void {
        const ta = this.byId("conventionsArea") as unknown as { getValue(): string } | undefined;
        if (ta && typeof ta.getValue === "function") {
            const lines = ta
                .getValue()
                .split("\n")
                .map((l) => l.trim())
                .filter((l) => l.length > 0);
            this._ref().conventions = lines;
            this._data().refresh(true);
        }
        this._docInfoDialog?.close();
        this._rebuildNav();
        this._render();
        this._persist();
    }

    /* ---------- exports ---------- */

    public async onExportDocx(): Promise<void> {
        try {
            MessageToast.show("Generating DOCX\u2026");
            const blob = await buildDocxBlob(this._ref());
            const safe = (this._ref().productName || "API_Reference").replace(/[^A-Za-z0-9]+/g, "_");
            this._download(blob, safe + "_API_Reference.docx");
        } catch (e) {
            MessageBox.error("Could not generate the DOCX file.\n\n" + String(e));
        }
    }

    public onExportPdf(): void {
        try {
            printAsPdf(this._ref());
        } catch (e) {
            MessageBox.error("Could not generate the PDF file.\n\n" + String(e));
        }
    }

    public onExportJson(): void {
        const blob = new Blob([JSON.stringify(this._ref(), null, 2)], { type: "application/json" });
        this._download(blob, "api-reference.json");
    }

    public onImportJson(): void {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json,.json";
        input.addEventListener("change", () => {
            const file = input.files && input.files[0];
            if (!file) {
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const parsed = JSON.parse(String(reader.result)) as ApiReference;
                    if (!parsed || !Array.isArray(parsed.endpoints)) {
                        throw new Error("Not a valid API reference document.");
                    }
                    this._data().setData(parsed);
                    this._rebuildNav();
                    this._render();
                    this._persist();
                    MessageToast.show("Imported.");
                } catch (e) {
                    MessageBox.error("Import failed: " + String(e));
                }
            };
            reader.readAsText(file);
        });
        input.click();
    }

    public onReset(): void {
        MessageBox.confirm("Reset to the original Sample reference? Your changes will be lost.", {
            onClose: (action: string | null) => {
                if (action === MessageBox.Action.OK) {
                    this._data().setData(resetReference());
                    this._ui().setProperty("/selectedKey", "overview");
                    this._rebuildNav();
                    this._render();
                }
            }
        });
    }

    public onPrint(): void {
        this.onExportPdf();
    }

    private _download(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}
