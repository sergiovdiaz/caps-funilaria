import "./styles/skeleton.css";

export const SkeletonBox = ({ height = 80 }) => (
  <div className="skeleton-box" style={{ height }} />
);

export const SkeletonLine = ({ width = "100%" }) => (
  <div className="skeleton-line" style={{ width }} />
);
