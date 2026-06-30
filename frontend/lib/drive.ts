import { google } from "googleapis";

function getAuth() {
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const key = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !key) {
    throw new Error("Google Service Account credentials (GOOGLE_SHEETS_CLIENT_EMAIL / GOOGLE_SHEETS_PRIVATE_KEY) are not configured.");
  }

  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
}

export function getDriveClient() {
  const auth = getAuth();
  return google.drive({ version: "v3", auth });
}

/**
 * Validates whether a folder is the root Resources folder or one of its descendants.
 * This prevents users from accessing arbitrary folders in the Drive.
 */
export async function validateFolderAccess(folderId: string): Promise<boolean> {
  const rootId = process.env.GOOGLE_DRIVE_RESOURCES_FOLDER_ID;
  if (!rootId) {
    console.error("GOOGLE_DRIVE_RESOURCES_FOLDER_ID is not configured in environment variables.");
    return false;
  }

  if (folderId === rootId) return true;

  return isDescendant(folderId, rootId);
}

async function isDescendant(folderId: string, rootId: string, depth = 0): Promise<boolean> {
  if (folderId === rootId) return true;
  if (depth > 3) return false; // Limit depth to prevent abuse or infinite loops

  try {
    const drive = getDriveClient();
    const res = await drive.files.get({
      fileId: folderId,
      fields: "parents",
    });
    const parents = res.data.parents;
    if (!parents || parents.length === 0) return false;

    for (const parentId of parents) {
      if (parentId === rootId) return true;
      const parentIsDescendant = await isDescendant(parentId, rootId, depth + 1);
      if (parentIsDescendant) return true;
    }
  } catch (error) {
    console.error(`Error validating folder ${folderId} parent:`, error);
    return false;
  }
  return false;
}

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  size?: string;
}

/**
 * Lists all files and folders inside a specific Google Drive folder.
 * Returns them sorted with folders first, then files.
 */
export async function listDriveFolder(folderId: string): Promise<DriveItem[]> {
  const drive = getDriveClient();
  
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id, name, mimeType, webViewLink, size)",
    // We sort folders first, then by name
    orderBy: "folder,name",
  });

  const files = res.data.files || [];
  
  return files.map((f) => ({
    id: f.id || "",
    name: f.name || "Untitled",
    mimeType: f.mimeType || "",
    webViewLink: f.webViewLink || "",
    size: f.size || undefined,
  }));
}
