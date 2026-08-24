/**
 * Zarrin Noir - Luxury Persian Gold & Jewelry
 * Vanilla JS + GSAP + ScrollTrigger (Zero Build Tooling, GitHub Pages Ready)
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initHeroVideoScrubbing();
  initGSAPAnimations();
  initLucideIcons();
  initMobileMenu();
});

// Initialize Lucide Icons if loaded
function initLucideIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Navbar Scroll Effect
function initNavbar() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;

  const handleScroll = () => {
    if (window.scrollY > 40) {
      nav.classList.add('py-4', 'bg-[#131313]/90', 'border-white/20', 'shadow-2xl');
      nav.classList.remove('py-6', 'bg-[#131313]/20');
    } else {
      nav.classList.add('py-6', 'bg-[#131313]/20');
      nav.classList.remove('py-4', 'bg-[#131313]/90', 'border-white/20', 'shadow-2xl');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

// Mobile Menu Toggle
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const closeBtn = document.getElementById('close-mobile-menu');

  if (toggleBtn && mobileMenu) {
    toggleBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  if (closeBtn && mobileMenu) {
    closeBtn.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
    });
  }
}

// GSAP Video Scrubbing & Hero Scroll Animations (High-Performance for iOS, Android & Desktop)
function initHeroVideoScrubbing() {
  const video = document.querySelector('.hero-video-element');
  const heroSection = document.querySelector('.hero-sticky-container') || document.querySelector('header');

  if (!video || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    if (video) {
      video.play().catch(() => {});
    }
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Setup performance attributes on video element
  video.pause();
  video.removeAttribute('loop');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', 'true');
  video.setAttribute('webkit-playsinline', 'true');
  video.setAttribute('disablepictureinpicture', 'true');
  video.setAttribute('disableremoteplayback', 'true');

  // Try caching video into RAM via Blob URL to eliminate remote range-request network latency on seeks
  const videoSrc = video.querySelector('source')?.src || video.src;
  if (videoSrc && !videoSrc.startsWith('blob:')) {
    fetch(videoSrc, { mode: 'cors' })
      .then(res => (res.ok ? res.blob() : null))
      .then(blob => {
        if (blob) {
          const blobUrl = URL.createObjectURL(blob);
          const curTime = video.currentTime || 0;
          video.src = blobUrl;
          video.currentTime = curTime;
        }
      })
      .catch(() => {
        // Fallback transparently to stream source
      });
  }

  let scrubInitialized = false;

  const tryInitScrub = () => {
    if (scrubInitialized) return;
    if (video.duration && !isNaN(video.duration) && video.duration > 0) {
      scrubInitialized = true;
      enableVideoScrub(video, heroSection);
    }
  };

  video.addEventListener('loadedmetadata', tryInitScrub, { passive: true });
  video.addEventListener('canplay', tryInitScrub, { passive: true });
  video.addEventListener('loadeddata', tryInitScrub, { passive: true });

  if (video.readyState >= 1 && video.duration) {
    tryInitScrub();
  } else {
    setTimeout(() => {
      if (!scrubInitialized) {
        scrubInitialized = true;
        enableVideoScrub(video, heroSection);
      }
    }, 600);
  }
}

function enableVideoScrub(video, heroSection) {
  if (!video || !heroSection) return;

  try {
    video.pause();

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isMobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const getDuration = () => {
      return (video.duration && !isNaN(video.duration) && video.duration > 0.5) 
        ? Math.max(0.1, video.duration - 0.04)
        : 6;
    };

    // Calculate long, smooth scroll distance so the user enjoys every frame smoothly
    const getScrollDistance = () => {
      return isMobile ? Math.max(window.innerHeight * 2.8, 2200) : Math.max(window.innerHeight * 3.8, 3400);
    };

    const heroContent = heroSection.querySelector('.hero-content-anim');
    const scrollIndicator = heroSection.querySelector('.animate-bounce') || heroSection.querySelector('.absolute.bottom-8');

    // Decoupled interpolation state for buttery smooth 60fps frame rendering
    let targetProgress = 0;
    let currentProgress = 0;
    let rafId = null;
    const lerpFactor = isMobile ? 0.20 : 0.16;

    // High performance render loop
    const renderLoop = () => {
      const delta = targetProgress - currentProgress;

      if (Math.abs(delta) > 0.0003) {
        currentProgress += delta * lerpFactor;
        const maxDuration = getDuration();
        const targetTime = Math.min(Math.max(0, currentProgress * maxDuration), maxDuration);

        // Guard hardware decoder against seek overload
        if (!video.seeking && Math.abs(video.currentTime - targetTime) > 0.02) {
          if (isIOS && typeof video.fastSeek === 'function') {
            video.fastSeek(targetTime);
          } else {
            video.currentTime = targetTime;
          }
        }
      }

      rafId = requestAnimationFrame(renderLoop);
    };

    // Start continuous hardware-synced render loop
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(renderLoop);

    // Create pinned ScrollTrigger timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroSection,
        start: 'top top',
        end: () => `+=${getScrollDistance()}`,
        pin: true,
        pinSpacing: true,
        scrub: isMobile ? 0.8 : 1.2,
        anticipatePin: 1,
        fastScrollEnd: true,
        preventOverlaps: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          targetProgress = self.progress;
        },
        onLeave: () => {
          // Snap tightly to the final glorious frame before leaving section
          targetProgress = 1;
          currentProgress = 1;
          const maxDuration = getDuration();
          if (typeof video.fastSeek === 'function') {
            video.fastSeek(maxDuration);
          } else {
            video.currentTime = maxDuration;
          }
          video.pause();
        },
        onEnterBack: () => {
          video.pause();
        },
        onLeaveBack: () => {
          targetProgress = 0;
          currentProgress = 0;
          video.currentTime = 0;
          video.pause();
        }
      }
    });

    // Animate hero text fadeout smoothly using GPU transforms
    if (heroContent) {
      tl.to(heroContent, {
        autoAlpha: 0,
        y: -35,
        ease: 'power2.inOut',
        duration: 0.35
      }, 0.08);
    }

    if (scrollIndicator) {
      tl.to(scrollIndicator, {
        autoAlpha: 0,
        y: 15,
        ease: 'power2.out',
        duration: 0.2
      }, 0.02);
    }

    // Refresh layout calculations
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 300);

  } catch (e) {
    console.warn('Video scrub fallback:', e);
    video.play().catch(() => {});
  }
}

// GSAP Scroll Animations for Content
function initGSAPAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    // Fallback using IntersectionObserver
    initIntersectionFallback();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Hero content entrance
  const heroContent = document.querySelector('.hero-content-anim');
  if (heroContent) {
    gsap.fromTo(
      heroContent.children,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: 'power3.out', delay: 0.2 }
    );
  }

  // Reveal elements on scroll
  const revealCards = document.querySelectorAll('.reveal-up');
  revealCards.forEach((card, index) => {
    gsap.fromTo(
      card,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 88%',
          toggleActions: 'play none none none'
        }
      }
    );
  });
}

// Fallback Intersection Observer if GSAP is blocked
function initIntersectionFallback() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal-up').forEach(el => {
    observer.observe(el);
  });
}
