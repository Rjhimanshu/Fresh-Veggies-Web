import React, { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { app } from "../../firebaseConfig";
import styles from "./UserMgmt.module.css";

const UserMgmt = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phoneNumber: "", role: "" });
  const [editingUser, setEditingUser] = useState(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const db = getFirestore(app);

  // Fetch users from Firestore
  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
      setFilteredUsers(usersList);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
    }
  };

  // Apply search and filters
  useEffect(() => {
    let results = users;
    
    // Apply role filter
    if (roleFilter !== "all") {
      results = results.filter(user => user.role === roleFilter);
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(user => 
        user.id.toLowerCase().includes(term) ||
        (user.name && user.name.toLowerCase().includes(term)) ||
        (user.email && user.email.toLowerCase().includes(term)) ||
        (user.phoneNumber && user.phoneNumber.includes(term))
      );
    }
    
    setFilteredUsers(results);
  }, [users, searchTerm, roleFilter]);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission (Add or Update User)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update existing user
        const userRef = doc(db, "users", editingUser.id);
        await updateDoc(userRef, formData);
        setEditingUser(null);
      } else {
        // Add new user
        await addDoc(collection(db, "users"), formData);
      }
      setFormData({ name: "", email: "", phoneNumber: "", role: "" });
      setShowForm(false);
      fetchUsers();
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  // Handle edit button click
  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({ 
      name: user.name || "", 
      email: user.email || "", 
      phoneNumber: user.phoneNumber || "", 
      role: user.role || "" 
    });
    setShowForm(true);
  };

  // Handle delete button click with confirmation
  const handleDelete = async (userId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "users", userId));
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>User Management</h1>

      {/* Search and Filter Controls */}
      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by UID, name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterContainer}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="retailer">Retailer</option>
            <option value="wholesaler">Wholesaler</option>
          </select>
        </div>
        
        <button 
          onClick={() => setShowForm(true)} 
          className={styles.addButton}
          disabled={showForm}
        >
          Add New User
        </button>
      </div>

      {/* Form for Adding/Editing User */}
      {showForm && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <h2>{editingUser ? "Edit User" : "Add New User"}</h2>
          
          <div className={styles.formGroup}>
            <label>Name:</label>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Email:</label>
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Phone Number:</label>
            <input
              type="text"
              name="phoneNumber"
              placeholder="Phone Number"
              value={formData.phoneNumber}
              onChange={handleInputChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Role:</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Role</option>
              <option value="customer">Customer</option>
              <option value="retailer">Retailer</option>
              <option value="wholesaler">Wholesaler</option>
            </select>
          </div>
          
          <div className={styles.formActions}>
            <button type="submit" className={styles.submitButton}>
              {editingUser ? "Update User" : "Save User"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingUser(null);
                setFormData({ name: "", email: "", phoneNumber: "", role: "" });
              }}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* User Table */}
      {loading ? (
        <p className={styles.loading}>Loading users...</p>
      ) : filteredUsers.length === 0 ? (
        <p className={styles.noResults}>No users found matching your criteria.</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className={styles.userId}>{user.id}</td>
                  <td>{user.name || "N/A"}</td>
                  <td>{user.email || "N/A"}</td>
                  <td>{user.phoneNumber || "N/A"}</td>
                  <td>
                    <span className={`${styles.roleBadge} ${styles[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className={styles.actions}>
                    <button 
                      onClick={() => handleEdit(user)} 
                      className={styles.editButton}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)} 
                      className={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserMgmt;