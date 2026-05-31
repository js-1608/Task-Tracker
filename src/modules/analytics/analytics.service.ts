// src/modules/analytics/analytics.service.ts
import { prisma } from '../../config/db';

export async function getOverdueStats(orgId: string) {
  // Overdue tasks per user (tasks past due_date, not DONE)
  const overdueByUser = await prisma.$queryRaw<
    Array<{ userId: string; userName: string; email: string; overdueCount: bigint }>
  >`
    SELECT
      u.id        AS "userId",
      u.name      AS "userName",
      u.email,
      COUNT(t.id) AS "overdueCount"
    FROM tasks t
    JOIN users u ON u.id = t.assignee_id
    WHERE t.org_id   = ${orgId}
      AND t.status  != 'DONE'
      AND t.due_date IS NOT NULL
      AND t.due_date  < NOW()
    GROUP BY u.id, u.name, u.email
    ORDER BY "overdueCount" DESC
  `;

  // Average completion time in hours (tasks that reached DONE)
  const avgCompletion = await prisma.$queryRaw<Array<{ avgCompletionHours: number | null }>>`
    SELECT
      AVG(
        EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600
      ) AS "avgCompletionHours"
    FROM tasks
    WHERE org_id      = ${orgId}
      AND status      = 'DONE'
      AND completed_at IS NOT NULL
  `;

  return {
    overdueByUser: overdueByUser.map((row) => ({
      ...row,
      overdueCount: Number(row.overdueCount),
    })),
    avgCompletionHours: avgCompletion[0]?.avgCompletionHours
      ? parseFloat(avgCompletion[0].avgCompletionHours.toFixed(2))
      : null,
  };
}
