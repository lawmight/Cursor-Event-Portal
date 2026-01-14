import { notFound, redirect } from "next/navigation";
import { getEventBySlug, getAnnouncements } from "@/lib/supabase/queries";
import { getSession } from "@/lib/actions/registration";
import { EventHeader } from "@/components/layout/EventHeader";
import { EventNav } from "@/components/layout/EventNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Download, Code, MessageSquare, Users } from "lucide-react";

interface ResourcesPageProps {
  params: Promise<{ eventSlug: string }>;
}

// These would typically come from the database
const resources = [
  {
    id: "1",
    category: "Getting Started",
    items: [
      {
        title: "Download Cursor",
        description: "Get the AI-powered code editor",
        url: "https://cursor.com/download",
        icon: Download,
      },
      {
        title: "Cursor Documentation",
        description: "Learn how to use Cursor effectively",
        url: "https://docs.cursor.com",
        icon: Code,
      },
    ],
  },
  {
    id: "2",
    category: "Community",
    items: [
      {
        title: "Cursor Discord",
        description: "Join the community chat",
        url: "https://discord.gg/cursor",
        icon: MessageSquare,
      },
      {
        title: "Cursor Forum",
        description: "Ask questions and share tips",
        url: "https://forum.cursor.com",
        icon: Users,
      },
    ],
  },
  {
    id: "3",
    category: "Workshop Materials",
    items: [
      {
        title: "Starter Repository",
        description: "Clone this to follow along",
        url: "https://github.com/cursor/workshop-starter",
        icon: Code,
      },
    ],
  },
];

export default async function ResourcesPage({ params }: ResourcesPageProps) {
  const { eventSlug } = await params;

  const event = await getEventBySlug(eventSlug);
  if (!event) {
    notFound();
  }

  // Check if registered
  const session = await getSession();
  if (!session || session.eventId !== event.id) {
    redirect(`/${eventSlug}`);
  }

  const announcements = await getAnnouncements(event.id);
  const latestAnnouncement = announcements[0] || null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <EventHeader event={event} announcement={latestAnnouncement} />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Resources
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Helpful links and materials
          </p>
        </div>

        {resources.map((category) => (
          <div key={category.id}>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              {category.category}
            </h2>
            <div className="space-y-3">
              {category.items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <a
                    key={index}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Card className="hover:border-cursor-purple transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-cursor-purple/10 text-cursor-purple flex items-center justify-center">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {item.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {item.description}
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </main>

      <EventNav eventSlug={eventSlug} />
    </div>
  );
}
