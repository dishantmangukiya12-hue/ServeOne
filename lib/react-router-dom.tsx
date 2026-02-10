"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams, useParams as useNextParams } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";
import { useEffect } from "react";

export function useNavigate() {
  const router = useRouter();
  return (to: string) => router.push(to);
}

export function useLocation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  return {
    pathname,
    search: search ? `?${search}` : "",
  };
}

export function useParams<TParams extends Record<string, string>>() {
  return useNextParams() as TParams;
}

export function Navigate({ to }: { to: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(to);
  }, [router, to]);
  return null;
}

export function NavLink({
  to,
  className,
  onClick,
  children,
  ...props
}: {
  to: string;
  className?: string | ((args: { isActive: boolean }) => string);
  onClick?: () => void;
  children: ReactNode;
} & Omit<ComponentProps<typeof Link>, "href" | "className">) {
  const pathname = usePathname();
  const isActive = pathname === to;
  const resolvedClassName =
    typeof className === "function" ? className({ isActive }) : className;

  return (
    <Link href={to} className={resolvedClassName} onClick={onClick} {...props}>
      {children}
    </Link>
  );
}

export function Outlet() {
  return null;
}
