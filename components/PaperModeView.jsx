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
    const len = ctx.sampleRate * 0.14;
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
  } catch { /* ignore */ }
}

export default function PaperModeView({ posts, bookmarkedIds, followingIds, onRefresh, onExit }) {
  const [currentFlip, setCurrentFlip] = useState(0);
  const [flippedSet, setFlippedSet] = useState(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartX = useRef(null);
  const pageRefs = useRef([]);
  const isDragging = useRef(false);

  const totalSheets = posts.length;

  /* ── DOM helpers: set transform + fold-shade directly for drag perf ── */
  function setPageRotation(index, deg) {
    const el = pageRefs.current[index];
    if (!el) return;
    el.style.transform = `rotateY(${deg}deg)`;
    const t = Math.min(Math.abs(deg) / 180, 1);
    el.querySelectorAll('.fb-fold-shade').forEach(s => {
      s.style.opacity = String(t * 0.85);
    });
  }

  /* ── Snap helpers (shared by buttons, keyboard, drag) ── */
  const snapForward = useCallback((pageIndex) => {
    const el = pageRefs.current[pageIndex];
    if (el) el.classList.remove('fb-dragging');
    playPaperSound();
    setPageRotation(pageIndex, -180);
    setFlippedSet(prev => new Set(prev).add(pageIndex));
    setCurrentFlip(prev => prev + 1);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 700);
  }, []);

  const snapBack = useCallback((pageIndex) => {
    const el = pageRefs.current[pageIndex];
    if (el) el.classList.remove('fb-dragging');
    playPaperSound();
    setPageRotation(pageIndex, 0);
    setFlippedSet(prev => {
      const s = new Set(prev);
      s.delete(pageIndex);
      return s;
    });
    setCurrentFlip(prev => prev - 1);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 700);
  }, []);

  /* ── Button / keyboard flip ── */
  const flipNext = useCallback(() => {
    if (currentFlip >= totalSheets || isAnimating || isDragging.current) return;
    snapForward(currentFlip);
  }, [currentFlip, totalSheets, isAnimating, snapForward]);

  const flipPrev = useCallback(() => {
    if (currentFlip <= 0 || isAnimating || isDragging.current) return;
    snapBack(currentFlip - 1);
  }, [currentFlip, isAnimating, snapBack]);

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

  /* ── Corner drag handler (pointer events for mouse + touch) ── */
  function handleCornerDown(e, pageIndex, direction) {
    if (isAnimating) return;
    e.preventDefault();
    e.stopPropagation();

    const pageEl = pageRefs.current[pageIndex];
    if (!pageEl) return;

    const handle = e.currentTarget;
    const startX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const width = pageEl.offsetWidth || 300;

    isDragging.current = true;
    pageEl.classList.add('fb-dragging');
    try { handle.setPointerCapture(e.pointerId); } catch {}

    function onMove(ev) {
      const cx = ev.clientX ?? ev.touches?.[0]?.clientX ?? startX;
      const dx = cx - startX;
      let deg;
      if (direction === 'forward') {
        deg = Math.max(-180, Math.min(0, (dx / width) * 180));
      } else {
        deg = Math.max(-180, Math.min(0, -180 + (dx / width) * 180));
      }
      setPageRotation(pageIndex, deg);
    }

    function onUp(ev) {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onUp);

      const cx = ev.clientX ?? ev.changedTouches?.[0]?.clientX ?? startX;
      const dx = cx - startX;
      const deg = direction === 'forward'
        ? Math.max(-180, Math.min(0, (dx / width) * 180))
        : Math.max(-180, Math.min(0, -180 + (dx / width) * 180));

      pageEl.classList.remove('fb-dragging');
      isDragging.current = false;

      if (direction === 'forward') {
        if (deg < -90) {
          snapForward(pageIndex);
        } else {
          // snap back to flat
          setPageRotation(pageIndex, 0);
        }
      } else {
        if (deg > -90) {
          snapBack(pageIndex);
        } else {
          // snap back to flipped
          setPageRotation(pageIndex, -180);
        }
      }
    }

    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
  }

  /* ── Touch swipe (for the whole book area, not corners) ── */
  function handleTouchStart(e) {
    if (isDragging.current) return;
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e) {
    if (isDragging.current || touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 60) {
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
        background: '#F8F5EE',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: '#6B5E4F', marginBottom: 4 }}>
          <span>VOL. I · NO. 26</span>
          <span style={{ fontWeight: 700, color: '#B45309', textTransform: 'uppercase' }}>📰 Paper Broadside</span>
          <button
            onClick={onExit}
            style={{
              background: '#1B1917',
              color: '#FFFDF9',
              border: 'none',
              borderRadius: 999,
              padding: '4px 12px',
              fontSize: 10.5,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            }}
          >
            ✕ Exit
          </button>
        </div>

        <h1 style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: 29,
          margin: '2px 0 6px',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          textTransform: 'uppercase',
          color: '#1B1917'
        }}>
          The Zerobar Gazette
        </h1>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #1B1917', borderBottom: '1px solid #1B1917', padding: '3px 0', fontSize: 10.5, fontFamily: "'IBM Plex Mono', monospace", color: '#5B4E3E' }}>
          <span>OFFLINE BROADSIDE</span>
          <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span>DRAG CORNER TO TURN</span>
        </div>
      </div>

      {/* ── Flip-Book Scene ── */}
      <div className="fb-scene">
        <div className="fb-book">
          <div className="fb-spine" />
          <div className="fb-base" />

          {posts.map((post, i) => {
            const isFlipped = flippedSet.has(i);
            const canForward = i === currentFlip;
            const canBack = i === currentFlip - 1;

            return (
              <div
                key={post.id || i}
                ref={el => { pageRefs.current[i] = el; }}
                className={`fb-page${isFlipped ? ' fb-flipped' : ''}${canForward ? ' fb-can-forward' : ''}${canBack ? ' fb-can-back' : ''}`}
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
                  <div className="fb-fold-shade" />
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
                  <div className="fb-fold-shade fb-fold-shade-back" />
                </div>

                {/* Dog-ear corner grab handles */}
                <div
                  className="fb-corner fb-corner-br"
                  onPointerDown={(e) => handleCornerDown(e, i, 'forward')}
                />
                <div
                  className="fb-corner fb-corner-bl"
                  onPointerDown={(e) => handleCornerDown(e, i, 'backward')}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Hint ── */}
      <div style={{ textAlign: 'center', marginTop: 12, color: '#6B5E4F', fontSize: 12.5, fontFamily: "'IBM Plex Mono', monospace", fontStyle: 'italic', letterSpacing: 0.5 }}>
        grab the corner &amp; drag to turn the page
      </div>

      {/* ── Controls ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12, flexShrink: 0 }}>
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
      <div style={{ textAlign: 'center', marginTop: 10, color: '#4A3F33', fontSize: 13, letterSpacing: 1, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>
        {pageLabel}
      </div>

      {/* ── Keyboard hint ── */}
      <div style={{ textAlign: 'center', marginTop: 6, color: '#8A7D6B', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>
        👆 Swipe, drag corners, or press <b>[←] [→]</b> keys
      </div>
    </div>
  );
}
