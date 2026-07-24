const defaultFrameRate = 93.75;

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

export function calculateWavTrimSampleFrames(
  paddingFrames: number,
  sampleRate: number,
  priorPaddingFrames = 0,
  frameRate = defaultFrameRate
): number {
  const before = Math.round(priorPaddingFrames * sampleRate / frameRate);
  const after = Math.round((priorPaddingFrames + paddingFrames) * sampleRate / frameRate);
  return Math.max(0, after - before);
}

export function trimWavLeadingFrames(
  source: Uint8Array,
  paddingFrames: number,
  priorPaddingFrames = 0,
  frameRate = defaultFrameRate
): Uint8Array {
  if (paddingFrames <= 0) {
    return source.slice();
  }

  const bytes = source;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 12 || readAscii(bytes, 0, 4) !== 'RIFF' || readAscii(bytes, 8, 4) !== 'WAVE') {
    throw new Error('WAVのRIFF/WAVEヘッダーを読み取れませんでした');
  }

  let sampleRate: number | undefined;
  let blockAlign: number | undefined;
  let dataHeaderOffset: number | undefined;
  let dataStart: number | undefined;
  let dataSize: number | undefined;
  let offset = 12;

  while (offset + 8 <= bytes.length) {
    const id = readAscii(bytes, offset, 4);
    const size = view.getUint32(offset + 4, true);
    const chunkDataStart = offset + 8;
    if (chunkDataStart + size > bytes.length) {
      throw new Error('WAVチャンクのサイズがファイル範囲を超えています');
    }
    if (id === 'fmt ' && size >= 16) {
      sampleRate = view.getUint32(chunkDataStart + 4, true);
      blockAlign = view.getUint16(chunkDataStart + 12, true);
    } else if (id === 'data' && dataStart === undefined) {
      dataHeaderOffset = offset;
      dataStart = chunkDataStart;
      dataSize = size;
    }
    offset = chunkDataStart + size + (size % 2);
  }

  if (!sampleRate || !blockAlign || dataHeaderOffset === undefined || dataStart === undefined || dataSize === undefined) {
    throw new Error('WAVのfmt/dataチャンクを読み取れませんでした');
  }

  const requestedSamples = calculateWavTrimSampleFrames(
    paddingFrames,
    sampleRate,
    priorPaddingFrames,
    frameRate
  );
  const availableSamples = Math.floor(dataSize / blockAlign);
  const removedSamples = Math.min(requestedSamples, availableSamples);
  const removedBytes = removedSamples * blockAlign;
  const remainingDataSize = dataSize - removedBytes;
  const oldTailStart = dataStart + dataSize + (dataSize % 2);
  const newTailStart = dataStart + remainingDataSize + (remainingDataSize % 2);
  const output = new Uint8Array(newTailStart + (bytes.length - oldTailStart));

  output.set(bytes.subarray(0, dataStart), 0);
  output.set(bytes.subarray(dataStart + removedBytes, dataStart + dataSize), dataStart);
  output.set(bytes.subarray(oldTailStart), newTailStart);

  const outputView = new DataView(output.buffer);
  outputView.setUint32(4, output.length - 8, true);
  outputView.setUint32(dataHeaderOffset + 4, remainingDataSize, true);
  return output;
}
