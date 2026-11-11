import { Breadcrumbs } from "@/src/components/tailgrids/core/breadcrumbs";
import ContractorViewPage from "../_component/contractor-view";

export default async function ContractorPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    return (
        <div className="mt-6 space-y-5">
            {/* Header Section */}
            <div className='flex flex-col-reverse items-start justify-between gap-3 px-2 sm:flex-row sm:items-center lg:px-6'>
                <h1 className='mb-1 text-[28px] leading-8 font-medium text-text-primary'>
                    View Contractor
                </h1>

                <Breadcrumbs
                    dividerType='chevron'
                    items={[
                        { href: '/', label: 'Home' },
                        { href: '/contractor', label: 'Manage Contractor' },
                        { href: `/contractor/${slug}`, label: 'View Contractor' },
                    ]}
                />
            </div>

            <div className='space-y-5 px-2 lg:px-5'>
                <ContractorViewPage />
            </div>
        </div>
    );
};