import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import type { Conversation } from "../types";
import type { UserPreferences } from "../context/PreferencesContext";

const TABLE_NAME = "usher-conversations";
const PREFERENCES_SORT_KEY = "__preferences__";
const REGION = import.meta.env.VITE_AWS_REGION || "us-east-1";

const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID || "";
const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || "";

let docClient: DynamoDBDocumentClient | null = null;

if (accessKeyId && secretAccessKey) {
  try {
    const rawClient = new DynamoDBClient({
      region: REGION,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    docClient = DynamoDBDocumentClient.from(rawClient, {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    });
  } catch (err) {
    console.error("[Storage] Failed to initialize DynamoDB client:", err);
  }
}

const getLocalKey = (userId: string) => `usher_conversations_${userId}`;

/**
 * Loads all saved conversations for a specific authenticated user.
 * Queries AWS DynamoDB first, falling back to local cached storage if offline.
 */
export const loadUserConversations = async (userId: string): Promise<Conversation[]> => {
  if (!userId) return [];

  // Local storage cache lookup
  const localRaw = localStorage.getItem(getLocalKey(userId));
  let cachedConversations: Conversation[] = [];
  if (localRaw) {
    try {
      cachedConversations = JSON.parse(localRaw);
    } catch {
      cachedConversations = [];
    }
  }

  if (!docClient) {
    return cachedConversations;
  }

  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: {
        ":uid": userId,
      },
    });

    const response = await docClient.send(command);
    if (response.Items && response.Items.length > 0) {
      const items = response.Items.map((item) => {
        return {
          id: item.conversationId,
          title: item.title || "Untitled Conversation",
          createdAt: item.createdAt || Date.now(),
          updatedAt: item.updatedAt || Date.now(),
          messages: (item.messages || []).map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content || "",
            timestamp: m.timestamp,
            blocks: m.blocks || [],
            sources: m.sources || [],
          })),
          background: item.background,
        } as Conversation;
      });

      // Sort newest updated first
      items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

      // Update local cache
      localStorage.setItem(getLocalKey(userId), JSON.stringify(items));
      return items;
    }

    return cachedConversations;
  } catch (err) {
    console.warn("[Storage] Failed to query DynamoDB, serving from cache:", err);
    return cachedConversations;
  }
};

/**
 * Persists a conversation to DynamoDB and syncs to local cache.
 */
export const saveUserConversation = async (
  userId: string,
  conversation: Conversation
): Promise<void> => {
  if (!userId || !conversation.id) return;

  // 1. Update local cache immediately
  try {
    const localRaw = localStorage.getItem(getLocalKey(userId));
    const cached: Conversation[] = localRaw ? JSON.parse(localRaw) : [];
    const idx = cached.findIndex((c) => c.id === conversation.id);
    if (idx >= 0) {
      cached[idx] = conversation;
    } else {
      cached.unshift(conversation);
    }
    localStorage.setItem(getLocalKey(userId), JSON.stringify(cached));
  } catch (e) {
    console.warn("[Storage] Error caching to localStorage:", e);
  }

  // 2. Persist to AWS DynamoDB
  if (!docClient) return;

  try {
    const item = {
      userId,
      conversationId: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt || Date.now(),
      messages: conversation.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content || "",
        timestamp: m.timestamp,
        blocks: m.blocks || [],
        sources: m.sources || [],
      })),
      background: conversation.background,
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    });

    await docClient.send(command);
  } catch (err) {
    console.error("[Storage] Failed to save conversation to DynamoDB:", err);
  }
};

/**
 * Deletes a conversation from DynamoDB and local storage.
 */
export const deleteUserConversation = async (
  userId: string,
  conversationId: string
): Promise<void> => {
  if (!userId || !conversationId) return;

  // 1. Remove from local cache
  try {
    const localRaw = localStorage.getItem(getLocalKey(userId));
    if (localRaw) {
      const cached: Conversation[] = JSON.parse(localRaw);
      const filtered = cached.filter((c) => c.id !== conversationId);
      localStorage.setItem(getLocalKey(userId), JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn("[Storage] Error updating local cache on delete:", e);
  }

  // 2. Delete from AWS DynamoDB
  if (!docClient) return;

  try {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        userId,
        conversationId,
      },
    });
    await docClient.send(command);
  } catch (err) {
    console.error("[Storage] Failed to delete from DynamoDB:", err);
  }
};

/**
 * Renames a conversation in DynamoDB and local cache.
 */
export const renameUserConversation = async (
  userId: string,
  conversationId: string,
  newTitle: string
): Promise<void> => {
  if (!userId || !conversationId || !newTitle.trim()) return;

  const trimmed = newTitle.trim();
  const now = Date.now();

  // 1. Update local cache
  try {
    const localRaw = localStorage.getItem(getLocalKey(userId));
    if (localRaw) {
      const cached: Conversation[] = JSON.parse(localRaw);
      const updated = cached.map((c) =>
        c.id === conversationId ? { ...c, title: trimmed, updatedAt: now } : c
      );
      localStorage.setItem(getLocalKey(userId), JSON.stringify(updated));
    }
  } catch (e) {
    console.warn("[Storage] Error updating local cache on rename:", e);
  }

  // 2. Update in AWS DynamoDB
  if (!docClient) return;

  try {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        userId,
        conversationId,
      },
      UpdateExpression: "SET title = :title, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":title": trimmed,
        ":updatedAt": now,
      },
    });
    await docClient.send(command);
  } catch (err) {
    console.error("[Storage] Failed to rename conversation in DynamoDB:", err);
  }
};

const PREFS_LOCAL_KEY = (userId: string) => `usher_user_preferences_${userId}`;

/**
 * Saves user preferences to both DynamoDB (cross-device) and localStorage (instant offline cache).
 */
export const saveUserPreferences = async (
  userId: string,
  preferences: UserPreferences
): Promise<void> => {
  if (!userId) return;

  // 1. Always write to localStorage immediately
  try {
    localStorage.setItem(PREFS_LOCAL_KEY(userId), JSON.stringify(preferences));
  } catch {
    // ignore
  }

  // 2. Persist to DynamoDB as a special record keyed "__preferences__"
  if (!docClient) return;
  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          userId,
          conversationId: PREFERENCES_SORT_KEY,
          preferences,
          updatedAt: Date.now(),
        },
      })
    );
  } catch (err) {
    console.warn("[Storage] Failed to save preferences to DynamoDB:", err);
  }
};

/**
 * Loads user preferences. DynamoDB is source of truth (cross-device).
 * Falls back to localStorage if offline.
 */
export const loadUserPreferences = async (
  userId: string
): Promise<UserPreferences | null> => {
  if (!userId) return null;

  // Try DynamoDB first
  if (docClient) {
    try {
      const result = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: {
            userId,
            conversationId: PREFERENCES_SORT_KEY,
          },
        })
      );
      if (result.Item?.preferences) {
        // Sync to localStorage as cache
        localStorage.setItem(PREFS_LOCAL_KEY(userId), JSON.stringify(result.Item.preferences));
        return result.Item.preferences as UserPreferences;
      }
    } catch (err) {
      console.warn("[Storage] Failed to load preferences from DynamoDB, using cache:", err);
    }
  }

  // Fallback: localStorage cache
  try {
    const local = localStorage.getItem(PREFS_LOCAL_KEY(userId));
    if (local) return JSON.parse(local) as UserPreferences;
  } catch {
    // ignore
  }

  return null;
};
