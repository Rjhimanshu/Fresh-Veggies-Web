import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase_Config"; // Adjust the path to your Firebase config
import { collection, addDoc, doc, getDoc, getDocs, onSnapshot, query, where, orderBy, updateDoc } from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify"; // For notifications
import "react-toastify/dist/ReactToastify.css"; // Toastify CSS
import styles from "./Help.module.css";

const Help = () => {
  const [subject, setSubject] = useState(""); // State for subject
  const [queryText, setQueryText] = useState(""); // State for query
  const [userDetails, setUserDetails] = useState(null); // State for user details
  const [loading, setLoading] = useState(false); // State for loading
  const [error, setError] = useState(""); // State for error messages
  const [subjects, setSubjects] = useState([]); // State for role-based subjects
  const [selectedQuery, setSelectedQuery] = useState(null); // State to track selected query for chat
  const [message, setMessage] = useState(""); // State for chat message
  const [queries, setQueries] = useState([]); // State to store all user queries
  const [unreadCounts, setUnreadCounts] = useState({}); // State to track unread messages for each query

  // Fetch user details from Firestore when the component mounts
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserDetails({
              name: data.name || "N/A",
              role: data.role || "N/A",
              email: data.email || "N/A",
              phone: data.phoneNumber || "N/A",
            });

            // Set subjects based on user role
            setSubjects(getSubjectsForRole(data.role));
          } else {
            setError("User details not found.");
          }
        }
      } catch (err) {
        setError("Failed to fetch user details.");
        console.error(err);
      }
    };

    fetchUserDetails();
  }, []);

  // Fetch all queries submitted by the user
  useEffect(() => {
    if (userDetails) {
      const queriesCollection = collection(db, "queries");
      const userQueriesQuery = query(
        queriesCollection,
        where("email", "==", userDetails.email)
      );
      const unsubscribe = onSnapshot(userQueriesQuery, (snapshot) => {
        const queriesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setQueries(queriesList);
      });

      return () => unsubscribe(); // Cleanup listener
    }
  }, [userDetails]);

  // Get subjects based on user role
  const getSubjectsForRole = (role) => {
    const allSubjects = [
      { value: "orders", label: "Orders" },
      { value: "account", label: "Account" },
      { value: "cart", label: "Cart" },
      { value: "checkout", label: "Checkout" },
      { value: "payment", label: "Payment" },
      { value: "shop", label: "Shop" },
      { value: "inventory", label: "Inventory" },
      { value: "myproducts", label: "My Products" },
    ];

    if (role === "customer") {
      return allSubjects.filter(
        (subject) =>
          subject.value !== "inventory" && subject.value !== "myproducts"
      );
    } else if (role === "wholesaler") {
      return allSubjects.filter(
        (subject) =>
          subject.value !== "cart" &&
          subject.value !== "shop" &&
          subject.value !== "checkout"
      );
    } else {
      return allSubjects; // For retailers and other roles, show all subjects
    }
  };

  // Handle query submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !queryText.trim()) {
      setError("Please select a subject and enter a valid query.");
      return;
    }

    if (!userDetails) {
      setError("User details not available.");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await addDoc(collection(db, "queries"), {
          name: userDetails.name,
          role: userDetails.role,
          email: userDetails.email,
          phone: userDetails.phone,
          subject: subject,
          query: queryText,
          timestamp: new Date(),
        });

        setSubject("");
        setQueryText("");
        setError("");
        toast.success("Query submitted successfully!");
      } else {
        setError("User not logged in.");
      }
    } catch (err) {
      setError("Failed to submit query.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedQuery) return;

    try {
      // Add message to the messages collection
      await addDoc(collection(db, "messages"), {
        queryId: selectedQuery.id,
        sender: "user",
        message: message,
        timestamp: new Date(),
        read: false, // Mark message as unread by default
      });

      setMessage(""); // Clear the message input
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Listen for real-time updates on messages for the selected query
  useEffect(() => {
    if (selectedQuery) {
      const messagesCollection = collection(db, "messages");
      const messagesQuery = query(
        messagesCollection,
        where("queryId", "==", selectedQuery.id),
        orderBy("timestamp", "asc")
      );
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messagesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSelectedQuery((prev) => ({
          ...prev,
          messages: messagesList,
        }));

        // Calculate unread messages from admin
        const unreadMessages = messagesList.filter(
          (msg) => msg.sender === "admin" && !msg.read
        );
        setUnreadCounts((prev) => ({
          ...prev,
          [selectedQuery.id]: unreadMessages.length,
        }));

        // Show notification for new messages from admin
        const lastMessage = messagesList[messagesList.length - 1];
        if (lastMessage && lastMessage.sender === "admin" && !lastMessage.read) {
          toast.info(`New message from admin: ${lastMessage.message}`);
        }
      });

      return () => unsubscribe(); // Cleanup listener
    }
  }, [selectedQuery]);

  // Mark messages as read when the chat section is opened
  useEffect(() => {
    if (selectedQuery) {
      const markMessagesAsRead = async () => {
        const messagesCollection = collection(db, "messages");
        const messagesQuery = query(
          messagesCollection,
          where("queryId", "==", selectedQuery.id),
          where("read", "==", false)
        );
        const messagesSnapshot = await getDocs(messagesQuery);
        messagesSnapshot.forEach(async (doc) => {
          await updateDoc(doc.ref, { read: true });
        });
      };

      markMessagesAsRead();
    }
  }, [selectedQuery]);

  return (
    <div className={styles.container}>
      <h1 className={styles.helpHeader}>Submit Your Query</h1>
      {error && <p className={styles.error}>{error}</p>}
      <ToastContainer /> {/* For notifications */}

      {/* Query Submission Form */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        >
          <option value="">Select Subject</option>
          {subjects.map((subject) => (
            <option key={subject.value} value={subject.value}>
              {subject.label}
            </option>
          ))}
        </select>
        <textarea
          className={styles.textarea}
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          placeholder="Enter your query here..."
          required
        />
        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "Submitting..." : "Submit Query"}
        </button>
      </form>

      {/* List of Queries */}
      <div className={styles.queryList}>
        <h2>Your Queries</h2>
        {queries.map((q) => (
          <div key={q.id} className={styles.queryItem}>
            <p>
              <strong>Subject:</strong> {q.subject}
            </p>
            <p>
              <strong>Query:</strong> {q.query}
            </p>
            <button
              onClick={() => setSelectedQuery(q)}
              className={styles.chatButton}
            >
              Chat {unreadCounts[q.id] > 0 && `(${unreadCounts[q.id]})`}
            </button>
          </div>
        ))}
      </div>

      {/* Chat Section */}
      {selectedQuery && (
        <div className={styles.chatOverlay}>
          <div className={styles.chatContainer}>
            <h2>Chat for {selectedQuery.subject}</h2>
            <button
              onClick={() => setSelectedQuery(null)}
              className={styles.closeButton}
            >
              &times;
            </button>
            <div className={styles.chatMessages}>
              {selectedQuery.messages?.map((msg, index) => (
                <div
                  key={index}
                  className={`${styles.message} ${msg.sender === "admin" ? styles.adminMessage : styles.userMessage
                    }`}
                >
                  <p>{msg.message}</p>
                  <span>{new Date(msg.timestamp?.toDate()).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className={styles.chatInput}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
              />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Help;