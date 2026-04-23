/* ===================================================
   SIRUS ART CAFE — SCRIPT.JS
   GSAP Scrollytelling, Food Carousel & Typography
   =================================================== */

window.addEventListener('load', () => {

  const appContainer = document.querySelector('.app-container');

  /* ---------- SMOOTH SCROLL FOR IN-APP SCROLLER ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target && appContainer) {
        e.preventDefault();
        appContainer.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
      }
    });
  });

  /* ---------- SCROLL CUE ---------- */
  const scrollCue = document.getElementById('scroll-down-cue');
  if (scrollCue && appContainer) {
    scrollCue.addEventListener('click', () => {
      const about = document.getElementById('about');
      if (about) appContainer.scrollTo({ top: about.offsetTop, behavior: 'smooth' });
    });
  }

  /* ---------- GSAP SCROLLTRIGGER (SCROLLYTELLING) ---------- */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {

    ScrollTrigger.defaults({ scroller: ".app-container" });

    // 1. Entrance animations
    gsap.fromTo('.left-content', { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.1 });
    gsap.fromTo('.nav', { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', delay: 0.1 });

    // Hide scroll cue on scroll
    gsap.to('#scroll-down-cue', {
      scrollTrigger: { trigger: '.hero-screen', start: 'top top', end: '+=150', scrub: true },
      opacity: 0, pointerEvents: 'none'
    });

    // Letter spacing animation
    gsap.to('#heroText', {
      scrollTrigger: { trigger: '.hero-screen', start: 'top top', end: '+=250', scrub: true },
      letterSpacing: '0px', ease: 'power1.out'
    });

    // 2. HERO IMAGE → WAITER PLATE ANIMATION
    const teaImg = document.getElementById('tea-img');
    const waiterImg = document.querySelector('.waiter-img');
    
    // We dynamically track the active image so whichever menu item is selected can perform the hero drop
    let activeCarouselImg = document.querySelector('[data-name="TEA"] img');

    // Plate percentages relative to waiter image
    const PLATE_X_PCT = 0.74; // Adjusted slightly more to the right
    const PLATE_Y_PCT = 0.46; // Nudged higher up on the plate

    function getPlateViewportPos() {
      const v = { w: appContainer.clientWidth, h: appContainer.clientHeight };
      const wH = waiterImg.offsetHeight;
      const wW = waiterImg.offsetWidth;
      return {
        x: (v.w - wW) / 2 + wW * PLATE_X_PCT,
        y: (v.h - wH) / 2 + wH * PLATE_Y_PCT
      };
    }

    if (teaImg && waiterImg) {
      gsap.set(teaImg, { xPercent: -50, yPercent: -50 });

      gsap.to(teaImg, {
        scrollTrigger: {
          trigger: '.hero-screen',
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
          onEnter: () => {
            gsap.set(teaImg, { autoAlpha: 1 });
            if (activeCarouselImg) gsap.set(activeCarouselImg, { autoAlpha: 0 });
          },
          onLeave: () => {
            gsap.set(teaImg, { autoAlpha: 0 });
            if (activeCarouselImg) gsap.set(activeCarouselImg, { autoAlpha: 1 });
          },
          onEnterBack: () => {
            // When user scrolls back up, ensure the hero image is synced to the currently swiped item!
            if (activeCarouselImg && teaImg.src !== activeCarouselImg.src) {
               teaImg.src = activeCarouselImg.src;
            }
            gsap.set(teaImg, { autoAlpha: 1 });
            if (activeCarouselImg) gsap.set(activeCarouselImg, { autoAlpha: 0 });
          }
        },
        y: () => {
          const v = { w: appContainer.clientWidth, h: appContainer.clientHeight };
          const p = getPlateViewportPos();
          const finalImgH = activeCarouselImg ? activeCarouselImg.offsetHeight : 140;
          // Calculate the exact center y of the carousel image
          const targetCenterY = p.y - (finalImgH / 2) + 10;
          return targetCenterY - (v.h / 2);
        },
        x: () => {
          const v = { w: appContainer.clientWidth, h: appContainer.clientHeight };
          const p = getPlateViewportPos();
          return p.x - (v.w / 2);
        },
        scale: () => {
          // Perfectly match the final size of the carousel item to prevent popping/growing when swapped
          const finalImgH = activeCarouselImg ? activeCarouselImg.offsetHeight : 140;
          const initialH = teaImg.offsetHeight || 1;
          return finalImgH / initialH;
        },
        rotationZ: 0,
        rotationX: 5,
        transformPerspective: 800,
        ease: 'power1.inOut',
        invalidateOnRefresh: true
      });
    }

    // Force refresh after layout settles
    setTimeout(() => ScrollTrigger.refresh(), 200);

    // ─────────────────────────────────────────────────────
    // 3. FOOD CAROUSEL — swipe/drag to browse menu items
    // ─────────────────────────────────────────────────────
    const carousel = document.querySelector('.food-carousel');
    const track = document.querySelector('.food-track');
    const items = document.querySelectorAll('.food-item');
    let lastCenterIndex = 0;

    if (carousel && track && items.length > 0) {
      let currentIndex = 0;
      const totalItems = items.length;
      let startX = 0, currentX = 0, isDragging = false;

      // Ensure the first item (tea) starts fully visible in the carousel if we arrive at it
      const coffeeInCarousel = document.querySelector('[data-name="TEA"] img');

      function getItemWidth() {
        return items[0].offsetWidth + parseInt(window.getComputedStyle(track).gap) || 40;
      }

      // Track the currently active mood board string
      let currentActiveDataName = 'TEA';
      
      // Keep track of scroll position for animations
      window.isWaiterSectionActive = false;

      function updateCarousel(animate = true) {
        const itemW = getItemWidth();
        const p = getPlateViewportPos();
        // Place the currently active item's center exactly at the plate X
        const itemLeftCenter = (currentIndex * itemW) + (items[0].offsetWidth / 2);
        const offset = p.x - itemLeftCenter;
        
        // Handle mood board background swapping!
        const newDataName = items[currentIndex].getAttribute('data-name');
        if (newDataName !== currentActiveDataName && window.animateMoodBoard) {
            window.animateMoodBoard(newDataName, currentActiveDataName);
            currentActiveDataName = newDataName;
        }
        
        // Sync the global activeCarouselImg reference
        const prevCarouselImg = activeCarouselImg;
        activeCarouselImg = items[currentIndex].querySelector('img');
        
        // if tea is hidden (we are completely on the waiter section), ensure the newly active image is visible immediately
        if (parseFloat(teaImg.style.opacity) === 0 && prevCarouselImg !== activeCarouselImg) {
           gsap.set(prevCarouselImg, { autoAlpha: 1 }); // restore normal visibility for inactive
           // Note: updateItemStyles handles opacity for non-centered elements dynamically, which overrules autoAlpha
        }

        if (animate) {
          gsap.to(track, { x: offset, duration: 0.8, ease: 'power3.out', onUpdate: updateItemStyles });
        } else {
          gsap.set(track, { x: offset });
          updateItemStyles();
        }
      }

      function updateItemStyles() {
        const trackX = gsap.getProperty(track, 'x') || 0;
        const itemW = getItemWidth();

        // Position the track vertically so the image bottom rests perfectly on the plate
        const p = getPlateViewportPos();
        // Calculate the height of the image itself, not the whole flex column which includes text
        const imgH = items[0].querySelector('img').offsetHeight || 140;
        // align the bottom of the image precisely with the plate's center y (+ 10px to sit 'inside' the plate)
        const verticalOffset = p.y - imgH + 10;
        gsap.set(track, { y: verticalOffset });

        items.forEach((item, i) => {
          // Absolute center of item relative to the viewport/container
          const itemLeftCenter = (i * itemW) + (items[0].offsetWidth / 2);
          const itemCenterOnScreen = itemLeftCenter + trackX;
          const dist = Math.abs(itemCenterOnScreen - p.x);

          // Fast fade to hide others aggressively!
          // We fade it out rapidly so it only shows if it's very close to the center
          const hideNorm = Math.min(dist / (itemW * 0.7), 1);

          // Menu scroll effect: Simple linear scale and rapid fade
          const s = 1 - (hideNorm * 0.3);
          // Opacity goes from 1 to 0 quite quickly
          const o = 1 - hideNorm;

          const isCenter = dist < itemW * 0.1;
          const dropScale = isCenter ? 1.0 : Math.max(0.5, s);

          gsap.set(item, {
            y: 0, // Flat horizontal layout
            scale: dropScale,
            opacity: o,
            zIndex: isCenter ? 10 : 1
          });

          if (isCenter) {
            item.classList.add('is-center');
          } else {
            item.classList.remove('is-center');
          }
        });
      }

      function ensureTeaSwappedForCarousel() {
        if (teaImg && parseFloat(teaImg.style.opacity) !== 0) {
          gsap.set(teaImg, { autoAlpha: 0 });
        }
        if (activeCarouselImg) {
          // Make sure current active stays visible at 1 so the carousel works natively
          gsap.set(activeCarouselImg, { autoAlpha: 1 });
        }
      }

      // Touch events (Inertia scrolling effect built-in)
      carousel.addEventListener('touchstart', (e) => {
        isDragging = true;
        startX = e.touches[0].clientX;
        currentX = gsap.getProperty(track, 'x') || 0;
        ensureTeaSwappedForCarousel();
      }, { passive: true });

      carousel.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const dx = e.touches[0].clientX - startX;
        gsap.set(track, { x: currentX + dx });
        updateItemStyles();
      }, { passive: true });

      carousel.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        const dx = (gsap.getProperty(track, 'x') || 0) - currentX;
        const itemW = getItemWidth();

        if (Math.abs(dx) > itemW * 0.15) {
          currentIndex += dx < 0 ? 1 : -1;
        }
        currentIndex = Math.max(0, Math.min(totalItems - 1, currentIndex));
        updateCarousel();
      });

      // Mouse drag for desktop
      carousel.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        currentX = gsap.getProperty(track, 'x') || 0;
        carousel.style.cursor = 'grabbing';
        ensureTeaSwappedForCarousel();
      });
      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        gsap.set(track, { x: currentX + dx });
        updateItemStyles();
      });
      window.addEventListener('pointerup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        const diffX = e.clientX - startX;
        
        // Simple threshold to trigger swipe
        if (Math.abs(diffX) > 50) {
          if (diffX > 0) {
             // Swipe right (previous item), wrap around to end
             currentIndex = (currentIndex - 1 + totalItems) % totalItems;
          } else {
             // Swipe left (next item), wrap around to start
             currentIndex = (currentIndex + 1) % totalItems;
          }
          ensureTeaSwappedForCarousel();
          updateCarousel();
        }
      });

      // Arrow key navigation
      document.addEventListener('keydown', (e) => {
        let changed = false;
        if (e.key === 'ArrowRight') { currentIndex = (currentIndex + 1) % totalItems; changed = true; }
        if (e.key === 'ArrowLeft') { currentIndex = (currentIndex - 1 + totalItems) % totalItems; changed = true; }
        if (changed) {
          ensureTeaSwappedForCarousel();
          updateCarousel();
        }
      });

      // Initial visual setup
      updateCarousel(false);

      // Sync on resize
      window.addEventListener('resize', () => {
        updateCarousel(false);
      });
    }

    // ─────────────────────────────────────────────────────
    // 4. MOOD BOARD ENTRANCE ANIMATION & CROSSFADING
    // ─────────────────────────────────────────────────────
    const moodBoards = document.querySelectorAll('.mood-board');
    
    // Globally accessible animator tied to the carousel logic
    window.animateMoodBoard = function(newName, oldName) {
      if (oldName) {
        const oldBoard = document.querySelector(`.mood-board[data-for="${oldName}"]`);
        if (oldBoard) {
           gsap.set(oldBoard, { pointerEvents: 'none' });
           gsap.to(oldBoard, { opacity: 0, duration: 0.3 }); // Fade out old quickly
        }
      }
      
      const newBoard = document.querySelector(`.mood-board[data-for="${newName}"]`);
      if (newBoard) {
        gsap.set(newBoard, { opacity: 1, pointerEvents: 'auto' });
        
        // Only trigger the flying animation if we are actually currently scrolled down to it
        if (window.isWaiterSectionActive) {
          const fragments = gsap.utils.toArray('.mood-fragment', newBoard);
          const comma = newBoard.querySelector('.huge-comma') || newBoard.querySelector('.big-comma');
          const arrowPaths = gsap.utils.toArray('.arrow-path', newBoard);

          // Fly in huge comma
          if (comma) gsap.fromTo(comma, { opacity: 0 }, { opacity: 0.05, duration: 1, ease: 'power2.out' });

          // Fly in fragments
          fragments.forEach((frag, i) => {
            const isLeft = frag.classList.contains('side-left');
            const isRight = frag.classList.contains('side-right');
            const xOffset = isLeft ? -100 : (isRight ? 100 : 0);
            const yOffset = (xOffset === 0) ? 30 : 10;
            
            gsap.fromTo(frag, 
              { opacity: 0, x: xOffset, y: yOffset },
              { opacity: 1, x: 0, y: 0, duration: 0.6, delay: i * 0.15, ease: xOffset === 0 ? "back.out(1.2)" : "power3.out" }
            );
          });
          
          // Draw arrows
          arrowPaths.forEach(path => {
             const len = path.getTotalLength();
             gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
             gsap.to(path, { strokeDashoffset: 0, duration: 0.8, delay: 0.4 });
          });
        }
      }
    };

    ScrollTrigger.create({
      trigger: '.waiter-section',
      start: 'top 50%', 
      onEnter: () => {
        window.isWaiterSectionActive = true;
        // Trigger the animation for whatever the currently active board is
        const activeBoardName = document.querySelector('.food-item.is-center').getAttribute('data-name') || 'TEA';
        window.animateMoodBoard(activeBoardName, null);
      },
      onLeaveBack: () => {
        window.isWaiterSectionActive = false;
        // Reset everything if they scroll all the way back up
        moodBoards.forEach(board => {
           gsap.set(board, { opacity: 0, pointerEvents: 'none' });
           gsap.killTweensOf(gsap.utils.toArray('.mood-fragment', board));
        });
      }
    });

  } // closes if gsap !== undefined
}); // closes window load
