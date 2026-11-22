/* Aplică tema înainte de randare, ca să nu apară clipiri */
(function () {
  try {
    var saved = localStorage.getItem('theme');
    var dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();

/* Restul se execută după ce pagina este încărcată */
document.addEventListener('DOMContentLoaded', function () {
  (function () {
    var root = document.documentElement;

    /* Anul curent în footer */
    document.getElementById('year').textContent = ' ' + new Date().getFullYear();

    /* ---------- Day / night ---------- */
    /* Urmărește în timp real tema dispozitivului: când se schimbă, pagina o preia
       (și înlocuiește alegerea manuală salvată anterior) */
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onSystemTheme = function (e) {
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        try { localStorage.removeItem('theme'); } catch (err) {}
      };
      if (mq.addEventListener) mq.addEventListener('change', onSystemTheme);
      else if (mq.addListener) mq.addListener(onSystemTheme);
    }

    document.getElementById('theme-toggle').addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });

    /* ---------- Meniu Psihologie / Statistică (derulabil) ---------- */
    var list = document.querySelector('.menu-list');
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.menu-btn'));
    var prevBtn = document.querySelector('.menu-hint-prev');
    var nextBtn = document.querySelector('.menu-hint-next');

    /* Săgețile apar doar când meniul nu încape pe ecran */
    function updateArrows() {
      var max = list.scrollWidth - list.clientWidth;
      prevBtn.classList.toggle('is-off', !(max > 1 && list.scrollLeft > 1));
      nextBtn.classList.toggle('is-off', !(max > 1 && list.scrollLeft < max - 1));
    }

    list.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    if (window.ResizeObserver) new ResizeObserver(updateArrows).observe(list);
    updateArrows();

    [prevBtn, nextBtn].forEach(function (btn) {
      btn.addEventListener('click', function () {
        list.scrollBy({ left: Number(btn.dataset.dir) * Math.max(120, list.clientWidth * 0.6), behavior: 'smooth' });
      });
    });

    var TITLES = { psihologie: 'Psihologia muncii. Evaluare vocațională | Gabriel Pădurean', statistica: 'Statistică: Pregătire teoretică. Proiecte | Gabriel Pădurean' };

    /* Fiecare meniu este o „pagină” separată, cu adresa /#psihologie sau /#statistica */
    function selectTab(name, focus, fromHistory) {
      if (!TITLES[name]) name = 'psihologie';
      document.title = TITLES[name];
      /* Ca la o pagină nouă: la schimbarea meniului se revine în partea de sus */
      var activeTab = document.querySelector('.menu-btn.is-active');
      if (activeTab && activeTab.dataset.tab !== name) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
      if (location.hash !== '#' + name) {
        try { history[fromHistory ? 'replaceState' : 'pushState'](null, '', '#' + name); } catch (e) {}
      }
      tabs.forEach(function (tab) {
        var on = tab.dataset.tab === name;
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
        var panel = document.getElementById('panel-' + tab.dataset.tab);
        panel.hidden = !on;
        /* Datele de identificare: doar cele ale activității din meniul selectat */
        var legal = document.querySelector('.legal-block[data-legal="' + tab.dataset.tab + '"]');
        if (legal) legal.hidden = !on;
        if (on) {
          if (focus) tab.focus({ preventScroll: true });
          tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        }
      });
    }

    function tabFromHash() {
      var h = location.hash.replace('#', '');
      return TITLES[h] ? h : 'psihologie';
    }

    /* Înapoi / Înainte din browser și linkuri directe */
    window.addEventListener('popstate', function () { selectTab(tabFromHash(), false, true); });
    window.addEventListener('hashchange', function () { selectTab(tabFromHash(), false, true); });

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { selectTab(tab.dataset.tab); });
      tab.addEventListener('keydown', function (e) {
        var keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        if (keys[e.key]) {
          e.preventDefault();
          selectTab(tabs[(i + keys[e.key] + tabs.length) % tabs.length].dataset.tab, true);
        }
      });
    });

    /* Starea inițială după adresă; fără hash se afișează /#psihologie */
    var initial = tabFromHash();
    if (location.hash !== '#' + initial) {
      try { history.replaceState(null, '', '#' + initial); } catch (e) {}
    }
    selectTab(initial, false, true);

    /* ---------- Contact: rând derulabil pe ecrane medii/pătrate ---------- */
    (function () {
      var box = document.querySelector('.contact-list');
      var prev = document.querySelector('.contact-hint-prev');
      var next = document.querySelector('.contact-hint-next');
      function update() {
        var max = box.scrollWidth - box.clientWidth;
        prev.classList.toggle('is-off', !(max > 1 && box.scrollLeft > 1));
        next.classList.toggle('is-off', !(max > 1 && box.scrollLeft < max - 1));
      }
      box.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      if (window.ResizeObserver) new ResizeObserver(update).observe(box);
      [prev, next].forEach(function (btn) {
        btn.addEventListener('click', function () {
          box.scrollBy({ left: Number(btn.dataset.dir) * Math.max(120, box.clientWidth * 0.6), behavior: 'smooth' });
        });
      });
      update();
    })();

    /* ---------- Copy ---------- */
    function fallbackCopy(text) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    }

    function copyText(text) {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text).catch(function () { fallbackCopy(text); });
      }
      fallbackCopy(text);
      return Promise.resolve();
    }

    document.querySelectorAll('.copy-btn').forEach(function (btn) {
      var timer;
      btn.addEventListener('click', function () {
        copyText(btn.dataset.copy);
        document.getElementById('live').textContent = 'Copiat';
        btn.classList.add('is-copied');
        clearTimeout(timer);
        /* ~0.3s tranziție + 1s cât rămâne colorată */
        timer = setTimeout(function () { btn.classList.remove('is-copied'); }, 1300);
      });
    });
  })();
});
