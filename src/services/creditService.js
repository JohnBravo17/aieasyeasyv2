// Credit Management Service
// Handles credit balance, transactions, and deductions

import { doc, setDoc, getDoc, updateDoc, collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';

class CreditService {
  constructor() {
    this.currentUser = null;
    
    // Credit conversion rate: 1 THB = 1 Credit (you can adjust this)
    this.THB_TO_CREDIT_RATE = 1;
    
    // Default credit packages for top-up
    this.creditPackages = [
      { id: 'starter', credits: 50, price: 50, thbPrice: 50, popular: false },
      { id: 'basic', credits: 100, price: 100, thbPrice: 100, popular: true },
      { id: 'pro', credits: 250, price: 250, thbPrice: 250, popular: false },
      { id: 'premium', credits: 500, price: 500, thbPrice: 500, popular: false }
    ];
  }

  // Set current user for all operations
  setCurrentUser(user) {
    this.currentUser = user;
    console.log('💳 CreditService: User set:', user?.uid || 'none');
  }

  // Get user's current credit balance
  async getCreditBalance() {
    if (!this.currentUser) {
      console.log('❌ CreditService: No user set for getting balance');
      return 0;
    }

    try {
      const userRef = doc(db, 'users', this.currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        return userData.creditBalance || 0;
      }
      
      return 0;
    } catch (error) {
      console.error('❌ Error getting credit balance:', error);
      return 0;
    }
  }

  // Check if user has enough credits for a generation
  async hasEnoughCredits(requiredCredits) {
    const balance = await this.getCreditBalance();
    return balance >= requiredCredits;
  }

  // Deduct credits for a generation
  async deductCredits(amount, description, generationData = {}) {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    console.log(`💳 Deducting ${amount} credits for: ${description}`);

    try {
      // Get current balance
      const currentBalance = await this.getCreditBalance();
      
      if (currentBalance < amount) {
        throw new Error(`Insufficient credits. Need ${amount}, have ${currentBalance}`);
      }

      // Calculate new balance
      const newBalance = currentBalance - amount;

      // Update user's credit balance
      const userRef = doc(db, 'users', this.currentUser.uid);
      await updateDoc(userRef, {
        creditBalance: newBalance,
        totalSpentCredits: (await this.getTotalSpentCredits()) + amount,
        lastActivity: new Date().toISOString()
      });

      // Record the transaction
      await this.recordTransaction({
        type: 'deduction',
        amount: -amount,
        description,
        balanceAfter: newBalance,
        generationData
      });

      console.log(`✅ Credits deducted. New balance: ${newBalance}`);
      return { success: true, newBalance, amountDeducted: amount };

    } catch (error) {
      console.error('❌ Error deducting credits:', error);
      throw error;
    }
  }

  // Add credits (for top-up or admin)
  async addCredits(amount, description, paymentData = {}) {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    console.log(`💳 Adding ${amount} credits for: ${description}`);

    try {
      // Get current balance
      const currentBalance = await this.getCreditBalance();
      const newBalance = currentBalance + amount;

      // Update user's credit balance
      const userRef = doc(db, 'users', this.currentUser.uid);
      await updateDoc(userRef, {
        creditBalance: newBalance,
        totalCreditsEver: (await this.getTotalCreditsEver()) + amount,
        lastActivity: new Date().toISOString()
      });

      // Record the transaction
      await this.recordTransaction({
        type: 'topup',
        amount: +amount,
        description,
        balanceAfter: newBalance,
        paymentData
      });

      console.log(`✅ Credits added. New balance: ${newBalance}`);
      return { success: true, newBalance, amountAdded: amount };

    } catch (error) {
      console.error('❌ Error adding credits:', error);
      throw error;
    }
  }

  // Record a credit transaction
  async recordTransaction(transactionData) {
    if (!this.currentUser) return;

    try {
      const transaction = {
        userId: this.currentUser.uid,
        timestamp: new Date().toISOString(),
        ...transactionData
      };

      await addDoc(collection(db, 'creditTransactions'), transaction);
      console.log('📝 Transaction recorded:', transaction);
    } catch (error) {
      console.error('❌ Error recording transaction:', error);
    }
  }

  // Get user's transaction history
  async getTransactionHistory(limit = 50) {
    if (!this.currentUser) return [];

    try {
      const transactionsRef = collection(db, 'creditTransactions');
      const q = query(
        transactionsRef,
        where('userId', '==', this.currentUser.uid),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return transactions.slice(0, limit);
    } catch (error) {
      console.error('❌ Error getting transaction history:', error);
      return [];
    }
  }

  // Convert THB price to credits
  thbToCredits(thbAmount) {
    return Math.round(thbAmount * this.THB_TO_CREDIT_RATE);
  }

  // Convert credits to THB (for display purposes)
  creditsToThb(credits) {
    return credits / this.THB_TO_CREDIT_RATE;
  }

  // Get total credits ever purchased
  async getTotalCreditsEver() {
    if (!this.currentUser) return 0;

    try {
      const userRef = doc(db, 'users', this.currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data().totalCreditsEver || 0;
      }
      return 0;
    } catch (error) {
      console.error('❌ Error getting total credits:', error);
      return 0;
    }
  }

  // Get total credits spent
  async getTotalSpentCredits() {
    if (!this.currentUser) return 0;

    try {
      const userRef = doc(db, 'users', this.currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data().totalSpentCredits || 0;
      }
      return 0;
    } catch (error) {
      console.error('❌ Error getting total spent credits:', error);
      return 0;
    }
  }

  // Initialize new user with starting credits
  async initializeNewUser(startingCredits = 10) {
    if (!this.currentUser) return;

    try {
      console.log(`🎁 Giving new user ${startingCredits} starting credits`);
      
      await this.addCredits(
        startingCredits, 
        'Welcome bonus - Free starting credits!'
      );
      
    } catch (error) {
      console.error('❌ Error initializing new user credits:', error);
    }
  }

  // Get available credit packages
  getCreditPackages() {
    return this.creditPackages;
  }

  // Calculate model cost in credits (using our pricing manager data)
  calculateModelCostInCredits(modelName, resolution, settings = {}) {
    // This will use the pricing from our PricingManager
    // For now, let's use some default values based on complexity
    
    const baseCosts = {
      // Image models (credits per generation)
      'FLUX.1 Kontext [pro]': { '1024x1024': 4, '2048x2048': 6, '4096x4096': 10, '1024x1536': 5, '1536x1024': 5 },
      'FLUX.1.1 Pro': { '1024x1024': 3, '2048x2048': 5, '1024x1536': 4 },
      'FLUX.1 [dev]': { '1024x1024': 3, '2048x2048': 4 },
      'Nanobanana': { '1024x1024': 2, '1024x1536': 2 },
      'Seedream 4.0': { '1024x1024': 3, '2048x2048': 4 },
      
      // Video models (credits per generation)
      'Seedance 1.0 Lite': { '720p': 20, '1080p': 30 },
      'Minimax Hailu': { '720p': 40, '1080p': 60 }
    };

    const modelCosts = baseCosts[modelName];
    if (!modelCosts) return 5; // Default cost

    return modelCosts[resolution] || 5; // Default if resolution not found
  }
}

// Create and export singleton instance
const creditService = new CreditService();
export default creditService;