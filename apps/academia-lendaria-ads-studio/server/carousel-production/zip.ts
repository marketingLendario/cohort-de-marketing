/**
 * Escritor/leitor de ZIP determinístico para o renderer de conteúdo-funil.
 *
 * O objetivo é reprodutibilidade byte-a-byte: dado o mesmo conjunto de entradas
 * (nome + bytes), o ZIP resultante é sempre idêntico. Para isso usamos apenas o
 * método `store` (sem compressão — PNGs já são comprimidos), timestamps fixos na
 * época DOS (1980-01-01 00:00:00), ordenação estável dos nomes e nenhum campo
 * extra ou comentário. Nada de disco, nada de rede, nada de relógio.
 *
 * O leitor `readDeterministicZip` valida a estrutura e extrai as entradas store,
 * permitindo round-trip real em testes sem dependências externas.
 */

const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
// Época DOS: hora 0, data 1980-01-01 (dia=1, mês=1, ano=0 => 0x0021).
const DOS_TIME = 0x0000;
const DOS_DATE = 0x0021;
const STORE_METHOD = 0x0000;
const VERSION_NEEDED = 20; // 2.0 — suficiente para `store`.
const VERSION_MADE_BY = 20; // low byte = spec*10; high byte = 0 (MS-DOS/FAT).

export interface DeterministicZipEntry {
  /** Caminho relativo dentro do arquivo (usa `/` como separador). */
  path: string;
  content: Buffer;
}

const crc32Table = buildCrc32Table();

function buildCrc32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

export function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = crc32Table[(crc ^ buffer[i]) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Rejeita nomes de entrada que poderiam escapar do lote confinado ou quebrar a
 * reprodutibilidade (absolutos, traversal, separadores de Windows, vazios).
 */
function assertSafeEntryPath(path: string): void {
  if (!path || path.length > 512) {
    throw new Error('Nome de entrada ZIP vazio ou longo demais.');
  }
  if (path.startsWith('/') || /^[A-Za-z]:[\\/]/.test(path) || path.includes('\\')) {
    throw new Error(`Nome de entrada ZIP com caminho absoluto ou inválido: ${path}`);
  }
  if (path.split('/').some((segment) => segment === '..' || segment === '.')) {
    throw new Error(`Nome de entrada ZIP com traversal de diretório: ${path}`);
  }
}

/**
 * Serializa as entradas em um ZIP determinístico. As entradas são ordenadas por
 * nome para que a ordem de chamada não influencie os bytes finais.
 */
export function createDeterministicZip(entries: DeterministicZipEntry[]): Buffer {
  const ordered = [...entries].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const seen = new Set<string>();
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of ordered) {
    assertSafeEntryPath(entry.path);
    if (seen.has(entry.path)) throw new Error(`Entrada ZIP duplicada: ${entry.path}`);
    seen.add(entry.path);

    const nameBytes = Buffer.from(entry.path, 'utf8');
    const crc = crc32(entry.content);
    const size = entry.content.length;

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(LOCAL_FILE_HEADER_SIGNATURE, 0);
    localHeader.writeUInt16LE(VERSION_NEEDED, 4);
    localHeader.writeUInt16LE(0, 6); // flags
    localHeader.writeUInt16LE(STORE_METHOD, 8);
    localHeader.writeUInt16LE(DOS_TIME, 10);
    localHeader.writeUInt16LE(DOS_DATE, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(size, 18); // compressed size (store => == uncompressed)
    localHeader.writeUInt32LE(size, 22); // uncompressed size
    localHeader.writeUInt16LE(nameBytes.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra field length
    localParts.push(localHeader, nameBytes, entry.content);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(CENTRAL_DIRECTORY_SIGNATURE, 0);
    centralHeader.writeUInt16LE(VERSION_MADE_BY, 4);
    centralHeader.writeUInt16LE(VERSION_NEEDED, 6);
    centralHeader.writeUInt16LE(0, 8); // flags
    centralHeader.writeUInt16LE(STORE_METHOD, 10);
    centralHeader.writeUInt16LE(DOS_TIME, 12);
    centralHeader.writeUInt16LE(DOS_DATE, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(size, 20);
    centralHeader.writeUInt32LE(size, 24);
    centralHeader.writeUInt16LE(nameBytes.length, 28);
    centralHeader.writeUInt16LE(0, 30); // extra field length
    centralHeader.writeUInt16LE(0, 32); // comment length
    centralHeader.writeUInt16LE(0, 34); // disk number start
    centralHeader.writeUInt16LE(0, 36); // internal attributes
    centralHeader.writeUInt32LE(0, 38); // external attributes
    centralHeader.writeUInt32LE(offset, 42); // offset of local header
    centralParts.push(centralHeader, nameBytes);

    offset += localHeader.length + nameBytes.length + entry.content.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const localSection = Buffer.concat(localParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(END_OF_CENTRAL_DIRECTORY_SIGNATURE, 0);
  end.writeUInt16LE(0, 4); // this disk
  end.writeUInt16LE(0, 6); // disk with central directory
  end.writeUInt16LE(ordered.length, 8);
  end.writeUInt16LE(ordered.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(localSection.length, 16); // offset of central directory
  end.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([localSection, centralDirectory, end]);
}

/**
 * Lê um ZIP produzido por `createDeterministicZip` percorrendo a central
 * directory. Aceita somente entradas `store` e valida o CRC-32 de cada uma.
 */
export function readDeterministicZip(buffer: Buffer): DeterministicZipEntry[] {
  const endOffset = findEndOfCentralDirectory(buffer);
  const total = buffer.readUInt16LE(endOffset + 10);
  let cursor = buffer.readUInt32LE(endOffset + 16);
  const entries: DeterministicZipEntry[] = [];

  for (let i = 0; i < total; i += 1) {
    if (buffer.readUInt32LE(cursor) !== CENTRAL_DIRECTORY_SIGNATURE) {
      throw new Error('Central directory do ZIP corrompida.');
    }
    const method = buffer.readUInt16LE(cursor + 10);
    if (method !== STORE_METHOD) throw new Error('ZIP contém entrada comprimida não suportada.');
    const expectedCrc = buffer.readUInt32LE(cursor + 16);
    const size = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const path = buffer.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8');

    if (buffer.readUInt32LE(localOffset) !== LOCAL_FILE_HEADER_SIGNATURE) {
      throw new Error(`Local header inválido para ${path}.`);
    }
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const content = buffer.subarray(dataStart, dataStart + size);
    if (crc32(content) !== expectedCrc) throw new Error(`CRC-32 divergente para ${path}.`);
    entries.push({ path, content });

    cursor += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

function findEndOfCentralDirectory(buffer: Buffer): number {
  // O EOCD tem 22 bytes fixos (comentário sempre vazio aqui), então basta olhar
  // o final; ainda assim varremos para trás por robustez.
  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (buffer.readUInt32LE(offset) === END_OF_CENTRAL_DIRECTORY_SIGNATURE) return offset;
  }
  throw new Error('ZIP sem end-of-central-directory (arquivo inválido).');
}
