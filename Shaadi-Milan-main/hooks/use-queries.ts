import { useQuery, useMutation, useQueryClient ,useInfiniteQuery,InfiniteData } from '@tanstack/react-query';
import { api } from '@/lib/api';

import { firebaseApi } from '@/lib/api';
import { OriginalUser, OriginalAgent } from '@/types';

import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";

type UsersResponse = {
  users: OriginalUser[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
};
type AgentsResponse = {
  agents: OriginalAgent[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
};

type PaymentsResponse = {
  payments: any[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
};
type NotificationsResponse = {
  notifications: any[];
  lastDocId: string | null;
};
// ─── Query Keys ──────────────────────────────────────────────────────────────
export const QUERY_KEYS = {
  dashboard: ['dashboard'] as const,
  monthly: (period: string) => ['monthly', period] as const,
  weekly: ['weekly'] as const,
  users: (filters?: object) => ['users', filters] as const,
  user: (id: string) => ['user', id] as const,
  agents: ['agents'] as const,
  agent: (id: string) => ['agent', id] as const,
  approvals: ['approvals'] as const,
  orders: (filters?: object) => ['orders', filters] as const,
  notifications: ['notifications'] as const,
  payments: (filters?: object) => ['payments', filters] as const,
} as const;

// ─── Dashboard ───────────────────────────────────────────────────────────────
export function useDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: api.getDashboardStats,
  });
}

export function useDashboardCounts() {
  return useQuery({
    queryKey: ["dashboard-counts"],
    queryFn: firebaseApi.getDashboardCounts,
    staleTime: 1000 * 60 * 5, // cache 5 min
  });
}

// payments
export function usePaginatedPayments(filters?: {
  agentId?: string;
  status?: string;
  paymentType?: string;
  search?: string;
}) {
  return useInfiniteQuery<
    PaymentsResponse,
    Error,
    InfiniteData<PaymentsResponse>,
    [string, typeof filters],
    QueryDocumentSnapshot<DocumentData> | null
  >({
    queryKey: ["payments", filters] as const,

    queryFn: ({ pageParam }) =>
      firebaseApi.getPaymentsPaginated({
        ...filters,
        lastDoc: pageParam ?? null,
        pageSize: 10,
      }),

    getNextPageParam: (lastPage) => lastPage.lastDoc ?? null,

    initialPageParam: null,

    gcTime: 0,
  });
}
export function usePaymentsSummary(filters?: {
  agentId?: string;
}) {
  return useQuery({
    queryKey: ["payments-summary", filters],
    queryFn: () => firebaseApi.getPaymentsSummary(filters),
  });
}

// Users
export function useOriginalUsers(filters?: {
  gender?: string;
  state?: string;
  status?: string;
  agentId?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.users(filters),
    queryFn: () => firebaseApi.getUsers(filters),
  });
}

export function useUsersStats() {
  return useQuery({
    queryKey: ["users-stats"],
    queryFn: firebaseApi.getUsersStats,
    staleTime: 1000 * 60 * 5, // cache 5 min
  });
}


export function usePaginatedUsers(filters?: {
  gender?: string;
  state?: string;
  status?: string;
  agentId?: string;
  search?: string;
}) {
  return useInfiniteQuery<
    UsersResponse,
    Error,
    InfiniteData<UsersResponse>, // ✅ FIXED
    [string, typeof filters],
    QueryDocumentSnapshot<DocumentData> | null
  >({
    queryKey: ["users", filters] as const,

    queryFn: ({ pageParam }) =>
      firebaseApi.getUsersPaginated({
        ...filters,
        lastDoc: pageParam ?? null,
        pageSize: 10,
      }),

    getNextPageParam: (lastPage) => lastPage.lastDoc ?? null,

    initialPageParam: null,

    gcTime: 0,
  });
}

export function useOriginalUser(uid: string) {
  return useQuery({
    queryKey: QUERY_KEYS.user(uid),
    queryFn: () => firebaseApi.getUser(uid),
    enabled: !!uid,
  });
}

export function useUpdateOriginalUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, data }: { uid: string; data: Parameters<typeof firebaseApi.updateUser>[1] }) =>
      firebaseApi.updateUser(uid, data),
    onSuccess: (_, { uid }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.users() });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.user(uid) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
    },
  });
}

// Agents
export function useOriginalAgents() {
  return useQuery({
    queryKey: QUERY_KEYS.agents,
    queryFn: firebaseApi.getAgents,
  });
}

export function useAgentsStats() {
  return useQuery({
    queryKey: ["agents-stats"],
    queryFn: firebaseApi.getAgentsStats,
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
}



export function usePaginatedAgents(filters?: {
  search?: string;
}) {
  return useInfiniteQuery<
    AgentsResponse, // queryFn return
    Error,
    AgentsResponse, // data per page
    [string, typeof filters],
    QueryDocumentSnapshot<DocumentData> | null
  >({
    queryKey: ["agents", filters],

    queryFn: ({ pageParam }) =>
      firebaseApi.getAgentsPaginated({
        ...filters,
        lastDoc: pageParam ?? null,
        pageSize: 10,
      }),

    getNextPageParam: (lastPage) => lastPage.lastDoc ?? null,

    initialPageParam: null,
  });
}

export function useOriginalAgent(uid: string) {
  return useQuery({
    queryKey: QUERY_KEYS.agent(uid),
    queryFn: () => firebaseApi.getAgent(uid),
    enabled: !!uid,
  });
}

export function useUpdateAgent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      uid,
      data,
    }: {
      uid: string;
      data: Partial<OriginalAgent>;
    }) => firebaseApi.updateAgent(uid, data),

    onSuccess: (_, { uid }) => {
      console.log("Invalidating queries...");

      qc.invalidateQueries({ queryKey: ["agents"] });
      qc.invalidateQueries({ queryKey: ["agent", uid] });
      qc.invalidateQueries({ queryKey: ["agents-stats"] });
    },
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: firebaseApi.createAgentWithAuth,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uid: string) => firebaseApi.deleteAgent(uid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      qc.invalidateQueries({ queryKey: ["agents-stats"] });
    },
  });
}

export function useApproveAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, isApproved }: { uid: string; isApproved: boolean }) =>
      firebaseApi.updateAgent(uid, { isApproved, isRejected: false }),
    onSuccess: (_, { uid }) => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      qc.invalidateQueries({ queryKey: ["agent", uid] });
      qc.invalidateQueries({ queryKey: ["agents-stats"] });
    },
  });
}

// Add this hook
export function useUsersWithProfiles(filters?: {
  gender?: string;
  state?: string;
  agentId?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['users-with-profiles', filters],
    queryFn: () => firebaseApi.getUsersWithProfiles(filters),
  });
}



//amours
export const useAmounts = () => {
  return useQuery({
    queryKey: ["amounts"],
    queryFn: firebaseApi.getAmounts,
  });
};
export const useUpdateAmount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: firebaseApi.updateAmount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amounts"] });
    },
  });
};

// Update the existing useUsers hook to work with profiles
// export function useUsers(filters?: {
//   gender?: string;
//   state?: string;
//   status?: string;
//   agentId?: string;
//   search?: string;
// }) {
//   return useQuery({
//     queryKey: QUERY_KEYS.users(filters),
//     queryFn: () => api.getUsers(filters), // Keep using mock data or switch to real
//   });
// }

// notifications
export function useSendNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { target: string; title: string; message: string }) =>
      firebaseApi.sendBulkNotification(data),
    onSuccess: () => {
      // Invalidate both the notifications list and dashboard counts
      queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-counts'] });
    },
  });
}

export function useAllNotifications(filters?: {
  target?: string;
  status?: string;
}) {
  return useInfiniteQuery<NotificationsResponse, Error, InfiniteData<NotificationsResponse>, [string, typeof filters], string | null>({
    queryKey: ['all-notifications', filters],
    queryFn: async ({ pageParam }) => {
      const result = await firebaseApi.getAllNotifications({
        ...filters,
        lastDocId: pageParam || undefined,
        limit: 20,
      });
      return result;
    },
    getNextPageParam: (lastPage) => lastPage.lastDocId,
    initialPageParam: null,
  });
}
// ─── Monthly Data ─────────────────────────────────────────────────────────────
export function useMonthlyData(period: string) {
  return useQuery({
    queryKey: QUERY_KEYS.monthly(period),
    queryFn: () => api.getMonthlyData(period),
  });
}

// ─── Weekly Data ──────────────────────────────────────────────────────────────
export function useWeeklyData() {
  return useQuery({
    queryKey: QUERY_KEYS.weekly,
    queryFn: api.getWeeklyData,
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────
export function useUsers(filters?: {
  gender?: string;
  state?: string;
  status?: string;
  agentId?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.users(filters),
    queryFn: () => api.getUsers(filters),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.user(id),
    queryFn: () => api.getUser(id),
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateUser>[1] }) =>
      api.updateUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

// ─── Agents ───────────────────────────────────────────────────────────────────
export function useAgents() {
  return useQuery({
    queryKey: QUERY_KEYS.agents,
    queryFn: api.getAgents,
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.agent(id),
    queryFn: () => api.getAgent(id),
    enabled: !!id,
  });
}

// export function useCreateAgent() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: api.createAgent,
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: QUERY_KEYS.agents });
//     },
//   });
// }

// ─── Approvals ────────────────────────────────────────────────────────────────
export function usePendingApprovals() {
  return useQuery({
    queryKey: QUERY_KEYS.approvals,
    queryFn: api.getPendingApprovals,
    refetchInterval: 30000, // poll every 30s
  });
}

export function useProcessApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'Approved' | 'Rejected' }) =>
      api.processApproval(id, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.approvals });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
    },
  });
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export function useOrders(filters?: { status?: string; userType?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.orders(filters),
    queryFn: () => api.getOrders(filters),
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────
export function useNotifications() {
  return useQuery({
    queryKey: QUERY_KEYS.notifications,
    queryFn: api.getNotifications,
  });
}

// export function useSendNotification() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: api.sendNotification,
//     onSuccess: () => {
//       qc.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
//     },
//   });
// }
