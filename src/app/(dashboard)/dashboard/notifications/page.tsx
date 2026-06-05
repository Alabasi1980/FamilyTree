import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";
import { Bell, Check, ExternalLink } from "lucide-react";
import Link from "next/link";

const statusLabels = {
  unread: "جديد",
  read: "مقروء",
  empty: "لا توجد تنبيهات بعد",
  title: "التنبيهات",
  markAll: "تعليم الكل كمقروء",
  markRead: "تعليم كمقروء",
  open: "فتح",
};

export default async function NotificationsPage() {
  const session = await auth();
  const user = session!.user;

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Bell className="h-5 w-5 text-accent" />
            {statusLabels.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} تنبيه غير مقروء` : "كل التنبيهات مقروءة"}
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllReadAction}>
            <Button type="submit" variant="outline" size="sm">
              <Check className="ml-1 h-4 w-4" />
              {statusLabels.markAll}
            </Button>
          </form>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">آخر التنبيهات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">{statusLabels.empty}</p>
          ) : (
            <ul className="divide-y divide-border/40">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className="flex items-start justify-between gap-3 px-6 py-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{notification.title}</p>
                      <Badge variant={notification.readAt ? "secondary" : "gold"} className="text-[10px]">
                        {notification.readAt ? statusLabels.read : statusLabels.unread}
                      </Badge>
                    </div>
                    {notification.body && (
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{notification.body}</p>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground/70">
                      {new Date(notification.createdAt).toLocaleString("ar")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {notification.href && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={notification.href}>
                          <ExternalLink className="ml-1 h-3.5 w-3.5" />
                          {statusLabels.open}
                        </Link>
                      </Button>
                    )}
                    {!notification.readAt && (
                      <form action={markReadAction.bind(null, notification.id)}>
                        <Button type="submit" variant="outline" size="sm">
                          <Check className="ml-1 h-3.5 w-3.5" />
                          {statusLabels.markRead}
                        </Button>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

async function markAllReadAction() {
  "use server";
  await markAllNotificationsRead();
}

async function markReadAction(notificationId: string) {
  "use server";
  await markNotificationRead(notificationId);
}
