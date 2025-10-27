import React, { useContext } from "react";
import { Button } from "primereact/button";
import { LayoutContext } from "./context/layoutcontext";

const AppFooter = () => {
  const { layoutConfig } = useContext(LayoutContext);

  return (
    <div className="layout-footer mt-auto">
      <div className="footer-start">
        <img
          src={
            "/layout/images/" +
            (layoutConfig.colorScheme === "light"
              ? "maroilIcono"
              : "maroilIcono") +
            ".ico"
          }
          alt="logo"
        />
        <span className="app-name">Maroil Refinery</span>
      </div>
      <div className="footer-right">
        <span>© Maroil Automation</span>
      </div>
    </div>
  );
};

export default AppFooter;
