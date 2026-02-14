// @/utils/stripe-api.ts - BRAND NEW FILE

export interface StripePaymentPayload {
  amount: number;
  customerId: string;
  consultationLogId: string;
  consultationTopic: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  astrologerId: string;
  slotId: string;
  consultationType: string;
}

export const createStripePayment = async (payload: StripePaymentPayload) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/customers/create-stripe-payment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Stripe API error:', error);
    throw error;
  }
};

export const verifyStripePayment = async (sessionId: string, consultationLogId: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/customers/verify-stripe-payment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          consultationLogId
        })
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Stripe verification error:', error);
    throw error;
  }
};