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
	console.log("File Id:", file.data.id);
};
