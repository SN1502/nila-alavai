/**
 * Plot-area geometry. All inputs share one length unit; results are in the
 * square of that unit.
 */

export function rectangleArea(length, breadth) {
  return length * breadth;
}

/** Heron's formula. Returns null when the three sides can't close a triangle. */
export function triangleArea(a, b, c) {
  if (!(a > 0 && b > 0 && c > 0)) return null;
  if (a + b <= c || a + c <= b || b + c <= a) return null;
  const s = (a + b + c) / 2;
  const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
  return Number.isFinite(area) ? area : null;
}

/**
 * Four-sided plot measured the way surveyors do: four sides plus one
 * diagonal, which splits it into two triangles.
 * Triangle 1 = sides A, B and the diagonal; triangle 2 = sides C, D and the diagonal.
 * Returns { area, t1, t2 } or null with the triangle that failed.
 */
export function quadrilateralArea(a, b, c, d, diagonal) {
  const t1 = triangleArea(a, b, diagonal);
  const t2 = triangleArea(c, d, diagonal);
  if (t1 == null || t2 == null) {
    return { area: null, failed: t1 == null ? 1 : 2 };
  }
  return { area: t1 + t2, t1, t2, failed: 0 };
}
