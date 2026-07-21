import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

export const deleteUserFromAuth = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Login required");
    }

    const { uid } = request.data;

    if (!uid) {
      throw new HttpsError("invalid-argument", "uid is required");
    }

    // Delete from Firebase Auth
    await admin.auth().deleteUser(uid);

    // Delete from Firestore agents collection
    await admin.firestore().collection("agents").doc(uid).delete();

    return { success: true, uid };
  } catch (error: any) {
    console.error("❌ deleteUserFromAuth error:", error);
    throw new HttpsError("internal", error.message || "Failed to delete user");
  }
});

export const createAgentWithAuth = onCall(async (request) => {
  try {
    // ✅ Auth check
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Login required");
    }

    const {
      agentEmail,
      tempPassword,
      agentName,
      agentMobile,
      agentAddress,
      agentCity,
      agentState,
      agentPincode,
      agentAadhar,
      agentLicenseNumber,
      aadharUrl,
      primaryImageUrl,
      profileImageUrl,
      role,
      platform,
      isApproved,
      isRejected,
      registrationDate,
    } = request.data; // ✅ IMPORTANT (not `data` directly)
    
      const agentId = await generateUniqueAgentId();
    // 🔥 1. Create Auth user
    const userRecord = await admin.auth().createUser({
      email: agentEmail,
      password: tempPassword,
    });

    const uid = userRecord.uid;

    // 🔥 2. Save Firestore
    await admin.firestore().collection("agents").doc(uid).set({
      uid,
      agentId: agentId,
      agentAuthId: uid,
      agentEmail,
      agentName,
      agentMobile,
      agentAddress,
      agentCity,
      agentState,
      agentPincode,
      agentAadhar,
      agentLicenseNumber,
      aadharUrl,
      primaryImageUrl,
      profileImageUrl,

      role,
      platform,
      isApproved,
      isRejected,
      registrationDate,
    });

    return {
      success: true,
      uid,
    };
  } catch (error: any) {
    console.error("❌ Agent create error:", error);

    throw new HttpsError("internal", error.message || "Failed to create agent");
  }
});


const generateUniqueAgentId = async () => {
  let agentId;
  let exists = true;

  while (exists) {
    agentId = Math.floor(10000 + Math.random() * 9000000).toString();

    const snap = await admin
      .firestore()
      .collection("agents")
      .where("agentId", "==", agentId)
      .limit(1)
      .get();

    exists = !snap.empty;
  }

  return agentId;
};