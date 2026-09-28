export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
}

/**
 * Lists files from the authenticated user's Google Drive.
 */
export async function listGoogleDriveFiles(
  accessToken: string,
  options?: { query?: string; pageSize?: number }
): Promise<GoogleDriveFile[]> {
  const pageSize = options?.pageSize || 30;
  let q = 'trashed = false';
  if (options?.query && options.query.trim()) {
    // Escaped search term
    const cleanQ = options.query.trim().replace(/['\\]/g, '');
    q += ` and (name contains '${cleanQ}' or fullText contains '${cleanQ}')`;
  }

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('pageSize', String(pageSize));
  url.searchParams.set(
    'fields',
    'files(id,name,mimeType,size,webViewLink,thumbnailLink,modifiedTime)'
  );
  url.searchParams.set('orderBy', 'modifiedTime desc');
  url.searchParams.set('q', q);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to fetch Google Drive files (${res.status})`
    );
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Uploads a file/blob to Google Drive using multipart upload.
 */
export async function uploadToGoogleDrive(
  accessToken: string,
  fileBlob: Blob,
  metadata: {
    name: string;
    mimeType: string;
    description?: string;
    parents?: string[];
  }
): Promise<GoogleDriveFile> {
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metaDataPart = {
    name: metadata.name,
    mimeType: metadata.mimeType,
    description: metadata.description || 'Uploaded via AB-PMJAY Audit Portal',
    ...(metadata.parents && metadata.parents.length > 0 ? { parents: metadata.parents } : {}),
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metaDataPart) +
    delimiter +
    `Content-Type: ${metadata.mimeType}\r\n` +
    'Content-Transfer-Encoding: base64\r\n\r\n';

  // Convert blob to base64
  const arrayBuffer = await fileBlob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Data = btoa(binary);

  const fullBody = multipartRequestBody + base64Data + closeDelimiter;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,thumbnailLink,modifiedTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body: fullBody,
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to upload file to Google Drive (${res.status})`
    );
  }

  return await res.json();
}

/**
 * Creates an audit documents folder in Google Drive if needed.
 */
export async function createDriveFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<GoogleDriveFile> {
  const meta: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentFolderId) {
    meta.parents = [parentFolderId];
  }

  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(meta),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to create folder in Google Drive');
  }

  return await res.json();
}

/**
 * Downloads and reads the text content of a file from Google Drive.
 */
export async function downloadDriveFileText(
  accessToken: string,
  fileId: string
): Promise<string> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Failed to download file from Google Drive (${res.status})`
    );
  }

  return await res.text();
}

/**
 * Saves an audit session to Google Drive as formatted JSON.
 */
export async function saveAuditSessionJsonToDrive(
  accessToken: string,
  session: any
): Promise<GoogleDriveFile> {
  const jsonString = JSON.stringify(session, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const filename = `AB_PMJAY_AuditSession_${session.procedureCode}_${session.patientId || 'PAT'}_${session.id}.json`;

  return await uploadToGoogleDrive(accessToken, blob, {
    name: filename,
    mimeType: 'application/json',
    description: `AB-PMJAY Audit Session for Patient ${session.patientId}, Procedure ${session.procedureCode}, Compliance: ${session.complianceRate}%`,
  });
}

/**
 * Saves all master procedures catalog to Google Drive as JSON.
 */
export async function saveProceduresExportToDrive(
  accessToken: string,
  procedures: any[]
): Promise<GoogleDriveFile> {
  const jsonString = JSON.stringify(procedures, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const filename = `HBP_Master_Packages_Export_${new Date().toISOString().slice(0, 10)}.json`;

  return await uploadToGoogleDrive(accessToken, blob, {
    name: filename,
    mimeType: 'application/json',
    description: `Ayushman Bharat Health Benefit Packages (HBP) master tariff catalog export (${procedures.length} procedures).`,
  });
}

/**
 * Destructive operation: Deletes a file from Google Drive.
 * Requires user confirmation dialog per Workspace guidelines.
 */
export async function deleteGoogleDriveFile(
  accessToken: string,
  fileId: string,
  fileName?: string
): Promise<void> {
  const displayName = fileName || 'selected file';
  const confirmed = window.confirm(
    `Are you sure you want to delete "${displayName}" from your Google Drive? This action cannot be undone.`
  );
  if (!confirmed) return;

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to delete file from Google Drive');
  }
}
