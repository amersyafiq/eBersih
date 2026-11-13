"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useReactTable, getCoreRowModel, getExpandedRowModel, getFilteredRowModel, flexRender, type ColumnDef, type ExpandedState, type ColumnFiltersState, } from "@tanstack/react-table";

import { SearchIcon } from "@/src/components/common/header/icons";
import { Badge } from "@/src/components/tailgrids/core/badge";
import { Button } from "@/src/components/tailgrids/core/button";
import { Card, CardHeader, CardTitle } from "@/src/components/tailgrids/core/card";
import { InputGroup, InputGroupAddon, InputGroupInput, } from "@/src/components/tailgrids/core/input-group";
import { TableBody, TableCell, TableHead, TableHeader, TableRoot, TableRow, } from "@/src/components/tailgrids/core/table";
import { Spinner } from "@/src/components/tailgrids/core/spinner";
import { Toggle } from "@/src/components/tailgrids/core/toggle";
import { Select, SelectContent, SelectIndicator, SelectItem, SelectTrigger, SelectValue, } from "@/src/components/tailgrids/core/select";

import { useContractorDetails } from "@/src/services/api/contractor";
import { ContractorTreeLevel, ContractorTreeNode, } from "@/src/services/api/contractor/types";
import { getIdBySlug } from "@/src/utils/slug";

const EMPTY_TREE: ContractorTreeNode[] = [];

export default function ContractorViewPage() {
    const params = useParams<{ slug: string }>();
    const router = useRouter();
    const companyID = getIdBySlug(params?.slug);

    const { data, isLoading } = useContractorDetails(companyID);

    // Table states (Start expanded so user sees Zones & Cleaners immediately)
    const [expanded, setExpanded] = useState<ExpandedState>(true);
    const [globalFilter, setGlobalFilter] = useState("");
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [levelFilter, setLevelFilter] = useState<string>("ALL");

    const handleToggleActive = (id: string, level: ContractorTreeLevel, checked: boolean) => {
        console.log(`Toggle ${level} (${id}) active:`, checked);
        // TODO: Call PATCH mutation to update Zone or Cleaner status
    };

    const columns = useMemo<ColumnDef<ContractorTreeNode>[]>(
        () => [
            // COLUMN 1: Hierarchy Name (Zone Name or Cleaner Name)
            {
                accessorKey: "name",
                header: "Zone / Cleaner Name",
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
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>
                            ) : (
                                <span className="flex size-6 shrink-0 items-center justify-center text-gray-300">
                                    └
                                </span>
                            )}

                            <span
                                className={`font-medium text-wrap ${
                                    item.level === "zone"
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

            // COLUMN 2: Code (Zone Code or Cleaner Staff ID)
            {
                accessorKey: "code",
                header: "Code / Staff ID",
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
                    return (
                        <Badge
                            color={level === "zone" ? "primary" : "purple"}
                            size="sm"
                            className="uppercase"
                        >
                            {level}
                        </Badge>
                    );
                },
            },

            // COLUMN 4: Polymorphic Details (Building/Cleaner count for Zone; Category/Phone for Cleaner)
            {
                id: "details",
                header: "Details & Specifications",
                accessorFn: (row) =>
                    `${row.cleanerCategory ?? ""} ${row.phone ?? ""} ${row.icNumber ?? ""}`,
                cell: ({ row }) => {
                    const item = row.original;

                    if (item.level === "zone") {
                        return (
                            <div className="flex items-center gap-2 text-xs">
                                <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700 border border-indigo-200">
                                    {item.buildingCount ?? 0} Buildings
                                </span>
                                <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 border border-emerald-200">
                                    {item.cleanerCount ?? 0} Cleaners Assigned
                                </span>
                            </div>
                        );
                    }

                    // Cleaner row specifications
                    return (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            {item.cleanerCategory && (
                                <span className="rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-700 border border-amber-200">
                                    Role: {item.cleanerCategory}
                                </span>
                            )}
                            {item.phone && (
                                <span className="text-text-secondary">
                                    {item.phone}
                                </span>
                            )}
                            {item.icNumber && (
                                <span className="font-mono text-gray-400">
                                    • IC: {item.icNumber}
                                </span>
                            )}
                        </div>
                    );
                },
            },

            // COLUMN 5: Is Active Toggle
            {
                accessorKey: "isActive",
                header: () => <div className="text-center">Is Active</div>,
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex items-center justify-center">
                            <Toggle
                                defaultChecked={item.isActive}
                                onChange={(e) =>
                                    handleToggleActive(item.id, item.level, e.target.checked)
                                }
                            />
                        </div>
                    );
                },
            },
        ],
        []
    );

    const table = useReactTable({
        data: data?.zonesTree ?? EMPTY_TREE,
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

    if (isLoading) {
        return (
            <div className="flex h-96 w-full items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (!data) {
        return (
            <Card className="p-8 text-center">
                <p className="text-sm text-text-secondary">Contractor company not found.</p>
                <Button
                    appearance="outline"
                    onClick={() => router.push("/contractor")}
                    className="mt-4"
                >
                    Back to Contractors
                </Button>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* ================================================================
                1. TOP SECTION: COMPANY PROFILE & KPI SUMMARY CARD
               ================================================================ */}
            <Card className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-card-border pb-5">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <Button
                                appearance="outline"
                                onClick={() => router.push("/contractor")}
                                className="h-8 px-2.5 text-xs font-medium text-text-secondary"
                            >
                                ← Back
                            </Button>
                            <span className="font-mono text-xs font-semibold bg-background-gray-secondary px-2.5 py-1 rounded text-text-primary">
                                {data.code}
                            </span>
                            <Badge color={data.isActive ? "success" : "error"} size="sm">
                                {data.isActive ? "Active Contractor" : "Inactive"}
                            </Badge>
                        </div>
                        <h1 className="text-xl font-bold text-text-primary pt-1">
                            {data.name}
                        </h1>
                    </div>

                    {/* KPI Pills */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="rounded-xl border border-card-border bg-background-gray-secondary/50 px-4 py-2.5 text-center">
                            <p className="text-xs text-text-tertiary">Assigned Zones</p>
                            <p className="text-lg font-bold text-text-primary">
                                {data.totalZones}
                            </p>
                        </div>
                        <div className="rounded-xl border border-card-border bg-background-gray-secondary/50 px-4 py-2.5 text-center">
                            <p className="text-xs text-text-tertiary">Buildings Covered</p>
                            <p className="text-lg font-bold text-text-primary">
                                {data.totalBuildings}
                            </p>
                        </div>
                        <div className="rounded-xl border border-card-border bg-background-gray-secondary/50 px-4 py-2.5 text-center">
                            <p className="text-xs text-text-tertiary">Total Cleaners</p>
                            <p className="text-lg font-bold text-text-primary">
                                {data.totalCleaners}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Company Contact Info Grid */}
                <div className="grid grid-cols-1 gap-4 pt-5 sm:grid-cols-3 text-sm">
                    <div>
                        <p className="text-xs font-medium text-text-tertiary">
                            Person in Charge (PIC)
                        </p>
                        <p className="mt-0.5 font-medium text-text-primary">
                            {data.contactPerson || "Not specified"}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-text-tertiary">
                            Contact Number
                        </p>
                        <p className="mt-0.5 font-medium text-text-primary">
                            {data.phone || "Not specified"}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-text-tertiary">
                            Official Email
                        </p>
                        <p className="mt-0.5 font-medium text-text-primary">
                            {data.email || "Not specified"}
                        </p>
                    </div>
                </div>
            </Card>

            {/* ================================================================
                2. BOTTOM SECTION: ZONES & CLEANERS HIERARCHY TABLE
               ================================================================ */}
            <Card>
                <CardHeader className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <CardTitle>Assigned Zones & Cleaners</CardTitle>
                        <Button
                            appearance="outline"
                            className="h-8 px-2.5 text-xs font-medium text-text-secondary"
                            onClick={() =>
                                table.toggleAllRowsExpanded(!table.getIsAllRowsExpanded())
                            }
                        >
                            {table.getIsAllRowsExpanded() ? "Collapse All" : "Expand All"}
                        </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Search Input */}
                        <InputGroup className="h-9">
                            <InputGroupAddon
                                align="inline-start"
                                className="pr-0 text-icon-tertiary"
                            >
                                <SearchIcon className="size-4" />
                            </InputGroupAddon>
                            <InputGroupInput
                                placeholder="Search zone, cleaner name, role..."
                                value={globalFilter ?? ""}
                                onChange={(e) => {
                                    setGlobalFilter(e.target.value);
                                    if (e.target.value) table.toggleAllRowsExpanded(true);
                                }}
                                className="pl-2 text-sm"
                            />
                        </InputGroup>

                        {/* Quick Level Filter */}
                        <Select
                            aria-label="Filter by level"
                            value={levelFilter}
                            onChange={(key) => {
                                const val = String(key);
                                setLevelFilter(val);
                                table
                                    .getColumn("level")
                                    ?.setFilterValue(val === "ALL" ? undefined : val);
                                if (val !== "ALL") {
                                    table.toggleAllRowsExpanded(true);
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
                                <SelectItem id="zone">Zones Only</SelectItem>
                                <SelectItem id="cleaner">Cleaners Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>

                <div className="overflow-x-auto">
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
                                        No zones or cleaners assigned to this contractor yet.
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
                </div>
            </Card>
        </div>
    );
}
