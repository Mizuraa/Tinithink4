// lib/supabase.ts - Enhanced Supabase Client V3.0
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// AUTH HELPERS
export async function getCurrentUser() {
  // getSession reads localStorage instantly - no network, never throws
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user) return session.user;

  // Fallback: wait for auth to hydrate on cold start / hard reload
  return new Promise<any>((resolve) => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      subscription.unsubscribe();
      resolve(s?.user ?? null);
    });
    setTimeout(() => {
      subscription.unsubscribe();
      resolve(null);
    }, 5000);
  });
}

export async function isAuthenticated() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return !!session;
}

export async function handleLogout() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from("users")
      .update({
        status: "offline",
        last_seen: new Date().toISOString(),
      })
      .eq("id", user.id);
  }
  await supabase.auth.signOut();
}

// USER OPERATIONS
export async function updateUserStatus(userId: string, status: string) {
  const { error } = await supabase
    .from("users")
    .update({ status, last_seen: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}

export async function searchUsers(query: string, limit = 10) {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url, status")
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(limit);
  if (error) throw error;
  return data;
}

// FRIEND OPERATIONS
export async function sendFriendRequest(
  senderId: string,
  receiverId: string,
  message?: string,
) {
  const { data, error } = await supabase
    .from("friend_requests")
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      message,
      status: "pending",
    })
    .select()
    .single();
  if (error) throw error;

  await createNotification(receiverId, {
    type: "friend_request",
    title: "New friend request",
    message: message || "Someone wants to be your friend",
    data: { request_id: data.id, sender_id: senderId },
  });
  return data;
}

export async function acceptFriendRequest(requestId: string) {
  const { error } = await supabase
    .from("friend_requests")
    .update({ status: "accepted" })
    .eq("id", requestId);
  if (error) throw error;
}

export async function rejectFriendRequest(requestId: string) {
  const { error } = await supabase
    .from("friend_requests")
    .update({ status: "rejected" })
    .eq("id", requestId);
  if (error) throw error;
}

export async function getFriends(userId: string) {
  const { data, error } = await supabase
    .from("friends")
    .select(
      `*, friend:users!friends_friend_id_fkey (id, username, display_name, avatar_url, status, last_seen)`,
    )
    .eq("user_id", userId);
  if (error) throw error;
  return data;
}

export async function getPendingFriendRequests(userId: string) {
  const { data, error } = await supabase
    .from("friend_requests")
    .select(
      `*, sender:users!friend_requests_sender_id_fkey (id, username, display_name, avatar_url)`,
    )
    .eq("receiver_id", userId)
    .eq("status", "pending");
  if (error) throw error;
  return data;
}

// GROUP OPERATIONS
export async function transferGroupAdmin(groupId: string, newAdminId: string) {
  const { error } = await supabase
    .from("groups")
    .update({ current_admin: newAdminId })
    .eq("id", groupId);
  if (error) throw error;
  await supabase
    .from("group_members")
    .update({ role: "admin" })
    .eq("group_id", groupId)
    .eq("user_id", newAdminId);
}

export async function kickGroupMember(groupId: string, userId: string) {
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function sendGroupInvite(
  groupId: string,
  inviterId: string,
  inviteeId: string,
  message?: string,
) {
  const { data, error } = await supabase
    .from("group_invites")
    .insert({
      group_id: groupId,
      inviter_id: inviterId,
      invitee_id: inviteeId,
      message,
      status: "pending",
    })
    .select()
    .single();
  if (error) throw error;

  await createNotification(inviteeId, {
    type: "group_invite",
    title: "Group invitation",
    message: message || "You have been invited to join a group",
    data: { invite_id: data.id, group_id: groupId },
  });
  return data;
}

export async function getGroupMembers(groupId: string) {
  const { data, error } = await supabase
    .from("group_members")
    .select(
      `*, user:users!group_members_user_id_fkey (id, username, display_name, avatar_url, status)`,
    )
    .eq("group_id", groupId);
  if (error) throw error;
  return data;
}

// GAME OPERATIONS
export async function createGameSession(
  gameId: string,
  hostId: string,
  isMultiplayer: boolean,
  maxPlayers: number,
) {
  const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const { data, error } = await supabase
    .from("game_sessions")
    .insert({
      game_id: gameId,
      host_id: hostId,
      session_code: sessionCode,
      is_multiplayer: isMultiplayer,
      max_players: maxPlayers,
      status: "waiting",
      current_players: 0,
    })
    .select()
    .single();
  if (error) throw error;
  await joinGameSession(data.id, hostId);
  return data;
}

export async function joinGameSession(sessionId: string, userId: string) {
  const { error } = await supabase.from("game_session_players").insert({
    session_id: sessionId,
    user_id: userId,
    score: 0,
    lives: 3,
    current_question: 0,
  });
  if (error) throw error;

  const { data: session } = await supabase
    .from("game_sessions")
    .select("current_players")
    .eq("id", sessionId)
    .single();
  await supabase
    .from("game_sessions")
    .update({ current_players: (session?.current_players || 0) + 1 })
    .eq("id", sessionId);
}

export async function getPublicGames(limit = 20) {
  const { data, error } = await supabase
    .from("games")
    .select(`*, creator:users!games_creator_id_fkey (username, avatar_url)`)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// NOTIFICATION OPERATIONS
export async function createNotification(userId: string, notification: any) {
  const { error } = await supabase
    .from("notifications")
    .insert({ user_id: userId, ...notification });
  if (error) throw error;
}

export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
  if (error) throw error;
}

export async function markAllNotificationsAsRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw error;
}

export async function getUnreadNotificationCount(userId: string) {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw error;
  return count || 0;
}

export async function getNotifications(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// REAL-TIME SUBSCRIPTIONS
export function subscribeToNotifications(
  userId: string,
  callback: (payload: any) => void,
) {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      callback,
    )
    .subscribe();
}

export function subscribeToGameSession(
  sessionId: string,
  callback: (payload: any) => void,
) {
  return supabase
    .channel(`game-session:${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "game_session_players",
        filter: `session_id=eq.${sessionId}`,
      },
      callback,
    )
    .subscribe();
}
