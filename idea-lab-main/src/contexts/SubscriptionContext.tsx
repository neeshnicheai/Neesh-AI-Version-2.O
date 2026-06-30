import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import apiClient from "@/lib/api";

export interface SubscriptionInfo {
  plan: string;
  projectCount: number;
  maxProjects: number;
  canCreateProject: boolean;
  customLogoUrl: string;
  customBrandingText: string;
  subscriptionExpiresAt: string | null;
}

interface SubscriptionContextType {
  subscription: SubscriptionInfo | null;
  loading: boolean;
  isPro: boolean;
  isFree: boolean;
  isEnterprise: boolean;
  canCreateProject: boolean;
  daysRemaining: number | null;
  upgradeToPro: () => Promise<boolean>;
  updateBranding: (customLogoUrl?: string, customBrandingText?: string) => Promise<boolean>;
  refetch: (force?: boolean) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const lastFetchedUserIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchSubscription = useCallback(async (force = false) => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      lastFetchedUserIdRef.current = null;
      return;
    }

    if (!force && lastFetchedUserIdRef.current === user.id) return;
    if (!force && isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      setLoading(true);
      const data = await apiClient.get<SubscriptionInfo>('/api/users/subscription');
      setSubscription(data);
      lastFetchedUserIdRef.current = user.id;
    } catch (err) {
      console.error("[SubscriptionContext] Error fetching subscription:", err);
      setSubscription({
        plan: "FREE",
        projectCount: 0,
        maxProjects: 5,
        canCreateProject: true,
        customLogoUrl: "",
        customBrandingText: "",
        subscriptionExpiresAt: null,
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const upgradeToPro = async (): Promise<boolean> => {
    try {
      await apiClient.put('/api/users/subscription/upgrade');
      setSubscription(prev => prev ? { ...prev, plan: 'PRO', maxProjects: -1, canCreateProject: true } : prev);
      lastFetchedUserIdRef.current = null;
      return true;
    } catch (err) {
      console.error("[SubscriptionContext] Error upgrading:", err);
      return false;
    }
  };

  const updateBranding = async (customLogoUrl?: string, customBrandingText?: string): Promise<boolean> => {
    try {
      await apiClient.put('/api/users/branding', { customLogoUrl, customBrandingText });
      setSubscription(prev => prev ? {
        ...prev,
        customLogoUrl: customLogoUrl ?? prev.customLogoUrl,
        customBrandingText: customBrandingText ?? prev.customBrandingText,
      } : prev);
      lastFetchedUserIdRef.current = null;
      return true;
    } catch (err) {
      console.error("[SubscriptionContext] Error updating branding:", err);
      return false;
    }
  };

  const isPro = subscription?.plan === "PRO" || subscription?.plan === "PREMIUM" || subscription?.plan === "ENTERPRISE";
  const isFree = !isPro;
  const isEnterprise = subscription?.plan === "ENTERPRISE";
  const canCreateProject = subscription?.canCreateProject ?? true;

  const daysRemaining = useMemo(() => {
    if (!subscription?.subscriptionExpiresAt) return null;
    const expiresAt = new Date(subscription.subscriptionExpiresAt);
    const diffMs = expiresAt.getTime() - Date.now();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }, [subscription?.subscriptionExpiresAt]);

  return (
    <SubscriptionContext.Provider value={{
      subscription, loading, isPro, isFree, isEnterprise,
      canCreateProject, daysRemaining, upgradeToPro, updateBranding,
      refetch: fetchSubscription,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
};
