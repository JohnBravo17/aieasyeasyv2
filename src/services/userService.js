// User Service - Handles all user data operations in Firestore
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  increment,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebaseConfig';

class UserService {
  constructor() {
    this.currentUser = null;
  }

  // Set current authenticated user
  setCurrentUser(user) {
    this.currentUser = user;
  }

  // Get user document from Firestore
  async getUserData(userId = null) {
    const uid = userId || this.currentUser?.uid;
    if (!uid) {
      throw new Error('No user ID provided');
    }

    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() };
      } else {
        console.warn('User document not found');
        return null;
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  // Update user statistics (generations, spending, etc.)
  async updateUserStats(updates) {
    const uid = this.currentUser?.uid;
    if (!uid) {
      throw new Error('No authenticated user');
    }

    try {
      const userRef = doc(db, 'users', uid);
      
      // Use increment for numerical fields
      const updateData = {};
      
      if (updates.totalGenerations) {
        updateData.totalGenerations = increment(updates.totalGenerations);
      }
      
      if (updates.totalSpent) {
        updateData.totalSpent = increment(updates.totalSpent);
      }
      
      if (updates.totalCosts) {
        updateData.totalCosts = increment(updates.totalCosts);
      }
      
      // Add other non-incremental updates
      if (updates.lastActivity) {
        updateData.lastActivity = updates.lastActivity;
      }
      
      await updateDoc(userRef, updateData);
      console.log('✅ User stats updated:', updateData);
      
      return updateData;
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }

  // Log a generation to user's history
  async logGeneration(generationData) {
    const uid = this.currentUser?.uid;
    if (!uid) {
      throw new Error('No authenticated user');
    }

    try {
      // Add generation to user's generations subcollection
      const generationsRef = collection(db, 'users', uid, 'generations');
      
      const generationDoc = {
        ...generationData,
        userId: uid,
        createdAt: Timestamp.now(),
        expiryDate: this.calculateExpiryDate(),
        status: 'completed'
      };
      
      const docRef = await addDoc(generationsRef, generationDoc);
      
      // Update user statistics
      await this.updateUserStats({
        totalGenerations: 1,
        totalSpent: generationData.customerCharge || 0,
        totalCosts: generationData.actualCost || 0,
        lastActivity: new Date().toISOString()
      });
      
      console.log('✅ Generation logged:', docRef.id);
      
      return { id: docRef.id, ...generationDoc };
    } catch (error) {
      console.error('Error logging generation:', error);
      throw error;
    }
  }

  // Get user's generation history
  async getUserGenerations(maxResults = 50) {
    const uid = this.currentUser?.uid;
    if (!uid) {
      throw new Error('No authenticated user');
    }

    try {
      const generationsRef = collection(db, 'users', uid, 'generations');
      
      // Build query with proper limit syntax
      let q;
      if (maxResults) {
        q = query(
          generationsRef,
          orderBy('createdAt', 'desc'),
          limit(maxResults)
        );
      } else {
        q = query(
          generationsRef,
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      const generations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      }));
      
      console.log(`📁 Retrieved ${generations.length} generations for user`);
      
      return generations;
    } catch (error) {
      console.error('Error getting user generations:', error);
      throw error;
    }
  }

  // Calculate expiry date based on user's storage plan
  calculateExpiryDate() {
    // For now, use simple logic - can be enhanced later
    const now = new Date();
    const expiryDate = new Date(now);
    
    // Default: 7 days for free users
    expiryDate.setDate(now.getDate() + 7);
    
    return Timestamp.fromDate(expiryDate);
  }

  // Update user's storage plan
  async updateStoragePlan(planData) {
    const uid = this.currentUser?.uid;
    if (!uid) {
      throw new Error('No authenticated user');
    }

    try {
      const userRef = doc(db, 'users', uid);
      
      await updateDoc(userRef, {
        storagePlan: {
          ...planData,
          updatedAt: new Date().toISOString()
        }
      });
      
      console.log('✅ Storage plan updated:', planData);
      
      return planData;
    } catch (error) {
      console.error('Error updating storage plan:', error);
      throw error;
    }
  }

  // Check user's storage usage
  async getStorageUsage() {
    const uid = this.currentUser?.uid;
    if (!uid) {
      throw new Error('No authenticated user');
    }

    try {
      const userData = await this.getUserData();
      const generations = await this.getUserGenerations();
      
      // Calculate approximate storage usage
      // This is a simplified calculation - in production you'd track actual file sizes
      const imageCount = generations.filter(g => g.type === 'image').length;
      const videoCount = generations.filter(g => g.type === 'video').length;
      
      // Rough estimates: 2MB per image, 10MB per video
      const estimatedUsage = (imageCount * 2) + (videoCount * 10);
      
      return {
        estimatedUsageMB: estimatedUsage,
        totalGenerations: generations.length,
        imageCount,
        videoCount,
        plan: userData?.storagePlan || { type: 'free', spaceLimit: 0 }
      };
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      throw error;
    }
  }

  // Clean up expired generations (admin function)
  async cleanupExpiredGenerations() {
    const uid = this.currentUser?.uid;
    if (!uid) {
      throw new Error('No authenticated user');
    }

    try {
      const generationsRef = collection(db, 'users', uid, 'generations');
      const now = Timestamp.now();
      
      const expiredQuery = query(
        generationsRef,
        where('expiryDate', '<', now)
      );
      
      const expiredDocs = await getDocs(expiredQuery);
      
      const deletionPromises = expiredDocs.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletionPromises);
      
      console.log(`🗑️ Cleaned up ${expiredDocs.docs.length} expired generations`);
      
      return expiredDocs.docs.length;
    } catch (error) {
      console.error('Error cleaning up expired generations:', error);
      throw error;
    }
  }

  // Get user's cost summary
  async getCostSummary(days = 30) {
    const uid = this.currentUser?.uid;
    if (!uid) {
      throw new Error('No authenticated user');
    }

    try {
      const generations = await this.getUserGenerations();
      
      // Filter by date range
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const recentGenerations = generations.filter(g => 
        g.createdAt >= cutoffDate
      );
      
      const totalSpent = recentGenerations.reduce((sum, g) => 
        sum + (g.customerCharge || 0), 0
      );
      
      const totalCosts = recentGenerations.reduce((sum, g) => 
        sum + (g.actualCost || 0), 0
      );
      
      return {
        period: `${days} days`,
        totalGenerations: recentGenerations.length,
        totalSpent,
        totalCosts,
        profit: totalSpent - totalCosts,
        averageCostPerGeneration: recentGenerations.length > 0 
          ? totalSpent / recentGenerations.length 
          : 0
      };
    } catch (error) {
      console.error('Error calculating cost summary:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const userService = new UserService();
export default userService;