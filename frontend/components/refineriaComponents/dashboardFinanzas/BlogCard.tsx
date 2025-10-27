// RUTA: /components/dashboards/sales/BlogCard.tsx
import React from "react";

const BlogCard = () => {
  return (
    <div className="card p-0">
      <img
        src="/demo/images/dashboard/bg-product.jpg"
        alt="blog-bg"
        className="w-full border-round-top-2xl"
      />
      <div className="p-4">
        <div className="flex align-items-center justify-content-between mb-3">
          <div className="inline-flex align-items-center">
            <span className="font-bold">Optimizing Logistics</span>
            <i className="pi pi-check-circle ml-3 text-xl text-green-500"></i>
          </div>
          <i className="pi pi-bookmark ml-3 text-xl text-color-secondary"></i>
        </div>
        <p className="mb-5 line-height-3">
          Sit amet nulla facilisi morbi tempus iaculis. Dolor magna eget est
          lorem ipsum dolor sit.
        </p>
        <div className="flex align-items-center justify-content-between">
          <img
            src="/demo/images/avatar/amyelsner.png"
            alt="avatar"
            className="flex-shrink-0 w-2rem h-2rem"
          />
          <div className="text-color-secondary flex align-items-center">
            <i className="pi pi-heart mr-1"></i>
            <span>888</span>
            <i className="pi pi-eye ml-4 mr-1"></i>
            <span>8888</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
