import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-fd-background px-4 text-center">
      <div className="max-w-2xl">
        <div className="mb-8">
          <span className="inline-block rounded-full bg-fd-primary/10 px-4 py-1.5 text-sm font-medium text-fd-primary">
            v0.1.0
          </span>
        </div>

        <h1 className="mb-6 text-5xl font-bold tracking-tight text-fd-foreground sm:text-6xl">
          bklit-ui
        </h1>

        <p className="mb-10 text-lg text-fd-muted-foreground sm:text-xl">
          A beautiful, modern UI component library built with React and
          Tailwind CSS. Designed for developers who want elegant interfaces
          without the complexity.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/docs"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-fd-primary px-8 text-base font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
          >
            Get Started
          </Link>
          <Link
            href="/docs/components"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-fd-border bg-fd-background px-8 text-base font-medium text-fd-foreground transition-colors hover:bg-fd-accent"
          >
            Components
          </Link>
        </div>

        <div className="mt-16 grid gap-6 text-left sm:grid-cols-3">
          <div className="rounded-xl border border-fd-border bg-fd-card p-6">
            <div className="mb-3 text-2xl">🎨</div>
            <h3 className="mb-2 font-semibold text-fd-foreground">
              Beautiful Design
            </h3>
            <p className="text-sm text-fd-muted-foreground">
              Carefully crafted components with attention to every pixel.
            </p>
          </div>
          <div className="rounded-xl border border-fd-border bg-fd-card p-6">
            <div className="mb-3 text-2xl">⚡</div>
            <h3 className="mb-2 font-semibold text-fd-foreground">
              Fast & Light
            </h3>
            <p className="text-sm text-fd-muted-foreground">
              Optimized for performance with minimal bundle size.
            </p>
          </div>
          <div className="rounded-xl border border-fd-border bg-fd-card p-6">
            <div className="mb-3 text-2xl">🔧</div>
            <h3 className="mb-2 font-semibold text-fd-foreground">
              Customizable
            </h3>
            <p className="text-sm text-fd-muted-foreground">
              Built with Tailwind CSS for easy theming and customization.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

