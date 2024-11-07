import { drive, auth, type drive_v3 } from "@googleapis/drive";

export async function convertToGoogleDocs(
	dokuWikiPage: string,
): Promise<
	Pick<drive_v3.Params$Resource$Files$Create, "media"> & { title: string }
> {
	// Implement the conversion logic here
	// This is a placeholder implementation
	return {
		title: "Converted Google Doc",
		media: {
			mimeType: "application/vnd.google-apps.document",
			body: dokuWikiPage,
		},
	};
}

export async function uploadToGoogleDrive(
	googleDoc: Awaited<ReturnType<typeof convertToGoogleDocs>>,
	folderId: string,
): Promise<void> {
	const googleAuth = new auth.GoogleAuth({
		scopes: ["https://www.googleapis.com/auth/drive.file"],
	});

	const googleDrive = drive({ version: "v3", auth: googleAuth });

	const fileMetadata = {
		name: googleDoc.title,
		parents: [folderId],
	};

	try {
		const file = await googleDrive.files.create({
			media: googleDoc.media,
			fields: "id",
		});
		console.log("File Id:", file.data.id);
	} catch (error) {
		console.error("Error uploading to Google Drive:", error);
		throw error;
	}
}
