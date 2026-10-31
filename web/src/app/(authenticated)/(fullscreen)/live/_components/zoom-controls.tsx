"use client";

import { MinusIcon, PlusIcon } from "@/src/utils/icon";
import { useMap } from "react-leaflet";

export default function ZoomControls() {
    const map = useMap();

    return (
        <div className="absolute left-5 top-20 z-999 flex flex-col divide-y divide-border-secondary overflow-hidden rounded-md border border-border-secondary bg-background-white-primary">
            {[
                { label: <PlusIcon />, action: () => map.zoomIn() },
                { label: <MinusIcon />, action: () => map.zoomOut() },
            ].map(({ label, action }, index) => (
                <button
                    key={index}
                    onClick={action}
                    className="flex size-8.5 items-center justify-center text-text-secondary transition-all duration-300 hover:bg-button-primary-outline-hover-background [&>svg]:bg-transparent!"
                >
                    {label}
                </button>
            ))}
        </div>
    );
}
