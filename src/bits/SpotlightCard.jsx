import { useRef, useState } from 'react';

const SpotlightCard = ({ children, className = '', spotlightColor = 'rgba(255, 255, 255, 0.04)' }) => {
  const divRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  
  const handleMouseMove = e => {
    if (!divRef.current || isFocused) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  
  return (
    <div ref={divRef} onMouseMove={handleMouseMove}
      onFocus={() => { setIsFocused(true); setOpacity(1); }}
      onBlur={() => { setIsFocused(false); setOpacity(0); }}
      onMouseEnter={() => setOpacity(1)} onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden bg-[#09090b] rounded-2xl ${className}`}>
      <div className="pointer-events-none absolute inset-0 transition-opacity duration-700 ease-in-out"
        style={{ opacity, background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent)` }} />
      {children}
    </div>
  );
};

export default SpotlightCard;
