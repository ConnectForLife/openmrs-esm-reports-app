import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import styles from "./root.scss";
import OverviewComponent from "./components/overview.component";

const RootComponent: React.FC = () => {
  return (
    <div className={styles.container}>
      <BrowserRouter basename={`${window.spaBase}/reports`}>
        <Routes>
          <Route path="/" element={<OverviewComponent />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default RootComponent;
