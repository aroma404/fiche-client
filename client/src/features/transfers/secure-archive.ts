/** Téléchargement direct ou ZIP AES-256 protégé sans exposer le mot de passe au serveur. */

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function createProtectedZip(blob: Blob, sourceName: string, password: string) {
  const { BlobReader, BlobWriter, ZipWriter } = await import("@zip.js/zip.js");
  const writer = new ZipWriter(new BlobWriter("application/zip"));
  await writer.add(sourceName, new BlobReader(blob), { password, encryptionStrength: 3 });
  return writer.close();
}

export async function downloadProtectedZip(blob: Blob, sourceName: string, password: string) {
  const archive = await createProtectedZip(blob, sourceName, password);
  const zipName = `${sourceName.replace(/\.[^.]+$/, "")}-protege.zip`;
  downloadBlob(archive, zipName);
}
