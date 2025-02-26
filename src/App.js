import React, { useState, useRef, useEffect } from 'react';

function BoxBreathing() {
  // -------------------------------
  // Centered Rectangle State
  // -------------------------------
  const initialWidth = 200;
  const initialHeight = 200;
  const [rect, setRect] = useState({
    x: window.innerWidth / 2 - initialWidth / 2,
    y: window.innerHeight / 2 - initialHeight / 2,
    width: initialWidth,
    height: initialHeight,
  });

  // -------------------------------
  // Animation & Breathing State
  // -------------------------------
  const [dotPos, setDotPos] = useState({ x: 0, y: 0 });
  const [fillFrac, setFillFrac] = useState(0); // 0 = empty, 1 = full
  const speed = 80; // constant speed in px/sec
  const requestIdRef = useRef(null);
  const startTimeRef = useRef(null);

  // -------------------------------
  // Dragging Logic
  // -------------------------------
  const draggingCorner = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const onMouseDown = (e) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const cornerX = centerX + rect.width / 2;
    const cornerY = centerY + rect.height / 2;
    const dist = Math.hypot(e.clientX - cornerX, e.clientY - cornerY);
    if (dist < 15) {
      draggingCorner.current = true;
      dragOffset.current = {
        x: e.clientX - cornerX,
        y: e.clientY - cornerY,
      };
    }
  };

  const onMouseMove = (e) => {
    if (!draggingCorner.current) return;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const newCornerX = e.clientX - dragOffset.current.x;
    const newCornerY = e.clientY - dragOffset.current.y;
    const deltaX = Math.max(newCornerX, centerX) - centerX;
    const deltaY = Math.max(newCornerY, centerY) - centerY;
    const newWidth = Math.max(50, deltaX * 2);
    const newHeight = Math.max(50, deltaY * 2);
    setRect({
      x: centerX - newWidth / 2,
      y: centerY - newHeight / 2,
      width: newWidth,
      height: newHeight,
    });
  };

  const onMouseUp = () => {
    draggingCorner.current = false;
  };

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      setRect((prev) => ({
        ...prev,
        x: centerX - prev.width / 2,
        y: centerY - prev.height / 2,
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // -------------------------------
  // Animation Loop
  // -------------------------------
  useEffect(() => {
    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsedSec = (timestamp - startTimeRef.current) / 1000;

      // Define clockwise edges:
      // Edge0: bottom left -> top left (inhaling: vertical up, length = rect.height)
      // Edge1: top left -> top right (hold full)
      // Edge2: top right -> bottom right (exhaling: vertical down, length = rect.height)
      // Edge3: bottom right -> bottom left (hold empty)
      const edge0Len = rect.height;
      const edge1Len = rect.width;
      const edge2Len = rect.height;
      const edge3Len = rect.width;
      const perimeter = edge0Len + edge1Len + edge2Len + edge3Len;
      const cycleTime = perimeter / speed;
      const cycleFrac = (elapsedSec % cycleTime) / cycleTime;
      const distAlong = perimeter * cycleFrac;

      // Corner coordinates
      const bottomLeft = { x: rect.x, y: rect.y + rect.height };
      const topLeft = { x: rect.x, y: rect.y };
      const topRight = { x: rect.x + rect.width, y: rect.y };
      const bottomRight = { x: rect.x + rect.width, y: rect.y + rect.height };

      let edge, localDist;
      if (distAlong <= edge0Len) {
        edge = 0;
        localDist = distAlong;
      } else if (distAlong <= edge0Len + edge1Len) {
        edge = 1;
        localDist = distAlong - edge0Len;
      } else if (distAlong <= edge0Len + edge1Len + edge2Len) {
        edge = 2;
        localDist = distAlong - (edge0Len + edge1Len);
      } else {
        edge = 3;
        localDist = distAlong - (edge0Len + edge1Len + edge2Len);
      }

      let x = 0, y = 0, fill = fillFrac;
      switch (edge) {
        case 0:
          // Inhale: fill increases from 0 → 1
          x = bottomLeft.x;
          y = bottomLeft.y - localDist;
          fill = localDist / rect.height;
          break;
        case 1:
          // Hold: full
          x = topLeft.x + localDist;
          y = topLeft.y;
          fill = 1;
          break;
        case 2:
          // Exhale: fill decreases from 1 → 0
          x = topRight.x;
          y = topRight.y + localDist;
          fill = 1 - localDist / rect.height;
          break;
        case 3:
          // Hold: empty
          x = bottomRight.x - localDist;
          y = bottomRight.y;
          fill = 0;
          break;
        default:
          break;
      }

      setDotPos({ x, y });
      setFillFrac(fill);
      requestIdRef.current = requestAnimationFrame(animate);
    };

    requestIdRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestIdRef.current) cancelAnimationFrame(requestIdRef.current);
    };
  }, [rect]);

  // -------------------------------
  // Helper for Gradual Color Interpolation
  // -------------------------------
  // Dark blue (#001f7f) at 0 and light blue (#0033ff) at 1
  const getFillColor = (frac) => {
    const r = 0;
    const g = Math.round(31 + frac * 20);    // 31 → 51
    const b = Math.round(127 + frac * 128);  // 127 → 255
    return `rgb(${r}, ${g}, ${b})`;
  };

  // The fill container's height reflects the current fill fraction.
  const fillHeight = fillFrac * rect.height;

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#000',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseDown={onMouseDown}
    >
      {/* Centered rectangle (no border here) */}
      <div
        style={{
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* Fill container with gradual color transition */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: '100%',
            height: fillHeight,
            background: getFillColor(fillFrac),
          }}
        />
        {/* Animated dot */}
        <div
          style={{
            position: 'absolute',
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#fff',
            left: dotPos.x - rect.x - 8,
            top: dotPos.y - rect.y - 8,
            zIndex: 1,
          }}
        />
        {/* Border overlay to ensure the white border remains visible */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: '2px solid #fff',
            boxSizing: 'border-box',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      </div>

      {/* Draggable corner handle */}
      <div
        style={{
          position: 'absolute',
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: '2px solid #fff',
          background: '#444',
          cursor: 'nwse-resize',
          left: rect.x + rect.width - 8,
          top: rect.y + rect.height - 8,
          zIndex: 3,
        }}
      />
    </div>
  );
}

export default BoxBreathing;
