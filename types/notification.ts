export type NotificationType =
  | "PROPOSAL_RECEIVED"
  | "PROPOSAL_ACCEPTED"
  | "PROPOSAL_DECLINED"
  | "PROPOSAL_WITHDRAWN";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  linkTo?: string | null;
  createdAt: string;
}
