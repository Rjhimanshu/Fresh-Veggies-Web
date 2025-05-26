import { db } from "../firebase_Config";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

export const getCart = async (userId) => {
  const cartDoc = await getDoc(doc(db, "carts", userId));
  return cartDoc.exists() ? cartDoc.data().items : [];
};

export const addToCart = async (userId, product) => {
  const cartRef = doc(db, "carts", userId);
  
  await setDoc(cartRef, {
    items: arrayUnion(product)
  }, { merge: true });
};

export const updateCartItem = async (userId, productId, newQuantity, pricePerKg) => {
  const cartRef = doc(db, "carts", userId);
  const cart = await getCart(userId);
  
  const updatedItems = cart.map(item => {
    if (item.id === productId) {
      return {
        ...item,
        quantity: newQuantity,
        totalPrice: (pricePerKg * newQuantity).toFixed(2)
      };
    }
    return item;
  });
  
  await updateDoc(cartRef, { items: updatedItems });
};

export const removeFromCart = async (userId, productId) => {
  const cartRef = doc(db, "carts", userId);
  const cart = await getCart(userId);
  
  const updatedItems = cart.filter(item => item.id !== productId);
  await updateDoc(cartRef, { items: updatedItems });
};