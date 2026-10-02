"use client";

import Header from "@/src/components/common/header";
import Sidebar from "@/src/components/common/sidebar";
import { SheetContent, SheetOverlay, SheetTitle } from "@/src/components/tailgrids/core/sheet";
import { cn } from "@/src/utils/cn";
import { useQuery } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { toast } from "react-toastify";
import type { CurrentUserProps } from "@/src/types";
import router from "next/router";
import { redirect } from "next/navigation";

export default function WithLayout({ children }: { children: ReactNode }) {
  // XL+ sidebar expand/collapse state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // Mobile sheet open state (< xl breakpoint)
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const currentUserQuery = useQuery<CurrentUserProps, Error>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await fetch("/api/user/me");
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { detail?: unknown } | null;
        const message =
          typeof body?.detail === "string"
            ? body.detail
            : `Could not load current user (${res.status}).`;
        throw new Error(message);
      }
      return (await res.json()) as CurrentUserProps;
    },
  });

  useEffect(() => {
    if (currentUserQuery.isError) {
      toast.error(`Failed to load profile: ${currentUserQuery.error.message}`);
      redirect("/");
    }
  }, [currentUserQuery.error, currentUserQuery.isError]);

  return (
      <div className="flex h-full">
        {/*  Desktop sidebar (xl+) — always in DOM, toggles width  */}
        <aside
          style={{
            width: isSidebarOpen ? "270px" : "72px",
            minWidth: isSidebarOpen ? "270px" : "72px",
            transition:
              "width 300ms cubic-bezier(0.4,0,0.2,1), min-width 300ms cubic-bezier(0.4,0,0.2,1)",
          }}
          className="hidden shrink-0 overflow-hidden xl:block"
        >
          <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        </aside>

        {/*  Mobile sidebar (< xl) — Sheet sliding from the left  */}

        <SheetOverlay isOpen={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
          <SheetContent
            side="left"
            showCloseButton={false}
            className="w-67.5! max-w-67.5! border-r border-card-border bg-card-surface-area p-0"
          >
            <SheetTitle className="sr-only">Sidebar</SheetTitle>
            <Sidebar
              isSidebarOpen={true}
              toggleSidebar={() => {
                setIsMobileSheetOpen(false);
              }}
              onItemClick={() => {
                setIsMobileSheetOpen(false);
              }}
              isMobileSheet
            />
          </SheetContent>
        </SheetOverlay>

        {/*  Main content column  */}
        <div className={cn("min-w-0 flex-1", isSidebarOpen ? "lg:p-4 xl:pr-4" : "lg:py-4 xl:px-4")}>
          <div className="flex h-full flex-col overflow-hidden border-[0.5px] border-card-surface-border bg-card-surface-area lg:rounded-2xl lg:shadow-[0_3px_6px_-2px_rgba(0,0,0,0.02),0_1px_1px_0_rgba(0,0,0,0.04)]">
            <Header
              onMenuClick={() => setIsMobileSheetOpen(true)}
              currentUserQuery={currentUserQuery}
            />

            <main className="scrollbar-thin flex-1 min-h-0 overflow-y-auto">
              <div className="mx-auto w-full max-w-384 pb-5">{children}</div>
            </main>
          </div>
        </div>
      </div>
  );
}
