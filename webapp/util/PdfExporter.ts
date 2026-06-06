import { ApiReference } from "../model/types";
import { buildPreviewHtml } from "./PreviewBuilder";

function extractAfxStyles(): string {
    const rules: string[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
        try {
            for (const rule of Array.from(sheet.cssRules)) {
                const text = rule.cssText;
                if (text.includes("afx") || text.includes(":root")) {
                    rules.push(text);
                }
            }
        } catch (_) {
            // Skip cross-origin sheets (e.g. CDN-loaded UI5 styles)
        }
    }
    return rules.join("\n");
}

export async function buildPdfBlob(ref: ApiReference): Promise<Blob> {
    const styles = extractAfxStyles();
    // Pass an HTML string so html2pdf.js creates its own properly-positioned
    // container internally — html2canvas can then capture it without issue.
    const htmlString =
        `<style>body{margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;}${styles}</style>` +
        `<div style="background:#eef1f4;padding:24px 0 64px 0;">` +
        buildPreviewHtml(ref) +
        `</div>`;

    return html2pdf()
        .set({
            margin: 10,
            filename: "export.pdf",
            // image: { type: "jpeg", quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
        })
        .from(htmlString)
        .outputPdf("blob");
}

export function printAsPdf(ref: ApiReference): void {
    const win = window.open("", "_blank", "width=960,height=800");
    if (!win) {
        throw new Error("Pop-up was blocked. Please allow pop-ups for this page and try again.");
    }
    const styles = extractAfxStyles();
    win.document.write(
        `<!DOCTYPE html><html><head><meta charset="utf-8">` +
        `<style>body{margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;}${styles}</style>` +
        `</head><body>` +
        `<div style="background:#eef1f4;padding:24px 0 64px 0;">` +
        buildPreviewHtml(ref) +
        `</div></body></html>`
    );
    win.document.close();
    win.focus();
    // Give the browser one frame to finish layout before printing.
    setTimeout(() => { win.print(); win.close(); }, 400);
}