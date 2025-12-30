/**
 * Get polygon vertex coordinates
 * @param edges Number of edges
 * @param radius Radius
 * @returns Array of coordinates
 */
const getPolygonVertices = (edges: number, radius: number) => {
  const vertices = [];
  const interiorAngle = (Math.PI * 2) / edges;
  let rotationAdjustment = -Math.PI / 2;
  if (edges % 2 === 0) {
    rotationAdjustment += interiorAngle / 2;
  }
  for (let i = 0; i < edges; i++) {
    // Calculate vertex coordinates from circle
    const rad = i * interiorAngle + rotationAdjustment;
    vertices.push({
      x: Math.cos(rad) * radius,
      y: Math.sin(rad) * radius,
    });
  }
  return vertices;
};

export { getPolygonVertices };
