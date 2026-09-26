import type { SVGProps } from "react";

function GlobeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
    </svg>
  );
}

function GithubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.94c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.53-1.36-1.3-1.72-1.3-1.72-1.06-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.74 1.27 3.4.97.11-.76.41-1.27.74-1.56-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.05 11.05 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.26 5.69.42.36.79 1.08.79 2.18v3.23c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

const socials = [
  { label: "Portfolio", href: "https://portfolio-updated-tcsz.vercel.app/", Icon: GlobeIcon },
  {
    label: "GitHub",
    href: "https://github.com/MohamedAshraf366?tab=repositories",
    Icon: GithubIcon,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/mohamed-ashraf-497a13170",
    Icon: LinkedinIcon,
  },
] as const;

export function Footer() {
  return (
    <footer className="z-30 w-full shrink-0 border-t border-white/10 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-2 text-center sm:flex-row sm:justify-between sm:gap-4 sm:py-2.5 sm:text-left">
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-slate-400">
          <span className="font-black tracking-[0.2em] text-white">APEX RUSH</span>
          <span className="hidden h-3 w-px bg-white/15 sm:block" />
          <span>
            Built by{" "}
            <span className="bg-gradient-to-r from-amber-300 to-red-500 bg-clip-text font-semibold text-transparent">
              Mohamed Ashraf
            </span>
          </span>
        </p>

        <nav className="flex flex-wrap items-center justify-center gap-2">
          {socials.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={label}
              title={label}
              className="group inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300/60 hover:bg-amber-300/10 hover:text-amber-200 focus-visible:ring-2 focus-visible:ring-amber-300/50 focus-visible:outline-none"
            >
              <Icon
                className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110"
                aria-hidden
              />
              {label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
