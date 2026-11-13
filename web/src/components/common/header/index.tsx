"use client";

import { MenuIcon } from "@/src/components/common/header/icons";
import ThemeToggle from "@/src/components/common/header/theme-toggle";
import { UserProfileButton } from "@/src/components/common/header/user-profile";
import { ThreeDots } from "@/src/components/common/sidebar/icon";
import { cn } from "@/src/utils/cn";
import { LogoWithText } from "@/src/utils/icon";
import React from "react";
import { NotificationsButton } from "./notifications";
import SearchBar from "./searchbar";
import type { CurrentUserProps } from "@/src/types";
import { UseQueryResult } from "@tanstack/react-query";

//  Main Header
export default function Header({
  onMenuClick,
  currentUserQuery,
}: {
  onMenuClick?: () => void;
  currentUserQuery: UseQueryResult<CurrentUserProps, Error>;
}) {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b-[0.5px] border-card-border bg-card-surface-area px-2 py-4 lg:px-5">
        {/*  Mobile layout (< xl)  3-column grid: menu | logo | dots */}
        <div className="flex items-center xl:hidden">
          {/* Left: Menu / Hamburger */}
          <div className="flex flex-1 justify-start">
            <button
              id="mobile-menu-toggle"
              onClick={onMenuClick}
              aria-label="Open sidebar menu"
              className="rounded-md px-1.5 py-1 text-icon-tertiary transition-colors hover:text-text-primary"
            >
              <MenuIcon />
            </button>
          </div>

          {/* Center: Logo */}
          <div className="flex items-center justify-center">
            <LogoWithText />
          </div>

          {/* Right: Three-dot */}
          <div className="flex flex-1 justify-end">
            <button
              id="mobile-info-toggle"
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              aria-label="Open quick access"
              className={cn(
                "rounded-md px-1.5 py-3 transition-colors",
                isDrawerOpen
                  ? "bg-background-gray-secondary text-text-primary"
                  : "text-icon-tertiary hover:text-text-primary",
              )}
            >
              <ThreeDots />
            </button>
          </div>
        </div>

        {/* Desktop layout (xl+) - original layout */}
        <div className="hidden items-center justify-between xl:flex">
          {/* Left Side - Search */}
          <div className="max-w-xs flex-1">
            <SearchBar />
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <NotificationsButton />
            <UserProfileButton currentUserQuery={currentUserQuery} />
          </div>
        </div>
      </header>

      {/* Mobile Info */}
      <MobileInfoDrawer isOpen={isDrawerOpen} currentUserQuery={currentUserQuery} />
    </>
  );
}

// Mobile Info
function MobileInfoDrawer({
  isOpen,
  currentUserQuery,
}: {
  isOpen: boolean;
  currentUserQuery: UseQueryResult<CurrentUserProps, Error>;
}) {
  return (
    <div className={cn("xl:hidden", isOpen ? "block" : "hidden")}>
      <div className="px-5 py-4 shadow-xs">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <NotificationsButton />
            <ThemeToggle />
            <SearchBar />
          </div>

          {/* Right Side - Actions */}
          <UserProfileButton currentUserQuery={currentUserQuery} />
        </div>
      </div>
    </div>
  );
}
