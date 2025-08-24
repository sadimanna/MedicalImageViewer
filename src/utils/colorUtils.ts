/**
 * Get a color for a label value based on a predefined palette
 * @param label - The label value (1-based index)
 * @returns RGB color tuple [r, g, b]
 */
export const getLabelColor = (label: number): [number, number, number] => {
  const palette: [number, number, number][] = [
    [230, 25, 75],    // Red
    [60, 180, 75],    // Green
    [255, 225, 25],   // Yellow
    [0, 130, 200],    // Blue
    [245, 130, 48],   // Orange
    [145, 30, 180],   // Purple
    [70, 240, 240],   // Cyan
    [240, 50, 230],   // Magenta
    [210, 245, 60],   // Lime
    [250, 190, 190],  // Pink
    [0, 128, 128],    // Teal
    [230, 190, 255],  // Lavender
    [170, 110, 40],   // Brown
    [255, 250, 200],  // Beige
    [128, 0, 0],      // Maroon
    [170, 255, 195],  // Mint
    [128, 128, 0],    // Olive
    [255, 215, 180],  // Apricot
    [0, 0, 128],      // Navy
    [255, 105, 180],  // Hot Pink
  ];
  if (label <= 0) return [0, 0, 0];
  return palette[(label - 1) % palette.length];
}; 