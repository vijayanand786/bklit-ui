"use client";

import Link from "fumadocs-core/link";
import { ModeToggle } from "@/components/mode-toggle";
import { GithubStarCount } from "../github-star-count";
import { BklitLogo } from "../icons/bklit";
import { GitHubIcon } from "../icons/github";
import { Button } from "../ui/button";

interface NavLink {
  text: string;
  url: string;
  active?: "url" | "nested-url";
}

interface SiteHeaderProps {
  links?: NavLink[];
  githubUrl?: string;
}

export function SiteHeader({ links = [], githubUrl }: SiteHeaderProps) {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 h-14 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full items-center justify-between gap-6 px-6">
        <div className="flex items-center gap-2">
          <Link
            className="font-semibold text-foreground text-lg no-underline transition-opacity hover:opacity-80"
            href="/"
          >
            <BklitLogo size={24} />
          </Link>

          <nav className="flex items-center gap-1">
            {links.map((link) => (
              <Link href={link.url} key={link.url}>
                <Button size="sm" variant="ghost">
                  {link.text}
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1">
          {githubUrl && (
            <Link aria-label="GitHub" external href={githubUrl}>
              <Button
                className="gap-2 font-light font-mono text-muted-foreground text-xs"
                size="sm"
                variant="ghost"
              >
                <GitHubIcon />
                <GithubStarCount />
              </Button>
            </Link>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
