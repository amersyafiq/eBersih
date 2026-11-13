"use client";

import { useMemo, useState } from "react";
import { useReactTable, getCoreRowModel, getExpandedRowModel, getFilteredRowModel, flexRender, type ColumnDef, type ExpandedState, type ColumnFiltersState, } from "@tanstack/react-table";

import { SearchIcon } from "@/src/components/common/header/icons";
import { Badge } from "@/src/components/tailgrids/core/badge";
import { Button } from "@/src/components/tailgrids/core/button";
import { Card, CardHeader, CardTitle } from "@/src/components/tailgrids/core/card";
import { InputGroup, InputGroupAddon, InputGroupInput, } from "@/src/components/tailgrids/core/input-group";
import { TableBody, TableCell, TableHead, TableHeader, TableRoot, TableRow, } from "@/src/components/tailgrids/core/table";
import { MenuDotsIcon } from "@/src/utils/icon";
import { DownloadIcon, FilterIcon } from "../icons";
import { FacilityLevel, FacilityTableProps } from "@/src/services/api/facility/types";
import { useFacilities } from "@/src/services/api/facility";
import { Spinner } from "@/src/components/tailgrids/core/spinner";
import { Toggle } from "@/src/components/tailgrids/core/toggle";
import { Select, SelectContent, SelectIndicator, SelectItem, SelectTrigger, SelectValue } from "@/src/components/tailgrids/core/select";
import { useCurrentUser } from "@/src/services/api/auth";


export default function FacilityTable() {
    const [expanded, setExpanded] = useState<ExpandedState>({}); // Start expanded (or {} for collapsed)
    const [globalFilter, setGlobalFilter] = useState("");
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [levelFilter, setLevelFilter] = useState<string>("ALL");

    const {data, isLoading} = useFacilities();
    const {data: user} = useCurrentUser();

    // Helper: Toggle `isActive` recursively in local state (or trigger your mutation API)
    const handleToggleActive = (targetId: string, checked: boolean) => {
        
    };

    const columns = useMemo<ColumnDef<FacilityTableProps>[]>(
        () => [
            // COLUMN 1: Indented Hierarchy Tree + Name
            {
                accessorKey: "name",
                header: "Facility Name",
                cell: ({ row }) => {
                    const item = row.original;
                    const canExpand = row.getCanExpand();

                    return (
                        <div
                            style={{ paddingLeft: `${row.depth * 24}px` }}
                            className="flex items-center gap-2"
                        >
                            {canExpand ? (
                                <button
                                    type="button"
                                    onClick={row.getToggleExpandedHandler()}
                                    className="flex size-6 shrink-0 items-center justify-center rounded-md border border-base-200 bg-background-white-primary text-gray-600 hover:bg-gray-100 transition"
                                >
                                    <svg
                                        className={`size-3.5 transition-transform duration-200 ${
                                            row.getIsExpanded() ? "rotate-90" : ""
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            ) : (
                                <span className="flex size-6 shrink-0 items-center justify-center text-gray-300">
                                    └
                                </span>
                            )}

                            <span
                                className={`font-medium text-wrap ${
                                    item.level === "building"
                                        ? "text-text-primary font-semibold"
                                        : "text-text-secondary"
                                }`}
                            >
                                {item.name}
                            </span>
                        </div>
                    );
                },
            },

            // COLUMN 2: Shared Code
            {
                accessorKey: "code",
                header: "Code",
                cell: ({ row }) => (
                    <span className="font-mono text-xs font-medium text-text-primary bg-background-gray-secondary px-2 py-1 rounded">
                        {row.original.code}
                    </span>
                ),
            },

            // COLUMN 3: Level Badge
            {
                accessorKey: "level",
                header: "Level",
                cell: ({ row }) => {
                    const level = row.original.level;
                    const badgeMap: Record<FacilityLevel, "primary" | "purple" | "sky" | "orange"> = {
                        building: "primary",
                        block: "purple",
                        floor: "sky",
                        space: "orange",
                    };
                    return (
                        <Badge color={badgeMap[level]} size="sm" className="uppercase">
                            {level}
                        </Badge>
                    );
                },
            },

            // COLUMN 4: SPECIFICATIONS
            {
                id: "specifications",
                header: "Details & Specifications",
                accessorFn: (row) =>
                    `${row.zoneCode ?? ""} ${row.zoneName ?? ""} ${row.spaceType ?? ""} ${row.taskGroupName ?? ""}`,
                cell: ({ row }) => {
                    const item = row.original;

                    if (item.level === "building") {
                        return (
                            <div className="flex items-center gap-2 text-xs">
                                <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700 border border-indigo-200">
                                    {item.zoneName}
                                </span>
                                <span className="text-gray-400">
                                    ({item.subRows?.length ?? 0} Blocks)
                                </span>
                            </div>
                        );
                    }

                    if (item.level === "block") {
                        return (
                            <span className="text-xs text-gray-500">
                                ({item.subRows?.length ?? 0} Floors)
                            </span>
                        );
                    }

                    if (item.level === "floor") {
                        return (
                            <span className="text-xs text-gray-500">
                                ({item.subRows?.length ?? 0} Spaces)
                            </span>
                        );
                    }

                    return (
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            {item.spaceType && (
                                <span className="rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
                                    {item.spaceType}
                                </span>
                            )}
                            {item.spaceArea !== undefined && (
                                <span className="rounded bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 border border-emerald-200">
                                    {item.spaceArea} m²
                                </span>
                            )}
                            {item.spaceEPU !== undefined && (
                                <span className="rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-700 border border-amber-200">
                                    EPU: {item.spaceEPU}
                                </span>
                            )}
                            {item.taskGroupName && (
                                <span className="text-gray-400 truncate max-w-[140px]">
                                    • {item.taskGroupName}
                                </span>
                            )}
                        </div>
                    );
                },
            },

            // COLUMN 5: Shared `Is Active` Checkbox
            {
                accessorKey: "isActive",
                header: () => <div className="text-center">Is Active</div>,
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex items-center justify-center gap-2">
                            <Toggle
                                defaultChecked={item.isActive}
                                onChange={(e) => handleToggleActive(item.id, e.target.checked)}
                            />
                        </div>
                    );
                },
            },

            // COLUMN 6: Action Menu
            {
                id: "actions",
                header: () => <div className="flex items-center justify-center">Action</div>,
                cell: () => (
                    <div className="flex items-center justify-center">
                        <Button
                            appearance="outline"
                            className="h-7.5 w-8 rounded-lg border-none p-1.5 text-icon-secondary shadow-xs"
                        >
                            <MenuDotsIcon />
                        </Button>
                    </div>
                ),
            },
        ],
        []
    );

    const table = useReactTable({
        data,
        columns,
        state: {
            expanded,
            globalFilter,
            columnFilters,
        },
        onExpandedChange: setExpanded,
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        getSubRows: (row) => row.subRows,
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        filterFromLeafRows: true,
    });

    return (
        <Card>
            {/* Header with Working Search & Expand Controls */}
            <CardHeader className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <CardTitle>{user?.campus?.CampusName} Facility</CardTitle>
                    <Button
                        appearance="outline"
                        className="h-8 px-2.5 text-xs font-medium text-text-secondary"
                        onClick={() => table.toggleAllRowsExpanded(!table.getIsAllRowsExpanded())}
                    >
                        {table.getIsAllRowsExpanded() ? "Collapse All" : "Expand All"}
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Search Input (Searches Name, Code, Zone, Space Type, etc.) */}
                    <InputGroup className="h-9">
                        <InputGroupAddon align="inline-start" className="pr-0 text-icon-tertiary">
                            <SearchIcon className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput
                            placeholder="Search building, space code, zone..."
                            value={globalFilter ?? ""}
                            onChange={(e) => {
                                setGlobalFilter(e.target.value);
                                // Automatically expand all rows when searching so user sees matches
                                if (e.target.value) table.toggleAllRowsExpanded(true);
                            }}
                            className="pl-2 text-sm"
                        />
                    </InputGroup>

                    {/* Quick Level Filter */}
                    <Select
                        aria-label="Filter by facility level"
                        value={levelFilter}
                        onChange={(key) => {
                            const val = String(key);
                            setLevelFilter(val);
                            table.getColumn("level")?.setFilterValue(val === "ALL" ? undefined : val);
                            if (val !== "ALL") {
                                table.toggleAllRowsExpanded(true);
                            } else {
                                setExpanded({});
                            }
                        }}
                        className="w-40"
                    >
                        <SelectTrigger className="h-9 rounded-lg border border-button-primary-outline-stroke bg-button-primary-outline-background px-2.5 py-1.5 text-xs font-medium text-text-secondary">
                            <SelectValue />
                            <SelectIndicator />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem id="ALL">All Levels</SelectItem>
                            <SelectItem id="building">Buildings Only</SelectItem>
                            <SelectItem id="block">Blocks Only</SelectItem>
                            <SelectItem id="floor">Floors Only</SelectItem>
                            <SelectItem id="space">Spaces Only</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button appearance="outline" className="h-8 w-8 p-1.5 text-icon-tertiary">
                        <FilterIcon />
                    </Button>
                    <Button appearance="outline" className="h-8 w-8 p-1.5 text-icon-tertiary">
                        <DownloadIcon />
                    </Button>
                </div>
            </CardHeader>

            <div className="overflow-x-auto">
                {isLoading ? (
                    <div className="flex h-80 w-full items-center justify-center">
                        <Spinner />
                    </div>
                ) : (
                    <TableRoot className="w-full min-w-200 rounded-none border-none">
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="[&_th]:border-t">
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            className="px-6 py-2.5 text-xs leading-4 font-semibold whitespace-nowrap text-text-secondary"
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>

                        <TableBody>
                            {table.getRowModel().rows.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="px-6 py-8 text-center text-sm text-text-secondary"
                                    >
                                        No matching facilities found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        className="[&_td]:border-none transition-colors"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell
                                                key={cell.id}
                                                className="px-6 py-3.5 text-sm leading-5 whitespace-nowrap"
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </TableRoot>
                )}
            </div>
        </Card>
    );
}
