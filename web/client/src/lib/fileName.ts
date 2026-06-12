function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

export function buildGeneratedFileName(songTitle: string, date = new Date()): string {
  const timestamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join('');
  const safeTitle = songTitle.replace(/[\\/:*?"<>|]/g, '_');
  return `シングリンク_${safeTitle}_${timestamp}.wav`;
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
