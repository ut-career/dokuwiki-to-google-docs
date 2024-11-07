export async function fetchDokuWikiPages(
	url: string,
	id: string,
	password: string,
): Promise<string[]> {
	try {
		const response = await fetch(url, {
			headers: {
				Authorization: `Basic ${btoa(`${id}:${password}`)}`,
			},
		});

		if (!response.ok) {
			throw new Error("Network response was not ok");
		}

		const pages = await response.json(); // Assuming the response data contains the pages in JSON format
		return pages;
	} catch (error) {
		console.error("Error fetching DokuWiki pages:", error);
		throw error;
	}
}
