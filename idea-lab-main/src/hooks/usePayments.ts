import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import apiClient from "@/lib/api";
import { useNavigate, useSearchParams } from "react-router-dom";

declare global {
  interface Window {
    Cashfree: any;
  }
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8081";

export const usePayments = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getToken = async (): Promise<string | null> => {
    const session = await apiClient.safeGetSession();
    return session?.access_token || null;
  };

  const createOrder = async (amount: number, couponCode?: string) => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        toast({
          title: "Not logged in",
          description: "Please log in to proceed with payment.",
          variant: "destructive",
        });
        return null;
      }

      const body: Record<string, any> = { amount };
      if (couponCode) body.couponCode = couponCode;

      const data = await apiClient.post<any>('/api/payments/create-order', body);
      return data;
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPayment = async (orderId: string) => {
    try {
      const data = await apiClient.post<any>('/api/payments/verify-status', { order_id: orderId });
      return data;
    } catch (error: any) {
      console.error("Verification error:", error);
      return null;
    }
  };

  const handleCheckout = async (amount: number, couponCode?: string) => {
    const orderData = await createOrder(amount, couponCode);
    if (!orderData || !orderData.payment_session_id) return;

    try {
      const cashfree = new window.Cashfree({
        mode: "sandbox" // Change to "production" for live
      });

      const checkoutOptions = {
        paymentSessionId: orderData.payment_session_id,
        redirectTarget: "_self",
      };

      cashfree.checkout(checkoutOptions);
    } catch (err: any) {
      console.error("Cashfree checkout error:", err);
      toast({
        title: "Checkout Error",
        description: "Failed to open payment window. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    handleCheckout,
    verifyPayment,
    createOrder,
    isLoading
  };
};

/**
 * Hook to verify payment on return from Cashfree redirect.
 * Use this on the Dashboard page to auto-verify after redirect.
 */
export const usePaymentVerification = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const orderId = searchParams.get("order_id");
    if (!orderId) return;

    const verify = async () => {
      setVerifying(true);
      try {
        const data = await apiClient.post<any>('/api/payments/verify-status', { order_id: orderId });
        
        if (data.status === "SUCCESS") {
          toast({
            title: "🎉 Payment Successful!",
            description: "You've been upgraded to Pro. Enjoy unlimited projects and promotion access!",
          });
        } else {
          toast({
            title: "Payment Pending",
            description: "Your payment is being processed. Please check back shortly.",
          });
        }
      } catch (err) {
        console.error("Payment verification error:", err);
      } finally {
        setVerifying(false);
        // Remove order_id from URL to prevent re-verification
        searchParams.delete("order_id");
        setSearchParams(searchParams, { replace: true });
      }
    };

    verify();
  }, []);

  return { verifying };
};
