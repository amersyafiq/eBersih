import colors from "tailwindcss/colors";

export type ZoneColor = { fill: string; stroke: string; background: string };

const ZONE_PALETTE: ZoneColor[] = [
  { fill: colors.lime[200],    stroke: colors.lime[500],    background: colors.lime[50] },
  { fill: colors.amber[200],   stroke: colors.amber[500],   background: colors.amber[50] },
  { fill: colors.indigo[200],  stroke: colors.indigo[500],  background: colors.indigo[50] },
  { fill: colors.emerald[200], stroke: colors.emerald[500], background: colors.emerald[50] },
  { fill: colors.rose[200],    stroke: colors.rose[500],    background: colors.rose[50] },
  { fill: colors.sky[200],     stroke: colors.sky[500],     background: colors.sky[50] },
];

export const NO_ZONE_COLOR: ZoneColor = {
  fill: colors.white,
  stroke: colors.white,
  background: colors.white,
};

export function buildZoneColorMap(zones: { zoneCode: string }[]): Map<string, ZoneColor> {
  const map = new Map<string, ZoneColor>();

  [...zones]
    .sort((a, b) => a.zoneCode.localeCompare(b.zoneCode)) // stable order, independent of API ordering
    .forEach((zone, index) => {
      map.set(zone.zoneCode, ZONE_PALETTE[index % ZONE_PALETTE.length]); // wraps if >6 ever happens
    });

  return map;
}

export function getZoneColor(
  zoneCode: string | null,
  colorMap: Map<string, ZoneColor>
): ZoneColor {
  if (!zoneCode) return NO_ZONE_COLOR;
  return colorMap.get(zoneCode) ?? NO_ZONE_COLOR;
}