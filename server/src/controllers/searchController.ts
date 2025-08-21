import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { SearchFilters, SearchResult, SearchProvider } from 'shared/types/search';

// Helper function to get user from request
const getUserFromRequest = (req: Request) => {
  const user = (req as any).user;
  if (!user) return null;
  
  return {
    ...user,
    id: user.sub || user.id
  };
};

// Helper function to handle errors
const handleError = (res: Response, error: any, message: string = 'Internal server error') => {
  console.error('Search Controller Error:', error);
  res.status(500).json({ success: false, error: message });
};

// --- Search Provider Implementations ---

const driveSearchProvider: SearchProvider = {
  moduleId: 'drive',
  moduleName: 'Drive',
  search: async (query, userId, filters) => await searchDrive(query, userId, filters),
};

const chatSearchProvider: SearchProvider = {
  moduleId: 'chat',
  moduleName: 'Chat',
  search: async (query, userId, filters) => await searchChat(query, userId, filters),
};

const dashboardSearchProvider: SearchProvider = {
  moduleId: 'dashboard',
  moduleName: 'Dashboard',
  search: async (query, userId, filters) => await searchDashboard(query, userId, filters),
};

// Member search provider implementation
const memberSearchProvider: SearchProvider = {
  moduleId: 'member',
  moduleName: 'Members',
  search: async (query, userId, filters) => {
    // Only search if query is at least 2 characters
    if (!query || query.length < 2) return [];
    // Search users by name or email, excluding self
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
          { id: { not: userId } },
        ],
      },
      take: 10,
    });
    return users.map((user) => ({
      id: user.id,
      title: user.name || user.email,
      description: user.email,
      moduleId: 'member',
      moduleName: 'Members',
      url: `/member/profile/${user.id}`,
      type: 'user',
      metadata: {},
      permissions: [{ type: 'read', granted: true }],
      lastModified: user.updatedAt,
      relevanceScore: 0.7, // Basic score for now
    }));
  },
};

// Provider registry
const searchProviders: SearchProvider[] = [
  driveSearchProvider,
  chatSearchProvider,
  dashboardSearchProvider,
  memberSearchProvider,
];

// Refactored global search using provider registry
export const globalSearch = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Global Search Debug - Request received:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body
    });

    const user = getUserFromRequest(req);
    console.log('🔍 Global Search Debug - User extracted:', user);
    
    if (!user) {
      console.log('🔍 Global Search Debug - No user found, returning 401');
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { query, filters }: { query: string; filters?: SearchFilters } = req.body;
    console.log('🔍 Global Search Debug - Query and filters:', { query, filters });

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      console.log('🔍 Global Search Debug - Invalid query, returning 400');
      return res.status(400).json({ success: false, error: 'Query must be at least 2 characters' });
    }

    const searchQuery = query.trim();
    let results: SearchResult[] = [];

    console.log('🔍 Global Search Debug - Starting search with query:', searchQuery);

    // Use provider registry for modular search
    for (const provider of searchProviders) {
      console.log(`🔍 Global Search Debug - Searching provider: ${provider.moduleId}`);
      if (!filters?.moduleId || filters.moduleId === provider.moduleId) {
        const providerResults = await provider.search(searchQuery, user.id, filters);
        console.log(`🔍 Global Search Debug - Provider ${provider.moduleId} returned ${providerResults.length} results:`, providerResults);
        results.push(...providerResults);
      }
    }

    console.log('🔍 Global Search Debug - Total results before sorting:', results.length);

    // Sort results by relevance score
    results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    console.log('🔍 Global Search Debug - Final results:', results);

    res.json({ success: true, results });
  } catch (error) {
    console.error('🔍 Global Search Debug - Error occurred:', error);
    handleError(res, error, 'Failed to perform global search');
  }
};

// Get search suggestions
export const getSuggestions = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { q: query } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length < 1) {
      return res.json({ success: true, suggestions: [] });
    }

    const searchQuery = query.trim();
    const suggestions: any[] = [];

    // Get recent search history (from user preferences or cache)
    // For now, we'll return some basic suggestions
    suggestions.push(
      { text: searchQuery, type: 'query' },
      { text: `${searchQuery} in drive`, type: 'query' },
      { text: `${searchQuery} in chat`, type: 'query' },
      { text: `${searchQuery} in dashboard`, type: 'query' }
    );

    res.json({ success: true, suggestions });
  } catch (error) {
    handleError(res, error, 'Failed to get suggestions');
  }
};

// Search in Drive module
async function searchDrive(query: string, userId: string, filters?: SearchFilters): Promise<SearchResult[]> {
  console.log('🔍 Drive Search Debug - Starting searchDrive with:', { query, userId, filters });
  const results: SearchResult[] = [];

  // Search files - simplified query to match our working test
  console.log('🔍 Drive Search Debug - Searching files...');
  const files = await prisma.file.findMany({
    where: {
      AND: [
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
          ],
        },
        { userId: userId }, // Simplified: just check user ownership
        { trashedAt: null },
      ],
    },
    include: {
      folder: true,
    },
    take: 10,
  });

  console.log('🔍 Drive Search Debug - Files found:', files.length, files);

  for (const file of files) {
    const relevanceScore = calculateRelevanceScore(file.name, query);
    results.push({
      id: file.id,
      title: file.name,
      description: `File in ${file.folder?.name || 'root'}`,
      moduleId: 'drive',
      moduleName: 'Drive',
      url: `/drive?file=${file.id}`,
      type: 'file',
      metadata: {
        size: file.size,
        type: file.type,
        folderId: file.folderId,
      },
      permissions: [{ type: 'read', granted: true }],
      lastModified: file.updatedAt,
      relevanceScore,
    });
  }

  // Search folders - simplified query to match our working test
  console.log('🔍 Drive Search Debug - Searching folders...');
  const folders = await prisma.folder.findMany({
    where: {
      AND: [
        { name: { contains: query, mode: 'insensitive' } },
        { userId: userId }, // Simplified: just check user ownership
        { trashedAt: null },
      ],
    },
    take: 5,
  });

  console.log('🔍 Drive Search Debug - Folders found:', folders.length, folders);

  for (const folder of folders) {
    const relevanceScore = calculateRelevanceScore(folder.name, query);
    results.push({
      id: folder.id,
      title: folder.name,
      description: 'Folder',
      moduleId: 'drive',
      moduleName: 'Drive',
      url: `/drive?folder=${folder.id}`,
      type: 'folder',
      metadata: {
        parentId: folder.parentId,
      },
      permissions: [{ type: 'read', granted: true }],
      lastModified: folder.updatedAt,
      relevanceScore,
    });
  }

  console.log('🔍 Drive Search Debug - Total results:', results.length, results);
  return results;
}

// Search in Chat module
async function searchChat(query: string, userId: string, filters?: SearchFilters): Promise<SearchResult[]> {
  console.log('🔍 Chat Search Debug - Starting searchChat with:', { query, userId, filters });
  const results: SearchResult[] = [];

  // Search messages
  console.log('🔍 Chat Search Debug - Searching messages...');
  const messages = await prisma.message.findMany({
    where: {
      content: { contains: query, mode: 'insensitive' },
      conversation: {
        participants: {
          some: {
            userId: userId,
            isActive: true,
          },
        },
      },
      deletedAt: null,
    },
    include: {
      sender: {
        select: { id: true, name: true, email: true },
      },
      conversation: {
        select: { id: true, name: true, type: true },
      },
    },
    take: 10,
  });

  console.log('🔍 Chat Search Debug - Messages found:', messages.length, messages.map(m => ({ content: m.content.substring(0, 30) + '...', sender: m.sender.name })));

  for (const message of messages) {
    const relevanceScore = calculateRelevanceScore(message.content, query);
    results.push({
      id: message.id,
      title: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
      description: `Message from ${message.sender.name || message.sender.email} in ${message.conversation.name || 'conversation'}`,
      moduleId: 'chat',
      moduleName: 'Chat',
      url: `/chat?conversation=${message.conversation.id}&message=${message.id}`,
      type: 'message',
      metadata: {
        senderId: message.sender.id,
        conversationId: message.conversation.id,
        conversationType: message.conversation.type,
      },
      permissions: [{ type: 'read', granted: true }],
      lastModified: message.createdAt,
      relevanceScore,
    });
  }

  // Search conversations
  console.log('🔍 Chat Search Debug - Searching conversations...');
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { messages: { some: { content: { contains: query, mode: 'insensitive' } } } },
      ],
      participants: {
        some: {
          userId: userId,
          isActive: true,
        },
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
    take: 5,
  });

  console.log('🔍 Chat Search Debug - Conversations found:', conversations.length, conversations.map(c => ({ name: c.name, type: c.type })));

  for (const conversation of conversations) {
    const relevanceScore = calculateRelevanceScore(conversation.name || '', query);
    results.push({
      id: conversation.id,
      title: conversation.name || `${conversation.type} conversation`,
      description: `${conversation.participants.length} participants`,
      moduleId: 'chat',
      moduleName: 'Chat',
      url: `/chat?conversation=${conversation.id}`,
      type: 'conversation',
      metadata: {
        type: conversation.type,
        participantCount: conversation.participants.length,
      },
      permissions: [{ type: 'read', granted: true }],
      lastModified: conversation.updatedAt,
      relevanceScore,
    });
  }

  console.log('🔍 Chat Search Debug - Total results:', results.length, results);
  return results;
}

// Search in Dashboard module
async function searchDashboard(query: string, userId: string, filters?: SearchFilters): Promise<SearchResult[]> {
  console.log('🔍 Dashboard Search Debug - Starting searchDashboard with:', { query, userId, filters });
  const results: SearchResult[] = [];

  // Search dashboards
  console.log('🔍 Dashboard Search Debug - Searching dashboards...');
  const dashboards = await prisma.dashboard.findMany({
    where: {
      AND: [
        { name: { contains: query, mode: 'insensitive' } },
        { userId: userId },
      ],
    },
    take: 5,
  });

  console.log('🔍 Dashboard Search Debug - Dashboards found:', dashboards.length, dashboards.map(d => ({ name: d.name, id: d.id })));

  for (const dashboard of dashboards) {
    const relevanceScore = calculateRelevanceScore(dashboard.name, query);
    results.push({
      id: dashboard.id,
      title: dashboard.name,
      description: 'Dashboard',
      moduleId: 'dashboard',
      moduleName: 'Dashboard',
      url: `/dashboard/${dashboard.id}`,
      type: 'dashboard',
      metadata: {
        userId: dashboard.userId,
      },
      permissions: [{ type: 'read', granted: true }],
      lastModified: dashboard.updatedAt,
      relevanceScore,
    });
  }

  console.log('🔍 Dashboard Search Debug - Total results:', results.length, results);
  return results;
}

// Calculate relevance score for search results
function calculateRelevanceScore(text: string, query: string): number {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  // Exact match gets highest score
  if (lowerText === lowerQuery) return 1.0;
  
  // Starts with query gets high score
  if (lowerText.startsWith(lowerQuery)) return 0.9;
  
  // Contains query gets medium score
  if (lowerText.includes(lowerQuery)) return 0.7;
  
  // Partial word match gets lower score
  const queryWords = lowerQuery.split(' ');
  const textWords = lowerText.split(' ');
  const matchingWords = queryWords.filter(word => 
    textWords.some(textWord => textWord.includes(word))
  );
  
  if (matchingWords.length > 0) {
    return 0.5 * (matchingWords.length / queryWords.length);
  }
  
  return 0.1;
} 