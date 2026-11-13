"use client";

import Link from "next/link";

export default function MapBackButton({ className }: { className: string }) {
    return (
        <Link
            type="button"
            className={className}
            aria-label="Go back"
            href="/"
        >
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="size-4"
            >
                <path
                    d="M14.375 5.75L8.125 12L14.375 18.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            <span>Back</span>
        </Link>
    );
}
