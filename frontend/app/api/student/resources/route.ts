import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { listDriveFolder, validateFolderAccess, getDriveClient } from "@/lib/drive";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  let folderId = searchParams.get("folderId");

  const rootId = process.env.GOOGLE_DRIVE_RESOURCES_FOLDER_ID;
  if (!rootId) {
    return NextResponse.json(
      { error: "GOOGLE_DRIVE_RESOURCES_FOLDER_ID is not configured on the server." },
      { status: 500 }
    );
  }

  if (!folderId) {
    folderId = rootId;
  }

  // Validate that the folderId is a descendant of the root folder
  const isValid = await validateFolderAccess(folderId);
  if (!isValid) {
    return NextResponse.json({ error: "Access denied: Invalid folder ID." }, { status: 403 });
  }

  try {
    const drive = getDriveClient();
    const folderMeta = await drive.files.get({
      fileId: folderId,
      fields: "id, name",
    });
    const items = await listDriveFolder(folderId);
    return NextResponse.json({
      folderId: folderMeta.data.id,
      folderName: folderMeta.data.name || "Resources",
      items,
    });
  } catch (error: any) {
    console.error("Error fetching drive folder:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch files from Google Drive." },
      { status: 500 }
    );
  }
}
