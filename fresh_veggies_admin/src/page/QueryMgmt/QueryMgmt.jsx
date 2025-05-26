import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig"; // Adjust the path to your Firebase config
import { doc, collection, getDocs, query, where, orderBy, addDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify"; // For notifications
import "react-toastify/dist/ReactToastify.css"; // Toastify CSS
import styles from "./QueryMgmt.module.css";

const QueryMgmt = () => {
  const [queries, setQueries] = useState([]); // State to store all queries
  const [filteredQueries, setFilteredQueries] = useState([]); // State to store filtered queries
  const [searchName, setSearchName] = useState(""); // State for name search
  const [searchEmail, setSearchEmail] = useState(""); // State for email search
  const [searchRole, setSearchRole] = useState(""); // State for role filter
  const [searchSubject, setSearchSubject] = useState(""); // State for subject filter
  const [selectedQuery, setSelectedQuery] = useState(null); // State to track selected query for chat
  const [message, setMessage] = useState(""); // State for chat message
  const [loading, setLoading] = useState(false); // State for loading
  const [unreadCounts, setUnreadCounts] = useState({}); // State to track unread messages for each query

  // Fetch all queries from Firestore
  const fetchQueries = async () => {
    setLoading(true);
    try {
      const queriesCollection = collection(db, "queries");
      const queriesSnapshot = await getDocs(queriesCollection);
      const queriesList = queriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setQueries(queriesList);
      setFilteredQueries(queriesList); // Initialize filtered queries with all queries
    } catch (error) {
      console.error("Error fetching queries:", error);
      toast.error("Failed to fetch queries. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch queries on component mount
  useEffect(() => {
    fetchQueries();
  }, []);

  // Handle search and filter
  useEffect(() => {
    let filtered = queries;

    if (searchName) {
      filtered = filtered.filter((q) =>
        q.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (searchEmail) {
      filtered = filtered.filter((q) =>
        q.email.toLowerCase().includes(searchEmail.toLowerCase())
      );
    }

    if (searchRole) {
      filtered = filtered.filter((q) => q.role === searchRole);
    }

    if (searchSubject) {
      filtered = filtered.filter((q) => q.subject === searchSubject);
    }

    setFilteredQueries(filtered);
  }, [searchName, searchEmail, searchRole, searchSubject, queries]);

  // Handle chat button click
  const handleChatClick = async (queryItem) => {
    try {
      // Fetch all messages for the selected query
      const messagesCollection = collection(db, "messages");
      const messagesQuery = query(
        messagesCollection,
        where("queryId", "==", queryItem.id),
        orderBy("timestamp", "asc")
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      const messagesList = messagesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Update the selected query with its messages
      setSelectedQuery({
        ...queryItem,
        messages: messagesList,
      });

      // Mark all messages as read
      const unreadMessages = messagesList.filter((msg) => !msg.read && msg.sender === "user");
      if (unreadMessages.length > 0) {
        unreadMessages.forEach(async (msg) => {
          await updateDoc(doc(db, "messages", msg.id), { read: true });
        });
      }

      // Reset unread count for this query
      setUnreadCounts((prev) => ({
        ...prev,
        [queryItem.id]: 0, // Reset unread count to 0
      }));
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to fetch messages. Please try again.");
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedQuery) return;

    try {
      // Add message to the messages collection
      await addDoc(collection(db, "messages"), {
        queryId: selectedQuery.id,
        sender: "admin",
        message: message,
        timestamp: new Date(),
        read: true, // Admin messages are marked as read by default
      });

      setMessage(""); // Clear the message input
      toast.success("Message sent successfully!");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  };

  // Listen for real-time updates on messages
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

        // Calculate unread messages from users
        const unreadMessages = messagesList.filter(
          (msg) => msg.sender === "user" && !msg.read
        );
        setUnreadCounts((prev) => ({
          ...prev,
          [selectedQuery.id]: unreadMessages.length,
        }));

        // Show notification for new messages from users
        const lastMessage = messagesList[messagesList.length - 1];
        if (lastMessage && lastMessage.sender === "user" && !lastMessage.read) {
          toast.info(`New message from ${selectedQuery.name}: ${lastMessage.message}`);
        }
      });

      return () => unsubscribe(); // Cleanup listener
    }
  }, [selectedQuery]);

  // Listen for real-time updates on all queries
  useEffect(() => {
    const queriesCollection = collection(db, "queries");
    const unsubscribe = onSnapshot(queriesCollection, (snapshot) => {
      const queriesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setQueries(queriesList);
      setFilteredQueries(queriesList);
    });

    return () => unsubscribe(); // Cleanup listener
  }, []);

  return (
    <div className={styles.container}>
      <h1>Query Management</h1>
      <ToastContainer /> {/* For notifications */}

      {/* Search and Filter Options */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by Name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Search by Email"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
        />
        <select
          value={searchRole}
          onChange={(e) => setSearchRole(e.target.value)}
        >
          <option value="">Filter by Role</option>
          <option value="customer">Customer</option>
          <option value="retailer">Retailer</option>
          <option value="wholesaler">Wholesaler</option>
        </select>
        <select
          value={searchSubject}
          onChange={(e) => setSearchSubject(e.target.value)}
        >
          <option value="">Filter by Subject</option>
          <option value="orders">Orders</option>
          <option value="account">Account</option>
          <option value="cart">Cart</option>
          <option value="checkout">Checkout</option>
          <option value="payment">Payment</option>
          <option value="shop">Shop</option>
          <option value="inventory">Inventory</option>
          <option value="myproducts">My Products</option>
        </select>
      </div>

      {/* Queries Table */}
      {loading ? (
        <p>Loading queries...</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Subject</th>
              <th>Query</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQueries.map((q) => (
              <tr key={q.id}>
                <td>{q.name}</td>
                <td>{q.email}</td>
                <td>{q.role}</td>
                <td>{q.subject}</td>
                <td>{q.query}</td>
                <td>
                  <button onClick={() => handleChatClick(q)} className={styles.chatButton}>
                    Chat {unreadCounts[q.id] > 0 && `(${unreadCounts[q.id]})`}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Chat Section Overlay */}
      {selectedQuery && (
        <div className={styles.chatOverlay}>
          <div className={styles.chatContainer}>
            <h2>Chat with {selectedQuery.name}</h2>
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
                  className={`${styles.message} ${
                    msg.sender === "admin" ? styles.adminMessage : styles.userMessage
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

export default QueryMgmt;