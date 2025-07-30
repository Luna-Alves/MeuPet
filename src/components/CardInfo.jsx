import React from "react";

export default function CardInfo({ title, imageSrc, children }) {
  return (
    <div className="card h-100 card-info">
      <img
        src={imageSrc}
        className="card-img-top"
        alt={title}
        style={{ objectFit: "cover", height: "200px" }}
      />
      <div className="card-body">
        <h5 className="card-title">{title}</h5>
        <p className="card-text">{children}</p>
      </div>
    </div>
  );
}
