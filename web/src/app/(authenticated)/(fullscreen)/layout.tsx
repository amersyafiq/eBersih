import { cn } from "@/src/utils/cn";
import { ReactNode } from "react";

export default function FullscreenLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-full">
            <div className={cn("min-w-0 flex-1 lg:py-4 xl:px-4")}>
                <div className="flex h-full flex-col overflow-hidden border-[0.5px] border-card-surface-border bg-card-surface-area lg:rounded-2xl lg:shadow-[0_3px_6px_-2px_rgba(0,0,0,0.02),0_1px_1px_0_rgba(0,0,0,0.04)]">
                    <main className="scrollbar-thin flex-1 min-h-0 overflow-y-auto">
                        <div className="mx-auto w-full h-full max-w-384">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}