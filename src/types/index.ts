// Database types for Cursor Popup Portal

export type UserRole = "attendee" | "facilitator" | "staff" | "admin";
export type EventStatus = "draft" | "published" | "active" | "completed";
export type QuestionStatus = "open" | "answered" | "pinned" | "hidden";
export type RegistrationSource = "qr" | "link" | "walk-in";

export interface Event {
  id: string;
  slug: string;
  code: string;
  name: string;
  venue: string | null;
  address: string | null;
  capacity: number;
  start_time: string | null;
  end_time: string | null;
  status: EventStatus;
  created_at: string;
}

export interface User {
  id: string;
  email: string | null;
  name: string;
  role: UserRole;
  created_at: string;
}

export interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  consent_at: string | null;
  source: RegistrationSource;
  checked_in_at: string | null;
  created_at: string;
  // Joined fields
  user?: User;
}

export interface AgendaItem {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  location: string | null;
  speaker: string | null;
  start_time: string | null;
  end_time: string | null;
  sort_order: number;
  created_at: string;
}

export interface Announcement {
  id: string;
  event_id: string;
  content: string;
  priority: number;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface Question {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  tags: string[];
  upvotes: number;
  status: QuestionStatus;
  created_at: string;
  // Joined fields
  user?: User;
  answers?: Answer[];
  user_has_upvoted?: boolean;
}

export interface Answer {
  id: string;
  question_id: string;
  user_id: string;
  content: string;
  is_accepted: boolean;
  created_at: string;
  // Joined fields
  user?: User;
}

export interface QuestionUpvote {
  question_id: string;
  user_id: string;
}

export interface Survey {
  id: string;
  event_id: string;
  title: string;
  schema: SurveySchema;
  published_at: string | null;
  created_at: string;
}

export interface SurveySchema {
  fields: SurveyField[];
}

export interface SurveyField {
  id: string;
  type: "text" | "textarea" | "rating" | "nps" | "select" | "multiselect";
  label: string;
  required: boolean;
  options?: string[];
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  user_id: string | null;
  responses: Record<string, unknown>;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  event_id: string;
  passcode: string | null;
  expires_at: string;
  created_at: string;
}

// API types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface RegistrationFormData {
  name: string;
  email?: string;
  consent: boolean;
}

export interface QuestionFormData {
  content: string;
  tags: string[];
}

export interface AnswerFormData {
  content: string;
}

// Intake form types
export type IntakeGoalTag =
  | "learn-ai"
  | "learn-coding"
  | "networking"
  | "find-cofounders"
  | "hire-talent"
  | "find-job"
  | "explore-tools"
  | "other";

export type IntakeOfferTag =
  | "ai-expertise"
  | "software-dev"
  | "design"
  | "business-strategy"
  | "funding-investment"
  | "mentorship"
  | "collaboration"
  | "other";

export interface AttendeeIntake {
  id: string;
  event_id: string;
  user_id: string;
  goals: IntakeGoalTag[];
  goals_other: string | null;
  offers: IntakeOfferTag[];
  offers_other: string | null;
  skipped: boolean;
  created_at: string;
  // Joined fields
  user?: User;
}

export interface IntakeFormData {
  goals: IntakeGoalTag[];
  goalsOther?: string;
  offers: IntakeOfferTag[];
  offersOther?: string;
}

// Group formation types
export type GroupStatus = "pending" | "approved" | "modified" | "rejected";

export interface SuggestedGroup {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  status: GroupStatus;
  created_at: string;
  // Joined fields
  members?: SuggestedGroupMember[];
}

export interface SuggestedGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  match_reason: string | null;
  created_at: string;
  // Joined fields
  user?: User;
  intake?: AttendeeIntake;
}

// Slide types
export interface Slide {
  id: string;
  event_id: string;
  title: string | null;
  image_url: string;
  sort_order: number;
  is_live: boolean;
  created_at: string;
}

// Display page types
export interface DisplayPageData {
  event: Event;
  currentSession: AgendaItem | null;
  nextSession: AgendaItem | null;
  recentQuestions: Question[];
  announcements: Announcement[];
  slides: Slide[];
}

// LLM matching types
export interface GroupMatchingRequest {
  eventId: string;
  intakes: AttendeeIntake[];
  groupSize?: number;
}

export interface GroupMatchingResponse {
  groups: {
    name: string;
    description: string;
    memberIds: string[];
    matchReasons: Record<string, string>;
  }[];
}

// Poll types
export interface Poll {
  id: string;
  event_id: string;
  question: string;
  options: string[];
  ends_at: string | null;
  is_active: boolean;
  show_results: boolean;
  created_at: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  user_id: string;
  option_index: number;
  created_at: string;
}

export interface PollWithVotes extends Poll {
  votes: PollVote[];
  user_vote?: PollVote | null;
  vote_counts: number[];
  total_votes: number;
}
