// Admin service for managing admin roles and permissions
import { doc, setDoc, getDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { db } from './firebaseConfig'

class AdminService {
  // Set a user as admin by email
  async setAdminByEmail(email) {
    try {
      console.log('🔴 Setting admin role for email:', email)
      
      // Find user by email
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('email', '==', email.toLowerCase()))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        throw new Error(`User with email ${email} not found`)
      }
      
      // Update the first matching user (should be unique)
      const userDoc = querySnapshot.docs[0]
      const userRef = doc(db, 'users', userDoc.id)
      
      await setDoc(userRef, {
        role: 'admin',
        updatedAt: new Date().toISOString()
      }, { merge: true })
      
      console.log('✅ Successfully set admin role for:', email)
      return true
    } catch (error) {
      console.error('❌ Error setting admin role:', error)
      throw error
    }
  }
  
  // Remove admin role from a user
  async removeAdminByEmail(email) {
    try {
      console.log('🔴 Removing admin role for email:', email)
      
      // Find user by email
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('email', '==', email.toLowerCase()))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        throw new Error(`User with email ${email} not found`)
      }
      
      // Update the first matching user
      const userDoc = querySnapshot.docs[0]
      const userRef = doc(db, 'users', userDoc.id)
      
      await setDoc(userRef, {
        role: 'user',
        updatedAt: new Date().toISOString()
      }, { merge: true })
      
      console.log('✅ Successfully removed admin role for:', email)
      return true
    } catch (error) {
      console.error('❌ Error removing admin role:', error)
      throw error
    }
  }
  
  // Check if a user is admin by email
  async checkAdminByEmail(email) {
    try {
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('email', '==', email.toLowerCase()))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        return false
      }
      
      const userDoc = querySnapshot.docs[0]
      const userData = userDoc.data()
      return userData.role === 'admin'
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  }
  
  // List all admin users
  async listAdmins() {
    try {
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('role', '==', 'admin'))
      const querySnapshot = await getDocs(q)
      
      const admins = []
      querySnapshot.forEach((doc) => {
        admins.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return admins
    } catch (error) {
      console.error('Error listing admins:', error)
      throw error
    }
  }
}

const adminService = new AdminService()
export default adminService

// Console utilities for manual admin management
// You can use these in the browser console:
window.setAdmin = async (email) => {
  try {
    await adminService.setAdminByEmail(email)
    console.log('✅ Admin role set successfully')
  } catch (error) {
    console.error('❌ Failed to set admin:', error.message)
  }
}

window.removeAdmin = async (email) => {
  try {
    await adminService.removeAdminByEmail(email)
    console.log('✅ Admin role removed successfully')
  } catch (error) {
    console.error('❌ Failed to remove admin:', error.message)
  }
}

window.checkAdmin = async (email) => {
  try {
    const isAdmin = await adminService.checkAdminByEmail(email)
    console.log(`User ${email} is ${isAdmin ? 'an admin' : 'not an admin'}`)
    return isAdmin
  } catch (error) {
    console.error('❌ Failed to check admin status:', error.message)
  }
}

window.listAdmins = async () => {
  try {
    const admins = await adminService.listAdmins()
    console.log('Current admins:', admins)
    return admins
  } catch (error) {
    console.error('❌ Failed to list admins:', error.message)
  }
}