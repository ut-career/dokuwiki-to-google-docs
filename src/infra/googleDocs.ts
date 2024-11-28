import { drive, auth } from "@googleapis/drive";

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
