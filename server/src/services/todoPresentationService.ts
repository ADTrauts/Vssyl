const API_BASE_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://vssyl-server-235369681725.us-central1.run.app';

type TaskAttachment = { id: string; url: string | null; taskId: string };

/** Maps GCS attachment URLs to proxied serve URLs for task detail responses. */
export function mapTaskDetailAttachmentUrls<T extends { attachments?: TaskAttachment[] }>(
  task: T
): T {
  const convertAttachmentUrl = (attachment: TaskAttachment): string | null => {
    if (!attachment.url) return null;
    if (attachment.url.includes('storage.googleapis.com')) {
      return `${API_BASE_URL}/api/todo/tasks/${attachment.taskId}/attachments/${attachment.id}/serve`;
    }
    return attachment.url;
  };

  if (!task.attachments?.length) {
    return task;
  }

  return {
    ...task,
    attachments: task.attachments.map((att) => ({
      ...att,
      url: convertAttachmentUrl(att),
    })),
  };
}
