/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from "../lib/supabase";

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

/**
 * Service to send transactional emails via the backend Resend integration.
 */
export const emailService = {
  /**
   * Sends an email using the backend API.
   * Requires a valid session token for authentication.
   */
  async sendEmail(payload: EmailPayload) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = "Failed to send email";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON (e.g. HTML 404/500 from server)
          const text = await response.text();
          console.warn("Server returned non-JSON error:", text.substring(0, 500));
          errorMessage = `Server Error (${response.status}): The server returned an invalid response.`;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      } else {
        const text = await response.text();
        console.warn("Server returned non-JSON success:", text.substring(0, 500));
        return { success: true, raw: text };
      }
    } catch (error: any) {
      console.error("Email service error:", error);
      throw error;
    }
  },

  /**
   * Sends a welcome email to a new lead/customer.
   */
  async sendWelcomeEmail(to: string, businessName: string) {
    return this.sendEmail({
      to,
      subject: `Welcome to ${businessName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">Welcome to ${businessName}!</h2>
          <p>Thank you for your interest in our services. We are excited to have you with us.</p>
          <p>Our team will reach out to you shortly with more information.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">This is an automated message from ${businessName} powered by Bennie Tay Studio.</p>
        </div>
      `
    });
  },

  /**
   * Sends a notification to the business owner about a new lead.
   */
  async sendLeadNotification(ownerEmail: string, leadData: { name: string, email: string, message?: string }, businessName: string) {
    return this.sendEmail({
      to: ownerEmail,
      subject: `New Lead for ${businessName}: ${leadData.name}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">New Lead Received!</h2>
          <p>You have a new lead from your website <strong>${businessName}</strong>.</p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${leadData.name}</p>
            <p><strong>Email:</strong> ${leadData.email}</p>
            ${leadData.message ? `<p><strong>Message:</strong> ${leadData.message}</p>` : ""}
          </div>
          <p>Log in to your dashboard to manage this lead.</p>
        </div>
      `
    });
  }
};
