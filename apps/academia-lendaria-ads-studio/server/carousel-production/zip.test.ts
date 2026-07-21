import { describe, expect, it } from 'vitest';
import {
  createDeterministicZip,
  crc32,
  readDeterministicZip,
  type DeterministicZipEntry,
} from './zip.js';

const LOCAL_HEADER_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

function sampleEntries(): DeterministicZipEntry[] {
  return [
    { path: 'index.html', content: Buffer.from('<!doctype html><title>ok</title>', 'utf8') },
    { path: 'slides/slide-01.png', content: Buffer.from([1, 2, 3, 4, 5]) },
    { path: 'slides/slide-02.png', content: Buffer.from('conteúdo com acento é', 'utf8') },
  ];
}

describe('deterministic zip', () => {
  it('abre com os magic bytes de um ZIP real', () => {
    const zip = createDeterministicZip(sampleEntries());
    expect(zip.subarray(0, 4)).toEqual(LOCAL_HEADER_MAGIC);
  });

  it('faz round-trip preservando subpastas e conteúdo exato', () => {
    const entries = sampleEntries();
    const zip = createDeterministicZip(entries);
    const back = readDeterministicZip(zip);
    // Entradas voltam ordenadas por nome.
    expect(back.map((entry) => entry.path)).toEqual([
      'index.html',
      'slides/slide-01.png',
      'slides/slide-02.png',
    ]);
    for (const original of entries) {
      const found = back.find((entry) => entry.path === original.path);
      expect(found?.content.equals(original.content)).toBe(true);
    }
  });

  it('é determinístico independentemente da ordem de inserção', () => {
    const entries = sampleEntries();
    const reversed = [...entries].reverse();
    const first = createDeterministicZip(entries);
    const second = createDeterministicZip(reversed);
    expect(first.equals(second)).toBe(true);
  });

  it('não carrega timestamp de relógio (mesma saída em execuções distintas)', () => {
    const a = createDeterministicZip(sampleEntries());
    const b = createDeterministicZip(sampleEntries());
    expect(a.equals(b)).toBe(true);
  });

  it('rejeita nomes de entrada absolutos, com traversal ou com barra invertida', () => {
    expect(() => createDeterministicZip([{ path: '/etc/passwd', content: Buffer.alloc(1) }])).toThrow(/absoluto/);
    expect(() => createDeterministicZip([{ path: '../escape.png', content: Buffer.alloc(1) }])).toThrow(/traversal/);
    expect(() => createDeterministicZip([{ path: 'slides\\slide.png', content: Buffer.alloc(1) }])).toThrow(/inválido/);
    expect(() => createDeterministicZip([{ path: 'C:\\slide.png', content: Buffer.alloc(1) }])).toThrow(/absoluto/);
  });

  it('rejeita entradas duplicadas', () => {
    expect(() => createDeterministicZip([
      { path: 'a.png', content: Buffer.alloc(1) },
      { path: 'a.png', content: Buffer.alloc(2) },
    ])).toThrow(/duplicada/);
  });

  it('detecta corrupção de conteúdo pelo CRC-32 na leitura', () => {
    const zip = createDeterministicZip(sampleEntries());
    // O conteúdo do primeiro arquivo começa após o local header (30) + nome.
    const corrupted = Buffer.from(zip);
    const dataStart = 30 + Buffer.from('index.html').length;
    corrupted[dataStart] = corrupted[dataStart]! ^ 0xff;
    expect(() => readDeterministicZip(corrupted)).toThrow(/CRC-32/);
  });

  it('serializa e relê um ZIP vazio', () => {
    const zip = createDeterministicZip([]);
    expect(readDeterministicZip(zip)).toEqual([]);
  });

  it('crc32 casa com o valor de referência conhecido', () => {
    // CRC-32 de "123456789" é 0xCBF43926 (vetor de teste canônico).
    expect(crc32(Buffer.from('123456789'))).toBe(0xcbf43926);
  });
});
