

import Navbar from "./Navbar/Navbar";
import "./Layout.css";

function Layout({ children }) {
  return (
    <div className="layout">
      <Navbar />
      <main className="layout-content">{children}</main>
    </div>
  );
}

export default Layout;
