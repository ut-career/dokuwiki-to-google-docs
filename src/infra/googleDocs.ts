import { drive, auth } from "@googleapis/drive";
import { docs } from "@googleapis/docs";

export const createDoc = async (folderId: string, title: string) => {
	const googleAuth = new auth.GoogleAuth({
		scopes: ["https://www.googleapis.com/auth/drive"],
	});

	const googleDrive = drive({ version: "v3", auth: googleAuth });

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

	return file.data.id;
};

export const writeDoc = async (docId: string, content: string) => {
	if (!content) {
		throw new Error("content is empty");
	}

	const googleAuth = new auth.GoogleAuth({
		scopes: ["https://www.googleapis.com/auth/drive"],
	});

	const googleDocs = docs({ version: "v1", auth: googleAuth });

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
};

export const updateLink = async (
	docId: string,
	originalText: string,
	url: string,
	title: string,
	startIndex: number,
	endIndex: number,
) => {
	const googleAuth = new auth.GoogleAuth({
		scopes: ["https://www.googleapis.com/auth/drive"],
	});

	const googleDocs = docs({ version: "v1", auth: googleAuth });

	await googleDocs.documents.batchUpdate({
		documentId: docId,
		requestBody: {
			requests: [
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
										red: 0.07,
										green: 0.33,
										blue: 0.8,
									},
								},
							},
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
						replaceText: title,
					},
				},
			],
		},
	});
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
	const googleAuth = new auth.GoogleAuth({
		scopes: ["https://www.googleapis.com/auth/drive"],
	});

	const googleDrive = drive({ version: "v3", auth: googleAuth });

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

	return file.data.id;
};
