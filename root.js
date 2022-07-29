const timerContainerEl = document.getElementById('timerContainer');

const timerWrapperElList = [];
const courtList = [];

// Time before event loops;
const interval = 250;

// 8 min warmup by default including travel time.
const defaultWarmupTime = 8;
let warmupTime = defaultWarmupTime;
let currentTime = Date.now();

const courtCountInput = document.getElementById('inputCourtCount');
const warmupTimeInput = document.getElementById('inputWarmupTime');

class CourtComponent {
  constructor(courtNum) {
    this.timer = null;
    this.paused = false;
    this.shuttleCount = 1;
    this.courtNum = courtNum;

    this._setupComponent();
    this._updateTimerEl();
    this._updateShuttleEl();
  }

  attachTo(parentEl) {
    parentEl.append(this.rootEl);
  }

  detach() {
    this.rootEl.parentElement.removeChild(this.rootEl);
  }

  subtractTime(millis) {
    if (this.timer === null || this.paused) return;

    const prev = this.timer;
    this.timer = Math.max(0, this.timer - millis);

    if (prev !== this.timer) this._updateTimerEl();
  }

  toggleWarmup() {
    if (this.timer > 0) {
      this.paused = !this.paused;
    } else {
      this.timer = null;
      this.paused = false;
    }

    this._updateTimerEl();
  }

  addShuttle(change) {
    this.shuttleCount = Math.max(0, this.shuttleCount + change);
    this._updateShuttleEl();
  }

  resetCourt() {
    this.shuttleCount = 1;
    this.timer = warmupTime * 60 * 1000;
    this.paused = false;

    this._updateTimerEl();
    this._updateShuttleEl();
  }

  _setupComponent() {
    const rootElement = document.createElement("section");
    rootElement.id = getPrefixedId(this.courtNum, 'wrapper');
    rootElement.className = "court-wrapper";
    rootElement.innerHTML = `
      <h1 class="court-title">Court ${this.courtNum + 1}</h1>
      <section class="court-content">
        <div class="timer-text"></div>
        <div class="shuttle-count">
          <span>Shuttle: </span>
          <input type="button" value="-" class="change-shuttle-btn remove">
          <span class="shuttle-count-text"></span>
          <input type="button" value="+" class="change-shuttle-btn add">
        </div>
        <input type="button" value="Toggle Timer" class="action-btn toggle-warmup-btn">
        <input type="button" value="Reset Court" class="action-btn reset-court-btn">
      </section>`;

    this.rootEl = rootElement;
    this.timerEl = rootElement.querySelector('.timer-text');
    this.shuttleCountEl = rootElement.querySelector('.shuttle-count-text');
    this.toggleWarmupBtnEl = rootElement.querySelector('.toggle-warmup-btn');
    this.addShuttleBtnEl = rootElement.querySelector('.change-shuttle-btn.add');
    this.removeShuttleBtnEl = rootElement.querySelector('.change-shuttle-btn.remove');
    this.resetCourtBtnEl = rootElement.querySelector('.reset-court-btn');

    this.addShuttleBtnEl.addEventListener('click', this.addShuttle.bind(this, 1));
    this.removeShuttleBtnEl.addEventListener('click', this.addShuttle.bind(this, -1));
    this.toggleWarmupBtnEl.addEventListener('click', this.toggleWarmup.bind(this));
    this.resetCourtBtnEl.addEventListener('click', this.resetCourt.bind(this));
  }

  _updateTimerEl() {
    const classes = ['timer-text'];
  
    if (this.timer === null) {
      classes.push('blank');

      this.toggleWarmupBtnEl.disabled = true;
    } else {
      this.toggleWarmupBtnEl.disabled = false;

      if (this.timer === 0) {
        classes.push('done');

        this.toggleWarmupBtnEl.value = "Clear Timer";
      } else {
        classes.push('running');

        if (this.paused) {
          this.toggleWarmupBtnEl.value = "Continue Timer";
        } else {
          this.toggleWarmupBtnEl.value = "Pause Timer";
        }
      }
    }
  
    this.timerEl.innerHTML = formatMillis(this.timer);
    this.timerEl.className = classes.join(' ');
  }

  _updateShuttleEl() {
    this.shuttleCountEl.innerHTML = `${this.shuttleCount}`;
  }
}

setInterval(timerLoop, interval);
loadFromUrl();

function updateSettings(event) {
  event.preventDefault();
  
  warmupTime = parseIntValue(warmupTimeInput.value) ?? defaultWarmupTime;
  updateCourtCount(courtCountInput.value);
  updateUrl();

  return false;
}

function updateCourtCount(newCount) {
  const courtCount = parseIntValue(newCount);
  courtCountInput.value = courtCount;

  for (let i = courtList.length; i < courtCount; i++) {
    courtList[i] = new CourtComponent(i);
    courtList[i].attachTo(timerContainerEl);
  }

  for (let i = courtList.length - 1; i >= courtCount; i--) {
    courtList.pop().detach();
  }
}

function getPrefixedId(courtNum, name) {
  return `court${courtNum}_${name}`;
}

function formatMillis(millis) {
  if (millis === null) return '—';
  const secs = Math.floor(millis / 1000);
  return `${String(Math.floor(secs/3600)).padStart(2, '0')}:${String(Math.floor(secs/60) % 60).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
}

function timerLoop() {
  const delta = Date.now() - currentTime;

  for (const court of courtList) {
    court.subtractTime(delta);
  }

  currentTime += delta;
}

function parseIntValue(str) {
  const value = parseInt(str);
  return isNaN(value) ? null : value;
}

function loadFromUrl() {
  const url = new URL(window.location);
  warmupTime = parseIntValue(url.searchParams.get('warmupTime')) ?? defaultWarmupTime;
  warmupTimeInput.value = warmupTime;
  updateCourtCount(url.searchParams.get('courtCount'));
}

function updateUrl() {
  const url = new URL(window.location);
  url.searchParams.set('courtCount', courtList.length);
  url.searchParams.set('warmupTime', warmupTime);
  window.history.pushState({}, '', url);
}
