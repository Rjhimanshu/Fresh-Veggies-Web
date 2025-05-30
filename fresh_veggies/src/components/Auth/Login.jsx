import React, { useState } from "react";
import { useNavigate} from "react-router-dom";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { app } from "../../firebase_Config";
import PolicyModal from "../PolicyModal/PolicyModal";
import PrivacyPolicy from "../PrivacyPolicy/PrivacyPolicy";
import TermsOfService from "../TermsOfService/TermsOfService";
import styles from "./Login.module.css";

const auth = getAuth(app);
const db = getFirestore(app);

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(value);
  };

  const checkUserExists = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      return userDoc.exists();
    } catch (error) {
      console.error("Error checking user existence:", error);
      return false;
    }
  };

  const checkPolicyAccepted = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      return userDoc.exists() && userDoc.data().acceptedPolicies;
    } catch (error) {
      console.error("Error checking policy acceptance:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPhoneLoading(true);
    setError("");

    if (!phoneNumber || phoneNumber.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      setPhoneLoading(false);
      return;
    }

    try {
      const fullPhoneNumber = `+91${phoneNumber}`;
      const recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        fullPhoneNumber,
        recaptchaVerifier
      );
      
      const otp = prompt("Enter the 6-digit OTP sent to your phone");
      if (!otp || otp.length !== 6) {
        setError("Please enter a valid 6-digit OTP");
        setPhoneLoading(false);
        return;
      }

      const result = await confirmationResult.confirm(otp);
      const userExists = await checkUserExists(result.user.uid);
      const policiesAccepted = await checkPolicyAccepted(result.user.uid);

      if (userExists && policiesAccepted) {
        navigate("/");
      } else {
        setShowRoleForm(true);
      }
    } catch (error) {
      setError(error.message || "Failed to authenticate. Please try again.");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const userExists = await checkUserExists(result.user.uid);
      const policiesAccepted = await checkPolicyAccepted(result.user.uid);

      if (userExists && policiesAccepted) {
        navigate("/");
      } else {
        setShowRoleForm(true);
        setName(result.user.displayName || "");
      }
    } catch (error) {
      setError(error.message || "Failed to sign in with Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    
    if (!name || !role) {
      setError("Please enter your name and select a role");
      setFormLoading(false);
      return;
    }

    if (!acceptedPrivacy || !acceptedTerms) {
      setError("Please accept both policies to continue");
      setFormLoading(false);
      return;
    }

    try {
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name,
          role,
          phoneNumber: user.phoneNumber || null,
          email: user.email || null,
          acceptedPolicies: true,
          policiesAcceptedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
        navigate("/");
      }
    } catch (error) {
      console.error("Error saving user data:", error);
      setError("Failed to save profile. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };


  const openPolicyModal = (type) => {
    setModalContent({
      type,
      content: type === 'privacy' ? <PrivacyPolicy showFull={true} /> : <TermsOfService showFull={true} />
    });
  };


  const renderLoginForm = () => (
    <div className={styles.loginFormContainer}>
      <h2 className={styles.welcome}>Welcome</h2>
      {error && <div className={styles.error}>{error}</div>}
      
      <form onSubmit={handleSubmit} className={styles.authForm}>
        <div className={styles.inputGroup}>
          <label htmlFor="phone">Phone Number</label>
          <div className={styles.phoneInput}>
            <span>+91</span>
            <input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              maxLength="10"
              placeholder="Enter 10-digit number"
              required
            />
          </div>
        </div>
        <div id="recaptcha-container"></div>
        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={phoneLoading}
        >
          {phoneLoading ? (
            <span className={styles.buttonLoading}>
              <span className={styles.loadingSpinner}></span>
              Sending OTP...
            </span>
          ) : "Continue with Phone"}
        </button>
      </form>
      
      <div className={styles.orDivider}>
        <span>OR</span>
      </div>
      
      <button 
        onClick={handleGoogleLogin}
        className={styles.googleButton}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <span className={styles.buttonLoading}>
            <span className={styles.loadingSpinner}></span>
            Signing in...
          </span>
        ) : (
          <>
            <svg className={styles.googleIcon} viewBox="0 0 24 24" width="18" height="18">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </>
        )}
      </button>
    </div>
  );

  const renderRoleForm = () => (
    <div className={styles.roleFormContainer}>
      <h2>Complete Your Profile</h2>
      {error && <div className={styles.error}>{error}</div>}
      
      <form onSubmit={handleRoleSubmit} className={styles.profileForm}>
        <div className={styles.inputGroup}>
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            required
          />
        </div>
        
        <div className={styles.inputGroup}>
          <label htmlFor="role">I am a</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="">Select role</option>
            <option value="customer">Customer</option>
            <option value="retailer">Retailer</option>
            <option value="wholesaler">Wholesaler</option>
          </select>
        </div>

        <div className={styles.policyCheckboxes}>
          <div className={styles.policyItem}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={acceptedPrivacy}
                onChange={() => setAcceptedPrivacy(!acceptedPrivacy)}
                required
              />
              I accept the <button 
                type="button"
                onClick={() => openPolicyModal('privacy')}
                className={styles.policyLink}
              >
                Privacy Policy
              </button>
            </label>
          </div>
          
          <div className={styles.policyItem}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={() => setAcceptedTerms(!acceptedTerms)}
                required
              />
              I accept the <button 
                type="button"
                onClick={() => openPolicyModal('terms')}
                className={styles.policyLink}
              >
                Terms of Service
              </button>
            </label>
          </div>
        </div>
        
        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={formLoading || !name || !role || !acceptedPrivacy || !acceptedTerms}
        >
          {formLoading ? (
            <span className={styles.buttonLoading}>
              <span className={styles.loadingSpinner}></span>
              Creating account...
            </span>
          ) : "Complete Registration"}
        </button>
      </form>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.loginWrapper}>
        <div className={styles.imageSection}>
          <img 
            src="https://res.cloudinary.com/dj5sf6jb3/image/upload/v1742970737/sg7jkindggun8brd0seo.jpg" 
            alt="Fresh vegetables" 
          />
        </div>
        
        <div className={styles.loginSection}>
          {!showRoleForm ? renderLoginForm() : renderRoleForm()}
        </div>
      </div>

      <PolicyModal
      isOpen={!!modalContent}
      onClose={() => setModalContent(null)}
      title={modalContent?.type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
    >
      {modalContent?.content}
    </PolicyModal>
    </div>
  );
};

export default Login;