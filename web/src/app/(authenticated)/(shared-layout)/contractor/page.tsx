"use client";

import { Breadcrumbs } from "@/src/components/tailgrids/core/breadcrumbs";
import ContractorTable from "./_component/contractor-table";
import ContractorCreate from "./_component/contractor-create";
import { useState } from "react";

export default function ContractorPage() {
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    
    return (
        <div className="mt-6 space-y-5">
            {/* Header Section */}
            <div className='flex flex-col-reverse items-start justify-between gap-3 px-2 sm:flex-row sm:items-center lg:px-6'>
                <h1 className='mb-1 text-[28px] leading-8 font-medium text-text-primary'>
                    Manage Contractor
                </h1>

                <Breadcrumbs
                    dividerType='chevron'
                    items={[
                        { href: '/', label: 'Home' },
                        { href: '/contractor', label: 'Manage Contractor' },
                    ]}
                />
            </div>

            <div className='space-y-5 px-2 lg:px-5'>
                <ContractorTable setOpenCreateDialog={setOpenCreateDialog} />
                <ContractorCreate openCreateDialog={openCreateDialog} setOpenCreateDialog={setOpenCreateDialog} />
            </div>
        </div>
    );
}