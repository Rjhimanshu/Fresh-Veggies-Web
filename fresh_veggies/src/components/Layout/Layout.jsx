import React from "react";
import Navbar from "../Common/Navbar/Navbar";
import Footer from "../Common/Footer/Footer";

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '60px' }}>
      <main>{children}</main>
      <Footer />

    </div>
    </>
  );
}

export default Layout;