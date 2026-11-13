import { Skeleton } from "../../tailgrids/core/skeleton";

export default function SidebarSkeletion({ isSidebarOpen }: { isSidebarOpen: boolean; }) {
    return (
        <div>
            { isSidebarOpen ? (
                <>
                    <Skeleton className="w-1/2 h-7 mb-4 mt-3" />
                    <Skeleton className="w-full h-7 mb-2" />
                    <Skeleton className="w-3/4 h-7 mb-2" />
                    <Skeleton className="w-3/5 h-7 mb-2" />
                    <Skeleton className="w-3/4 h-7 mb-2" />
                    <Skeleton className="w-full h-7 mb-2" />
                    <Skeleton className="w-1/2 h-7 mb-4 mt-10" />
                    <Skeleton className="w-full h-7 mb-2" />
                    <Skeleton className="w-3/4 h-7 mb-2" />
                    <Skeleton className="w-full h-7 mb-2" />
                </>
            ):(
                <>
                    <Skeleton className="w-full h-7 mb-4 mt-3" />
                    <Skeleton className="w-full h-7 mb-2" />
                    <Skeleton className="w-full h-7 mb-2" />
                    <Skeleton className="w-full h-7 mb-2" />
                    <Skeleton className="w-full h-7 mb-2" />
                    <Skeleton className="w-full h-7 mb-2" />
                    <Skeleton className="w-full h-7 mb-4 mt-10" />
                    <Skeleton className="w-full h-7 mb-2" />
                    <Skeleton className="w-full h-7 mb-2" />
                    <Skeleton className="w-full h-7 mb-2" />
                </>
            )}
        </div>
    );
}