import React from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import styles from "./root.scss";
import OverviewComponent from "./components/overview.component";

const RootComponent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <h3 className={styles.welcome}>
        {t("welcomeText", "Welcome to the O3 Template app")}
      </h3>
      <BrowserRouter basename={`${window.spaBase}/reports`}>
        <Routes>
          <Route path="/" element={<OverviewComponent />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default RootComponent;
