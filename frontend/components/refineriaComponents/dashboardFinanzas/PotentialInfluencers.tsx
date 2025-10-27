// RUTA: /components/dashboards/sales/PotentialInfluencers.tsx
import React from "react";
import { Button } from "primereact/button";

const PotentialInfluencers = () => {
  const influencers = [
    { name: "Jenna Watson", time: "2m ago", avatar: "ionibowcher.png" },
    { name: "Dan Cooper", time: "10m ago", avatar: "onyamalimba.png" },
    { name: "Kathryn Murphy", time: "50m ago", avatar: "elwinsharvill.png" },
    { name: "Smith Wilson", time: "40m ago", avatar: "stephenshaw.png" },
  ];
  return (
    <div className="card">
      <h5>Potential Influencers</h5>
      <div className="flex flex-wrap align-items-center justify-content-around gap-2">
        <div className="flex flex-column align-items-center justify-content-center">
          <Button
            icon="pi pi-plus text-2xl"
            rounded
            outlined
            className="w-4rem h-4rem mb-2"
          ></Button>
          <span className="font-bold text-sm">Add New</span>
        </div>
        {influencers.map((influencer, i) => (
          <div
            key={i}
            className="flex flex-column align-items-center justify-content-center"
          >
            <div className="flex align-items-center justify-content-center w-4rem h-4rem bg-transparent border-3 surface-border border-circle relative">
              <img
                src={`/demo/images/avatar/${influencer.avatar}`}
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
            <span className="font-bold">{influencer.name}</span>
            <span className="text-color-secondary text-sm">
              {influencer.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PotentialInfluencers;
