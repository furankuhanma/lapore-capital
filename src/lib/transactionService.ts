import { supabase } from './supabase';
import { TransactionRequest, TransactionResult, Profile } from '../types';

/**
 * TransactionService handles all transaction operations
 * including validation, balance updates, and transaction logging
 */
export class TransactionService {
  
  /**
   * Send funds from one user to another
   * This performs atomic operations to ensure data consistency:
   * 1. Validate sender has sufficient balance
   * 2. Verify receiver exists
   * 3. Create transaction record
   * 4. Update both balances
   */
  static async sendFunds(request: TransactionRequest): Promise<TransactionResult> {
    const { sender_id, receiver_id, amount, currency = 'PHP', description } = request;

    try {
      // Validation: Amount must be positive
      if (amount <= 0) {
        return { success: false, error: 'Amount must be greater than zero' };
      }

      // Validation: Cannot send to yourself
      if (sender_id === receiver_id) {
        return { success: false, error: 'Cannot send funds to yourself' };
      }

      // Step 1: Get sender profile and validate balance
      const { data: senderProfile, error: senderError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sender_id)
        .single();

      if (senderError || !senderProfile) {
        return { success: false, error: 'Sender account not found' };
      }

      if (senderProfile.balance < amount) {
        return { 
          success: false, 
          error: `Insufficient balance. Available: ₱${senderProfile.balance.toFixed(2)}` 
        };
      }

      // Step 2: Verify receiver exists
      const { data: receiverProfile, error: receiverError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', receiver_id)
        .single();

      if (receiverError || !receiverProfile) {
        return { success: false, error: 'Receiver account not found' };
      }

      // Step 3: Create transaction records (one for sender, one for receiver)
      const timestamp = new Date().toISOString();
      
      // Sender transaction (type: 'send')
      const { data: senderTransaction, error: senderTxError } = await supabase
        .from('transactions')
        .insert({
          sender_id,
          receiver_id,
          amount,
          currency,
          type: 'send',
          timestamp,
          description: description || `Transfer to ${receiverProfile.full_name}`,
        })
        .select()
        .single();

      if (senderTxError) {
        console.error('Error creating sender transaction:', senderTxError);
        return { success: false, error: 'Failed to create transaction record' };
      }

      // Receiver transaction (type: 'receive')
      const { error: receiverTxError } = await supabase
        .from('transactions')
        .insert({
          sender_id,
          receiver_id,
          amount,
          currency,
          type: 'receive',
          timestamp,
          description: description || `Received from ${senderProfile.full_name}`,
        });

      if (receiverTxError) {
        console.error('Error creating receiver transaction:', receiverTxError);
        // Continue anyway - sender transaction is primary
      }

      // Step 4: Update sender balance (deduct)
      const { error: senderUpdateError } = await supabase
        .from('profiles')
        .update({ balance: senderProfile.balance - amount })
        .eq('id', sender_id);

      if (senderUpdateError) {
        console.error('Error updating sender balance:', senderUpdateError);
        return { success: false, error: 'Failed to update sender balance' };
      }

      // Step 5: Update receiver balance (add)
      const { error: receiverUpdateError } = await supabase
        .from('profiles')
        .update({ balance: receiverProfile.balance + amount })
        .eq('id', receiver_id);

      if (receiverUpdateError) {
        console.error('Error updating receiver balance:', receiverUpdateError);
        return { success: false, error: 'Failed to update receiver balance' };
      }

      // Success! Return the transaction
      return {
        success: true,
        transaction: {
          ...senderTransaction,
          sender_name: senderProfile.full_name,
          receiver_name: receiverProfile.full_name,
        },
      };

    } catch (error) {
      console.error('Transaction error:', error);
      return { 
        success: false, 
        error: 'An unexpected error occurred. Please try again.' 
      };
    }
  }

  /**
   * Get user profile by username or user ID
   */
  static async getUserByIdentifier(identifier: string): Promise<Profile | null> {
    try {
      // Try to find by UUID first
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      
      if (isUUID) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', identifier)
          .single();

        if (!error && data) return data;
      }

      // Try to find by username (remove @ if present)
      const username = identifier.startsWith('@') ? identifier.slice(1) : identifier;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (!error && data) return data;

      return null;
    } catch (error) {
      console.error('Error finding user:', error);
      return null;
    }
  }

  /**
   * Get transaction history for a user
   */
  static async getTransactionHistory(userId: string, limit = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          sender:profiles!transactions_sender_id_fkey(full_name, username),
          receiver:profiles!transactions_receiver_id_fkey(full_name, username)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  /**
   * Generate QR code data for receiving funds
   */
  static generateReceiveQRData(userId: string, username?: string): string {
    return JSON.stringify({
      type: 'lapore-finance-transfer',
      userId,
      username,
      timestamp: Date.now(),
    });
  }

  /**
   * Parse QR code data for sending funds
   */
  static parseQRData(qrData: string): { userId: string; username?: string } | null {
    try {
      const parsed = JSON.parse(qrData);
      if (parsed.type === 'lapore-finance-transfer' && parsed.userId) {
        return {
          userId: parsed.userId,
          username: parsed.username,
        };
      }
      return null;
    } catch {
      return null;
    }
  }
}