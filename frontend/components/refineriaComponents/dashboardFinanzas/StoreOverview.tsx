import React, { useState } from "react";
import { classNames } from "primereact/utils";
import { Badge } from "primereact/badge";

interface ListItem {
  image: string;
  text: string;
  subtext: string;
  ratio: string;
}

const StoreOverview = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [activeListItemIndex, setActiveListItemIndex] = useState(1);
  const [listItems, setListItems] = useState<ListItem[]>([
    {
      image: "/demo/images/dashboard/sneaker.png",
      text: "Red Sneakers",
      subtext: "RX Series",
      ratio: "+40%",
    },
    {
      image: "/demo/images/dashboard/headphones.png",
      text: "HF Headphones",
      subtext: "Wireless",
      ratio: "+24%",
    },
    {
      image: "/demo/images/dashboard/sunglasses.png",
      text: "Sunglasses",
      subtext: "UV Protection",
      ratio: "+17%",
    },
  ]);

  const activeListItem = listItems[activeListItemIndex] || listItems[0];

  const handleItemClick = (index: number) => {
    setActiveListItemIndex(index);
  };

  const onTabClick = (index: number) => {
    setActiveTab(index);
    // Lógica para cambiar listItems según la pestaña
  };

  return (
    <div className="card h-full">
      <h5>Store Overview</h5>
      {/* Aquí va todo el JSX del Store Overview, usando su propio estado local */}
      {/* ... (copia y pega el JSX correspondiente desde DashboardSales) ... */}
    </div>
  );
};

export default StoreOverview;
