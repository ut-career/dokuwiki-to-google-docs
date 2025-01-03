# dokuwiki-to-google-docs

## Setup and Usage

### Prerequisites

- Node.js (v22 or later)
- npm (v10 or later)

### Installation

1. Clone the repository:

```sh
git clone https://github.com/ut-career/dokuwiki-to-google-docs.git
cd dokuwiki-to-google-docs
```

2. Install the dependencies:

```sh
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory of the project and add the following environment variables:

```env
DOKUWIKI_URL=<your_dokuwiki_url>
DOKUWIKI_ID=<your_dokuwiki_id>
DOKUWIKI_PASSWORD=<your_dokuwiki_password>
GOOGLE_DRIVE_FOLDER_ID=<your_google_drive_folder_id>
```

Login to Google Cloud

```sh
gcloud auth application-default login --client-id-file=[CLIENT_ID_FILE] --scopes="https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/drive"
```

### Running the Software

To run the software, use the following command:

```sh
npm run start
```

This will fetch DokuWiki pages, convert them to Google Docs documents, and upload them to Google Drive using the specified environment variables.
