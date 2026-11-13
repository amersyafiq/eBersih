"use client";

import { CRS, point } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import type { ZoneColor } from "@/src/utils/zoneColors";
import type { TooltipState } from "./building-tooltip";
import BuildingsLayer from "./buildings-layer";
import ZoomControls from "./zoom-controls";
import { StatusProps } from "@/src/services/api/live/types";
import { SelectedBuilding } from "../types";
import { useTheme } from "next-themes";

const boundaryStyle = {
    color: "#9ca3af",
    weight: 2,
    dashArray: "6, 6",
    fillColor: "#9ca3af",
    fillOpacity: 0.05,
};

export default function MapCanvas({
    geoData,
    boundaryData,
    zoneColorMap,
    containerRef,
    setTooltip,
    buildingStatus,
    setSelectedBuilding,
}: {
    geoData: GeoJSON.FeatureCollection | null;
    boundaryData: GeoJSON.FeatureCollection | null;
    zoneColorMap: Map<string, ZoneColor>;
    containerRef: RefObject<HTMLDivElement | null>;
    setTooltip: Dispatch<SetStateAction<TooltipState>>;
    buildingStatus?: StatusProps[];
    setSelectedBuilding: Dispatch<SetStateAction<SelectedBuilding | null>>;
}) {
    const { theme } = useTheme();
    return (
        <MapContainer
            center={[3.07, 101.5]}
            zoom={16.5}
            scrollWheelZoom
            zoomControl={false}
            attributionControl={false}
            className="h-full! w-full! rounded-xl bg-card-background! z-10"
        >
            {geoData && (
                <BuildingsLayer
                    geoData={geoData}
                    zoneColorMap={zoneColorMap}
                    setTooltip={setTooltip}
                    containerRef={containerRef}
                    buildingStatus={buildingStatus}
                    setSelectedBuilding={setSelectedBuilding}
                />
            )}

            {boundaryData && (
                <GeoJSON
                    data={boundaryData}
                    style={boundaryStyle}
                    coordsToLatLng={(coords) => CRS.EPSG3857.unproject(point(coords[0], coords[1]))}
                />
            )}

            { theme === 'dark' ? (
                <TileLayer
                    url="https://basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}.png?key=cb1_49k8_1_7825c5d39a380286b4681ec7"
                    attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
                />
            ):(
                <TileLayer
                    url="https://basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}.png?key=cb1_49k8_1_7825c5d39a380286b4681ec7"
                    attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
                />
            )}
            <ZoomControls />
        </MapContainer>
    );
}
