import { ApiUserDTO, ApiEmployeeDTO, AuditLogDTO } from "@/lib/api-client";
import { AppUser } from "@/lib/auth-store";

export interface UsersViewProps {
  currentUser?: AppUser | null;
}

export interface UserModalsProps {
  // Edit
  editingUser: ApiUserDTO | null;
  editFullName: string;
  setEditFullName: (val: string) => void;
  editEmail: string;
  setEditEmail: (val: string) => void;
  editDepartment: string;
  setEditDepartment: (val: string) => void;
  editDesignation: string;
  setEditDesignation: (val: string) => void;
  editEmployeeId: string;
  setEditEmployeeId: (val: string) => void;
  editRole: string;
  setEditRole: (val: string) => void;
  editStatus: string;
  setEditStatus: (val: string) => void;
  handleEditSubmit: (e: React.FormEvent) => Promise<void>;
  onCloseEdit: () => void;

  // Password Reset
  passwordResetUser: ApiUserDTO | null;
  resetNewPassword: string;
  setResetNewPassword: (val: string) => void;
  resetForceReset: boolean;
  setResetForceReset: (val: boolean) => void;
  resetRevokeSessions: boolean;
  setResetRevokeSessions: (val: boolean) => void;
  handlePasswordResetSubmit: (e: React.FormEvent) => Promise<void>;
  onClosePasswordReset: () => void;

  // Revoke Sessions
  revokeSessionUser: ApiUserDTO | null;
  revokeReason: string;
  setRevokeReason: (val: string) => void;
  handleRevokeSessionsSubmit: (e: React.FormEvent) => Promise<void>;
  onCloseRevokeSession: () => void;

  // Toggle Status
  statusToggleUser: ApiUserDTO | null;
  handleToggleStatus: () => Promise<void>;
  onCloseStatusToggle: () => void;

  // Delete User
  deleteTargetUser: ApiUserDTO | null;
  handleDeleteUser: () => Promise<void>;
  onCloseDelete: () => void;

  isSubmitting: boolean;
  employees: ApiEmployeeDTO[];
}
