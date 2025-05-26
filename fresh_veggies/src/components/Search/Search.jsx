import React, { useState } from "react";
import styles from "./Search.module.css";

const Search = ({ onSearch }) => {
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    onSearch(value); // Pass the search query to the parent component
  };

  return (
    <div className={styles.searchContainer}>
      <input
        type="text"
        placeholder="Search products"
        value={inputValue}
        onChange={handleInputChange}
        className={styles.searchInput}
      />
    </div>
  );
};

export default Search;