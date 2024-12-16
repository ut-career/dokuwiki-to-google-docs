import { drive, auth } from "@googleapis/drive";
import { docs } from "@googleapis/docs";

const googleAuth = new auth.GoogleAuth({
	scopes: ["https://www.googleapis.com/auth/drive"],
});
const googleDrive = drive({ version: "v3", auth: googleAuth });
const googleDocs = docs({ version: "v1", auth: googleAuth });

export const createDoc = async (folderId: string, title: string) => {
	const file = await googleDrive.files.create({
		requestBody: {
			name: title,
			parents: [folderId],
			mimeType: "application/vnd.google-apps.document",
		},
		fields: "id",
		// 共有ドライブにアクセスするために必要
		supportsAllDrives: true,
	});

	await waitForQuota();
	return file.data.id;
};

export const writeDoc = async (docId: string, content: string) => {
	if (!content) {
		throw new Error("content is empty");
	}

	await googleDocs.documents.batchUpdate({
		documentId: docId,
		requestBody: {
			requests: [
				{
					insertText: {
						text: content,
						endOfSegmentLocation: {
							segmentId: "",
						},
					},
				},
			],
		},
	});
	await waitForQuota();
};

export const updateLink = async (
	docId: string,
	originalText: string,
	url: string,
	title: string,
	startIndex: number,
) => {
	const endIndex = startIndex + originalText.length;

	await googleDocs.documents.batchUpdate({
		documentId: docId,
		requestBody: {
			requests: [
				{
					// 同名のリンクがある場合に不具合になるので、NamedRangeを使って対応
					createNamedRange: {
						name: `${startIndex}-${endIndex}`,
						range: {
							startIndex,
							endIndex,
						},
					},
				},
				{
					// リンクを設定してからテキストを置換するとリンクが消えるので、先にテキストを置換する
					replaceNamedRangeContent: {
						namedRangeName: `${startIndex}-${endIndex}`,
						text: title,
					},
				},
				{
					updateTextStyle: {
						textStyle: {
							link: {
								url,
							},
							underline: true,
							foregroundColor: {
								color: {
									rgbColor: {
										red: 0.06666667,
										green: 0.33333334,
										blue: 0.8,
									},
								},
							},
						},
						fields: "*",
						range: {
							// listの場合listの記号にも色がついてしまうので、前後にスペースを追加することでリンクのみに色がつくようにする
							// write-docsと蜜結合でいやだな、、、
							startIndex: startIndex + 1,
							endIndex: endIndex - (originalText.length - title.length) - 1,
						},
					},
				},
			],
		},
	});
	await waitForQuota();
};

export const updateHeading = async (
	docId: string,
	originalText: string,
	headingStyle:
		| "HEADING_1"
		| "HEADING_2"
		| "HEADING_3"
		| "HEADING_4"
		| "HEADING_5"
		| "HEADING_6",
	text: string,
	startIndex: number,
	endIndex: number,
) => {
	await googleDocs.documents.batchUpdate({
		documentId: docId,
		requestBody: {
			requests: [
				{
					updateParagraphStyle: {
						paragraphStyle: {
							namedStyleType: headingStyle,
						},
						fields: "*",
						range: {
							startIndex,
							endIndex,
						},
					},
				},
				{
					replaceAllText: {
						containsText: {
							text: originalText,
						},
						replaceText: text,
					},
				},
			],
		},
	});
	await waitForQuota();
};

export const replaceText = async (
	docId: string,
	originalText: string,
	text: string,
) => {
	await googleDocs.documents.batchUpdate({
		documentId: docId,
		requestBody: {
			requests: [
				{
					replaceAllText: {
						containsText: {
							text: originalText,
						},
						replaceText: text,
					},
				},
			],
		},
	});
	await waitForQuota();
};

export const updateUnorderListItem = async (
	docId: string,
	originalText: string,
	text: string,
	indentLevel: number,
	startIndex: number,
	endIndex: number,
) => {
	await googleDocs.documents.batchUpdate({
		documentId: docId,
		requestBody: {
			requests: [
				{
					createParagraphBullets: {
						range: {
							startIndex,
							endIndex,
						},
						bulletPreset: "BULLET_DISC_CIRCLE_SQUARE",
					},
				},
				{
					updateParagraphStyle: {
						range: {
							startIndex,
							endIndex,
						},
						paragraphStyle: {
							// Google Docsのデフォルトのインデント量に従う
							indentFirstLine: {
								magnitude: (indentLevel - 1) * 36 + 18,
								unit: "PT",
							},
							indentStart: {
								magnitude: indentLevel * 36,
								unit: "PT",
							},
						},
						// * だと namedStyleType を含んでしまい、エラーになる
						fields: "indentFirstLine,indentStart",
					},
				},
				{
					replaceAllText: {
						containsText: {
							text: originalText,
						},
						replaceText: text,
					},
				},
			],
		},
	});
	await waitForQuota();
};

export const updateOrderedListItem = async (
	docId: string,
	originalText: string,
	text: string,
	indentLevel: number,
	startIndex: number,
	endIndex: number,
) => {
	await googleDocs.documents.batchUpdate({
		documentId: docId,
		requestBody: {
			requests: [
				{
					createParagraphBullets: {
						range: {
							startIndex,
							endIndex,
						},
						bulletPreset: "NUMBERED_DECIMAL_ALPHA_ROMAN",
					},
				},
				{
					updateParagraphStyle: {
						range: {
							startIndex,
							endIndex,
						},
						paragraphStyle: {
							// Google Docsのデフォルトのインデント量に従う
							indentFirstLine: {
								magnitude: (indentLevel - 1) * 36 + 18,
								unit: "PT",
							},
							indentStart: {
								magnitude: indentLevel * 36,
								unit: "PT",
							},
						},
						// * だと namedStyleType を含んでしまい、エラーになる
						fields: "indentFirstLine,indentStart",
					},
				},
				{
					replaceAllText: {
						containsText: {
							text: originalText,
						},
						replaceText: text,
					},
				},
			],
		},
	});
	await waitForQuota();
};

export const replaceDevider = async (
	docId: string,
	originalText: string,
	startIndex: number,
) => {
	const endIndex = startIndex + originalText.length;
	const borderNoneStyle = {
		width: {
			magnitude: 0,
			unit: "PT",
		},
		dashStyle: "SOLID",
		color: {
			color: {
				rgbColor: {
					red: 1,
					green: 1,
					blue: 1,
				},
			},
		},
	};
	await googleDocs.documents.batchUpdate({
		documentId: docId,
		requestBody: {
			requests: [
				{
					// replaceAllだと複数ある場合に不具合になるので、NamedRangeを使って対応
					createNamedRange: {
						name: `${startIndex}-${endIndex}`,
						range: {
							startIndex,
							endIndex,
						},
					},
				},
				{
					replaceNamedRangeContent: {
						namedRangeName: `${startIndex}-${endIndex}`,
						text: "",
					},
				},
				// apiにはhorizontalRuleがないので、tableで代用
				{
					insertTable: {
						rows: 1,
						columns: 1,
						location: {
							index: startIndex,
						},
					},
				},
				{
					updateTableCellStyle: {
						tableStartLocation: {
							index: startIndex + 1,
						},
						tableCellStyle: {
							borderTop: borderNoneStyle,
							borderLeft: borderNoneStyle,
							borderRight: borderNoneStyle,
						},
						fields: "borderTop,borderLeft,borderRight",
					},
				},
				{
					updateTextStyle: {
						range: {
							startIndex: startIndex + 3,
							endIndex: startIndex + 4,
						},
						textStyle: {
							fontSize: {
								magnitude: 1,
								unit: "PT",
							},
						},
						fields: "fontSize",
					},
				},
			],
		},
	});
	await waitForQuota();
	return {
		raplacedObjectLength: 6,
	};
};

export const uploadFile = async ({
	name,
	parent,
	mimeType,
	body,
}: {
	name: string;
	parent: string;
	mimeType: string;
	body: NodeJS.ReadableStream;
}) => {
	const file = await googleDrive.files.create(
		{
			requestBody: {
				name,
				parents: [parent],
			},
			media: {
				mimeType,
				body,
			},
			fields: "id",
			// 共有ドライブにアクセスするために必要
			supportsAllDrives: true,
		},
		{
			headers: {
				"Content-Transfer-Encoding": "base64",
			},
		},
	);
	await waitForQuota();

	return file.data.id;
};

const waitForQuota = async () => {
	// 60req/1min/1user なので、1req/1sec になるように待つ
	await new Promise((resolve) => setTimeout(resolve, 1000));
};
