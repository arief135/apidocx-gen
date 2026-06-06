import { ApiReference, ApiEndpoint, ApiParam } from "../model/types";

/* The `docx` library is loaded as a UMD global in index.html (see types/docx.d.ts). */

const NAVY = "1F3864";
const BLUE = "2E75B6";
const CODEFILL = "F4F6F8";
const POSTGREEN = "2E7D32";
const GREY = "595959";
const BORDER = "CCCCCC";
const HEADERFILL = "1F3864";

const CONTENT_W = 9360; // US Letter, 1" margins (DXA)

export async function buildDocxBlob(ref: ApiReference): Promise<Blob> {
	const {
		Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
		Header, Footer, AlignmentType, LevelFormat, TabStopType,
		TableOfContents, HeadingLevel, BorderStyle, WidthType, ShadingType,
		VerticalAlign, PageNumber, PageBreak
	} = docx;

	const singleBorder = { style: BorderStyle.SINGLE, size: 1, color: BORDER };
	const cellBorders = { top: singleBorder, bottom: singleBorder, left: singleBorder, right: singleBorder };

	const h1 = (text: string) =>
		new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
	const h2 = (text: string) =>
		new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });

	const body = (text: string, opts: any = {}) =>
		new Paragraph({ spacing: { after: 120, line: 276 }, children: [new TextRun({ text, ...opts })] });

	const label = (text: string) =>
		new Paragraph({
			spacing: { before: 120, after: 40 },
			children: [new TextRun({ text, bold: true, font: "Arial", size: 20, color: GREY })]
		});

	const endpointLine = (method: string, path: string) =>
		new Table({
			width: { size: CONTENT_W, type: WidthType.DXA },
			columnWidths: [900, CONTENT_W - 900],
			rows: [
				new TableRow({
					children: [
						new TableCell({
							width: { size: 900, type: WidthType.DXA },
							shading: { fill: POSTGREEN, type: ShadingType.CLEAR },
							margins: { top: 60, bottom: 60, left: 100, right: 100 },
							verticalAlign: VerticalAlign.CENTER,
							children: [
								new Paragraph({
									alignment: AlignmentType.CENTER,
									children: [new TextRun({ text: method, bold: true, color: "FFFFFF", font: "Arial", size: 20 })]
								})
							]
						}),
						new TableCell({
							width: { size: CONTENT_W - 900, type: WidthType.DXA },
							shading: { fill: CODEFILL, type: ShadingType.CLEAR },
							margins: { top: 60, bottom: 60, left: 140, right: 100 },
							verticalAlign: VerticalAlign.CENTER,
							children: [
								new Paragraph({ children: [new TextRun({ text: path, font: "Consolas", size: 19, color: "24292E" })] })
							]
						})
					]
				})
			]
		});

	const codeBlock = (text: string) => {
		const lines = (text || "").split("\n");
		const border = { style: BorderStyle.SINGLE, size: 4, color: BORDER };
		return new Table({
			width: { size: CONTENT_W, type: WidthType.DXA },
			columnWidths: [CONTENT_W],
			rows: [
				new TableRow({
					children: [
						new TableCell({
							width: { size: CONTENT_W, type: WidthType.DXA },
							borders: { top: border, bottom: border, left: border, right: border },
							shading: { fill: CODEFILL, type: ShadingType.CLEAR },
							margins: { top: 120, bottom: 120, left: 160, right: 120 },
							children: lines.map(
								(l: string) =>
									new Paragraph({
										spacing: { after: 0, line: 250 },
										children: [new TextRun({ text: l.length ? l : " ", font: "Consolas", size: 18, color: "24292E" })]
									})
							)
						})
					]
				})
			]
		});
	};

	const paramTable = (params: ApiParam[]) => {
		const widths = [2200, 1300, 1100, CONTENT_W - 2200 - 1300 - 1100];
		const headerCells = ["Field", "Type", "Required", "Description"].map(
			(t, i) =>
				new TableCell({
					width: { size: widths[i], type: WidthType.DXA },
					borders: cellBorders,
					shading: { fill: HEADERFILL, type: ShadingType.CLEAR },
					margins: { top: 80, bottom: 80, left: 120, right: 120 },
					verticalAlign: VerticalAlign.CENTER,
					children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: "FFFFFF", font: "Arial", size: 19 })] })]
				})
		);
		const dataRows = params.map(
			(p, idx) =>
				new TableRow({
					children: [
						[p.field, "Consolas", 18, true, "1B4F72"],
						[p.type, "Arial", 19, false, "24292E"],
						[p.required ? "Yes" : "No", "Arial", 19, false, p.required ? "C0392B" : "24292E"],
						[p.description, "Arial", 19, false, "24292E"]
					].map(
						(c: any, i: number) =>
							new TableCell({
								width: { size: widths[i], type: WidthType.DXA },
								borders: cellBorders,
								shading: { fill: idx % 2 ? "F7F9FB" : "FFFFFF", type: ShadingType.CLEAR },
								margins: { top: 70, bottom: 70, left: 120, right: 120 },
								verticalAlign: VerticalAlign.CENTER,
								children: [
									new Paragraph({
										children: [new TextRun({ text: c[0], font: c[1], size: c[2], bold: c[3], color: c[4] })]
									})
								]
							})
					)
				})
		);
		return new Table({
			width: { size: CONTENT_W, type: WidthType.DXA },
			columnWidths: widths,
			rows: [new TableRow({ tableHeader: true, children: headerCells }), ...dataRows]
		});
	};

	const statusLine = (code: string) =>
		new Paragraph({
			spacing: { before: 60, after: 80 },
			children: [
				new TextRun({
					text: " " + code + " ",
					bold: true,
					color: "FFFFFF",
					font: "Arial",
					size: 19,
					shading: { fill: POSTGREEN, type: ShadingType.CLEAR }
				}),
			]
		});

	const divider = () =>
		new Paragraph({
			border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 1 } },
			spacing: { before: 40, after: 200 },
			children: [new TextRun("")]
		});

	const summaryTable = (ref2: ApiReference) => {
		const widths = [2600, 900, CONTENT_W - 3500];
		const head = ["Service", "Method", "Path"].map(
			(t, i) =>
				new TableCell({
					width: { size: widths[i], type: WidthType.DXA },
					borders: cellBorders,
					shading: { fill: HEADERFILL, type: ShadingType.CLEAR },
					margins: { top: 80, bottom: 80, left: 120, right: 120 },
					children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: "FFFFFF", font: "Arial", size: 19 })] })]
				})
		);
		const rows = ref2.endpoints
			.filter((e) => !e.placeholder)
			.map((e, idx) => {
				const cells = [
					[e.title, "Arial", 19, true, "24292E"],
					[e.method, "Consolas", 18, true, "1B4F72"],
					[e.path, "Consolas", 18, false, "1B4F72"]
				];
				return new TableRow({
					children: cells.map(
						(c: any, i: number) =>
							new TableCell({
								width: { size: widths[i], type: WidthType.DXA },
								borders: cellBorders,
								shading: { fill: idx % 2 ? "F7F9FB" : "FFFFFF", type: ShadingType.CLEAR },
								margins: { top: 70, bottom: 70, left: 120, right: 120 },
								verticalAlign: VerticalAlign.CENTER,
								children: [new Paragraph({ children: [new TextRun({ text: c[0], font: c[1], size: c[2], bold: c[3], color: c[4] })] })]
							})
					)
				});
			});
		return new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: widths, rows: [new TableRow({ tableHeader: true, children: head }), ...rows] });
	};

	const children: any[] = [];

	// Title block
	children.push(
		new Paragraph({
			spacing: { before: 2200, after: 0 },
			alignment: AlignmentType.CENTER,
			children: [new TextRun({ text: ref.productName, bold: true, font: "Arial", size: 56, color: NAVY })]
		})
	);
	children.push(
		new Paragraph({
			spacing: { before: 80, after: 0 },
			alignment: AlignmentType.CENTER,
			children: [new TextRun({ text: ref.subtitle, bold: true, font: "Arial", size: 40, color: BLUE })]
		})
	);
	children.push(
		new Paragraph({
			spacing: { before: 240, after: 0 },
			alignment: AlignmentType.CENTER,
			children: [new TextRun({ text: ref.environment, font: "Arial", size: 24, color: GREY })]
		})
	);
	children.push(
		new Paragraph({
			spacing: { before: 1600, after: 0 },
			alignment: AlignmentType.CENTER,
			children: [new TextRun({ text: ref.changeRequest, font: "Arial", size: 22, color: GREY })]
		})
	);
	children.push(
		new Paragraph({
			spacing: { before: 60, after: 0 },
			alignment: AlignmentType.CENTER,
			children: [new TextRun({ text: ref.version, font: "Arial", size: 22, color: GREY })]
		})
	);
	children.push(new Paragraph({ children: [new PageBreak()] }));

	// TOC
	children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Contents")] }));
	children.push(new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }));
	children.push(new Paragraph({ children: [new PageBreak()] }));

	// Overview
	children.push(h1("Overview"));
	children.push(body(ref.overview));
	children.push(h2("Base URL"));
	children.push(body("All endpoints share the following base URL in the development environment:"));
	children.push(codeBlock(ref.baseUrl));
	children.push(h2("Conventions"));
	ref.conventions.forEach((c) =>
		children.push(
			new Paragraph({
				numbering: { reference: "bullets", level: 0 },
				spacing: { after: 60 },
				children: [new TextRun({ text: c, font: "Arial", size: 21 })]
			})
		)
	);
	children.push(h2("Endpoint Summary"));
	children.push(summaryTable(ref));
	children.push(new Paragraph({ children: [new PageBreak()] }));

	// Endpoint sections
	const realEndpoints = ref.endpoints.filter((e) => !e.placeholder);
	const placeholders = ref.endpoints.filter((e) => e.placeholder);

	realEndpoints.forEach((ep: ApiEndpoint, index: number) => {
		const fullPath = (ep.path || "").startsWith("http") ? ep.path : ref.baseUrl + ep.path;
		children.push(h1(ep.title));
		children.push(body(ep.description));
		children.push(label("ENDPOINT"));
		children.push(endpointLine(ep.method, fullPath));
		if (ep.params && ep.params.length) {
			children.push(label("REQUEST PARAMETERS"));
			children.push(paramTable(ep.params));
		}
		children.push(label("REQUEST BODY"));
		children.push(codeBlock(ep.requestBody));
		children.push(label("RESPONSE"));
		if (ep.responseStatus) {
			children.push(statusLine(ep.responseStatus));
		}
		children.push(codeBlock(ep.responseBody));
		if (index < realEndpoints.length - 1 || placeholders.length) {
			children.push(new Paragraph({ children: [new PageBreak()] }));
		}
	});

	// Placeholders (e.g. Report Contract)
	placeholders.forEach((ep, i) => {
		if (i > 0) children.push(new Paragraph({ children: [new PageBreak()] }));
		children.push(divider());
		children.push(h1(ep.title));
		children.push(body(ep.description, { italics: true, color: GREY }));
	});

	const doc = new Document({
		styles: {
			default: { document: { run: { font: "Arial", size: 22, color: "24292E" } } },
			paragraphStyles: [
				{
					id: "Heading1",
					name: "Heading 1",
					basedOn: "Normal",
					next: "Normal",
					quickFormat: true,
					run: { size: 34, bold: true, font: "Arial", color: NAVY },
					paragraph: {
						spacing: { before: 280, after: 160 },
						outlineLevel: 0,
						border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 4 } }
					}
				},
				{
					id: "Heading2",
					name: "Heading 2",
					basedOn: "Normal",
					next: "Normal",
					quickFormat: true,
					run: { size: 26, bold: true, font: "Arial", color: BLUE },
					paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 1 }
				}
			]
		},
		numbering: {
			config: [
				{
					reference: "bullets",
					levels: [
						{
							level: 0,
							format: LevelFormat.BULLET,
							text: "\u2022",
							alignment: AlignmentType.LEFT,
							style: { paragraph: { indent: { left: 540, hanging: 280 } } }
						}
					]
				}
			]
		},
		sections: [
			{
				properties: {
					page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
				},
				headers: {
					default: new Header({
						children: [
							new Paragraph({
								tabStops: [{ type: TabStopType.RIGHT, position: 9360 }],
								border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER, space: 4 } },
								children: [
									new TextRun({ text: ref.productName + " " + ref.subtitle, font: "Arial", size: 16, color: GREY }),
									new TextRun({ text: "\t" + ref.changeRequest, font: "Arial", size: 16, color: GREY })
								]
							})
						]
					})
				},
				footers: {
					default: new Footer({
						children: [
							new Paragraph({
								alignment: AlignmentType.CENTER,
								children: [
									new TextRun({ text: "Page ", font: "Arial", size: 16, color: GREY }),
									new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: GREY })
								]
							})
						]
					})
				},
				children
			}
		]
	});

	return Packer.toBlob(doc);
}
