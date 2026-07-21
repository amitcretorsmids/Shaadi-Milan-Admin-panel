// functions/src/notifications.ts
import * as functions from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const sendBulkNotification = functions.onCall(async (request) => {
  const { target, title, message } = request.data;
  
  // Verify admin authentication
  if (!request.auth) {
    throw new functions.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Check if user is admin
  const adminDoc = await admin.firestore().collection('admins').doc(request.auth.uid).get();
  if (!adminDoc.exists) {
    throw new functions.HttpsError('permission-denied', 'Only admins can send notifications');
  }

  try {
    let users: any[] = [];

    // Fetch users based on target
    if (target === 'All') {
      const snapshot = await admin.firestore().collection('users').get();
      users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } 
    else if (target === 'Male') {
      const snapshot = await admin.firestore()
        .collection('users')
        .where('gender', '==', 'male')
        .get();
      users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    else if (target === 'Female') {
      const snapshot = await admin.firestore()
        .collection('users')
        .where('gender', '==', 'female')
        .get();
      users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    else if (target === 'Agent') {
      const snapshot = await admin.firestore().collection('agents').get();
      users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // Filter users with FCM tokens
    const usersWithTokens = users.filter(user => user.fcmToken);
    
    // Send FCM notifications in batches
    const batchSize = 500;
    const batches = [];
    
    for (let i = 0; i < usersWithTokens.length; i += batchSize) {
      const batch = usersWithTokens.slice(i, i + batchSize);
      batches.push(batch);
    }

    // Send notifications
    let sentCount = 0;
    for (const batch of batches) {
      const messages = batch.map(user => ({
        notification: {
          title: title,
          body: message,
        },
        data: {
          type: 'manual_notification',
          target: target,
          timestamp: Date.now().toString(),
        },
        token: user.fcmToken,
      }));

      const response = await admin.messaging().sendEach(messages);
      sentCount += response.successCount;
    }

    // Store in Firestore
    await admin.firestore().collection('notifications').add({
      target: target,
      title: title,
      message: message,
      sentTo: sentCount,
      totalUsers: users.length,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'Delivered',
      type: 'manual_notification',
      createdBy: request.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      sentCount: sentCount,
      totalUsers: users.length,
    };

  } catch (error) {
    console.error('Error sending notification:', error);
    throw new functions.HttpsError('internal', 'Failed to send notifications');
  }
});

// Get all notifications (for admin panel)
export const getAllNotifications = functions.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { limit = 50, lastDocId, target, status } = request.data;
  
  let query: admin.firestore.Query = admin.firestore()
    .collection('notifications')
    .orderBy('createdAt', 'desc')
    .limit(limit);

  if (target && target !== 'All') {
    query = query.where('target', '==', target);
  }

  if (status && status !== 'All') {
    query = query.where('status', '==', status);
  }

  if (lastDocId) {
    const lastDoc = await admin.firestore()
      .collection('notifications')
      .doc(lastDocId)
      .get();
    
    if (lastDoc.exists) {
      query = query.startAfter(lastDoc);
    }
  }

  const snapshot = await query.get();
  
  const notifications = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    sentAt: doc.data().sentAt?.toDate?.() || doc.data().sentAt,
  }));

  return {
    notifications,
    lastDocId: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null,
  };
});