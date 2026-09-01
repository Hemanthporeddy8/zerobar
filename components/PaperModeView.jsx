'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import PostCard from './PostCard';

/* ── Offline Web Audio API: synthetic paper-flip rustle ── */
function playPaperSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const len = ctx.sampleRate * 0.14; // 140 ms
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.22));
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1400;
    bp.Q.value = 0.9;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.22, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.14);

    src.connect(bp);
    bp.connect(g);
    g.connect(ctx.destination);
    src.start();
  } catch {
    /* ignore */
  }
}

export default function PaperModeView({ posts, bookmarkedIds, followingIds, onRefresh, onExit }) {
  const [currentFlip, setCurrentFlip] = useState(0);
  const [flippedSet, setFlippedSet] = useState(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartX = useRef(null);

  const totalSheets = posts.length;

  /* ── Flip helpers ── */
  const flipNext = useCallback(() => {
    if (currentFlip >= totalSheets || isAnimating) return;
    setIsAnimating(true);
    playPaperSound();
    setFlippedSet(prev => new Set(prev).add(currentFlip));
    setCurrentFlip(prev => prev + 1);
    setTimeout(() => setIsAnimating(false), 900);
  }, [currentFlip, totalSheets, isAnimating]);

  const flipPrev = useCallback(() => {
    if (currentFlip <= 0 || isAnimating) return;
    setIsAnimating(true);
    playPaperSound();
    const idx = currentFlip - 1;
    setFlippedSet(prev => {
      const s = new Set(prev);
      s.delete(idx);
      return s;
    });
    setCurrentFlip(prev => prev - 1);
    setTimeout(() => setIsAnimating(false), 900);
  }, [currentFlip, isAnimating]);

  /* ── Keyboard ── */
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        flipNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        flipPrev();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipNext, flipPrev]);

  /* ── Touch swipe ── */
  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 50) {
      dx > 0 ? flipNext() : flipPrev();
    }
    touchStartX.current = null;
  }

  /* ── Empty state ── */
  if (!posts || posts.length === 0) {
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

  const pageLabel =
    currentFlip === 0
      ? 'Cover'
      : currentFlip === totalSheets
        ? 'The End'
        : `Page ${currentFlip} of ${totalSheets}`;

  return (
    <div
      className="paper-mode-wrap"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        background: 'radial-gradient(ellipse at center, #3a3128 0%, #1c1712 100%)',
        color: '#1B1917',
        minHeight: '100vh',
        padding: '14px 12px 60px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        userSelect: 'none',
        overflow: 'hidden'
      }}
    >
      {/* ── Newspaper Masthead ── */}
      <div style={{ textAlign: 'center', width: '100%', maxWidth: 520, marginBottom: 12, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: '#cbbfa8', marginBottom: 4 }}>
          <span>VOL. I · NO. 26</span>
          <span style={{ fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>📰 Flip Book Edition</span>
          <button
            onClick={onExit}
            style={{
              background: '#fdfaf3',
              color: '#1B1917',
              border: 'none',
              borderRadius: 999,
              padding: '4px 12px',
              fontSize: 10.5,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ✕ Exit
          </button>
        </div>

        <h1 style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 28,
          margin: '2px 0 6px',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          textTransform: 'uppercase',
          color: '#fdfaf3'
        }}>
          The Zerobar Gazette
        </h1>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #6A5F50', borderBottom: '1px solid #6A5F50', padding: '3px 0', fontSize: 10.5, fontFamily: "'IBM Plex Mono', monospace", color: '#8A7D6B' }}>
          <span>FLIP BOOK EDITION</span>
          <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span>SWIPE TO TURN</span>
        </div>
      </div>

      {/* ── Flip-Book Scene ── */}
      <div className="fb-scene">
        <div className="fb-book">
          <div className="fb-spine" />
          <div className="fb-base" />

          {posts.map((post, i) => {
            const isFlipped = flippedSet.has(i);
            return (
              <div
                key={post.id || i}
                className={`fb-page${isFlipped ? ' fb-flipped' : ''}`}
                style={{ zIndex: isFlipped ? totalSheets + i : totalSheets - i }}
              >
                {/* Front face — PostCard */}
                <div className="fb-face fb-front">
                  <div className="fb-face-scroll">
                    <PostCard
                      post={post}
                      bookmarked={bookmarkedIds.has(post.id)}
                      following={followingIds.has(post.user_id)}
                      onChange={onRefresh}
                    />
                  </div>
                  <div className="fb-page-num" style={{ right: 16 }}>{i + 1}</div>
                </div>

                {/* Back face — decorative ruled paper */}
                <div className="fb-face fb-back">
                  <div style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a09585',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 13,
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 27px, #e8e0d0 27px, #e8e0d0 28px)',
                    padding: 30
                  }}>
                    <div style={{ fontSize: 44, marginBottom: 14, opacity: 0.25 }}>📰</div>
                    <span style={{ fontStyle: 'italic' }}>Turn to continue reading…</span>
                  </div>
                  <div className="fb-page-num" style={{ left: 16 }}>{i + 1}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 20, flexShrink: 0 }}>
        <button
          onClick={flipPrev}
          disabled={currentFlip === 0 || isAnimating}
          className="fb-btn"
        >
          ← Prev
        </button>
        <button
          onClick={flipNext}
          disabled={currentFlip === totalSheets || isAnimating}
          className="fb-btn"
        >
          Next →
        </button>
      </div>

      {/* ── Page counter ── */}
      <div style={{ textAlign: 'center', marginTop: 10, color: '#cbbfa8', fontSize: 13, letterSpacing: 1, fontFamily: "'IBM Plex Mono', monospace" }}>
        {pageLabel}
      </div>

      {/* ── Hint ── */}
      <div style={{ textAlign: 'center', marginTop: 8, color: '#6A5F50', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>
        👆 Swipe left / right or press <b>[←] [→]</b> keys to turn pages
      </div>
    </div>
  );
}
