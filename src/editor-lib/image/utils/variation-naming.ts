/**
 * Utility for generating variation file names
 */

export function generateVariationFileName(
  originalFileName: string,
  variationIndex: number,
  variationType?: string
): string {
  // Remove extension
  const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, '');
  const extension = originalFileName.split('.').pop() || 'png';

  // Generate variation name
  const suffix = variationType ? `_${variationType}_${variationIndex}` : `_variation_${variationIndex}`;

  return `${nameWithoutExt}${suffix}.${extension}`;
}

export function parseVariationFileName(fileName: string): {
  originalName: string;
  variationIndex: number;
  variationType?: string;
} | null {
  const match = fileName.match(/^(.+?)_(?:([a-z]+)_)?(\d+)\.([^.]+)$/);

  if (!match) {
    return null;
  }

  const [, originalName, variationType, indexStr, extension] = match;

  return {
    originalName: `${originalName}.${extension}`,
    variationIndex: parseInt(indexStr, 10),
    variationType: variationType || undefined,
  };
}
