export type ProposalStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";

export interface Proposal {
  id: string;
  title: string;
  description: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  timeline?: string | null;
  scopeNotes?: string | null;
  status: ProposalStatus;
  declineReason?: string | null;
  clientId: string;
  freelancerId: string;
  projectId?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    email: string;
    freelancerProfile?: {
      fullName: string;
      avatarUrl?: string | null;
      title?: string;
    } | null;
  };
  freelancer?: {
    id: string;
    email: string;
    freelancerProfile?: {
      fullName: string;
      avatarUrl?: string | null;
      title?: string;
    } | null;
  };
  project?: {
    id: string;
    title: string;
    status: string;
  } | null;
}

export interface CreateProposalInput {
  freelancerId: string;
  title: string;
  description: string;
  budgetMin?: number;
  budgetMax?: number;
  timeline?: string;
  scopeNotes?: string;
}

export interface RespondToProposalInput {
  action: "ACCEPT" | "DECLINE";
  declineReason?: string;
}
