const DripBorder = ({ color = "#050505", className = "" }) => {
  return (
    <svg
      className={`drip-border ${className}`}
      viewBox="0 0 1440 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <path
        d={`
          M0,0 
          L1440,0 
          L1440,40 
          Q1400,40 1380,60 
          Q1360,100 1340,60 
          Q1320,20 1280,40 
          L1280,80
          Q1260,120 1240,80
          Q1220,40 1180,60
          Q1140,80 1120,40
          L1120,60
          Q1100,100 1060,60
          Q1020,20 980,50
          Q940,80 900,40
          L900,70
          Q880,110 840,70
          Q800,30 760,60
          Q720,90 680,50
          L680,80
          Q660,120 620,80
          Q580,40 540,70
          Q500,100 460,60
          L460,40
          Q440,80 400,50
          Q360,20 320,60
          Q280,100 240,60
          L240,80
          Q220,120 180,80
          Q140,40 100,70
          Q60,100 20,60
          L0,40
          Z
        `}
        fill={color}
      />
    </svg>
  );
};

export default DripBorder;
