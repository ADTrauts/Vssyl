/**
 * Entity linking v1 — shared people and files across module context payloads (Phase 3C).
 */

export interface LinkedPerson {
  id?: string;
  name: string;
  email?: string;
  modules: string[];
  linkType: 'shared_participant';
  confidence: number;
}

export interface LinkedFile {
  fileId: string;
  fileName?: string;
  modules: string[];
  linkType: 'chat_attachment_drive_file' | 'shared_file_reference';
  confidence: number;
}

export interface EntityLinkRecord {
  type:
    | 'shared_participant'
    | 'chat_attachment_drive_file'
    | 'shared_file_reference'
    | 'confirmed_vlink_relationship';
  description: string;
  modules: string[];
  entities: string[];
  suggestedAction?: string;
  linkKind?: 'confirmed' | 'inferred';
  confidence?: number;
}

export interface EntityLinkingResult {
  linkedPeople: LinkedPerson[];
  linkedFiles: LinkedFile[];
  links: EntityLinkRecord[];
}

export interface PersistedVLinkForEntityLinking {
  vlinkId: string;
  title: string;
  publicCode: string;
  entityTypes: string[];
  linkKind: 'confirmed_vlink';
  confidence: number;
}

export interface EntityLinkingInput {
  moduleContexts: Record<string, unknown>;
  query?: string;
  /** Confirmed V_Link rows from persisted store — preferred over inference when present */
  persistedVLinks?: PersistedVLinkForEntityLinking[];
}

interface PersonRef {
  id?: string;
  name: string;
  email?: string;
  module: string;
}

interface FileRef {
  fileId: string;
  fileName?: string;
  module: string;
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function unwrapModulePayload(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const data = o.data !== undefined ? o.data : raw;
  if (!data || typeof data !== 'object') return null;

  const d = data as Record<string, unknown>;
  if (d.context && typeof d.context === 'object') {
    return d.context as Record<string, unknown>;
  }
  return d;
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object');
}

function extractChatPeople(payload: Record<string, unknown>, moduleId: string): PersonRef[] {
  const people: PersonRef[] = [];
  const conversations = asRecordArray(payload.recentConversations);

  for (const conv of conversations) {
    const participants = asRecordArray(conv.participants);
    for (const participant of participants) {
      const user =
        participant.user && typeof participant.user === 'object'
          ? (participant.user as Record<string, unknown>)
          : participant;
      const name = typeof user.name === 'string' ? user.name.trim() : '';
      const email = typeof user.email === 'string' ? user.email.trim() : undefined;
      const id = typeof user.id === 'string' ? user.id : undefined;
      if (!name && !email) continue;
      people.push({
        id,
        name: name || email || 'Unknown',
        email,
        module: moduleId,
      });
    }
  }

  return people;
}

function extractCalendarPeople(payload: Record<string, unknown>, moduleId: string): PersonRef[] {
  const people: PersonRef[] = [];
  const events = asRecordArray(payload.upcomingEvents).concat(asRecordArray(payload.todayEvents));

  for (const event of events) {
    const attendees = asRecordArray(event.attendees);
    for (const attendee of attendees) {
      const name =
        typeof attendee.name === 'string'
          ? attendee.name
          : typeof attendee.displayName === 'string'
            ? attendee.displayName
            : typeof attendee.email === 'string'
              ? attendee.email.split('@')[0]
              : '';
      const email = typeof attendee.email === 'string' ? attendee.email : undefined;
      const id = typeof attendee.id === 'string' ? attendee.id : undefined;
      if (!name && !email) continue;
      people.push({ id, name: name || email || 'Unknown', email, module: moduleId });
    }
  }

  return people;
}

function extractDriveFiles(payload: Record<string, unknown>, moduleId: string): FileRef[] {
  const files: FileRef[] = [];
  const recentFiles = asRecordArray(payload.recentFiles);

  for (const file of recentFiles) {
    const fileId = typeof file.id === 'string' ? file.id : undefined;
    if (!fileId) continue;
    files.push({
      fileId,
      fileName: typeof file.name === 'string' ? file.name : undefined,
      module: moduleId,
    });
  }

  return files;
}

function extractChatFiles(payload: Record<string, unknown>, moduleId: string): FileRef[] {
  const files: FileRef[] = [];
  const conversations = asRecordArray(payload.recentConversations);

  for (const conv of conversations) {
    const attachments = asRecordArray(conv.attachments);
    for (const attachment of attachments) {
      const fileId =
        typeof attachment.fileId === 'string'
          ? attachment.fileId
          : typeof attachment.id === 'string'
            ? attachment.id
            : undefined;
      if (!fileId) continue;
      files.push({
        fileId,
        fileName: typeof attachment.name === 'string' ? attachment.name : undefined,
        module: moduleId,
      });
    }

    const lastMessage =
      conv.lastMessage && typeof conv.lastMessage === 'object'
        ? (conv.lastMessage as Record<string, unknown>)
        : null;
    const messageAttachments = lastMessage ? asRecordArray(lastMessage.attachments) : [];
    for (const attachment of messageAttachments) {
      const fileId =
        typeof attachment.fileId === 'string'
          ? attachment.fileId
          : typeof attachment.id === 'string'
            ? attachment.id
            : undefined;
      if (!fileId) continue;
      files.push({
        fileId,
        fileName: typeof attachment.name === 'string' ? attachment.name : undefined,
        module: moduleId,
      });
    }
  }

  return files;
}

function linkPeople(chatPeople: PersonRef[], calendarPeople: PersonRef[]): LinkedPerson[] {
  const linked: LinkedPerson[] = [];
  const seen = new Set<string>();

  for (const chatPerson of chatPeople) {
    for (const calPerson of calendarPeople) {
      const emailMatch =
        chatPerson.email &&
        calPerson.email &&
        normalizeEmail(chatPerson.email) === normalizeEmail(calPerson.email);
      const nameMatch =
        chatPerson.name &&
        calPerson.name &&
        normalizeName(chatPerson.name) === normalizeName(calPerson.name);
      const idMatch = chatPerson.id && calPerson.id && chatPerson.id === calPerson.id;

      if (!emailMatch && !nameMatch && !idMatch) continue;

      const key = `${chatPerson.id ?? chatPerson.email ?? chatPerson.name}:${calPerson.id ?? calPerson.email ?? calPerson.name}`;
      if (seen.has(key)) continue;
      seen.add(key);

      linked.push({
        id: chatPerson.id ?? calPerson.id,
        name: chatPerson.name || calPerson.name,
        email: chatPerson.email ?? calPerson.email,
        modules: ['chat', 'calendar'],
        linkType: 'shared_participant',
        confidence: emailMatch ? 0.95 : idMatch ? 0.9 : 0.75,
      });
    }
  }

  return linked;
}

function linkFiles(chatFiles: FileRef[], driveFiles: FileRef[]): LinkedFile[] {
  const linked: LinkedFile[] = [];
  const seen = new Set<string>();

  for (const chatFile of chatFiles) {
    for (const driveFile of driveFiles) {
      const idMatch = chatFile.fileId === driveFile.fileId;
      const nameMatch =
        chatFile.fileName &&
        driveFile.fileName &&
        normalizeName(chatFile.fileName) === normalizeName(driveFile.fileName);

      if (!idMatch && !nameMatch) continue;

      const key = `${chatFile.fileId}:${driveFile.fileId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      linked.push({
        fileId: driveFile.fileId,
        fileName: driveFile.fileName ?? chatFile.fileName,
        modules: ['chat', 'drive'],
        linkType: idMatch ? 'chat_attachment_drive_file' : 'shared_file_reference',
        confidence: idMatch ? 0.95 : 0.7,
      });
    }
  }

  return linked;
}

export function linkEntitiesAcrossModules(input: EntityLinkingInput): EntityLinkingResult {
  const chatPayload = unwrapModulePayload(input.moduleContexts.chat);
  const calendarPayload = unwrapModulePayload(input.moduleContexts.calendar);
  const drivePayload = unwrapModulePayload(input.moduleContexts.drive);

  const chatPeople = chatPayload ? extractChatPeople(chatPayload, 'chat') : [];
  const calendarPeople = calendarPayload ? extractCalendarPeople(calendarPayload, 'calendar') : [];
  const chatFiles = chatPayload ? extractChatFiles(chatPayload, 'chat') : [];
  const driveFiles = drivePayload ? extractDriveFiles(drivePayload, 'drive') : [];

  const linkedPeople = linkPeople(chatPeople, calendarPeople);
  const linkedFiles = linkFiles(chatFiles, driveFiles);

  const links: EntityLinkRecord[] = [];

  for (const person of linkedPeople) {
    links.push({
      type: 'shared_participant',
      description: `${person.name} appears in chat and calendar context`,
      modules: person.modules,
      entities: [person.name],
      suggestedAction: 'Reference shared participants when discussing meetings or messages',
      linkKind: 'inferred',
      confidence: person.confidence,
    });
  }

  for (const file of linkedFiles) {
    links.push({
      type: file.linkType,
      description: `${file.fileName ?? file.fileId} is linked between chat and drive`,
      modules: file.modules,
      entities: [file.fileName ?? file.fileId],
      suggestedAction: 'Use the shared file when answering about recent collaboration',
      linkKind: 'inferred',
      confidence: file.confidence,
    });
  }

  if (input.persistedVLinks?.length) {
    for (const vlink of input.persistedVLinks) {
      links.push({
        type: 'confirmed_vlink_relationship',
        description: `Confirmed V_Link "${vlink.title}" (${vlink.publicCode}) connects ${vlink.entityTypes.join(', ')}`,
        modules: ['vlink', ...vlink.entityTypes],
        entities: [vlink.publicCode],
        suggestedAction: 'Use confirmed vlink relationships as grounding; do not invent new links',
        linkKind: 'confirmed',
        confidence: vlink.confidence,
      });
    }
  }

  return { linkedPeople, linkedFiles, links };
}

export function buildConnectionsFromEntityLinks(
  entityLinks: EntityLinkingResult
): Array<{
  type: 'workflow' | 'relationship' | 'pattern' | 'opportunity';
  description: string;
  modules: string[];
  strength: number;
  actionable: boolean;
  suggestedAction?: string;
}> {
  return entityLinks.links.map((link) => ({
    type: link.type === 'shared_participant' ? 'relationship' : 'workflow',
    description: link.description,
    modules: link.modules,
    strength: link.type === 'shared_participant' ? 0.85 : 0.8,
    actionable: true,
    suggestedAction: link.suggestedAction,
  }));
}
