var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/supabase.ts
var supabase_exports = {};
__export(supabase_exports, {
  getSupabaseOrThrow: () => getSupabaseOrThrow,
  isSupabaseConfigured: () => isSupabaseConfigured,
  supabase: () => supabase,
  testSupabaseConnection: () => testSupabaseConnection,
  validateSupabaseConnection: () => validateSupabaseConnection
});
import { createClient } from "@supabase/supabase-js";
function isSupabaseConfigured() {
  return supabase !== null;
}
function getSupabaseOrThrow() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to Replit Secrets. See SETUP.md for instructions."
    );
  }
  return supabase;
}
async function testSupabaseConnection() {
  if (!supabase) {
    return { connected: false, error: "Supabase client not initialized - missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" };
  }
  try {
    const { error: error2 } = await supabase.auth.getSession();
    if (error2) {
      return { connected: false, error: error2.message };
    }
    return { connected: true };
  } catch (err) {
    return { connected: false, error: err.message || "Unknown connection error" };
  }
}
async function validateSupabaseConnection() {
  const result = await testSupabaseConnection();
  if (result.connected) {
    console.log("[SUPABASE] Connection validated - Supabase connected");
  } else {
    console.error(`[SUPABASE] Connection failed: ${result.error}`);
  }
}
var supabaseUrl, supabaseServiceKey, supabase;
var init_supabase = __esm({
  "server/supabase.ts"() {
    "use strict";
    supabaseUrl = process.env.SUPABASE_URL;
    supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    supabase = null;
    if (supabaseUrl && supabaseServiceKey) {
      if (!supabaseUrl.includes("supabase.co") && !supabaseUrl.includes("supabase.in")) {
        console.warn("[SUPABASE] Warning: SUPABASE_URL does not appear to be a valid Supabase URL");
      }
      supabase = createClient(supabaseUrl, supabaseServiceKey);
      console.log("[SUPABASE] Client initialized successfully");
    } else {
      const missing = [];
      if (!supabaseUrl) missing.push("SUPABASE_URL");
      if (!supabaseServiceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
      console.warn(
        `[WARN] Supabase configuration incomplete. Missing: ${missing.join(", ")}
[WARN] Database features will not work until Supabase is configured.
[WARN] Add these variables to Replit Secrets to enable full functionality.
[WARN] See SETUP.md for detailed instructions.`
      );
    }
  }
});

// server/email.ts
var email_exports = {};
__export(email_exports, {
  getAgentInquiryEmailTemplate: () => getAgentInquiryEmailTemplate,
  getApplicationConfirmationEmailTemplate: () => getApplicationConfirmationEmailTemplate,
  getApplicationStatusEmailTemplate: () => getApplicationStatusEmailTemplate,
  getApprovalConfirmationEmailTemplate: () => getApprovalConfirmationEmailTemplate,
  getBackgroundCheckEmailTemplate: () => getBackgroundCheckEmailTemplate,
  getCoApplicantInvitationEmailTemplate: () => getCoApplicantInvitationEmailTemplate,
  getCoApplicantInviteEmailTemplate: () => getCoApplicantInviteEmailTemplate,
  getDocumentRequestEmailTemplate: () => getDocumentRequestEmailTemplate,
  getExpirationWarningEmailTemplate: () => getExpirationWarningEmailTemplate,
  getNewApplicationNotificationTemplate: () => getNewApplicationNotificationTemplate,
  getPaymentReceiptEmailTemplate: () => getPaymentReceiptEmailTemplate,
  getScoringCompleteEmailTemplate: () => getScoringCompleteEmailTemplate,
  getVerificationCompleteEmailTemplate: () => getVerificationCompleteEmailTemplate,
  sendEmail: () => sendEmail
});
import sgMail from "@sendgrid/mail";
import escapeHtml from "escape-html";
async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY ? "repl " + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? "depl " + process.env.WEB_REPL_RENEWAL : null;
  if (!xReplitToken || !hostname) {
    throw new Error("Replit connector token not available");
  }
  const response = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=sendgrid",
    {
      headers: {
        "Accept": "application/json",
        "X_REPLIT_TOKEN": xReplitToken
      }
    }
  );
  const data = await response.json();
  const connectionSettings = data.items?.[0];
  if (!connectionSettings || (!connectionSettings.settings.api_key || !connectionSettings.settings.from_email)) {
    throw new Error("SendGrid not connected");
  }
  return {
    apiKey: connectionSettings.settings.api_key,
    email: connectionSettings.settings.from_email
  };
}
async function getSendGridClient() {
  const { apiKey, email } = await getCredentials();
  sgMail.setApiKey(apiKey);
  return { client: sgMail, fromEmail: email };
}
async function sendEmail({
  to,
  subject,
  html,
  from
}) {
  try {
    const { client, fromEmail } = await getSendGridClient();
    await client.send({
      to,
      from: from || fromEmail,
      subject,
      html
    });
    console.log(`[EMAIL] Sent email to ${to}: ${subject}`);
    return { success: true };
  } catch (error2) {
    if (error2.message?.includes("not connected") || error2.message?.includes("not available")) {
      console.log(`[EMAIL] Mock email to ${to}: ${subject}`);
      return { success: true, mock: true };
    }
    console.error("[EMAIL] Failed to send email:", error2);
    return { success: false, error: error2 };
  }
}
function getAgentInquiryEmailTemplate(data) {
  return `
    <h2>New Inquiry from Choice Properties</h2>
    <p><strong>From:</strong> ${escapeHtml(data.senderName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(data.senderEmail)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(data.senderPhone)}</p>
    ${data.propertyTitle ? `<p><strong>Property:</strong> ${escapeHtml(data.propertyTitle)}</p>` : ""}
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(data.message)}</p>
    <p>Please reply to ${escapeHtml(data.senderEmail)} to respond.</p>
  `;
}
function getApplicationConfirmationEmailTemplate(data) {
  return `
    <h2>Application Received!</h2>
    <p>Hi ${escapeHtml(data.applicantName)},</p>
    <p>We've received your application for <strong>${escapeHtml(data.propertyTitle)}</strong>.</p>
    <p>Your application is currently under review. You'll hear from us within 3-5 business days.</p>
    <p>Best regards,<br>Choice Properties Team</p>
  `;
}
function getApplicationStatusEmailTemplate(data) {
  const statusTemplates = {
    pending: `
      <h2>Application Submitted Successfully</h2>
      <p>Dear ${escapeHtml(data.applicantName)},</p>
      <p>Your application for <strong>${escapeHtml(data.propertyTitle)}</strong> has been successfully submitted and is now pending review.</p>
      <p>We will notify you once the property owner reviews your application.</p>
      <p>Best regards,<br>Choice Properties Team</p>
    `,
    under_review: `
      <h2>Application Under Review</h2>
      <p>Dear ${escapeHtml(data.applicantName)},</p>
      <p>Great news! Your application for <strong>${escapeHtml(data.propertyTitle)}</strong> is now being actively reviewed by the property owner.</p>
      <p>We will keep you updated on any changes to your application status.</p>
      <p>Best regards,<br>Choice Properties Team</p>
    `,
    pending_verification: `
      <h2>Verification Required</h2>
      <p>Dear ${escapeHtml(data.applicantName)},</p>
      <p>Your application for <strong>${escapeHtml(data.propertyTitle)}</strong> requires additional verification.</p>
      <p>Please ensure all your documents are up to date and accurate. You may be contacted for additional information.</p>
      <p>Best regards,<br>Choice Properties Team</p>
    `,
    approved: `
      <h2>Congratulations! Application Approved</h2>
      <p>Dear ${escapeHtml(data.applicantName)},</p>
      <p>We are pleased to inform you that your application for <strong>${escapeHtml(data.propertyTitle)}</strong> has been approved!</p>
      <p>The property owner will be in touch with you shortly regarding the next steps for your lease agreement.</p>
      <p>Best regards,<br>Choice Properties Team</p>
    `,
    approved_pending_lease: `
      <h2>Approved - Lease Pending</h2>
      <p>Dear ${escapeHtml(data.applicantName)},</p>
      <p>Your application for <strong>${escapeHtml(data.propertyTitle)}</strong> has been approved and is pending lease signing.</p>
      <p>Please check your email for the lease agreement and follow the instructions to complete the process.</p>
      <p>Best regards,<br>Choice Properties Team</p>
    `,
    rejected: `
      <h2>Application Status Update</h2>
      <p>Dear ${escapeHtml(data.applicantName)},</p>
      <p>We regret to inform you that your application for <strong>${escapeHtml(data.propertyTitle)}</strong> was not approved at this time.</p>
      ${data.rejectionReason ? `<p><strong>Reason:</strong> ${escapeHtml(data.rejectionReason)}</p>` : ""}
      ${data.appealable ? "<p>If you believe this decision was made in error, you may appeal by contacting the property owner.</p>" : ""}
      <p>We encourage you to continue your search for the perfect home.</p>
      <p>Best regards,<br>Choice Properties Team</p>
    `,
    withdrawn: `
      <h2>Application Withdrawn</h2>
      <p>Dear ${escapeHtml(data.applicantName)},</p>
      <p>Your application for <strong>${escapeHtml(data.propertyTitle)}</strong> has been withdrawn as requested.</p>
      <p>If you wish to apply again in the future, please submit a new application.</p>
      <p>Best regards,<br>Choice Properties Team</p>
    `,
    expired: `
      <h2>Application Expired</h2>
      <p>Dear ${escapeHtml(data.applicantName)},</p>
      <p>Your application for <strong>${escapeHtml(data.propertyTitle)}</strong> has expired due to inactivity.</p>
      <p>If you are still interested in this property, please submit a new application.</p>
      <p>Best regards,<br>Choice Properties Team</p>
    `
  };
  return statusTemplates[data.status] || statusTemplates.pending;
}
function getExpirationWarningEmailTemplate(data) {
  return `
    <h2>Application Expiring Soon</h2>
    <p>Dear ${escapeHtml(data.applicantName)},</p>
    <p>Your application for <strong>${escapeHtml(data.propertyTitle)}</strong> will expire in ${data.daysRemaining} day${data.daysRemaining === 1 ? "" : "s"}.</p>
    <p>Please log in to your account to complete any missing information or contact us if you need more time.</p>
    <p>Best regards,<br>Choice Properties Team</p>
  `;
}
function getDocumentRequestEmailTemplate(data) {
  const docList = data.requiredDocuments.map((doc) => `<li>${escapeHtml(doc)}</li>`).join("");
  return `
    <h2>Documents Required</h2>
    <p>Dear ${escapeHtml(data.applicantName)},</p>
    <p>To continue processing your application for <strong>${escapeHtml(data.propertyTitle)}</strong>, we need the following documents:</p>
    <ul>${docList}</ul>
    <p>Please upload these documents through your dashboard as soon as possible.</p>
    <p>Best regards,<br>Choice Properties Team</p>
  `;
}
function getCoApplicantInvitationEmailTemplate(data) {
  return `
    <h2>You've Been Invited to Join an Application</h2>
    <p>Dear ${escapeHtml(data.coApplicantName)},</p>
    <p>${escapeHtml(data.mainApplicantName)} has invited you to be a co-applicant for the property <strong>${escapeHtml(data.propertyTitle)}</strong> on Choice Properties.</p>
    <p>As a co-applicant, you'll need to provide information about your income, employment, and rental history to strengthen the application.</p>
    <p>To complete your co-applicant profile, please click the link below:</p>
    ${data.invitationLink ? `<p><a href="${escapeHtml(data.invitationLink)}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Complete Co-Applicant Profile</a></p>` : ""}
    <p>If you have any questions or need assistance, please contact the property owner or our support team.</p>
    <p>Best regards,<br>Choice Properties Team</p>
  `;
}
function getNewApplicationNotificationTemplate(data) {
  return `
    <h2>New Application Received</h2>
    <p>Dear ${escapeHtml(data.ownerName)},</p>
    <p>A new application has been submitted for your property <strong>${escapeHtml(data.propertyTitle)}</strong>.</p>
    <p><strong>Applicant:</strong> ${escapeHtml(data.applicantName)}</p>
    <p>Please log in to your dashboard to review the application and take action.</p>
    <p>Best regards,<br>Choice Properties Team</p>
  `;
}
function getScoringCompleteEmailTemplate(data) {
  const percentage = Math.round(data.score / data.maxScore * 100);
  return `
    <h2>Application Scored</h2>
    <p>Dear ${escapeHtml(data.ownerName)},</p>
    <p>The application from <strong>${escapeHtml(data.applicantName)}</strong> for <strong>${escapeHtml(data.propertyTitle)}</strong> has been scored.</p>
    <p><strong>Score:</strong> ${data.score}/${data.maxScore} (${percentage}%)</p>
    <p>Log in to your dashboard to review the full score breakdown and make a decision.</p>
    <p>Best regards,<br>Choice Properties Team</p>
  `;
}
function getCoApplicantInviteEmailTemplate(data) {
  return `
    <h2>You've Been Added as a Co-Applicant</h2>
    <p>Dear ${escapeHtml(data.coApplicantName)},</p>
    <p><strong>${escapeHtml(data.primaryApplicantName)}</strong> has added you as a ${escapeHtml(data.relationship)} on their rental application for <strong>${escapeHtml(data.propertyTitle)}</strong>.</p>
    <p>To complete the application, you'll need to verify your identity and provide some basic information.</p>
    <p><a href="${escapeHtml(data.applicationLink)}" style="display: inline-block; background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Complete Your Application</a></p>
    <p>If you did not expect this invitation, please ignore this email or contact us.</p>
    <p>Best regards,<br>Choice Properties Team</p>
  `;
}
function getBackgroundCheckEmailTemplate(data) {
  return `
    <h2>Background Check Initiated</h2>
    <p>Dear ${escapeHtml(data.applicantName)},</p>
    <p>As part of your application for <strong>${escapeHtml(data.propertyTitle)}</strong>, we have initiated a background verification process.</p>
    <p>This typically includes:</p>
    <ul>
      <li>Identity verification</li>
      <li>Employment verification</li>
      <li>Rental history review</li>
      <li>Credit assessment</li>
      <li>Background screening</li>
    </ul>
    <p>This process usually takes 5-10 business days. We'll notify you when it's complete.</p>
    <p>Best regards,<br>Choice Properties Team</p>
  `;
}
function getVerificationCompleteEmailTemplate(data) {
  if (data.passed) {
    return `
      <h2>Verification Complete - Passed</h2>
      <p>Dear ${escapeHtml(data.applicantName)},</p>
      <p>Great news! The verification process for your application to <strong>${escapeHtml(data.propertyTitle)}</strong> has been completed successfully.</p>
      <p>Your application is now pending final review by the property owner. We'll notify you once a decision has been made.</p>
      <p>Best regards,<br>Choice Properties Team</p>
    `;
  } else {
    return `
      <h2>Verification Update</h2>
      <p>Dear ${escapeHtml(data.applicantName)},</p>
      <p>The verification process for your application to <strong>${escapeHtml(data.propertyTitle)}</strong> has been completed. Unfortunately, some items require additional attention.</p>
      <p>Please check your application dashboard for more details or contact us if you have questions.</p>
      <p>Best regards,<br>Choice Properties Team</p>
    `;
  }
}
function getApprovalConfirmationEmailTemplate(data) {
  const receiptSection = data.applicationFee ? `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Payment Receipt</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Transaction ID:</td>
          <td style="padding: 8px 0; text-align: right; font-family: monospace; color: #1e293b;">${escapeHtml(data.transactionId || "N/A")}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Payment Date:</td>
          <td style="padding: 8px 0; text-align: right; color: #1e293b;">${escapeHtml(data.paymentDate || (/* @__PURE__ */ new Date()).toLocaleDateString())}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Application Fee:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #1e293b;">$${data.applicationFee.toFixed(2)}</td>
        </tr>
        <tr style="border-top: 2px solid #e2e8f0;">
          <td style="padding: 12px 0 0; font-weight: bold; color: #1e293b;">Total Paid:</td>
          <td style="padding: 12px 0 0; text-align: right; font-weight: bold; font-size: 18px; color: #16a34a;">$${data.applicationFee.toFixed(2)}</td>
        </tr>
      </table>
    </div>
  ` : "";
  const nextStepsSection = `
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; color: #166534; font-size: 16px;">Next Steps</h3>
      <ol style="margin: 0; padding-left: 20px; color: #166534;">
        <li style="margin-bottom: 10px;">Review and sign your lease agreement (you'll receive this separately)</li>
        ${data.securityDeposit ? `<li style="margin-bottom: 10px;">Pay security deposit: <strong>$${data.securityDeposit.toFixed(2)}</strong></li>` : ""}
        ${data.moveInDate ? `<li style="margin-bottom: 10px;">Prepare for your move-in date: <strong>${escapeHtml(data.moveInDate)}</strong></li>` : ""}
        <li style="margin-bottom: 10px;">Schedule your move-in inspection with the property owner</li>
        <li>Set up utilities in your name before moving in</li>
      </ol>
    </div>
  `;
  const contactSection = data.landlordName ? `
    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 16px;">Property Owner Contact</h3>
      <p style="margin: 5px 0; color: #1e3a8a;"><strong>${escapeHtml(data.landlordName)}</strong></p>
      ${data.landlordEmail ? `<p style="margin: 5px 0; color: #3b82f6;">${escapeHtml(data.landlordEmail)}</p>` : ""}
      ${data.landlordPhone ? `<p style="margin: 5px 0; color: #3b82f6;">${escapeHtml(data.landlordPhone)}</p>` : ""}
    </div>
  ` : "";
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Congratulations!</h1>
        <p style="color: #bbf7d0; margin: 10px 0 0;">Your Application Has Been Approved</p>
      </div>
      
      <div style="padding: 30px; background: white; border: 1px solid #e2e8f0; border-top: none;">
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Dear ${escapeHtml(data.applicantName)},</p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          We are thrilled to inform you that your rental application for <strong>${escapeHtml(data.propertyTitle)}</strong> has been approved!
        </p>
        
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #64748b; font-size: 14px;">Property Address</p>
          <p style="margin: 5px 0 0; color: #1e293b; font-size: 16px; font-weight: 600;">${escapeHtml(data.propertyAddress)}</p>
          ${data.monthlyRent ? `<p style="margin: 10px 0 0; color: #64748b; font-size: 14px;">Monthly Rent: <strong style="color: #1e293b;">$${data.monthlyRent.toFixed(2)}</strong></p>` : ""}
        </div>

        ${receiptSection}
        ${nextStepsSection}
        ${contactSection}
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
          <p style="color: #374151; font-size: 14px; line-height: 1.6;">
            Thank you for choosing Choice Properties. We're excited to help you find your perfect home!
          </p>
          <p style="color: #374151; font-size: 14px;">
            Best regards,<br>
            <strong>The Choice Properties Team</strong>
          </p>
        </div>
        
        <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin-top: 20px;">
          <p style="margin: 0; color: #92400e; font-size: 12px;">
            <strong>Important:</strong> Please keep this email for your records. Your application reference number is: <strong>${escapeHtml(data.applicationId)}</strong>
          </p>
        </div>
      </div>
      
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="margin: 0; color: #64748b; font-size: 12px;">
          This email and any attachments are confidential. If you received this in error, please delete it.
        </p>
        <p style="margin: 10px 0 0; color: #94a3b8; font-size: 11px;">
          Choice Properties | Your Trusted Rental Housing Partner
        </p>
      </div>
    </div>
  `;
}
function getPaymentReceiptEmailTemplate(data) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Payment Confirmed</h1>
      </div>
      
      <div style="padding: 30px; background: white; border: 1px solid #e2e8f0; border-top: none;">
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Dear ${escapeHtml(data.applicantName)},</p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Your payment has been successfully processed. Here are your transaction details:
        </p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #e2e8f0;">Property:</td>
              <td style="padding: 10px 0; text-align: right; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.propertyTitle)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #e2e8f0;">Payment Type:</td>
              <td style="padding: 10px 0; text-align: right; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.paymentType)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #e2e8f0;">Transaction ID:</td>
              <td style="padding: 10px 0; text-align: right; font-family: monospace; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.transactionId)}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #e2e8f0;">Payment Date:</td>
              <td style="padding: 10px 0; text-align: right; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.paymentDate || (/* @__PURE__ */ new Date()).toLocaleDateString())}</td>
            </tr>
            ${data.paymentMethod ? `
            <tr>
              <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #e2e8f0;">Payment Method:</td>
              <td style="padding: 10px 0; text-align: right; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${escapeHtml(data.paymentMethod)}</td>
            </tr>
            ` : ""}
            <tr>
              <td style="padding: 15px 0 0; font-weight: bold; color: #1e293b; font-size: 16px;">Amount Paid:</td>
              <td style="padding: 15px 0 0; text-align: right; font-weight: bold; font-size: 20px; color: #16a34a;">$${data.amount.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
          <p style="color: #374151; font-size: 14px;">
            Best regards,<br>
            <strong>The Choice Properties Team</strong>
          </p>
        </div>
      </div>
      
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="margin: 0; color: #64748b; font-size: 12px;">
          Please save this receipt for your records. Questions? Contact support@choiceproperties.com
        </p>
      </div>
    </div>
  `;
}
var init_email = __esm({
  "server/email.ts"() {
    "use strict";
  }
});

// server/application-service.ts
var application_service_exports2 = {};
__export(application_service_exports2, {
  calculateApplicationScore: () => calculateApplicationScore,
  compareApplications: () => compareApplications,
  getApplicationWithDetails: () => getApplicationWithDetails,
  getValidNextStatuses: () => getValidNextStatuses,
  isValidStatusTransition: () => isValidStatusTransition,
  setApplicationExpiration: () => setApplicationExpiration,
  updateApplicationStatus: () => updateApplicationStatus2,
  withdrawOldDraftApplications: () => withdrawOldDraftApplications
});
function isValidStatusTransition(currentStatus, newStatus) {
  const validTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  return validTransitions.includes(newStatus);
}
function getValidNextStatuses(currentStatus) {
  return STATUS_TRANSITIONS[currentStatus] || [];
}
function calculateApplicationScore(application) {
  const flags = [];
  let incomeScore = 0;
  let creditScore = 0;
  let rentalHistoryScore = 0;
  let employmentScore = 0;
  let documentsScore = 0;
  const employment = application.employment || {};
  let monthlyIncome = parseFloat(employment.monthlyIncome || employment.income || 0);
  if (application.coApplicants && Array.isArray(application.coApplicants)) {
    const coApplicantIncome = application.coApplicants.reduce((sum, co) => {
      const coIncome = parseFloat(co.income || 0);
      return sum + coIncome;
    }, 0);
    monthlyIncome += coApplicantIncome;
  }
  if (monthlyIncome >= 5e3) {
    incomeScore = 25;
  } else if (monthlyIncome >= 4e3) {
    incomeScore = 22;
  } else if (monthlyIncome >= 3e3) {
    incomeScore = 18;
  } else if (monthlyIncome >= 2e3) {
    incomeScore = 12;
  } else if (monthlyIncome > 0) {
    incomeScore = 5;
    flags.push("low_income");
  } else {
    flags.push("no_income_provided");
  }
  const personalInfo = application.personalInfo || {};
  if (personalInfo.ssnProvided || personalInfo.ssn) {
    creditScore = 20;
  } else {
    creditScore = 10;
    flags.push("no_credit_check");
  }
  const rentalHistory = application.rentalHistory || {};
  let yearsRentingValue = 0;
  const rentalStr = rentalHistory.yearsRenting || rentalHistory.duration || "0";
  const rentYearMatch = rentalStr.toString().match(/(\d+)\s*(?:year|yr)?/i);
  const rentMonthMatch = rentalStr.toString().match(/(\d+)\s*(?:month|mo)?/);
  if (rentYearMatch) {
    yearsRentingValue = parseInt(rentYearMatch[1]) || 0;
  } else if (rentMonthMatch && !rentYearMatch) {
    yearsRentingValue = Math.floor(parseInt(rentMonthMatch[1]) / 12) || 0;
  }
  if (yearsRentingValue >= 3) {
    rentalHistoryScore = 20;
  } else if (yearsRentingValue >= 2) {
    rentalHistoryScore = 16;
  } else if (yearsRentingValue >= 1) {
    rentalHistoryScore = 12;
  } else if (yearsRentingValue > 0) {
    rentalHistoryScore = 8;
  } else {
    rentalHistoryScore = 5;
    flags.push("limited_rental_history");
  }
  if (rentalHistory.hasEviction || rentalHistory.evicted) {
    rentalHistoryScore = Math.max(0, rentalHistoryScore - 15);
    flags.push("previous_eviction");
  }
  let employmentLengthYears = 0;
  const employmentStr = employment.yearsEmployed || employment.duration || employment.employmentLength || "0";
  const yearMatch = employmentStr.toString().match(/(\d+)\s*(?:year|yr)?/i);
  const monthMatch = employmentStr.toString().match(/(\d+)\s*(?:month|mo)?/);
  if (yearMatch) {
    employmentLengthYears = parseInt(yearMatch[1]) || 0;
  } else if (monthMatch && !yearMatch) {
    employmentLengthYears = Math.floor(parseInt(monthMatch[1]) / 12) || 0;
  }
  const isEmployed = employment.employed !== false && employment.status !== "unemployed";
  if (isEmployed && employmentLengthYears >= 2) {
    employmentScore = 15;
  } else if (isEmployed && employmentLengthYears >= 1) {
    employmentScore = 12;
  } else if (isEmployed) {
    employmentScore = 8;
  } else {
    employmentScore = 3;
    flags.push("unemployed");
  }
  const documents = application.documents || {};
  const documentStatus = application.documentStatus || {};
  const requiredDocs = ["id", "proof_of_income", "employment_verification"];
  let uploadedDocs = 0;
  let verifiedDocs = 0;
  for (const doc of requiredDocs) {
    if (documents[doc] || documentStatus[doc]?.uploaded) {
      uploadedDocs++;
    }
    if (documentStatus[doc]?.verified) {
      verifiedDocs++;
    }
  }
  if (verifiedDocs >= 3) {
    documentsScore = 15;
  } else if (uploadedDocs >= 3) {
    documentsScore = 12;
  } else if (uploadedDocs >= 2) {
    documentsScore = 8;
  } else if (uploadedDocs >= 1) {
    documentsScore = 5;
  } else {
    documentsScore = 0;
    flags.push("missing_documents");
  }
  const totalScore = incomeScore + creditScore + rentalHistoryScore + employmentScore + documentsScore;
  const maxScore = 100;
  return {
    incomeScore,
    creditScore,
    rentalHistoryScore,
    employmentScore,
    documentsScore,
    totalScore,
    maxScore,
    flags
  };
}
async function updateApplicationStatus2(applicationId, newStatus, userId, options) {
  try {
    const { data: application, error: fetchError } = await supabase.from("applications").select("*, users(email, full_name), properties(title)").eq("id", applicationId).single();
    if (fetchError || !application) {
      return { success: false, error: "Application not found" };
    }
    const currentStatus = application.status;
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      return {
        success: false,
        error: `Invalid status transition from ${currentStatus} to ${newStatus}. Valid transitions: ${getValidNextStatuses(currentStatus).join(", ")}`
      };
    }
    const historyEntry = {
      status: newStatus,
      changedAt: (/* @__PURE__ */ new Date()).toISOString(),
      changedBy: userId,
      reason: options?.reason
    };
    const statusHistory = [...application.status_history || [], historyEntry];
    const updateData = {
      status: newStatus,
      previous_status: currentStatus,
      status_history: statusHistory,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (newStatus === "rejected") {
      updateData.rejection_category = options?.rejectionCategory;
      updateData.rejection_reason = options?.rejectionReason;
      updateData.rejection_details = options?.rejectionDetails;
      updateData.reviewed_by = userId;
      updateData.reviewed_at = (/* @__PURE__ */ new Date()).toISOString();
    }
    if (newStatus === "approved") {
      updateData.reviewed_by = userId;
      updateData.reviewed_at = (/* @__PURE__ */ new Date()).toISOString();
    }
    if (newStatus === "info_requested") {
      updateData.info_requested_at = (/* @__PURE__ */ new Date()).toISOString();
      updateData.info_requested_by = userId;
      updateData.info_requested_reason = options?.reason;
    }
    if (newStatus === "conditional_approval") {
      updateData.conditional_approval_at = (/* @__PURE__ */ new Date()).toISOString();
      updateData.conditional_approval_by = userId;
      updateData.conditional_approval_reason = options?.reason;
      if (options?.conditionalRequirements) {
        updateData.conditional_requirements = options.conditionalRequirements;
      }
      if (options?.conditionalDocuments) {
        updateData.conditional_documents_required = options.conditionalDocuments;
      }
      if (options?.dueDate) {
        updateData.conditional_approval_due_date = options.dueDate;
      }
    }
    const { data: updated, error: updateError } = await supabase.from("applications").update(updateData).eq("id", applicationId).select().single();
    if (updateError) {
      return { success: false, error: updateError.message };
    }
    await createApplicationNotification(
      applicationId,
      application.user_id,
      "status_change",
      `Application Status: ${newStatus.replace(/_/g, " ").toUpperCase()}`,
      getStatusChangeEmailContent(newStatus, application, options)
    );
    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
async function createApplicationNotification(applicationId, userId, notificationType, subject, content) {
  try {
    const { data: user } = await supabase.from("users").select("email, full_name").eq("id", userId).single();
    await supabase.from("application_notifications").insert([
      {
        application_id: applicationId,
        user_id: userId,
        notification_type: notificationType,
        channel: "email",
        subject,
        content,
        status: "pending"
      }
    ]);
    if (user?.email) {
      sendEmail({
        to: user.email,
        subject,
        html: content
      }).then(async () => {
        await supabase.from("application_notifications").update({ status: "sent", sent_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("application_id", applicationId).eq("notification_type", notificationType).eq("status", "pending");
      }).catch((err) => {
        console.error("Failed to send notification email:", err);
      });
    }
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}
function getStatusChangeEmailContent(status, application, options) {
  const applicantName = application.users?.full_name || "Applicant";
  const propertyTitle = application.properties?.title || "the property";
  const statusMessages = {
    draft: "",
    pending_payment: `
      <h2>Payment Required</h2>
      <p>Dear ${applicantName},</p>
      <p>Your application for <strong>${propertyTitle}</strong> is ready. Please complete the application fee payment to proceed.</p>
      <p>Once payment is verified, your application will be submitted for review.</p>
    `,
    payment_verified: `
      <h2>Payment Verified</h2>
      <p>Dear ${applicantName},</p>
      <p>Your application fee for <strong>${propertyTitle}</strong> has been verified. Your application is now ready to be submitted for review.</p>
    `,
    submitted: `
      <h2>Application Submitted</h2>
      <p>Dear ${applicantName},</p>
      <p>Your application for <strong>${propertyTitle}</strong> has been successfully submitted and is now pending review.</p>
      <p>We will notify you once the property owner reviews your application.</p>
    `,
    under_review: `
      <h2>Application Under Review</h2>
      <p>Dear ${applicantName},</p>
      <p>Great news! Your application for <strong>${propertyTitle}</strong> is now being reviewed by the property owner.</p>
      <p>We will keep you updated on any changes to your application status.</p>
    `,
    info_requested: `
      <h2>Additional Information Requested</h2>
      <p>Dear ${applicantName},</p>
      <p>The property owner has requested additional information for your application to <strong>${propertyTitle}</strong>.</p>
      <p>Please log in to your account and provide the requested information as soon as possible.</p>
    `,
    conditional_approval: `
      <h2>Conditional Approval</h2>
      <p>Dear ${applicantName},</p>
      <p>Good news! Your application for <strong>${propertyTitle}</strong> has been conditionally approved.</p>
      <p>To complete the approval process, please review the requirements listed in your dashboard and provide the requested documents or information.</p>
      <p>Once all conditions are satisfied, your application will be fully approved.</p>
    `,
    approved: `
      <h2>Congratulations! Application Approved</h2>
      <p>Dear ${applicantName},</p>
      <p>We are pleased to inform you that your application for <strong>${propertyTitle}</strong> has been approved!</p>
      <p>The property owner will be in touch with you shortly regarding the next steps for your lease agreement.</p>
    `,
    rejected: `
      <h2>Application Status Update</h2>
      <p>Dear ${applicantName},</p>
      <p>We regret to inform you that your application for <strong>${propertyTitle}</strong> was not approved at this time.</p>
      ${options?.rejectionReason ? `<p><strong>Reason:</strong> ${options.rejectionReason}</p>` : ""}
      ${options?.rejectionDetails?.appealable ? "<p>If you believe this decision was made in error, you may appeal by contacting the property owner.</p>" : ""}
      <p>We encourage you to continue your search for the perfect home.</p>
    `,
    withdrawn: `
      <h2>Application Withdrawn</h2>
      <p>Dear ${applicantName},</p>
      <p>Your application for <strong>${propertyTitle}</strong> has been withdrawn as requested.</p>
      <p>If you wish to apply again in the future, please submit a new application.</p>
    `
  };
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        h2 { color: #2563eb; }
        p { margin: 10px 0; }
      </style>
    </head>
    <body>
      ${statusMessages[status]}
      <hr>
      <p style="color: #666; font-size: 12px;">
        This is an automated message from Choice Properties. Please do not reply to this email.
      </p>
    </body>
    </html>
  `;
}
async function withdrawOldDraftApplications(daysOld = 30) {
  try {
    const expirationDate = /* @__PURE__ */ new Date();
    expirationDate.setDate(expirationDate.getDate() - daysOld);
    const { data: oldDrafts, error: error2 } = await supabase.from("applications").select("id, user_id").eq("status", "draft").lt("created_at", expirationDate.toISOString());
    if (error2 || !oldDrafts) {
      console.error("Error fetching old draft applications:", error2);
      return 0;
    }
    let withdrawnCount = 0;
    for (const app2 of oldDrafts) {
      const result = await updateApplicationStatus2(app2.id, "withdrawn", "system", {
        reason: "Application withdrawn due to inactivity"
      });
      if (result.success) {
        withdrawnCount++;
      }
    }
    return withdrawnCount;
  } catch (err) {
    console.error("Error withdrawing old applications:", err);
    return 0;
  }
}
async function getApplicationWithDetails(applicationId) {
  try {
    const { data: application, error: error2 } = await supabase.from("applications").select(`
        *,
        properties(*),
        users(id, full_name, email, phone, profile_image)
      `).eq("id", applicationId).single();
    if (error2) throw error2;
    const { data: coApplicants2 } = await supabase.from("co_applicants").select("*").eq("application_id", applicationId);
    const { data: comments } = await supabase.from("application_comments").select("*, users(id, full_name)").eq("application_id", applicationId).order("created_at", { ascending: true });
    const { data: notifications } = await supabase.from("application_notifications").select("*").eq("application_id", applicationId).order("created_at", { ascending: false });
    return {
      ...application,
      coApplicants: coApplicants2 || [],
      comments: comments || [],
      notifications: notifications || []
    };
  } catch (err) {
    console.error("Error fetching application details:", err);
    return null;
  }
}
async function compareApplications(propertyId) {
  try {
    const { data: applications2, error: error2 } = await supabase.from("applications").select(`
        *,
        users(id, full_name, email, phone)
      `).eq("property_id", propertyId).not("status", "in", '("draft","withdrawn","expired")').order("score", { ascending: false, nullsFirst: false });
    if (error2) throw error2;
    return (applications2 || []).map((app2) => ({
      id: app2.id,
      applicant: app2.users,
      status: app2.status,
      score: app2.score,
      scoreBreakdown: app2.score_breakdown,
      submittedAt: app2.created_at,
      employment: app2.employment,
      personalInfo: app2.personal_info
    }));
  } catch (err) {
    console.error("Error comparing applications:", err);
    return [];
  }
}
async function setApplicationExpiration(applicationId, daysUntilExpiration = 30) {
  try {
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setDate(expiresAt.getDate() + daysUntilExpiration);
    const { error: error2 } = await supabase.from("applications").update({ expires_at: expiresAt.toISOString() }).eq("id", applicationId);
    return !error2;
  } catch (err) {
    return false;
  }
}
var STATUS_TRANSITIONS;
var init_application_service = __esm({
  "server/application-service.ts"() {
    "use strict";
    init_supabase();
    init_email();
    STATUS_TRANSITIONS = {
      draft: ["submitted", "pending_payment", "withdrawn"],
      pending_payment: ["payment_verified", "withdrawn"],
      payment_verified: ["submitted", "withdrawn"],
      submitted: ["under_review", "withdrawn"],
      under_review: ["info_requested", "conditional_approval", "approved", "rejected", "withdrawn"],
      info_requested: ["under_review", "conditional_approval", "approved", "rejected", "withdrawn"],
      conditional_approval: ["approved", "rejected", "withdrawn"],
      approved: [],
      rejected: [],
      withdrawn: []
    };
  }
});

// server/index-prod.ts
import fs from "node:fs";
import path2 from "node:path";
import express2 from "express";

// server/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";

// server/routes.ts
init_supabase();
import { createServer } from "http";

// server/imagekit.ts
import ImageKit from "imagekit";
var imagekit = null;
if (process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT) {
  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
  });
} else {
  console.warn("[IMAGEKIT] Warning: ImageKit is not fully configured. Image operations will fail.");
  console.warn("[IMAGEKIT] Required environment variables: IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT");
}
var imagekit_default = imagekit;

// server/auth-middleware.ts
init_supabase();

// server/cache.ts
var LRUCache = class {
  cache = /* @__PURE__ */ new Map();
  maxSize = 100;
  cleanupIntervalId = null;
  cleanupIntervalMs = 60 * 1e3;
  // Run cleanup every minute
  constructor() {
    this.startPeriodicCleanup();
  }
  startPeriodicCleanup() {
    if (this.cleanupIntervalId) return;
    this.cleanupIntervalId = setInterval(() => {
      this.cleanup();
    }, this.cleanupIntervalMs);
    if (this.cleanupIntervalId.unref) {
      this.cleanupIntervalId.unref();
    }
  }
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`[CACHE] Cleaned up ${cleaned} expired entries, ${this.cache.size} remaining`);
    }
  }
  set(key, data, ttlMs) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs
    });
  }
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }
  invalidate(pattern) {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
  has(key) {
    return this.get(key) !== null;
  }
  size() {
    return this.cache.size;
  }
  stopCleanup() {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }
};
var cache = new LRUCache();
var CACHE_TTL = {
  PROPERTIES_LIST: 60 * 1e3,
  PROPERTY_DETAIL: 2 * 60 * 1e3,
  STATIC_CONTENT: 10 * 60 * 1e3,
  USER_ROLE: 15 * 60 * 1e3,
  OWNERSHIP_CHECK: 30 * 1e3
};

// server/security/audit-logger.ts
init_supabase();
function getClientIp(req) {
  if (!req) return null;
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || null;
}
function getUserAgent(req) {
  if (!req) return null;
  return req.headers["user-agent"] || null;
}
async function logAuditEvent(params) {
  try {
    const { error: error2 } = await supabase.from("audit_logs").insert({
      user_id: params.userId || null,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId || null,
      previous_data: params.previousData || null,
      new_data: params.newData || null,
      ip_address: getClientIp(params.req) || null,
      user_agent: getUserAgent(params.req) || null,
      metadata: params.metadata || null
    });
    if (error2) {
      console.error("[AUDIT] Failed to log event:", error2);
    }
  } catch (error2) {
    console.error("[AUDIT] Exception logging event:", error2);
  }
}
async function logApplicationChange(userId, applicationId, action, previousData, newData, req) {
  await logAuditEvent({
    userId,
    action,
    resourceType: "application",
    resourceId: applicationId,
    previousData,
    newData,
    req
  });
}
async function logSecurityEvent(userId, action, success2, metadata, req) {
  await logAuditEvent({
    userId,
    action,
    resourceType: "security",
    metadata: { ...metadata, success: success2 },
    req
  });
}
async function logLeaseAction(userId, applicationId, action, previousStatus, newStatus, notes, req) {
  await logAuditEvent({
    userId,
    action,
    resourceType: "lease",
    resourceId: applicationId,
    metadata: {
      previousStatus,
      newStatus,
      notes,
      actionType: action
    },
    req
  });
}
async function logPaymentAction(userId, paymentId, action, previousStatus, newStatus, metadata, req) {
  await logAuditEvent({
    userId,
    action,
    resourceType: "payment",
    resourceId: paymentId,
    previousData: previousStatus ? { status: previousStatus } : void 0,
    newData: newStatus ? { status: newStatus } : void 0,
    metadata: {
      ...metadata,
      actionType: action,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    },
    req
  });
}
async function getPaymentAuditLogs(paymentId, page = 1, limit = 50) {
  try {
    let query = supabase.from("audit_logs").select("*", { count: "exact" }).eq("resource_type", "payment");
    if (paymentId) {
      query = query.eq("resource_id", paymentId);
    }
    const offset = (page - 1) * limit;
    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    const { data, error: error2, count } = await query;
    if (error2) throw error2;
    return {
      logs: data || [],
      total: count || 0
    };
  } catch (error2) {
    console.error("[AUDIT] Failed to fetch payment logs:", error2);
    return { logs: [], total: 0 };
  }
}
async function getAuditLogs(filters, page = 1, limit = 50) {
  try {
    let query = supabase.from("audit_logs").select("*", { count: "exact" });
    if (filters.userId) {
      query = query.eq("user_id", filters.userId);
    }
    if (filters.action) {
      query = query.eq("action", filters.action);
    }
    if (filters.resourceType) {
      query = query.eq("resource_type", filters.resourceType);
    }
    if (filters.resourceId) {
      query = query.eq("resource_id", filters.resourceId);
    }
    if (filters.startDate) {
      query = query.gte("created_at", filters.startDate.toISOString());
    }
    if (filters.endDate) {
      query = query.lte("created_at", filters.endDate.toISOString());
    }
    const offset = (page - 1) * limit;
    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    const { data, error: error2, count } = await query;
    if (error2) throw error2;
    return {
      logs: data || [],
      total: count || 0
    };
  } catch (error2) {
    console.error("[AUDIT] Failed to fetch logs:", error2);
    return { logs: [], total: 0 };
  }
}

// server/auth-middleware.ts
async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: "Authentication service is not configured. Please contact support." });
  }
  try {
    const supabaseClient = getSupabaseOrThrow();
    const {
      data: { user },
      error: error2
    } = await supabaseClient.auth.getUser(token);
    if (error2 || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    const cacheKey = `user_role:${user.id}`;
    let cachedRole = cache.get(cacheKey) || "renter";
    if (cachedRole === "renter" && !cache.has(cacheKey)) {
      const { data: userData } = await supabaseClient.from("users").select("role").eq("id", user.id).single();
      cachedRole = userData?.role || "renter";
      cache.set(cacheKey, cachedRole, CACHE_TTL.USER_ROLE);
    }
    req.user = {
      id: user.id,
      email: user.email || "",
      role: cachedRole
    };
    next();
  } catch (error2) {
    return res.status(500).json({ error: "Authentication failed" });
  }
}
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token || !isSupabaseConfigured()) {
    return next();
  }
  const supabaseClient = getSupabaseOrThrow();
  supabaseClient.auth.getUser(token).then(async ({ data: { user }, error: error2 }) => {
    if (!error2 && user) {
      const cacheKey = `user_role:${user.id}`;
      let cachedRole = cache.get(cacheKey) || "renter";
      if (cachedRole === "renter" && !cache.has(cacheKey)) {
        const { data: userData } = await supabaseClient.from("users").select("role").eq("id", user.id).single();
        cachedRole = userData?.role || "renter";
        cache.set(cacheKey, cachedRole, CACHE_TTL.USER_ROLE);
      }
      req.user = {
        id: user.id,
        email: user.email || "",
        role: cachedRole
      };
    }
    next();
  }).catch(() => next());
}
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
function invalidateOwnershipCache(resourceType, resourceId) {
  cache.invalidate(`ownership:${resourceType}:${resourceId}`);
}
async function getResourceOwner(resourceType, resourceId) {
  const cacheKey = `ownership:${resourceType}:${resourceId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  if (!isSupabaseConfigured()) {
    throw new Error("Database service is not configured");
  }
  const supabaseClient = getSupabaseOrThrow();
  let ownerId = null;
  let found = false;
  if (resourceType === "property") {
    const { data } = await supabaseClient.from("properties").select("owner_id").eq("id", resourceId).single();
    ownerId = data?.owner_id || null;
    found = !!data;
  } else if (resourceType === "application") {
    const { data } = await supabaseClient.from("applications").select("user_id").eq("id", resourceId).single();
    ownerId = data?.user_id || null;
    found = !!data;
  } else if (resourceType === "review") {
    const { data } = await supabaseClient.from("reviews").select("user_id").eq("id", resourceId).single();
    ownerId = data?.user_id || null;
    found = !!data;
  } else if (resourceType === "inquiry") {
    const { data } = await supabaseClient.from("inquiries").select("agent_id").eq("id", resourceId).single();
    ownerId = data?.agent_id || null;
    found = !!data;
  } else if (resourceType === "saved_search") {
    const { data } = await supabaseClient.from("saved_searches").select("user_id").eq("id", resourceId).single();
    ownerId = data?.user_id || null;
    found = !!data;
  } else if (resourceType === "favorite") {
    const { data } = await supabaseClient.from("favorites").select("user_id").eq("id", resourceId).single();
    ownerId = data?.user_id || null;
    found = !!data;
  } else if (resourceType === "user") {
    ownerId = resourceId;
    found = true;
  }
  const result = { ownerId, found };
  if (found) {
    cache.set(cacheKey, result, CACHE_TTL.OWNERSHIP_CHECK);
  }
  return result;
}
function requireOwnership(resourceType) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (req.user.role === "admin") {
      return next();
    }
    const resourceId = req.params.id;
    const resourceNames = {
      property: "Property",
      application: "Application",
      review: "Review",
      inquiry: "Inquiry",
      saved_search: "Saved search",
      user: "User",
      favorite: "Favorite"
    };
    try {
      const { ownerId, found } = await getResourceOwner(resourceType, resourceId);
      if (!found) {
        return res.status(404).json({ error: `${resourceNames[resourceType]} not found` });
      }
      if (ownerId !== req.user.id) {
        return res.status(403).json({ error: "You do not own this resource" });
      }
      next();
    } catch (error2) {
      return res.status(500).json({ error: "Failed to verify ownership" });
    }
  };
}

// server/response.ts
function success(data, message) {
  return {
    success: true,
    data,
    ...message && { message }
  };
}
function error(message, statusCode) {
  return {
    success: false,
    error: message
  };
}

// server/routes.ts
init_email();

// server/notification-service.ts
init_supabase();
init_email();
async function createNotificationRecord(record) {
  try {
    const { data, error: error2 } = await supabase.from("application_notifications").insert([{
      application_id: record.applicationId,
      user_id: record.userId,
      notification_type: record.type,
      channel: "email",
      subject: record.subject,
      content: record.content,
      status: "pending"
    }]).select("id").single();
    if (error2) throw error2;
    return data?.id || null;
  } catch (err) {
    console.error("[NOTIFICATION] Failed to create record:", err);
    return null;
  }
}
async function updateNotificationStatus(notificationId, status, error2) {
  try {
    const updateData = { status };
    if (status === "sent") {
      updateData.sent_at = (/* @__PURE__ */ new Date()).toISOString();
    }
    await supabase.from("application_notifications").update(updateData).eq("id", notificationId);
  } catch (err) {
    console.error("[NOTIFICATION] Failed to update status:", err);
  }
}
async function notifyOwnerOfNewApplication(applicationId) {
  try {
    const { data: application, error: error2 } = await supabase.from("applications").select(`
        id,
        users(id, full_name),
        properties(id, title, owner_id)
      `).eq("id", applicationId).single();
    if (error2 || !application) return false;
    const applicant = application.users;
    const property = application.properties;
    if (!property?.owner_id) return false;
    const { data: owner } = await supabase.from("users").select("id, email, full_name").eq("id", property.owner_id).single();
    if (!owner?.email) return false;
    const subject = `New Application for ${property.title}`;
    const content = getNewApplicationNotificationTemplate({
      ownerName: owner.full_name || "Property Owner",
      propertyTitle: property.title,
      applicantName: applicant?.full_name || "Applicant",
      applicationId
    });
    const notificationId = await createNotificationRecord({
      applicationId,
      userId: owner.id,
      type: "new_application",
      subject,
      content
    });
    const result = await sendEmail({ to: owner.email, subject, html: content });
    if (notificationId) {
      await updateNotificationStatus(notificationId, result.success ? "sent" : "failed");
    }
    return result.success;
  } catch (err) {
    console.error("[NOTIFICATION] Failed to notify owner:", err);
    return false;
  }
}
async function sendPaymentReceivedNotification(paymentId, tenantName, paymentType, amount) {
  try {
    const { data: payment } = await supabase.from("payments").select("id, lease_id, leases(landlord_id)").eq("id", paymentId).single();
    if (!payment || !payment.leases?.landlord_id) return false;
    const { data: landlord } = await supabase.from("users").select("id, email, full_name").eq("id", payment.leases.landlord_id).single();
    if (!landlord?.email) return false;
    const { data: existingNotif } = await supabase.from("application_notifications").select("id").eq("user_id", landlord.id).eq("notification_type", "payment_received").gte("created_at", new Date(Date.now() - 60 * 60 * 1e3).toISOString()).single();
    if (existingNotif) return false;
    const propertyTitle = "Property";
    const subject = `Payment Received from ${tenantName}`;
    const content = `
      <p>Hi ${landlord.full_name},</p>
      <p>${tenantName} has marked a ${paymentType} payment of $${amount} as paid for <strong>${propertyTitle}</strong>.</p>
      <p>Please verify the payment in the landlord portal.</p>
      <p>Best regards,<br>Choice Properties</p>
    `;
    const notificationId = await createNotificationRecord({
      applicationId: "",
      // Payment notifications not tied to applications
      userId: landlord.id,
      type: "payment_received",
      subject,
      content
    });
    if (notificationId) {
      await supabase.from("application_notifications").update({ channel: "in_app" }).eq("id", notificationId);
    }
    return true;
  } catch (err) {
    console.error("[NOTIFICATION] Failed to send payment received:", err);
    return false;
  }
}
async function sendPaymentVerifiedNotification(paymentId, tenantId, paymentType, amount) {
  try {
    const { data: tenant } = await supabase.from("users").select("id, email, full_name").eq("id", tenantId).single();
    if (!tenant?.email) return false;
    const { data: existingNotif } = await supabase.from("application_notifications").select("id").eq("user_id", tenant.id).eq("notification_type", "payment_verified").gte("created_at", new Date(Date.now() - 60 * 60 * 1e3).toISOString()).single();
    if (existingNotif) return false;
    const subject = `Payment Verified: ${paymentType}`;
    const content = `
      <p>Hi ${tenant.full_name},</p>
      <p>Your ${paymentType} payment of $${amount} has been verified and received.</p>
      <p>Thank you for your timely payment.</p>
      <p>Best regards,<br>Choice Properties</p>
    `;
    const notificationId = await createNotificationRecord({
      applicationId: "",
      userId: tenant.id,
      type: "payment_verified",
      subject,
      content
    });
    const result = await sendEmail({ to: tenant.email, subject, html: content });
    if (notificationId) {
      await updateNotificationStatus(notificationId, result.success ? "sent" : "failed");
    }
    return result.success;
  } catch (err) {
    console.error("[NOTIFICATION] Failed to send payment verified:", err);
    return false;
  }
}
async function sendDepositRequiredNotification(tenantId, depositAmount, propertyTitle) {
  try {
    const { data: tenant } = await supabase.from("users").select("id, email, full_name").eq("id", tenantId).single();
    if (!tenant?.email) return false;
    const { data: existingNotif } = await supabase.from("application_notifications").select("id").eq("user_id", tenant.id).eq("notification_type", "deposit_required").gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1e3).toISOString()).single();
    if (existingNotif) return false;
    const subject = `Security Deposit Required for ${propertyTitle}`;
    const content = `
      <p>Hi ${tenant.full_name},</p>
      <p>Your lease for <strong>${propertyTitle}</strong> has been accepted!</p>
      <p>A security deposit of <strong>$${depositAmount}</strong> is now required.</p>
      <p>Please submit your deposit payment to proceed with move-in.</p>
      <p>Best regards,<br>Choice Properties</p>
    `;
    const notificationId = await createNotificationRecord({
      applicationId: "",
      userId: tenant.id,
      type: "deposit_required",
      subject,
      content
    });
    const result = await sendEmail({ to: tenant.email, subject, html: content });
    if (notificationId) {
      await updateNotificationStatus(notificationId, result.success ? "sent" : "failed");
    }
    return result.success;
  } catch (err) {
    console.error("[NOTIFICATION] Failed to send deposit required:", err);
    return false;
  }
}

// server/image-transform.ts
function generateSignedImageURL(imageKitFileId, urlEndpoint, privateKey, expiresIn = 3600) {
  const crypto4 = __require("crypto");
  const baseURL = `${urlEndpoint}/${imageKitFileId}`;
  const transformations = "q-90,f-auto";
  const timestamp2 = Math.floor(Date.now() / 1e3);
  const expiration = timestamp2 + expiresIn;
  const pathWithTr = `/${imageKitFileId}?tr=${transformations}`;
  const signatureString = `${pathWithTr}${expiration}`;
  const signature = crypto4.createHmac("sha256", privateKey).update(signatureString).digest("hex");
  return `${baseURL}?tr=${transformations}&ik-t=${expiration}&ik-s=${signature}`;
}
function canAccessPrivateImage(params) {
  if (params.userRole === "admin") return true;
  if (params.userId === params.uploaderId) return true;
  if (params.propertyId) {
    if (params.userId === params.propertyOwnerId) return true;
    if (params.userId === params.listingAgentId) return true;
  }
  if (params.userRole === "property_manager") return true;
  return false;
}

// server/image-audit.ts
async function logImageAudit(supabase3, log2) {
  try {
    const { error: error2 } = await supabase3.from("image_audit_logs").insert([{
      actor_id: log2.actorId,
      actor_role: log2.actorRole,
      action: log2.action,
      photo_id: log2.photoId || null,
      property_id: log2.propertyId || null,
      metadata: log2.metadata || null,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }]);
    if (error2) {
      console.error("[IMAGE_AUDIT] Failed to log image audit:", error2);
    } else {
      console.log(`[IMAGE_AUDIT] ${log2.action} logged for actor ${log2.actorId}`);
    }
  } catch (err) {
    console.error("[IMAGE_AUDIT] Error logging audit event:", err);
  }
}

// server/image-management.ts
async function deleteImageKitFile(fileId) {
  if (!imagekit_default) {
    console.warn(`[IMAGEKIT] ImageKit not configured, skipping file deletion: ${fileId}`);
    return;
  }
  try {
    await imagekit_default.deleteFile(fileId);
    console.log(`[IMAGEKIT] Deleted file: ${fileId}`);
  } catch (err) {
    console.warn(`[IMAGEKIT] Failed to delete file ${fileId}:`, err.message);
  }
}
async function archivePhoto(supabase3, photoId, imageKitFileId, auditLog) {
  await deleteImageKitFile(imageKitFileId);
  await supabase3.from("photos").update({
    archived: true,
    archived_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", photoId);
  if (auditLog) {
    await logImageAudit(supabase3, auditLog);
  }
}
async function replacePhoto(supabase3, oldPhotoId, newPhotoData, auditLog) {
  const { data: oldPhoto } = await supabase3.from("photos").select("order_index, property_id, category, uploader_id").eq("id", oldPhotoId).single();
  if (!oldPhoto) {
    throw new Error("Original photo not found");
  }
  const { data: newPhoto } = await supabase3.from("photos").insert([{
    imagekit_file_id: newPhotoData.imageKitFileId,
    url: newPhotoData.url,
    thumbnail_url: newPhotoData.thumbnailUrl,
    category: oldPhoto.category,
    uploader_id: oldPhoto.uploader_id,
    property_id: oldPhoto.property_id,
    order_index: oldPhoto.order_index,
    replaced_with_id: null
    // Will be set after insert
  }]).select().single();
  await supabase3.from("photos").update({
    archived: true,
    archived_at: (/* @__PURE__ */ new Date()).toISOString(),
    replaced_with_id: newPhoto.id
  }).eq("id", oldPhotoId);
  if (auditLog) {
    await logImageAudit(supabase3, auditLog);
  }
  return newPhoto;
}

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, uuid, timestamp, integer, decimal, boolean, jsonb, date, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var agencies = pgTable("agencies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  logo: text("logo"),
  website: text("website"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  licenseNumber: text("license_number"),
  licenseExpiry: date("license_expiry"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }),
  status: text("status").default("active"),
  ownerId: uuid("owner_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at")
});
var users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  // NOTE: passwordHash is unused - Supabase Auth handles password storage
  passwordHash: text("password_hash"),
  fullName: text("full_name"),
  phone: text("phone"),
  role: text("role").default("renter"),
  profileImage: text("profile_image"),
  bio: text("bio"),
  agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "set null" }),
  licenseNumber: text("license_number"),
  licenseState: text("license_state"),
  licenseExpiry: date("license_expiry"),
  licenseVerified: boolean("license_verified").default(false),
  specialties: jsonb("specialties").$type(),
  yearsExperience: integer("years_experience"),
  totalSales: integer("total_sales").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviewCount: integer("review_count").default(0),
  location: text("location"),
  isManagedProfile: boolean("is_managed_profile").default(false),
  managedBy: uuid("managed_by"),
  displayEmail: text("display_email"),
  displayPhone: text("display_phone"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"),
  twoFactorBackupCodes: jsonb("two_factor_backup_codes").$type(),
  lastLoginAt: timestamp("last_login_at"),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at")
});
var properties = pgTable("properties", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "cascade" }),
  listingAgentId: uuid("listing_agent_id").references(() => users.id, { onDelete: "set null" }),
  agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  price: decimal("price", { precision: 12, scale: 2 }),
  bedrooms: integer("bedrooms"),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }),
  squareFeet: integer("square_feet"),
  propertyType: text("property_type"),
  amenities: jsonb("amenities"),
  images: jsonb("images"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  furnished: boolean("furnished").default(false),
  petsAllowed: boolean("pets_allowed").default(false),
  leaseTerm: text("lease_term"),
  utilitiesIncluded: jsonb("utilities_included"),
  status: text("status").default("active"),
  // New property management fields
  listingStatus: text("listing_status").default("draft"),
  visibility: text("visibility").default("public"),
  expiresAt: timestamp("expires_at"),
  autoUnpublish: boolean("auto_unpublish").default(true),
  expirationDays: integer("expiration_days").default(90),
  priceHistory: jsonb("price_history").$type(),
  viewCount: integer("view_count").default(0),
  saveCount: integer("save_count").default(0),
  applicationCount: integer("application_count").default(0),
  listedAt: timestamp("listed_at"),
  soldAt: timestamp("sold_at"),
  soldPrice: decimal("sold_price", { precision: 12, scale: 2 }),
  scheduledPublishAt: timestamp("scheduled_publish_at"),
  addressVerified: boolean("address_verified").default(false),
  applicationFee: decimal("application_fee", { precision: 8, scale: 2 }).default("45.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at")
});
var propertyQuestions = pgTable("property_questions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  questionType: text("question_type").default("text"),
  // text, textarea, select, checkbox, radio
  options: jsonb("options").$type(),
  // For select/radio/checkbox types
  required: boolean("required").default(false),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var propertyNotes = pgTable("property_notes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  noteType: text("note_type").default("general"),
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var LEASE_STATUSES = [
  "lease_preparation",
  "lease_sent",
  "lease_accepted",
  "lease_declined",
  "move_in_ready",
  "completed"
];
var LEASE_STATUS_TRANSITIONS = {
  "lease_preparation": ["lease_sent", "lease_declined"],
  "lease_sent": ["lease_accepted", "lease_declined", "lease_sent"],
  "lease_accepted": ["move_in_ready"],
  "lease_declined": ["lease_preparation"],
  "move_in_ready": ["completed"],
  "completed": []
};
var PAYMENT_VERIFICATION_METHODS = [
  "cash",
  "check",
  "bank_transfer",
  "wire_transfer",
  "money_order",
  "other"
];
var applications = pgTable("applications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  step: integer("step").default(0),
  personalInfo: jsonb("personal_info"),
  rentalHistory: jsonb("rental_history"),
  employment: jsonb("employment"),
  references: jsonb("references"),
  disclosures: jsonb("disclosures"),
  documents: jsonb("documents"),
  status: text("status").default("draft"),
  previousStatus: text("previous_status"),
  statusHistory: jsonb("status_history").$type(),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  // Scoring
  score: integer("score"),
  scoreBreakdown: jsonb("score_breakdown").$type(),
  scoredAt: timestamp("scored_at"),
  // Rejection
  rejectionCategory: text("rejection_category"),
  rejectionReason: text("rejection_reason"),
  rejectionDetails: jsonb("rejection_details").$type(),
  // Documents
  requiredDocuments: jsonb("required_documents").$type(),
  documentStatus: jsonb("document_status").$type(),
  // Expiration
  expiresAt: timestamp("expires_at"),
  expiredAt: timestamp("expired_at"),
  // Application fee
  applicationFee: decimal("application_fee", { precision: 8, scale: 2 }),
  // Payment tracking
  paymentStatus: text("payment_status").default("pending"),
  // pending, paid, failed, manually_verified
  paymentAttempts: jsonb("payment_attempts").$type(),
  paymentPaidAt: timestamp("payment_paid_at"),
  // Manual payment verification
  manualPaymentVerified: boolean("manual_payment_verified").default(false),
  manualPaymentVerifiedAt: timestamp("manual_payment_verified_at"),
  manualPaymentVerifiedBy: uuid("manual_payment_verified_by").references(() => users.id),
  manualPaymentAmount: decimal("manual_payment_amount", { precision: 8, scale: 2 }),
  manualPaymentMethod: text("manual_payment_method"),
  // cash, check, bank_transfer, wire_transfer, money_order, other
  manualPaymentReceivedAt: timestamp("manual_payment_received_at"),
  manualPaymentNote: text("manual_payment_note"),
  manualPaymentReferenceId: text("manual_payment_reference_id"),
  // Info request tracking
  infoRequestedReason: text("info_requested_reason"),
  infoRequestedAt: timestamp("info_requested_at"),
  infoRequestedBy: uuid("info_requested_by").references(() => users.id),
  infoRequestedDueDate: timestamp("info_requested_due_date"),
  // Conditional approval tracking
  conditionalApprovalReason: text("conditional_approval_reason"),
  conditionalApprovalAt: timestamp("conditional_approval_at"),
  conditionalApprovalBy: uuid("conditional_approval_by").references(() => users.id),
  conditionalApprovalDueDate: timestamp("conditional_approval_due_date"),
  conditionalRequirements: jsonb("conditional_requirements").$type(),
  conditionalDocumentsRequired: jsonb("conditional_documents_required").$type(),
  conditionalDocumentsUploaded: jsonb("conditional_documents_uploaded").$type(),
  // Lease preparation tracking
  leaseStatus: text("lease_status").default("lease_preparation"),
  leaseVersion: integer("lease_version").default(1),
  leaseDocumentUrl: text("lease_document_url"),
  leaseDocumentId: uuid("lease_document_id"),
  leaseTemplateId: uuid("lease_template_id"),
  leaseGeneratedAt: timestamp("lease_generated_at"),
  leaseSentAt: timestamp("lease_sent_at"),
  leaseSentBy: uuid("lease_sent_by").references(() => users.id),
  leaseAcceptedAt: timestamp("lease_accepted_at"),
  leaseDeclineReason: text("lease_decline_reason"),
  leaseSignedAt: timestamp("lease_signed_at"),
  moveInDate: timestamp("move_in_date"),
  moveInScheduledAt: timestamp("move_in_scheduled_at"),
  moveInInstructions: jsonb("move_in_instructions").$type(),
  // Custom answers to property-specific questions
  customAnswers: jsonb("custom_answers").$type(),
  // Conversation link for messaging
  conversationId: uuid("conversation_id"),
  // Last step saved for auto-save tracking
  lastSavedStep: integer("last_saved_step").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at")
}, (table) => ({
  userPropertyUnique: unique().on(table.userId, table.propertyId)
}));
var coApplicants = pgTable("co_applicants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  relationship: text("relationship"),
  // spouse, roommate, family, etc.
  personalInfo: jsonb("personal_info"),
  employment: jsonb("employment"),
  income: decimal("income", { precision: 12, scale: 2 }),
  status: text("status").default("pending"),
  // pending, verified, rejected
  invitedAt: timestamp("invited_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var applicationComments = pgTable("application_comments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  comment: text("comment").notNull(),
  commentType: text("comment_type").default("note"),
  // note, decision, verification, flag
  isInternal: boolean("is_internal").default(true),
  // internal notes vs. applicant-visible
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var applicationNotifications = pgTable("application_notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  notificationType: text("notification_type").notNull(),
  // status_change, document_request, reminder, expiration_warning
  channel: text("channel").default("email"),
  // email, in_app, sms
  subject: text("subject"),
  content: text("content"),
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
  status: text("status").default("pending"),
  // pending, sent, failed, read
  createdAt: timestamp("created_at").defaultNow()
});
var userNotificationPreferences = pgTable("user_notification_preferences", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  emailNewApplications: boolean("email_new_applications").default(true),
  emailStatusUpdates: boolean("email_status_updates").default(true),
  emailPropertySaved: boolean("email_property_saved").default(true),
  emailLeaseReminders: boolean("email_lease_reminders").default(true),
  inAppNotifications: boolean("in_app_notifications").default(true),
  pushNotifications: boolean("push_notifications").default(false),
  notificationFrequency: text("notification_frequency").default("instant"),
  // instant, daily, weekly
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var propertyNotifications = pgTable("property_notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
  notificationType: text("notification_type").notNull(),
  // property_saved, price_changed, status_changed, new_similar_property
  channel: text("channel").default("email"),
  // email, in_app, sms
  subject: text("subject"),
  content: text("content"),
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
  status: text("status").default("pending"),
  // pending, sent, failed, read
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  userPropertyUnique: unique().on(table.userId, table.propertyId)
}));
var inquiries = pgTable("inquiries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: uuid("agent_id").references(() => users.id, { onDelete: "cascade" }),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email").notNull(),
  senderPhone: text("sender_phone"),
  message: text("message"),
  inquiryType: text("inquiry_type"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at")
});
var requirements = pgTable("requirements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  budgetMin: decimal("budget_min", { precision: 10, scale: 2 }),
  budgetMax: decimal("budget_max", { precision: 10, scale: 2 }),
  bedrooms: integer("bedrooms"),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }),
  propertyType: jsonb("property_type"),
  locations: jsonb("locations"),
  amenities: jsonb("amenities"),
  pets: jsonb("pets"),
  leaseTerm: text("lease_term"),
  moveInDate: date("move_in_date"),
  additionalNotes: text("additional_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating"),
  title: text("title"),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at")
}, (table) => ({
  userPropertyUnique: unique().on(table.userId, table.propertyId)
}));
var favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  userPropertyUnique: unique().on(table.userId, table.propertyId)
}));
var savedSearches = pgTable("saved_searches", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  filters: jsonb("filters").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  subscribedAt: timestamp("subscribed_at").defaultNow()
});
var contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject"),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var adminSettings = pgTable("admin_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var LEASE_ACTIONS = [
  "lease_created",
  "lease_edited",
  "lease_sent",
  "lease_accepted",
  "lease_declined",
  "lease_signed_tenant",
  "lease_signed_landlord",
  "move_in_scheduled"
];
var IMAGE_AUDIT_ACTIONS = [
  "image_upload",
  "image_delete",
  "image_replace",
  "image_reorder"
];
var AUDIT_ACTIONS = [
  "create",
  "update",
  "delete",
  "view",
  "login",
  "logout",
  "2fa_enable",
  "2fa_disable",
  "2fa_verify",
  "password_change",
  "role_change",
  "status_change",
  "document_upload",
  "document_verify",
  "application_review",
  "application_approve",
  "application_reject",
  "payment_verify_manual",
  "payment_attempt",
  "application_info_request",
  "application_conditional_approve",
  ...LEASE_ACTIONS,
  ...IMAGE_AUDIT_ACTIONS
];
var imageAuditLogs = pgTable("image_audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  actorRole: text("actor_role").notNull(),
  action: text("action").notNull(),
  // upload, delete, replace, reorder
  photoId: uuid("photo_id"),
  propertyId: uuid("property_id"),
  metadata: jsonb("metadata").$type(),
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});
var paymentVerifications = pgTable("payment_verifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }),
  verifiedBy: uuid("verified_by").references(() => users.id, { onDelete: "set null" }),
  amount: decimal("amount", { precision: 8, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  // cash, check, bank_transfer, wire_transfer, money_order, other
  receivedAt: timestamp("received_at").notNull(),
  referenceId: text("reference_id").notNull(),
  internalNote: text("internal_note"),
  confirmationChecked: boolean("confirmation_checked").default(false),
  previousPaymentStatus: text("previous_payment_status"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertPaymentVerificationSchema = createInsertSchema(paymentVerifications).omit({
  id: true,
  createdAt: true
});
var auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: uuid("resource_id"),
  previousData: jsonb("previous_data"),
  newData: jsonb("new_data"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata").$type(),
  createdAt: timestamp("created_at").defaultNow()
});
var sensitiveData = pgTable("sensitive_data", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }),
  dataType: text("data_type").notNull(),
  encryptedValue: text("encrypted_value").notNull(),
  encryptionKeyId: text("encryption_key_id"),
  accessedBy: jsonb("accessed_by").$type(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];
var MAX_FILE_SIZE = 10 * 1024 * 1024;
var uploadedFiles = pgTable("uploaded_files", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  storagePath: text("storage_path").notNull(),
  checksum: text("checksum"),
  isVerified: boolean("is_verified").default(false),
  verifiedBy: uuid("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertAdminSettingsSchema = createInsertSchema(adminSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true
});
var insertSensitiveDataSchema = createInsertSchema(sensitiveData).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertUploadedFileSchema = createInsertSchema(uploadedFiles).omit({
  id: true,
  createdAt: true,
  isVerified: true,
  verifiedBy: true,
  verifiedAt: true
});
var transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "set null" }),
  agentId: uuid("agent_id").references(() => users.id, { onDelete: "set null" }),
  agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "set null" }),
  buyerId: uuid("buyer_id").references(() => users.id, { onDelete: "set null" }),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "set null" }),
  transactionType: text("transaction_type").default("lease"),
  transactionAmount: decimal("transaction_amount", { precision: 12, scale: 2 }),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }),
  commissionAmount: decimal("commission_amount", { precision: 12, scale: 2 }),
  agentSplit: decimal("agent_split", { precision: 5, scale: 2 }),
  agentCommission: decimal("agent_commission", { precision: 12, scale: 2 }),
  agencyCommission: decimal("agency_commission", { precision: 12, scale: 2 }),
  status: text("status").default("pending"),
  closedAt: timestamp("closed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var agentReviews = pgTable("agent_reviews", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: uuid("agent_id").references(() => users.id, { onDelete: "cascade" }),
  reviewerId: uuid("reviewer_id").references(() => users.id, { onDelete: "cascade" }),
  transactionId: uuid("transaction_id").references(() => transactions.id, { onDelete: "set null" }),
  rating: integer("rating").notNull(),
  title: text("title"),
  comment: text("comment"),
  wouldRecommend: boolean("would_recommend").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  reviewerAgentUnique: unique().on(table.reviewerId, table.agentId)
}));
var conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "set null" }),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "set null" }),
  subject: text("subject"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var conversationParticipants = pgTable("conversation_participants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  lastReadAt: timestamp("last_read_at"),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  conversationUserUnique: unique().on(table.conversationId, table.userId)
}));
var messages = pgTable("messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  messageType: text("message_type").default("text"),
  // text, system, attachment
  attachments: jsonb("attachments").$type(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertAgencySchema = createInsertSchema(agencies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true
});
var insertPropertySchema = createInsertSchema(properties, {
  price: z.coerce.string(),
  bedrooms: z.coerce.number(),
  bathrooms: z.coerce.string(),
  squareFeet: z.coerce.number().optional(),
  latitude: z.coerce.string().optional(),
  longitude: z.coerce.string().optional()
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true
});
var insertPropertyNoteSchema = createInsertSchema(propertyNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertPropertyQuestionSchema = createInsertSchema(propertyQuestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  reviewedBy: true,
  reviewedAt: true,
  score: true,
  scoreBreakdown: true,
  scoredAt: true,
  rejectionCategory: true,
  rejectionReason: true,
  rejectionDetails: true,
  expiredAt: true,
  statusHistory: true,
  previousStatus: true
});
var insertCoApplicantSchema = createInsertSchema(coApplicants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  invitedAt: true,
  respondedAt: true
});
var insertApplicationCommentSchema = createInsertSchema(applicationComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertApplicationNotificationSchema = createInsertSchema(applicationNotifications).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  readAt: true
});
var insertUserNotificationPreferencesSchema = createInsertSchema(userNotificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertPropertyNotificationSchema = createInsertSchema(propertyNotifications).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  readAt: true
});
var insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true
});
var insertRequirementSchema = createInsertSchema(requirements).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true
});
var insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true
});
var insertSavedSearchSchema = createInsertSchema(savedSearches).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({
  id: true,
  subscribedAt: true
});
var insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
  read: true
});
var insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  closedAt: true
});
var insertAgentReviewSchema = createInsertSchema(agentReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertConversationParticipantSchema = createInsertSchema(conversationParticipants).omit({
  id: true,
  createdAt: true,
  lastReadAt: true
});
var insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  readAt: true
});
var leaseStatusUpdateSchema = z.object({
  leaseStatus: z.enum([...LEASE_STATUSES]),
  leaseDocumentUrl: z.string().url().optional(),
  leaseVersion: z.number().int().positive().optional(),
  moveInDate: z.string().datetime().optional(),
  notes: z.string().optional()
});
var signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  // Password requirements: 8+ characters, at least one uppercase letter, at least one number
  // These same requirements are displayed as hints on the login form for consistency
  password: z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[0-9]/, "Password must contain at least one number"),
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().regex(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/, "Please enter a valid phone number").optional().or(z.literal("")),
  role: z.enum(["renter", "buyer", "landlord", "property_manager", "agent"]).optional().default("renter")
});
var loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  // Note: Login schema only validates that password is not empty.
  // Password format requirements are enforced at signup and displayed as a UX hint on login form.
  // The actual password validation happens server-side via Supabase auth.
  password: z.string().min(1, "Password is required")
});
var contentReports = pgTable("content_reports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: uuid("reporter_id").references(() => users.id, { onDelete: "set null" }),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
  reviewId: uuid("review_id").references(() => reviews.id, { onDelete: "cascade" }),
  reportType: text("report_type").notNull(),
  description: text("description"),
  status: text("status").default("pending"),
  priority: text("priority").default("normal"),
  assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
  resolution: text("resolution"),
  resolvedBy: uuid("resolved_by").references(() => users.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var disputes = pgTable("disputes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  initiatorId: uuid("initiator_id").references(() => users.id, { onDelete: "set null" }),
  respondentId: uuid("respondent_id").references(() => users.id, { onDelete: "set null" }),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "set null" }),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "set null" }),
  disputeType: text("dispute_type").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: text("status").default("open"),
  priority: text("priority").default("normal"),
  assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
  resolution: text("resolution"),
  resolvedBy: uuid("resolved_by").references(() => users.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var disputeMessages = pgTable("dispute_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  disputeId: uuid("dispute_id").references(() => disputes.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").references(() => users.id, { onDelete: "set null" }),
  message: text("message").notNull(),
  isInternal: boolean("is_internal").default(false),
  attachments: jsonb("attachments").$type(),
  createdAt: timestamp("created_at").defaultNow()
});
var documentVerifications = pgTable("document_verifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }),
  fileId: uuid("file_id").references(() => uploadedFiles.id, { onDelete: "cascade" }),
  documentType: text("document_type").notNull(),
  status: text("status").default("pending"),
  verifiedBy: uuid("verified_by").references(() => users.id, { onDelete: "set null" }),
  verifiedAt: timestamp("verified_at"),
  rejectionReason: text("rejection_reason"),
  expiresAt: timestamp("expires_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertContentReportSchema = createInsertSchema(contentReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedBy: true,
  resolvedAt: true
});
var insertDisputeSchema = createInsertSchema(disputes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedBy: true,
  resolvedAt: true
});
var insertDisputeMessageSchema = createInsertSchema(disputeMessages).omit({
  id: true,
  createdAt: true
});
var insertDocumentVerificationSchema = createInsertSchema(documentVerifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verifiedBy: true,
  verifiedAt: true
});
var pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var leases = pgTable("leases", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id").references(() => users.id, { onDelete: "cascade" }),
  landlordId: uuid("landlord_id").references(() => users.id, { onDelete: "cascade" }),
  monthlyRent: decimal("monthly_rent", { precision: 12, scale: 2 }).notNull(),
  securityDepositAmount: decimal("security_deposit_amount", { precision: 12, scale: 2 }).notNull(),
  rentDueDay: integer("rent_due_day").default(1).notNull(),
  // Day of month (1-31)
  leaseStartDate: timestamp("lease_start_date").notNull(),
  leaseEndDate: timestamp("lease_end_date").notNull(),
  status: text("status").default("active"),
  // active, expired, terminated
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var payments = pgTable("payments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  leaseId: uuid("lease_id").references(() => leases.id, { onDelete: "cascade" }).notNull(),
  tenantId: uuid("tenant_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  type: text("type").notNull(),
  // rent, security_deposit
  status: text("status").default("pending"),
  // pending, paid, overdue, verified
  dueDate: timestamp("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  referenceId: text("reference_id"),
  // Transaction/receipt reference
  verifiedBy: uuid("verified_by").references(() => users.id, { onDelete: "set null" }),
  verifiedAt: timestamp("verified_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertLeaseSchema = createInsertSchema(leases).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  paidAt: true,
  verifiedBy: true,
  verifiedAt: true
});
var leaseTemplates = pgTable("lease_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  state: text("state"),
  // State-specific template
  rentAmount: decimal("rent_amount", { precision: 12, scale: 2 }),
  securityDeposit: decimal("security_deposit", { precision: 12, scale: 2 }),
  leaseTermMonths: integer("lease_term_months"),
  content: text("content").notNull(),
  // Template HTML/text content
  customClauses: jsonb("custom_clauses").$type(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var leaseDrafts = pgTable("lease_drafts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }),
  templateId: uuid("template_id").references(() => leaseTemplates.id, { onDelete: "set null" }),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "cascade" }),
  version: integer("version").default(1),
  status: text("status").default("draft"),
  // draft, ready_to_send, sent
  rentAmount: decimal("rent_amount", { precision: 12, scale: 2 }).notNull(),
  securityDeposit: decimal("security_deposit", { precision: 12, scale: 2 }),
  leaseStartDate: timestamp("lease_start_date").notNull(),
  leaseEndDate: timestamp("lease_end_date").notNull(),
  content: text("content").notNull(),
  customClauses: jsonb("custom_clauses").$type(),
  changes: jsonb("changes").$type(),
  signatureEnabled: boolean("signature_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var leaseSignatures = pgTable("lease_signatures", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }),
  signerId: uuid("signer_id").references(() => users.id, { onDelete: "cascade" }),
  signerRole: text("signer_role").notNull(),
  // tenant, landlord
  signatureData: text("signature_data").notNull(),
  // Base64 encoded signature or digital signature
  documentHash: text("document_hash"),
  // Hash of signed document for verification
  signedAt: timestamp("signed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});
var propertyTemplates = pgTable("property_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  propertyType: text("property_type"),
  bedrooms: integer("bedrooms"),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }),
  squareFeet: integer("square_feet"),
  amenities: jsonb("amenities").$type(),
  furnished: boolean("furnished").default(false),
  petsAllowed: boolean("pets_allowed").default(false),
  leaseTerm: text("lease_term"),
  utilitiesIncluded: jsonb("utilities_included").$type(),
  defaultPrice: decimal("default_price", { precision: 12, scale: 2 }),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertPropertyTemplateSchema = createInsertSchema(propertyTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertLeaseTemplateSchema = createInsertSchema(leaseTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertLeaseDraftSchema = createInsertSchema(leaseDrafts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  version: true,
  changes: true,
  status: true
});
var updateLeaseDraftSchema = z.object({
  rentAmount: z.number().positive().optional(),
  securityDeposit: z.number().nonnegative().optional(),
  leaseStartDate: z.string().datetime().optional(),
  leaseEndDate: z.string().datetime().optional(),
  content: z.string().optional(),
  customClauses: z.array(z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    optional: z.boolean(),
    included: z.boolean().optional()
  })).optional(),
  status: z.enum(["draft", "ready_to_send", "sent"]).optional(),
  changeDescription: z.string().optional()
});
var insertLeaseSignatureSchema = createInsertSchema(leaseSignatures).omit({
  id: true,
  createdAt: true,
  signedAt: true
});
var leaseSendSchema = z.object({
  changeDescription: z.string().default("Lease sent to tenant")
});
var leaseAcceptSchema = z.object({
  moveInDate: z.string().datetime().optional()
});
var leaseDeclineSchema = z.object({
  reason: z.string().min(1, "Decline reason is required").optional()
});
var leaseSignatureEnableSchema = z.object({
  signatureEnabled: z.boolean()
});
var leaseSignSchema = z.object({
  signatureData: z.string().min(1, "Signature data is required"),
  documentHash: z.string().optional()
});
var leaseCounstersignSchema = z.object({
  signatureData: z.string().min(1, "Signature data is required"),
  documentHash: z.string().optional()
});
var moveInPrepareSchema = z.object({
  moveInDate: z.string().datetime().optional(),
  keyPickup: z.object({
    location: z.string().min(1, "Key pickup location required"),
    time: z.string().min(1, "Key pickup time required"),
    notes: z.string().optional()
  }).optional(),
  accessDetails: z.object({
    gateCode: z.string().optional(),
    keypadCode: z.string().optional(),
    smartLockCode: z.string().optional(),
    notes: z.string().optional()
  }).optional(),
  utilityNotes: z.object({
    electricity: z.string().optional(),
    water: z.string().optional(),
    gas: z.string().optional(),
    internet: z.string().optional(),
    other: z.string().optional()
  }).optional(),
  checklistItems: z.array(z.object({
    id: z.string(),
    item: z.string(),
    completed: z.boolean().optional()
  })).optional()
});
var moveInChecklistUpdateSchema = z.object({
  checklistItems: z.array(z.object({
    id: z.string(),
    completed: z.boolean()
  })).min(1)
});
var geocodeAddressSchema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional()
});
var scheduledPublishSchema = z.object({
  scheduledPublishAt: z.string().datetime().optional().nullable()
});
var propertyManagerAssignments = pgTable("property_manager_assignments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }).notNull(),
  propertyManagerId: uuid("property_manager_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  assignedBy: uuid("assigned_by").references(() => users.id, { onDelete: "set null" }),
  permissions: jsonb("permissions").$type().default(sql`'["view_properties", "manage_applications", "manage_leases", "manage_payments", "manage_maintenance", "messaging_access"]'::jsonb`),
  assignedAt: timestamp("assigned_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertPropertyManagerAssignmentSchema = createInsertSchema(propertyManagerAssignments).omit({
  id: true,
  assignedAt: true,
  createdAt: true,
  updatedAt: true,
  revokedAt: true
});
var PHOTO_CATEGORIES = [
  "property",
  "maintenance",
  "inspection",
  "documentation",
  "other"
];
var photos = pgTable("photos", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  imageKitFileId: text("imagekit_file_id").notNull(),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  category: text("category").notNull().$type(),
  uploaderId: uuid("uploader_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
  maintenanceRequestId: uuid("maintenance_request_id"),
  isPrivate: boolean("is_private").default(false),
  orderIndex: integer("order_index").default(0),
  archived: boolean("archived").default(false),
  archivedAt: timestamp("archived_at"),
  replacedWithId: uuid("replaced_with_id").references(() => photos.id, { onDelete: "set null" }),
  metadata: jsonb("metadata").$type(),
  fileSizeBytes: integer("file_size_bytes").default(0),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// server/rate-limit.ts
import rateLimit from "express-rate-limit";
var isDev = process.env.NODE_ENV !== "production";
var RATE_LIMITING_ENABLED = process.env.RATE_LIMITING_ENABLED !== "false";
var authLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: isDev ? 1e3 : 5,
  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes.",
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !RATE_LIMITING_ENABLED
});
var signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1e3,
  max: isDev ? 1e3 : 5,
  message: {
    success: false,
    message: "Too many signup attempts. Please try again in 1 hour.",
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !RATE_LIMITING_ENABLED
});
var inquiryLimiter = rateLimit({
  windowMs: 60 * 1e3,
  max: isDev ? 1e3 : 10,
  message: {
    success: false,
    message: "Too many requests. Please wait a minute before trying again.",
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !RATE_LIMITING_ENABLED
});
var newsletterLimiter = rateLimit({
  windowMs: 60 * 1e3,
  max: isDev ? 1e3 : 3,
  message: {
    success: false,
    message: "Too many subscription attempts. Please wait a minute.",
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !RATE_LIMITING_ENABLED
});
var viewLimiter = rateLimit({
  windowMs: 60 * 1e3,
  max: isDev ? 1e3 : 30,
  message: {
    success: false,
    message: "Too many view requests. Please wait a minute.",
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !RATE_LIMITING_ENABLED
});

// server/security/routes.ts
init_supabase();

// server/security/two-factor-auth.ts
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";
var APP_NAME = "ChoiceProperties";
function generateTwoFactorSecret(userEmail) {
  const secret = speakeasy.generateSecret({
    name: `${APP_NAME}:${userEmail}`,
    length: 32
  });
  return {
    secret: secret.base32,
    otpAuthUrl: secret.otpauth_url || ""
  };
}
async function generateQRCode(otpAuthUrl) {
  try {
    return await QRCode.toDataURL(otpAuthUrl);
  } catch (error2) {
    console.error("Failed to generate QR code:", error2);
    throw new Error("Failed to generate QR code");
  }
}
function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}
function hashBackupCodes(codes) {
  return codes.map(
    (code) => crypto.createHash("sha256").update(code.replace("-", "")).digest("hex")
  );
}
function verifyBackupCode(inputCode, hashedCodes) {
  const hashedInput = crypto.createHash("sha256").update(inputCode.replace("-", "")).digest("hex");
  const index = hashedCodes.findIndex((hashed) => hashed === hashedInput);
  return { valid: index !== -1, usedIndex: index };
}
function verifyTOTP(secret, token) {
  try {
    return speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 1
    });
  } catch (error2) {
    console.error("TOTP verification failed:", error2);
    return false;
  }
}
async function setupTwoFactor(userEmail) {
  const { secret, otpAuthUrl } = generateTwoFactorSecret(userEmail);
  const qrCodeDataUrl = await generateQRCode(otpAuthUrl);
  const backupCodes = generateBackupCodes();
  return {
    secret,
    otpAuthUrl,
    qrCodeDataUrl,
    backupCodes
  };
}
function requiresTwoFactor(role) {
  const rolesRequiring2FA = ["landlord", "property_manager", "agent", "admin", "owner"];
  return rolesRequiring2FA.includes(role);
}

// server/security/encryption.ts
import crypto2 from "crypto";
var ALGORITHM = "aes-256-gcm";
var IV_LENGTH = 16;
var SALT_LENGTH = 32;
var TAG_LENGTH = 16;
var KEY_LENGTH = 32;
var ITERATIONS = 1e5;
var fallbackKey = null;
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    console.warn("[ENCRYPTION] No ENCRYPTION_KEY set. Using stable fallback key. SET ENCRYPTION_KEY IN PRODUCTION!");
    if (!fallbackKey) {
      fallbackKey = crypto2.createHash("sha256").update("choice-properties-dev-key-not-for-production").digest("hex");
    }
    return fallbackKey;
  }
  return key;
}
function deriveKey(password, salt) {
  return crypto2.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha256");
}
function encrypt(plaintext) {
  try {
    const masterKey = getEncryptionKey();
    const salt = crypto2.randomBytes(SALT_LENGTH);
    const iv = crypto2.randomBytes(IV_LENGTH);
    const key = deriveKey(masterKey, salt);
    const cipher = crypto2.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag();
    return Buffer.concat([salt, iv, authTag, Buffer.from(encrypted, "hex")]).toString("base64");
  } catch (error2) {
    console.error("[ENCRYPTION] Encryption failed:", error2);
    throw new Error("Encryption failed");
  }
}
function decrypt(ciphertext) {
  try {
    const masterKey = getEncryptionKey();
    const buffer = Buffer.from(ciphertext, "base64");
    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const key = deriveKey(masterKey, salt);
    const decipher = crypto2.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error2) {
    console.error("[ENCRYPTION] Decryption failed:", error2);
    throw new Error("Decryption failed");
  }
}
function hashSensitiveData(data) {
  return crypto2.createHash("sha256").update(data).digest("hex");
}
function maskSSN(ssn) {
  if (!ssn || ssn.length < 4) return "***-**-****";
  return `***-**-${ssn.slice(-4)}`;
}
function maskPhoneNumber(phone) {
  if (!phone || phone.length < 4) return "***-***-****";
  const digits = phone.replace(/\D/g, "");
  return `***-***-${digits.slice(-4)}`;
}
function maskEmail(email) {
  if (!email || !email.includes("@")) return "***@***.***";
  const [local, domain] = email.split("@");
  const maskedLocal = local.length > 2 ? local[0] + "*".repeat(local.length - 2) + local.slice(-1) : "**";
  return `${maskedLocal}@${domain}`;
}
function encryptSensitiveField(value, type) {
  const encrypted = encrypt(value);
  const hash = hashSensitiveData(value);
  let masked;
  switch (type) {
    case "ssn":
      masked = maskSSN(value);
      break;
    case "phone":
      masked = maskPhoneNumber(value);
      break;
    case "email":
      masked = maskEmail(value);
      break;
    default:
      masked = "*".repeat(Math.max(value.length - 2, 3));
  }
  return { value: encrypted, masked, hash };
}

// server/security/file-upload.ts
import crypto3 from "crypto";
import path from "path";
var DANGEROUS_EXTENSIONS = [
  ".exe",
  ".dll",
  ".bat",
  ".cmd",
  ".msi",
  ".scr",
  ".ps1",
  ".sh",
  ".bash",
  ".zsh",
  ".js",
  ".vbs",
  ".jar",
  ".php",
  ".py",
  ".rb",
  ".html",
  ".htm",
  ".svg"
];
var MAGIC_NUMBERS = {
  "image/jpeg": [255, 216, 255],
  "image/png": [137, 80, 78, 71],
  "image/gif": [71, 73, 70],
  "image/webp": [82, 73, 70, 70],
  "application/pdf": [37, 80, 68, 70]
};
function sanitizeFilename(filename) {
  let sanitized = path.basename(filename);
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");
  sanitized = sanitized.replace(/\.{2,}/g, ".");
  sanitized = sanitized.replace(/^[._-]+|[._-]+$/g, "");
  if (!sanitized || sanitized.length < 1) {
    sanitized = `file_${Date.now()}`;
  }
  const maxLength = 100;
  if (sanitized.length > maxLength) {
    const ext = path.extname(sanitized);
    const base = path.basename(sanitized, ext);
    sanitized = base.substring(0, maxLength - ext.length - 1) + ext;
  }
  return sanitized;
}
function calculateChecksum(buffer) {
  return crypto3.createHash("sha256").update(buffer).digest("hex");
}
function checkMagicNumber(buffer, mimeType) {
  const magic = MAGIC_NUMBERS[mimeType];
  if (!magic) return true;
  if (buffer.length < magic.length) return false;
  for (let i = 0; i < magic.length; i++) {
    if (buffer[i] !== magic[i]) return false;
  }
  return true;
}
function hasDangerousExtension(filename) {
  const ext = path.extname(filename).toLowerCase();
  return DANGEROUS_EXTENSIONS.includes(ext);
}
function validateFileUpload(filename, mimeType, size, buffer) {
  if (!filename || filename.trim().length === 0) {
    return { valid: false, error: "Filename is required" };
  }
  if (hasDangerousExtension(filename)) {
    return { valid: false, error: "File type not allowed for security reasons" };
  }
  if (!ALLOWED_FILE_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(", ")}`
    };
  }
  if (size > MAX_FILE_SIZE) {
    const maxMB = MAX_FILE_SIZE / (1024 * 1024);
    return { valid: false, error: `File size exceeds maximum of ${maxMB}MB` };
  }
  if (size < 1) {
    return { valid: false, error: "File is empty" };
  }
  if (buffer && !checkMagicNumber(buffer, mimeType)) {
    return { valid: false, error: "File content does not match declared type" };
  }
  const sanitizedFilename = sanitizeFilename(filename);
  const checksum = buffer ? calculateChecksum(buffer) : void 0;
  return {
    valid: true,
    sanitizedFilename,
    checksum
  };
}
function generateSecureFilename(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp2 = Date.now();
  const random = crypto3.randomBytes(8).toString("hex");
  return `${timestamp2}_${random}${ext}`;
}
function getUploadPath(userId, applicationId) {
  const basePath = "uploads";
  if (applicationId) {
    return `${basePath}/applications/${applicationId}`;
  }
  return `${basePath}/users/${userId}`;
}

// server/security/routes.ts
function registerSecurityRoutes(app2) {
  app2.post("/api/security/2fa/setup", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const userEmail = req.user.email;
      const { data: user } = await supabase.from("users").select("two_factor_enabled").eq("id", userId).single();
      if (user?.two_factor_enabled) {
        return res.status(400).json({ error: "Two-factor authentication is already enabled" });
      }
      const setup = await setupTwoFactor(userEmail);
      const hashedBackupCodes = hashBackupCodes(setup.backupCodes);
      await supabase.from("users").update({
        two_factor_secret: setup.secret,
        two_factor_backup_codes: hashedBackupCodes,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", userId);
      return res.json(success({
        qrCodeDataUrl: setup.qrCodeDataUrl,
        backupCodes: setup.backupCodes,
        message: "Scan the QR code with your authenticator app, then verify with a code to enable 2FA"
      }, "2FA setup initiated"));
    } catch (err) {
      console.error("[2FA] Setup error:", err);
      return res.status(500).json(error("Failed to setup 2FA"));
    }
  });
  app2.post("/api/security/2fa/verify", authenticateToken, async (req, res) => {
    try {
      const { code } = req.body;
      const userId = req.user.id;
      if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "Verification code is required" });
      }
      const { data: user } = await supabase.from("users").select("two_factor_secret, two_factor_enabled").eq("id", userId).single();
      if (!user?.two_factor_secret) {
        return res.status(400).json({ error: "2FA has not been set up" });
      }
      const isValid = verifyTOTP(user.two_factor_secret, code);
      if (!isValid) {
        await logSecurityEvent(userId, "2fa_verify", false, { reason: "Invalid code" }, req);
        return res.status(400).json({ error: "Invalid verification code" });
      }
      if (!user.two_factor_enabled) {
        await supabase.from("users").update({
          two_factor_enabled: true,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }).eq("id", userId);
      }
      await logSecurityEvent(userId, "2fa_verify", true, {}, req);
      return res.json(success({ verified: true }, "2FA verified successfully"));
    } catch (err) {
      console.error("[2FA] Verify error:", err);
      return res.status(500).json(error("Failed to verify 2FA"));
    }
  });
  app2.post("/api/security/2fa/disable", authenticateToken, async (req, res) => {
    try {
      const { code, password } = req.body;
      const userId = req.user.id;
      if (!code) {
        return res.status(400).json({ error: "Verification code is required" });
      }
      const { data: user } = await supabase.from("users").select("two_factor_secret, two_factor_enabled").eq("id", userId).single();
      if (!user?.two_factor_enabled) {
        return res.status(400).json({ error: "2FA is not enabled" });
      }
      const isValid = verifyTOTP(user.two_factor_secret, code);
      if (!isValid) {
        await logSecurityEvent(userId, "2fa_disable", false, { reason: "Invalid code" }, req);
        return res.status(400).json({ error: "Invalid verification code" });
      }
      await supabase.from("users").update({
        two_factor_enabled: false,
        two_factor_secret: null,
        two_factor_backup_codes: null,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", userId);
      await logSecurityEvent(userId, "2fa_disable", true, {}, req);
      return res.json(success({ disabled: true }, "2FA disabled successfully"));
    } catch (err) {
      console.error("[2FA] Disable error:", err);
      return res.status(500).json(error("Failed to disable 2FA"));
    }
  });
  app2.post("/api/security/2fa/backup-verify", authenticateToken, async (req, res) => {
    try {
      const { backupCode } = req.body;
      const userId = req.user.id;
      if (!backupCode) {
        return res.status(400).json({ error: "Backup code is required" });
      }
      const { data: user } = await supabase.from("users").select("two_factor_backup_codes").eq("id", userId).single();
      if (!user?.two_factor_backup_codes) {
        return res.status(400).json({ error: "No backup codes available" });
      }
      const result = verifyBackupCode(backupCode, user.two_factor_backup_codes);
      if (!result.valid) {
        await logSecurityEvent(userId, "2fa_verify", false, { reason: "Invalid backup code" }, req);
        return res.status(400).json({ error: "Invalid backup code" });
      }
      const updatedCodes = [...user.two_factor_backup_codes];
      updatedCodes.splice(result.usedIndex, 1);
      await supabase.from("users").update({
        two_factor_backup_codes: updatedCodes,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", userId);
      await logSecurityEvent(userId, "2fa_verify", true, { method: "backup_code" }, req);
      return res.json(success({
        verified: true,
        remainingBackupCodes: updatedCodes.length
      }, "Backup code verified"));
    } catch (err) {
      console.error("[2FA] Backup verify error:", err);
      return res.status(500).json(error("Failed to verify backup code"));
    }
  });
  app2.get("/api/security/2fa/status", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { data: user } = await supabase.from("users").select("two_factor_enabled, two_factor_backup_codes").eq("id", userId).single();
      const isRequired = requiresTwoFactor(userRole);
      const backupCodesRemaining = user?.two_factor_backup_codes?.length || 0;
      return res.json(success({
        enabled: user?.two_factor_enabled || false,
        required: isRequired,
        backupCodesRemaining
      }, "2FA status retrieved"));
    } catch (err) {
      return res.status(500).json(error("Failed to get 2FA status"));
    }
  });
  app2.get("/api/security/audit-logs", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { userId, action, resourceType, resourceId, startDate, endDate, page, limit } = req.query;
      const filters = {};
      if (userId) filters.userId = userId;
      if (action) filters.action = action;
      if (resourceType) filters.resourceType = resourceType;
      if (resourceId) filters.resourceId = resourceId;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 50;
      const result = await getAuditLogs(filters, pageNum, limitNum);
      return res.json(success(result, "Audit logs retrieved"));
    } catch (err) {
      return res.status(500).json(error("Failed to get audit logs"));
    }
  });
  app2.post("/api/security/sensitive-data", authenticateToken, requireRole("admin", "owner", "agent", "landlord", "property_manager"), async (req, res) => {
    try {
      const { applicationId, dataType, value } = req.body;
      const userId = req.user.id;
      if (!dataType || !value) {
        return res.status(400).json({ error: "Data type and value are required" });
      }
      const fieldType = dataType === "ssn" ? "ssn" : dataType === "phone" ? "phone" : dataType === "email" ? "email" : "other";
      const encrypted = encryptSensitiveField(value, fieldType);
      const { data, error: error2 } = await supabase.from("sensitive_data").insert({
        user_id: userId,
        application_id: applicationId || null,
        data_type: dataType,
        encrypted_value: encrypted.value
      }).select().single();
      if (error2) throw error2;
      await logSecurityEvent(userId, "create", true, { dataType, resourceId: data.id }, req);
      return res.json(success({ id: data.id, masked: encrypted.masked }, "Sensitive data stored securely"));
    } catch (err) {
      return res.status(500).json(error("Failed to store sensitive data"));
    }
  });
  app2.get("/api/security/sensitive-data/:id", authenticateToken, requireRole("admin", "owner", "agent", "landlord", "property_manager"), async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { reason } = req.query;
      if (!reason) {
        return res.status(400).json({ error: "Access reason is required" });
      }
      const { data, error: error2 } = await supabase.from("sensitive_data").select("*").eq("id", id).single();
      if (error2 || !data) {
        return res.status(404).json({ error: "Data not found" });
      }
      const decryptedValue = decrypt(data.encrypted_value);
      const accessLog = data.accessed_by || [];
      accessLog.push({
        userId,
        accessedAt: (/* @__PURE__ */ new Date()).toISOString(),
        reason
      });
      await supabase.from("sensitive_data").update({ accessed_by: accessLog, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id);
      await logSecurityEvent(userId, "view", true, {
        dataType: data.data_type,
        resourceId: id,
        reason
      }, req);
      return res.json(success({
        value: decryptedValue,
        dataType: data.data_type
      }, "Sensitive data retrieved"));
    } catch (err) {
      return res.status(500).json(error("Failed to retrieve sensitive data"));
    }
  });
  app2.post("/api/security/validate-file", authenticateToken, async (req, res) => {
    try {
      const { filename, mimeType, size } = req.body;
      if (!filename || !mimeType || size === void 0) {
        return res.status(400).json({ error: "Filename, mimeType, and size are required" });
      }
      const validation = validateFileUpload(filename, mimeType, size);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
      const secureFilename = generateSecureFilename(filename);
      const uploadPath = getUploadPath(req.user.id);
      return res.json(success({
        valid: true,
        secureFilename,
        uploadPath,
        sanitizedFilename: validation.sanitizedFilename
      }, "File validated successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to validate file"));
    }
  });
}

// server/upload-limits.ts
var MAX_IMAGES_PER_PROPERTY = 50;
var MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
var MAX_FILE_SIZE_MB = MAX_FILE_SIZE_BYTES / (1024 * 1024);
async function checkPropertyImageLimit(supabase3, propertyId) {
  try {
    const { data: photos2, error: error2 } = await supabase3.from("photos").select("id").eq("property_id", propertyId).eq("archived", false);
    if (error2) {
      console.error("[UPLOAD] Error checking image count:", error2);
      return { allowed: false, reason: "Failed to verify image limit" };
    }
    const imageCount = photos2?.length || 0;
    if (imageCount >= MAX_IMAGES_PER_PROPERTY) {
      return {
        allowed: false,
        reason: `This property has reached the maximum of ${MAX_IMAGES_PER_PROPERTY} images. Please delete some images before uploading more.`,
        imageCount,
        maxImages: MAX_IMAGES_PER_PROPERTY
      };
    }
    return {
      allowed: true,
      imageCount,
      maxImages: MAX_IMAGES_PER_PROPERTY
    };
  } catch (err) {
    console.error("[UPLOAD] Exception checking image limit:", err);
    return { allowed: false, reason: "Failed to verify image limit" };
  }
}
function validateFileSize(fileSizeBytes) {
  if (!fileSizeBytes) {
    return { valid: true };
  }
  if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      reason: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE_MB}MB. Your file is ${(fileSizeBytes / (1024 * 1024)).toFixed(2)}MB.`
    };
  }
  return { valid: true };
}

// server/modules/properties/property.routes.ts
import { Router } from "express";

// server/modules/properties/property.repository.ts
init_supabase();
async function findAllProperties(filters) {
  const {
    propertyType,
    city,
    minPrice,
    maxPrice,
    status,
    ownerId,
    page,
    limit
  } = filters;
  const supabase3 = getSupabaseOrThrow();
  const offset = (page - 1) * limit;
  let query = supabase3.from("properties").select("*", { count: "exact" });
  if (ownerId) {
    query = query.eq("owner_id", ownerId);
  }
  if (propertyType) query = query.eq("property_type", propertyType);
  if (city) query = query.ilike("city", `%${city}%`);
  if (minPrice) query = query.gte("price", minPrice);
  if (maxPrice) query = query.lte("price", maxPrice);
  if (status) {
    query = query.eq("status", status);
  } else if (!ownerId) {
    query = query.eq("status", "active");
  }
  const { data, error: error2, count } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
  if (error2) {
    console.error("[PROPERTY_REPOSITORY] findAllProperties error:", error2);
    throw error2;
  }
  return {
    data: data ?? [],
    count: count ?? 0
  };
}
async function findPropertyById(id) {
  const supabase3 = getSupabaseOrThrow();
  const { data, error: error2 } = await supabase3.from("properties").select("*").eq("id", id).single();
  if (error2) {
    if (error2.code !== "PGRST116") {
      console.error("[PROPERTY_REPOSITORY] findPropertyById error:", error2);
    }
    return null;
  }
  return data;
}
async function createProperty(propertyData) {
  const supabase3 = getSupabaseOrThrow();
  const { data, error: error2 } = await supabase3.from("properties").insert(propertyData).select().single();
  if (error2) {
    console.error("[PROPERTY_REPOSITORY] createProperty failed:", {
      code: error2.code,
      message: error2.message,
      details: error2.details,
      ownerId: propertyData.owner_id,
      imageCount: propertyData.images?.length ?? 0
    });
    throw error2;
  }
  return data;
}
async function updateProperty(id, updateData) {
  const supabase3 = getSupabaseOrThrow();
  if (!id) {
    throw new Error("Property ID is required for update");
  }
  const payload = {
    ...updateData,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const { data, error: error2 } = await supabase3.from("properties").update(payload).eq("id", id).select().single();
  if (error2) {
    console.error("[PROPERTY_REPOSITORY] updateProperty failed:", {
      propertyId: id,
      error: error2,
      payloadKeys: Object.keys(updateData)
    });
    throw error2;
  }
  return data;
}
async function deleteProperty(id) {
  const supabase3 = getSupabaseOrThrow();
  const { error: error2 } = await supabase3.from("properties").delete().eq("id", id);
  if (error2) {
    console.error("[PROPERTY_REPOSITORY] deleteProperty failed:", error2);
    throw error2;
  }
  return null;
}
async function incrementPropertyViews(propertyId) {
  const supabase3 = getSupabaseOrThrow();
  const { error: error2 } = await supabase3.rpc("increment_property_views", {
    property_id: propertyId
  });
  if (!error2) return;
  console.warn(
    "[PROPERTY_REPOSITORY] RPC increment failed, using fallback",
    error2
  );
  const { data } = await supabase3.from("properties").select("view_count").eq("id", propertyId).single();
  const currentViews = data?.view_count ?? 0;
  await supabase3.from("properties").update({ view_count: currentViews + 1 }).eq("id", propertyId);
}

// server/modules/properties/property.service.ts
async function getProperties(params) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
  const cacheKey = [
    "properties",
    params.propertyType ?? "",
    params.city ?? "",
    params.minPrice ?? "",
    params.maxPrice ?? "",
    params.status ?? "active",
    params.ownerId ?? "",
    page,
    limit
  ].join(":");
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const { data = [], count = 0 } = await findAllProperties({
    propertyType: params.propertyType,
    city: params.city,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    status: params.status,
    ownerId: params.ownerId,
    page,
    limit
  });
  const totalPages = Math.ceil(count / limit);
  const result = {
    properties: data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
  cache.set(cacheKey, result, CACHE_TTL.PROPERTIES_LIST);
  return result;
}
async function getPropertyById(id) {
  const cacheKey = `property:${id}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const property = await findPropertyById(id);
  if (!property) return null;
  cache.set(cacheKey, property, CACHE_TTL.PROPERTY_DETAIL);
  return property;
}
async function createProperty2({
  body,
  userId
}) {
  console.log(`[PROPERTY_SERVICE] Creating property for user ${userId}. Body:`, JSON.stringify(body));
  const parsed = insertPropertySchema.safeParse(body);
  if (!parsed.success) {
    console.error("[PROPERTY_SERVICE] Validation failed:", parsed.error.errors);
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const propertyData = {
    ...parsed.data,
    owner_id: userId
  };
  try {
    const data = await createProperty(propertyData);
    cache.invalidate("properties:");
    return { data };
  } catch (err) {
    console.error("[PROPERTY_SERVICE] Repository error:", err);
    return { error: err.message || "Failed to save property to database" };
  }
}
async function updateProperty2(id, updateData, userId) {
  const property = await findPropertyById(id);
  if (!property) {
    throw new Error("Property not found");
  }
  if (userId && property.owner_id !== userId) {
    console.error(
      `[PROPERTY] Unauthorized update attempt. User=${userId}, Owner=${property.owner_id}`
    );
    throw new Error("Unauthorized: You do not own this property");
  }
  const updated = await updateProperty(id, updateData);
  cache.invalidate(`property:${id}`);
  cache.invalidate("properties:");
  invalidateOwnershipCache("property", id);
  return updated;
}
async function deleteProperty2(id, userId) {
  const property = await findPropertyById(id);
  if (!property) {
    throw new Error("Property not found");
  }
  if (userId && property.owner_id !== userId) {
    throw new Error("Unauthorized: You do not own this property");
  }
  await deleteProperty(id);
  cache.invalidate(`property:${id}`);
  cache.invalidate("properties:");
  invalidateOwnershipCache("property", id);
  return null;
}
async function recordPropertyView(propertyId) {
  await incrementPropertyViews(propertyId);
}

// server/modules/properties/property.routes.ts
var router = Router();
router.get("/", async (req, res) => {
  try {
    const { propertyType, city, minPrice, maxPrice, status, page, limit, ownerId } = req.query;
    const result = await getProperties({
      propertyType,
      city,
      minPrice,
      maxPrice,
      status,
      ownerId,
      // FIX 2a: Accept ownerId parameter
      page,
      limit
    });
    return res.json(success(result, "Properties fetched successfully"));
  } catch (err) {
    return res.status(500).json(error("Failed to fetch properties"));
  }
});
router.get("/:id", async (req, res) => {
  try {
    const data = await getPropertyById(req.params.id);
    if (!data) {
      return res.status(404).json(error("Property not found"));
    }
    return res.json(success(data, "Property fetched successfully"));
  } catch (err) {
    return res.status(500).json(error("Failed to fetch property"));
  }
});
router.post("/", authenticateToken, async (req, res) => {
  try {
    const result = await createProperty2({
      body: req.body,
      userId: req.user.id
    });
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    return res.json(success(result.data, "Property created successfully"));
  } catch (err) {
    return res.status(500).json(error("Failed to create property"));
  }
});
router.patch("/:id", authenticateToken, requireOwnership("property"), async (req, res) => {
  try {
    const data = await updateProperty2(req.params.id, req.body, req.user.id);
    return res.json(success(data, "Property updated successfully"));
  } catch (err) {
    if (err.message && err.message.includes("Unauthorized")) {
      return res.status(403).json(error(err.message));
    }
    return res.status(500).json(error("Failed to update property"));
  }
});
router.delete("/:id", authenticateToken, requireOwnership("property"), async (req, res) => {
  try {
    await deleteProperty2(req.params.id);
    return res.json(success(null, "Property deleted successfully"));
  } catch (err) {
    return res.status(500).json(error("Failed to delete property"));
  }
});
router.post("/:id/view", viewLimiter, async (req, res) => {
  try {
    await recordPropertyView(req.params.id);
    return res.json(success(null, "View recorded"));
  } catch (err) {
    return res.status(500).json(error("Failed to record view"));
  }
});
var property_routes_default = router;

// server/modules/properties/index.ts
function registerPropertyRoutes(app2) {
  app2.use("/api/v2/properties", property_routes_default);
}

// server/modules/applications/application.routes.ts
import { Router as Router2 } from "express";

// server/modules/applications/application.service.ts
init_email();

// server/modules/applications/application.repository.ts
init_supabase();
async function findApplicationById(id) {
  const supabase3 = getSupabaseOrThrow();
  const { data, error: error2 } = await supabase3.from("applications").select("*").eq("id", id).single();
  if (error2) throw error2;
  return data;
}
async function findApplicationsByUserId(userId) {
  const supabase3 = getSupabaseOrThrow();
  const { data, error: error2 } = await supabase3.from("applications").select("*, properties(*)").eq("user_id", userId);
  if (error2) throw error2;
  return data;
}
async function findApplicationsByPropertyId(propertyId) {
  const supabase3 = getSupabaseOrThrow();
  const { data, error: error2 } = await supabase3.from("applications").select("*, users(id, full_name, email, phone)").eq("property_id", propertyId);
  if (error2) throw error2;
  return data;
}
async function checkDuplicateApplication(userId, propertyId) {
  const supabase3 = getSupabaseOrThrow();
  const { data, error: error2 } = await supabase3.from("applications").select("id").eq("user_id", userId).eq("property_id", propertyId).single();
  return { exists: !!data, error: error2 };
}
async function createApplication(applicationData) {
  const supabase3 = getSupabaseOrThrow();
  const { data, error: error2 } = await supabase3.from("applications").insert([applicationData]).select();
  if (error2) {
    console.error("[APPLICATION_REPOSITORY] Failed to create application:", {
      message: error2.message,
      code: error2.code,
      details: error2.details,
      keys: Object.keys(applicationData)
    });
    throw error2;
  }
  return data[0];
}
async function updateApplication(id, updateData) {
  const supabase3 = getSupabaseOrThrow();
  const { data, error: error2 } = await supabase3.from("applications").update({ ...updateData, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id).select();
  if (error2) throw error2;
  return data[0];
}
async function updateApplicationStatus(id, updateData) {
  const supabase3 = getSupabaseOrThrow();
  const { data, error: error2 } = await supabase3.from("applications").update(updateData).eq("id", id).select();
  if (error2) throw error2;
  return data[0];
}
async function getProperty(id) {
  const supabase3 = getSupabaseOrThrow();
  const { data, error: error2 } = await supabase3.from("properties").select("owner_id, title").eq("id", id).single();
  if (error2) throw error2;
  return data;
}
async function getUser(id) {
  const supabase3 = getSupabaseOrThrow();
  const { data, error: error2 } = await supabase3.from("users").select("email, full_name").eq("id", id).single();
  if (error2) throw error2;
  return data;
}
async function createConversation(conversationData) {
  const supabase3 = getSupabaseOrThrow();
  const { data, error: error2 } = await supabase3.from("conversations").insert([conversationData]).select().single();
  if (error2) throw error2;
  return data;
}
async function addConversationParticipant(conversationId, userId) {
  const supabase3 = getSupabaseOrThrow();
  const { data, error: error2 } = await supabase3.from("conversation_participants").insert([{ conversation_id: conversationId, user_id: userId }]);
  if (error2) throw error2;
  return data;
}
async function updateApplicationConversation(applicationId, conversationId) {
  const supabase3 = getSupabaseOrThrow();
  const { data, error: error2 } = await supabase3.from("applications").update({ conversation_id: conversationId }).eq("id", applicationId);
  if (error2) throw error2;
  return data;
}

// server/modules/applications/application.service.ts
async function createApplication2(input) {
  const validation = insertApplicationSchema.safeParse(input.body);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }
  const { propertyId } = validation.data;
  const duplicateCheck = await checkDuplicateApplication(
    input.userId,
    propertyId
  );
  if (duplicateCheck.exists) {
    return {
      error: "You have already applied for this property. Please check your applications."
    };
  }
  const applicationPayload = {
    ...validation.data,
    user_id: input.userId,
    status: "submitted",
    status_history: [
      {
        status: "submitted",
        changedAt: (/* @__PURE__ */ new Date()).toISOString(),
        changedBy: input.userId
      }
    ]
  };
  const application = await createApplication(applicationPayload);
  if (!application?.id) {
    return { error: "Failed to create application" };
  }
  const [user, property] = await Promise.all([
    getUser(input.userId),
    getProperty(propertyId)
  ]);
  if (property?.owner_id) {
    try {
      const conversation = await createConversation({
        property_id: propertyId,
        application_id: application.id,
        subject: `Application for ${property.title}`
      });
      if (conversation?.id) {
        await Promise.all([
          addConversationParticipant(
            conversation.id,
            input.userId
          ),
          addConversationParticipant(
            conversation.id,
            property.owner_id
          ),
          updateApplicationConversation(
            application.id,
            conversation.id
          )
        ]);
      }
    } catch (err) {
      console.error("[APPLICATION] Conversation setup failed:", err);
    }
  }
  if (user?.email) {
    sendEmail({
      to: user.email,
      subject: "Your Application Has Been Received",
      html: getApplicationConfirmationEmailTemplate({
        applicantName: user.full_name || "Applicant",
        propertyTitle: property?.title || "Property"
      })
    }).catch(
      (err) => console.error("[APPLICATION] Confirmation email failed:", err)
    );
  }
  notifyOwnerOfNewApplication(application.id).catch(
    (err) => console.error("[APPLICATION] Owner notification failed:", err)
  );
  return { data: application };
}
async function getApplicationById(id) {
  return findApplicationById(id);
}
async function getApplicationsByUserId(userId, requesterUserId, requesterRole) {
  if (userId !== requesterUserId && requesterRole !== "admin") {
    return { error: "Not authorized" };
  }
  const data = await findApplicationsByUserId(userId);
  return { data };
}
async function getApplicationsByPropertyId(propertyId, requesterUserId, requesterRole) {
  if (!propertyId) {
    return { error: "Property ID is required" };
  }
  const property = await getProperty(propertyId);
  if (!property) {
    return { error: "Property not found" };
  }
  if (property.owner_id !== requesterUserId && requesterRole !== "admin") {
    return { error: "Not authorized" };
  }
  const data = await findApplicationsByPropertyId(propertyId);
  return { data };
}
async function updateApplication2(input) {
  const application = await findApplicationById(input.id);
  if (!application) {
    return { error: "Application not found" };
  }
  const property = await getProperty(application.property_id);
  const isApplicant = application.user_id === input.userId;
  const isPropertyOwner = property?.owner_id === input.userId;
  const isAdmin = input.userRole === "admin";
  if (!isApplicant && !isPropertyOwner && !isAdmin) {
    return { error: "Not authorized" };
  }
  const data = await updateApplication(
    input.id,
    input.body
  );
  return { data };
}
async function updateStatus(input) {
  if (!input.status) {
    return { success: false, error: "Status is required" };
  }
  const application = await findApplicationById(input.id);
  if (!application) {
    return { success: false, error: "Application not found" };
  }
  const property = await getProperty(application.property_id);
  const isApplicant = application.user_id === input.userId;
  const isPropertyOwner = property?.owner_id === input.userId;
  const isAdmin = input.userRole === "admin";
  if (input.status === "withdrawn" && !isApplicant) {
    return {
      success: false,
      error: "Only the applicant can withdraw this application"
    };
  }
  if (["approved", "rejected", "under_review", "pending_verification"].includes(
    input.status
  ) && !isPropertyOwner && !isAdmin) {
    return {
      success: false,
      error: "Only the property owner can update this status"
    };
  }
  const historyEntry = {
    status: input.status,
    changedAt: (/* @__PURE__ */ new Date()).toISOString(),
    changedBy: input.userId,
    reason: input.reason
  };
  const updatePayload = {
    status: input.status,
    previous_status: application.status,
    status_history: [...application.status_history || [], historyEntry],
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (input.rejectionCategory) {
    updatePayload.rejection_category = input.rejectionCategory;
  }
  if (input.rejectionReason) {
    updatePayload.rejection_reason = input.rejectionReason;
  }
  if (input.rejectionDetails) {
    updatePayload.rejection_details = input.rejectionDetails;
  }
  const data = await updateApplicationStatus(
    input.id,
    updatePayload
  );
  return { success: true, data };
}

// server/modules/applications/application.routes.ts
var router2 = Router2();
router2.post("/", authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json(error("Authentication required to submit an application. Please log in or create an account."));
    }
    const result = await createApplication2({
      body: req.body,
      userId: req.user.id
    });
    if (result.error) {
      return res.status(400).json(error(result.error));
    }
    return res.json(success(result.data, "Application submitted successfully"));
  } catch (err) {
    console.error("[APPLICATIONS] Error submitting application:", err);
    return res.status(500).json(error("Failed to submit application. Please try again."));
  }
});
router2.get("/:id", authenticateToken, async (req, res) => {
  try {
    const data = await getApplicationById(req.params.id);
    return res.json(success(data, "Application fetched successfully"));
  } catch (err) {
    return res.status(500).json(error("Failed to fetch application"));
  }
});
router2.get("/user/:userId", authenticateToken, async (req, res) => {
  try {
    const result = await getApplicationsByUserId(
      req.params.userId,
      req.user.id,
      req.user.role
    );
    if (result.error) {
      return res.status(403).json({ error: result.error });
    }
    return res.json(success(result.data, "User applications fetched successfully"));
  } catch (err) {
    return res.status(500).json(error("Failed to fetch user applications"));
  }
});
router2.get("/property/:propertyId", authenticateToken, async (req, res) => {
  try {
    const result = await getApplicationsByPropertyId(
      req.params.propertyId,
      req.user.id,
      req.user.role
    );
    if (result.error) {
      return res.status(403).json({ error: result.error });
    }
    return res.json(success(result.data, "Property applications fetched successfully"));
  } catch (err) {
    return res.status(500).json(error("Failed to fetch property applications"));
  }
});
router2.patch("/:id", authenticateToken, async (req, res) => {
  try {
    const result = await updateApplication2({
      id: req.params.id,
      body: req.body,
      userId: req.user.id,
      userRole: req.user.role
    });
    if (result.error) {
      return res.status(403).json({ error: result.error });
    }
    return res.json(success(result.data, "Application updated successfully"));
  } catch (err) {
    return res.status(500).json(error("Failed to update application"));
  }
});
router2.patch("/:id/status", authenticateToken, async (req, res) => {
  try {
    const { status, rejectionCategory, rejectionReason, rejectionDetails, reason } = req.body;
    const result = await updateStatus({
      id: req.params.id,
      status,
      userId: req.user.id,
      userRole: req.user.role,
      rejectionCategory,
      rejectionReason,
      rejectionDetails,
      reason
    });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.json(success(result.data, "Application status updated successfully"));
  } catch (err) {
    return res.status(500).json(error("Failed to update application status"));
  }
});
var application_routes_default = router2;

// server/modules/applications/index.ts
function registerApplicationRoutes(app2) {
  app2.use("/api/v2/applications", application_routes_default);
}

// server/modules/payments/payment.repository.ts
init_supabase();
var PaymentRepository = class {
  async getPaymentById(paymentId) {
    const { data, error: error2 } = await supabase.from("payments").select("*").eq("id", paymentId).single();
    if (error2) throw error2;
    return data;
  }
  async getPaymentWithLeaseInfo(paymentId) {
    const { data, error: error2 } = await supabase.from("payments").select("*, leases(landlord_id, application_id, tenant_id)").eq("id", paymentId).single();
    if (error2) throw error2;
    return data;
  }
  async getPaymentWithFullDetails(paymentId) {
    const { data, error: error2 } = await supabase.from("payments").select(`
        id,
        type,
        amount,
        due_date,
        paid_at,
        verified_at,
        reference_id,
        status,
        created_at,
        leases(
          id,
          application_id,
          monthly_rent,
          security_deposit_amount,
          applications(
            id,
            property_id,
            tenant_id,
            properties(title, address),
            users(full_name, email)
          )
        ),
        verified_by_user:users!payments_verified_by_fkey(full_name, email)
      `).eq("id", paymentId).single();
    if (error2) throw error2;
    return data;
  }
  async updatePaymentVerified(paymentId, userId, amount, method, dateReceived) {
    const { error: error2 } = await supabase.from("payments").update({
      status: "verified",
      verified_by: userId,
      verified_at: (/* @__PURE__ */ new Date()).toISOString(),
      paid_at: new Date(dateReceived).toISOString(),
      manual_payment_method: method,
      amount: parseFloat(amount.toString()),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", paymentId);
    if (error2) throw error2;
  }
  async updatePaymentMarkPaid(paymentId, referenceId, notes) {
    const { error: error2 } = await supabase.from("payments").update({
      status: "paid",
      paid_at: (/* @__PURE__ */ new Date()).toISOString(),
      reference_id: referenceId || null,
      notes: notes || null,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", paymentId);
    if (error2) throw error2;
  }
  async getUserById(userId) {
    const { data, error: error2 } = await supabase.from("users").select("full_name").eq("id", userId).single();
    if (error2) throw error2;
    return data;
  }
};

// server/modules/payments/payment.service.ts
var PaymentService = class {
  repository;
  constructor() {
    this.repository = new PaymentRepository();
  }
  async processPayment(applicationId, amount, cardToken) {
    const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mockTransactionId = `txn_${Date.now()}`;
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      paymentId: mockPaymentId,
      transactionId: mockTransactionId,
      amount,
      status: "completed",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      message: "[MOCK PAYMENT] In production, this would process with real payment provider"
    };
  }
  async verifyPayment(paymentId, userId, userRole, amount, method, dateReceived, req) {
    const payment = await this.repository.getPaymentWithLeaseInfo(paymentId);
    if (!payment) {
      throw { status: 404, message: "Payment not found" };
    }
    const isLandlord = payment.leases?.landlord_id === userId;
    const isAdmin = userRole === "admin";
    if (!isLandlord && !isAdmin) {
      throw { status: 403, message: "Only landlord or admin can verify payments" };
    }
    if (payment.status === "verified") {
      throw { status: 400, message: "Payment already verified" };
    }
    await this.repository.updatePaymentVerified(paymentId, userId, amount, method, dateReceived);
    await logPaymentAction(
      userId,
      paymentId,
      "payment_verified",
      payment.status,
      "verified",
      {
        method,
        amount,
        dateReceived,
        type: payment.type,
        verifiedByRole: userRole
      },
      req
    );
    try {
      const tenantData = await this.repository.getUserById(payment.leases?.tenant_id);
      if (tenantData?.full_name) {
        await sendPaymentVerifiedNotification(
          paymentId,
          payment.leases?.tenant_id,
          payment.type === "rent" ? "Rent" : "Security Deposit",
          amount.toString()
        );
      }
    } catch (notificationErr) {
      console.error("[PAYMENTS] Failed to send verification notification:", notificationErr);
    }
  }
  async markPaymentPaid(paymentId, userId, userRole, referenceId, notes, req) {
    const payment = await this.repository.getPaymentWithLeaseInfo(paymentId);
    if (!payment) {
      throw { status: 404, message: "Payment not found" };
    }
    const isTenant = payment.leases?.tenant_id === userId;
    const isAdmin = userRole === "admin";
    if (!isTenant && !isAdmin) {
      throw { status: 403, message: "Only tenant can mark their own payment as paid" };
    }
    if (payment.status === "verified" || payment.status === "paid") {
      throw { status: 400, message: "Payment already processed" };
    }
    await this.repository.updatePaymentMarkPaid(paymentId, referenceId, notes);
    await logPaymentAction(
      userId,
      paymentId,
      "payment_marked_paid",
      payment.status,
      "paid",
      {
        referenceId,
        notes,
        amount: payment.amount,
        type: payment.type
      },
      req
    );
    try {
      const tenantData = await this.repository.getUserById(userId);
      if (tenantData?.full_name) {
        await sendPaymentReceivedNotification(
          paymentId,
          tenantData.full_name,
          payment.type === "rent" ? "Rent" : "Security Deposit",
          payment.amount.toString()
        );
      }
    } catch (notificationErr) {
      console.error("[PAYMENTS] Failed to send notification:", notificationErr);
    }
  }
  async getReceipt(paymentId, userId, userRole) {
    const payment = await this.repository.getPaymentWithFullDetails(paymentId);
    if (!payment) {
      throw { status: 404, message: "Payment not found" };
    }
    const paymentAny = payment;
    const isTenant = paymentAny.leases?.[0]?.applications?.[0]?.tenant_id === userId;
    const isLandlord = paymentAny.leases?.[0]?.applications?.[0]?.properties?.[0]?.owner_id === userId;
    const isAdmin = userRole === "admin";
    if (!isTenant && !isLandlord && !isAdmin) {
      throw { status: 403, message: "Not authorized to view this receipt" };
    }
    const receipt = {
      receiptNumber: `RCP-${payment.id.substring(0, 8).toUpperCase()}`,
      paymentId: payment.id,
      type: payment.type === "rent" ? "Monthly Rent" : "Security Deposit",
      amount: parseFloat(payment.amount.toString()),
      dueDate: payment.due_date,
      paidDate: payment.paid_at || payment.verified_at,
      verificationDate: payment.verified_at,
      status: payment.status,
      referenceId: payment.reference_id,
      property: {
        title: paymentAny.leases?.[0]?.applications?.[0]?.properties?.[0]?.title,
        address: paymentAny.leases?.[0]?.applications?.[0]?.properties?.[0]?.address
      },
      tenant: {
        name: paymentAny.leases?.[0]?.applications?.[0]?.users?.[0]?.full_name,
        email: paymentAny.leases?.[0]?.applications?.[0]?.users?.[0]?.email
      },
      verifiedBy: paymentAny.verified_by_user?.full_name || "Pending verification",
      createdAt: payment.created_at
    };
    return receipt;
  }
  async blockPaymentDeletion(paymentId, userId, userRole, req) {
    await logPaymentAction(
      userId,
      paymentId,
      "payment_delete_blocked",
      void 0,
      void 0,
      {
        attemptedBy: userId,
        role: userRole,
        reason: "Payment deletion is blocked for financial accountability"
      },
      req
    );
    throw {
      status: 403,
      message: "Payment records cannot be deleted for audit and compliance purposes",
      code: "PAYMENT_DELETE_BLOCKED"
    };
  }
};

// server/modules/payments/payment.routes.ts
var paymentService = new PaymentService();
function registerPaymentRoutes(app2) {
  app2.post("/api/v2/payments/process", authenticateToken, async (req, res) => {
    try {
      const { applicationId, amount, cardToken } = req.body;
      if (!applicationId || !amount) {
        return res.status(400).json({ error: "Missing applicationId or amount" });
      }
      const result = await paymentService.processPayment(applicationId, amount, cardToken);
      return res.json(success(result, "Payment processed successfully"));
    } catch (err) {
      console.error("[PAYMENTS] Process error:", err);
      return res.status(500).json(error("Failed to process payment"));
    }
  });
  app2.post("/api/v2/payments/:paymentId/verify", authenticateToken, async (req, res) => {
    try {
      const paymentId = req.params.paymentId;
      const { amount, method, dateReceived } = req.body;
      if (!amount || !method || !dateReceived) {
        return res.status(400).json({ error: "Amount, method, and date received are required" });
      }
      await paymentService.verifyPayment(
        paymentId,
        req.user.id,
        req.user.role,
        amount,
        method,
        dateReceived,
        req
      );
      return res.json(success({ status: "verified", message: "Payment verified." }, "Payment verified successfully"));
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      console.error("[PAYMENTS] Verify error:", err);
      return res.status(500).json(error("Failed to verify payment"));
    }
  });
  app2.post("/api/v2/payments/:paymentId/mark-paid", authenticateToken, async (req, res) => {
    try {
      const paymentId = req.params.paymentId;
      const { referenceId, notes } = req.body;
      await paymentService.markPaymentPaid(
        paymentId,
        req.user.id,
        req.user.role,
        referenceId,
        notes,
        req
      );
      return res.json(success({ status: "paid" }, "Payment marked as paid - awaiting verification"));
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      console.error("[PAYMENTS] Mark paid error:", err);
      return res.status(500).json(error("Failed to mark payment as paid"));
    }
  });
  app2.get("/api/v2/payments/:paymentId/receipt", authenticateToken, async (req, res) => {
    try {
      const paymentId = req.params.paymentId;
      const receipt = await paymentService.getReceipt(paymentId, req.user.id, req.user.role);
      return res.json(success(receipt, "Receipt retrieved successfully"));
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      console.error("[PAYMENTS] Receipt error:", err);
      return res.status(500).json(error("Failed to retrieve receipt"));
    }
  });
  app2.delete("/api/v2/payments/:paymentId", authenticateToken, async (req, res) => {
    try {
      await paymentService.blockPaymentDeletion(req.params.paymentId, req.user.id, req.user.role, req);
      return res.status(403).json({
        error: "Payment records cannot be deleted for audit and compliance purposes",
        code: "PAYMENT_DELETE_BLOCKED"
      });
    } catch (err) {
      if (err.code === "PAYMENT_DELETE_BLOCKED") {
        return res.status(403).json({
          error: err.message || "Payment records cannot be deleted for audit and compliance purposes",
          code: "PAYMENT_DELETE_BLOCKED"
        });
      }
      console.error("[PAYMENTS] Delete error:", err);
      return res.status(500).json(error("Failed to process request"));
    }
  });
  app2.get("/api/v2/payments/audit-logs", authenticateToken, async (req, res) => {
    try {
      const isAdmin = req.user.role === "admin";
      const isLandlord = req.user.role === "landlord";
      const isPropertyManager = req.user.role === "property_manager";
      if (!isAdmin && !isLandlord && !isPropertyManager) {
        return res.status(403).json({ error: "Only admins, landlords, and property managers can view payment audit logs" });
      }
      const paymentId = req.query.paymentId;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);
      const { logs, total } = await getPaymentAuditLogs(paymentId, page, limit);
      return res.json(
        success(
          {
            logs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
          },
          "Payment audit logs retrieved successfully"
        )
      );
    } catch (err) {
      console.error("[PAYMENTS] Audit logs error:", err);
      return res.status(500).json(error("Failed to retrieve payment audit logs"));
    }
  });
}

// server/modules/payments/index.ts
function registerPaymentModuleRoutes(app2) {
  registerPaymentRoutes(app2);
}

// server/modules/leases/lease.repository.ts
init_supabase();
var LeaseRepository = class {
  async getLeaseById(leaseId) {
    const { data, error: error2 } = await supabase.from("leases").select("id, landlord_id, tenant_id, monthly_rent, security_deposit_amount, applications(property_id, properties(title, address))").eq("id", leaseId).single();
    if (error2) throw error2;
    return data;
  }
  async getLeaseWithDates(leaseId) {
    const { data, error: error2 } = await supabase.from("leases").select("id, tenant_id, landlord_id, monthly_rent, rent_due_day, lease_start_date, lease_end_date").eq("id", leaseId).single();
    if (error2) throw error2;
    return data;
  }
  async getLeaseForRentPayments(leaseId) {
    const { data, error: error2 } = await supabase.from("leases").select("tenant_id, landlord_id").eq("id", leaseId).single();
    if (error2) throw error2;
    return data;
  }
  async getPaymentsForLease(leaseId) {
    const { data, error: error2 } = await supabase.from("payments").select("*, verified_by_user:users!payments_verified_by_fkey(full_name)").eq("lease_id", leaseId).order("due_date", { ascending: false });
    if (error2) throw error2;
    return data || [];
  }
  async getRentPaymentsForLease(leaseId) {
    const { data, error: error2 } = await supabase.from("payments").select("*").eq("lease_id", leaseId).eq("type", "rent").order("due_date", { ascending: true });
    if (error2) throw error2;
    return data || [];
  }
  async getExistingRentPayments(leaseId) {
    const { data, error: error2 } = await supabase.from("payments").select("due_date, type").eq("lease_id", leaseId).eq("type", "rent");
    if (error2) throw error2;
    return data || [];
  }
  async createRentPayments(paymentsToCreate) {
    const { data, error: error2 } = await supabase.from("payments").insert(paymentsToCreate).select();
    if (error2) throw error2;
    return data || [];
  }
};

// server/modules/leases/lease.service.ts
var LeaseService = class {
  repository;
  constructor() {
    this.repository = new LeaseRepository();
  }
  async getPaymentHistory(leaseId, userId, userRole) {
    const lease = await this.repository.getLeaseById(leaseId);
    if (!lease) {
      throw { status: 404, message: "Lease not found" };
    }
    const isLandlord = lease.landlord_id === userId;
    const isTenant = lease.tenant_id === userId;
    const isAdmin = userRole === "admin";
    if (!isLandlord && !isTenant && !isAdmin) {
      throw { status: 403, message: "Not authorized to view payment history" };
    }
    const payments2 = await this.repository.getPaymentsForLease(leaseId);
    const now = /* @__PURE__ */ new Date();
    const enrichedPayments = (payments2 || []).map((p) => {
      const dueDate = new Date(p.due_date);
      const isOverdue = p.status === "pending" && dueDate < now;
      return {
        ...p,
        status: isOverdue ? "overdue" : p.status
      };
    });
    const summary = {
      totalPayments: enrichedPayments.length,
      verified: enrichedPayments.filter((p) => p.status === "verified").length,
      paid: enrichedPayments.filter((p) => p.status === "paid").length,
      pending: enrichedPayments.filter((p) => p.status === "pending").length,
      overdue: enrichedPayments.filter((p) => p.status === "overdue").length,
      totalVerifiedAmount: enrichedPayments.filter((p) => p.status === "verified").reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0),
      totalOutstandingAmount: enrichedPayments.filter((p) => ["pending", "overdue"].includes(p.status)).reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
    };
    return {
      lease: {
        id: lease.id,
        property: lease.applications?.[0]?.properties,
        monthlyRent: lease.monthly_rent,
        securityDepositAmount: lease.security_deposit_amount
      },
      payments: enrichedPayments,
      summary
    };
  }
  async generateRentPayments(leaseId, userId, userRole, gracePeriodDays = 0, req) {
    const lease = await this.repository.getLeaseWithDates(leaseId);
    if (!lease) {
      throw { status: 404, message: "Lease not found" };
    }
    const isTenant = lease.tenant_id === userId;
    const isLandlord = lease.landlord_id === userId;
    const isAdmin = userRole === "admin";
    if (!isTenant && !isLandlord && !isAdmin) {
      throw { status: 403, message: "Not authorized to generate rent payments" };
    }
    const startDate = new Date(lease.lease_start_date);
    const endDate = new Date(lease.lease_end_date);
    const rentDueDay = lease.rent_due_day || 1;
    const rentAmount = parseFloat(lease.monthly_rent.toString());
    const paymentsToCreate = [];
    const currentDate = new Date(startDate);
    while (currentDate < endDate) {
      const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), rentDueDay);
      if (dueDate < startDate) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }
      if (dueDate <= endDate) {
        paymentsToCreate.push({
          lease_id: leaseId,
          tenant_id: lease.tenant_id,
          amount: rentAmount,
          type: "rent",
          status: "pending",
          due_date: dueDate.toISOString()
        });
      }
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    if (paymentsToCreate.length === 0) {
      return { created: 0, message: "No rent payments to create for lease period" };
    }
    const existingPayments = await this.repository.getExistingRentPayments(leaseId);
    const existingDates = new Set(existingPayments?.map((p) => new Date(p.due_date).toDateString()) || []);
    const newPayments = paymentsToCreate.filter((p) => !existingDates.has(new Date(p.due_date).toDateString()));
    if (newPayments.length === 0) {
      return { created: 0, message: "All rent payments already exist" };
    }
    const inserted = await this.repository.createRentPayments(newPayments);
    await logAuditEvent({
      userId,
      action: "create",
      resourceType: "payment",
      resourceId: leaseId,
      previousData: {},
      newData: { count: inserted?.length || 0, type: "rent" },
      req
    });
    return {
      created: inserted?.length || 0,
      payments: inserted || [],
      message: `Generated ${inserted?.length || 0} rent payment records`
    };
  }
  async getRentPayments(leaseId, userId, userRole) {
    const lease = await this.repository.getLeaseForRentPayments(leaseId);
    if (!lease) {
      throw { status: 404, message: "Lease not found" };
    }
    const isTenant = lease.tenant_id === userId;
    const isLandlord = lease.landlord_id === userId;
    const isAdmin = userRole === "admin";
    if (!isTenant && !isLandlord && !isAdmin) {
      throw { status: 403, message: "Not authorized to view rent payments" };
    }
    const payments2 = await this.repository.getRentPaymentsForLease(leaseId);
    const grouped = {
      pending: payments2?.filter((p) => p.status === "pending") || [],
      paid: payments2?.filter((p) => p.status === "paid") || [],
      verified: payments2?.filter((p) => p.status === "verified") || [],
      overdue: payments2?.filter((p) => p.status === "overdue") || []
    };
    const stats = {
      totalRent: payments2?.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0,
      pendingAmount: grouped.pending.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0),
      paidAmount: grouped.paid.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0),
      verifiedAmount: grouped.verified.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0),
      overdueAmount: grouped.overdue.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
    };
    return { payments: grouped, stats };
  }
};

// server/modules/leases/lease.routes.ts
var leaseService = new LeaseService();
function registerLeaseRoutes(app2) {
  app2.get("/api/v2/leases/:leaseId/payment-history", authenticateToken, async (req, res) => {
    try {
      const result = await leaseService.getPaymentHistory(req.params.leaseId, req.user.id, req.user.role);
      return res.json(success(result, "Payment history retrieved successfully"));
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      console.error("[LEASES] Payment history error:", err);
      return res.status(500).json(error("Failed to retrieve payment history"));
    }
  });
  app2.post("/api/v2/leases/:leaseId/generate-rent-payments", authenticateToken, async (req, res) => {
    try {
      const { gracePeriodDays = 0 } = req.body;
      const result = await leaseService.generateRentPayments(
        req.params.leaseId,
        req.user.id,
        req.user.role,
        gracePeriodDays,
        req
      );
      return res.json(success(result, "Rent payments generated successfully"));
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      console.error("[LEASES] Generate rent error:", err);
      return res.status(500).json(error("Failed to generate rent payments"));
    }
  });
  app2.get("/api/v2/leases/:leaseId/rent-payments", authenticateToken, async (req, res) => {
    try {
      const result = await leaseService.getRentPayments(req.params.leaseId, req.user.id, req.user.role);
      return res.json(success(result, "Rent payments retrieved successfully"));
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      console.error("[LEASES] Get rent payments error:", err);
      return res.status(500).json(error("Failed to retrieve rent payments"));
    }
  });
}

// server/modules/leases/index.ts
function registerLeaseModuleRoutes(app2) {
  registerLeaseRoutes(app2);
}

// server/modules/admin/admin.repository.ts
init_supabase();
var AdminRepository = class {
  async getImageAuditLogs(propertyId, action, limit = 100, offset = 0) {
    let query = supabase.from("image_audit_logs").select("id, actor_id, actor_role, action, photo_id, property_id, metadata, timestamp, users:actor_id(id, full_name, email, role)", { count: "exact" }).order("timestamp", { ascending: false });
    if (propertyId) {
      query = query.eq("property_id", propertyId);
    }
    if (action) {
      query = query.eq("action", action);
    }
    const { data, error: error2, count } = await query.range(offset, offset + limit - 1);
    if (error2) throw error2;
    return { logs: data || [], total: count || 0 };
  }
  async getPersonas() {
    const { data, error: error2 } = await supabase.from("personas").select("*");
    if (error2) throw error2;
    return data || [];
  }
  async createPersona(personaData) {
    const { data, error: error2 } = await supabase.from("personas").insert([personaData]).select().single();
    if (error2) throw error2;
    return data;
  }
  async updatePersona(id, updates) {
    const { data, error: error2 } = await supabase.from("personas").update(updates).eq("id", id).select().single();
    if (error2) throw error2;
    return data;
  }
  async deletePersona(id) {
    const { error: error2 } = await supabase.from("personas").delete().eq("id", id);
    if (error2) throw error2;
  }
  async getSettings() {
    const { data, error: error2 } = await supabase.from("admin_settings").select("*").single();
    if (error2 && error2.code !== "PGRST116") throw error2;
    return data || { maintenance_mode: false, notification_enabled: true };
  }
  async updateSettings(updates) {
    const { data, error: error2 } = await supabase.from("admin_settings").upsert(updates, { onConflict: "id" }).select().single();
    if (error2) throw error2;
    return data;
  }
};

// server/modules/admin/admin.service.ts
var AdminService = class {
  repository;
  constructor() {
    this.repository = new AdminRepository();
  }
  async getImageAuditLogs(propertyId, action, limit = 100, offset = 0) {
    const { logs, total } = await this.repository.getImageAuditLogs(propertyId, action, limit, offset);
    return {
      logs,
      pagination: {
        offset,
        limit,
        total
      }
    };
  }
  async getPersonas() {
    return await this.repository.getPersonas();
  }
  async createPersona(personaData) {
    if (!personaData.name || !personaData.description) {
      throw { status: 400, message: "Name and description are required" };
    }
    return await this.repository.createPersona(personaData);
  }
  async updatePersona(id, updates) {
    if (!id) {
      throw { status: 400, message: "Persona ID is required" };
    }
    return await this.repository.updatePersona(id, updates);
  }
  async deletePersona(id) {
    if (!id) {
      throw { status: 400, message: "Persona ID is required" };
    }
    await this.repository.deletePersona(id);
  }
  async getSettings() {
    return await this.repository.getSettings();
  }
  async updateSettings(updates) {
    if (!updates || Object.keys(updates).length === 0) {
      throw { status: 400, message: "No settings provided to update" };
    }
    return await this.repository.updateSettings(updates);
  }
};

// server/modules/admin/admin.routes.ts
var adminService = new AdminService();
function registerAdminRoutes(app2) {
  app2.get("/api/v2/admin/image-audit-logs", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const propertyId = req.query.propertyId;
      const action = req.query.action;
      const limit = Math.min(parseInt(req.query.limit) || 100, 500);
      const offset = parseInt(req.query.offset) || 0;
      const result = await adminService.getImageAuditLogs(propertyId, action, limit, offset);
      return res.json(success(result, "Image audit logs retrieved"));
    } catch (err) {
      console.error("[ADMIN] Image audit logs error:", err);
      return res.status(500).json(error("Failed to retrieve image audit logs"));
    }
  });
  app2.get("/api/v2/admin/personas", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const personas = await adminService.getPersonas();
      return res.json(success(personas, "Personas retrieved"));
    } catch (err) {
      console.error("[ADMIN] Get personas error:", err);
      return res.status(500).json(error("Failed to retrieve personas"));
    }
  });
  app2.post("/api/v2/admin/personas", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const persona = await adminService.createPersona(req.body);
      return res.json(success(persona, "Persona created"));
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      console.error("[ADMIN] Create persona error:", err);
      return res.status(500).json(error("Failed to create persona"));
    }
  });
  app2.patch("/api/v2/admin/personas/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const persona = await adminService.updatePersona(req.params.id, req.body);
      return res.json(success(persona, "Persona updated"));
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      console.error("[ADMIN] Update persona error:", err);
      return res.status(500).json(error("Failed to update persona"));
    }
  });
  app2.delete("/api/v2/admin/personas/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      await adminService.deletePersona(req.params.id);
      return res.json(success(null, "Persona deleted"));
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      console.error("[ADMIN] Delete persona error:", err);
      return res.status(500).json(error("Failed to delete persona"));
    }
  });
  app2.get("/api/v2/admin/settings", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const settings = await adminService.getSettings();
      return res.json(success(settings, "Settings retrieved"));
    } catch (err) {
      console.error("[ADMIN] Get settings error:", err);
      return res.status(500).json(error("Failed to retrieve settings"));
    }
  });
  app2.patch("/api/v2/admin/settings", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const settings = await adminService.updateSettings(req.body);
      return res.json(success(settings, "Settings updated"));
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      console.error("[ADMIN] Update settings error:", err);
      return res.status(500).json(error("Failed to update settings"));
    }
  });
}

// server/modules/admin/index.ts
function registerAdminModuleRoutes(app2) {
  registerAdminRoutes(app2);
}

// server/modules/auth/auth.repository.ts
init_supabase();
var AuthRepository = class {
  ensureSupabase() {
    if (!supabase) {
      throw new Error("Database connection unavailable");
    }
    return supabase;
  }
  async checkEmailExists(email) {
    const sb = this.ensureSupabase();
    const { data, error: error2 } = await sb.from("users").select("id").eq("email", email.toLowerCase()).maybeSingle();
    if (error2) {
      console.error("[AUTH] Email check error:", error2);
      return false;
    }
    return !!data;
  }
  async createUser(email, password, fullName, phone, role) {
    const sb = this.ensureSupabase();
    const { data, error: error2 } = await sb.auth.admin.createUser({
      email,
      password,
      phone: phone || void 0,
      user_metadata: { full_name: fullName, phone: phone || null, role },
      email_confirm: false
    });
    if (error2) {
      throw error2;
    }
    return data;
  }
  async deleteAuthUser(userId) {
    try {
      const sb = this.ensureSupabase();
      await sb.auth.admin.deleteUser(userId);
    } catch (err) {
      console.error("[AUTH] Failed to delete auth user:", err);
    }
  }
  async storeUserProfile(userId, email, fullName, phone, role) {
    const sb = this.ensureSupabase();
    const { data, error: error2 } = await sb.from("users").upsert({
      id: userId,
      email: email.toLowerCase(),
      full_name: fullName,
      phone: phone || null,
      role
    }, { onConflict: "id" }).select();
    if (error2) {
      throw error2;
    }
    return data;
  }
  async signInWithPassword(email, password) {
    const sb = this.ensureSupabase();
    const { data, error: error2 } = await sb.auth.signInWithPassword({
      email,
      password
    });
    if (error2) {
      throw error2;
    }
    return data;
  }
  async resendVerificationEmail(email) {
    const sb = this.ensureSupabase();
    const { error: error2 } = await sb.auth.resend({
      type: "signup",
      email
    });
    if (error2) {
      throw error2;
    }
  }
  async getUserById(userId) {
    const sb = this.ensureSupabase();
    const { data, error: error2 } = await sb.from("users").select("*").eq("id", userId).single();
    if (error2) throw error2;
    return data;
  }
};

// server/modules/auth/auth.service.ts
var AuthService = class {
  repository;
  constructor() {
    this.repository = new AuthRepository();
  }
  async signup(email, password, fullName, phone, role = "renter") {
    if (!email || !password || !fullName) {
      throw { status: 400, message: "Email, password, and full name are required" };
    }
    const normalizedEmail = email.toLowerCase().trim();
    try {
      const emailExists = await this.repository.checkEmailExists(normalizedEmail);
      if (emailExists) {
        throw { status: 400, message: "An account with this email already exists. Please sign in instead." };
      }
      const authData = await this.repository.createUser(normalizedEmail, password, fullName, phone, role);
      if (!authData.user) {
        throw { status: 500, message: "Failed to create user account. Please try again." };
      }
      try {
        await this.repository.storeUserProfile(authData.user.id, normalizedEmail, fullName, phone, role);
      } catch (profileError) {
        console.error("Failed to save user profile, rolling back auth user:", profileError);
        await this.repository.deleteAuthUser(authData.user.id);
        throw { status: 500, message: "Failed to create user profile. Please try again." };
      }
      return { success: true, user: authData.user };
    } catch (err) {
      if (err.status) {
        throw err;
      }
      if (err.message?.includes("duplicate") || err.message?.includes("already exists")) {
        throw { status: 400, message: "An account with this email already exists. Please sign in instead." };
      }
      console.error("[AUTH] Signup error:", err.message);
      throw { status: 400, message: err.message || "Signup failed. Please try again." };
    }
  }
  async login(email, password) {
    if (!email || !password) {
      throw { status: 400, message: "Email and password are required" };
    }
    try {
      const data = await this.repository.signInWithPassword(email, password);
      return { success: true, session: data.session };
    } catch (err) {
      console.error("[AUTH] Login error:", err.message);
      throw { status: 401, message: "Invalid credentials" };
    }
  }
  async logout() {
    return { success: true };
  }
  async resendVerificationEmail(email) {
    if (!email) {
      throw { status: 400, message: "Email is required" };
    }
    try {
      await this.repository.resendVerificationEmail(email);
      return { success: true, message: "Verification email sent" };
    } catch (err) {
      console.error("[AUTH] Resend verification error:", err.message);
      throw { status: 400, message: err.message || "Failed to resend verification email" };
    }
  }
  async getCurrentUser(userId) {
    if (!userId) {
      throw { status: 400, message: "User ID is required" };
    }
    try {
      const user = await this.repository.getUserById(userId);
      return user;
    } catch (err) {
      console.error("[AUTH] Get user error:", err);
      throw { status: 500, message: "Failed to fetch user" };
    }
  }
};

// server/modules/auth/auth.routes.ts
var authService = new AuthService();
function apiSuccess(data, message) {
  return { success: true, data, message };
}
function apiError(error2) {
  return { success: false, error: error2 };
}
function registerAuthRoutes(app2) {
  app2.post("/api/v2/auth/signup", signupLimiter, async (req, res) => {
    try {
      const validation = signupSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(apiError(validation.error.errors[0].message));
      }
      const { email, password, fullName, phone, role = "renter" } = validation.data;
      const result = await authService.signup(email, password, fullName, phone || null, role);
      return res.json(apiSuccess(result.user, "Account created successfully"));
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || "Signup failed. Please try again.";
      return res.status(status).json(apiError(message));
    }
  });
  app2.post("/api/v2/auth/login", authLimiter, async (req, res) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(apiError(validation.error.errors[0].message));
      }
      const { email, password } = validation.data;
      const result = await authService.login(email, password);
      return res.json(apiSuccess(result.session, "Login successful"));
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || "Invalid credentials";
      return res.status(status).json(apiError(message));
    }
  });
  app2.post("/api/v2/auth/logout", async (_req, res) => {
    try {
      await authService.logout();
      return res.json(apiSuccess(void 0, "Logged out successfully"));
    } catch (err) {
      return res.status(500).json(apiError("Logout failed"));
    }
  });
  app2.post("/api/v2/auth/resend-verification", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.email) {
        return res.status(400).json(apiError("No email address found"));
      }
      await authService.resendVerificationEmail(req.user.email);
      return res.json(apiSuccess(void 0, "Verification email sent"));
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || "Failed to resend verification email";
      return res.status(status).json(apiError(message));
    }
  });
  app2.get("/api/v2/auth/me", authenticateToken, async (req, res) => {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      return res.json(apiSuccess(user, "User fetched successfully"));
    } catch (err) {
      const status = err.status || 500;
      const message = err.message || "Failed to fetch user";
      return res.status(status).json(apiError(message));
    }
  });
}

// server/modules/auth/index.ts
function registerAuthModuleRoutes(app2) {
  registerAuthRoutes(app2);
}

// server/routes.ts
async function registerRoutes(app2) {
  const httpServer = createServer(app2);
  registerSecurityRoutes(app2);
  registerPropertyRoutes(app2);
  registerApplicationRoutes(app2);
  registerPaymentModuleRoutes(app2);
  registerLeaseModuleRoutes(app2);
  registerAdminModuleRoutes(app2);
  registerAuthModuleRoutes(app2);
  const enableLegacyRoutes = process.env.ENABLE_LEGACY_ROUTES === "true";
  app2.get("/api/stats/market-insights", async (req, res) => {
    try {
      const cacheKey = "stats:market-insights";
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(success(cached, "Market insights fetched successfully"));
      }
      const insights = [
        {
          title: "Average Approval Time",
          value: "2.4 days",
          change: "-40% faster",
          description: "Our streamlined process gets you approved quickly",
          icon: "zap"
        },
        {
          title: "Properties Available",
          value: "500+",
          change: "New listings daily",
          description: "Fresh inventory added constantly",
          icon: "target"
        },
        {
          title: "Avg Rent Price (Market)",
          value: "$1,450",
          change: "Stable market",
          description: "Compare with actual listings",
          icon: "trending-up"
        },
        {
          title: "Active Users",
          value: "2,000+",
          change: "Growing monthly",
          description: "Join our community of renters",
          icon: "users"
        }
      ];
      cache.set(cacheKey, insights, CACHE_TTL.PROPERTIES_LIST);
      return res.json(success(insights, "Market insights fetched successfully"));
    } catch (err) {
      console.error("[STATS] Market insights error:", err);
      return res.status(500).json(error("Failed to fetch market insights"));
    }
  });
  app2.patch("/api/properties/:id/verify-address", authenticateToken, requireOwnership("property"), async (req, res) => {
    try {
      const { latitude, longitude, addressVerified } = req.body;
      const updateData = {
        address_verified: addressVerified ?? true,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (latitude !== void 0) updateData.latitude = latitude;
      if (longitude !== void 0) updateData.longitude = longitude;
      const { data, error: error2 } = await supabase.from("properties").update(updateData).eq("id", req.params.id).select();
      if (error2) throw error2;
      cache.invalidate(`property:${req.params.id}`);
      return res.json(success(data[0], "Address verified successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to verify address"));
    }
  });
  app2.post("/api/applications/:applicationId/comments", authenticateToken, async (req, res) => {
    try {
      const { data: application } = await supabase.from("applications").select("user_id, property_id").eq("id", req.params.applicationId).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const { data: property } = await supabase.from("properties").select("owner_id").eq("id", application.property_id).single();
      const isApplicant = application.user_id === req.user.id;
      const isPropertyOwner = property?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isApplicant && !isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { comment, commentType, isInternal } = req.body;
      if (!comment) {
        return res.status(400).json({ error: "Comment is required" });
      }
      const actualIsInternal = isApplicant && !isPropertyOwner && !isAdmin ? false : isInternal ?? true;
      const { data, error: error2 } = await supabase.from("application_comments").insert([{
        application_id: req.params.applicationId,
        user_id: req.user.id,
        comment,
        comment_type: commentType || "note",
        is_internal: actualIsInternal
      }]).select("*, users(id, full_name)");
      if (error2) throw error2;
      return res.json(success(data[0], "Comment added successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to add comment"));
    }
  });
  app2.post("/api/applications/:id/score", authenticateToken, async (req, res) => {
    try {
      const { data: application } = await supabase.from("applications").select("*, properties(owner_id)").eq("id", req.params.id).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const isPropertyOwner = application.properties?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Only property owner can score applications" });
      }
      const { calculateApplicationScore: calculateApplicationScore2 } = await Promise.resolve().then(() => (init_application_service(), application_service_exports2));
      const scoreBreakdown = calculateApplicationScore2({
        personalInfo: application.personal_info,
        employment: application.employment,
        rentalHistory: application.rental_history,
        documents: application.documents,
        documentStatus: application.document_status
      });
      const { data, error: error2 } = await supabase.from("applications").update({
        score: scoreBreakdown.totalScore,
        score_breakdown: scoreBreakdown,
        scored_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", req.params.id).select().single();
      if (error2) throw error2;
      return res.json(success({ application: data, scoreBreakdown }, "Application scored successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to score application"));
    }
  });
  app2.post("/api/applications/:id/verify-payment", authenticateToken, async (req, res) => {
    try {
      const { amount, paymentMethod, receivedAt, internalNote, confirmationChecked } = req.body;
      if (!amount || !paymentMethod || !receivedAt) {
        return res.status(400).json(error("Missing required fields: amount, paymentMethod, receivedAt"));
      }
      if (!confirmationChecked) {
        return res.status(400).json(error("You must confirm the application fee has been received"));
      }
      if (!PAYMENT_VERIFICATION_METHODS.includes(paymentMethod)) {
        return res.status(400).json(error("Invalid payment method"));
      }
      const { data: application, error: appError } = await supabase.from("applications").select(`
          *,
          properties:property_id(id, owner_id, title, address, listing_agent_id),
          users:user_id(id, full_name, email)
        `).eq("id", req.params.id).single();
      if (appError || !application) {
        return res.status(404).json(error("Application not found"));
      }
      if (application.manual_payment_verified || application.payment_status === "paid" || application.payment_status === "manually_verified") {
        return res.status(400).json(error("Payment has already been verified for this application"));
      }
      const isOwner = application.properties?.owner_id === req.user.id;
      const isAgent = application.properties?.listing_agent_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isOwner && !isAgent && !isAdmin) {
        return res.status(403).json(error("Not authorized to verify payments for this application"));
      }
      const referenceId = `MV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const { data: verification, error: verifyError } = await supabase.from("payment_verifications").insert([{
        application_id: req.params.id,
        verified_by: req.user.id,
        amount,
        payment_method: paymentMethod,
        received_at: receivedAt,
        reference_id: referenceId,
        internal_note: internalNote || null,
        confirmation_checked: true,
        previous_payment_status: application.payment_status
      }]).select().single();
      if (verifyError) throw verifyError;
      const statusHistoryEntry = {
        status: "payment_verified",
        changedAt: (/* @__PURE__ */ new Date()).toISOString(),
        changedBy: req.user.id,
        reason: `Manual payment verified via ${paymentMethod}. Amount: $${amount}`
      };
      const existingHistory = application.status_history || [];
      const { data: updatedApp, error: updateError } = await supabase.from("applications").update({
        payment_status: "manually_verified",
        status: "payment_verified",
        previous_status: application.status,
        status_history: [...existingHistory, statusHistoryEntry],
        manual_payment_verified: true,
        manual_payment_verified_at: (/* @__PURE__ */ new Date()).toISOString(),
        manual_payment_verified_by: req.user.id,
        manual_payment_amount: amount,
        manual_payment_method: paymentMethod,
        manual_payment_received_at: receivedAt,
        manual_payment_note: internalNote || null,
        manual_payment_reference_id: referenceId,
        payment_paid_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", req.params.id).select().single();
      if (updateError) throw updateError;
      await logAuditEvent({
        userId: req.user.id,
        action: "payment_verify_manual",
        resourceType: "application",
        resourceId: req.params.id,
        metadata: {
          previousPaymentStatus: application.payment_status,
          newPaymentStatus: "manually_verified",
          amount,
          paymentMethod,
          referenceId
        },
        req
      });
      return res.json(success({
        application: updatedApp,
        verification,
        referenceId
      }, "Payment verified successfully"));
    } catch (err) {
      console.error("[PAYMENT] Verify error:", err);
      return res.status(500).json(error("Failed to verify payment"));
    }
  });
  app2.get("/api/applications/:applicationId/payments", authenticateToken, async (req, res) => {
    try {
      const applicationId = req.params.applicationId;
      const { data: application } = await supabase.from("applications").select("user_id, properties(owner_id)").eq("id", applicationId).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const isTenant = application.user_id === req.user.id;
      const isLandlord = application.properties?.[0]?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isTenant && !isLandlord && !isAdmin) {
        return res.status(403).json({ error: "Not authorized to view payments" });
      }
      const { data: lease } = await supabase.from("leases").select("id").eq("application_id", applicationId).single();
      if (!lease) {
        return res.json(success([], "No lease found for this application"));
      }
      const { data: payments2, error: error2 } = await supabase.from("payments").select("*, verified_by_user:users!payments_verified_by_fkey(full_name)").eq("lease_id", lease.id).order("created_at", { ascending: false });
      if (error2) throw error2;
      const now = /* @__PURE__ */ new Date();
      const enrichedPayments = (payments2 || []).map((p) => {
        const dueDate = new Date(p.due_date);
        const isOverdue = p.status === "pending" && dueDate < now;
        return {
          ...p,
          status: isOverdue ? "overdue" : p.status
        };
      });
      return res.json(success(enrichedPayments, "Payments retrieved successfully"));
    } catch (err) {
      console.error("[PAYMENTS] Get error:", err);
      return res.status(500).json(error("Failed to retrieve payments"));
    }
  });
  app2.get("/api/reviews/property/:propertyId", async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("reviews").select("*, users(id, full_name, profile_image)").eq("property_id", req.params.propertyId).order("created_at", { ascending: false });
      if (error2) throw error2;
      return res.json(success(data, "Reviews fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch reviews"));
    }
  });
  console.log("[ROUTES] Critical legacy endpoints enabled, all others disabled.");
  if (!enableLegacyRoutes) {
    console.log("[ROUTES] Full legacy routes disabled. Only module routes (server/modules/*) and critical legacy endpoints are active.");
    console.log("[ROUTES] Set ENABLE_LEGACY_ROUTES=true to re-enable all legacy routes from server/routes.ts");
    return httpServer;
  }
  console.log("[ROUTES] Legacy routes enabled. Both module routes and legacy routes are active.");
  app2.post("/api/auth/signup", signupLimiter, async (req, res) => {
    try {
      const validation = signupSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ success: false, error: validation.error.errors[0].message });
      }
      const { email, password, fullName, phone, role = "renter" } = validation.data;
      const { data, error: error2 } = await supabase.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password,
        phone: phone || void 0,
        user_metadata: { full_name: fullName, phone: phone || null, role },
        email_confirm: false
      });
      if (error2) {
        if (error2.message?.includes("duplicate") || error2.message?.includes("already exists")) {
          return res.status(400).json({ success: false, error: "An account with this email already exists. Please sign in instead." });
        }
        console.error("[AUTH] Signup error:", error2.message);
        return res.status(400).json({ success: false, error: error2.message || "Signup failed. Please try again." });
      }
      if (data.user) {
        try {
          await supabase.from("users").upsert({
            id: data.user.id,
            email: email.toLowerCase().trim(),
            full_name: fullName,
            phone: phone || null,
            role
          }, { onConflict: "id" });
        } catch (profileError) {
          console.error("Failed to save user profile:", profileError);
        }
      }
      res.json({ success: true, data: data.user });
    } catch (err) {
      console.error("[AUTH] Signup exception:", err);
      res.status(500).json({ success: false, error: err.message || "Signup failed. Please try again." });
    }
  });
  app2.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const { email, password } = validation.data;
      const { data, error: error2 } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error2) {
        console.error("[AUTH] Login error:", error2.message);
        return res.status(401).json({ error: "Invalid credentials" });
      }
      res.json({ success: true, session: data.session });
    } catch (err) {
      console.error("[AUTH] Login exception:", err);
      res.status(500).json({ error: "Invalid request" });
    }
  });
  app2.post("/api/auth/logout", async (req, res) => {
    try {
      res.json({ success: true });
    } catch (err) {
      console.error("[AUTH] Logout exception:", err);
      res.status(500).json({ error: "Invalid request" });
    }
  });
  app2.post("/api/auth/resend-verification", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.email) {
        return res.status(400).json({ error: "No email address found" });
      }
      const { error: error2 } = await supabase.auth.resend({
        type: "signup",
        email: req.user.email
      });
      if (error2) {
        console.error("[AUTH] Resend verification error:", error2.message);
        return res.status(400).json({ error: error2.message || "Failed to resend verification email" });
      }
      res.json({ success: true, message: "Verification email sent" });
    } catch (err) {
      console.error("[AUTH] Resend verification exception:", err);
      res.status(500).json({ error: "Failed to resend verification email" });
    }
  });
  app2.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("users").select("*").eq("id", req.user.id).single();
      if (error2) throw error2;
      return res.json(success(data, "User fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch user"));
    }
  });
  app2.get("/api/stats/trust-indicators", async (req, res) => {
    try {
      const cacheKey = "stats:trust-indicators";
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(success(cached, "Trust indicators fetched successfully"));
      }
      const { data: properties2, error: propertiesError } = await supabase.from("properties").select("id, status").eq("status", "active");
      const { data: applications2, error: applicationsError } = await supabase.from("applications").select("id, status").eq("status", "approved");
      const { data: users2, error: usersError } = await supabase.from("users").select("id").eq("role", "renter");
      if (propertiesError || applicationsError || usersError) {
        throw propertiesError || applicationsError || usersError;
      }
      const indicators = [
        {
          number: `${Math.max(500, properties2?.length || 500)}+`,
          label: "Properties Listed",
          icon: "home",
          description: "Verified rental homes across the nation"
        },
        {
          number: `${Math.max(2e3, (users2?.length || 0) * 2)}+`,
          label: "Happy Renters",
          icon: "users",
          description: "Successfully placed in their dream homes"
        },
        {
          number: "98%",
          label: "Landlord Approval Rate",
          icon: "award",
          description: "Industry-leading satisfaction score"
        },
        {
          number: `${Math.max(1e4, (applications2?.length || 0) * 5)}+`,
          label: "Successful Placements",
          icon: "trending-up",
          description: "Completed moves with zero disputes"
        }
      ];
      cache.set(cacheKey, indicators, CACHE_TTL.PROPERTIES_LIST);
      return res.json(success(indicators, "Trust indicators fetched successfully"));
    } catch (err) {
      console.error("[STATS] Trust indicators error:", err);
      return res.status(500).json(error("Failed to fetch trust indicators"));
    }
  });
  app2.get("/api/stats/market-insights", async (req, res) => {
    try {
      const cacheKey = "stats:market-insights";
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(success(cached, "Market insights fetched successfully"));
      }
      const insights = [
        {
          title: "Average Approval Time",
          value: "2.4 days",
          change: "-40% faster",
          description: "Our streamlined process gets you approved quickly",
          icon: "zap"
        },
        {
          title: "Properties Available",
          value: "500+",
          change: "New listings daily",
          description: "Fresh inventory added constantly",
          icon: "target"
        },
        {
          title: "Avg Rent Price (Market)",
          value: "$1,450",
          change: "Stable market",
          description: "Compare with actual listings",
          icon: "trending-up"
        },
        {
          title: "Active Users",
          value: "2,000+",
          change: "Growing monthly",
          description: "Join our community of renters",
          icon: "users"
        }
      ];
      cache.set(cacheKey, insights, CACHE_TTL.PROPERTIES_LIST);
      return res.json(success(insights, "Market insights fetched successfully"));
    } catch (err) {
      console.error("[STATS] Market insights error:", err);
      return res.status(500).json(error("Failed to fetch market insights"));
    }
  });
  app2.get("/api/properties", async (req, res) => {
    try {
      const { propertyType, city, minPrice, maxPrice, status, page = "1", limit = "20" } = req.query;
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
      const offset = (pageNum - 1) * limitNum;
      const cacheKey = `properties:${propertyType || ""}:${city || ""}:${minPrice || ""}:${maxPrice || ""}:${status || "active"}:${pageNum}:${limitNum}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(success(cached, "Properties fetched successfully"));
      }
      let query = supabase.from("properties").select("*", { count: "exact" });
      if (propertyType) query = query.eq("property_type", propertyType);
      if (city) query = query.ilike("city", `%${city}%`);
      if (minPrice) query = query.gte("price", minPrice);
      if (maxPrice) query = query.lte("price", maxPrice);
      if (status) {
        query = query.eq("status", status);
      } else {
        query = query.eq("status", "active");
      }
      query = query.order("created_at", { ascending: false }).range(offset, offset + limitNum - 1);
      const { data, error: error2, count } = await query;
      if (error2) throw error2;
      const totalPages = Math.ceil((count || 0) / limitNum);
      const result = {
        properties: data,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      };
      cache.set(cacheKey, result, CACHE_TTL.PROPERTIES_LIST);
      return res.json(success(result, "Properties fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch properties"));
    }
  });
  app2.get("/api/properties/:id", async (req, res) => {
    try {
      const cacheKey = `property:${req.params.id}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(success(cached, "Property fetched successfully"));
      }
      const { data, error: error2 } = await supabase.from("properties").select("*").eq("id", req.params.id).single();
      if (error2) throw error2;
      cache.set(cacheKey, data, CACHE_TTL.PROPERTY_DETAIL);
      return res.json(success(data, "Property fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch property"));
    }
  });
  app2.post("/api/properties", authenticateToken, async (req, res) => {
    try {
      const validation = insertPropertySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const propertyData = {
        ...validation.data,
        owner_id: req.user.id
      };
      const { data, error: error2 } = await supabase.from("properties").insert([propertyData]).select();
      if (error2) throw error2;
      cache.invalidate("properties:");
      return res.json(success(data[0], "Property created successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to create property"));
    }
  });
  app2.patch("/api/properties/:id", authenticateToken, requireOwnership("property"), async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("properties").update({ ...req.body, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", req.params.id).select();
      if (error2) throw error2;
      cache.invalidate(`property:${req.params.id}`);
      cache.invalidate("properties:");
      invalidateOwnershipCache("property", req.params.id);
      return res.json(success(data[0], "Property updated successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to update property"));
    }
  });
  app2.delete("/api/properties/:id", authenticateToken, requireOwnership("property"), async (req, res) => {
    try {
      const { error: error2 } = await supabase.from("properties").delete().eq("id", req.params.id);
      if (error2) throw error2;
      cache.invalidate(`property:${req.params.id}`);
      cache.invalidate("properties:");
      invalidateOwnershipCache("property", req.params.id);
      return res.json(success(null, "Property deleted successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to delete property"));
    }
  });
  app2.get("/api/properties/user/:userId", authenticateToken, async (req, res) => {
    try {
      if (req.params.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { data, error: error2 } = await supabase.from("properties").select("*").eq("owner_id", req.params.userId);
      if (error2) throw error2;
      return res.json(success(data, "User properties fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch user properties"));
    }
  });
  app2.patch("/api/properties/:id/status", authenticateToken, requireOwnership("property"), async (req, res) => {
    try {
      const { listingStatus, visibility } = req.body;
      const updateData = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
      if (listingStatus) {
        updateData.listing_status = listingStatus;
        if (listingStatus === "available") {
          updateData.listed_at = (/* @__PURE__ */ new Date()).toISOString();
        }
      }
      if (visibility) {
        updateData.visibility = visibility;
      }
      const { data, error: error2 } = await supabase.from("properties").update(updateData).eq("id", req.params.id).select();
      if (error2) throw error2;
      cache.invalidate(`property:${req.params.id}`);
      cache.invalidate("properties:");
      return res.json(success(data[0], "Property status updated successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to update property status"));
    }
  });
  app2.patch("/api/properties/:id/expiration", authenticateToken, requireOwnership("property"), async (req, res) => {
    try {
      const { expirationDays, autoUnpublish } = req.body;
      const updateData = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
      if (expirationDays !== void 0) {
        updateData.expiration_days = expirationDays;
        const baseDate = /* @__PURE__ */ new Date();
        updateData.expires_at = new Date(baseDate.getTime() + expirationDays * 24 * 60 * 60 * 1e3).toISOString();
      }
      if (autoUnpublish !== void 0) {
        updateData.auto_unpublish = autoUnpublish;
      }
      const { data, error: error2 } = await supabase.from("properties").update(updateData).eq("id", req.params.id).select();
      if (error2) throw error2;
      cache.invalidate(`property:${req.params.id}`);
      return res.json(success(data[0], "Expiration settings updated successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to update expiration settings"));
    }
  });
  app2.patch("/api/properties/:id/price", authenticateToken, requireOwnership("property"), async (req, res) => {
    try {
      const { price } = req.body;
      if (!price) {
        return res.status(400).json(error("Price is required"));
      }
      const { data: currentProperty, error: fetchError } = await supabase.from("properties").select("price, price_history").eq("id", req.params.id).single();
      if (fetchError) throw fetchError;
      const priceHistory = currentProperty.price_history || [];
      priceHistory.push({
        price: currentProperty.price,
        changedAt: (/* @__PURE__ */ new Date()).toISOString(),
        changedBy: req.user.id
      });
      const { data, error: error2 } = await supabase.from("properties").update({
        price,
        price_history: priceHistory,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", req.params.id).select();
      if (error2) throw error2;
      cache.invalidate(`property:${req.params.id}`);
      cache.invalidate("properties:");
      return res.json(success(data[0], "Price updated successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to update price"));
    }
  });
  app2.get("/api/properties/:id/analytics", authenticateToken, requireOwnership("property"), async (req, res) => {
    try {
      const { data: property, error: propertyError } = await supabase.from("properties").select("view_count, save_count, application_count, listed_at, price_history").eq("id", req.params.id).single();
      if (propertyError) throw propertyError;
      const { data: applications2, error: appError } = await supabase.from("applications").select("status, created_at").eq("property_id", req.params.id);
      if (appError) throw appError;
      const analytics = {
        views: property.view_count || 0,
        saves: property.save_count || 0,
        applicationCount: applications2?.length || 0,
        applicationsByStatus: applications2?.reduce((acc, app3) => {
          acc[app3.status] = (acc[app3.status] || 0) + 1;
          return acc;
        }, {}),
        listedAt: property.listed_at,
        priceHistory: property.price_history || []
      };
      return res.json(success(analytics, "Property analytics fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch property analytics"));
    }
  });
  app2.post("/api/properties/:id/view", viewLimiter, async (req, res) => {
    try {
      const { error: error2 } = await supabase.rpc("increment_property_views", { property_id: req.params.id });
      if (error2) {
        const { data: property } = await supabase.from("properties").select("view_count").eq("id", req.params.id).single();
        await supabase.from("properties").update({ view_count: (property?.view_count || 0) + 1 }).eq("id", req.params.id);
      }
      return res.json(success(null, "View recorded"));
    } catch (err) {
      return res.status(500).json(error("Failed to record view"));
    }
  });
  app2.get("/api/properties/:id/notes", authenticateToken, requireOwnership("property"), async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("property_notes").select("*, user:users(full_name, email)").eq("property_id", req.params.id).order("is_pinned", { ascending: false }).order("created_at", { ascending: false });
      if (error2) throw error2;
      return res.json(success(data, "Notes fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch notes"));
    }
  });
  app2.post("/api/properties/:id/notes", authenticateToken, requireOwnership("property"), async (req, res) => {
    try {
      const { content, noteType = "general", isPinned = false } = req.body;
      if (!content) {
        return res.status(400).json(error("Note content is required"));
      }
      const { data, error: error2 } = await supabase.from("property_notes").insert({
        property_id: req.params.id,
        user_id: req.user.id,
        content,
        note_type: noteType,
        is_pinned: isPinned
      }).select("*, user:users(full_name, email)");
      if (error2) throw error2;
      return res.json(success(data[0], "Note added successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to add note"));
    }
  });
  app2.patch("/api/properties/:propertyId/notes/:noteId", authenticateToken, async (req, res) => {
    try {
      const { content, isPinned } = req.body;
      const { data: note, error: noteError } = await supabase.from("property_notes").select("user_id").eq("id", req.params.noteId).single();
      if (noteError || !note) {
        return res.status(404).json(error("Note not found"));
      }
      if (note.user_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json(error("Not authorized to edit this note"));
      }
      const updateData = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
      if (content !== void 0) updateData.content = content;
      if (isPinned !== void 0) updateData.is_pinned = isPinned;
      const { data, error: error2 } = await supabase.from("property_notes").update(updateData).eq("id", req.params.noteId).select("*, user:users(full_name, email)");
      if (error2) throw error2;
      return res.json(success(data[0], "Note updated successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to update note"));
    }
  });
  app2.delete("/api/properties/:propertyId/notes/:noteId", authenticateToken, async (req, res) => {
    try {
      const { data: note, error: noteError } = await supabase.from("property_notes").select("user_id").eq("id", req.params.noteId).single();
      if (noteError || !note) {
        return res.status(404).json(error("Note not found"));
      }
      if (note.user_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json(error("Not authorized to delete this note"));
      }
      const { error: error2 } = await supabase.from("property_notes").delete().eq("id", req.params.noteId);
      if (error2) throw error2;
      return res.json(success(null, "Note deleted successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to delete note"));
    }
  });
  app2.get("/api/property-templates", authenticateToken, async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("property_templates").select("*").eq("user_id", req.user.id).order("created_at", { ascending: false });
      if (error2) throw error2;
      return res.json(success(data, "Templates fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch templates"));
    }
  });
  app2.post("/api/property-templates", authenticateToken, async (req, res) => {
    try {
      const { name, description, templateData } = req.body;
      if (!name) {
        return res.status(400).json(error("Template name is required"));
      }
      const { data, error: error2 } = await supabase.from("property_templates").insert({
        user_id: req.user.id,
        name,
        description: description || null,
        template_data: templateData || {}
      }).select();
      if (error2) throw error2;
      return res.json(success(data[0], "Template created successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to create template"));
    }
  });
  app2.patch("/api/property-templates/:id", authenticateToken, async (req, res) => {
    try {
      const { data: template, error: templateError } = await supabase.from("property_templates").select("user_id").eq("id", req.params.id).single();
      if (templateError || !template) {
        return res.status(404).json(error("Template not found"));
      }
      if (template.user_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json(error("Not authorized to edit this template"));
      }
      const { name, description, templateData } = req.body;
      const updateData = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
      if (name !== void 0) updateData.name = name;
      if (description !== void 0) updateData.description = description;
      if (templateData !== void 0) updateData.template_data = templateData;
      const { data, error: error2 } = await supabase.from("property_templates").update(updateData).eq("id", req.params.id).select();
      if (error2) throw error2;
      return res.json(success(data[0], "Template updated successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to update template"));
    }
  });
  app2.delete("/api/property-templates/:id", authenticateToken, async (req, res) => {
    try {
      const { data: template, error: templateError } = await supabase.from("property_templates").select("user_id").eq("id", req.params.id).single();
      if (templateError || !template) {
        return res.status(404).json(error("Template not found"));
      }
      if (template.user_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json(error("Not authorized to delete this template"));
      }
      const { error: error2 } = await supabase.from("property_templates").delete().eq("id", req.params.id);
      if (error2) throw error2;
      return res.json(success(null, "Template deleted successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to delete template"));
    }
  });
  app2.post("/api/geocode", async (req, res) => {
    try {
      const { address, city, state, zipCode } = req.body;
      if (!address) {
        return res.status(400).json(error("Address is required"));
      }
      const fullAddress = [address, city, state, zipCode].filter(Boolean).join(", ");
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`,
        {
          headers: {
            "User-Agent": "ChoiceProperties/1.0"
          }
        }
      );
      if (!response.ok) {
        throw new Error("Failed to geocode address");
      }
      const results = await response.json();
      if (!results || results.length === 0) {
        return res.json(success({
          verified: false,
          message: "Address could not be verified"
        }, "Address verification complete"));
      }
      const result = results[0];
      return res.json(success({
        verified: true,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        displayName: result.display_name,
        message: "Address verified successfully"
      }, "Address verified successfully"));
    } catch (err) {
      console.error("Geocoding error:", err);
      return res.status(500).json(error("Failed to verify address"));
    }
  });
  app2.patch("/api/properties/:id/verify-address", authenticateToken, requireOwnership("property"), async (req, res) => {
    try {
      const { latitude, longitude, addressVerified } = req.body;
      const updateData = {
        address_verified: addressVerified ?? true,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (latitude !== void 0) updateData.latitude = latitude;
      if (longitude !== void 0) updateData.longitude = longitude;
      const { data, error: error2 } = await supabase.from("properties").update(updateData).eq("id", req.params.id).select();
      if (error2) throw error2;
      cache.invalidate(`property:${req.params.id}`);
      return res.json(success(data[0], "Address verified successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to verify address"));
    }
  });
  app2.patch("/api/properties/:id/schedule-publish", authenticateToken, requireOwnership("property"), async (req, res) => {
    try {
      const { scheduledPublishAt } = req.body;
      const updateData = {
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (scheduledPublishAt) {
        const scheduledDate = new Date(scheduledPublishAt);
        if (scheduledDate <= /* @__PURE__ */ new Date()) {
          return res.status(400).json(error("Scheduled date must be in the future"));
        }
        updateData.scheduled_publish_at = scheduledDate.toISOString();
        updateData.listing_status = "coming_soon";
      } else {
        updateData.scheduled_publish_at = null;
      }
      const { data, error: error2 } = await supabase.from("properties").update(updateData).eq("id", req.params.id).select();
      if (error2) throw error2;
      cache.invalidate(`property:${req.params.id}`);
      cache.invalidate("properties:");
      return res.json(success(data[0], scheduledPublishAt ? "Property scheduled for publishing" : "Scheduled publish cleared"));
    } catch (err) {
      return res.status(500).json(error("Failed to schedule publish"));
    }
  });
  app2.post("/api/payments/process", authenticateToken, async (req, res) => {
    try {
      const { applicationId, amount, cardToken } = req.body;
      if (!applicationId || !amount) {
        return res.status(400).json({ error: "Missing applicationId or amount" });
      }
      const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockTransactionId = `txn_${Date.now()}`;
      await new Promise((resolve) => setTimeout(resolve, 100));
      return res.json(success({
        paymentId: mockPaymentId,
        transactionId: mockTransactionId,
        amount,
        status: "completed",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        message: "[MOCK PAYMENT] In production, this would process with real payment provider"
      }, "Payment processed successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to process payment"));
    }
  });
  app2.post("/api/applications/:id/payment-attempt", authenticateToken, async (req, res) => {
    try {
      const { referenceId, status, amount, errorMessage } = req.body;
      if (!referenceId || !status || !amount) {
        return res.status(400).json({ error: "Missing required fields: referenceId, status, amount" });
      }
      const { data: application, error: appError } = await supabase.from("applications").select("id, user_id, payment_attempts, payment_status").eq("id", req.params.id).single();
      if (appError || !application) {
        return res.status(404).json({ error: "Application not found" });
      }
      if (application.user_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      const newAttempt = {
        referenceId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        status,
        amount,
        errorMessage: errorMessage || null
      };
      const existingAttempts = application.payment_attempts || [];
      const updatedAttempts = [...existingAttempts, newAttempt];
      let newPaymentStatus = application.payment_status;
      if (status === "success") {
        newPaymentStatus = "paid";
      } else if (status === "failed" && application.payment_status !== "paid") {
        newPaymentStatus = "failed";
      }
      const updateData = {
        payment_attempts: updatedAttempts,
        payment_status: newPaymentStatus,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (status === "success") {
        updateData.payment_paid_at = (/* @__PURE__ */ new Date()).toISOString();
      }
      const { data, error: error2 } = await supabase.from("applications").update(updateData).eq("id", req.params.id).select();
      if (error2) throw error2;
      return res.json(success(data[0], "Payment attempt recorded"));
    } catch (err) {
      console.error("[PAYMENT] Record attempt error:", err);
      return res.status(500).json(error("Failed to record payment attempt"));
    }
  });
  app2.post("/api/applications/:id/verify-payment", authenticateToken, async (req, res) => {
    try {
      const { amount, paymentMethod, receivedAt, internalNote, confirmationChecked } = req.body;
      if (!amount || !paymentMethod || !receivedAt) {
        return res.status(400).json(error("Missing required fields: amount, paymentMethod, receivedAt"));
      }
      if (!confirmationChecked) {
        return res.status(400).json(error("You must confirm the application fee has been received"));
      }
      if (!PAYMENT_VERIFICATION_METHODS.includes(paymentMethod)) {
        return res.status(400).json(error("Invalid payment method"));
      }
      const { data: application, error: appError } = await supabase.from("applications").select(`
          *,
          properties:property_id(id, owner_id, title, address, listing_agent_id),
          users:user_id(id, full_name, email)
        `).eq("id", req.params.id).single();
      if (appError || !application) {
        return res.status(404).json(error("Application not found"));
      }
      if (application.manual_payment_verified || application.payment_status === "paid" || application.payment_status === "manually_verified") {
        return res.status(400).json(error("Payment has already been verified for this application"));
      }
      const isOwner = application.properties?.owner_id === req.user.id;
      const isAgent = application.properties?.listing_agent_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isOwner && !isAgent && !isAdmin) {
        return res.status(403).json(error("Not authorized to verify payments for this application"));
      }
      const referenceId = `MV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const { data: verification, error: verifyError } = await supabase.from("payment_verifications").insert([{
        application_id: req.params.id,
        verified_by: req.user.id,
        amount,
        payment_method: paymentMethod,
        received_at: receivedAt,
        reference_id: referenceId,
        internal_note: internalNote || null,
        confirmation_checked: true,
        previous_payment_status: application.payment_status
      }]).select().single();
      if (verifyError) throw verifyError;
      const statusHistoryEntry = {
        status: "payment_verified",
        changedAt: (/* @__PURE__ */ new Date()).toISOString(),
        changedBy: req.user.id,
        reason: `Manual payment verified via ${paymentMethod}. Amount: $${amount}`
      };
      const existingHistory = application.status_history || [];
      const { data: updatedApp, error: updateError } = await supabase.from("applications").update({
        payment_status: "manually_verified",
        status: "payment_verified",
        previous_status: application.status,
        status_history: [...existingHistory, statusHistoryEntry],
        manual_payment_verified: true,
        manual_payment_verified_at: (/* @__PURE__ */ new Date()).toISOString(),
        manual_payment_verified_by: req.user.id,
        manual_payment_amount: amount,
        manual_payment_method: paymentMethod,
        manual_payment_received_at: receivedAt,
        manual_payment_note: internalNote || null,
        manual_payment_reference_id: referenceId,
        payment_paid_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", req.params.id).select().single();
      if (updateError) throw updateError;
      await logAuditEvent({
        userId: req.user.id,
        action: "payment_verify_manual",
        resourceType: "application",
        resourceId: req.params.id,
        metadata: {
          previousPaymentStatus: application.payment_status,
          newPaymentStatus: "manually_verified",
          amount,
          paymentMethod,
          referenceId
        },
        req
      });
      if (application.conversation_id) {
        await supabase.from("messages").insert([{
          conversation_id: application.conversation_id,
          sender_id: req.user.id,
          content: `System: Application fee verified ($${amount} via ${paymentMethod}). Application moved to review stage. Reference: ${referenceId}`,
          message_type: "system"
        }]);
      }
      await supabase.from("application_notifications").insert([{
        application_id: req.params.id,
        user_id: application.user_id,
        notification_type: "payment_verified",
        channel: "in_app",
        subject: "Application Fee Verified",
        content: `Your application fee of $${amount} has been verified. Your application is now under review.`,
        status: "pending"
      }]);
      return res.json(success({
        application: updatedApp,
        verification,
        referenceId
      }, "Payment verified successfully. Application moved to review stage."));
    } catch (err) {
      console.error("[PAYMENT] Manual verification error:", err);
      return res.status(500).json(error("Failed to verify payment"));
    }
  });
  app2.get("/api/applications/:id/payment-verifications", authenticateToken, async (req, res) => {
    try {
      const { data: application, error: appError } = await supabase.from("applications").select(`*, properties:property_id(owner_id, listing_agent_id)`).eq("id", req.params.id).single();
      if (appError || !application) {
        return res.status(404).json(error("Application not found"));
      }
      const isOwner = application.properties?.owner_id === req.user.id;
      const isAgent = application.properties?.listing_agent_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      const isApplicant = application.user_id === req.user.id;
      if (!isOwner && !isAgent && !isAdmin && !isApplicant) {
        return res.status(403).json(error("Not authorized to view payment verifications"));
      }
      const { data: verifications, error: error2 } = await supabase.from("payment_verifications").select(`*, users:verified_by(id, full_name, email)`).eq("application_id", req.params.id).order("created_at", { ascending: false });
      if (error2) throw error2;
      const sanitizedVerifications = verifications?.map((v) => {
        if (isApplicant && !isOwner && !isAgent && !isAdmin) {
          return { ...v, internal_note: null };
        }
        return v;
      });
      return res.json(success({
        verifications: sanitizedVerifications || [],
        paymentAttempts: application.payment_attempts || [],
        currentStatus: application.payment_status,
        manuallyVerified: application.manual_payment_verified
      }, "Payment history fetched successfully"));
    } catch (err) {
      console.error("[PAYMENT] Get verifications error:", err);
      return res.status(500).json(error("Failed to fetch payment verifications"));
    }
  });
  app2.post("/api/applications/:id/review-action", authenticateToken, async (req, res) => {
    try {
      const { action, reason, conditionalRequirements, dueDate } = req.body;
      const validActions = ["approve", "reject", "conditional_approve", "request_info", "submit_for_review"];
      if (!validActions.includes(action)) {
        return res.status(400).json(error("Invalid action. Must be: approve, reject, conditional_approve, request_info, or submit_for_review"));
      }
      const { data: application, error: appError } = await supabase.from("applications").select(`
          *,
          properties:property_id(id, owner_id, title, address, listing_agent_id),
          users:user_id(id, full_name, email)
        `).eq("id", req.params.id).single();
      if (appError || !application) {
        return res.status(404).json(error("Application not found"));
      }
      const isOwner = application.properties?.owner_id === req.user.id;
      const isAgent = application.properties?.listing_agent_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      const isApplicant = application.user_id === req.user.id;
      if (action === "submit_for_review") {
        if (!isApplicant && !isAdmin) {
          return res.status(403).json(error("Only the applicant can submit for review"));
        }
        if (application.payment_status !== "manually_verified" && application.payment_status !== "paid") {
          return res.status(400).json(error("Payment must be verified before submitting for review"));
        }
      } else {
        if (!isOwner && !isAgent && !isAdmin) {
          return res.status(403).json(error("Not authorized to perform this action"));
        }
      }
      let newStatus = application.status;
      let updateData = {
        updated_at: (/* @__PURE__ */ new Date()).toISOString(),
        reviewed_by: req.user.id,
        reviewed_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      switch (action) {
        case "submit_for_review":
          if (application.status !== "payment_verified" && application.status !== "draft") {
            return res.status(400).json(error("Application cannot be submitted for review in its current state"));
          }
          newStatus = "submitted";
          break;
        case "approve":
          if (!["submitted", "under_review", "info_requested", "conditional_approval"].includes(application.status)) {
            return res.status(400).json(error("Application cannot be approved in its current state"));
          }
          newStatus = "approved";
          updateData.lease_status = "preparing";
          break;
        case "reject":
          if (!reason) {
            return res.status(400).json(error("Rejection reason is required"));
          }
          if (!["submitted", "under_review", "info_requested"].includes(application.status)) {
            return res.status(400).json(error("Application cannot be rejected in its current state"));
          }
          newStatus = "rejected";
          updateData.rejection_reason = reason;
          updateData.rejection_details = { explanation: reason, appealable: true, categories: [] };
          break;
        case "conditional_approve":
          if (!conditionalRequirements) {
            return res.status(400).json(error("Conditional requirements are required"));
          }
          if (!["submitted", "under_review", "info_requested"].includes(application.status)) {
            return res.status(400).json(error("Application cannot be conditionally approved in its current state"));
          }
          newStatus = "conditional_approval";
          updateData.conditional_approval_reason = typeof conditionalRequirements === "string" ? conditionalRequirements : JSON.stringify(conditionalRequirements);
          updateData.conditional_approval_at = (/* @__PURE__ */ new Date()).toISOString();
          updateData.conditional_approval_by = req.user.id;
          if (Array.isArray(conditionalRequirements)) {
            updateData.conditional_requirements = conditionalRequirements.map((req2, index) => ({
              id: `req-${Date.now()}-${index}`,
              type: req2.type || "information",
              description: req2.description || req2,
              required: req2.required !== false,
              satisfied: false
            }));
          }
          if (dueDate) {
            updateData.conditional_approval_due_date = dueDate;
          }
          break;
        case "request_info":
          if (!reason) {
            return res.status(400).json(error("Information request reason is required"));
          }
          if (!["submitted", "under_review"].includes(application.status)) {
            return res.status(400).json(error("Cannot request info in the current state"));
          }
          newStatus = "info_requested";
          updateData.info_requested_reason = reason;
          updateData.info_requested_at = (/* @__PURE__ */ new Date()).toISOString();
          updateData.info_requested_by = req.user.id;
          if (dueDate) {
            updateData.info_requested_due_date = dueDate;
          }
          break;
      }
      const statusHistoryEntry = {
        status: newStatus,
        changedAt: (/* @__PURE__ */ new Date()).toISOString(),
        changedBy: req.user.id,
        reason: reason || `Application ${action.replace("_", " ")}`
      };
      const existingHistory = application.status_history || [];
      updateData.status = newStatus;
      updateData.previous_status = application.status;
      updateData.status_history = [...existingHistory, statusHistoryEntry];
      const { data: updatedApp, error: updateError } = await supabase.from("applications").update(updateData).eq("id", req.params.id).select().single();
      if (updateError) throw updateError;
      await logAuditEvent({
        userId: req.user.id,
        action: `application_${action}`,
        resourceType: "application",
        resourceId: req.params.id,
        metadata: {
          previousStatus: application.status,
          newStatus,
          reason
        },
        req
      });
      if (application.conversation_id) {
        let messageContent = "";
        switch (action) {
          case "submit_for_review":
            messageContent = "System: Application has been submitted for review.";
            break;
          case "approve":
            messageContent = "System: Congratulations! Your application has been approved.";
            break;
          case "reject":
            messageContent = `System: Your application has been declined. Reason: ${reason}`;
            break;
          case "conditional_approve":
            messageContent = `System: Your application has been conditionally approved. Additional requirements: ${conditionalRequirements}`;
            break;
          case "request_info":
            messageContent = `System: Additional information has been requested: ${reason}`;
            break;
        }
        if (messageContent) {
          await supabase.from("messages").insert([{
            conversation_id: application.conversation_id,
            sender_id: req.user.id,
            content: messageContent,
            message_type: "system"
          }]);
        }
      }
      const notificationUserId = action === "submit_for_review" ? application.properties?.owner_id : application.user_id;
      if (notificationUserId) {
        await supabase.from("application_notifications").insert([{
          application_id: req.params.id,
          user_id: notificationUserId,
          notification_type: `application_${action}`,
          channel: "in_app",
          subject: `Application ${action.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}`,
          content: reason || `Application has been ${action.replace("_", " ")}`,
          status: "pending"
        }]);
      }
      return res.json(success(updatedApp, `Application ${action.replace("_", " ")} successfully`));
    } catch (err) {
      console.error("[APPLICATION] Review action error:", err);
      return res.status(500).json(error("Failed to process application action"));
    }
  });
  app2.get("/api/applications/:id/audit-trail", authenticateToken, async (req, res) => {
    try {
      const { data: application, error: appError } = await supabase.from("applications").select(`*, properties:property_id(owner_id, listing_agent_id)`).eq("id", req.params.id).single();
      if (appError || !application) {
        return res.status(404).json(error("Application not found"));
      }
      const isOwner = application.properties?.owner_id === req.user.id;
      const isAgent = application.properties?.listing_agent_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      const isApplicant = application.user_id === req.user.id;
      if (!isOwner && !isAgent && !isAdmin && !isApplicant) {
        return res.status(403).json(error("Not authorized to view audit trail"));
      }
      const { data: auditLogs2, error: auditError } = await supabase.from("audit_logs").select(`*, users:user_id(id, full_name, email)`).eq("resource_type", "application").eq("resource_id", req.params.id).order("created_at", { ascending: false });
      if (auditError) throw auditError;
      const { data: paymentVerifications2, error: pvError } = await supabase.from("payment_verifications").select(`*, users:verified_by(id, full_name)`).eq("application_id", req.params.id).order("created_at", { ascending: false });
      if (pvError) throw pvError;
      const { data: comments, error: commentsError } = await supabase.from("application_comments").select(`*, users:user_id(id, full_name)`).eq("application_id", req.params.id).order("created_at", { ascending: false });
      if (commentsError) throw commentsError;
      let filteredComments = comments || [];
      let filteredVerifications = paymentVerifications2 || [];
      if (isApplicant && !isOwner && !isAgent && !isAdmin) {
        filteredComments = filteredComments.filter((c) => !c.is_internal);
        filteredVerifications = filteredVerifications.map((v) => ({
          ...v,
          internal_note: null
        }));
      }
      return res.json(success({
        statusHistory: application.status_history || [],
        paymentAttempts: application.payment_attempts || [],
        paymentVerifications: filteredVerifications,
        auditLogs: auditLogs2 || [],
        comments: filteredComments,
        currentStatus: application.status,
        paymentStatus: application.payment_status
      }, "Audit trail fetched successfully"));
    } catch (err) {
      console.error("[APPLICATION] Audit trail error:", err);
      return res.status(500).json(error("Failed to fetch audit trail"));
    }
  });
  app2.post("/api/applications/guest", optionalAuth, async (req, res) => {
    try {
      const validation = insertApplicationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const guestEmail = req.body.guestEmail;
      const guestName = req.body.guestName;
      const propertyId = validation.data.propertyId;
      if (req.user) {
        const { data: existing } = await supabase.from("applications").select("id").eq("user_id", req.user.id).eq("property_id", propertyId).single();
        if (existing) {
          return res.status(409).json({ error: "You have already applied for this property" });
        }
      }
      let userId = req.user?.id || null;
      if (!userId && guestEmail) {
        const tempPassword = Math.random().toString(36).slice(2, 15) + Math.random().toString(36).slice(2, 15);
        const { data: guestUser, error: guestError } = await supabase.from("users").insert([{
          email: guestEmail,
          full_name: guestName || "Guest User",
          role: "renter",
          password_hash: tempPassword
          // Temporary secure hash
        }]).select("id").single();
        if (guestUser?.id) {
          userId = guestUser.id;
        }
      }
      const applicationData = {
        ...validation.data,
        user_id: userId,
        status: "submitted"
        // Set status to submitted instead of draft
      };
      const { data, error: error2 } = await supabase.from("applications").insert([applicationData]).select();
      if (error2) throw error2;
      const appId = data[0]?.id;
      const { data: propertyData } = await supabase.from("properties").select("owner_id, title").eq("id", propertyId).single();
      if (appId && propertyData?.owner_id && userId) {
        const { data: conversation, error: convError } = await supabase.from("conversations").insert([{
          property_id: propertyId,
          application_id: appId,
          subject: `Application for ${propertyData.title}`
        }]).select().single();
        if (conversation && !convError) {
          await supabase.from("conversation_participants").insert([
            { conversation_id: conversation.id, user_id: userId },
            { conversation_id: conversation.id, user_id: propertyData.owner_id }
          ]);
          await supabase.from("applications").update({ conversation_id: conversation.id }).eq("id", appId);
        }
      }
      const emailTo = req.user ? (await supabase.from("users").select("email, full_name").eq("id", req.user.id).single()).data : { email: guestEmail, full_name: guestName };
      if (emailTo?.email) {
        sendEmail({
          to: emailTo.email,
          subject: "Your Application Has Been Received",
          html: getApplicationConfirmationEmailTemplate({
            applicantName: emailTo.full_name || "Applicant",
            propertyTitle: propertyData?.title || "Your Property"
          })
        }).catch((err) => console.error("Email send error:", err));
      }
      if (appId) {
        notifyOwnerOfNewApplication(appId).catch(
          (err) => console.error("Owner notification error:", err)
        );
      }
      return res.json(success(data[0], "Application submitted successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to submit application"));
    }
  });
  app2.post("/api/applications", authenticateToken, async (req, res) => {
    try {
      const validation = insertApplicationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const propertyId = validation.data.propertyId;
      const { data: existing, error: checkError } = await supabase.from("applications").select("id").eq("user_id", req.user.id).eq("property_id", propertyId).single();
      if (existing) {
        return res.status(409).json({ error: "You have already applied for this property. Please check your existing applications." });
      }
      const applicationData = {
        ...validation.data,
        user_id: req.user.id,
        status: "submitted"
        // Set status to submitted instead of draft
      };
      const { data, error: error2 } = await supabase.from("applications").insert([applicationData]).select();
      if (error2) throw error2;
      const appId = data[0]?.id;
      const { data: userData } = await supabase.from("users").select("email, full_name").eq("id", req.user.id).single();
      const { data: propertyData } = await supabase.from("properties").select("title, owner_id").eq("id", propertyId).single();
      if (appId && propertyData?.owner_id) {
        const { data: conversation, error: convError } = await supabase.from("conversations").insert([{
          property_id: propertyId,
          application_id: appId,
          subject: `Application for ${propertyData.title}`
        }]).select().single();
        if (conversation && !convError) {
          await supabase.from("conversation_participants").insert([
            { conversation_id: conversation.id, user_id: req.user.id },
            { conversation_id: conversation.id, user_id: propertyData.owner_id }
          ]);
          await supabase.from("applications").update({ conversation_id: conversation.id }).eq("id", appId);
        }
      }
      if (userData?.email) {
        sendEmail({
          to: userData.email,
          subject: "Your Application Has Been Received",
          html: getApplicationConfirmationEmailTemplate({
            applicantName: userData.full_name || "Applicant",
            propertyTitle: propertyData?.title || "Your Property"
          })
        }).catch((err) => console.error("Email send error:", err));
      }
      if (appId) {
        notifyOwnerOfNewApplication(appId).catch(
          (err) => console.error("Owner notification error:", err)
        );
      }
      return res.json(success(data[0], "Application submitted successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to submit application"));
    }
  });
  app2.get("/api/applications/user/:userId", authenticateToken, async (req, res) => {
    try {
      if (req.params.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { data, error: error2 } = await supabase.from("applications").select("*, properties(*)").eq("user_id", req.params.userId);
      if (error2) throw error2;
      return res.json(success(data, "User applications fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch user applications"));
    }
  });
  app2.get("/api/applications/owner", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== "owner" && req.user.role !== "agent" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized - property owners/agents/admins only" });
      }
      const { data: ownedProperties, error: propError } = await supabase.from("properties").select("id").eq("owner_id", req.user.id);
      if (propError) throw propError;
      if (!ownedProperties || ownedProperties.length === 0) {
        return res.json(success([], "No applications found"));
      }
      const propertyIds = ownedProperties.map((p) => p.id);
      const { data, error: error2 } = await supabase.from("applications").select("*, users(id, full_name, email, phone), properties(id, title, address, city, state)").in("property_id", propertyIds).order("created_at", { ascending: false });
      if (error2) throw error2;
      return res.json(success(data, "Owner applications fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch owner applications"));
    }
  });
  app2.get("/api/applications/property/:propertyId", authenticateToken, async (req, res) => {
    try {
      const { data: property, error: propertyError } = await supabase.from("properties").select("owner_id").eq("id", req.params.propertyId).single();
      if (propertyError || !property) {
        return res.status(404).json(error("Property not found"));
      }
      if (property.owner_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { data, error: error2 } = await supabase.from("applications").select("*, users(id, full_name, email, phone)").eq("property_id", req.params.propertyId);
      if (error2) throw error2;
      return res.json(success(data, "Property applications fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch property applications"));
    }
  });
  app2.patch("/api/applications/:id", authenticateToken, async (req, res) => {
    try {
      const { data: application } = await supabase.from("applications").select("user_id, property_id").eq("id", req.params.id).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const { data: property } = await supabase.from("properties").select("owner_id").eq("id", application.property_id).single();
      const isOwner = application.user_id === req.user.id;
      const isPropertyOwner = property?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isOwner && !isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { data, error: error2 } = await supabase.from("applications").update({ ...req.body, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", req.params.id).select();
      if (error2) throw error2;
      return res.json(success(data[0], "Application updated successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to update application"));
    }
  });
  app2.patch("/api/applications/:id/draft", authenticateToken, async (req, res) => {
    try {
      const { step, personalInfo, rentalHistory, employment, references, disclosures, documents, customAnswers } = req.body;
      const { data: application, error: fetchError } = await supabase.from("applications").select("user_id, status").eq("id", req.params.id).single();
      if (fetchError || !application) {
        return res.status(404).json(error("Application not found"));
      }
      if (application.user_id !== req.user.id) {
        return res.status(403).json({ error: "Not authorized to edit this application" });
      }
      if (application.status !== "draft") {
        return res.status(400).json({ error: "Cannot modify a submitted application. Only draft applications can be edited." });
      }
      const updateData = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
      if (step !== void 0) {
        updateData.step = step;
        updateData.last_saved_step = step;
      }
      if (personalInfo !== void 0) updateData.personal_info = personalInfo;
      if (rentalHistory !== void 0) updateData.rental_history = rentalHistory;
      if (employment !== void 0) updateData.employment = employment;
      if (references !== void 0) updateData.references = references;
      if (disclosures !== void 0) updateData.disclosures = disclosures;
      if (documents !== void 0) updateData.documents = documents;
      if (customAnswers !== void 0) updateData.custom_answers = customAnswers;
      const { data, error: error2 } = await supabase.from("applications").update(updateData).eq("id", req.params.id).select().single();
      if (error2) throw error2;
      return res.json(success(data, "Draft saved successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to save draft"));
    }
  });
  app2.post("/api/applications/:propertyId/draft", authenticateToken, async (req, res) => {
    try {
      const propertyId = req.params.propertyId;
      const { data: existing, error: checkError } = await supabase.from("applications").select("*").eq("user_id", req.user.id).eq("property_id", propertyId).single();
      if (existing) {
        return res.json(success(existing, "Existing application found"));
      }
      const { data, error: error2 } = await supabase.from("applications").insert([{
        property_id: propertyId,
        user_id: req.user.id,
        status: "draft",
        step: 0,
        last_saved_step: 0
      }]).select().single();
      if (error2) throw error2;
      return res.json(success(data, "Draft application created"));
    } catch (err) {
      return res.status(500).json(error("Failed to create draft application"));
    }
  });
  app2.get("/api/properties/:propertyId/questions", async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("property_questions").select("*").eq("property_id", req.params.propertyId).eq("is_active", true).order("display_order", { ascending: true });
      if (error2) throw error2;
      return res.json(success(data || [], "Property questions fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch property questions"));
    }
  });
  app2.get("/api/properties/:propertyId/questions/all", authenticateToken, requireOwnership("property"), async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("property_questions").select("*").eq("property_id", req.params.propertyId).order("display_order", { ascending: true });
      if (error2) throw error2;
      return res.json(success(data || [], "All property questions fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch property questions"));
    }
  });
  app2.post("/api/properties/:propertyId/questions", authenticateToken, requireOwnership("property"), async (req, res) => {
    try {
      const { question, questionType = "text", options, required = false, displayOrder = 0 } = req.body;
      if (!question || question.trim() === "") {
        return res.status(400).json(error("Question text is required"));
      }
      const { data, error: error2 } = await supabase.from("property_questions").insert([{
        property_id: req.params.propertyId,
        question: question.trim(),
        question_type: questionType,
        options: options || null,
        required,
        display_order: displayOrder,
        is_active: true
      }]).select().single();
      if (error2) throw error2;
      return res.json(success(data, "Question created successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to create question"));
    }
  });
  app2.patch("/api/properties/:propertyId/questions/:questionId", authenticateToken, requireOwnership("property"), async (req, res) => {
    try {
      const { question, questionType, options, required, displayOrder, isActive } = req.body;
      const updateData = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
      if (question !== void 0) updateData.question = question.trim();
      if (questionType !== void 0) updateData.question_type = questionType;
      if (options !== void 0) updateData.options = options;
      if (required !== void 0) updateData.required = required;
      if (displayOrder !== void 0) updateData.display_order = displayOrder;
      if (isActive !== void 0) updateData.is_active = isActive;
      const { data, error: error2 } = await supabase.from("property_questions").update(updateData).eq("id", req.params.questionId).eq("property_id", req.params.propertyId).select().single();
      if (error2) throw error2;
      return res.json(success(data, "Question updated successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to update question"));
    }
  });
  app2.delete("/api/properties/:propertyId/questions/:questionId", authenticateToken, requireOwnership("property"), async (req, res) => {
    try {
      const { error: error2 } = await supabase.from("property_questions").delete().eq("id", req.params.questionId).eq("property_id", req.params.propertyId);
      if (error2) throw error2;
      return res.json(success(null, "Question deleted successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to delete question"));
    }
  });
  app2.patch("/api/properties/:propertyId/questions/reorder", authenticateToken, requireOwnership("property"), async (req, res) => {
    try {
      const { questionIds } = req.body;
      if (!Array.isArray(questionIds)) {
        return res.status(400).json(error("questionIds must be an array"));
      }
      const updates = questionIds.map(
        (id, index) => supabase.from("property_questions").update({ display_order: index, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id).eq("property_id", req.params.propertyId)
      );
      await Promise.all(updates);
      const { data, error: error2 } = await supabase.from("property_questions").select("*").eq("property_id", req.params.propertyId).order("display_order", { ascending: true });
      if (error2) throw error2;
      return res.json(success(data, "Questions reordered successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to reorder questions"));
    }
  });
  app2.get("/api/applications/:id/full", authenticateToken, async (req, res) => {
    try {
      const { getApplicationWithDetails: getApplicationWithDetails2 } = await Promise.resolve().then(() => (init_application_service(), application_service_exports2));
      const application = await getApplicationWithDetails2(req.params.id);
      if (!application) {
        return res.status(404).json(error("Application not found"));
      }
      const { data: property } = await supabase.from("properties").select("owner_id").eq("id", application.property_id).single();
      const isApplicant = application.user_id === req.user.id;
      const isPropertyOwner = property?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isApplicant && !isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Not authorized" });
      }
      if (isApplicant && !isPropertyOwner && !isAdmin) {
        application.comments = application.comments.filter((c) => !c.is_internal);
      }
      return res.json(success(application, "Application details fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch application details"));
    }
  });
  app2.patch("/api/applications/:id/status", authenticateToken, async (req, res) => {
    try {
      const { status, rejectionCategory, rejectionReason, rejectionDetails, reason } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      const { data: application } = await supabase.from("applications").select("user_id, property_id, status").eq("id", req.params.id).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const { data: property } = await supabase.from("properties").select("owner_id").eq("id", application.property_id).single();
      const isApplicant = application.user_id === req.user.id;
      const isPropertyOwner = property?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (status === "withdrawn" && !isApplicant) {
        return res.status(403).json({ error: "Only applicant can withdraw application" });
      }
      if (["approved", "rejected", "under_review", "pending_verification"].includes(status) && !isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Only property owner can update this status" });
      }
      const { updateApplicationStatus: updateApplicationStatus3 } = await Promise.resolve().then(() => (init_application_service(), application_service_exports2));
      const result = await updateApplicationStatus3(req.params.id, status, req.user.id, {
        rejectionCategory,
        rejectionReason,
        rejectionDetails,
        reason
      });
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      return res.json(success(result.data, "Application status updated successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to update application status"));
    }
  });
  app2.post("/api/applications/:id/score", authenticateToken, async (req, res) => {
    try {
      const { data: application } = await supabase.from("applications").select("*, properties(owner_id)").eq("id", req.params.id).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const isPropertyOwner = application.properties?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Only property owner can score applications" });
      }
      const { calculateApplicationScore: calculateApplicationScore2 } = await Promise.resolve().then(() => (init_application_service(), application_service_exports2));
      const scoreBreakdown = calculateApplicationScore2({
        personalInfo: application.personal_info,
        employment: application.employment,
        rentalHistory: application.rental_history,
        documents: application.documents,
        documentStatus: application.document_status
      });
      const { data, error: error2 } = await supabase.from("applications").update({
        score: scoreBreakdown.totalScore,
        score_breakdown: scoreBreakdown,
        scored_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", req.params.id).select().single();
      if (error2) throw error2;
      return res.json(success({ application: data, scoreBreakdown }, "Application scored successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to score application"));
    }
  });
  app2.get("/api/applications/compare/:propertyId", authenticateToken, async (req, res) => {
    try {
      const { data: property } = await supabase.from("properties").select("owner_id").eq("id", req.params.propertyId).single();
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      const isPropertyOwner = property.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Only property owner can compare applications" });
      }
      const { compareApplications: compareApplications2 } = await Promise.resolve().then(() => (init_application_service(), application_service_exports2));
      const comparisons = await compareApplications2(req.params.propertyId);
      return res.json(success(comparisons, "Applications compared successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to compare applications"));
    }
  });
  app2.post("/api/applications/:applicationId/co-applicants", authenticateToken, async (req, res) => {
    try {
      const { data: application } = await supabase.from("applications").select("user_id, property_id, personal_info").eq("id", req.params.applicationId).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      if (application.user_id !== req.user.id) {
        return res.status(403).json({ error: "Only applicant can add co-applicants" });
      }
      const { email, fullName, phone, relationship, personalInfo, employment, income } = req.body;
      if (!email || !fullName) {
        return res.status(400).json({ error: "Email and full name are required" });
      }
      const { data, error: error2 } = await supabase.from("co_applicants").insert([{
        application_id: req.params.applicationId,
        email,
        full_name: fullName,
        phone,
        relationship,
        personal_info: personalInfo,
        employment,
        income
      }]).select();
      if (error2) throw error2;
      const { data: propertyData } = await supabase.from("properties").select("title").eq("id", application.property_id).single();
      const mainApplicantName = application.personal_info?.firstName || "Applicant";
      const { getCoApplicantInvitationEmailTemplate: getCoApplicantInvitationEmailTemplate2 } = await Promise.resolve().then(() => (init_email(), email_exports));
      sendEmail({
        to: email,
        subject: `You've Been Invited as a Co-Applicant - ${propertyData?.title || "Choice Properties"}`,
        html: getCoApplicantInvitationEmailTemplate2({
          coApplicantName: fullName,
          mainApplicantName,
          propertyTitle: propertyData?.title || "the property",
          invitationLink: `${process.env.PUBLIC_URL || "https://choice-properties.replit.dev"}/applications/${req.params.applicationId}`
        })
      }).catch((err) => console.error("Failed to send co-applicant invitation email:", err));
      return res.json(success(data[0], "Co-applicant added successfully and invitation email sent"));
    } catch (err) {
      return res.status(500).json(error("Failed to add co-applicant"));
    }
  });
  app2.get("/api/applications/:applicationId/co-applicants", authenticateToken, async (req, res) => {
    try {
      const { data: application } = await supabase.from("applications").select("user_id, property_id").eq("id", req.params.applicationId).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const { data: property } = await supabase.from("properties").select("owner_id").eq("id", application.property_id).single();
      const isApplicant = application.user_id === req.user.id;
      const isPropertyOwner = property?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isApplicant && !isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { data, error: error2 } = await supabase.from("co_applicants").select("*").eq("application_id", req.params.applicationId);
      if (error2) throw error2;
      return res.json(success(data, "Co-applicants fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch co-applicants"));
    }
  });
  app2.delete("/api/co-applicants/:id", authenticateToken, async (req, res) => {
    try {
      const { data: coApplicant } = await supabase.from("co_applicants").select("application_id").eq("id", req.params.id).single();
      if (!coApplicant) {
        return res.status(404).json({ error: "Co-applicant not found" });
      }
      const { data: application } = await supabase.from("applications").select("user_id").eq("id", coApplicant.application_id).single();
      if (application?.user_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only applicant can remove co-applicants" });
      }
      const { error: error2 } = await supabase.from("co_applicants").delete().eq("id", req.params.id);
      if (error2) throw error2;
      return res.json(success(null, "Co-applicant removed successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to remove co-applicant"));
    }
  });
  app2.delete("/api/applications/:applicationId/co-applicants/:coApplicantId", authenticateToken, async (req, res) => {
    try {
      const { data: coApplicant } = await supabase.from("co_applicants").select("application_id").eq("id", req.params.coApplicantId).eq("application_id", req.params.applicationId).single();
      if (!coApplicant) {
        return res.status(404).json({ error: "Co-applicant not found" });
      }
      const { data: application } = await supabase.from("applications").select("user_id").eq("id", req.params.applicationId).single();
      if (application?.user_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only applicant can remove co-applicants" });
      }
      const { error: error2 } = await supabase.from("co_applicants").delete().eq("id", req.params.coApplicantId);
      if (error2) throw error2;
      return res.json(success(null, "Co-applicant removed successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to remove co-applicant"));
    }
  });
  app2.post("/api/applications/:applicationId/co-applicants/:coApplicantId/resend", authenticateToken, async (req, res) => {
    try {
      const { data: coApplicant } = await supabase.from("co_applicants").select("*, applications(user_id, property_id, users(full_name)), properties:applications(properties(title))").eq("id", req.params.coApplicantId).eq("application_id", req.params.applicationId).single();
      if (!coApplicant) {
        return res.status(404).json({ error: "Co-applicant not found" });
      }
      const { data: application } = await supabase.from("applications").select("user_id").eq("id", req.params.applicationId).single();
      if (application?.user_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Only applicant can resend invitations" });
      }
      await supabase.from("co_applicants").update({ invited_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", req.params.coApplicantId);
      console.log(`[CO-APPLICANT] Resent invitation to ${coApplicant.email}`);
      return res.json(success(null, "Invitation resent successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to resend invitation"));
    }
  });
  app2.patch("/api/applications/:applicationId/lease-status", authenticateToken, async (req, res) => {
    try {
      const validation = leaseStatusUpdateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const { leaseStatus, leaseDocumentUrl, leaseVersion, moveInDate } = validation.data;
      const { data: application, error: appError } = await supabase.from("applications").select("*, properties(owner_id)").eq("id", req.params.applicationId).single();
      if (appError || !application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const isPropertyOwner = application.properties?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Only landlord/agent can update lease status" });
      }
      const currentStatus = application.lease_status || "lease_preparation";
      const allowedTransitions = LEASE_STATUS_TRANSITIONS[currentStatus] || [];
      if (!allowedTransitions.includes(leaseStatus)) {
        return res.status(400).json({
          error: `Invalid lease status transition from '${currentStatus}' to '${leaseStatus}'. Allowed transitions: ${allowedTransitions.join(", ") || "none"}`
        });
      }
      const updateData = {
        lease_status: leaseStatus,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (leaseDocumentUrl) updateData.lease_document_url = leaseDocumentUrl;
      if (leaseVersion) updateData.lease_version = leaseVersion;
      if (moveInDate) updateData.move_in_date = moveInDate;
      if (leaseStatus === "lease_accepted") {
        updateData.lease_accepted_at = (/* @__PURE__ */ new Date()).toISOString();
      }
      if (leaseStatus === "completed") {
        updateData.lease_signed_at = (/* @__PURE__ */ new Date()).toISOString();
      }
      const { data, error: error2 } = await supabase.from("applications").update(updateData).eq("id", req.params.applicationId).select();
      if (error2) throw error2;
      return res.json(success(data[0], "Lease status updated successfully"));
    } catch (err) {
      console.error("[LEASE] Status update error:", err);
      return res.status(500).json(error("Failed to update lease status"));
    }
  });
  app2.post("/api/applications/:applicationId/lease-draft", authenticateToken, async (req, res) => {
    try {
      const { templateId, rentAmount, leaseStartDate, leaseEndDate, securityDeposit, customClauses } = req.body;
      const { data: application, error: appError } = await supabase.from("applications").select("*, properties(owner_id)").eq("id", req.params.applicationId).single();
      if (appError || !application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const isPropertyOwner = application.properties?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Only landlord/agent can create lease drafts" });
      }
      let template = null;
      if (templateId) {
        const { data: tmpl } = await supabase.from("lease_templates").select("*").eq("id", templateId).single();
        template = tmpl;
      }
      const draftData = {
        application_id: req.params.applicationId,
        template_id: templateId || null,
        created_by: req.user.id,
        rent_amount: rentAmount || (template?.rent_amount ?? 0),
        security_deposit: securityDeposit || template?.security_deposit,
        lease_start_date: leaseStartDate,
        lease_end_date: leaseEndDate,
        content: template?.content || "",
        custom_clauses: customClauses || template?.custom_clauses || [],
        changes: [{
          version: 1,
          changedBy: req.user.id,
          changedAt: (/* @__PURE__ */ new Date()).toISOString(),
          changeDescription: "Initial draft created"
        }],
        status: "draft"
      };
      const { data, error: error2 } = await supabase.from("lease_drafts").insert([draftData]).select();
      if (error2) throw error2;
      await logLeaseAction(
        req.user.id,
        req.params.applicationId,
        "lease_created",
        void 0,
        "draft",
        "Lease draft created from template",
        req
      );
      return res.json(success(data[0], "Lease draft created successfully"));
    } catch (err) {
      console.error("[LEASE_DRAFT] Create error:", err);
      return res.status(500).json(error("Failed to create lease draft"));
    }
  });
  app2.get("/api/applications/:applicationId/lease-draft", authenticateToken, async (req, res) => {
    try {
      const { data: application } = await supabase.from("applications").select("user_id, properties(owner_id)").eq("id", req.params.applicationId).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const isTenant = application.user_id === req.user.id;
      const isPropertyOwner = application.properties?.[0]?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isTenant && !isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Not authorized to view draft" });
      }
      const { data: draft, error: error2 } = await supabase.from("lease_drafts").select("*, created_by_user:users(full_name, email)").eq("application_id", req.params.applicationId).order("version", { ascending: false }).limit(1).single();
      if (error2) {
        return res.status(404).json({ error: "No lease draft found" });
      }
      if (isTenant && draft.status === "draft") {
        return res.status(403).json({ error: "Draft lease not yet ready" });
      }
      return res.json(success(draft, "Lease draft retrieved"));
    } catch (err) {
      console.error("[LEASE_DRAFT] Get error:", err);
      return res.status(500).json(error("Failed to retrieve lease draft"));
    }
  });
  app2.patch("/api/applications/:applicationId/lease-draft", authenticateToken, async (req, res) => {
    try {
      const validation = updateLeaseDraftSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const { data: application } = await supabase.from("applications").select("properties(owner_id), lease_status").eq("id", req.params.applicationId).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const isPropertyOwner = application.properties?.[0]?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Only landlord/agent can edit lease drafts" });
      }
      if (application.lease_status === "lease_accepted") {
        return res.status(400).json({ error: "Cannot edit accepted lease" });
      }
      const { data: currentDraft } = await supabase.from("lease_drafts").select("*").eq("application_id", req.params.applicationId).order("version", { ascending: false }).limit(1).single();
      if (!currentDraft) {
        return res.status(404).json({ error: "No lease draft found" });
      }
      const changes = currentDraft.changes || [];
      const previousValues = {};
      if (req.body.rentAmount && req.body.rentAmount !== currentDraft.rent_amount) previousValues.rentAmount = currentDraft.rent_amount;
      if (req.body.securityDeposit && req.body.securityDeposit !== currentDraft.security_deposit) previousValues.securityDeposit = currentDraft.security_deposit;
      if (req.body.leaseStartDate && req.body.leaseStartDate !== currentDraft.lease_start_date) previousValues.leaseStartDate = currentDraft.lease_start_date;
      if (req.body.leaseEndDate && req.body.leaseEndDate !== currentDraft.lease_end_date) previousValues.leaseEndDate = currentDraft.lease_end_date;
      changes.push({
        version: currentDraft.version + 1,
        changedBy: req.user.id,
        changedAt: (/* @__PURE__ */ new Date()).toISOString(),
        changeDescription: validation.data.changeDescription,
        previousValues: Object.keys(previousValues).length > 0 ? previousValues : void 0
      });
      const updateData = { updated_at: (/* @__PURE__ */ new Date()).toISOString(), changes };
      if (validation.data.rentAmount) updateData.rent_amount = validation.data.rentAmount;
      if (validation.data.securityDeposit !== void 0) updateData.security_deposit = validation.data.securityDeposit;
      if (validation.data.leaseStartDate) updateData.lease_start_date = validation.data.leaseStartDate;
      if (validation.data.leaseEndDate) updateData.lease_end_date = validation.data.leaseEndDate;
      if (validation.data.content) updateData.content = validation.data.content;
      if (validation.data.customClauses) updateData.custom_clauses = validation.data.customClauses;
      if (validation.data.status) updateData.status = validation.data.status;
      updateData.version = currentDraft.version + 1;
      const { data, error: error2 } = await supabase.from("lease_drafts").update(updateData).eq("id", currentDraft.id).select();
      if (error2) throw error2;
      return res.json(success(data[0], "Lease draft updated successfully"));
    } catch (err) {
      console.error("[LEASE_DRAFT] Update error:", err);
      return res.status(500).json(error("Failed to update lease draft"));
    }
  });
  app2.get("/api/applications/:applicationId/lease-draft/history", authenticateToken, async (req, res) => {
    try {
      const { data: application } = await supabase.from("applications").select("properties(owner_id)").eq("id", req.params.applicationId).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const isPropertyOwner = application.properties?.[0]?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { data: drafts, error: error2 } = await supabase.from("lease_drafts").select("id, version, status, created_at, updated_at, changes").eq("application_id", req.params.applicationId).order("version", { ascending: false });
      if (error2) throw error2;
      return res.json(success(drafts, "Lease draft history retrieved"));
    } catch (err) {
      console.error("[LEASE_DRAFT] History error:", err);
      return res.status(500).json(error("Failed to retrieve history"));
    }
  });
  app2.post("/api/applications/:applicationId/lease-draft/send", authenticateToken, async (req, res) => {
    try {
      const validation = leaseSendSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const { data: application } = await supabase.from("applications").select("user_id, property_id, properties(owner_id)").eq("id", req.params.applicationId).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const isPropertyOwner = application.properties?.[0]?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Only landlord/agent can send lease" });
      }
      const { data: draft } = await supabase.from("lease_drafts").select("*").eq("application_id", req.params.applicationId).order("version", { ascending: false }).limit(1).single();
      if (!draft) {
        return res.status(404).json({ error: "No lease draft found" });
      }
      const { error: draftError } = await supabase.from("lease_drafts").update({ status: "sent", updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", draft.id);
      if (draftError) throw draftError;
      const { error: appError } = await supabase.from("applications").update({
        lease_status: "lease_sent",
        lease_sent_at: (/* @__PURE__ */ new Date()).toISOString(),
        lease_sent_by: req.user.id,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", req.params.applicationId);
      if (appError) throw appError;
      await logLeaseAction(
        req.user.id,
        req.params.applicationId,
        "lease_sent",
        "draft",
        "lease_sent",
        `Lease version ${draft.version} sent to tenant`,
        req
      );
      const { data: existingNotif } = await supabase.from("application_notifications").select("id").eq("application_id", req.params.applicationId).eq("notification_type", "lease_sent").limit(1).single();
      if (!existingNotif) {
        await supabase.from("application_notifications").insert([{
          application_id: req.params.applicationId,
          user_id: application.user_id,
          notification_type: "lease_sent",
          channel: "email",
          subject: "Your lease is ready for review",
          content: "The landlord has sent you a lease for review. Please review and respond.",
          status: "pending"
        }]);
      }
      return res.json(success({ leaseStatus: "lease_sent" }, "Lease sent to tenant successfully"));
    } catch (err) {
      console.error("[LEASE] Send error:", err);
      return res.status(500).json(error("Failed to send lease"));
    }
  });
  app2.get("/api/applications/:applicationId/lease", authenticateToken, async (req, res) => {
    try {
      const { data: application } = await supabase.from("applications").select("user_id, lease_status, properties(owner_id)").eq("id", req.params.applicationId).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const isTenant = application.user_id === req.user.id;
      const isPropertyOwner = application.properties?.[0]?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isTenant && !isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Not authorized to view lease" });
      }
      const { data: draft, error: error2 } = await supabase.from("lease_drafts").select("*, created_by_user:users(full_name, email)").eq("application_id", req.params.applicationId).eq("status", "sent").order("version", { ascending: false }).limit(1).single();
      if (error2) {
        return res.status(404).json({ error: "No lease found" });
      }
      return res.json(success(draft, "Lease retrieved successfully"));
    } catch (err) {
      console.error("[LEASE] Get error:", err);
      return res.status(500).json(error("Failed to retrieve lease"));
    }
  });
  app2.post("/api/applications/:applicationId/lease/accept", authenticateToken, async (req, res) => {
    try {
      const validation = leaseAcceptSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const { data: application } = await supabase.from("applications").select("user_id, lease_status").eq("id", req.params.applicationId).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      if (application.user_id !== req.user.id) {
        return res.status(403).json({ error: "Only tenant can accept lease" });
      }
      if (application.lease_status !== "lease_sent") {
        return res.status(400).json({ error: "Lease not in correct state for acceptance" });
      }
      const updateData = {
        lease_status: "lease_accepted",
        lease_accepted_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (validation.data.moveInDate) {
        updateData.move_in_date = validation.data.moveInDate;
      }
      await logLeaseAction(
        req.user.id,
        req.params.applicationId,
        "lease_accepted",
        "lease_sent",
        "lease_accepted",
        "Tenant accepted lease terms",
        req
      );
      const { error: appError } = await supabase.from("applications").update(updateData).eq("id", req.params.applicationId);
      if (appError) throw appError;
      const { data: leaseDraft } = await supabase.from("lease_drafts").select("security_deposit, lease_start_date, rent_amount").eq("application_id", req.params.applicationId).eq("status", "sent").order("version", { ascending: false }).limit(1).maybeSingle();
      if (leaseDraft?.security_deposit) {
        const { data: appInfo } = await supabase.from("applications").select("user_id, property_id, properties(owner_id, title)").eq("id", req.params.applicationId).limit(1).maybeSingle();
        if (appInfo) {
          const { data: existingLease } = await supabase.from("leases").select("id").eq("application_id", req.params.applicationId).limit(1).maybeSingle();
          let leaseId = existingLease?.id;
          let hasExistingDeposit = false;
          if (leaseId) {
            const { data: existingDeposit } = await supabase.from("payments").select("id").eq("lease_id", leaseId).eq("type", "security_deposit").limit(1).maybeSingle();
            hasExistingDeposit = !!existingDeposit;
          }
          if (!leaseId) {
            const monthlyRent = leaseDraft.rent_amount || leaseDraft.security_deposit;
            const { data: newLease, error: leaseError } = await supabase.from("leases").insert({
              application_id: req.params.applicationId,
              property_id: appInfo.property_id,
              tenant_id: appInfo.user_id,
              landlord_id: appInfo.properties?.owner_id,
              monthly_rent: monthlyRent,
              security_deposit_amount: leaseDraft.security_deposit,
              rent_due_day: 1,
              lease_start_date: leaseDraft.lease_start_date || (/* @__PURE__ */ new Date()).toISOString(),
              lease_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3).toISOString(),
              status: "active"
            }).select("id").single();
            if (!leaseError && newLease) {
              leaseId = newLease.id;
            }
          }
          if (leaseId && !hasExistingDeposit) {
            const dueDate = /* @__PURE__ */ new Date();
            dueDate.setDate(dueDate.getDate() + 7);
            await supabase.from("payments").insert({
              lease_id: leaseId,
              tenant_id: appInfo.user_id,
              amount: leaseDraft.security_deposit,
              type: "security_deposit",
              status: "pending",
              due_date: dueDate.toISOString()
            });
          }
          try {
            const propertyTitle = appInfo.properties?.title || "Property";
            await sendDepositRequiredNotification(
              appInfo.user_id,
              leaseDraft.security_deposit.toString(),
              propertyTitle
            );
          } catch (notifErr) {
            console.error("[LEASE] Failed to send deposit notification:", notifErr);
          }
        }
      }
      const { data: appData } = await supabase.from("applications").select("properties(owner_id, users(id)), conversation_id").eq("id", req.params.applicationId).single();
      if (appData && appData.properties?.[0]?.owner_id) {
        const { data: existingLandlordNotif } = await supabase.from("application_notifications").select("id").eq("application_id", req.params.applicationId).eq("notification_type", "lease_accepted").limit(1).single();
        if (!existingLandlordNotif) {
          await supabase.from("application_notifications").insert([{
            application_id: req.params.applicationId,
            user_id: appData.properties?.[0]?.owner_id,
            notification_type: "lease_accepted",
            channel: "email",
            subject: "Lease has been accepted",
            content: "The tenant has accepted the lease and is ready to move in.",
            status: "pending"
          }]);
        }
      }
      if (appData?.conversation_id) {
        await supabase.from("messages").insert([{
          conversation_id: appData.conversation_id,
          sender_id: req.user.id,
          content: "Lease accepted by tenant.",
          message_type: "system"
        }]);
      }
      return res.json(success({ leaseStatus: "lease_accepted" }, "Lease accepted successfully"));
    } catch (err) {
      console.error("[LEASE] Accept error:", err);
      return res.status(500).json(error("Failed to accept lease"));
    }
  });
  app2.patch("/api/applications/:applicationId/lease-draft/signature-enable", authenticateToken, async (req, res) => {
    try {
      const validation = leaseSignatureEnableSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const { data: application } = await supabase.from("applications").select("properties(owner_id)").eq("id", req.params.applicationId).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const isPropertyOwner = application.properties?.[0]?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Only landlord/agent can enable signatures" });
      }
      const { data, error: error2 } = await supabase.from("lease_drafts").update({ signature_enabled: validation.data.signatureEnabled, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("application_id", req.params.applicationId).select();
      if (error2) throw error2;
      return res.json(success(data[0], "Signature setting updated successfully"));
    } catch (err) {
      console.error("[LEASE] Signature enable error:", err);
      return res.status(500).json(error("Failed to update signature setting"));
    }
  });
  app2.post("/api/applications/:applicationId/lease/sign", authenticateToken, async (req, res) => {
    try {
      const validation = leaseSignSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const { data: application } = await supabase.from("applications").select("user_id, lease_status").eq("id", req.params.applicationId).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      if (application.user_id !== req.user.id) {
        return res.status(403).json({ error: "Only tenant can sign lease" });
      }
      if (application.lease_status !== "lease_accepted") {
        return res.status(400).json({ error: "Lease must be accepted before signing" });
      }
      const { data: draft } = await supabase.from("lease_drafts").select("signature_enabled").eq("application_id", req.params.applicationId).order("version", { ascending: false }).limit(1).single();
      if (!draft?.signature_enabled) {
        return res.status(400).json({ error: "Digital signatures not enabled for this lease" });
      }
      const { data: sig, error: sigError } = await supabase.from("lease_signatures").insert([{
        application_id: req.params.applicationId,
        signer_id: req.user.id,
        signer_role: "tenant",
        signature_data: validation.data.signatureData,
        document_hash: validation.data.documentHash || null
      }]).select();
      if (sigError) throw sigError;
      await supabase.from("applications").update({ lease_signed_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", req.params.applicationId);
      const { data: appData } = await supabase.from("applications").select("properties(owner_id)").eq("id", req.params.applicationId).single();
      if (appData && appData.properties?.[0]?.owner_id) {
        const { data: existingSignNotif } = await supabase.from("application_notifications").select("id").eq("application_id", req.params.applicationId).eq("notification_type", "lease_signed_tenant").limit(1).single();
        if (!existingSignNotif) {
          await supabase.from("application_notifications").insert([{
            application_id: req.params.applicationId,
            user_id: appData.properties?.[0]?.owner_id,
            notification_type: "lease_signed_tenant",
            channel: "email",
            subject: "Tenant has signed the lease",
            content: "The tenant has digitally signed the lease.",
            status: "pending"
          }]);
        }
      }
      return res.json(success(sig[0], "Lease signed successfully"));
    } catch (err) {
      console.error("[LEASE] Sign error:", err);
      return res.status(500).json(error("Failed to sign lease"));
    }
  });
  app2.post("/api/applications/:applicationId/lease/countersign", authenticateToken, async (req, res) => {
    try {
      const validation = leaseCounstersignSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const { data: application } = await supabase.from("applications").select("properties(owner_id)").eq("id", req.params.applicationId).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const isPropertyOwner = application.properties?.[0]?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Only landlord/agent can countersign" });
      }
      const { data: tenantSig } = await supabase.from("lease_signatures").select("id").eq("application_id", req.params.applicationId).eq("signer_role", "tenant").limit(1).single();
      if (!tenantSig) {
        return res.status(400).json({ error: "Tenant must sign first before landlord countersigns" });
      }
      const { data: sig, error: sigError } = await supabase.from("lease_signatures").insert([{
        application_id: req.params.applicationId,
        signer_id: req.user.id,
        signer_role: "landlord",
        signature_data: validation.data.signatureData,
        document_hash: validation.data.documentHash || null
      }]).select();
      if (sigError) throw sigError;
      return res.json(success(sig[0], "Lease countersigned successfully"));
    } catch (err) {
      console.error("[LEASE] Countersign error:", err);
      return res.status(500).json(error("Failed to countersign lease"));
    }
  });
  app2.get("/api/applications/:applicationId/lease/signatures", authenticateToken, async (req, res) => {
    try {
      const { data: application } = await supabase.from("applications").select("user_id, properties(owner_id)").eq("id", req.params.applicationId).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const isTenant = application.user_id === req.user.id;
      const isPropertyOwner = application.properties?.[0]?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isTenant && !isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { data: signatures, error: error2 } = await supabase.from("lease_signatures").select("*, signer:users(full_name, email)").eq("application_id", req.params.applicationId).order("signed_at", { ascending: false });
      if (error2) throw error2;
      return res.json(success(signatures, "Lease signatures retrieved successfully"));
    } catch (err) {
      console.error("[LEASE] Get signatures error:", err);
      return res.status(500).json(error("Failed to retrieve signatures"));
    }
  });
  app2.post("/api/applications/:applicationId/move-in/prepare", authenticateToken, async (req, res) => {
    try {
      const validation = moveInPrepareSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const { data: application } = await supabase.from("applications").select("properties(owner_id), lease_status").eq("id", req.params.applicationId).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const isPropertyOwner = application.properties?.[0]?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Only landlord/agent can set move-in details" });
      }
      if (application.lease_status !== "lease_accepted") {
        return res.status(400).json({ error: "Lease must be accepted before move-in preparation" });
      }
      const moveInInstructions = {};
      if (validation.data.keyPickup) moveInInstructions.keyPickup = validation.data.keyPickup;
      if (validation.data.accessDetails) moveInInstructions.accessDetails = validation.data.accessDetails;
      if (validation.data.utilityNotes) moveInInstructions.utilityNotes = validation.data.utilityNotes;
      if (validation.data.checklistItems) moveInInstructions.checklistItems = validation.data.checklistItems;
      const { data, error: error2 } = await supabase.from("applications").update({
        move_in_instructions: moveInInstructions,
        lease_status: "move_in_ready",
        move_in_date: validation.data.moveInDate || null,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", req.params.applicationId).select();
      if (error2) throw error2;
      const { data: appData } = await supabase.from("applications").select("user_id").eq("id", req.params.applicationId).single();
      if (appData?.user_id) {
        const { data: existingMoveInNotif } = await supabase.from("application_notifications").select("id").eq("application_id", req.params.applicationId).eq("notification_type", "move_in_ready").limit(1).single();
        if (!existingMoveInNotif) {
          await supabase.from("application_notifications").insert([{
            application_id: req.params.applicationId,
            user_id: appData.user_id,
            notification_type: "move_in_ready",
            channel: "email",
            subject: "Move-in details ready",
            content: "Your landlord has provided move-in instructions and next steps.",
            status: "pending"
          }]);
        }
      }
      return res.json(success(data[0], "Move-in details saved successfully"));
    } catch (err) {
      console.error("[MOVE_IN] Prepare error:", err);
      return res.status(500).json(error("Failed to save move-in details"));
    }
  });
  app2.get("/api/applications/:applicationId/move-in/instructions", authenticateToken, async (req, res) => {
    try {
      const { data: application, error: error2 } = await supabase.from("applications").select("user_id, move_in_instructions, move_in_date, lease_status").eq("id", req.params.applicationId).single();
      if (error2) throw error2;
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      if (application.user_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      return res.json(success({
        leaseStatus: application.lease_status,
        moveInDate: application.move_in_date,
        instructions: application.move_in_instructions
      }, "Move-in instructions retrieved successfully"));
    } catch (err) {
      console.error("[MOVE_IN] Get instructions error:", err);
      return res.status(500).json(error("Failed to retrieve move-in instructions"));
    }
  });
  app2.patch("/api/applications/:applicationId/move-in/checklist", authenticateToken, async (req, res) => {
    try {
      const validation = moveInChecklistUpdateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const { data: application } = await supabase.from("applications").select("user_id, move_in_instructions").eq("id", req.params.applicationId).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      if (application.user_id !== req.user.id) {
        return res.status(403).json({ error: "Only tenant can update their checklist" });
      }
      const instructions = application.move_in_instructions || {};
      const checklistItems = instructions.checklistItems || [];
      validation.data.checklistItems.forEach((update) => {
        const item = checklistItems.find((i) => i.id === update.id);
        if (item) item.completed = update.completed;
      });
      const { data, error: error2 } = await supabase.from("applications").update({
        move_in_instructions: { ...instructions, checklistItems },
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", req.params.applicationId).select();
      if (error2) throw error2;
      return res.json(success(data[0], "Checklist updated successfully"));
    } catch (err) {
      console.error("[MOVE_IN] Checklist error:", err);
      return res.status(500).json(error("Failed to update checklist"));
    }
  });
  app2.post("/api/applications/:applicationId/lease/decline", authenticateToken, async (req, res) => {
    try {
      const validation = leaseDeclineSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const { data: application } = await supabase.from("applications").select("user_id, lease_status").eq("id", req.params.applicationId).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      if (application.user_id !== req.user.id) {
        return res.status(403).json({ error: "Only tenant can decline lease" });
      }
      if (application.lease_status !== "lease_sent") {
        return res.status(400).json({ error: "Lease not in correct state for decline" });
      }
      const { error: appError } = await supabase.from("applications").update({
        lease_status: "lease_declined",
        lease_decline_reason: validation.data.reason || null,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", req.params.applicationId);
      if (appError) throw appError;
      const { data: appData } = await supabase.from("applications").select("properties(owner_id)").eq("id", req.params.applicationId).single();
      if (appData && appData.properties?.[0]?.owner_id) {
        const { data: existingDeclineNotif } = await supabase.from("application_notifications").select("id").eq("application_id", req.params.applicationId).eq("notification_type", "lease_declined").limit(1).single();
        if (!existingDeclineNotif) {
          await supabase.from("application_notifications").insert([{
            application_id: req.params.applicationId,
            user_id: appData.properties?.[0]?.owner_id,
            notification_type: "lease_declined",
            channel: "email",
            subject: "Lease has been declined",
            content: `The tenant has declined the lease. Reason: ${validation.data.reason || "Not provided"}`,
            status: "pending"
          }]);
        }
      }
      return res.json(success({ leaseStatus: "lease_declined" }, "Lease declined successfully"));
    } catch (err) {
      console.error("[LEASE] Decline error:", err);
      return res.status(500).json(error("Failed to decline lease"));
    }
  });
  app2.post("/api/applications/:applicationId/comments", authenticateToken, async (req, res) => {
    try {
      const { data: application } = await supabase.from("applications").select("user_id, property_id").eq("id", req.params.applicationId).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const { data: property } = await supabase.from("properties").select("owner_id").eq("id", application.property_id).single();
      const isApplicant = application.user_id === req.user.id;
      const isPropertyOwner = property?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isApplicant && !isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { comment, commentType, isInternal } = req.body;
      if (!comment) {
        return res.status(400).json({ error: "Comment is required" });
      }
      const actualIsInternal = isApplicant && !isPropertyOwner && !isAdmin ? false : isInternal ?? true;
      const { data, error: error2 } = await supabase.from("application_comments").insert([{
        application_id: req.params.applicationId,
        user_id: req.user.id,
        comment,
        comment_type: commentType || "note",
        is_internal: actualIsInternal
      }]).select("*, users(id, full_name)");
      if (error2) throw error2;
      return res.json(success(data[0], "Comment added successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to add comment"));
    }
  });
  app2.get("/api/applications/:applicationId/comments", authenticateToken, async (req, res) => {
    try {
      const { data: application } = await supabase.from("applications").select("user_id, property_id").eq("id", req.params.applicationId).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const { data: property } = await supabase.from("properties").select("owner_id").eq("id", application.property_id).single();
      const isApplicant = application.user_id === req.user.id;
      const isPropertyOwner = property?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isApplicant && !isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Not authorized" });
      }
      let query = supabase.from("application_comments").select("*, users(id, full_name)").eq("application_id", req.params.applicationId).order("created_at", { ascending: true });
      if (isApplicant && !isPropertyOwner && !isAdmin) {
        query = query.eq("is_internal", false);
      }
      const { data, error: error2 } = await query;
      if (error2) throw error2;
      return res.json(success(data, "Comments fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch comments"));
    }
  });
  app2.get("/api/applications/:applicationId/notifications", authenticateToken, async (req, res) => {
    try {
      const { data: application } = await supabase.from("applications").select("user_id").eq("id", req.params.applicationId).single();
      if (!application || application.user_id !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { data, error: error2 } = await supabase.from("application_notifications").select("*").eq("application_id", req.params.applicationId).order("created_at", { ascending: false });
      if (error2) throw error2;
      return res.json(success(data, "Notifications fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch notifications"));
    }
  });
  app2.patch("/api/notifications/:id/read", authenticateToken, async (req, res) => {
    try {
      const { data: notification } = await supabase.from("application_notifications").select("user_id").eq("id", req.params.id).single();
      if (!notification || notification.user_id !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { data, error: error2 } = await supabase.from("application_notifications").update({ read_at: (/* @__PURE__ */ new Date()).toISOString(), status: "read" }).eq("id", req.params.id).select();
      if (error2) throw error2;
      return res.json(success(data[0], "Notification marked as read"));
    } catch (err) {
      return res.status(500).json(error("Failed to mark notification as read"));
    }
  });
  app2.get("/api/user/notifications", authenticateToken, async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("application_notifications").select("*, applications(id, property_id, properties(title))").eq("user_id", req.user.id).order("created_at", { ascending: false }).limit(50);
      if (error2) throw error2;
      return res.json(success(data, "User notifications fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch user notifications"));
    }
  });
  app2.patch("/api/applications/:id/documents/:docType", authenticateToken, async (req, res) => {
    try {
      const { data: application } = await supabase.from("applications").select("user_id, property_id, document_status").eq("id", req.params.id).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const { data: property } = await supabase.from("properties").select("owner_id").eq("id", application.property_id).single();
      const isPropertyOwner = property?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Only property owner can verify documents" });
      }
      const { verified, notes } = req.body;
      const docType = req.params.docType;
      const currentDocStatus = application.document_status || {};
      const updatedDocStatus = {
        ...currentDocStatus,
        [docType]: {
          ...currentDocStatus[docType],
          verified: verified ?? false,
          verifiedAt: verified ? (/* @__PURE__ */ new Date()).toISOString() : void 0,
          verifiedBy: verified ? req.user.id : void 0,
          notes
        }
      };
      const { data, error: error2 } = await supabase.from("applications").update({ document_status: updatedDocStatus }).eq("id", req.params.id).select();
      if (error2) throw error2;
      return res.json(success(data[0], "Document status updated successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to update document status"));
    }
  });
  app2.patch("/api/applications/:id/expiration", authenticateToken, async (req, res) => {
    try {
      const { data: application } = await supabase.from("applications").select("property_id").eq("id", req.params.id).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const { data: property } = await supabase.from("properties").select("owner_id").eq("id", application.property_id).single();
      const isPropertyOwner = property?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isPropertyOwner && !isAdmin) {
        return res.status(403).json({ error: "Only property owner can set expiration" });
      }
      const { setApplicationExpiration: setApplicationExpiration2 } = await Promise.resolve().then(() => (init_application_service(), application_service_exports2));
      const daysUntilExpiration = req.body.daysUntilExpiration || 30;
      const result = await setApplicationExpiration2(req.params.id, daysUntilExpiration);
      if (!result) {
        return res.status(500).json(error("Failed to set expiration"));
      }
      return res.json(success(null, `Application expires in ${daysUntilExpiration} days`));
    } catch (err) {
      return res.status(500).json(error("Failed to set application expiration"));
    }
  });
  app2.post("/api/inquiries", inquiryLimiter, async (req, res) => {
    try {
      const validation = insertInquirySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const { data, error: error2 } = await supabase.from("inquiries").insert([validation.data]).select();
      if (error2) throw error2;
      let adminEmail = null;
      const { data: adminSetting } = await supabase.from("admin_settings").select("value").eq("key", "admin_email").single();
      if (adminSetting?.value) {
        adminEmail = adminSetting.value;
      } else {
        const { data: adminUser } = await supabase.from("users").select("email").eq("role", "admin").limit(1).single();
        adminEmail = adminUser?.email;
      }
      let agentName = "Unknown Agent";
      if (validation.data.agentId) {
        const { data: agentData } = await supabase.from("users").select("full_name").eq("id", validation.data.agentId).single();
        agentName = agentData?.full_name || "Unknown Agent";
      }
      if (adminEmail) {
        await sendEmail({
          to: adminEmail,
          subject: `New Inquiry for ${agentName} - Choice Properties`,
          html: getAgentInquiryEmailTemplate({
            senderName: validation.data.senderName,
            senderEmail: validation.data.senderEmail,
            senderPhone: validation.data.senderPhone || "",
            message: validation.data.message || "",
            propertyTitle: agentName ? `(Agent: ${agentName})` : void 0
          })
        });
      }
      return res.json(success(data[0], "Inquiry submitted successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to submit inquiry"));
    }
  });
  app2.get("/api/inquiries/agent/:agentId", authenticateToken, async (req, res) => {
    try {
      if (req.params.agentId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { data, error: error2 } = await supabase.from("inquiries").select("*, properties(id, title, address)").eq("agent_id", req.params.agentId).order("created_at", { ascending: false });
      if (error2) throw error2;
      return res.json(success(data, "Agent inquiries fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch agent inquiries"));
    }
  });
  app2.patch("/api/inquiries/:id", authenticateToken, requireOwnership("inquiry"), async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("inquiries").update({ ...req.body, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", req.params.id).select();
      if (error2) throw error2;
      return res.json(success(data[0], "Inquiry updated successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to update inquiry"));
    }
  });
  app2.post("/api/requirements", optionalAuth, async (req, res) => {
    try {
      const validation = insertRequirementSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const requirementData = {
        ...validation.data,
        user_id: req.user?.id || null
      };
      const { data, error: error2 } = await supabase.from("requirements").insert([requirementData]).select();
      if (error2) throw error2;
      return res.json(success(data[0], "Requirement created successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to create requirement"));
    }
  });
  app2.get("/api/requirements/user/:userId", authenticateToken, async (req, res) => {
    try {
      if (req.params.userId !== req.user.id && req.user.role !== "admin" && req.user.role !== "agent") {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { data, error: error2 } = await supabase.from("requirements").select("*").eq("user_id", req.params.userId);
      if (error2) throw error2;
      return res.json(success(data, "User requirements fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch user requirements"));
    }
  });
  app2.get("/api/requirements", authenticateToken, requireRole("admin", "agent"), async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("requirements").select("*").order("created_at", { ascending: false });
      if (error2) throw error2;
      return res.json(success(data, "Requirements fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch requirements"));
    }
  });
  app2.post("/api/favorites", authenticateToken, async (req, res) => {
    try {
      const validation = insertFavoriteSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const favoriteData = {
        ...validation.data,
        user_id: req.user.id
      };
      const { data, error: error2 } = await supabase.from("favorites").insert([favoriteData]).select();
      if (error2) throw error2;
      return res.json(success(data[0], "Favorite created successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to create favorite"));
    }
  });
  app2.delete("/api/favorites/:id", authenticateToken, requireOwnership("favorite"), async (req, res) => {
    try {
      const { error: error2 } = await supabase.from("favorites").delete().eq("id", req.params.id);
      if (error2) throw error2;
      invalidateOwnershipCache("favorite", req.params.id);
      return res.json(success(null, "Favorite deleted successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to delete favorite"));
    }
  });
  app2.get("/api/favorites/user/:userId", authenticateToken, async (req, res) => {
    try {
      if (req.params.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { data, error: error2 } = await supabase.from("favorites").select("*, properties(*)").eq("user_id", req.params.userId);
      if (error2) throw error2;
      return res.json(success(data, "User favorites fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch user favorites"));
    }
  });
  app2.get("/api/reviews/property/:propertyId", async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("reviews").select("*, users(id, full_name, profile_image)").eq("property_id", req.params.propertyId).order("created_at", { ascending: false });
      if (error2) throw error2;
      return res.json(success(data, "Reviews fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch reviews"));
    }
  });
  app2.post("/api/reviews", authenticateToken, async (req, res) => {
    try {
      const validation = insertReviewSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const reviewData = {
        ...validation.data,
        user_id: req.user.id
      };
      const { data, error: error2 } = await supabase.from("reviews").insert([reviewData]).select();
      if (error2) throw error2;
      return res.json(success(data[0], "Review created successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to create review"));
    }
  });
  app2.patch("/api/reviews/:id", authenticateToken, requireOwnership("review"), async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("reviews").update({ ...req.body, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", req.params.id).select();
      if (error2) throw error2;
      invalidateOwnershipCache("review", req.params.id);
      return res.json(success(data[0], "Review updated successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to update review"));
    }
  });
  app2.delete("/api/reviews/:id", authenticateToken, requireOwnership("review"), async (req, res) => {
    try {
      const { error: error2 } = await supabase.from("reviews").delete().eq("id", req.params.id);
      if (error2) throw error2;
      invalidateOwnershipCache("review", req.params.id);
      return res.json(success(null, "Review deleted successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to delete review"));
    }
  });
  app2.get("/api/users", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("users").select("id, email, full_name, phone, role, profile_image, created_at").order("created_at", { ascending: false });
      if (error2) throw error2;
      return res.json(success(data, "Users fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch users"));
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
    try {
      const { data, error: dbError } = await supabase.from("users").select("id, full_name, profile_image, bio").eq("id", req.params.id).single();
      if (dbError || !data) {
        return res.status(404).json(error("User not found"));
      }
      return res.json(success(data, "User fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch user"));
    }
  });
  app2.patch("/api/users/:id", authenticateToken, async (req, res) => {
    try {
      if (req.params.id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      const allowedFields = ["full_name", "phone", "profile_image", "bio"];
      const updates = {};
      for (const field of allowedFields) {
        if (req.body[field] !== void 0) {
          updates[field] = req.body[field];
        }
      }
      if (req.user.role === "admin" && req.body.role !== void 0) {
        updates.role = req.body.role;
      }
      updates.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      const { data, error: error2 } = await supabase.from("users").update(updates).eq("id", req.params.id).select();
      if (error2) throw error2;
      return res.json(success(data[0], "User updated successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to update user"));
    }
  });
  app2.post("/api/saved-searches", authenticateToken, async (req, res) => {
    try {
      const validation = insertSavedSearchSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const searchData = {
        ...validation.data,
        user_id: req.user.id
      };
      const { data, error: error2 } = await supabase.from("saved_searches").insert([searchData]).select();
      if (error2) throw error2;
      return res.json(success(data[0], "Saved search created successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to create saved search"));
    }
  });
  app2.get("/api/saved-searches/user/:userId", authenticateToken, async (req, res) => {
    try {
      if (req.params.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      const { data, error: error2 } = await supabase.from("saved_searches").select("*").eq("user_id", req.params.userId).order("created_at", { ascending: false });
      if (error2) throw error2;
      return res.json(success(data, "Saved searches fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch saved searches"));
    }
  });
  app2.patch("/api/saved-searches/:id", authenticateToken, requireOwnership("saved_search"), async (req, res) => {
    try {
      const updateSchema = insertSavedSearchSchema.partial().pick({ name: true, filters: true });
      const validation = updateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const { data, error: error2 } = await supabase.from("saved_searches").update({ ...validation.data, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", req.params.id).select();
      if (error2) throw error2;
      return res.json(success(data[0], "Saved search updated successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to update saved search"));
    }
  });
  app2.delete("/api/saved-searches/:id", authenticateToken, requireOwnership("saved_search"), async (req, res) => {
    try {
      const { error: delError } = await supabase.from("saved_searches").delete().eq("id", req.params.id);
      if (delError) throw delError;
      return res.json(success(null, "Saved search deleted successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to delete saved search"));
    }
  });
  app2.post("/api/newsletter/subscribe", newsletterLimiter, async (req, res) => {
    try {
      const validation = insertNewsletterSubscriberSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const { data, error: error2 } = await supabase.from("newsletter_subscribers").insert([validation.data]).select();
      if (error2) {
        if (error2.code === "23505") {
          return res.json(success(null, "Already subscribed"));
        }
        throw error2;
      }
      return res.json(success(data[0], "Subscribed successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to subscribe to newsletter"));
    }
  });
  app2.get("/api/newsletter/subscribers", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("newsletter_subscribers").select("*").order("subscribed_at", { ascending: false });
      if (error2) throw error2;
      return res.json(success(data, "Newsletter subscribers fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch newsletter subscribers"));
    }
  });
  app2.post("/api/messages", inquiryLimiter, async (req, res) => {
    try {
      const validation = insertContactMessageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const { data, error: error2 } = await supabase.from("contact_messages").insert([validation.data]).select();
      if (error2) throw error2;
      return res.json(success(data[0], "Message sent successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to send message"));
    }
  });
  app2.get("/api/messages", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
      if (error2) throw error2;
      return res.json(success(data, "Contact messages fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch contact messages"));
    }
  });
  app2.patch("/api/messages/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("contact_messages").update({ read: req.body.read }).eq("id", req.params.id).select();
      if (error2) throw error2;
      return res.json(success(data[0], "Message updated successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to update message"));
    }
  });
  app2.post("/api/contact", inquiryLimiter, async (req, res) => {
    try {
      const validation = insertContactMessageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(error(validation.error.errors[0].message));
      }
      const { data, error: error2 } = await supabase.from("contact_messages").insert([validation.data]).select();
      if (error2) throw error2;
      return res.json(success(data[0], "Message sent successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to send message"));
    }
  });
  app2.get("/api/health", (_req, res) => {
    return res.json(success({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() }, "Server is healthy"));
  });
  app2.get("/api/user/dashboard", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const [applicationsResult, favoritesResult, savedSearchesResult, requirementsResult, reviewsResult, propertiesResult] = await Promise.all([
        // Applications with property details
        supabase.from("applications").select(`
            *,
            properties:property_id (
              id, title, address, city, state, price, bedrooms, bathrooms, images, status, property_type
            )
          `).eq("user_id", userId).order("created_at", { ascending: false }),
        // Favorites with property details
        supabase.from("favorites").select(`
            id,
            property_id,
            created_at,
            properties:property_id (
              id, title, address, city, state, price, bedrooms, bathrooms, images, status, property_type, square_feet
            )
          `).eq("user_id", userId).order("created_at", { ascending: false }),
        // Saved searches
        supabase.from("saved_searches").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        // Requirements
        supabase.from("requirements").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        // User's reviews
        supabase.from("reviews").select(`
            *,
            properties:property_id (id, title, address, city)
          `).eq("user_id", userId).order("created_at", { ascending: false }),
        // User's properties (if owner/agent)
        supabase.from("properties").select("*").eq("owner_id", userId).order("created_at", { ascending: false })
      ]);
      const applications2 = (applicationsResult.data || []).map((app3) => ({
        ...app3,
        property: app3.properties
      }));
      const favorites2 = (favoritesResult.data || []).map((fav) => ({
        ...fav,
        property: fav.properties
      }));
      const reviews2 = (reviewsResult.data || []).map((review) => ({
        ...review,
        property: review.properties
      }));
      const stats = {
        totalApplications: applications2.length,
        pendingApplications: applications2.filter((a) => a.status === "pending").length,
        approvedApplications: applications2.filter((a) => a.status === "approved").length,
        rejectedApplications: applications2.filter((a) => a.status === "rejected").length,
        totalFavorites: favorites2.length,
        totalSavedSearches: savedSearchesResult.data?.length || 0,
        totalRequirements: requirementsResult.data?.length || 0,
        totalReviews: reviews2.length,
        totalProperties: propertiesResult.data?.length || 0
      };
      return res.json(success({
        applications: applications2,
        favorites: favorites2,
        savedSearches: savedSearchesResult.data || [],
        requirements: requirementsResult.data || [],
        reviews: reviews2,
        properties: propertiesResult.data || [],
        stats
      }, "User dashboard data fetched successfully"));
    } catch (err) {
      console.error("[DASHBOARD] Error fetching user dashboard:", err);
      return res.status(500).json(error("Failed to fetch user dashboard data"));
    }
  });
  app2.get("/api/properties/:id/full", async (req, res) => {
    try {
      const { data: propertyData, error: propertyError } = await supabase.from("properties").select("*").eq("id", req.params.id).single();
      if (propertyError) {
        console.error("[PROPERTY] Supabase property error:", propertyError);
        throw propertyError;
      }
      let ownerData = null;
      if (propertyData?.owner_id) {
        const { data: owner, error: ownerError } = await supabase.from("users").select("id, full_name, email, phone, profile_image, bio").eq("id", propertyData.owner_id).single();
        if (ownerError) {
          console.error("[PROPERTY] Supabase owner error:", ownerError);
        } else {
          ownerData = owner;
        }
      }
      const result = { ...propertyData, owner: ownerData };
      return res.json(success(result, "Property with owner fetched successfully"));
    } catch (err) {
      console.error("[PROPERTY] Error fetching property:", err);
      return res.status(500).json(error("Failed to fetch property"));
    }
  });
  app2.get("/api/agencies", async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("agencies").select("*").is("deleted_at", null).order("created_at", { ascending: false });
      if (error2) throw error2;
      return res.json(success(data, "Agencies fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch agencies"));
    }
  });
  app2.get("/api/agencies/:id", async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("agencies").select(`
          *,
          agents:users!users_agency_id_fkey (
            id, full_name, email, phone, profile_image, bio, 
            license_number, license_verified, specialties, 
            years_experience, total_sales, rating, review_count, location
          )
        `).eq("id", req.params.id).is("deleted_at", null).single();
      if (error2) throw error2;
      return res.json(success(data, "Agency fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch agency"));
    }
  });
  app2.post("/api/agencies", authenticateToken, async (req, res) => {
    try {
      const validation = insertAgencySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(error(validation.error.errors[0].message));
      }
      const agencyData = {
        ...validation.data,
        owner_id: req.user?.id
      };
      const { data, error: error2 } = await supabase.from("agencies").insert(agencyData).select().single();
      if (error2) throw error2;
      if (data && req.user?.id) {
        await supabase.from("users").update({ agency_id: data.id }).eq("id", req.user.id);
      }
      return res.json(success(data, "Agency created successfully"));
    } catch (err) {
      console.error("[AGENCY] Create error:", err);
      return res.status(500).json(error("Failed to create agency"));
    }
  });
  app2.patch("/api/agencies/:id", authenticateToken, async (req, res) => {
    try {
      const { data: agency } = await supabase.from("agencies").select("owner_id").eq("id", req.params.id).single();
      if (!agency || agency.owner_id !== req.user?.id && req.user?.role !== "admin") {
        return res.status(403).json(error("Not authorized to update this agency"));
      }
      const { data, error: error2 } = await supabase.from("agencies").update({ ...req.body, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", req.params.id).select().single();
      if (error2) throw error2;
      return res.json(success(data, "Agency updated successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to update agency"));
    }
  });
  app2.delete("/api/agencies/:id", authenticateToken, async (req, res) => {
    try {
      const { data: agency } = await supabase.from("agencies").select("owner_id").eq("id", req.params.id).single();
      if (!agency || agency.owner_id !== req.user?.id && req.user?.role !== "admin") {
        return res.status(403).json(error("Not authorized to delete this agency"));
      }
      const { error: error2 } = await supabase.from("agencies").update({ deleted_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", req.params.id);
      if (error2) throw error2;
      return res.json(success(null, "Agency deleted successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to delete agency"));
    }
  });
  app2.get("/api/agencies/:id/agents", async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("users").select("id, full_name, email, phone, profile_image, bio, license_number, license_verified, specialties, years_experience, total_sales, rating, review_count, location, role").eq("agency_id", req.params.id).is("deleted_at", null).order("created_at", { ascending: false });
      if (error2) throw error2;
      return res.json(success(data, "Agency agents fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch agency agents"));
    }
  });
  app2.post("/api/agencies/:id/agents", authenticateToken, async (req, res) => {
    try {
      const { data: agency } = await supabase.from("agencies").select("owner_id").eq("id", req.params.id).single();
      if (!agency || agency.owner_id !== req.user?.id && req.user?.role !== "admin") {
        return res.status(403).json(error("Not authorized to add agents to this agency"));
      }
      const { agentId } = req.body;
      if (!agentId) {
        return res.status(400).json(error("Agent ID is required"));
      }
      const { data, error: error2 } = await supabase.from("users").update({ agency_id: req.params.id }).eq("id", agentId).select().single();
      if (error2) throw error2;
      return res.json(success(data, "Agent added to agency successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to add agent to agency"));
    }
  });
  app2.delete("/api/agencies/:id/agents/:agentId", authenticateToken, async (req, res) => {
    try {
      const { data: agency } = await supabase.from("agencies").select("owner_id").eq("id", req.params.id).single();
      if (!agency || agency.owner_id !== req.user?.id && req.user?.role !== "admin") {
        return res.status(403).json(error("Not authorized to remove agents from this agency"));
      }
      const { error: error2 } = await supabase.from("users").update({ agency_id: null }).eq("id", req.params.agentId).eq("agency_id", req.params.id);
      if (error2) throw error2;
      return res.json(success(null, "Agent removed from agency successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to remove agent from agency"));
    }
  });
  app2.get("/api/agents", async (req, res) => {
    try {
      const { specialty, search, location } = req.query;
      let query = supabase.from("users").select(`
          id, full_name, email, phone, profile_image, bio,
          license_number, license_state, license_expiry, license_verified,
          specialties, years_experience, total_sales, rating, review_count, location,
          agency:agency_id (id, name, logo)
        `).eq("role", "agent").is("deleted_at", null);
      if (location) {
        query = query.ilike("location", `%${location}%`);
      }
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,location.ilike.%${search}%`);
      }
      const { data, error: error2 } = await query.order("rating", { ascending: false, nullsFirst: false });
      if (error2) throw error2;
      let filteredData = data || [];
      if (specialty && specialty !== "all") {
        filteredData = filteredData.filter(
          (agent) => agent.specialties?.includes(specialty)
        );
      }
      return res.json(success(filteredData, "Agents fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch agents"));
    }
  });
  app2.get("/api/agents/:id", async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("users").select(`
          id, full_name, email, phone, profile_image, bio,
          license_number, license_state, license_expiry, license_verified,
          specialties, years_experience, total_sales, rating, review_count, location,
          agency:agency_id (id, name, logo, website, phone, email)
        `).eq("id", req.params.id).eq("role", "agent").single();
      if (error2) throw error2;
      return res.json(success(data, "Agent fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch agent"));
    }
  });
  app2.patch("/api/agents/:id/profile", authenticateToken, async (req, res) => {
    try {
      if (req.user?.id !== req.params.id && req.user?.role !== "admin") {
        return res.status(403).json(error("Not authorized to update this profile"));
      }
      const allowedFields = [
        "bio",
        "profile_image",
        "phone",
        "location",
        "license_number",
        "license_state",
        "license_expiry",
        "specialties",
        "years_experience"
      ];
      const updateData = {};
      for (const field of allowedFields) {
        if (req.body[field] !== void 0) {
          updateData[field] = req.body[field];
        }
      }
      updateData.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      const { data, error: error2 } = await supabase.from("users").update(updateData).eq("id", req.params.id).select().single();
      if (error2) throw error2;
      return res.json(success(data, "Agent profile updated successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to update agent profile"));
    }
  });
  app2.get("/api/agents/:id/properties", async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("properties").select("*").eq("listing_agent_id", req.params.id).is("deleted_at", null).order("created_at", { ascending: false });
      if (error2) throw error2;
      return res.json(success(data, "Agent properties fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch agent properties"));
    }
  });
  app2.get("/api/agents/:id/reviews", async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("agent_reviews").select(`
          *,
          reviewer:reviewer_id (id, full_name, profile_image)
        `).eq("agent_id", req.params.id).order("created_at", { ascending: false });
      if (error2) throw error2;
      return res.json(success(data, "Agent reviews fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch agent reviews"));
    }
  });
  app2.post("/api/agents/:id/reviews", authenticateToken, async (req, res) => {
    try {
      const validation = insertAgentReviewSchema.safeParse({
        ...req.body,
        agentId: req.params.id,
        reviewerId: req.user?.id
      });
      if (!validation.success) {
        return res.status(400).json(error(validation.error.errors[0].message));
      }
      const { data, error: error2 } = await supabase.from("agent_reviews").insert({
        agent_id: req.params.id,
        reviewer_id: req.user?.id,
        rating: req.body.rating,
        title: req.body.title,
        comment: req.body.comment,
        would_recommend: req.body.wouldRecommend ?? true,
        transaction_id: req.body.transactionId
      }).select().single();
      if (error2) {
        if (error2.code === "23505") {
          return res.status(400).json(error("You have already reviewed this agent"));
        }
        throw error2;
      }
      const { data: reviews2 } = await supabase.from("agent_reviews").select("rating").eq("agent_id", req.params.id);
      if (reviews2 && reviews2.length > 0) {
        const avgRating = reviews2.reduce((acc, r) => acc + r.rating, 0) / reviews2.length;
        await supabase.from("users").update({
          rating: avgRating.toFixed(2),
          review_count: reviews2.length
        }).eq("id", req.params.id);
      }
      return res.json(success(data, "Review submitted successfully"));
    } catch (err) {
      console.error("[AGENT REVIEW] Error:", err);
      return res.status(500).json(error("Failed to submit review"));
    }
  });
  app2.get("/api/transactions", authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;
      let query = supabase.from("transactions").select(`
          *,
          property:property_id (id, title, address, city, state),
          agent:agent_id (id, full_name, email),
          agency:agency_id (id, name),
          buyer:buyer_id (id, full_name, email)
        `);
      if (role === "agent") {
        query = query.eq("agent_id", userId);
      } else if (role !== "admin") {
        const { data: userAgency } = await supabase.from("agencies").select("id").eq("owner_id", userId).single();
        if (userAgency) {
          query = query.eq("agency_id", userAgency.id);
        } else {
          query = query.eq("agent_id", userId);
        }
      }
      const { data, error: error2 } = await query.order("created_at", { ascending: false });
      if (error2) throw error2;
      return res.json(success(data, "Transactions fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch transactions"));
    }
  });
  app2.post("/api/transactions", authenticateToken, async (req, res) => {
    try {
      const validation = insertTransactionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(error(validation.error.errors[0].message));
      }
      const transactionAmount = parseFloat(req.body.transactionAmount || "0");
      const commissionRate = parseFloat(req.body.commissionRate || "3");
      const agentSplit = parseFloat(req.body.agentSplit || "70");
      const commissionAmount = transactionAmount * commissionRate / 100;
      const agentCommission = commissionAmount * agentSplit / 100;
      const agencyCommission = commissionAmount - agentCommission;
      const { data, error: error2 } = await supabase.from("transactions").insert({
        ...validation.data,
        commission_amount: commissionAmount,
        agent_commission: agentCommission,
        agency_commission: agencyCommission
      }).select().single();
      if (error2) throw error2;
      if (req.body.agentId && req.body.status === "completed") {
        await supabase.rpc("increment_agent_sales", { agent_id: req.body.agentId });
      }
      return res.json(success(data, "Transaction created successfully"));
    } catch (err) {
      console.error("[TRANSACTION] Create error:", err);
      return res.status(500).json(error("Failed to create transaction"));
    }
  });
  app2.patch("/api/transactions/:id/status", authenticateToken, async (req, res) => {
    try {
      const { status } = req.body;
      const updateData = { status, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
      if (status === "completed") {
        updateData.closed_at = (/* @__PURE__ */ new Date()).toISOString();
      }
      const { data, error: error2 } = await supabase.from("transactions").update(updateData).eq("id", req.params.id).select().single();
      if (error2) throw error2;
      if (status === "completed" && data.agent_id) {
        const { data: agent } = await supabase.from("users").select("total_sales").eq("id", data.agent_id).single();
        await supabase.from("users").update({ total_sales: (agent?.total_sales || 0) + 1 }).eq("id", data.agent_id);
      }
      return res.json(success(data, "Transaction status updated successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to update transaction status"));
    }
  });
  app2.get("/api/admin/personas", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("users").select("*").eq("is_managed_profile", true).is("deleted_at", null).order("created_at", { ascending: false });
      if (error2) throw error2;
      return res.json(success(data, "Personas fetched successfully"));
    } catch (err) {
      console.error("[ADMIN] Get personas error:", err);
      return res.status(500).json(error("Failed to fetch personas"));
    }
  });
  app2.post("/api/admin/personas", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { fullName, email, displayEmail, displayPhone, role, bio, profileImage, location, specialties, yearsExperience } = req.body;
      if (!fullName || !email) {
        return res.status(400).json(error("Full name and email are required"));
      }
      const { data, error: error2 } = await supabase.from("users").insert({
        email,
        full_name: fullName,
        display_email: displayEmail || email,
        display_phone: displayPhone || null,
        role: role || "agent",
        bio: bio || null,
        profile_image: profileImage || null,
        location: location || null,
        specialties: specialties || null,
        years_experience: yearsExperience || null,
        is_managed_profile: true,
        managed_by: req.user.id,
        password_hash: "managed_profile_no_login"
        // Managed profiles can't login
      }).select().single();
      if (error2) throw error2;
      return res.json(success(data, "Persona created successfully"));
    } catch (err) {
      console.error("[ADMIN] Create persona error:", err);
      if (err.message?.includes("duplicate") || err.code === "23505") {
        return res.status(400).json(error("A user with this email already exists"));
      }
      return res.status(500).json(error("Failed to create persona"));
    }
  });
  app2.patch("/api/admin/personas/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const personaId = req.params.id;
      const { data: existing, error: checkError } = await supabase.from("users").select("id, is_managed_profile, managed_by").eq("id", personaId).single();
      if (checkError || !existing) {
        return res.status(404).json(error("Persona not found"));
      }
      if (!existing.is_managed_profile) {
        return res.status(400).json(error("This user is not a managed persona"));
      }
      const { fullName, displayEmail, displayPhone, role, bio, profileImage, location, specialties, yearsExperience } = req.body;
      const updateData = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
      if (fullName !== void 0) updateData.full_name = fullName;
      if (displayEmail !== void 0) updateData.display_email = displayEmail;
      if (displayPhone !== void 0) updateData.display_phone = displayPhone;
      if (role !== void 0) updateData.role = role;
      if (bio !== void 0) updateData.bio = bio;
      if (profileImage !== void 0) updateData.profile_image = profileImage;
      if (location !== void 0) updateData.location = location;
      if (specialties !== void 0) updateData.specialties = specialties;
      if (yearsExperience !== void 0) updateData.years_experience = yearsExperience;
      const { data, error: error2 } = await supabase.from("users").update(updateData).eq("id", personaId).select().single();
      if (error2) throw error2;
      return res.json(success(data, "Persona updated successfully"));
    } catch (err) {
      console.error("[ADMIN] Update persona error:", err);
      return res.status(500).json(error("Failed to update persona"));
    }
  });
  app2.delete("/api/admin/personas/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const personaId = req.params.id;
      const { data: existing, error: checkError } = await supabase.from("users").select("id, is_managed_profile").eq("id", personaId).single();
      if (checkError || !existing) {
        return res.status(404).json(error("Persona not found"));
      }
      if (!existing.is_managed_profile) {
        return res.status(400).json(error("Cannot delete a non-managed user from this endpoint"));
      }
      const { error: error2 } = await supabase.from("users").update({ deleted_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", personaId);
      if (error2) throw error2;
      return res.json(success(null, "Persona deleted successfully"));
    } catch (err) {
      console.error("[ADMIN] Delete persona error:", err);
      return res.status(500).json(error("Failed to delete persona"));
    }
  });
  app2.get("/api/admin/settings", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("admin_settings").select("*");
      if (error2) throw error2;
      const settings = {};
      (data || []).forEach((item) => {
        settings[item.key] = item.value;
      });
      return res.json(success(settings, "Settings fetched successfully"));
    } catch (err) {
      console.error("[ADMIN] Get settings error:", err);
      return res.status(500).json(error("Failed to fetch settings"));
    }
  });
  app2.post("/api/admin/settings", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { key, value } = req.body;
      if (!key) {
        return res.status(400).json(error("Setting key is required"));
      }
      const { data, error: error2 } = await supabase.from("admin_settings").upsert({ key, value, updated_at: (/* @__PURE__ */ new Date()).toISOString() }, { onConflict: "key" }).select().single();
      if (error2) throw error2;
      return res.json(success(data, "Setting saved successfully"));
    } catch (err) {
      console.error("[ADMIN] Save setting error:", err);
      return res.status(500).json(error("Failed to save setting"));
    }
  });
  app2.get("/api/conversations", authenticateToken, async (req, res) => {
    try {
      const { data: participations, error: partError } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", req.user.id);
      if (partError) throw partError;
      if (!participations || participations.length === 0) {
        return res.json(success([], "No conversations found"));
      }
      const conversationIds = participations.map((p) => p.conversation_id);
      const { data: conversations2, error: error2 } = await supabase.from("conversations").select(`
          *,
          properties:property_id(id, title, address, images),
          conversation_participants(user_id, last_read_at, users:user_id(id, full_name, email, profile_image)),
          messages(id, content, sender_id, created_at)
        `).in("id", conversationIds).order("updated_at", { ascending: false });
      if (error2) throw error2;
      const enrichedConversations = (conversations2 || []).map((conv) => {
        const lastMessage = conv.messages?.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        const myParticipation = conv.conversation_participants?.find((p) => p.user_id === req.user.id);
        const unreadCount = conv.messages?.filter(
          (m) => m.sender_id !== req.user.id && (!myParticipation?.last_read_at || new Date(m.created_at) > new Date(myParticipation.last_read_at))
        ).length || 0;
        return {
          ...conv,
          lastMessage,
          unreadCount,
          participants: conv.conversation_participants?.map((p) => p.users).filter(Boolean)
        };
      });
      return res.json(success(enrichedConversations, "Conversations fetched successfully"));
    } catch (err) {
      console.error("[MESSAGING] Get conversations error:", err);
      return res.status(500).json(error("Failed to fetch conversations"));
    }
  });
  app2.get("/api/conversations/:id", authenticateToken, async (req, res) => {
    try {
      const { data: participation } = await supabase.from("conversation_participants").select("id").eq("conversation_id", req.params.id).eq("user_id", req.user.id).single();
      if (!participation) {
        return res.status(403).json(error("Not authorized to view this conversation"));
      }
      const { data: conversation, error: error2 } = await supabase.from("conversations").select(`
          *,
          properties:property_id(id, title, address, images),
          conversation_participants(user_id, last_read_at, users:user_id(id, full_name, email, profile_image)),
          messages(id, content, sender_id, message_type, attachments, created_at, users:sender_id(id, full_name, profile_image))
        `).eq("id", req.params.id).single();
      if (error2) throw error2;
      if (conversation?.messages) {
        conversation.messages = conversation.messages.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
      return res.json(success(conversation, "Conversation fetched successfully"));
    } catch (err) {
      console.error("[MESSAGING] Get conversation error:", err);
      return res.status(500).json(error("Failed to fetch conversation"));
    }
  });
  app2.post("/api/conversations", authenticateToken, async (req, res) => {
    try {
      const { propertyId, applicationId, recipientId, subject, initialMessage } = req.body;
      if (!recipientId) {
        return res.status(400).json(error("Recipient is required"));
      }
      const { data: conversation, error: convError } = await supabase.from("conversations").insert([{ property_id: propertyId, application_id: applicationId, subject }]).select().single();
      if (convError) throw convError;
      await supabase.from("conversation_participants").insert([
        { conversation_id: conversation.id, user_id: req.user.id },
        { conversation_id: conversation.id, user_id: recipientId }
      ]);
      if (initialMessage) {
        await supabase.from("messages").insert([{
          conversation_id: conversation.id,
          sender_id: req.user.id,
          content: initialMessage
        }]);
      }
      return res.json(success(conversation, "Conversation created successfully"));
    } catch (err) {
      console.error("[MESSAGING] Create conversation error:", err);
      return res.status(500).json(error("Failed to create conversation"));
    }
  });
  app2.post("/api/conversations/:id/messages", authenticateToken, async (req, res) => {
    try {
      const { data: participation } = await supabase.from("conversation_participants").select("id").eq("conversation_id", req.params.id).eq("user_id", req.user.id).single();
      if (!participation) {
        return res.status(403).json(error("Not authorized to send messages to this conversation"));
      }
      const { content, messageType, attachments } = req.body;
      if (!content?.trim()) {
        return res.status(400).json(error("Message content is required"));
      }
      const { data: message, error: error2 } = await supabase.from("messages").insert([{
        conversation_id: req.params.id,
        sender_id: req.user.id,
        content: content.trim(),
        message_type: messageType || "text",
        attachments: attachments || null
      }]).select(`*, users:sender_id(id, full_name, profile_image)`).single();
      if (error2) throw error2;
      await supabase.from("conversations").update({ updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", req.params.id);
      return res.json(success(message, "Message sent successfully"));
    } catch (err) {
      console.error("[MESSAGING] Send message error:", err);
      return res.status(500).json(error("Failed to send message"));
    }
  });
  app2.patch("/api/conversations/:id/read", authenticateToken, async (req, res) => {
    try {
      const { error: error2 } = await supabase.from("conversation_participants").update({ last_read_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("conversation_id", req.params.id).eq("user_id", req.user.id);
      if (error2) throw error2;
      return res.json(success(null, "Conversation marked as read"));
    } catch (err) {
      console.error("[MESSAGING] Mark read error:", err);
      return res.status(500).json(error("Failed to mark conversation as read"));
    }
  });
  app2.post("/api/push/subscribe", authenticateToken, async (req, res) => {
    try {
      const { endpoint, keys } = req.body;
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return res.status(400).json({ error: "Invalid subscription data" });
      }
      const { data: existing } = await supabase.from("push_subscriptions").select("id").eq("user_id", req.user.id).eq("endpoint", endpoint).single();
      if (existing) {
        const { error: error3 } = await supabase.from("push_subscriptions").update({
          p256dh: keys.p256dh,
          auth: keys.auth,
          user_agent: req.headers["user-agent"] || null,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }).eq("id", existing.id);
        if (error3) throw error3;
        return res.json(success({ subscribed: true }, "Push subscription updated"));
      }
      const { error: error2 } = await supabase.from("push_subscriptions").insert([{
        user_id: req.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: req.headers["user-agent"] || null
      }]);
      if (error2) throw error2;
      return res.json(success({ subscribed: true }, "Push subscription created"));
    } catch (err) {
      console.error("[PUSH] Subscribe error:", err);
      return res.status(500).json(error("Failed to subscribe to push notifications"));
    }
  });
  app2.post("/api/push/unsubscribe", authenticateToken, async (req, res) => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) {
        return res.status(400).json({ error: "Endpoint is required" });
      }
      const { error: error2 } = await supabase.from("push_subscriptions").delete().eq("user_id", req.user.id).eq("endpoint", endpoint);
      if (error2) throw error2;
      return res.json(success({ unsubscribed: true }, "Push subscription removed"));
    } catch (err) {
      console.error("[PUSH] Unsubscribe error:", err);
      return res.status(500).json(error("Failed to unsubscribe from push notifications"));
    }
  });
  app2.get("/api/push/status", authenticateToken, async (req, res) => {
    try {
      const { data, error: error2 } = await supabase.from("push_subscriptions").select("id, endpoint, created_at").eq("user_id", req.user.id);
      if (error2) throw error2;
      return res.json(success({
        subscribed: data && data.length > 0,
        subscriptions: data?.length || 0
      }, "Push status retrieved"));
    } catch (err) {
      console.error("[PUSH] Status error:", err);
      return res.status(500).json(error("Failed to get push status"));
    }
  });
  app2.get("/api/agencies/:id/stats", authenticateToken, async (req, res) => {
    try {
      const agencyId = req.params.id;
      const [agentsResult, transactionsResult, propertiesResult] = await Promise.all([
        supabase.from("users").select("id, total_sales, rating").eq("agency_id", agencyId).is("deleted_at", null),
        supabase.from("transactions").select("*").eq("agency_id", agencyId),
        supabase.from("properties").select("id, status").eq("agency_id", agencyId).is("deleted_at", null)
      ]);
      const agents = agentsResult.data || [];
      const transactions2 = transactionsResult.data || [];
      const properties2 = propertiesResult.data || [];
      const completedTransactions = transactions2.filter((t) => t.status === "completed");
      const totalRevenue = completedTransactions.reduce((acc, t) => acc + parseFloat(t.agency_commission || "0"), 0);
      const totalCommissions = completedTransactions.reduce((acc, t) => acc + parseFloat(t.commission_amount || "0"), 0);
      const stats = {
        totalAgents: agents.length,
        totalProperties: properties2.length,
        activeListings: properties2.filter((p) => p.status === "active").length,
        totalTransactions: transactions2.length,
        completedTransactions: completedTransactions.length,
        pendingTransactions: transactions2.filter((t) => t.status === "pending").length,
        totalRevenue,
        totalCommissions,
        averageAgentRating: agents.length > 0 ? agents.reduce((acc, a) => acc + parseFloat(a.rating || "0"), 0) / agents.length : 0,
        totalSales: agents.reduce((acc, a) => acc + (a.total_sales || 0), 0)
      };
      return res.json(success(stats, "Agency stats fetched successfully"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch agency stats"));
    }
  });
  app2.get("/api/applications/:applicationId/payments", authenticateToken, async (req, res) => {
    try {
      const applicationId = req.params.applicationId;
      const { data: application } = await supabase.from("applications").select("user_id, properties(owner_id)").eq("id", applicationId).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const isTenant = application.user_id === req.user.id;
      const isLandlord = application.properties?.[0]?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isTenant && !isLandlord && !isAdmin) {
        return res.status(403).json({ error: "Not authorized to view payments" });
      }
      const { data: lease } = await supabase.from("leases").select("id").eq("application_id", applicationId).single();
      if (!lease) {
        return res.json(success([], "No lease found for this application"));
      }
      const { data: payments2, error: error2 } = await supabase.from("payments").select("*, verified_by_user:users!payments_verified_by_fkey(full_name)").eq("lease_id", lease.id).order("created_at", { ascending: false });
      if (error2) throw error2;
      const now = /* @__PURE__ */ new Date();
      const enrichedPayments = (payments2 || []).map((p) => {
        const dueDate = new Date(p.due_date);
        const isOverdue = p.status === "pending" && dueDate < now;
        return {
          ...p,
          status: isOverdue ? "overdue" : p.status
        };
      });
      return res.json(success(enrichedPayments, "Payments retrieved successfully"));
    } catch (err) {
      console.error("[PAYMENTS] Get error:", err);
      return res.status(500).json(error("Failed to retrieve payments"));
    }
  });
  app2.get("/api/applications/:applicationId/security-deposit", authenticateToken, async (req, res) => {
    try {
      const applicationId = req.params.applicationId;
      const { data: application } = await supabase.from("applications").select("user_id, lease_status, properties(owner_id)").eq("id", applicationId).limit(1).maybeSingle();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const isTenant = application.user_id === req.user.id;
      const isLandlord = application.properties?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isTenant && !isLandlord && !isAdmin) {
        return res.status(403).json({ error: "Not authorized to view deposit status" });
      }
      const { data: lease } = await supabase.from("leases").select("id, security_deposit_amount").eq("application_id", applicationId).limit(1).maybeSingle();
      if (!lease) {
        return res.json(success({
          required: false,
          leaseStatus: application.lease_status,
          message: "No lease found - deposit not required yet"
        }, "Deposit status retrieved"));
      }
      const { data: payment } = await supabase.from("payments").select("id, amount, status, due_date, paid_at, verified_at, verified_by").eq("lease_id", lease.id).eq("type", "security_deposit").limit(1).maybeSingle();
      return res.json(success({
        required: true,
        leaseStatus: application.lease_status,
        securityDepositAmount: lease.security_deposit_amount,
        payment: payment || null,
        message: payment ? `Security deposit is ${payment.status}` : "Security deposit payment not found"
      }, "Deposit status retrieved"));
    } catch (err) {
      console.error("[PAYMENTS] Security deposit status error:", err);
      return res.status(500).json(error("Failed to retrieve deposit status"));
    }
  });
  app2.post("/api/payments/:paymentId/verify", authenticateToken, async (req, res) => {
    try {
      const paymentId = req.params.paymentId;
      const { amount, method, dateReceived } = req.body;
      if (!amount || !method || !dateReceived) {
        return res.status(400).json({ error: "Amount, method, and date received are required" });
      }
      const { data: payment } = await supabase.from("payments").select("*, leases(landlord_id, application_id, tenant_id)").eq("id", paymentId).single();
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      const isLandlord = payment.leases?.landlord_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isLandlord && !isAdmin) {
        return res.status(403).json({ error: "Only landlord or admin can verify payments" });
      }
      if (payment.status === "verified") {
        return res.status(400).json({ error: "Payment already verified" });
      }
      const { error: error2 } = await supabase.from("payments").update({
        status: "verified",
        verified_by: req.user.id,
        verified_at: (/* @__PURE__ */ new Date()).toISOString(),
        paid_at: new Date(dateReceived).toISOString(),
        manual_payment_method: method,
        amount: parseFloat(amount),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", paymentId);
      if (error2) throw error2;
      await logPaymentAction(
        req.user.id,
        paymentId,
        "payment_verified",
        payment.status,
        "verified",
        {
          method,
          amount,
          dateReceived,
          type: payment.type,
          verifiedByRole: req.user.role
        },
        req
      );
      try {
        const { data: tenantData } = await supabase.from("users").select("full_name").eq("id", payment.leases?.tenant_id).single();
        if (tenantData?.full_name) {
          await sendPaymentVerifiedNotification(
            paymentId,
            payment.leases?.tenant_id,
            payment.type === "rent" ? "Rent" : "Security Deposit",
            amount.toString()
          );
        }
      } catch (notificationErr) {
        console.error("[PAYMENTS] Failed to send verification notification:", notificationErr);
      }
      return res.json(success(
        { status: "verified", message: "Payment verified." },
        "Payment verified successfully"
      ));
    } catch (err) {
      console.error("[PAYMENTS] Verify error:", err);
      return res.status(500).json(error("Failed to verify payment"));
    }
  });
  app2.post("/api/payments/:paymentId/mark-paid", authenticateToken, async (req, res) => {
    try {
      const paymentId = req.params.paymentId;
      const { referenceId, notes } = req.body;
      const { data: payment } = await supabase.from("payments").select("*, leases(tenant_id)").eq("id", paymentId).single();
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      const isTenant = payment.leases?.tenant_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isTenant && !isAdmin) {
        return res.status(403).json({ error: "Only tenant can mark their own payment as paid" });
      }
      if (payment.status === "verified" || payment.status === "paid") {
        return res.status(400).json({ error: "Payment already processed" });
      }
      const { error: error2 } = await supabase.from("payments").update({
        status: "paid",
        paid_at: (/* @__PURE__ */ new Date()).toISOString(),
        reference_id: referenceId || null,
        notes: notes || null,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", paymentId);
      if (error2) throw error2;
      await logPaymentAction(
        req.user.id,
        paymentId,
        "payment_marked_paid",
        payment.status,
        "paid",
        {
          referenceId,
          notes,
          amount: payment.amount,
          type: payment.type
        },
        req
      );
      try {
        const { data: tenantData } = await supabase.from("users").select("full_name").eq("id", req.user.id).single();
        if (tenantData?.full_name) {
          await sendPaymentReceivedNotification(
            paymentId,
            tenantData.full_name,
            payment.type === "rent" ? "Rent" : "Security Deposit",
            payment.amount.toString()
          );
        }
      } catch (notificationErr) {
        console.error("[PAYMENTS] Failed to send notification:", notificationErr);
      }
      return res.json(success({ status: "paid" }, "Payment marked as paid - awaiting verification"));
    } catch (err) {
      console.error("[PAYMENTS] Mark paid error:", err);
      return res.status(500).json(error("Failed to mark payment as paid"));
    }
  });
  app2.get("/api/payments/:paymentId/receipt", authenticateToken, async (req, res) => {
    try {
      const paymentId = req.params.paymentId;
      const { data: payment } = await supabase.from("payments").select(`
          id,
          type,
          amount,
          due_date,
          paid_at,
          verified_at,
          reference_id,
          status,
          created_at,
          leases(
            id,
            application_id,
            monthly_rent,
            security_deposit_amount,
            applications(
              id,
              property_id,
              tenant_id,
              properties(title, address),
              users(full_name, email)
            )
          ),
          verified_by_user:users!payments_verified_by_fkey(full_name, email)
        `).eq("id", paymentId).single();
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      const isTenant = payment.leases?.[0]?.applications?.[0]?.tenant_id === req.user.id;
      const isLandlord = payment.leases?.[0]?.applications?.[0]?.properties?.[0]?.owner_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isTenant && !isLandlord && !isAdmin) {
        return res.status(403).json({ error: "Not authorized to view this receipt" });
      }
      const paymentAny = payment;
      const receipt = {
        receiptNumber: `RCP-${payment.id.substring(0, 8).toUpperCase()}`,
        paymentId: payment.id,
        type: payment.type === "rent" ? "Monthly Rent" : "Security Deposit",
        amount: parseFloat(payment.amount.toString()),
        dueDate: payment.due_date,
        paidDate: payment.paid_at || payment.verified_at,
        verificationDate: payment.verified_at,
        status: payment.status,
        referenceId: payment.reference_id,
        property: {
          title: paymentAny.leases?.[0]?.applications?.[0]?.properties?.[0]?.title,
          address: paymentAny.leases?.[0]?.applications?.[0]?.properties?.[0]?.address
        },
        tenant: {
          name: paymentAny.leases?.[0]?.applications?.[0]?.users?.[0]?.full_name,
          email: paymentAny.leases?.[0]?.applications?.[0]?.users?.[0]?.email
        },
        verifiedBy: paymentAny.verified_by_user?.full_name || "Pending verification",
        createdAt: payment.created_at
      };
      return res.json(success(receipt, "Receipt retrieved successfully"));
    } catch (err) {
      console.error("[PAYMENTS] Receipt error:", err);
      return res.status(500).json(error("Failed to retrieve receipt"));
    }
  });
  app2.get("/api/leases/:leaseId/payment-history", authenticateToken, async (req, res) => {
    try {
      const leaseId = req.params.leaseId;
      const { data: lease } = await supabase.from("leases").select("id, landlord_id, tenant_id, monthly_rent, security_deposit_amount, applications(property_id, properties(title, address))").eq("id", leaseId).single();
      if (!lease) {
        return res.status(404).json({ error: "Lease not found" });
      }
      const isLandlord = lease.landlord_id === req.user.id;
      const isTenant = lease.tenant_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isLandlord && !isTenant && !isAdmin) {
        return res.status(403).json({ error: "Not authorized to view payment history" });
      }
      const { data: payments2, error: error2 } = await supabase.from("payments").select("*, verified_by_user:users!payments_verified_by_fkey(full_name)").eq("lease_id", leaseId).order("due_date", { ascending: false });
      if (error2) throw error2;
      const now = /* @__PURE__ */ new Date();
      const enrichedPayments = (payments2 || []).map((p) => {
        const dueDate = new Date(p.due_date);
        const isOverdue = p.status === "pending" && dueDate < now;
        return {
          ...p,
          status: isOverdue ? "overdue" : p.status
        };
      });
      const summary = {
        totalPayments: enrichedPayments.length,
        verified: enrichedPayments.filter((p) => p.status === "verified").length,
        paid: enrichedPayments.filter((p) => p.status === "paid").length,
        pending: enrichedPayments.filter((p) => p.status === "pending").length,
        overdue: enrichedPayments.filter((p) => p.status === "overdue").length,
        totalVerifiedAmount: enrichedPayments.filter((p) => p.status === "verified").reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0),
        totalOutstandingAmount: enrichedPayments.filter((p) => ["pending", "overdue"].includes(p.status)).reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
      };
      return res.json(success({
        lease: {
          id: lease.id,
          property: lease.applications?.[0]?.properties,
          monthlyRent: lease.monthly_rent,
          securityDepositAmount: lease.security_deposit_amount
        },
        payments: enrichedPayments,
        summary
      }, "Payment history retrieved successfully"));
    } catch (err) {
      console.error("[PAYMENTS] History error:", err);
      return res.status(500).json(error("Failed to retrieve payment history"));
    }
  });
  app2.post("/api/leases/:leaseId/generate-rent-payments", authenticateToken, async (req, res) => {
    try {
      const leaseId = req.params.leaseId;
      const { gracePeriodDays = 0 } = req.body;
      const { data: lease, error: leaseError } = await supabase.from("leases").select("id, tenant_id, landlord_id, monthly_rent, rent_due_day, lease_start_date, lease_end_date").eq("id", leaseId).single();
      if (leaseError || !lease) {
        return res.status(404).json({ error: "Lease not found" });
      }
      const isTenant = lease.tenant_id === req.user.id;
      const isLandlord = lease.landlord_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isTenant && !isLandlord && !isAdmin) {
        return res.status(403).json({ error: "Not authorized to generate rent payments" });
      }
      const startDate = new Date(lease.lease_start_date);
      const endDate = new Date(lease.lease_end_date);
      const rentDueDay = lease.rent_due_day || 1;
      const rentAmount = parseFloat(lease.monthly_rent.toString());
      const gracePeriodMs = gracePeriodDays * 24 * 60 * 60 * 1e3;
      const paymentsToCreate = [];
      const currentDate = new Date(startDate);
      while (currentDate < endDate) {
        const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), rentDueDay);
        if (dueDate < startDate) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }
        if (dueDate <= endDate) {
          paymentsToCreate.push({
            lease_id: leaseId,
            tenant_id: lease.tenant_id,
            amount: rentAmount,
            type: "rent",
            status: "pending",
            due_date: dueDate.toISOString()
          });
        }
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      if (paymentsToCreate.length === 0) {
        return res.json(success({ created: 0, message: "No rent payments to create for lease period" }, "No payments generated"));
      }
      const { data: existingPayments, error: existingError } = await supabase.from("payments").select("due_date, type").eq("lease_id", leaseId).eq("type", "rent");
      if (existingError) throw existingError;
      const existingDates = new Set(existingPayments?.map((p) => new Date(p.due_date).toDateString()) || []);
      const newPayments = paymentsToCreate.filter(
        (p) => !existingDates.has(new Date(p.due_date).toDateString())
      );
      if (newPayments.length === 0) {
        return res.json(success({ created: 0, message: "All rent payments already exist" }, "No duplicate payments created"));
      }
      const { data: inserted, error: insertError } = await supabase.from("payments").insert(newPayments).select();
      if (insertError) throw insertError;
      await logAuditEvent({
        userId: req.user.id,
        action: "create",
        resourceType: "payment",
        resourceId: leaseId,
        previousData: {},
        newData: { count: inserted?.length || 0, type: "rent" },
        req
      });
      return res.json(success({
        created: inserted?.length || 0,
        payments: inserted || [],
        message: `Generated ${inserted?.length || 0} rent payment records`
      }, "Rent payments generated successfully"));
    } catch (err) {
      console.error("[PAYMENTS] Generate rent error:", err);
      return res.status(500).json(error("Failed to generate rent payments"));
    }
  });
  app2.delete("/api/payments/:paymentId", authenticateToken, async (req, res) => {
    await logPaymentAction(
      req.user.id,
      req.params.paymentId,
      "payment_delete_blocked",
      void 0,
      void 0,
      {
        attemptedBy: req.user.id,
        role: req.user.role,
        reason: "Payment deletion is blocked for financial accountability"
      },
      req
    );
    return res.status(403).json({
      error: "Payment records cannot be deleted for audit and compliance purposes",
      code: "PAYMENT_DELETE_BLOCKED"
    });
  });
  app2.get("/api/payments/audit-logs", authenticateToken, async (req, res) => {
    try {
      const isAdmin = req.user.role === "admin";
      const isLandlord = req.user.role === "landlord";
      const isPropertyManager = req.user.role === "property_manager";
      if (!isAdmin && !isLandlord && !isPropertyManager) {
        return res.status(403).json({ error: "Only admins, landlords, and property managers can view payment audit logs" });
      }
      const paymentId = req.query.paymentId;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);
      const { logs, total } = await getPaymentAuditLogs(paymentId, page, limit);
      return res.json(success({
        logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }, "Payment audit logs retrieved successfully"));
    } catch (err) {
      console.error("[PAYMENTS] Audit logs error:", err);
      return res.status(500).json(error("Failed to retrieve payment audit logs"));
    }
  });
  app2.get("/api/manager/applications", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== "property_manager") {
        return res.status(403).json({ error: "Only property managers can access this endpoint" });
      }
      const { propertyId, status, page = "1" } = req.query;
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limit = 20;
      const offset = (pageNum - 1) * limit;
      let query = supabase.from("applications").select("*, properties(owner_id, title), users(full_name, email)", { count: "exact" });
      if (propertyId) {
        const { data: assignment } = await supabase.from("property_manager_assignments").select("id").eq("property_manager_id", req.user.id).eq("property_id", propertyId).is("revoked_at", null).single();
        if (!assignment) {
          return res.status(403).json({ error: "Not assigned to this property" });
        }
        query = query.eq("property_id", propertyId);
      } else {
        const { data: assignments } = await supabase.from("property_manager_assignments").select("property_id").eq("property_manager_id", req.user.id).is("revoked_at", null);
        const propertyIds = assignments?.map((a) => a.property_id) || [];
        if (propertyIds.length === 0) {
          return res.json(success({ applications: [], pagination: { page: pageNum, limit, total: 0, totalPages: 0 } }));
        }
        query = query.in("property_id", propertyIds);
      }
      if (status) {
        query = query.eq("status", status);
      }
      const { data, error: error2, count } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
      if (error2) throw error2;
      const totalPages = Math.ceil((count || 0) / limit);
      return res.json(success({
        applications: data,
        pagination: { page: pageNum, limit, total: count || 0, totalPages }
      }, "Applications fetched"));
    } catch (err) {
      return res.status(500).json(error("Failed to fetch applications"));
    }
  });
  app2.post("/api/manager/applications/:id/review", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== "property_manager") {
        return res.status(403).json({ error: "Only property managers can review applications" });
      }
      const { data: application } = await supabase.from("applications").select("property_id, status").eq("id", req.params.id).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const { data: assignment } = await supabase.from("property_manager_assignments").select("id").eq("property_manager_id", req.user.id).eq("property_id", application.property_id).is("revoked_at", null).single();
      if (!assignment) {
        return res.status(403).json({ error: "Not assigned to this property" });
      }
      const { data, error: error2 } = await supabase.from("applications").update({
        status: "under_review",
        reviewed_by: req.user.id,
        reviewed_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", req.params.id).select().single();
      if (error2) throw error2;
      await logApplicationChange(
        req.user.id,
        req.params.id,
        "status_change",
        { status: application.status },
        { status: "under_review" },
        req
      );
      return res.json(success(data, "Application moved to under review"));
    } catch (err) {
      return res.status(500).json(error("Failed to review application"));
    }
  });
  app2.post("/api/manager/applications/:id/approve", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== "property_manager") {
        return res.status(403).json({ error: "Only property managers can approve applications" });
      }
      const { data: application } = await supabase.from("applications").select("property_id, status").eq("id", req.params.id).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const { data: assignment } = await supabase.from("property_manager_assignments").select("id").eq("property_manager_id", req.user.id).eq("property_id", application.property_id).is("revoked_at", null).single();
      if (!assignment) {
        return res.status(403).json({ error: "Not assigned to this property" });
      }
      const { data, error: error2 } = await supabase.from("applications").update({
        status: "approved",
        reviewed_by: req.user.id,
        reviewed_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", req.params.id).select().single();
      if (error2) throw error2;
      await logApplicationChange(
        req.user.id,
        req.params.id,
        "status_change",
        { status: application.status },
        { status: "approved" },
        req
      );
      return res.json(success(data, "Application approved"));
    } catch (err) {
      return res.status(500).json(error("Failed to approve application"));
    }
  });
  app2.post("/api/manager/applications/:id/reject", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== "property_manager") {
        return res.status(403).json({ error: "Only property managers can reject applications" });
      }
      const { rejectionCategory, rejectionReason } = req.body;
      if (!rejectionCategory || !rejectionReason) {
        return res.status(400).json({ error: "Rejection category and reason are required" });
      }
      const { data: application } = await supabase.from("applications").select("property_id, status").eq("id", req.params.id).single();
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const { data: assignment } = await supabase.from("property_manager_assignments").select("id").eq("property_manager_id", req.user.id).eq("property_id", application.property_id).is("revoked_at", null).single();
      if (!assignment) {
        return res.status(403).json({ error: "Not assigned to this property" });
      }
      const { data, error: error2 } = await supabase.from("applications").update({
        status: "rejected",
        rejection_category: rejectionCategory,
        rejection_reason: rejectionReason,
        reviewed_by: req.user.id,
        reviewed_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", req.params.id).select().single();
      if (error2) throw error2;
      await logApplicationChange(
        req.user.id,
        req.params.id,
        "status_change",
        { status: application.status },
        { status: "rejected" },
        req
      );
      return res.json(success(data, "Application rejected"));
    } catch (err) {
      return res.status(500).json(error("Failed to reject application"));
    }
  });
  app2.post("/api/manager/leases/:leaseId/send", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== "property_manager") {
        return res.status(403).json({ error: "Only property managers can send leases" });
      }
      const { data: lease } = await supabase.from("leases").select("application_id, property_id, status").eq("id", req.params.leaseId).single();
      if (!lease) {
        return res.status(404).json({ error: "Lease not found" });
      }
      const { data: assignment } = await supabase.from("property_manager_assignments").select("id").eq("property_manager_id", req.user.id).eq("property_id", lease.property_id).is("revoked_at", null).single();
      if (!assignment) {
        return res.status(403).json({ error: "Not assigned to this property" });
      }
      const { data, error: error2 } = await supabase.from("leases").update({
        status: "lease_sent",
        sent_at: (/* @__PURE__ */ new Date()).toISOString(),
        sent_by: req.user.id,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", req.params.leaseId).select().single();
      if (error2) throw error2;
      await logLeaseAction(
        req.user.id,
        lease.application_id,
        "lease_sent",
        void 0,
        void 0,
        `Manager sent lease to tenant`,
        req
      );
      return res.json(success(data, "Lease sent to tenant"));
    } catch (err) {
      return res.status(500).json(error("Failed to send lease"));
    }
  });
  app2.patch("/api/manager/applications/:id/application-fee", authenticateToken, async (req, res) => {
    try {
      if (req.user.role === "property_manager") {
        await logSecurityEvent(
          req.user.id,
          "login",
          false,
          { reason: "Blocked: Manager attempted to modify application fee" },
          req
        );
        return res.status(403).json({
          error: "Property managers cannot modify application fees",
          code: "PERMISSION_DENIED"
        });
      }
      return res.status(403).json({ error: "Unauthorized" });
    } catch (err) {
      return res.status(500).json(error("Operation failed"));
    }
  });
  app2.get("/api/leases/:leaseId/rent-payments", authenticateToken, async (req, res) => {
    try {
      const leaseId = req.params.leaseId;
      const { data: lease } = await supabase.from("leases").select("tenant_id, landlord_id").eq("id", leaseId).single();
      if (!lease) {
        return res.status(404).json({ error: "Lease not found" });
      }
      const isTenant = lease.tenant_id === req.user.id;
      const isLandlord = lease.landlord_id === req.user.id;
      const isAdmin = req.user.role === "admin";
      if (!isTenant && !isLandlord && !isAdmin) {
        return res.status(403).json({ error: "Not authorized to view rent payments" });
      }
      const { data: payments2, error: error2 } = await supabase.from("payments").select("*").eq("lease_id", leaseId).eq("type", "rent").order("due_date", { ascending: true });
      if (error2) throw error2;
      const grouped = {
        pending: payments2?.filter((p) => p.status === "pending") || [],
        paid: payments2?.filter((p) => p.status === "paid") || [],
        verified: payments2?.filter((p) => p.status === "verified") || [],
        overdue: payments2?.filter((p) => p.status === "overdue") || []
      };
      const stats = {
        totalRent: payments2?.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0,
        pendingAmount: grouped.pending.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0),
        paidAmount: grouped.paid.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0),
        verifiedAmount: grouped.verified.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0),
        overdueAmount: grouped.overdue.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
      };
      return res.json(success({ payments: grouped, stats }, "Rent payments retrieved successfully"));
    } catch (err) {
      console.error("[PAYMENTS] Get rent payments error:", err);
      return res.status(500).json(error("Failed to retrieve rent payments"));
    }
  });
  app2.post("/api/imagekit/upload-token", authenticateToken, async (req, res) => {
    try {
      if (!imagekit_default) {
        return res.status(503).json(error("ImageKit is not configured"));
      }
      const { category = "general" } = req.body;
      const uploadRoles = ["admin", "owner", "agent", "landlord", "property_manager"];
      if (!uploadRoles.includes(req.user.role)) {
        await logSecurityEvent(
          req.user.id,
          "login",
          false,
          { reason: "Unauthorized upload attempt", role: req.user.role },
          req
        );
        return res.status(403).json({ error: "Your role does not have permission to upload" });
      }
      const expirySeconds = 15 * 60;
      const token = imagekit_default.getAuthenticationParameters(
        (Math.floor(Date.now() / 1e3) + expirySeconds).toString()
      );
      return res.json(success({
        token: token.token,
        signature: token.signature,
        expire: token.expire,
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
        category
      }, "Upload token generated successfully"));
    } catch (err) {
      console.error("[IMAGEKIT] Upload token error:", err);
      return res.status(500).json(error("Failed to generate upload token"));
    }
  });
  app2.post("/api/photos", authenticateToken, async (req, res) => {
    try {
      const validation = insertPhotoSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }
      const { imageKitFileId, url, thumbnailUrl, category, propertyId, maintenanceRequestId, metadata } = validation.data;
      if (!PHOTO_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: "Invalid photo category" });
      }
      if (propertyId) {
        const { data: property, error: propError } = await supabase.from("properties").select("owner_id, listing_agent_id").eq("id", propertyId).single();
        if (propError || !property) {
          return res.status(404).json({ error: "Property not found" });
        }
        const hasAccess = property.owner_id === req.user.id || property.listing_agent_id === req.user.id || req.user.role === "admin" || req.user.role === "property_manager";
        if (!hasAccess) {
          await logSecurityEvent(
            req.user.id,
            "unauthorized_access",
            false,
            { reason: "Unauthorized photo upload for property", propertyId },
            req
          );
          return res.status(403).json({ error: "You do not have access to this property" });
        }
        const limitStatus = await checkPropertyImageLimit(supabase, String(propertyId));
        if (!limitStatus.allowed) {
          await logSecurityEvent(
            req.user.id,
            "upload_limit_exceeded",
            false,
            { reason: "Image upload limit exceeded", propertyId, imageCount: limitStatus.imageCount },
            req
          );
          return res.status(400).json({ error: limitStatus.reason });
        }
      }
      if (metadata?.fileSize) {
        const sizeValidation = validateFileSize(metadata?.fileSize);
        if (!sizeValidation.valid) {
          await logSecurityEvent(
            req.user.id,
            "upload_size_exceeded",
            false,
            { reason: "File size exceeds limit", fileSize: metadata?.fileSize, propertyId },
            req
          );
          return res.status(400).json({ error: sizeValidation.reason });
        }
      }
      if (maintenanceRequestId) {
      }
      const { data, error: error2 } = await supabase.from("photos").insert([{
        imagekit_file_id: imageKitFileId,
        url,
        thumbnail_url: thumbnailUrl,
        category,
        uploader_id: req.user.id,
        property_id: propertyId || null,
        maintenance_request_id: maintenanceRequestId || null,
        metadata
      }]).select();
      if (error2) throw error2;
      await logSecurityEvent(
        req.user.id,
        "file_upload",
        true,
        { photoId: data[0].id, category, propertyId },
        req
      );
      await logImageAudit(supabase, {
        actorId: req.user.id,
        actorRole: req.user.role,
        action: "image_upload",
        photoId: data?.[0]?.id,
        propertyId: propertyId ? String(propertyId) : void 0,
        metadata: { category, url }
      });
      return res.json(success(data[0], "Photo metadata saved successfully"));
    } catch (err) {
      console.error("[PHOTOS] Save metadata error:", err);
      return res.status(500).json(error("Failed to save photo metadata"));
    }
  });
  app2.get("/api/photos/property/:propertyId", authenticateToken, async (req, res) => {
    try {
      const { data: property, error: propError } = await supabase.from("properties").select("owner_id, listing_agent_id").eq("id", req.params.propertyId).single();
      if (propError || !property) {
        return res.status(404).json({ error: "Property not found" });
      }
      const hasAccess = property.owner_id === req.user.id || property.listing_agent_id === req.user.id || req.user.role === "admin" || req.user.role === "property_manager";
      if (!hasAccess) {
        return res.status(403).json({ error: "You do not have access to this property" });
      }
      const { data, error: error2 } = await supabase.from("photos").select("*").eq("property_id", req.params.propertyId).order("created_at", { ascending: false });
      if (error2) throw error2;
      return res.json(success(data, "Photos fetched successfully"));
    } catch (err) {
      console.error("[PHOTOS] Fetch error:", err);
      return res.status(500).json(error("Failed to fetch photos"));
    }
  });
  app2.get("/api/images/property/:propertyId", optionalAuth, async (req, res) => {
    try {
      const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || "";
      if (!urlEndpoint) {
        return res.json(success([], "No optimized images available (ImageKit not configured)"));
      }
      const { data: photos2, error: error2 } = await supabase.from("photos").select("id, imagekit_file_id, thumbnail_url, category, created_at, is_private, uploader_id, property_id, order_index").eq("property_id", req.params.propertyId).order("order_index", { ascending: true }).order("created_at", { ascending: false });
      if (error2) {
        if (error2.code === "PGRST205") {
          console.log("[IMAGES] Photos table not in Supabase schema cache yet. Returning empty array.");
          return res.json(success([], "Photos table not available yet"));
        }
        throw error2;
      }
      const visiblePhotos = (photos2 || []).filter((photo) => {
        if (!photo.is_private) return true;
        if (!req.user) return false;
        return canAccessPrivateImage({
          userId: req.user.id,
          userRole: req.user.role,
          uploaderId: photo.uploader_id,
          propertyId: photo.property_id
        });
      });
      const optimizedPhotos = visiblePhotos.map((photo) => ({
        id: photo.id,
        category: photo.category,
        createdAt: photo.created_at,
        isPrivate: photo.is_private,
        imageUrls: {
          // Thumbnail: 300x200, 75% quality
          thumbnail: `${urlEndpoint}/${photo.imagekit_file_id}?tr=w-300,h-200,q-75,f-auto`,
          // Gallery: 800x600, 85% quality
          gallery: `${urlEndpoint}/${photo.imagekit_file_id}?tr=w-800,h-600,q-85,f-auto`,
          // Original: high quality
          original: `${urlEndpoint}/${photo.imagekit_file_id}?tr=q-90,f-auto`
        }
      }));
      return res.json(success(optimizedPhotos, "Optimized images fetched successfully"));
    } catch (err) {
      console.error("[IMAGES] Fetch optimized error:", err);
      return res.status(500).json(error("Failed to fetch images"));
    }
  });
  app2.post("/api/images/signed", authenticateToken, async (req, res) => {
    try {
      const { photoId, expiresIn = 3600 } = req.body;
      if (!photoId) {
        return res.status(400).json(error("photoId is required"));
      }
      const { data: photo, error: photoError } = await supabase.from("photos").select("id, imagekit_file_id, is_private, uploader_id, property_id").eq("id", photoId).single();
      if (photoError || !photo) {
        return res.status(404).json(error("Photo not found"));
      }
      if (photo.is_private) {
        const { data: property } = photo.property_id ? await supabase.from("properties").select("owner_id, listing_agent_id").eq("id", photo.property_id).single() : { data: null };
        const hasAccess = canAccessPrivateImage({
          userId: req.user.id,
          userRole: req.user.role,
          uploaderId: photo.uploader_id,
          propertyId: photo.property_id,
          propertyOwnerId: property?.owner_id,
          listingAgentId: property?.listing_agent_id
        });
        if (!hasAccess) {
          await logSecurityEvent(
            req.user.id,
            "unauthorized_access",
            false,
            { reason: "Attempted unauthorized access to private image", photoId },
            req
          );
          return res.status(403).json(error("You do not have access to this image"));
        }
      }
      const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || "";
      const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || "";
      if (!urlEndpoint || !privateKey) {
        return res.status(500).json(error("ImageKit not configured"));
      }
      const signedUrl = generateSignedImageURL(
        photo.imagekit_file_id,
        urlEndpoint,
        privateKey,
        expiresIn
      );
      await logSecurityEvent(
        req.user.id,
        "signed_url_generated",
        true,
        { photoId, isPrivate: photo.is_private },
        req
      );
      return res.json(success({ url: signedUrl, expiresIn }, "Signed URL generated"));
    } catch (err) {
      console.error("[IMAGES] Signed URL error:", err);
      return res.status(500).json(error("Failed to generate signed URL"));
    }
  });
  app2.put("/api/photos/:photoId/order", authenticateToken, async (req, res) => {
    try {
      const { orderIndex } = req.body;
      if (orderIndex === void 0 || typeof orderIndex !== "number") {
        return res.status(400).json(error("orderIndex must be a number"));
      }
      const { data: photo, error: photoError } = await supabase.from("photos").select("id, property_id, uploader_id").eq("id", req.params.photoId).single();
      if (photoError || !photo) {
        return res.status(404).json(error("Photo not found"));
      }
      const { data: property } = photo.property_id ? await supabase.from("properties").select("owner_id, listing_agent_id").eq("id", photo.property_id).single() : { data: null };
      const hasAccess = photo.uploader_id === req.user.id || property?.owner_id === req.user.id || property?.listing_agent_id === req.user.id || req.user.role === "admin";
      if (!hasAccess) {
        return res.status(403).json(error("Unauthorized"));
      }
      const { data, error: error2 } = await supabase.from("photos").update({ order_index: orderIndex }).eq("id", req.params.photoId).select();
      if (error2) throw error2;
      await logSecurityEvent(req.user.id, "photo_reordered", true, { photoId: req.params.photoId }, req);
      await logImageAudit(supabase, {
        actorId: req.user.id,
        actorRole: req.user.role,
        action: "image_reorder",
        photoId: req.params.photoId,
        propertyId: photo.property_id,
        metadata: { orderIndex }
      });
      return res.json(success(data[0], "Photo reordered"));
    } catch (err) {
      console.error("[IMAGES] Reorder error:", err);
      return res.status(500).json(error("Failed to reorder photo"));
    }
  });
  app2.delete("/api/photos/:photoId", authenticateToken, async (req, res) => {
    try {
      const { data: photo, error: photoError } = await supabase.from("photos").select("id, property_id, uploader_id, imagekit_file_id, archived").eq("id", req.params.photoId).single();
      if (photoError || !photo) {
        return res.status(404).json(error("Photo not found"));
      }
      if (photo.archived) {
        return res.status(400).json(error("Photo already archived"));
      }
      const { data: property } = photo.property_id ? await supabase.from("properties").select("owner_id, listing_agent_id").eq("id", photo.property_id).single() : { data: null };
      const hasAccess = photo.uploader_id === req.user.id || property?.owner_id === req.user.id || property?.listing_agent_id === req.user.id || req.user.role === "admin";
      if (!hasAccess) {
        return res.status(403).json(error("Unauthorized"));
      }
      await archivePhoto(supabase, req.params.photoId, photo.imagekit_file_id, {
        actorId: req.user.id,
        actorRole: req.user.role,
        action: "image_delete",
        photoId: req.params.photoId,
        propertyId: photo.property_id,
        metadata: { imageKitFileId: photo.imagekit_file_id }
      });
      await logSecurityEvent(req.user.id, "photo_archived", true, { photoId: req.params.photoId }, req);
      return res.json(success(null, "Photo archived"));
    } catch (err) {
      console.error("[IMAGES] Delete error:", err);
      return res.status(500).json(error("Failed to delete photo"));
    }
  });
  app2.get("/api/admin/image-audit-logs", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { propertyId, action, limit = 100, offset = 0 } = req.query;
      let query = supabase.from("image_audit_logs").select("id, actor_id, actor_role, action, photo_id, property_id, metadata, timestamp, users:actor_id(id, full_name, email, role)", { count: "exact" }).order("timestamp", { ascending: false });
      if (propertyId) {
        query = query.eq("property_id", propertyId);
      }
      if (action) {
        query = query.eq("action", action);
      }
      const { data, error: error2, count } = await query.range(Number(offset), Number(offset) + Number(limit) - 1);
      if (error2) throw error2;
      return res.json(success({
        logs: data,
        pagination: {
          offset: Number(offset),
          limit: Number(limit),
          total: count || 0
        }
      }, "Image audit logs retrieved"));
    } catch (err) {
      console.error("[ADMIN] Image audit logs error:", err);
      return res.status(500).json(error("Failed to retrieve image audit logs"));
    }
  });
  app2.post("/api/photos/:photoId/replace", authenticateToken, async (req, res) => {
    try {
      const { imageKitFileId, url, thumbnailUrl } = req.body;
      if (!imageKitFileId || !url) {
        return res.status(400).json(error("imageKitFileId and url are required"));
      }
      const { data: photo, error: photoError } = await supabase.from("photos").select("id, property_id, uploader_id, archived").eq("id", req.params.photoId).single();
      if (photoError || !photo) {
        return res.status(404).json(error("Photo not found"));
      }
      if (photo.archived) {
        return res.status(400).json(error("Cannot replace archived photo"));
      }
      const { data: property } = photo.property_id ? await supabase.from("properties").select("owner_id, listing_agent_id").eq("id", photo.property_id).single() : { data: null };
      const hasAccess = photo.uploader_id === req.user.id || property?.owner_id === req.user.id || property?.listing_agent_id === req.user.id || req.user.role === "admin";
      if (!hasAccess) {
        return res.status(403).json(error("Unauthorized"));
      }
      const newPhoto = await replacePhoto(supabase, req.params.photoId, {
        imageKitFileId,
        url,
        thumbnailUrl
      }, {
        actorId: req.user.id,
        actorRole: req.user.role,
        action: "image_replace",
        photoId: req.params.photoId,
        propertyId: photo.property_id,
        metadata: { oldPhotoId: req.params.photoId, url }
      });
      await logSecurityEvent(req.user.id, "photo_replaced", true, { oldPhotoId: req.params.photoId, newPhotoId: newPhoto?.id }, req);
      return res.json(success(newPhoto, "Photo replaced"));
    } catch (err) {
      console.error("[IMAGES] Replace error:", err);
      return res.status(500).json(error("Failed to replace photo"));
    }
  });
  app2.get("/sitemap.xml", async (req, res) => {
    try {
      const { data: properties2, error: error2 } = await supabase.from("properties").select("id, updated_at").eq("status", "active").order("updated_at", { ascending: false });
      if (error2) throw error2;
      const baseUrl = process.env.PRODUCTION_DOMAIN || `${req.protocol}://${req.get("host")}`;
      const staticPages = [
        { url: "/", priority: "1.0", changefreq: "daily" },
        { url: "/properties", priority: "0.9", changefreq: "daily" },
        { url: "/about", priority: "0.7", changefreq: "monthly" },
        { url: "/contact", priority: "0.7", changefreq: "monthly" },
        { url: "/faq", priority: "0.6", changefreq: "monthly" },
        { url: "/agents", priority: "0.8", changefreq: "weekly" },
        { url: "/success-stories", priority: "0.6", changefreq: "monthly" },
        { url: "/terms", priority: "0.3", changefreq: "yearly" },
        { url: "/privacy", priority: "0.3", changefreq: "yearly" }
      ];
      const now = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
      for (const page of staticPages) {
        xml += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
      }
      if (properties2 && properties2.length > 0) {
        for (const property of properties2) {
          const lastmod = property.updated_at ? new Date(property.updated_at).toISOString().split("T")[0] : now;
          xml += `  <url>
    <loc>${baseUrl}/property/${property.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
        }
      }
      xml += `</urlset>`;
      res.header("Content-Type", "application/xml");
      res.header("Cache-Control", "public, max-age=3600");
      res.send(xml);
    } catch (err) {
      console.error("[SEO] Sitemap generation error:", err);
      res.status(500).send("Failed to generate sitemap");
    }
  });
  app2.get("/api/admin/storage-metrics", authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json(error("Admin access only"));
      }
      const { data: photos2, error: error2 } = await supabase.from("photos").select("file_size_bytes, view_count, archived").eq("archived", false);
      if (error2) throw error2;
      const totalImages = photos2?.length || 0;
      const totalStorageUsed = photos2?.reduce((sum, p) => sum + (p.file_size_bytes || 0), 0) || 0;
      const estimatedBandwidthUsed = photos2?.reduce((sum, p) => sum + (p.file_size_bytes || 0) * (p.view_count || 0), 0) || 0;
      const FREE_TIER_STORAGE_BYTES = 100 * 1024 * 1024 * 1024;
      const storagePercentage = totalStorageUsed / FREE_TIER_STORAGE_BYTES * 100;
      return res.json(success({
        totalImages,
        totalStorageUsed,
        estimatedBandwidthUsed,
        storagePercentage
      }, "Storage metrics retrieved successfully"));
    } catch (err) {
      console.error("[ADMIN] Storage metrics error:", err);
      return res.status(500).json(error("Failed to retrieve storage metrics"));
    }
  });
  return httpServer;
}

// server/app.ts
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
var app = express();
var isDev2 = process.env.NODE_ENV !== "production";
var allowedOrigins = (() => {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim());
  }
  if (isDev2) {
    return ["http://localhost:5000", "http://127.0.0.1:5000"];
  }
  return process.env.PRODUCTION_DOMAIN ? [process.env.PRODUCTION_DOMAIN] : [];
})();
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(helmet({
  contentSecurityPolicy: isDev2 ? false : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://ik.imagekit.io", "https://*.supabase.co"],
      connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  // Allow embedding for Replit preview
  hsts: {
    maxAge: 31536e3,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));
app.get("/health", (_req, res) => {
  res.json({ status: "ok", server: "running" });
});
app.get("/debug/supabase", async (_req, res) => {
  try {
    const { testSupabaseConnection: testSupabaseConnection2 } = await Promise.resolve().then(() => (init_supabase(), supabase_exports));
    const result = await testSupabaseConnection2();
    res.json(result);
  } catch (err) {
    res.json({ connected: false, error: err.message || "Failed to test connection" });
  }
});
app.use((req, _res, next) => {
  if (req.path.startsWith("/api/v1/")) {
    req.url = req.url.replace("/api/v1/", "/api/");
  }
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
async function runApp(setup) {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });
  await setup(app, server);
  const port = parseInt(process.env.PORT || process.env.SERVER_PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
}

// server/index-prod.ts
function validateEnvironment() {
  const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  const optional = ["IMAGEKIT_PUBLIC_KEY", "IMAGEKIT_PRIVATE_KEY", "IMAGEKIT_URL_ENDPOINT"];
  const missingOptional = optional.filter((key) => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn(`[WARN] ImageKit configuration incomplete. Missing: ${missingOptional.join(", ")}`);
    console.warn("[WARN] Image upload and optimization features will be limited.");
  }
}
validateEnvironment();
async function serveStatic(app2, server) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}
(async () => {
  await runApp(serveStatic);
})();
export {
  serveStatic
};
