// RUTA: /components/dashboards/sales/BestSellers.tsx
import React from "react";
import { Knob } from "primereact/knob";

const BestSellers = () => {
  const sellers = [
    {
      name: "Bamboo Watch",
      category: "Accessories",
      image: "bamboo-watch.png",
      value: 75,
    },
    {
      name: "Black Watch",
      category: "Accessories",
      image: "black-watch.png",
      value: 29,
    },
    {
      name: "Blue Band",
      category: "Fitness",
      image: "blue-band.png",
      value: 42,
    },
    {
      name: "Blue T-Shirt",
      category: "Clothing",
      image: "blue-t-shirt.png",
      value: 26,
    },
    {
      name: "Sneakers",
      category: "Clothing",
      image: "sneakers.jpg",
      value: 60,
    },
  ];

  return (
    <div className="card h-full">
      <h5>Best Sellers</h5>
      <ul className="list-none p-0 m-0">
        {sellers.map((seller, i) => (
          <li
            key={i}
            className="flex align-items-center justify-content-between py-2"
          >
            <div className="flex align-items-center justify-content-between">
              <img
                src={`/demo/images/product/${seller.image}`}
                alt={seller.name}
                className="w-3rem h-3rem border-round"
              />
              <div className="ml-2 flex flex-column">
                <span className="font-bold">{seller.name}</span>
                <span className="text-color-secondary text-sm">
                  {seller.category}
                </span>
              </div>
            </div>
            <Knob
              value={seller.value}
              size={40}
              className="ml-auto"
              showValue={false}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BestSellers;
