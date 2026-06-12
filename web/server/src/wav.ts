type WavParts = {
  fmt: Buffer;
  data: Buffer;
};

function readChunk(buffer: Buffer, offset: number): { id: string; size: number; dataStart: number; nextOffset: number } {
  const id = buffer.toString('ascii', offset, offset + 4);
  const size = buffer.readUInt32LE(offset + 4);
  const dataStart = offset + 8;
  const nextOffset = dataStart + size + (size % 2);
  return { id, size, dataStart, nextOffset };
}

function parseWav(buffer: Buffer): WavParts {
  if (buffer.length < 12 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('VOICEVOX から WAV ではないデータが返されました');
  }

  let fmt: Buffer | undefined;
  const dataChunks: Buffer[] = [];
  let offset = 12;

  while (offset + 8 <= buffer.length) {
    const chunk = readChunk(buffer, offset);
    if (chunk.dataStart + chunk.size > buffer.length) {
      break;
    }

    if (chunk.id === 'fmt ') {
      fmt = buffer.subarray(chunk.dataStart, chunk.dataStart + chunk.size);
    } else if (chunk.id === 'data') {
      dataChunks.push(buffer.subarray(chunk.dataStart, chunk.dataStart + chunk.size));
    }

    offset = chunk.nextOffset;
  }

  if (!fmt || dataChunks.length === 0) {
    throw new Error('WAV の fmt/data チャンクを読み取れませんでした');
  }

  return {
    fmt,
    data: Buffer.concat(dataChunks)
  };
}

export function concatWavBuffers(buffers: Buffer[]): Buffer {
  if (buffers.length === 0) {
    throw new Error('連結する WAV がありません');
  }
  if (buffers.length === 1) {
    return buffers[0] as Buffer;
  }

  const parsed = buffers.map(parseWav);
  const fmt = parsed[0]?.fmt;
  if (!fmt) {
    throw new Error('WAV の fmt チャンクを読み取れませんでした');
  }
  const data = Buffer.concat(parsed.map((part) => part.data));
  const totalSize = 4 + (8 + fmt.length) + (8 + data.length);
  const output = Buffer.alloc(12 + 8 + fmt.length + 8 + data.length);

  output.write('RIFF', 0, 'ascii');
  output.writeUInt32LE(totalSize, 4);
  output.write('WAVE', 8, 'ascii');
  output.write('fmt ', 12, 'ascii');
  output.writeUInt32LE(fmt.length, 16);
  fmt.copy(output, 20);

  const dataHeaderOffset = 20 + fmt.length;
  output.write('data', dataHeaderOffset, 'ascii');
  output.writeUInt32LE(data.length, dataHeaderOffset + 4);
  data.copy(output, dataHeaderOffset + 8);

  return output;
}
