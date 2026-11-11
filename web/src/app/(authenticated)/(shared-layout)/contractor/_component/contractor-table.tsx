"use client";

import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { useReactTable, getCoreRowModel, getFilteredRowModel, flexRender, type ColumnDef, type ColumnFiltersState, } from "@tanstack/react-table";

import { SearchIcon } from "@/src/components/common/header/icons";
import { Badge } from "@/src/components/tailgrids/core/badge";
import { Button } from "@/src/components/tailgrids/core/button";
import { Card, CardHeader, CardTitle } from "@/src/components/tailgrids/core/card";
import { InputGroup, InputGroupAddon, InputGroupInput, } from "@/src/components/tailgrids/core/input-group";
import { TableBody, TableCell, TableHead, TableHeader, TableRoot, TableRow, } from "@/src/components/tailgrids/core/table";
import { Spinner } from "@/src/components/tailgrids/core/spinner";
import { useCurrentUser } from "@/src/services/api/auth";
import { ContractorTableProps } from "@/src/services/api/contractor/types";
import { useContractors } from "@/src/services/api/contractor";
import { useRouter } from "next/navigation";
import { generateSlug } from "@/src/utils/slug";

export default function ContractorTable({ 
    setOpenCreateDialog 
}: { 
    setOpenCreateDialog: Dispatch<SetStateAction<boolean>>; 
}) {
    const [globalFilter, setGlobalFilter] = useState("");
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const { data, isLoading } = useContractors();
    const { data: user } = useCurrentUser();

    const router = useRouter()

    const handleAddCompany = () => {
        setOpenCreateDialog(true);
    };

    const handleViewCompany = (company: ContractorTableProps) => {
        router.push(`/contractor/${company.companyID}-${generateSlug(company.companyName)}`);
    };

    const handleEditCompany = (company: ContractorTableProps) => {
        // TODO: Open "Edit Company" modal
        console.log("Edit company:", company);
    };

    const columns = useMemo<ColumnDef<ContractorTableProps>[]>(
        () => [
            // COLUMN 1: Company Name
            {
                accessorKey: "name",
                header: "Company Name",
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex flex-col">
                            {item.companyID && (
                                <span className="text-xs text-text-tertiary">
                                    ID: {item.companyID}
                                </span>
                            )}
                            <span className="font-semibold text-text-primary text-wrap">
                                {item.companyName}
                            </span>
                        </div>
                    );
                },
            },

            // COLUMN 2: Company Code / Registration No.
            {
                accessorKey: "code",
                header: "Code",
                cell: ({ row }) => (
                    <span className="font-mono text-xs font-medium text-text-primary bg-background-gray-secondary px-2 py-1 rounded">
                        {row.original.companyRegNo}
                    </span>
                ),
            },

            // COLUMN 3: Contact Person & Phone
            {
                id: "contact",
                header: "Contact Details",
                accessorFn: (row) => `$${row.companyPhone ?? ""}`,
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex flex-col text-xs">
                            <span className="font-medium text-text-primary">
                                {item.companyPhone || "—"}
                            </span>
                        </div>
                    );
                },
            },

            // COLUMN 4: Assigned Zones & Cleaners
            {
                id: "specifications",
                header: "Zones & Workforce",
                accessorFn: (row) => (row.assignedZones ?? []).join(" "),
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            {item.assignedZones && item.assignedZones.length > 0 ? (
                                item.assignedZones.map((zone) => (
                                    <Badge key={zone} color="primary" size="sm">
                                        {zone}
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-gray-400">No zones assigned</span>
                            )}

                            {item.totalCleaners !== undefined && (
                                <span className="text-gray-400">
                                    ({item.totalCleaners} Cleaners)
                                </span>
                            )}
                        </div>
                    );
                },
            },

            // COLUMN 6: Action (View & Edit)
            {
                id: "actions",
                header: () => (
                    <div className="flex items-center justify-center">Action</div>
                ),
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <div className="flex items-center justify-center gap-1.5">
                            {/* View Button */}
                            <Button
                                appearance="outline"
                                onClick={() => handleViewCompany(item)}
                                className="h-8 px-2.5 text-xs font-medium text-text-secondary hover:text-text-primary"
                            >
                                <svg
                                    className="size-4 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.75}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.75}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                </svg>
                                View
                            </Button>

                            {/* Edit Button */}
                            <Button
                                appearance="outline"
                                onClick={() => handleEditCompany(item)}
                                className="h-8 px-2.5 text-xs font-medium text-text-secondary hover:text-text-primary"
                            >
                                <svg
                                    className="size-4 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.75}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                </svg>
                                Edit
                            </Button>
                        </div>
                    );
                },
            },
        ],
        []
    );

    const table = useReactTable({
        data,
        columns,
        state: {
            globalFilter,
            columnFilters,
        },
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    return (
        <Card>
            {/* Header with Search, Status Filter & Add Company Button */}
            <CardHeader className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <CardTitle>{user?.campus?.CampusName} Contractors</CardTitle>
                </div>

                <div className="flex items-center gap-2">
                    {/* Search Input */}
                    <InputGroup className="h-9">
                        <InputGroupAddon
                            align="inline-start"
                            className="pr-0 text-icon-tertiary"
                        >
                            <SearchIcon className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput
                            placeholder="Search company, code, contact..."
                            value={globalFilter ?? ""}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="pl-2 text-sm"
                        />
                    </InputGroup>

                    {/* Add Company Button (Top Right) */}
                    <Button
                        onClick={handleAddCompany}
                        className="h-9 px-3.5 text-xs font-medium w-50 flex items-center gap-1.5"
                    >
                        <svg
                            className="size-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        Add Company
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
                                        No matching contractor companies found.
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
