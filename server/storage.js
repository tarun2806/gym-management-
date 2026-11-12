import { storage } from './firebase.js';
import { logAudit } from './audit.js';

export async function uploadFile(file, type, entityId, orgId, branchId) {
  try {
    const fileName = `${type}/${orgId}/${branchId || 'default'}/${entityId}/${Date.now()}-${file.originalname}`;
    const bucket = storage.bucket();
    
    const fileUpload = bucket.file(fileName);
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });
    
    stream.end(file.buffer);
    
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    
    const [url] = await fileUpload.getSignedUrl({
      action: 'read',
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
    });
    
    await logAudit({
      level: 'info',
      message: `File uploaded: ${fileName}`,
      user_name: 'system',
      user_id: 'system',
      action: 'file_upload',
      org_id,
      branch_id,
      target_type: type,
      target_id: entityId,
      metadata: { fileName, size: file.size },
    });
    
    return { url, fileName };
  } catch (error) {
    console.error('[Storage] Upload failed:', error);
    throw error;
  }
}

export async function deleteFile(fileName) {
  try {
    const bucket = storage.bucket();
    await bucket.file(fileName).delete();
    return { success: true };
  } catch (error) {
    console.error('[Storage] Delete failed:', error);
    throw error;
  }
}
