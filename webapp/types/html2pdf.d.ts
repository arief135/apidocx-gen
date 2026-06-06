/**
 * html2pdf.js is loaded as a UMD global via a <script> tag in index.html.
 * It is only consumed by util/PdfExporter.ts. Typed minimally on purpose.
 */
declare function html2pdf(): Html2PdfBuilder;
interface Html2PdfBuilder {
	set(opts: object): Html2PdfBuilder;
	from(el: HTMLElement|string): Html2PdfBuilder;
	outputPdf(type: "blob"): Promise<Blob>;
}
