'use client';

import { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const cursorDotRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isText, setIsText] = useState(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    const cursorDot = cursorDotRef.current;

    if (!cursor || !cursorDot) return;

    // Smooth cursor movement with lerping
    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    const speed = 0.15;

    const animate = () => {
      // Lerp for smooth movement on outer ring
      cursorX += (mouseX - cursorX) * speed;
      cursorY += (mouseY - cursorY) * speed;

      cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;

      requestAnimationFrame(animate);
    };

    const moveCursor = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        setIsVisible(true);
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    // Detect interactive elements
    const handleMouseOver = (e) => {
      const target = e.target;
      const isInteractive = target.closest('a, button, [role="button"], .clickable, .action-card, .nav-link, .btn, select');
      const isTextInput = target.closest('input[type="text"], input[type="email"], input[type="password"], textarea, [contenteditable="true"]');

      setIsPointer(!!isInteractive);
      setIsText(!!isTextInput);
    };

    document.addEventListener('mousemove', moveCursor);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseover', handleMouseOver);

    // Start animation
    animate();

    return () => {
      document.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, [isVisible]);

  // Build class names
  const cursorClasses = [
    'custom-cursor',
    isVisible ? 'visible' : '',
    isPointer ? 'pointer' : '',
    isClicking ? 'clicking' : '',
    isText ? 'text' : ''
  ].filter(Boolean).join(' ');

  const dotClasses = [
    'custom-cursor-dot',
    isVisible ? 'visible' : '',
    isPointer ? 'pointer' : '',
    isClicking ? 'clicking' : ''
  ].filter(Boolean).join(' ');

  return (
    <>
      <div ref={cursorRef} className={cursorClasses} />
      <div ref={cursorDotRef} className={dotClasses} />
    </>
  );
}
