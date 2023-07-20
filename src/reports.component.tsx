import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

const RootComponent: React.FC = () => {
    console.log('URL--->', window.spaBase);
    return (
      <BrowserRouter basename={`${window.spaBase}/reports`}>
        <Routes>
          <Route path="/" element={<Overview />} />
        </Routes>
      </BrowserRouter>
    );
  };
  
  export default RootComponent;