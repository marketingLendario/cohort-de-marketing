import { deflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import {
  assertCarouselPng,
  CAROUSEL_SLIDE_HEIGHT,
  CAROUSEL_SLIDE_WIDTH,
  PNG_SIGNATURE,
  readPngDimensions,
} from './png.js';
import { crc32 } from './zip.js';

/** Constrói um PNG grayscale 8-bit válido de dimensão arbitrária (sem navegador). */
export function makePng(width: number, height: number, fill = 0): Buffer {
  const chunk = (type: string, data: Buffer): Buffer => {
    const typeBuffer = Buffer.from(type, 'latin1');
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
    return Buffer.concat([length, typeBuffer, data, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // color type: grayscale
  const rowLength = width + 1; // 1 byte de filtro por scanline
  const raw = Buffer.alloc(rowLength * height, fill);
  for (let y = 0; y < height; y += 1) raw[y * rowLength] = 0; // filtro "none"
  return Buffer.concat([
    PNG_SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

describe('png utilities', () => {
  it('lê as dimensões do IHDR de um PNG válido', () => {
    const png = makePng(CAROUSEL_SLIDE_WIDTH, CAROUSEL_SLIDE_HEIGHT);
    expect(readPngDimensions(png)).toEqual({ width: 1080, height: 1350 });
  });

  it('aceita o slide canônico 1080x1350', () => {
    const png = makePng(CAROUSEL_SLIDE_WIDTH, CAROUSEL_SLIDE_HEIGHT, 200);
    expect(assertCarouselPng(png)).toEqual({ width: 1080, height: 1350 });
  });

  it('rejeita buffers que não são PNG', () => {
    expect(() => readPngDimensions(Buffer.from('not a png at all'))).toThrow(/não é PNG válido/);
  });

  it('rejeita PNG com dimensão fora do padrão do carrossel', () => {
    const square = makePng(1080, 1080);
    expect(() => assertCarouselPng(square)).toThrow(/dimensão inválida/);
  });

  it('rejeita buffers truncados', () => {
    const png = makePng(1080, 1350);
    expect(() => readPngDimensions(png.subarray(0, 16))).toThrow(/não é PNG válido/);
  });
});
