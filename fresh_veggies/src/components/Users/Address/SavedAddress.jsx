import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../../firebase_Config"; // Adjust the path to your Firebase config
import { doc, getDoc, updateDoc } from "firebase/firestore";
import styles from "./SavedAddress.module.css";

function SavedAddress() {
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    pincode: "",
    state: "",
    city: "",
    address: "",
  });
  const [editIndex, setEditIndex] = useState(null);
  const navigate = useNavigate();

  // Fetch saved addresses from Firestore
  useEffect(() => {
    const fetchAddresses = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const addressesArray = Object.entries(userData)
            .filter(([key]) => key.startsWith("address"))
            .map(([key, value]) => ({ id: key, ...value }));
          setAddresses(addressesArray);
        }
      }
    };

    fetchAddresses();
  }, []);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Fetch state and city using PIN code API
  const fetchStateCity = async (pincode) => {
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      if (data[0].Status === "Success") {
        const postOffice = data[0].PostOffice[0];
        setFormData((prev) => ({
          ...prev,
          state: postOffice.State,
          city: postOffice.District,
        }));
      } else {
        alert("Invalid PIN code.");
      }
    } catch (error) {
      console.error("Error fetching state and city:", error);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      const addressKey = editIndex !== null ? `address${editIndex + 1}` : `address${addresses.length + 1}`;

      await updateDoc(userDocRef, {
        [addressKey]: formData,
      });

      // Redirect back to the checkout page
      navigate("/checkout");
    }
  };

  // Handle edit address
  const handleEdit = (index) => {
    setFormData(addresses[index]);
    setEditIndex(index);
    setShowForm(true);
  };

  // Handle delete address
  const handleDelete = async (index) => {
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      const addressKey = `address${index + 1}`;

      await updateDoc(userDocRef, {
        [addressKey]: null, // Remove the address
      });

      // Refresh addresses
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data();
      const addressesArray = Object.entries(userData)
        .filter(([key]) => key.startsWith("address"))
        .map(([key, value]) => ({ id: key, ...value }));
      setAddresses(addressesArray);
    }
  };

  return (
    <div className={styles.savedAddressContainer}>
      <h1>Saved Addresses</h1>
      {addresses.length === 0 ? (
        <p>You don't have any saved addresses. Kindly add your address.</p>
      ) : (
        <div className={styles.addressList}>
          {addresses.map((address, index) => (
            <div key={index} className={styles.addressCard}>
              <h3>{address.name}</h3>
              <p>{address.phone}</p>
              <p>{address.address}, {address.city}, {address.state} - {address.pincode}</p>
              <div className={styles.addressActions}>
                <button onClick={() => handleEdit(index)}>Edit</button>
                <button onClick={() => handleDelete(index)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <button className={styles.addAddressButton} onClick={() => setShowForm(true)}>
        Add Address
      </button>
      {showForm && (
        <div className={styles.addressForm}>
          <h2>{editIndex !== null ? "Edit Address" : "Add Address"}</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="pincode"
              placeholder="PIN Code"
              value={formData.pincode}
              onChange={(e) => {
                handleInputChange(e);
                if (e.target.value.length === 6) {
                  fetchStateCity(e.target.value);
                }
              }}
              required
            />
            <input
              type="text"
              name="state"
              placeholder="State"
              value={formData.state}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleInputChange}
              required
            />
            <textarea
              name="address"
              placeholder="Complete Address"
              value={formData.address}
              onChange={handleInputChange}
              required
            />
            <button type="submit">Save</button>
            <button type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default SavedAddress;