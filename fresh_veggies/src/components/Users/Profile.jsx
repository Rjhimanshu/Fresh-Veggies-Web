import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase_Config";
import styles from "./Profile.module.css";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data());
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();
  }, [currentUser]);

  if (!currentUser) {
    return <div>Please log in to view your profile.</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!userData) {
    return <div>User data not found.</div>;
  }

  return (
    <div className={styles.profileContainer}>
      <h1>Profile</h1>
      <div className={styles.profileHeader}>
        {userData.imageProfileUrl ? (
          <img
            src={userData.imageProfileUrl}
            alt="Profile"
            className={styles.profileImage}
          />
        ) : (
          <div className={styles.profileImagePlaceholder}>
            No Profile Picture
          </div>
        )}
      </div>
      <div className={styles.profileDetails}>
        <p>
          <strong>Name:</strong> {userData.name}
        </p>
        <p>
          <strong>Email:</strong> {userData.email}
        </p>
        <p>
          <strong>Phone Number:</strong> {userData.phone}
        </p>
        <p>
          <strong>Role:</strong> {userData.role}
        </p>
      </div>
      <button
        className={styles.editButton}
        onClick={() => navigate("/edit-profile", { state: { userData } })}
      >
        Edit Profile
      </button>
    </div>
  );
};

export default Profile;