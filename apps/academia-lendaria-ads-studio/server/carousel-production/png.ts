/**
 * Utilitários PNG puros para o renderer de conteúdo-funil.
 *
 * O renderer produz PNGs 1080x1350; estas funções validam magic bytes e
 * dimensões diretamente dos bytes, sem depender de nenhuma biblioteca externa
 * nem tocar o disco. São a fronteira que impede que um asset corrompido ou de
 * dimensão errada entre no manifesto público.
 */

/** Assinatura de 8 bytes que abre todo arquivo PNG válido. */
export const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Largura canônica de um slide de carrossel de conteúdo-funil. */
export const CAROUSEL_SLIDE_WIDTH = 1080;
/** Altura canônica de um slide de carrossel de conteúdo-funil. */
export const CAROUSEL_SLIDE_HEIGHT = 1350;

export interface PngDimensions {
  width: number;
  height: number;
}

/**
 * Lê largura/altura do chunk IHDR, validando a assinatura e a presença do
 * cabeçalho. Lança se o buffer não for um PNG estruturalmente válido.
 */
export function readPngDimensions(buffer: Buffer): PngDimensions {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('O renderer de carrossel produziu um asset que não é PNG válido.');
  }
  // O IHDR é obrigatoriamente o primeiro chunk: 4 bytes de tamanho, 'IHDR', dados.
  if (buffer.subarray(12, 16).toString('latin1') !== 'IHDR') {
    throw new Error('PNG de carrossel sem chunk IHDR inicial.');
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

/**
 * Garante que o buffer é um PNG exatamente na dimensão esperada. Devolve as
 * dimensões lidas para reuso no manifesto.
 */
export function assertCarouselPng(
  buffer: Buffer,
  width = CAROUSEL_SLIDE_WIDTH,
  height = CAROUSEL_SLIDE_HEIGHT,
): PngDimensions {
  const dimensions = readPngDimensions(buffer);
  if (dimensions.width !== width || dimensions.height !== height) {
    throw new Error(
      `Slide de carrossel com dimensão inválida (${dimensions.width}x${dimensions.height}); esperado ${width}x${height}.`,
    );
  }
  return dimensions;
}
