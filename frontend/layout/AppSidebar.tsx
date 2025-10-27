import Link from "next/link";
import React, { useContext } from "react";
import AppMenu from "./AppMenu";
import { LayoutContext } from "./context/layoutcontext";
import { MenuProvider } from "./context/menucontext";
import AppMenuRefineria from "./AppMenuRefineria";
import { usePathname } from "next/navigation";
import AppMenuBunkering from "./AppMenuBunkering";

const AppSidebar = () => {
  const { layoutConfig, setLayoutState } = useContext(LayoutContext);
  const pathname = usePathname();

  const anchor = () => {
    setLayoutState((prevLayoutState) => ({
      ...prevLayoutState,
      anchored: !prevLayoutState.anchored,
    }));
  };

  const renderMenu = () => {
    if (pathname.startsWith("/refineria")) {
      return <AppMenuRefineria />;
    } else if (pathname.startsWith("/bunkering")) {
      // Aquí deberías crear un componente AppMenuBunkering similar a los otros menús
      return <AppMenuBunkering />;
    } else {
      return <AppMenu />;
    }
  };

  return (
    <React.Fragment>
      <div className="layout-menu-container">
        <MenuProvider>{renderMenu()}</MenuProvider>
      </div>
    </React.Fragment>
  );
};

AppSidebar.displayName = "AppSidebar";

export default AppSidebar;
