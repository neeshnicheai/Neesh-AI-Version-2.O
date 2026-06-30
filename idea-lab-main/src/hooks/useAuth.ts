import { useAuthContext } from "@/contexts/AuthContext";
import apiClient from "@/lib/api";

export const useAuth = () => {
  const context = useAuthContext();

  const getAccessToken = async (): Promise<string | null> => {
    const session = await apiClient.safeGetSession();
    return session?.access_token ?? null;
  };

  return {
    ...context,
    getAccessToken,
  };
};

