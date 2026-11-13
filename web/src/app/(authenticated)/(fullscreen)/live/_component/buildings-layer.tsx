"use client";

import L, { CRS, point, type Layer, type LeafletMouseEvent, type PathOptions } from "leaflet";
import { useMemo, useRef, type Dispatch, type RefObject, type SetStateAction } from "react";
import { GeoJSON } from "react-leaflet";
import { getZoneColor, type ZoneColor } from "@/src/utils/zoneColors";
import type { BuildingFeature, SelectedBuilding } from "../types";
import type { TooltipState } from "./building-tooltip";
import { StatusProps } from "@/src/services/api/live/types";

const highlightStyle: PathOptions = {
    weight: 3,
    className: "shadow-xl",
};

const nonHighlightStyle: PathOptions = {
    weight: 0.8,
    className: "",
};

function getBuildingStyle(
    feature: BuildingFeature | undefined,
    zoneColorMap: Map<string, ZoneColor>,
): PathOptions {
    const zoneCode = feature?.properties?.layer ?? null;
    const { fill, stroke } = getZoneColor(zoneCode, zoneColorMap);

    return {
        fillColor: fill,
        fillOpacity: 1,
        color: stroke,
        weight: 0.8,
    };
}

export default function BuildingsLayer({
    geoData,
    zoneColorMap,
    setTooltip,
    containerRef,
    buildingStatus,
    setSelectedBuilding,
}: {
    geoData: GeoJSON.FeatureCollection;
    zoneColorMap: Map<string, ZoneColor>;
    setTooltip: Dispatch<SetStateAction<TooltipState>>;
    containerRef: RefObject<HTMLDivElement | null>;
    buildingStatus?: StatusProps[];
    setSelectedBuilding: Dispatch<SetStateAction<SelectedBuilding | null>>;
}) {
    const activeLayerRef = useRef<Layer | null>(null);
    const style = useMemo(
        () => (feature: GeoJSON.Feature | undefined) =>
            getBuildingStyle(feature as BuildingFeature | undefined, zoneColorMap),
        [zoneColorMap],
    );

    function onEachFeature(feature: BuildingFeature, layer: Layer) {
        const name = feature.properties?.name ?? "Unknown";
        const code = feature.properties?.building;
        const path = layer as L.Path;

        layer.on({
            mouseover(e: LeafletMouseEvent) {
                path.setStyle(highlightStyle);
                const rect = containerRef.current?.getBoundingClientRect();
                const x = e.originalEvent.clientX - (rect?.left ?? 0);
                const y = e.originalEvent.clientY - (rect?.top ?? 0);

                const code = feature.properties?.building
                const status = buildingStatus?.find(b => b.BuildingCode === code);
                setTooltip({ visible: true, x, y, name, status });
            },
            mousemove(e: LeafletMouseEvent) {
                const rect = containerRef.current?.getBoundingClientRect();
                const x = e.originalEvent.clientX - (rect?.left ?? 0);
                const y = e.originalEvent.clientY - (rect?.top ?? 0);
                setTooltip((prev) => ({ ...prev, x, y }));
            },
            mouseout() {
                if (activeLayerRef.current !== layer) {
                    path.setStyle(nonHighlightStyle);
                }
                setTooltip((prev) => ({ ...prev, visible: false }));
            },
            click() {
                if (activeLayerRef.current && activeLayerRef.current !== layer) {
                    (activeLayerRef.current as L.Path).setStyle(nonHighlightStyle);
                }
                activeLayerRef.current = layer;
                path.setStyle(highlightStyle);
                setSelectedBuilding({ code, name });
            },
        });
    }

    return (
        <GeoJSON
            data={geoData}
            style={style}
            onEachFeature={onEachFeature}
            coordsToLatLng={(coords) => CRS.EPSG3857.unproject(point(coords[0], coords[1]))}
        />
    );
}
