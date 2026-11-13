"use client";

import { Breadcrumbs } from "@/src/components/tailgrids/core/breadcrumbs";
import FacilityTable from "./_component/facility-table";

export default function FacilityPage() {
    return (
        <div className="mt-6 space-y-5">
            {/* Header Section */}
            <div className='flex flex-col-reverse items-start justify-between gap-3 px-2 sm:flex-row sm:items-center lg:px-6'>
                <h1 className='mb-1 text-[28px] leading-8 font-medium text-text-primary'>
                    Manage Facility
                </h1>

                <Breadcrumbs
                    dividerType='chevron'
                    items={[
                        { href: '/', label: 'Home' },
                        { href: '/facility', label: 'Manage Facility' },
                    ]}
                />
            </div>

            <div className='space-y-5 px-2 lg:px-5'>
                <FacilityTable />
            </div>
        </div>
    );
}