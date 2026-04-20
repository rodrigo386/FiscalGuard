import Link from "next/link";
import { ShieldCheck } from "lucide-react";

const partnerBadges = [
  { label: "Oracle Startup Program", color: "#C74634" },
  { label: "Microsoft for Startups", color: "#0078D4" },
  { label: "Anthropic Partner", color: "#D97757" },
];

export function SiteNavbar() {
  return (
    <header className="border-b border-black/5 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-brand-teal"
            aria-label="IAgentics — página inicial"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-teal text-white">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              IAgentics
            </span>
            <span className="hidden text-sm text-neutral-muted lg:inline">
              · Fiscal Guardian
            </span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm font-medium text-neutral-ink/80 md:flex">
            <NavLink href="/demo">Demo</NavLink>
            <NavLink href="/live">Ao vivo</NavLink>
            <NavLink href="/dashboard">Dashboard</NavLink>
          </nav>
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          {partnerBadges.map((badge) => (
            <span
              key={badge.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-white px-2.5 py-1 text-xs font-medium text-neutral-ink/75 shadow-sm"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: badge.color }}
                aria-hidden
              />
              {badge.label}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 transition-colors hover:bg-brand-teal-light hover:text-brand-teal"
    >
      {children}
    </Link>
  );
}
