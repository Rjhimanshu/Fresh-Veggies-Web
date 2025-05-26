import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../../firebase_Config";
import {
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updateEmail,
} from "firebase/auth";
import styles from "./EditProfile.module.css";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const EditProfile = () => {
  const { currentUser } = useAuth();
  const { state } = useLocation(); // Access state passed from Profile page
  const navigate = useNavigate();

  const [userData, setUserData] = useState(state?.userData || null); // Initialize with passed data
  const [updatedUserData, setUpdatedUserData] = useState(state?.userData || {}); // Initialize with passed data
  const [profilePicture, setProfilePicture] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [editingField, setEditingField] = useState(null); // Track editing field

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfilePictureChange = (e) => {
    setProfilePicture(e.target.files[0]);
  };

  const handleUploadProfilePicture = async () => {
    try {
      if (!profilePicture) {
        console.error("No file selected.");
        return;
      }
  
      // Upload new image to Cloudinary
      const formData = new FormData();
      formData.append("file", profilePicture);
      formData.append("upload_preset", "profileimg"); // Replace with your actual upload preset
      formData.append("folder", "ProfilePic"); // Ensure this matches your Cloudinary folder
  
      console.log("Form Data:", formData);
  
      const uploadResponse = await axios.post(
        "https://api.cloudinary.com/v1_1/dj5sf6jb3/image/upload", // Replace with your Cloudinary URL
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      console.log("Cloudinary Upload Response:", uploadResponse.data);
  
      const imageUrl = uploadResponse.data.secure_url;
  
      // Delete the previous image from Cloudinary (if it exists)
      if (userData.imageProfileUrl) {
        // Extract the public_id including the folder name
        const urlParts = userData.imageProfileUrl.split("/");
        const folderIndex = urlParts.indexOf("ProfilePic"); // Find the folder name in the URL
        const publicId = urlParts.slice(folderIndex).join("/").split(".")[0]; // Include folder name in public_id
        console.log("Public ID to Delete:", publicId);
  
        try {
          const destroyResponse = await axios.post(
            `https://api.cloudinary.com/v1_1/dj5sf6jb3/image/destroy`,
            {
              public_id: publicId, // Include folder name in public_id
              api_key: "471631229529229", // Replace with your API key
              api_secret: "fD0iWLRkq5JFBtRRhDqc9EeWUc4", // Replace with your API secret
            }
          );
          console.log("Destroy Response:", destroyResponse.data);
        } catch (error) {
          console.error("Error deleting image:", error);
        }
      }
  
      // Update profile picture in Firestore
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        imageProfileUrl: imageUrl,
      });
      console.log("Firestore updated with new image URL:", imageUrl);
  
      // Update local state
      setUpdatedUserData((prev) => ({
        ...prev,
        imageProfileUrl: imageUrl,
      }));
      console.log("Local state updated with new image URL:", imageUrl);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      // If email or phone number is changed, verify with OTP
      if (
        (updatedUserData.email !== userData.email && editingField === "email") ||
        (updatedUserData.phone !== userData.phone && editingField === "phone")
      ) {
        if (!confirmationResult) {
          await handleSendOTP();
          return;
        }

        await confirmationResult.confirm(verificationCode);

        // Update email in Firebase Auth if it was edited
        if (editingField === "email") {
          await updateEmail(currentUser, updatedUserData.email);
        }
      }

      // Update user data in Firestore
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, updatedUserData);

      // Update display name in Firebase Auth (if changed)
      if (updatedUserData.name !== userData.name) {
        await updateProfile(currentUser, {
          displayName: updatedUserData.name,
        });
      }

      // Redirect back to profile page
      navigate("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleSendOTP = async () => {
    try {
      // Ensure the reCAPTCHA container exists in the DOM
      const recaptchaContainer = document.getElementById("recaptcha-container");
      if (!recaptchaContainer) {
        console.error("reCAPTCHA container not found.");
        return;
      }

      // Initialize reCAPTCHA verifier
      window.recaptchaVerifier = new RecaptchaVerifier(
        "recaptcha-container",
        {
          size: "invisible", // or "normal" for visible reCAPTCHA
          callback: (response) => {
            // reCAPTCHA solved, proceed with OTP sending
            console.log("reCAPTCHA solved:", response);
          },
        },
        auth // Pass the auth object
      );

      // Use the phone number from updatedUserData
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        updatedUserData.phone,
        window.recaptchaVerifier
      );

      setConfirmationResult(confirmationResult);
    } catch (error) {
      console.error("OTP send error:", error);
    }
  };

  const handleEditEmail = () => {
    setEditingField("email");
  };

  const handleEditPhone = () => {
    setEditingField("phone");
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.editProfileContainer}>
      <h1>Edit Profile</h1>
      <div className={styles.profileHeader}>
        {updatedUserData.imageProfileUrl ? (
          <img
            src={updatedUserData.imageProfileUrl}
            alt="Profile"
            className={styles.profileImage}
          />
        ) : (
          <div className={styles.profileImagePlaceholder}>
            No Profile Picture
          </div>
        )}
        <input type="file" onChange={handleProfilePictureChange} />
        <button onClick={handleUploadProfilePicture}>Upload</button>
      </div>
      <div className={styles.profileDetails}>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={updatedUserData.name || ""}
          onChange={handleInputChange}
        />
        <button onClick={handleEditEmail}>Edit Email</button>
        {editingField === "email" && (
          <>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={updatedUserData.email || ""}
              onChange={handleInputChange}
            />
            {confirmationResult && (
              <>
                <input
                  type="text"
                  placeholder="Verification Code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                />
                <div id="recaptcha-container"></div>
              </>
            )}
          </>
        )}
        <button onClick={handleEditPhone}>Edit Phone</button>
        {editingField === "phone" && (
          <>
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={updatedUserData.phone || ""}
              onChange={handleInputChange}
            />
            {confirmationResult && (
              <>
                <input
                  type="text"
                  placeholder="Verification Code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                />
                <div id="recaptcha-container"></div>
              </>
            )}
          </>
        )}
        <p>
          <strong>Role:</strong> {userData.role}
        </p>
        <button onClick={handleUpdateProfile}>Save Changes</button>
        <button onClick={() => navigate("/profile")}>Cancel</button>
      </div>
    </div>
  );
};

export default EditProfile;