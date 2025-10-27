// RUTA: /components/dashboards/sales/CustomerStories.tsx
import React from "react";
import { Button } from "primereact/button";

const CustomerStories = () => {
  const stories = [
    { name: "Darlene Robertson", time: "2m ago", avatar: "amyelsner.png" },
    { name: "Albert Flores", time: "1h ago", avatar: "annafali.png" },
    { name: "Annette Black", time: "6m ago", avatar: "asiyajavayant.png" },
    { name: "Ralph Edwards", time: "4m ago", avatar: "bernardodominic.png" },
  ];

  return (
    <div className="card">
      <h5>Customer Stories</h5>
      <div className="flex flex-wrap align-items-center justify-content-around gap-2">
        <div className="flex flex-column align-items-center justify-content-center">
          <Button
            icon="pi pi-plus text-2xl"
            outlined
            rounded
            className="w-4rem h-4rem mb-2"
          ></Button>
          <span className="font-bold text-sm">Add New</span>
        </div>
        {stories.map((story, i) => (
          <div
            key={i}
            className="flex flex-column align-items-center justify-content-center"
          >
            <div className="flex align-items-center justify-content-center w-4rem h-4rem bg-transparent border-3 surface-border border-circle relative">
              <img
                src={`/demo/images/avatar/${story.avatar}`}
                className="border-circle h-3rem w-3rem"
                alt="avatar"
              />
              <span
                className="absolute top-0 surface-card border-circle flex align-items-center justify-content-center"
                style={{ right: "-0.75rem", width: "1.5rem", height: "1.5rem" }}
              >
                <i className="pi pi-globe text-sm"></i>
              </span>
            </div>
            <span className="font-bold">{story.name}</span>
            <span className="text-color-secondary text-sm">{story.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerStories;
