import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <main className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
        <div className="rounded-2xl bg-muted px-4 py-1.5 text-sm font-medium">
          🚀 AI-Powered Content Repurposing
        </div>
        <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
          Turn One Piece of Content<br />
          Into <span className="text-primary">Every Piece of Content</span>
        </h1>
        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
          Automatically transform your YouTube videos, blog posts, and podcasts into
          LinkedIn posts, Twitter threads, and more using advanced AI.
        </p>
        <div className="space-x-4">
          <Link href="/dashboard">
            <Button size="lg" className="gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="https://github.com/rachit/uploadanywhere" target="_blank">
            <Button variant="outline" size="lg">
              View on GitHub
            </Button>
          </Link>
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span>Powered by Google Gemini 1.5 Flash</span>
          </div>
          <p>No credit card required for trial.</p>
        </div>
      </main>
    </div>
  );
}
