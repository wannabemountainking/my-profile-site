/**
 * 김도윤 展 — 프로필 사이트 동작
 * 테마 전환, 관람 안내 내비게이션, 모바일 안내도, 스크롤 등장, 프로젝트 렌더링, 이메일 복사를 담당합니다.
 */
(function () {
    'use strict';

    const THEME_KEY = 'theme';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    /**
     * 프로젝트 목록
     * 새 프로젝트는 이 배열에 추가하면 카드가 자동으로 생깁니다.
     * link, image는 비워 두면 표시하지 않습니다.
     * tone: 'mint' | 'lilac' | 'butter' | 'sky' | 'blush'
     */
    const projects = [
        {
            no: '04-1',
            title: 'Python으로 찾은 다라니의 길',
            subtitle: '유물에 새겨진 경문을 코드로 읽다',
            description: '유물에 담긴 다라니 경문을 OpenCV로 이미지 처리하고 Python으로 분석해, 사람의 눈으로는 읽기 어려웠던 글자를 판독하고 조사한 연구 프로젝트입니다.',
            tags: ['Python', 'OpenCV', '유물 연구'],
            caption: '이것은 단순한 글자가 아니다.',
            tone: 'lilac',
            link: '',
            image: '',
        },
        {
            no: '04-2',
            title: '더 편한 전시를 위한 목록 자동화',
            subtitle: '손으로 정리하던 전시 목록을 한 번에',
            description: '전시를 준비할 때마다 반복해서 만들던 유물 목록을 자동으로 생성해 준비 시간을 줄이고, 옮겨 적다 생기는 실수를 없앴습니다.',
            tags: ['Python', '업무 자동화'],
            caption: '이것은 단순한 목록이 아니다.',
            tone: 'mint',
            link: '',
            image: '',
        },
        {
            no: '04-3',
            title: '한 번 쓰고, 여러 형식으로 — 보고서 자동화',
            subtitle: '상부기관과 국회에 내는 같은 내용, 다른 서식',
            description: '상부기관과 국회에 제출하는 보고서는 내용이 같아도 요구하는 서식이 달랐습니다. 하나의 원본 데이터에서 기관별 서식의 보고서를 자동으로 만들어 같은 일을 두 번 하지 않도록 했습니다.',
            tags: ['Python', '문서 자동화'],
            caption: '이것은 하나의 보고서가 아니다.',
            tone: 'butter',
            link: '',
            image: '',
        },
    ];

    /** tone 값을 Tailwind 배경 클래스로 바꿉니다. */
    const TONE_CLASS = {
        mint: 'bg-mint',
        lilac: 'bg-lilac',
        butter: 'bg-butter',
        sky: 'bg-sky',
        blush: 'bg-blush',
    };

    /**
     * HTML 특수문자를 이스케이프합니다.
     * @param {string} text - 원본 문자열
     * @returns {string} 이스케이프된 문자열
     */
    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * localStorage를 안전하게 읽습니다. 사용할 수 없으면 null을 돌려줍니다.
     * @param {string} key - 키
     * @returns {string|null}
     */
    function readStorage(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return null;
        }
    }

    /**
     * localStorage에 안전하게 씁니다. 실패해도 무시합니다.
     * @param {string} key - 키
     * @param {string} value - 값
     */
    function writeStorage(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            /* 저장소 사용 불가: 이번 방문에만 적용 */
        }
    }

    /* ---------- 테마 ---------- */

    /**
     * 낮/밤 테마 토글을 초기화합니다.
     * 저장된 값이 없으면 시스템 설정을 따르고, 시스템 설정이 바뀌면 함께 바뀝니다.
     */
    function initTheme() {
        const root = document.documentElement;
        const toggle = document.getElementById('theme-toggle');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

        const syncButton = () => {
            const isDark = root.classList.contains('dark');
            toggle.setAttribute('aria-pressed', String(isDark));
        };

        /**
         * 테마를 적용합니다.
         * @param {boolean} isDark - 다크 모드 여부
         */
        const applyTheme = (isDark) => {
            if (!reducedMotion.matches) {
                root.classList.add('theme-transition');
                window.setTimeout(() => root.classList.remove('theme-transition'), 650);
            }
            root.classList.toggle('dark', isDark);
            syncButton();
        };

        toggle.addEventListener('click', () => {
            const isDark = !root.classList.contains('dark');
            applyTheme(isDark);
            writeStorage(THEME_KEY, isDark ? 'dark' : 'light');
        });

        systemDark.addEventListener('change', (event) => {
            if (!readStorage(THEME_KEY)) applyTheme(event.matches);
        });

        syncButton();
    }

    /* ---------- 내비게이션 ---------- */

    /**
     * 관람 안내 내비게이션을 초기화합니다.
     * 현재 섹션 강조, 스포트라이트 이동, 관람 진행선, 스크롤 시 바 배경 전환을 담당합니다.
     */
    function initNav() {
        const header = document.getElementById('site-header');
        const spotlight = document.getElementById('nav-spotlight');
        const progress = document.getElementById('nav-progress');
        const fill = document.getElementById('nav-progress-fill');
        const links = Array.from(document.querySelectorAll('.nav-link'));
        const sections = links
            .map((link) => document.getElementById(link.dataset.section))
            .filter(Boolean);

        // 전시실마다 진행선 위에 점을 하나씩 둡니다
        const dots = sections.map(() => {
            const dot = document.createElement('span');
            dot.className = 'nav-dot';
            progress.appendChild(dot);
            return dot;
        });

        let dotPositions = [];
        let ticking = false;

        /** 각 섹션이 전체 스크롤에서 차지하는 위치(0~1)를 계산합니다. */
        const measure = () => {
            const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
            dotPositions = sections.map((section) => {
                const top = section.getBoundingClientRect().top + window.scrollY - 96;
                return Math.min(Math.max(top / max, 0), 1);
            });
            dots.forEach((dot, i) => {
                dot.style.left = `${dotPositions[i] * 100}%`;
            });
        };

        /**
         * 스포트라이트를 해당 링크 뒤로 옮깁니다.
         * @param {HTMLElement|null} link - 강조할 링크, 없으면 숨김
         */
        const moveSpotlight = (link) => {
            if (!link || !link.offsetWidth) {
                spotlight.style.opacity = '0';
                return;
            }
            spotlight.style.width = `${link.offsetWidth}px`;
            spotlight.style.transform = `translateX(${link.offsetLeft}px)`;
            spotlight.style.opacity = '1';
        };

        /** 스크롤 위치에 맞춰 내비게이션 상태를 갱신합니다. */
        const update = () => {
            ticking = false;
            const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
            const ratio = Math.min(window.scrollY / max, 1);

            header.classList.toggle('is-scrolled', window.scrollY > 12);
            fill.style.transform = `scaleX(${ratio})`;

            // 화면 위쪽 40% 지점을 지난 마지막 섹션이 현재 전시실입니다
            const marker = window.innerHeight * 0.4;
            let current = -1;
            sections.forEach((section, i) => {
                if (section.getBoundingClientRect().top <= marker) current = i;
            });
            // 맨 아래에 닿으면 마지막 전시실로 봅니다
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
                current = sections.length - 1;
            }

            links.forEach((link, i) => {
                const active = i === current;
                link.classList.toggle('is-active', active);
                if (active) link.setAttribute('aria-current', 'location');
                else link.removeAttribute('aria-current');
            });
            dots.forEach((dot, i) => {
                dot.classList.toggle('is-passed', i <= current);
                dot.classList.toggle('is-current', i === current);
            });
            moveSpotlight(links[current] || null);
        };

        const requestUpdate = () => {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(update);
            }
        };

        const refresh = () => {
            measure();
            update();
        };

        window.addEventListener('scroll', requestUpdate, { passive: true });
        window.addEventListener('resize', refresh);
        window.addEventListener('load', refresh);
        // 웹 폰트가 늦게 로드되면 링크 너비가 바뀌므로 다시 계산합니다
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);

        refresh();
    }

    /* ---------- 모바일 안내도 ---------- */

    /** 모바일 전체 화면 안내도(열기/닫기, Esc, 포커스 트랩)를 초기화합니다. */
    function initGuideMenu() {
        const guide = document.getElementById('guide');
        const openButton = document.getElementById('guide-open');
        const closeButton = document.getElementById('guide-close');

        const focusables = () => Array.from(guide.querySelectorAll('a[href], button'));

        const open = () => {
            guide.hidden = false;
            // hidden 해제 후 다음 프레임에 전환 클래스를 붙여야 애니메이션이 보입니다
            window.requestAnimationFrame(() => guide.classList.add('is-open'));
            openButton.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
            const firstLink = guide.querySelector('.guide-link');
            if (firstLink) firstLink.focus();
        };

        /**
         * 안내도를 닫습니다.
         * @param {boolean} restoreFocus - 닫은 뒤 안내도 버튼으로 포커스를 돌릴지 여부
         */
        const close = (restoreFocus) => {
            guide.classList.remove('is-open');
            guide.hidden = true;
            openButton.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
            if (restoreFocus) openButton.focus();
        };

        openButton.addEventListener('click', open);
        closeButton.addEventListener('click', () => close(true));

        // 링크를 누르면 닫고 해당 전시실로 이동합니다
        guide.querySelectorAll('.guide-link').forEach((link) => {
            link.addEventListener('click', () => close(false));
        });

        guide.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                close(true);
                return;
            }
            if (event.key !== 'Tab') return;

            const items = focusables();
            const first = items[0];
            const last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        });

        // 화면이 넓어지면 안내도를 닫습니다
        window.matchMedia('(min-width: 768px)').addEventListener('change', (event) => {
            if (event.matches && !guide.hidden) close(false);
        });
    }

    /* ---------- 스크롤 등장 ---------- */

    /** .reveal 요소가 화면에 들어오면 is-visible 클래스를 붙입니다. */
    function initRevealOnScroll() {
        const items = document.querySelectorAll('.reveal');

        if (!('IntersectionObserver' in window)) {
            items.forEach((item) => item.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

        items.forEach((item) => observer.observe(item));
    }

    /* ---------- 프로젝트 ---------- */

    /**
     * 프로젝트 카드 하나의 HTML을 만듭니다.
     * @param {Object} project - 프로젝트 데이터
     * @param {number} index - 순서(등장 지연에 사용)
     * @returns {string} 카드 HTML
     */
    function createProjectHTML(project, index) {
        const tone = TONE_CLASS[project.tone] || TONE_CLASS.blush;
        const image = project.image
            ? `<img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)}" loading="lazy">`
            : '';
        const tags = project.tags
            .map((tag) => `<li>${escapeHtml(tag)}</li>`)
            .join('');
        const footer = project.link
            ? `<a href="${escapeHtml(project.link)}" target="_blank" rel="noopener" class="font-medium text-accent underline underline-offset-4">자세히 보기 →</a>`
            : '<span class="text-ink-soft">자세한 이야기는 곧 공개됩니다</span>';

        return `
            <article class="project-card reveal" style="--delay: ${index * 100}ms">
                <div class="project-poster ${tone}">
                    ${image}
                    <span class="poster-num relative font-display text-5xl italic text-ink/80">${escapeHtml(project.no)}</span>
                </div>
                <div class="project-body">
                    <p class="text-xs tracking-[0.08em] text-ink-soft">상설 전시 · No. ${escapeHtml(project.no)}</p>
                    <h3 class="mt-2 font-serif text-xl leading-snug sm:text-2xl">${escapeHtml(project.title)}</h3>
                    <p class="mt-1 text-[15px] font-medium text-accent">${escapeHtml(project.subtitle)}</p>
                    <p class="mt-4 leading-[1.85] text-ink-soft">${escapeHtml(project.description)}</p>
                    <p class="project-caption mt-4 font-serif text-ink">“${escapeHtml(project.caption)}”</p>
                    <ul class="chip-list mt-5 !px-0">${tags}</ul>
                    <p class="mt-auto pt-6 text-sm">${footer}</p>
                </div>
            </article>`;
    }

    /**
     * 프로젝트 카드를 그리고, 맨 끝에 다음 전시 준비 중 카드를 덧붙입니다.
     * @param {Array<Object>} list - 프로젝트 배열
     */
    function renderProjects(list) {
        const container = document.getElementById('project-list');
        const upcoming = `
            <article class="project-card is-upcoming reveal" style="--delay: ${list.length * 100}ms">
                <div class="flex h-full flex-col items-center justify-center gap-3 px-6 py-14 text-center">
                    <p class="font-display text-2xl italic text-accent">Coming Soon</p>
                    <h3 class="font-serif text-xl">다음 전시 준비 중</h3>
                    <p class="max-w-xs leading-relaxed text-ink-soft">새로운 작품을 준비하고 있습니다. 곧 이 자리에서 만나요.</p>
                </div>
            </article>`;

        container.innerHTML = list.map(createProjectHTML).join('') + upcoming;
    }

    /* ---------- 이메일 복사 ---------- */

    /**
     * 토스트 알림을 잠시 보여 줍니다.
     * @param {string} message - 알림 문구
     */
    function showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('is-visible');
        window.clearTimeout(showToast.timer);
        showToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
    }

    /**
     * Clipboard API를 쓸 수 없을 때 쓰는 예비 복사 방법입니다.
     * @param {string} text - 복사할 문자열
     * @returns {boolean} 성공 여부
     */
    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        let ok = false;
        try {
            ok = document.execCommand('copy');
        } catch (e) {
            ok = false;
        }
        document.body.removeChild(textarea);
        return ok;
    }

    /** 주소 복사 버튼을 초기화합니다. */
    function initCopyEmail() {
        const button = document.getElementById('copy-email');
        const email = button.dataset.email;

        button.addEventListener('click', async () => {
            let ok = false;
            try {
                await navigator.clipboard.writeText(email);
                ok = true;
            } catch (e) {
                ok = fallbackCopy(email);
            }
            showToast(ok ? '메일 주소를 복사했어요 ✉️' : `복사하지 못했어요. ${email}`);
        });
    }

    /** 푸터 연도를 올해로 맞춥니다. */
    function setFooterYear() {
        document.getElementById('footer-year').textContent = String(new Date().getFullYear());
    }

    document.addEventListener('DOMContentLoaded', () => {
        renderProjects(projects);
        initTheme();
        initNav();
        initGuideMenu();
        initRevealOnScroll();
        initCopyEmail();
        setFooterYear();
    });
})();
