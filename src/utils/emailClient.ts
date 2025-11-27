// Client-side email service wrapper
// This provides a safe interface for client components to interact with email functionality

export interface EmailStatus {
  initialized: boolean;
  connected: boolean;
  error?: string;
}

export interface EmailWorkflowData {
  [key: string]: any;
}

// Client-side email service that doesn't import Node.js modules
class ClientEmailService {
  private initialized = false;

  async initialize(): Promise<EmailStatus> {
    // In a real implementation, this would make an API call to the server
    // For now, return a mock status
    this.initialized = true;
    return {
      initialized: true,
      connected: true
    };
  }

  async triggerWorkflow(type: string, data: EmailWorkflowData): Promise<boolean> {
    // In a real implementation, this would make an API call to the server
    // For now, return success
    console.log(`Email workflow triggered: ${type}`, data);
    return true;
  }

  async handlePasswordRecovery(email: string, name: string): Promise<{ success: boolean; message: string }> {
    // In a real implementation, this would make an API call to the server
    console.log(`Password recovery requested for: ${email}`);
    return {
      success: true,
      message: 'Password recovery email sent successfully'
    };
  }

  validateRecoveryToken(token: string): { valid: boolean; email?: string; name?: string } {
    // In a real implementation, this would validate the token via API
    console.log(`Validating recovery token: ${token}`);
    return {
      valid: true,
      email: 'user@example.com',
      name: 'User'
    };
  }

  useRecoveryToken(token: string): void {
    // In a real implementation, this would mark the token as used via API
    console.log(`Using recovery token: ${token}`);
  }

  async handlePasswordResetSuccess(email: string, name: string): Promise<void> {
    // In a real implementation, this would send confirmation via API
    console.log(`Password reset success for: ${email}`);
  }
}

export const clientEmailService = new ClientEmailService();

// Export a function to initialize the service (for compatibility)
export const initializeEmailService = async (): Promise<EmailStatus> => {
  return await clientEmailService.initialize();
};