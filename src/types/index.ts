export type Role = 'employee' | 'sales_rep' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  phone: string;
  title: string;
  department: string;
  bio: string;
  timezone: string;
  monthlyTarget: number;
  joinedAt: string;
  preferences: Preferences;
}

export interface Preferences {
  emailAlerts: boolean;
  leadAssignments: boolean;
  taskReminders: boolean;
  meetingReminders: boolean;
  weeklyDigest: boolean;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
export type LeadSource = 'website' | 'referral' | 'linkedin' | 'cold_call' | 'event' | 'email_campaign';

export interface FollowUp {
  id: string;
  date: string;
  note: string;
  done: boolean;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: LeadStatus;
  source: LeadSource;
  value: number;
  ownerId: string;
  notes: string;
  followUps: FollowUp[];
  createdAt: string;
  updatedAt: string;
  convertedCustomerId?: string;
}

export type DealStage = 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Deal {
  id: string;
  title: string;
  customerId: string;
  value: number;
  stage: DealStage;
  probability: number;
  ownerId: string;
  expectedClose: string;
  createdAt: string;
  closedAt?: string;
}

export type CustomerStatus = 'active' | 'inactive' | 'at_risk';

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  location: string;
  website: string;
  status: CustomerStatus;
  ownerId: string;
  tags: string[];
  notes: string;
  since: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  ownerId: string;
  customerId?: string;
  leadId?: string;
  createdAt: string;
  completedAt?: string;
}

export type ActivityType = 'call' | 'meeting' | 'email' | 'note' | 'follow_up';
export type ActivityOutcome = 'positive' | 'neutral' | 'negative';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  date: string;
  duration?: number;
  outcome?: ActivityOutcome;
  customerId?: string;
  leadId?: string;
  dealId?: string;
  ownerId: string;
}

export type NotificationType = 'lead_assigned' | 'task_reminder' | 'meeting' | 'deal' | 'update';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  link?: string;
  userId: string;
}

export type Permission =
  | 'leads.create'
  | 'leads.edit'
  | 'leads.delete'
  | 'pipeline.manage'
  | 'customers.create'
  | 'customers.edit'
  | 'tasks.manage'
  | 'activities.log'
  | 'team.view';

export interface ToastItem {
  id: string;
  kind: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}
