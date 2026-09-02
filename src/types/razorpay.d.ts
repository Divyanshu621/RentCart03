interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id: string | null;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  order_id?: string;
  callback_url?: string;
  redirect?: boolean;
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: boolean;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
    method?: string;
  };
  handler?: (response: RazorpayResponse) => void | Promise<void>;
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (parent: HTMLElement, options: {
            theme?: string;
            size?: string;
            width?: number;
            text?: string;
            shape?: string;
            logo_alignment?: string;
          }) => void;
          prompt: (callback?: () => void) => void;
        };
      };
    };
  }
}

export type { RazorpayOptions, RazorpayResponse, RazorpayInstance, RazorpayOrder };
