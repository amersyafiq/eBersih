"use client";
import Image from 'next/image';
import { useMemo, useState } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getExpandedRowModel,
    flexRender,
    type ColumnDef,
    type ExpandedState,
} from "@tanstack/react-table";
import { CleanerNode, FacilityNode, BuildingDetailsProps } from "../types";
import { useBuildingDetails } from "@/src/services/api/live";
import { Spinner } from '@/src/components/tailgrids/core/spinner';
import { cn } from '@/src/utils/cn';

// Helper: Recursively compute completed & total tasks for any Facility node level
function getNodeProgress(node: FacilityNode): { completed: number; total: number; percentage: number } {
    if (node.type === "task") {
        const completed = node.status === "Completed" ? 1 : 0;
        return { completed, total: 1, percentage: completed * 100 };
    }

    if (!node.subRows || node.subRows.length === 0) {
        return { completed: 0, total: 0, percentage: 0 };
    }

    let completed = 0;
    let total = 0;
    for (const child of node.subRows) {
        const childStats = getNodeProgress(child);
        completed += childStats.completed;
        total += childStats.total;
    }

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
}

export default function BuildingDetails({
    buildingCode,
    buildingName,
    scheduleDate,
    onClose,
}: BuildingDetailsProps) {
    const [mode, setMode] = useState<"facility" | "cleaner">("facility");
    const [facilityExpanded, setFacilityExpanded] = useState<ExpandedState>({});
    const [cleanerExpanded, setCleanerExpanded] = useState<ExpandedState>({});

    const { data, isLoading, isError } = useBuildingDetails(buildingCode, scheduleDate);
    const facilityData = useMemo(() => data?.facilityData ?? [], [data?.facilityData])
    const cleanerData = useMemo(() => data?.cleanerData ?? [], [data?.cleanerData])

    const facilityColumns = useMemo<ColumnDef<FacilityNode>[]>(
        () => [
            {
                id: "hierarchy",
                header: "Facility / Task",
                meta: { className: 'w-3/4' },
                cell: ({ row }) => {
                    const node = row.original;
                    const canExpand = row.getCanExpand();
                    const isTask = node.type === "task";

                    const badgeColor: Record<FacilityNode["type"], string> = {
                        block: "bg-indigo-50 text-indigo-700 border-indigo-200",
                        floor: "bg-sky-50 text-sky-700 border-sky-200",
                        space: "bg-amber-50 text-amber-700 border-amber-200",
                        task: "bg-gray-50 text-gray-600 border-gray-200",
                    };

                    return (
                        <div
                            style={{ paddingLeft: `${row.depth * 14}px` }}
                            className="flex items-center gap-1.5 py-1"
                        >
                            {canExpand ? (
                                <button
                                    type="button"
                                    onClick={row.getToggleExpandedHandler()}
                                    className="flex size-5 shrink-0 items-center justify-center rounded hover:bg-gray-200 text-gray-500 transition"
                                >
                                    <svg
                                        className={`size-3.5 transition-transform duration-200 ${row.getIsExpanded() ? "rotate-90" : ""
                                            }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            ) : (
                                <span className="size-5 shrink-0 flex items-center justify-center text-gray-300">•</span>
                            )}

                            <span
                                className={`text-[10px] uppercase px-1.5 py-0.5 rounded border font-semibold shrink-0 ${badgeColor[node.type]
                                    }`}
                            >
                                {node.type}
                            </span>

                            <div className="flex flex-col min-w-0">
                                <span className={`${isTask ? "text-xs font-normal text-gray-700" : "text-xs font-semibold text-gray-900"}`}>
                                    {node.name}
                                </span>
                                {node.code && !isTask && (
                                    <span className="text-[10px] text-gray-400 leading-none">{node.code}</span>
                                )}
                            </div>
                        </div>
                    );
                },
            },
            {
                id: "progress",
                header: () => <div className="text-right">Status</div>,
                meta: { className: 'w-1/4' },
                cell: ({ row }) => {
                    const node = row.original;

                    // Leaf Node (Task): Show Completed / Pending badge
                    if (node.type === "task") {
                        const isDone = node.status === "Completed";
                        return (
                            <div className="flex justify-end">
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${isDone
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                            : "bg-amber-50 text-amber-700 border border-amber-200"
                                        }`}
                                >
                                    <span className={`size-1.5 rounded-full ${isDone ? "bg-emerald-500" : "bg-amber-500"}`} />
                                    {node.status ?? "Pending"}
                                </span>
                            </div>
                        );
                    }

                    // Group Node (Block / Floor / Space): Show % Completion + Mini Progress Bar
                    const { completed, total, percentage } = getNodeProgress(node);
                    return (
                        <div className="flex flex-col items-end gap-1 min-w-[72px]">
                            <div className="flex items-center gap-1 text-xs">
                                <span className="font-semibold text-gray-800">{percentage}%</span>
                                <span className="text-[10px] text-gray-400">
                                    ({completed}/{total})
                                </span>
                            </div>
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${percentage === 100 ? "bg-emerald-500" : "bg-blue-500"
                                        }`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                },
            },
        ],
        []
    );

    const cleanerColumns = useMemo<ColumnDef<CleanerNode>[]>(
        () => [
            {
                id: "cleanerOrTask",
                header: "Cleaner / Assignment",
                meta: { className: 'w-3/4' },
                cell: ({ row }) => {
                    const node = row.original;
                    const canExpand = row.getCanExpand();

                    if (node.type === "cleaner") {
                        return (
                            <div className="flex items-start gap-1.5 py-1">
                                {canExpand ? (
                                    <button
                                        type="button"
                                        onClick={row.getToggleExpandedHandler()}
                                        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded hover:bg-gray-200 text-gray-500 transition"
                                    >
                                        <svg
                                            className={`size-3.5 transition-transform duration-200 ${row.getIsExpanded() ? "rotate-90" : ""
                                                }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                ) : (
                                    <span className="size-5 shrink-0" />
                                )}

                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-semibold text-gray-900 truncate">
                                        {node.cleanerName}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                        <span className="truncate">{node.category}</span>
                                        <span>•</span>
                                        <span className="truncate text-gray-400">{node.company}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // Child row: Assignment details
                    return (
                        <div className="pl-7 flex flex-col py-0.5">
                            <span className="text-xs font-medium text-gray-800">{node.taskName}</span>
                            <span className="text-[11px] text-gray-400">
                                {node.spaceCode} — {node.spaceName}
                            </span>
                        </div>
                    );
                },
            },
            {
                id: "status",
                header: () => <div className="text-right">Progress</div>,
                meta: { className: 'w-1/4' },
                cell: ({ row }) => {
                    const node = row.original;

                    if (node.type === "cleaner") {
                        const assignments = node.subRows ?? [];
                        const total = assignments.length;
                        const completed = assignments.filter((a) => a.status === "Completed").length;
                        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

                        return (
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-xs font-semibold text-gray-800">
                                    {completed}/{total} ({pct}%)
                                </span>
                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${pct === 100 ? "bg-emerald-500" : "bg-blue-500"}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    }

                    const isDone = node.status === "Completed";
                    return (
                        <div className="flex justify-end">
                            <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${isDone
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-amber-50 text-amber-700 border border-amber-200"
                                    }`}
                            >
                                {node.status ?? "Pending"}
                            </span>
                        </div>
                    );
                },
            },
        ],
        []
    );

    const facilityTable = useReactTable({
        data: facilityData,
        columns: facilityColumns,
        state: { expanded: facilityExpanded },
        onExpandedChange: setFacilityExpanded,
        getSubRows: (row) => row.subRows,
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
    });

    const cleanerTable = useReactTable({
        data: cleanerData,
        columns: cleanerColumns,
        state: { expanded: cleanerExpanded },
        onExpandedChange: setCleanerExpanded,
        getSubRows: (row) => row.subRows,
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
    });

    if (!buildingCode) return null;

    const activeTable = mode === "facility" ? facilityTable : cleanerTable;

    return (
        <div className="absolute z-20 top-5 bottom-5 right-5 w-95 bg-white/95 backdrop-blur-md shadow-xl flex flex-col rounded-2xl border border-base-200 text-sm font-medium text-text-100 overflow-hidden">
            <div className="relative w-full">
                <Image
                    src="/images/building_image.jpg"
                    alt="Building Details Header"
                    fill
                    sizes="400px"
                    priority
                    className="absolute top-0 object-cover rounded-t-2xl opacity-20 pointer-events-none [mask-image:linear-gradient(to_bottom,black_0%,black_20%,rgba(0,0,0,0.5)_65%,transparent_100%)]"
                />

                {/* 1. Header */}
                <div className="flex items-start justify-between gap-2 px-4 py-3 relative z-10">
                    <div className="min-w-0">
                        <span className="text-[11px] font-normal uppercase tracking-wider text-black">
                            {buildingCode} • {scheduleDate}
                        </span>
                        <h2 className="text-base font-bold text-gray-900 truncate">{buildingName}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                        aria-label="Close panel"
                    >
                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 2. Mode Stepper / Segmented Control */}
                <div className="px-4 pt-3 pb-2 relative z-10 shadow-xl">
                    <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setMode("facility")}
                            className={`rounded-lg py-1.5 transition-all ${mode === "facility"
                                    ? "bg-white text-gray-900 shadow-xs"
                                    : "text-gray-500 hover:text-gray-800"
                                }`}
                        >
                            By Facility
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("cleaner")}
                            className={`rounded-lg py-1.5 transition-all ${mode === "cleaner"
                                    ? "bg-white text-gray-900 shadow-xs"
                                    : "text-gray-500 hover:text-gray-800"
                                }`}
                        >
                            By Cleaner
                        </button>
                    </div>
                </div>
            </div>


            {/* 3. Expand / Collapse All Quick Bar */}
            <div className="flex items-center justify-between px-4 py-1.5 text-[11px] text-gray-500 border-b border-gray-100">
                <span>
                    {mode === "facility" ? "Block → Floor → Space → Task" : "Cleaner → Assigned Tasks"}
                </span>
                <button
                    type="button"
                    onClick={() => activeTable.toggleAllRowsExpanded(!activeTable.getIsAllRowsExpanded())}
                    className="text-blue-600 hover:underline font-medium"
                >
                    {activeTable.getIsAllRowsExpanded() ? "Collapse All" : "Expand All"}
                </button>
            </div>

            {/* 4. Scrollable Hierarchical Table */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <Spinner className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                ) : (
                    <table className="w-full border-collapse table-fixed">
                        <thead>
                            {activeTable.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="border-b border-gray-100 text-[11px] uppercase text-gray-400">
                                    {headerGroup.headers.map((header) => (
                                        <th key={header.id} className={cn("pb-2 text-left font-semibold", header.column.columnDef.meta?.className)}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {activeTable.getRowModel().rows.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="py-8 text-center text-xs text-gray-400 italic">
                                        No records found for this building.
                                    </td>
                                </tr>
                            ) : (
                                activeTable.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className={`transition-colors hover:bg-gray-50/80 ${row.depth > 0 ? "bg-gray-50/40" : ""
                                            }`}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className={cn("py-1.5 align-middle", cell.column.columnDef.meta?.className)}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}