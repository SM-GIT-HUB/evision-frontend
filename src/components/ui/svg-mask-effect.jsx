import { useState, useEffect, useRef } from "react";

export function MaskContainer({
  children,
  revealText,
  size = 40,
  revealSize = 400,
  className = "",
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: null, y: null });
  const containerRef = useRef(null);

  useEffect(() => {
    const updateMousePosition = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", updateMousePosition);
      return () => container.removeEventListener("mousemove", updateMousePosition);
    }
  }, []);

  const maskSize = isHovered ? revealSize : size;
  
  // Use center position if mouse hasn't moved yet
  const maskX = mousePosition.x !== null ? mousePosition.x : '50%';
  const maskY = mousePosition.y !== null ? mousePosition.y : '50%';
  
  const maskPositionStyle = mousePosition.x !== null 
    ? `${maskX - maskSize/2}px ${maskY - maskSize/2}px` 
    : 'center';

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full overflow-hidden flex items-center justify-center ${className}`}
    >
      {/* Background Layer: Visible outside the mask */}
      <div className="absolute inset-0 flex items-center justify-center text-center">
        {revealText}
      </div>

      {/* Masked Layer: The "Flashlight" Circle */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-[mask-size] duration-300 ease-out"
        style={{
          maskImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='50' fill='black'/%3E%3C/svg%3E")`,
          maskSize: `${maskSize}px`,
          maskRepeat: "no-repeat",
          maskPosition: maskPositionStyle,
          WebkitMaskImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='50' fill='black'/%3E%3C/svg%3E")`,
          WebkitMaskSize: `${maskSize}px`,
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: maskPositionStyle,
        }}
      >
        <div className="w-full h-full flex items-center justify-center bg-white text-black">
          {children}
        </div>
      </div>
    </div>
  );
}
