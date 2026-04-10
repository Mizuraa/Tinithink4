export type UserStatus = "online" | "offline" | "away" | "busy";

export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string | null;
  bio: string | null;
  age: number | null;
  school: string | null;
  avatar_url: string | null;
  status: UserStatus;
  total_points: number;
  games_played: number;
  games_won: number;
  achievements: Achievement[];
  preferences: Record<string, any>;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked_at: string;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected";
  message: string | null;
  created_at: string;
  updated_at: string;
  sender?: User;
  receiver?: User;
}

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  friend?: User;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  is_public: boolean;
  max_members: number;
  created_by: string;
  current_admin: string;
  created_at: string;
  updated_at: string;
  members?: GroupMember[];
  member_count?: number;
}

export type GroupRole = "admin" | "moderator" | "member";

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  points: number;
  joined_at: string;
  user?: User;
}

export interface GroupInvite {
  id: string;
  group_id: string;
  inviter_id: string;
  invitee_id: string;
  status: "pending" | "accepted" | "rejected";
  message: string | null;
  created_at: string;
  expires_at: string;
  group?: Group;
  inviter?: User;
}

export type GameDifficulty = "easy" | "medium" | "hard";

export interface Game {
  id: string;
  title: string;
  description: string | null;
  creator_id: string;
  is_public: boolean;
  is_multiplayer: boolean;
  max_players: number;
  time_limit: number;
  difficulty: GameDifficulty;
  category: string | null;
  tags: string[];
  plays_count: number;
  avg_score: number;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  creator?: User;
  questions?: Question[];
  question_count?: number;
}

export interface Question {
  id: string;
  game_id: string;
  text: string;
  explanation: string | null;
  time_limit: number;
  points: number;
  ordering: number;
  media_url: string | null;
  created_at: string;
  choices?: Choice[];
}

export interface Choice {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
  ordering: number;
  created_at: string;
}

export type GameSessionStatus =
  | "waiting"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface GameSession {
  id: string;
  game_id: string;
  session_code: string;
  host_id: string;
  status: GameSessionStatus;
  is_multiplayer: boolean;
  max_players: number;
  current_players: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  game?: Game;
  host?: User;
  players?: GameSessionPlayer[];
}

export interface GameSessionPlayer {
  id: string;
  session_id: string;
  user_id: string;
  score: number;
  lives: number;
  current_question: number;
  is_finished: boolean;
  joined_at: string;
  finished_at: string | null;
  user?: User;
}

export interface GameSessionAnswer {
  id: string;
  session_id: string;
  user_id: string;
  question_id: string;
  choice_id: string | null;
  is_correct: boolean;
  time_taken: number;
  points_earned: number;
  answered_at: string;
}

export interface GameInvite {
  id: string;
  session_id: string;
  inviter_id: string;
  invitee_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  expires_at: string;
  session?: GameSession;
  inviter?: User;
}

export type NotificationType =
  | "friend_request"
  | "game_invite"
  | "group_invite"
  | "achievement"
  | "mention"
  | "system";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  data: Record<string, any>;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export interface Flashcard {
  id: string;
  user_id: string;
  course: string;
  subject: string | null;
  grade_level: string | null;
  quarter: string | null;
  question: string;
  answer: string;
  is_public: boolean;
  times_reviewed: number;
  last_reviewed: string | null;
  created_at: string;
  user?: User;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string | null;
  created_at: string;
}

export interface ReviewerTerm {
  id: string;
  user_id: string;
  folder_id: string | null;
  term: string;
  definition: string;
  highlight_color: string | null;
  underline: boolean;
  tags: string[];
  created_at: string;
}

// Utility types
export interface PaginationParams {
  page: number;
  per_page: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface SearchParams {
  query: string;
  filters?: Record<string, any>;
  sort?: string;
  order?: "asc" | "desc";
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  username: string;
  email: string;
  password: string;
  display_name?: string;
  age?: number;
  school?: string;
}

export interface CreateGameFormData {
  title: string;
  description?: string;
  is_public: boolean;
  is_multiplayer: boolean;
  max_players: number;
  time_limit: number;
  difficulty: GameDifficulty;
  category?: string;
  tags: string[];
}

export interface CreateGroupFormData {
  name: string;
  description?: string;
  is_public: boolean;
  max_members: number;
}
