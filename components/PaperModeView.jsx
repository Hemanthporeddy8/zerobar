'use client';

import { useState, useEffect, useRef } from 'react';
import PostCard from './PostCard';

export default function PaperModeView({ posts, bookmarkedIds, followingIds, onRefresh, onExit }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState('next');

  const totalPages = posts.length || 1;
  const currentPost = posts[currentIndex];

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        nextPage();
      } else if (e.key === 'ArrowLeft') {
        prevPage();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, totalPages]);

  function nextPage() {
    if (currentIndex < totalPages - 1) {
      setFlipDirection('next');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setIsFlipping(false);
      }, 200);
    }
  }

  function prevPage() {
    if (currentIndex > 0) {
      setFlipDirection('prev');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentIndex((i) => i - 1);
        setIsFlipping(false);
      }, 200);
    }
  }

  // Touch gesture handlers
  function handleTouchStart(e) {
    setTouchStartX(e.touches[0].clientX);
    setTouchDeltaX(0);
  }

  function handleTouchMove(e) {
    if (touchStartX === null) return;
    const delta = e.touches[0].clientX - touchStartX;
    setTouchDeltaX(delta);
  }

  function handleTouchEnd() {
    if (touchStartX === null) return;
    const SWIPE_THRESHOLD = 50;
    if (touchDeltaX < -SWIPE_THRESHOLD) {
      nextPage();
    } else if (touchDeltaX > SWIPE_THRESHOLD) {
      prevPage();
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
  }

  // Mouse Drag handlers for desktop
  const [mouseStartX, setMouseStartX] = useState(null);

  function handleMouseDown(e) {
    setMouseStartX(e.clientX);
  }

  function handleMouseUp(e) {
    if (mouseStartX === null) return;
    const delta = e.clientX - mouseStartX;
    if (delta < -50) {
      nextPage();
    } else if (delta > 50) {
      prevPage();
    }
    setMouseStartX(null);
  }

  if (!currentPost) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#5B4E3E', background: '#F8F5EE', minHeight: '80vh' }}>
        <h2>The Zerobar Gazette</h2>
        <p>No stories printed for today yet.</p>
        <button className="btn btn-primary" onClick={onExit} style={{ marginTop: 20 }}>
          Exit Paper Mode
        </button>
      </div>
    );
  }

  return (
    <div
      className="paper-mode-wrap"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={{
        background: '#F8F5EE',
        color: '#1B1917',
        minHeight: '100vh',
        padding: '16px 18px 90px',
        position: 'relative',
        userSelect: 'none'
      }}
    >
      {/* Newspaper Masthead */}
      <div style={{ textAlign: 'center', borderBottom: '3px double #1B1917', paddingBottom: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: '#6A5F50', marginBottom: 4 }}>
          <span>VOL. I · NO. 26</span>
          <span style={{ fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>📰 Paper Broadside</span>
          <button
            onClick={onExit}
            style={{
              background: '#1B1917',
              color: '#F8F5EE',
              border: 'none',
              borderRadius: 999,
              padding: '3px 10px',
              fontSize: 10.5,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ✕ Exit
          </button>
        </div>

        <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 30, margin: '2px 0 6px', fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase' }}>
          The Zerobar Gazette
        </h1>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1B1917', borderBottom: '1px solid #1B1917', padding: '3px 0', fontSize: 10.5, fontFamily: "'IBM Plex Mono', monospace", color: '#4A4035' }}>
          <span>OFFLINE EDITION</span>
          <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span>ZERO SIGNAL VERIFIED</span>
        </div>
      </div>

      {/* Flip Progress & Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <button
          onClick={prevPage}
          disabled={currentIndex === 0}
          style={{
            background: currentIndex === 0 ? 'rgba(0,0,0,0.04)' : '#EBE4D5',
            border: '1px solid #D6CCB8',
            color: currentIndex === 0 ? '#A89E8D' : '#1B1917',
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontFamily: "'IBM Plex Mono', monospace",
            cursor: currentIndex === 0 ? 'default' : 'pointer',
            fontWeight: 600
          }}
        >
          ← Prev
        </button>

        <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: '#6A5F50', fontWeight: 600 }}>
          Story {currentIndex + 1} of {totalPages}
        </span>

        <button
          onClick={nextPage}
          disabled={currentIndex === totalPages - 1}
          style={{
            background: currentIndex === totalPages - 1 ? 'rgba(0,0,0,0.04)' : '#EBE4D5',
            border: '1px solid #D6CCB8',
            color: currentIndex === totalPages - 1 ? '#A89E8D' : '#1B1917',
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontFamily: "'IBM Plex Mono', monospace",
            cursor: currentIndex === totalPages - 1 ? 'default' : 'pointer',
            fontWeight: 600
          }}
        >
          Next →
        </button>
      </div>

      {/* Active Story Page with Paper Flip Animation */}
      <div
        style={{
          transition: 'transform 0.22s ease, opacity 0.22s ease',
          transform: isFlipping
            ? flipDirection === 'next'
              ? 'translateX(-40px) rotateY(-8deg)'
              : 'translateX(40px) rotateY(8deg)'
            : 'translateX(0) rotateY(0)',
          opacity: isFlipping ? 0.4 : 1
        }}
      >
        <div
          style={{
            background: '#FFFDF9',
            border: '1px solid #E0D7C5',
            borderRadius: 18,
            boxShadow: '0 8px 30px rgba(74, 64, 53, 0.12)',
            overflow: 'hidden'
          }}
        >
          <PostCard
            key={currentPost.id}
            post={currentPost}
            bookmarked={bookmarkedIds.has(currentPost.id)}
            following={followingIds.has(currentPost.user_id)}
            onChange={onRefresh}
          />
        </div>
      </div>

      {/* Tactile gesture hint */}
      <div style={{ textAlign: 'center', marginTop: 20, color: '#8A7D6B', fontSize: 11.5, fontFamily: "'IBM Plex Mono', monospace" }}>
        <span>👆 Swipe left/right or press <b>[←] [→]</b> keys to turn pages</span>
      </div>
    </div>
  );
}
