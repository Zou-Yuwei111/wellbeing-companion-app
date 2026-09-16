const app = document.querySelector('#app');
const stepLabel = document.querySelector('#stepLabel');
const toast = document.querySelector('#toast');

const TEST_ACCOUNT = {
  email: 'alex.morgan@example.com',
  id: 'SW 246 810',
  profile: { nickname: 'Alex Morgan', gender: 'Male', height: '178', weight: '74', updatedAt: '2026-09-15T08:30:00.000Z' },
  connections: [],
  demoData: {
    stepsHistory: [6240, 8150, 7430, 9820, 10450, 7890, 9215],
    sleepHistory: [7.1, 6.8, 7.6, 7.3, 8.0, 7.4, 7.7],
    stressHistory: [3, 4, 3, 5, 4, 4, 5],
    activeCalories: 486,
    temperature: 36.5
  }
};

function initialiseAccounts() {
  const accounts = JSON.parse(localStorage.getItem('studywellAccounts') || '[]');
  const legacyUser = JSON.parse(localStorage.getItem('studywellUser') || 'null');
  if (legacyUser && !accounts.some(account => account.id === legacyUser.id)) accounts.push(legacyUser);
  if (!accounts.some(account => account.id === TEST_ACCOUNT.id)) accounts.push(structuredClone(TEST_ACCOUNT));
  localStorage.setItem('studywellAccounts', JSON.stringify(accounts));
  return accounts;
}

const state = {
  mode: 'signup',
  code: '',
  accounts: initialiseAccounts(),
  user: JSON.parse(localStorage.getItem('studywellUser') || 'null'),
  sportTypes: JSON.parse(localStorage.getItem('clockInSportTypes') || '[]'),
  drinkTypes: JSON.parse(localStorage.getItem('clockInDrinkTypes') || '["Water","Tea","Coffee","Milk","Cola"]'),
  customDrinkCalories: JSON.parse(localStorage.getItem('clockInCustomDrinkCalories') || '{}'),
  measurementHistory: JSON.parse(localStorage.getItem('measurementHistory') || '{"height":[],"weight":[]}'),
  periodHistory: JSON.parse(localStorage.getItem('periodHistory') || '[]'),
  periodCalendarMonth: new Date(),
  stepsHistory: JSON.parse(localStorage.getItem('stepsHistory') || '[]'),
  sleepHistory: JSON.parse(localStorage.getItem('sleepHistory') || '[]'),
  stressHistory: JSON.parse(localStorage.getItem('stressHistory') || '[]'),
  wearableData: JSON.parse(localStorage.getItem('wearableData') || '{"connected":false,"source":"Phone","temperature":null,"activeCalories":0}'),
  reminderSettings: JSON.parse(localStorage.getItem('reminderSettings') || '{}'),
  mascotSettings: JSON.parse(localStorage.getItem('mascotSettings') || '{"animal":"cat","photoGenerated":false}'),
  clockRecords: JSON.parse(localStorage.getItem('clockInRecords') || '[]')
};

const templates = {
  welcome: 'welcomeTemplate', auth: 'authTemplate', success: 'successTemplate',
  profile: 'profileTemplate', connect: 'connectTemplate', home: 'homeTemplate', feature: 'featureTemplate'
};

const features = {
  clockin: { title: 'Clock In', options: ['Eating', 'Drinking', 'Sports', 'Optional'] },
  eating: { title: 'Eating' },
  drinking: { title: 'Drinking' },
  sports: { title: 'Sports' },
  optional: { title: 'Optional' },
  steps: { title: 'Steps' },
  sleep: { title: 'Sleep' },
  stress: { title: 'Stress' },
  calories: { title: 'Calories' },
  reminder: { title: 'Reminder' },
  mascot: { title: 'Companion' },
  profile: { title: 'Profile' },
  reserved: { title: 'Reserved Page' }
};

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2600);
}

function route(screen, options = {}) {
  if (screen === 'signup' || screen === 'login') {
    state.mode = screen;
    screen = 'auth';
  }
  app.replaceChildren(document.querySelector(`#${templates[screen]}`).content.cloneNode(true));
  stepLabel.textContent = ({ profile: 'Set up your profile', connect: 'Connect your circle', home: 'Home' })[screen] || '';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (screen === 'auth') setupAuth();
  if (screen === 'success') setupSuccess();
  if (screen === 'profile') setupProfile();
  if (screen === 'connect') setupConnect();
  if (screen === 'home') setupHome(options.login);
  if (screen === 'feature') setupFeature(options.feature);
}

document.addEventListener('click', event => {
  const featureAction = event.target.closest('[data-feature-action]');
  if (featureAction) {
    handleFeatureAction(featureAction.dataset.featureAction, featureAction);
    return;
  }
  const clockOption = event.target.closest('[data-clock-option]');
  if (clockOption) {
    showClockOption(clockOption.dataset.clockOption);
    return;
  }
  const clockAction = event.target.closest('[data-clock-action]');
  if (clockAction) {
    handleClockAction(clockAction.dataset.clockAction, clockAction);
    return;
  }
  const target = event.target.closest('[data-go]');
  if (target) {
    route(target.dataset.go);
    return;
  }
  const feature = event.target.closest('[data-feature]');
  if (feature) {
    if (feature.dataset.feature === 'clockin') {
      openClockModal();
    } else {
      route('feature', { feature: feature.dataset.feature });
    }
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeClockModal();
});

function openClockModal() {
  const modal = document.querySelector('#clockModal');
  if (!modal) return;
  showClockRoot();
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('open'));
  modal.querySelector('.clock-list button').focus();
}

function closeClockModal() {
  const modal = document.querySelector('#clockModal');
  if (!modal || modal.hidden) return;
  modal.classList.remove('open');
  window.setTimeout(() => { modal.hidden = true; }, 160);
}

function nowLabel() {
  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(new Date());
}

function localDateTimeValue(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function timestampRow() {
  return `<label class="timestamp-row" for="recordDateTime">
    <span>Date and time</span>
    <input id="recordDateTime" type="datetime-local" value="${localDateTimeValue()}">
  </label>`;
}

function showClockRoot() {
  const title = document.querySelector('#clockDialogTitle');
  const panel = document.querySelector('#clockPanel');
  if (!title || !panel) return;
  title.textContent = 'Clock In';
  panel.innerHTML = `<div class="clock-list">
    <button data-clock-option="eating">Eating</button>
    <button data-clock-option="drinking">Drinking</button>
    <button data-clock-option="sports">Sports</button>
    <button data-clock-option="optional">Optional</button>
  </div>`;
}

function showClockOption(option) {
  const title = document.querySelector('#clockDialogTitle');
  const panel = document.querySelector('#clockPanel');
  title.textContent = option.charAt(0).toUpperCase() + option.slice(1);
  if (option === 'eating') return renderEatingPanel();
  if (option === 'drinking') return renderDrinkingPanel();
  if (option === 'sports') return renderSportsPanel();
  if (option === 'optional') {
    const periodLabel = isMaleUser() ? "Partner's Period" : 'Period';
    panel.innerHTML = `${timestampRow()}<div class="clock-list optional-list">
      <button data-clock-action="optional-height">Height</button>
      <button data-clock-action="optional-weight">Weight</button>
      <button data-clock-action="period">${periodLabel}</button>
    </div><button class="modal-back" data-clock-action="root">← Back</button>`;
    return;
  }
}

function isMaleUser() {
  return state.user?.profile?.gender === 'Male';
}

function partnerConnection() {
  return state.user?.connections?.find(connection => connection.relationship === 'Partner');
}

const foodCalories = {
  apple: 52, banana: 89, rice: 130, chicken: 165, beef: 250,
  bread: 265, egg: 155, pasta: 131, salmon: 208, potato: 77,
  milk: 61, yogurt: 59, salad: 33, pizza: 266, noodles: 138
};

const drinkCalories = {
  water: 0, coffee: 2, tea: 1, milk: 61, cola: 42,
  'orange juice': 45, juice: 45, 'sports drink': 24,
  'energy drink': 45, smoothie: 60, lemonade: 40
};

function renderEatingPanel() {
  const panel = document.querySelector('#clockPanel');
  panel.innerHTML = `${timestampRow()}
    <div class="eating-fields">
      <label class="mini-label" for="foodName">Food name</label>
      <input id="foodName" placeholder="e.g. Rice">
      <label class="mini-label" for="foodGrams">Amount</label>
      <div class="minute-input"><input id="foodGrams" type="number" min="1" max="5000" placeholder="100"><span>grams</span></div>
      <label class="mini-label" for="foodCaloriesPer100g">Calories (only needed if food is not found)</label>
      <div class="minute-input"><input id="foodCaloriesPer100g" type="number" min="0" max="2000" placeholder="Auto"><span>kcal / 100 g</span></div>
      <div class="calorie-result"><span>Estimated calories</span><strong id="calorieValue">0 kcal</strong></div>
      <label class="photo-button" for="foodPhoto">Take photo or upload image</label>
      <input class="photo-input" id="foodPhoto" type="file" accept="image/*" capture="environment">
      <div id="photoPreview"></div>
      <button class="analyse-button" type="button" data-clock-action="analyse-photo" disabled>Analyse photo</button>
      <p class="photo-note">Photo recognition is simulated in this local prototype.</p>
      <p class="clock-error" id="eatingError"></p>
      <button class="modal-primary" data-clock-action="save-eating">Save record</button>
      <button class="modal-back" data-clock-action="root">← Back</button>
    </div>`;
  const name = document.querySelector('#foodName');
  const grams = document.querySelector('#foodGrams');
  const manualCalories = document.querySelector('#foodCaloriesPer100g');
  const update = () => updateCalories(name.value, grams.value, manualCalories.value);
  name.addEventListener('input', update);
  grams.addEventListener('input', update);
  manualCalories.addEventListener('input', update);
  document.querySelector('#foodPhoto').addEventListener('change', handleFoodPhoto);
}

function caloriesPer100g(foodName) {
  const normalised = foodName.trim().toLowerCase();
  const match = Object.keys(foodCalories).find(food => normalised.includes(food));
  return match ? foodCalories[match] : null;
}

function updateCalories(foodName, grams, manualValue = '') {
  const amount = Number(grams);
  const referenceValue = manualValue.trim() === '' ? caloriesPer100g(foodName) : Number(manualValue);
  const calories = foodName.trim() && amount > 0 && referenceValue !== null && Number.isFinite(referenceValue)
    ? Math.round(referenceValue * amount / 100) : 0;
  const output = document.querySelector('#calorieValue');
  if (output) output.textContent = `${calories} kcal`;
  return calories;
}

function handleFoodPhoto(event) {
  const file = event.target.files[0];
  const preview = document.querySelector('#photoPreview');
  const analyse = document.querySelector('[data-clock-action="analyse-photo"]');
  if (!file) return;
  preview.innerHTML = `<img class="food-preview" src="${URL.createObjectURL(file)}" alt="Selected food">`;
  document.querySelector('#eatingError').textContent = '';
  analyse.disabled = false;
  analyse.dataset.filename = file.name;
}

function drinkCaloriesPer100ml(drinkName) {
  const normalised = drinkName.trim().toLowerCase();
  if (Object.hasOwn(state.customDrinkCalories, normalised)) return Number(state.customDrinkCalories[normalised]);
  const match = Object.keys(drinkCalories).find(drink => normalised.includes(drink));
  if (match) return drinkCalories[match];
  return 0;
}

function updateDrinkCalories() {
  const selected = document.querySelector('input[name="drinkType"]:checked');
  const amount = Number(document.querySelector('#drinkMillilitres')?.value || 0);
  const calories = selected && amount > 0 ? Math.round(drinkCaloriesPer100ml(selected.value) * amount / 100) : 0;
  const output = document.querySelector('#drinkCalorieValue');
  if (output) output.textContent = `${calories} kcal`;
  return calories;
}

function renderDrinkingPanel() {
  const defaults = ['Water', 'Tea', 'Coffee', 'Milk', 'Cola'];
  defaults.slice().reverse().forEach(drink => {
    if (!state.drinkTypes.some(item => item.toLowerCase() === drink.toLowerCase())) state.drinkTypes.unshift(drink);
  });
  const panel = document.querySelector('#clockPanel');
  const drinks = state.drinkTypes.map((drink, index) => `<label class="drink-row">
    <input type="radio" name="drinkType" value="${escapeHtml(drink)}" ${index === 0 ? 'checked' : ''}>
    <span><b>${escapeHtml(drink)}</b><small>${drinkCaloriesPer100ml(drink)} kcal / 100 ml</small></span>
    ${defaults.includes(drink) ? '' : `<button type="button" aria-label="Delete ${escapeHtml(drink)}" data-clock-action="delete-drink" data-drink="${escapeHtml(drink)}">×</button>`}
  </label>`).join('');
  panel.innerHTML = `${timestampRow()}
    <div class="sports-half">
      <label class="mini-label" for="newDrinkType">Drink type</label>
      <div class="add-drink-row">
        <input id="newDrinkType" maxlength="24" placeholder="e.g. Orange juice">
        <div class="minute-input"><input id="newDrinkCalories" type="number" min="0" max="1000" placeholder="45"><span>kcal / 100 ml</span></div>
        <button type="button" data-clock-action="add-drink">Add drink</button>
      </div>
      <p class="photo-note">Common drinks use built-in reference values. Enter the label value for a custom drink.</p>
      <div class="saved-drinks">${drinks}</div>
    </div>
    <div class="sports-half duration-half">
      <label class="mini-label" for="drinkMillilitres">Amount</label>
      <div class="minute-input"><input id="drinkMillilitres" type="number" min="1" max="10000" placeholder="250"><span>ml</span></div>
      <div class="calorie-result"><span>Estimated calories</span><strong id="drinkCalorieValue">0 kcal</strong></div>
      <p class="clock-error" id="drinkError"></p>
      <button class="modal-primary" data-clock-action="save-drinking">Save record</button>
    </div><button class="modal-back" data-clock-action="root">← Back</button>`;
  document.querySelectorAll('input[name="drinkType"]').forEach(input => input.addEventListener('change', updateDrinkCalories));
  document.querySelector('#drinkMillilitres').addEventListener('input', updateDrinkCalories);
}

function renderSportsPanel() {
  const panel = document.querySelector('#clockPanel');
  const options = state.sportTypes.length
    ? state.sportTypes.map((sport, index) => `<label class="sport-row"><input type="radio" name="sportType" value="${escapeHtml(sport)}" ${index === 0 ? 'checked' : ''}><span>${escapeHtml(sport)}</span><button type="button" aria-label="Delete ${escapeHtml(sport)}" data-clock-action="delete-sport" data-sport="${escapeHtml(sport)}">×</button></label>`).join('')
    : '<p class="empty-sports">Add a sport type to begin.</p>';
  panel.innerHTML = `${timestampRow()}<div class="sports-half">
      <label class="mini-label" for="newSportType">Sport type</label>
      <div class="add-sport-row"><input id="newSportType" maxlength="24" placeholder="e.g. Swimming"><button type="button" data-clock-action="add-sport">Add</button></div>
      <div class="saved-sports">${options}</div>
    </div><div class="sports-half duration-half">
      <label class="mini-label" for="sportMinutes">Duration</label>
      <div class="minute-input"><input id="sportMinutes" type="number" min="1" max="1440" placeholder="30"><span>minutes</span></div>
      <p class="clock-error" id="sportError"></p><button class="modal-primary" data-clock-action="save-sport">Save record</button>
    </div><button class="modal-back" data-clock-action="root">← Back</button>`;
}

function showOptionalEntry(field) {
  const config = {
    height: { label:'Height', type:'number', placeholder:'170', unit:'cm' },
    weight: { label:'Weight', type:'number', placeholder:'65', unit:'kg' }
  }[field];
  document.querySelector('#clockDialogTitle').textContent = config.label;
  const historyButton = field === 'height' || field === 'weight'
    ? `<button class="history-button" data-clock-action="show-${field}-history">View ${config.label} History</button>` : '';
  document.querySelector('#clockPanel').innerHTML = `${timestampRow()}<label class="mini-label" for="optionalValue">${config.label}</label>
    <div class="minute-input"><input id="optionalValue" type="${config.type}" placeholder="${config.placeholder}">${config.unit ? `<span>${config.unit}</span>` : ''}</div>
    <p class="clock-error" id="optionalError"></p><button class="modal-primary" data-clock-action="save-optional" data-field="${field}">Save record</button>
    ${historyButton}
    <button class="modal-back" data-clock-option="optional">← Back</button>`;
}

function showPeriodEntry() {
  if (isMaleUser()) return renderPartnerPeriodHistory();
  document.querySelector('#clockDialogTitle').textContent = 'Period';
  document.querySelector('#clockPanel').innerHTML = `<label class="mini-label" for="periodDate">Date</label>
    <input id="periodDate" type="date" value="${localDateTimeValue().slice(0, 10)}">
    <fieldset class="flow-fieldset"><legend>Flow</legend>
      <div class="flow-options">
        <label class="flow-choice light"><input type="radio" name="periodFlow" value="light"><span>Light</span></label>
        <label class="flow-choice medium"><input type="radio" name="periodFlow" value="medium"><span>Medium</span></label>
        <label class="flow-choice heavy"><input type="radio" name="periodFlow" value="heavy"><span>Heavy</span></label>
      </div>
    </fieldset>
    <p class="clock-error" id="periodError"></p>
    <button class="modal-primary" data-clock-action="save-period">Save record</button>
    <button class="history-button" data-clock-action="show-period-history">View Period History</button>
    <label class="share-period"><input id="sharePeriod" type="checkbox" ${state.user?.periodSharing ? 'checked' : ''}><span><b>Share with partner</b><small>Your connected partner can view your Period calendar.</small></span></label>
    <button class="modal-back" data-clock-option="optional">← Back</button>`;
  document.querySelector('#sharePeriod').addEventListener('change', event => {
    state.user.periodSharing = event.target.checked;
    saveUser();
    showToast(event.target.checked ? 'Period sharing enabled' : 'Period sharing disabled');
  });
}

function renderPartnerPeriodHistory() {
  const partner = partnerConnection();
  document.querySelector('#clockDialogTitle').textContent = partner ? `${partner.id}'s Period` : "Partner's Period";
  if (!partner) {
    document.querySelector('#clockPanel').innerHTML = `<div class="empty-history"><p>No partner is connected. Add a partner by ID to view shared Period information.</p></div>
      <button class="modal-back" data-clock-option="optional">← Back</button>`;
    return;
  }
  const sharedRecords = state.user.partnerPeriodHistory || [];
  if (!sharedRecords.length) {
    document.querySelector('#clockPanel').innerHTML = `<div class="empty-history"><p>No shared Period information is available. Your partner may not have enabled sharing.</p></div>
      <button class="modal-back" data-clock-option="optional">← Back</button>`;
    return;
  }
  renderPeriodHistory(sharedRecords, `${partner.id}'s Period`, true);
}

function renderPeriodHistory(records = state.periodHistory, title = 'Period History', partnerView = false) {
  const viewDate = state.periodCalendarMonth;
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const recordMap = new Map(records.map(record => [record.date, record.flow]));
  const cells = [];
  for (let index = 0; index < firstDay; index += 1) cells.push('<span class="calendar-day empty"></span>');
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const flow = recordMap.get(key) || '';
    cells.push(`<span class="calendar-day ${flow}">${day}</span>`);
  }
  const monthLabel = new Intl.DateTimeFormat('en-AU', { month:'long', year:'numeric' }).format(viewDate);
  document.querySelector('#clockDialogTitle').textContent = title;
  document.querySelector('#clockPanel').innerHTML = `<div class="calendar-header">
      <button aria-label="Previous month" data-clock-action="period-prev">‹</button><strong>${monthLabel}</strong><button aria-label="Next month" data-clock-action="period-next">›</button>
    </div>
    <div class="calendar-week"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>
    <div class="period-calendar">${cells.join('')}</div>
    <div class="flow-legend"><span class="light">Light</span><span class="medium">Medium</span><span class="heavy">Heavy</span></div>
    <button class="modal-back" ${partnerView ? 'data-clock-option="optional"' : 'data-clock-action="period"'}>← Back</button>`;
}

function renderMeasurementHistory(field) {
  const label = field === 'height' ? 'Height' : 'Weight';
  const unit = field === 'height' ? 'cm' : 'kg';
  const records = state.measurementHistory[field] || [];
  document.querySelector('#clockDialogTitle').textContent = `${label} History`;
  if (!records.length) {
    document.querySelector('#clockPanel').innerHTML = `<div class="empty-history"><p>No ${label.toLowerCase()} history yet.</p></div>
      <button class="modal-back" data-clock-action="optional-${field}">← Back</button>`;
    return;
  }
  const values = records.map(record => Number(record.value));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const points = values.map((value, index) => {
    const x = values.length === 1 ? 150 : 18 + index * 264 / (values.length - 1);
    const y = 116 - ((value - min) / range) * 86;
    return `${x},${y}`;
  }).join(' ');
  const rows = records.slice().reverse().map(record => `<li><span>${new Date(record.timestamp).toLocaleString('en-AU')}</span><strong>${record.value} ${unit}</strong></li>`).join('');
  document.querySelector('#clockPanel').innerHTML = `<div class="measurement-chart" aria-label="${label} change chart">
      <svg viewBox="0 0 300 140" role="img"><line x1="18" y1="116" x2="282" y2="116"></line><polyline points="${points}"></polyline>
      ${points.split(' ').map(point => { const [x,y] = point.split(','); return `<circle cx="${x}" cy="${y}" r="4"></circle>`; }).join('')}</svg>
      <div class="chart-range"><span>${min} ${unit}</span><span>${max} ${unit}</span></div>
    </div><ul class="measurement-list">${rows}</ul>
    <button class="modal-back" data-clock-action="optional-${field}">← Back</button>`;
}

function handleClockAction(action, element) {
  if (action === 'root') return showClockRoot();
  if (action === 'period') return showPeriodEntry();
  if (action === 'show-period-history') {
    const latest = state.periodHistory.at(-1)?.date;
    if (latest) state.periodCalendarMonth = new Date(`${latest}T12:00:00`);
    return renderPeriodHistory();
  }
  if (action === 'period-prev' || action === 'period-next') {
    const direction = action === 'period-prev' ? -1 : 1;
    state.periodCalendarMonth = new Date(state.periodCalendarMonth.getFullYear(), state.periodCalendarMonth.getMonth() + direction, 1);
    return isMaleUser() ? renderPartnerPeriodHistory() : renderPeriodHistory();
  }
  if (action === 'save-period') {
    const date = document.querySelector('#periodDate').value;
    const selected = document.querySelector('input[name="periodFlow"]:checked');
    if (!date || !selected) {
      document.querySelector('#periodError').textContent = 'Select a date and flow level.';
      return;
    }
    const existing = state.periodHistory.find(record => record.date === date);
    if (existing) existing.flow = selected.value;
    else state.periodHistory.push({ date, flow:selected.value });
    state.periodHistory.sort((a, b) => a.date.localeCompare(b.date));
    localStorage.setItem('periodHistory', JSON.stringify(state.periodHistory));
    return saveClockRecord('Period', { date, flow:selected.value }, `${date}T12:00`);
  }
  if (action === 'show-height-history') return renderMeasurementHistory('height');
  if (action === 'show-weight-history') return renderMeasurementHistory('weight');
  if (action.startsWith('optional-')) return showOptionalEntry(action.replace('optional-', ''));
  if (action === 'add-sport') {
    const sport = document.querySelector('#newSportType').value.trim();
    if (sport && !state.sportTypes.some(item => item.toLowerCase() === sport.toLowerCase())) state.sportTypes.push(sport);
    localStorage.setItem('clockInSportTypes', JSON.stringify(state.sportTypes));
    return renderSportsPanel();
  }
  if (action === 'delete-sport') {
    state.sportTypes = state.sportTypes.filter(sport => sport !== element.dataset.sport);
    localStorage.setItem('clockInSportTypes', JSON.stringify(state.sportTypes));
    return renderSportsPanel();
  }
  if (action === 'add-drink') {
    const drink = document.querySelector('#newDrinkType').value.trim();
    const calorieInput = document.querySelector('#newDrinkCalories');
    const enteredCalories = calorieInput.value.trim();
    const knownCalories = Object.keys(drinkCalories).find(item => drink.toLowerCase().includes(item));
    if (!drink) {
      showToast('Enter a drink name');
      return;
    }
    if (!knownCalories && enteredCalories === '') {
      calorieInput.focus();
      showToast('No calorie information found. Please enter kcal per 100 ml manually.');
      return;
    }
    const calories = enteredCalories === '' ? drinkCalories[knownCalories] : Number(enteredCalories);
    if (!Number.isFinite(calories) || calories < 0) {
      showToast('Enter a valid kcal value per 100 ml');
      return;
    }
    if (!state.drinkTypes.some(item => item.toLowerCase() === drink.toLowerCase())) state.drinkTypes.push(drink);
    state.customDrinkCalories[drink.toLowerCase()] = calories;
    localStorage.setItem('clockInDrinkTypes', JSON.stringify(state.drinkTypes));
    localStorage.setItem('clockInCustomDrinkCalories', JSON.stringify(state.customDrinkCalories));
    return renderDrinkingPanel();
  }
  if (action === 'delete-drink') {
    const defaultDrinks = ['Water', 'Tea', 'Coffee', 'Milk', 'Cola'];
    if (defaultDrinks.includes(element.dataset.drink)) return;
    state.drinkTypes = state.drinkTypes.filter(drink => drink !== element.dataset.drink);
    delete state.customDrinkCalories[element.dataset.drink.toLowerCase()];
    localStorage.setItem('clockInDrinkTypes', JSON.stringify(state.drinkTypes));
    localStorage.setItem('clockInCustomDrinkCalories', JSON.stringify(state.customDrinkCalories));
    return renderDrinkingPanel();
  }
  if (action === 'analyse-photo') {
    const filename = (element.dataset.filename || '').toLowerCase();
    const detected = Object.keys(foodCalories).find(food => filename.includes(food));
    if (!detected) {
      document.querySelector('#eatingError').textContent = 'No valid food was recognised. Please upload another image.';
      document.querySelector('#foodName').value = '';
      document.querySelector('#calorieValue').textContent = '0 kcal';
      return;
    }
    document.querySelector('#eatingError').textContent = '';
    document.querySelector('#foodName').value = detected.charAt(0).toUpperCase() + detected.slice(1);
    if (!document.querySelector('#foodGrams').value) document.querySelector('#foodGrams').value = 100;
    document.querySelector('#foodCaloriesPer100g').value = '';
    updateCalories(document.querySelector('#foodName').value, document.querySelector('#foodGrams').value, '');
    showToast(`Photo analysis: ${detected}`);
    return;
  }
  if (action === 'save-eating') {
    const food = document.querySelector('#foodName').value.trim();
    const grams = Number(document.querySelector('#foodGrams').value);
    const manualCalories = document.querySelector('#foodCaloriesPer100g').value.trim();
    if (!food || grams < 1) {
      document.querySelector('#eatingError').textContent = 'Enter a food name and amount.';
      return;
    }
    if (caloriesPer100g(food) === null && manualCalories === '') {
      document.querySelector('#eatingError').textContent = 'No calorie information was found. Please enter kcal per 100 g manually.';
      document.querySelector('#foodCaloriesPer100g').focus();
      return;
    }
    const referenceCalories = manualCalories === '' ? caloriesPer100g(food) : Number(manualCalories);
    if (!Number.isFinite(referenceCalories) || referenceCalories < 0) {
      document.querySelector('#eatingError').textContent = 'Enter a valid kcal value per 100 g.';
      return;
    }
    return saveClockRecord('Eating', {
      food, grams, caloriesPer100g: referenceCalories,
      calories: updateCalories(food, grams, String(referenceCalories))
    });
  }
  if (action === 'save-sport') {
    const selected = document.querySelector('input[name="sportType"]:checked');
    const minutes = Number(document.querySelector('#sportMinutes').value);
    if (!selected || minutes < 1) {
      document.querySelector('#sportError').textContent = 'Choose a sport and enter the number of minutes.';
      return;
    }
    const rates = { running:8, walking:4, swimming:7, cycling:7, yoga:3, football:8, basketball:7 };
    const rate = rates[selected.value.toLowerCase()] || 5;
    return saveClockRecord('Sports', { sport:selected.value, minutes, calories:Math.round(minutes * rate) });
  }
  if (action === 'save-drinking') {
    const selected = document.querySelector('input[name="drinkType"]:checked');
    const millilitres = Number(document.querySelector('#drinkMillilitres').value);
    if (!selected || millilitres < 1) {
      document.querySelector('#drinkError').textContent = 'Choose a drink and enter the amount in ml.';
      return;
    }
    return saveClockRecord('Drinking', { drink:selected.value, millilitres, calories:updateDrinkCalories() });
  }
  if (action === 'save-optional') {
    const value = document.querySelector('#optionalValue').value.trim();
    if (!value) {
      document.querySelector('#optionalError').textContent = 'Enter a value before saving.';
      return;
    }
    const field = element.dataset.field;
    if (field === 'height' || field === 'weight') {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue) || numericValue <= 0) {
        document.querySelector('#optionalError').textContent = 'Enter a valid positive number.';
        return;
      }
      const selectedDateTime = document.querySelector('#recordDateTime')?.value;
      const timestamp = selectedDateTime ? new Date(selectedDateTime).toISOString() : new Date().toISOString();
      state.measurementHistory[field].push({ value:numericValue, timestamp });
      localStorage.setItem('measurementHistory', JSON.stringify(state.measurementHistory));
      state.user.profile[field] = String(numericValue);
      saveUser();
    }
    return saveClockRecord('Optional', { field, value });
  }
  if (action.startsWith('save-')) return saveClockRecord(action.replace('save-', ''));
}

function saveClockRecord(category, details = {}, fallbackDateTime = '') {
  const selectedDateTime = document.querySelector('#recordDateTime')?.value || fallbackDateTime;
  const timestamp = selectedDateTime ? new Date(selectedDateTime).toISOString() : new Date().toISOString();
  state.clockRecords.push({ category, details, timestamp });
  localStorage.setItem('clockInRecords', JSON.stringify(state.clockRecords));
  showToast(`${category.charAt(0).toUpperCase() + category.slice(1)} saved with date and time`);
  closeClockModal();
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[character]);
}

function setupAuth() {
  const isSignup = state.mode === 'signup';
  document.querySelector('#authEyebrow').textContent = isSignup ? 'Create your account' : 'Welcome back';
  document.querySelector('#authTitle').textContent = isSignup ? 'Create an account' : 'Log in';
  document.querySelector('#authIntro').textContent = isSignup
    ? 'Use your email and a one time verification code. No password needed.'
    : 'Enter your registered email and we will send you a login code.';
  document.querySelector('#authSubmit').textContent = isSignup ? 'Create account' : 'Log in';
  document.querySelector('#switchCopy').innerHTML = isSignup
    ? 'Already have an account? <button type="button" data-go="login">Log in</button>'
    : 'Need an account? <button type="button" data-go="signup">Create an account</button>';
  if (!isSignup) {
    document.querySelector('#authIntro').insertAdjacentHTML('afterend', '<p class="field-hint"><strong>Test account:</strong> alex.morgan@example.com<br><strong>User ID:</strong> SW 246 810</p>');
  }

  const email = document.querySelector('#email');
  const code = document.querySelector('#code');
  const sendButton = document.querySelector('#sendCode');
  sendButton.addEventListener('click', () => {
    if (!email.validity.valid) {
      document.querySelector('#emailError').textContent = 'Please enter a valid email address.';
      return;
    }
    if (!isSignup && !findAccountByEmail(email.value)) {
      document.querySelector('#emailError').textContent = 'No account was found for this email. Please sign up first.';
      return;
    }
    document.querySelector('#emailError').textContent = '';
    state.code = String(Math.floor(100000 + Math.random() * 900000));
    sendButton.textContent = 'Resend';
    showToast(`Your verification code is ${state.code}`);
  });

  document.querySelector('#authForm').addEventListener('submit', event => {
    event.preventDefault();
    if (!email.validity.valid) {
      document.querySelector('#emailError').textContent = 'Please enter a valid email address.';
      return;
    }
    if (!state.code) {
      document.querySelector('#codeError').textContent = 'Please request a verification code first.';
      return;
    }
    if (code.value.trim() !== state.code) {
      document.querySelector('#codeError').textContent = 'That code is not correct. Please try again.';
      return;
    }
    if (isSignup) {
      if (findAccountByEmail(email.value)) {
        document.querySelector('#emailError').textContent = 'An account already exists for this email. Please log in instead.';
        return;
      }
      state.user = { email: email.value.trim(), id: makeUniqueId(), profile: {}, connections: [] };
      saveUser();
      route('success');
    } else {
      state.user = structuredClone(findAccountByEmail(email.value));
      localStorage.setItem('studywellUser', JSON.stringify(state.user));
      loadDemoData(state.user);
      showToast('Login successful');
      route('home', { login: true });
    }
  });
}

function makeUniqueId() {
  let id;
  do {
    const part = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
    id = `SW ${String(part).padStart(6, '0').replace(/(\d{3})(\d{3})/, '$1 $2')}`;
  } while (state.accounts.some(account => account.id === id));
  return id;
}

function saveUser() {
  localStorage.setItem('studywellUser', JSON.stringify(state.user));
  const index = state.accounts.findIndex(account => account.id === state.user.id);
  if (index >= 0) state.accounts[index] = structuredClone(state.user);
  else state.accounts.push(structuredClone(state.user));
  saveAccounts();
}

function saveAccounts() {
  localStorage.setItem('studywellAccounts', JSON.stringify(state.accounts));
}

function findAccountByEmail(value) {
  const email = value.trim().toLowerCase();
  return state.accounts.find(account => account.email.toLowerCase() === email);
}

function normaliseUserId(value) {
  const digits = value.toUpperCase().replace(/[^0-9]/g, '').slice(0, 6);
  return digits.length === 6 ? `SW ${digits.slice(0, 3)} ${digits.slice(3)}` : '';
}

function loadDemoData(account) {
  if (!account.demoData) return;
  const dates = Array.from({ length: 7 }, (_, index) => new Date(Date.now() - (6 - index) * 86400000).toISOString().slice(0, 10));
  state.stepsHistory = account.demoData.stepsHistory.map((value, index) => ({ date: dates[index], value }));
  state.sleepHistory = account.demoData.sleepHistory.map((value, index) => ({ date: dates[index], value, start: '23:05', end: '06:45', light: 3.6, deep: 1.7, rem: 1.8, awake: 0.5 }));
  state.stressHistory = account.demoData.stressHistory.map((mood, index) => ({ date: dates[index], mood, note: index === 6 ? 'Good day, finished work and took an evening walk.' : '' }));
  state.wearableData = { connected: true, source: 'Alex’s Apple Watch', temperature: account.demoData.temperature, activeCalories: account.demoData.activeCalories };
  state.measurementHistory = { height: [{ value: Number(account.profile.height), timestamp: account.profile.updatedAt }], weight: [{ value: Number(account.profile.weight), timestamp: account.profile.updatedAt }] };
  localStorage.setItem('stepsHistory', JSON.stringify(state.stepsHistory));
  localStorage.setItem('sleepHistory', JSON.stringify(state.sleepHistory));
  localStorage.setItem('stressHistory', JSON.stringify(state.stressHistory));
  localStorage.setItem('wearableData', JSON.stringify(state.wearableData));
  localStorage.setItem('measurementHistory', JSON.stringify(state.measurementHistory));
}

function setupSuccess() {
  if (!state.user) return route('signup');
  document.querySelector('#newUserId').textContent = state.user.id;
  document.querySelector('#copyId').addEventListener('click', async () => {
    await navigator.clipboard.writeText(state.user.id);
    showToast('ID copied');
  });
}

function setupProfile() {
  if (!state.user) return route('signup');
  document.querySelector('#profileForm').addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const timestamp = new Date().toISOString();
    state.user.profile = {
      gender: data.get('gender') || '',
      height: document.querySelector('#height').value,
      weight: document.querySelector('#weight').value,
      updatedAt: timestamp
    };
    ['height', 'weight'].forEach(field => {
      const value = Number(state.user.profile[field]);
      if (value > 0) state.measurementHistory[field].push({ value, timestamp });
    });
    localStorage.setItem('measurementHistory', JSON.stringify(state.measurementHistory));
    saveUser();
    route('connect');
  });
}

function setupConnect() {
  if (!state.user) return route('signup');
  const form = document.querySelector('#connectForm');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const input = document.querySelector('#connectionId');
    const value = normaliseUserId(input.value);
    if (!value) {
      document.querySelector('#connectionError').textContent = 'Enter an ID in the format SW 123 456.';
      return;
    }
    document.querySelector('#connectionError').textContent = '';
    const targetAccount = state.accounts.find(account => account.id === value);
    if (!targetAccount) {
      document.querySelector('#connectionError').textContent = 'No saved account was found for this ID.';
      return;
    }
    if (targetAccount.id === state.user.id) {
      document.querySelector('#connectionError').textContent = 'You cannot connect your account to itself.';
      return;
    }
    if (state.user.connections.some(connection => connection.id === value)) {
      document.querySelector('#connectionError').textContent = 'This account is already connected.';
      return;
    }
    const relationship = new FormData(form).get('relationship');
    state.user.connections.push({ id: value, relationship, nickname: targetAccount.profile?.nickname || targetAccount.email });
    targetAccount.connections ||= [];
    if (!targetAccount.connections.some(connection => connection.id === state.user.id)) {
      targetAccount.connections.push({ id: state.user.id, relationship, nickname: state.user.profile?.nickname || state.user.email });
    }
    saveUser();
    saveAccounts();
    document.querySelector('#connectionResult').innerHTML = `<div class="connection-success">Connected with ${escapeHtml(targetAccount.profile?.nickname || targetAccount.email)} (${value})</div>`;
    window.setTimeout(() => route('home'), 900);
  });
}

function setupHome(fromLogin) {
  if (!state.user) return route('login');
  const modal = document.querySelector('#clockModal');
  modal.addEventListener('click', event => {
    if (event.target === modal) closeClockModal();
  });
  if (fromLogin) window.setTimeout(() => showToast('Login successful'), 100);
}

function setupFeature(featureKey) {
  if (!state.user) return route('login');
  const feature = features[featureKey] || features.reserved;
  document.querySelector('#featurePageTitle').textContent = feature.title;
  const content = document.querySelector('#featurePageContent');
  if (featureKey === 'profile') {
    const nickname = state.user?.profile?.nickname || 'Your nickname';
    const userId = state.user?.id || '';
    const connections = state.user?.connections || [];
    content.innerHTML = `<div class="health-dashboard"><div class="metric-main"><strong>${escapeHtml(nickname)}</strong><span>${escapeHtml(userId)}</span></div><div class="source-row"><span>Email</span><b>${escapeHtml(state.user.email)}</b></div><div class="source-row"><span>Height / Weight</span><b>${escapeHtml(state.user.profile?.height || '—')} cm · ${escapeHtml(state.user.profile?.weight || '—')} kg</b></div><div class="source-row"><span>Connections</span><b>${connections.length}</b></div>${connections.map(connection => `<div class="connection-success">${escapeHtml(connection.nickname || connection.id)} · ${escapeHtml(connection.relationship)}</div>`).join('')}<button class="button secondary full" data-feature-action="logout">Log out</button></div>`;
    return;
  }
  if (['steps', 'sleep', 'calories', 'stress', 'reminder', 'mascot'].includes(featureKey)) {
    renderHealthFeature(featureKey, content);
    return;
  }
  if (feature.options) {
    content.innerHTML = `<div class="clock-options">${feature.options.map(option =>
      `<button class="clock-option" data-feature="${option.toLowerCase()}">${option}</button>`
    ).join('')}</div>`;
  }
}

function demoWeek(values) {
  return values.map((value, index) => ({ date:new Date(Date.now() - (6-index)*86400000).toISOString().slice(0,10), value }));
}

function syncDemoWearable() {
  state.wearableData = { connected:true, source:'Demo Watch', temperature:36.42, activeCalories:428 };
  state.stepsHistory = demoWeek([5260, 7420, 6810, 9100, 8340, 10520, 7864]);
  state.sleepHistory = demoWeek([7.2, 6.5, 7.8, 6.9, 8.1, 7.4, 7.6]).map((item, index) => ({...item, start:'23:10', end:'06:46', light:3.5+(index%2)*.3, deep:1.8, rem:1.7, awake:.6}));
  localStorage.setItem('wearableData', JSON.stringify(state.wearableData));
  localStorage.setItem('stepsHistory', JSON.stringify(state.stepsHistory));
  localStorage.setItem('sleepHistory', JSON.stringify(state.sleepHistory));
}

function lineChart(records, unit='') {
  if (!records.length) return '<p class="empty-data">No history yet.</p>';
  const values = records.map(record => Number(record.value));
  const max = Math.max(...values, 1);
  const points = values.map((value,index) => `${18+index*264/Math.max(values.length-1,1)},${112-value/max*88}`).join(' ');
  return `<svg class="health-line" viewBox="0 0 300 130"><line x1="18" y1="112" x2="282" y2="112"></line><polyline points="${points}"></polyline>${points.split(' ').map(point=>{const [x,y]=point.split(',');return `<circle cx="${x}" cy="${y}" r="4"></circle>`}).join('')}</svg><div class="day-labels">${records.map(record=>`<span>${new Date(record.date+'T12:00').toLocaleDateString('en-AU',{weekday:'short'})}</span>`).join('')}</div><small class="chart-unit">${unit}</small>`;
}

function renderHealthFeature(key, content = document.querySelector('#featurePageContent')) {
  const source = state.wearableData.connected ? state.wearableData.source : 'No data source available';
  if (key === 'steps') {
    const today = state.stepsHistory.at(-1)?.value || 0;
    content.innerHTML = `<div class="health-dashboard"><div class="source-row"><span>Data source</span><b>${source}</b></div><div class="metric-main"><strong>${today.toLocaleString()}</strong><span>steps today</span></div><button class="button primary full" data-feature-action="sync-demo">Use Demo Watch Data</button><details><summary>View History</summary><div class="chart-card">${lineChart(state.stepsHistory,'Steps')}</div></details></div>`;
  }
  if (key === 'sleep') {
    const last = state.sleepHistory.at(-1);
    content.innerHTML = `<div class="health-dashboard"><div class="source-row"><span>Data source</span><b>${source}</b></div><div class="metric-main"><strong>${last?.value || 0} h</strong><span>${last ? `${last.start} – ${last.end}` : 'No sleep recorded today'}</span></div><button class="button primary full" data-feature-action="sync-demo">Use Demo Watch Data</button><details><summary>Manual Entry</summary><div class="manual-grid"><input id="sleepStart" type="time" value="23:00"><input id="sleepEnd" type="time" value="07:00"><button data-feature-action="save-sleep">Save Sleep</button></div></details><details><summary>View History</summary><div class="sleep-bars">${state.sleepHistory.map(r=>`<div class="sleep-day"><div class="stack" title="${r.value} hours"><i class="awake" style="height:${r.awake*12}px"></i><i class="rem" style="height:${r.rem*12}px"></i><i class="light" style="height:${r.light*12}px"></i><i class="deep" style="height:${r.deep*12}px"></i></div><small>${new Date(r.date+'T12:00').toLocaleDateString('en-AU',{weekday:'short'})}</small></div>`).join('')}</div><div class="sleep-legend"><span>Awake</span><span>REM</span><span>Light</span><span>Deep</span></div></details></div>`;
  }
  if (key === 'calories') {
    const today = new Date().toISOString().slice(0,10);
    const records = state.clockRecords.filter(r=>r.timestamp.slice(0,10)===today);
    const intake = records.reduce((sum,r)=>sum+Number(r.details.calories||0)*(r.category==='Eating'||r.category==='Drinking'),0);
    const manualExercise = records.reduce((sum,r)=>sum+(r.category==='Sports'?Number(r.details.calories||0):0),0);
    const basal = Math.round(Number(state.user?.profile?.weight||68)*22);
    const active = Number(state.wearableData.activeCalories||0)+manualExercise;
    const balance = intake-basal-active;
    content.innerHTML = `<div class="health-dashboard"><div class="source-row"><span>Data source</span><b>${source}</b></div><div class="calorie-grid"><div><b>${intake}</b><span>Intake</span></div><div><b>${basal}</b><span>Basal</span></div><div><b>${active}</b><span>Active</span></div></div><div class="balance ${balance>0?'positive':'negative'}"><span>Today's balance</span><strong>${balance>0?'+':''}${balance} kcal</strong></div><p class="data-note">Intake comes from Eating and Drinking. Active calories combine wearable and saved Sports records.</p><button class="button primary full" data-feature-action="sync-demo">Use Demo Watch Data</button><details><summary>View History</summary><p class="empty-data">Daily balances will appear here as records accumulate.</p></details></div>`;
  }
  if (key === 'stress') {
    const todayRecord = state.stressHistory.at(-1);
    content.innerHTML = `<div class="health-dashboard"><div class="source-row"><span>Wearable stress</span><b>${state.wearableData.connected?'Moderate · 42':'Unavailable'}</b></div><div class="temperature"><span>Wrist temperature</span><b>${state.wearableData.temperature ? state.wearableData.temperature+' °C' : 'Unavailable'}</b></div><button class="button primary full" data-feature-action="sync-demo">Use Demo Watch Data</button><details open><summary>Manual Mood & Journal</summary><div class="mood-picks">${[['1','😞'],['2','🙁'],['3','😐'],['4','🙂'],['5','😄']].map(([v,e])=>`<label><input type="radio" name="mood" value="${v}"><span>${e}</span></label>`).join('')}</div><textarea id="journalText" placeholder="How was your day?"></textarea><button class="journal-save" data-feature-action="save-mood">Save Mood</button></details><details><summary>View History</summary><div class="mood-history">${state.stressHistory.slice().reverse().map(r=>`<article><b>${['','😞','🙁','😐','🙂','😄'][r.mood]}</b><span>${r.date}<small>${escapeHtml(r.note)}</small></span></article>`).join('')||'<p class="empty-data">No mood history yet.</p>'}</div></details></div>`;
  }
  if (key === 'reminder') renderReminderDashboard(content);
  if (key === 'mascot') renderMascot(content);
}

function todayClockRecords() {
  const today = new Date().toISOString().slice(0,10);
  return state.clockRecords.filter(record => record.timestamp.slice(0,10) === today);
}

function mascotCondition() {
  const records = todayClockRecords();
  const sleep = Number(state.sleepHistory.at(-1)?.value || 0);
  const intake = records.filter(r=>r.category==='Eating'||r.category==='Drinking').reduce((sum,r)=>sum+Number(r.details.calories||0),0);
  const exercise = Number(state.wearableData.activeCalories||0)+records.filter(r=>r.category==='Sports').reduce((sum,r)=>sum+Number(r.details.calories||0),0);
  const basal = Math.round(Number(state.user?.profile?.weight||68)*22);
  const water = records.filter(r=>r.category==='Drinking'&&r.details.drink==='Water').reduce((sum,r)=>sum+Number(r.details.millilitres||0),0);
  const mood = Number(state.stressHistory.at(-1)?.mood || 3);
  const condition={ tired:sleep>0&&sleep<7, sad:mood<3, happy:mood>3, dry:water<1000, body:intake-basal-exercise>300?'round':intake-basal-exercise < -700?'slim':'normal' };
  const demo=state.mascotSettings.demoState;
  if(demo&&demo!=='live') return {tired:demo==='sleepy',sad:demo==='sad',happy:demo==='happy',dry:demo==='dry',body:demo==='round'?'round':demo==='slim'?'slim':'normal'};
  return condition;
}

function renderMascot(content = document.querySelector('#featurePageContent')) {
  const animal=state.mascotSettings.animal;
  const mascotImages={cat:'assets/ragdoll-cat.png',dog:'assets/shiba-dog.png',rabbit:'assets/grey-rabbit.png'};
  const generatedAvatars={lavender:'assets/avatar-tests/anime-lavender-3d.png',blue:'assets/avatar-tests/anime-blue-3d.png'};
  const displayImage=state.mascotSettings.customImage
    ? generatedAvatars[state.mascotSettings.customImage]
    : mascotImages[animal];
  const displayName=state.mascotSettings.customImage ? 'generated anime' : animal;
  content.innerHTML=`<div class="mascot-page"><div class="mascot-stage">
    <img class="generated-pet ${animal}" src="${displayImage}" alt="3D cartoon ${displayName} companion"></div>
    <div class="pet-status"><span>Balanced</span><span>Rested</span><span>Calm</span><span>Hydrated</span></div>
    <div class="animal-picker"><button data-feature-action="choose-animal" data-animal="cat">Cat</button><button data-feature-action="choose-animal" data-animal="dog">Dog</button><button data-feature-action="choose-animal" data-animal="rabbit">Rabbit</button></div>
    <p class="demo-label">Preview character states</p><div class="state-picker"><button data-feature-action="preview-state" data-state="live">Live</button><button data-feature-action="preview-state" data-state="sleepy">Sleepy</button><button data-feature-action="preview-state" data-state="happy">Happy</button><button data-feature-action="preview-state" data-state="sad">Sad</button><button data-feature-action="preview-state" data-state="dry">Dehydrated</button><button data-feature-action="preview-state" data-state="round">Weight Gain</button><button data-feature-action="preview-state" data-state="slim">Weight Loss</button></div>
    <label class="photo-button" for="mascotPhoto">Upload Pet or Cartoon Image</label><input class="photo-input" id="mascotPhoto" type="file" accept="image/png,image/jpeg,image/webp"><div id="mascotPhotoPreview"></div><p class="clock-error" id="mascotError"></p><button class="button primary full" data-feature-action="generate-mascot">Create 3D Demo Character</button><p class="data-note">Accepted: pets, animated characters and fictional avatars. Photos of real people are not accepted. Photo-to-3D generation is simulated in this browser prototype.</p></div>`;
  document.querySelector('#mascotPhoto').addEventListener('change',event=>{
    const file=event.target.files[0]; if(!file)return;
    const name=file.name.toLowerCase();
    const personWords=['person','people','human','selfie','portrait','face','man','woman','boy','girl'];
    if(personWords.some(word=>name.includes(word))){event.target.value='';document.querySelector('#mascotPhotoPreview').innerHTML='';document.querySelector('#mascotError').textContent='Real-person photos are not accepted. Upload a pet or fictional character.';return;}
    document.querySelector('#mascotError').textContent='Virtual character detected. Ready to create a complete 3D avatar.';
    state.pendingAvatar=name.includes('blue') ? 'blue' : 'lavender';
    document.querySelector('#mascotPhotoPreview').innerHTML=`<img class="mascot-preview" src="${URL.createObjectURL(file)}" alt="Uploaded pet or character reference">`;
  });
}

function reminderStatus(type) {
  const setting = state.reminderSettings[type];
  if (!setting?.enabled) return 'Not set';
  const records = todayClockRecords();
  if (type === 'exercise') {
    const minutes = records.filter(r=>r.category==='Sports').reduce((sum,r)=>sum+Number(r.details.minutes||0),0);
    return minutes >= Number(setting.target) ? 'Goal reached' : `${Math.max(Number(setting.target)-minutes,0)} minutes remaining`;
  }
  if (type === 'food') {
    const intake = records.filter(r=>r.category==='Eating'||r.category==='Drinking').reduce((sum,r)=>sum+Number(r.details.calories||0),0);
    return `${Math.max(Number(setting.target)-intake,0)} kcal remaining today`;
  }
  if (type === 'water') {
    const water = records.filter(r=>r.category==='Drinking'&&r.details.drink==='Water').reduce((sum,r)=>sum+Number(r.details.millilitres||0),0);
    return water >= Number(setting.target) ? 'Goal reached' : `${Math.max(Number(setting.target)-water,0)} ml remaining`;
  }
  const latest = state.periodHistory.at(-1)?.date;
  if (!latest) return 'Record a period to calculate the next date';
  const predicted = new Date(`${latest}T12:00:00`); predicted.setDate(predicted.getDate()+Number(setting.cycle||28));
  return `Predicted around ${predicted.toLocaleDateString('en-AU',{day:'numeric',month:'short'})}`;
}

function renderReminderDashboard(content = document.querySelector('#featurePageContent')) {
  const types = [['exercise','Exercise'],['period','Period'],['food','Food'],['water','Water']];
  content.innerHTML = `<div class="reminder-dashboard"><p class="data-note">Reminders are checked against your saved daily records.</p><div class="reminder-grid">${types.map(([type,label])=>`<button data-feature-action="edit-reminder" data-reminder-type="${type}"><b>${label}</b><small>${reminderStatus(type)}</small><span>${state.reminderSettings[type]?.enabled ? state.reminderSettings[type].time : 'Set reminder'}</span></button>`).join('')}</div><div id="reminderEditor"></div></div>`;
}

function showReminderEditor(type) {
  const labels={exercise:'Exercise',period:'Period',food:'Food',water:'Water'};
  const defaults={exercise:{target:30,time:'20:00'},period:{cycle:28,time:'09:00'},food:{target:1200,time:'18:00'},water:{target:1000,time:'20:00'}};
  const setting={...defaults[type],...(state.reminderSettings[type]||{})};
  let condition='';
  if(type==='exercise') condition=`<label>Daily exercise goal</label><div class="minute-input"><input id="reminderTarget" type="number" value="${setting.target}"><span>minutes</span></div>`;
  if(type==='period') condition=`<label>Average cycle length</label><div class="minute-input"><input id="reminderCycle" type="number" min="20" max="45" value="${setting.cycle}"><span>days</span></div><p class="data-note">Remind me every day near the predicted date until a new Period record is saved.</p>`;
  if(type==='food') condition=`<label>Daily calorie limit</label><div class="minute-input"><input id="reminderTarget" type="number" value="${setting.target}"><span>kcal</span></div><p class="data-note">The reminder shows how many calories remain before the next meal.</p>`;
  if(type==='water') condition=`<label>Daily water goal</label><div class="minute-input"><input id="reminderTarget" type="number" value="${setting.target}"><span>ml</span></div>`;
  document.querySelector('#reminderEditor').innerHTML=`<div class="reminder-editor"><h3>${labels[type]} Reminder</h3>${condition}<label>Reminder time</label><input id="reminderTime" type="time" value="${setting.time}"><label class="reminder-toggle"><input id="reminderEnabled" type="checkbox" ${setting.enabled?'checked':''}><span>Enable this reminder</span></label><button data-feature-action="save-reminder" data-reminder-type="${type}">Save Reminder</button><button class="editor-close" data-feature-action="close-reminder">Cancel</button></div>`;
}

function handleFeatureAction(action, element) {
  if (action === 'logout') {
    localStorage.removeItem('studywellUser');
    state.user = null;
    state.code = '';
    route('welcome');
    return;
  }
  if(action==='preview-state'){state.mascotSettings.demoState=element.dataset.state;localStorage.setItem('mascotSettings',JSON.stringify(state.mascotSettings));renderMascot();return;}
  if (action === 'choose-animal') { state.mascotSettings.animal=element.dataset.animal; delete state.mascotSettings.customImage; localStorage.setItem('mascotSettings',JSON.stringify(state.mascotSettings)); renderMascot(); return; }
  if (action === 'generate-mascot') {
    if (!state.pendingAvatar) return showToast('Upload a pet or fictional character first');
    state.mascotSettings.photoGenerated=true; state.mascotSettings.customImage=state.pendingAvatar;
    localStorage.setItem('mascotSettings',JSON.stringify(state.mascotSettings)); renderMascot(); return showToast('Complete 3D avatar generated with a standard body');
  }
  if (action === 'edit-reminder') return showReminderEditor(element.dataset.reminderType);
  if (action === 'close-reminder') { document.querySelector('#reminderEditor').innerHTML=''; return; }
  if (action === 'save-reminder') {
    const type=element.dataset.reminderType;
    const setting={enabled:document.querySelector('#reminderEnabled').checked,time:document.querySelector('#reminderTime').value};
    if(type==='period') setting.cycle=Number(document.querySelector('#reminderCycle').value);
    else setting.target=Number(document.querySelector('#reminderTarget').value);
    state.reminderSettings[type]=setting; localStorage.setItem('reminderSettings',JSON.stringify(state.reminderSettings)); renderReminderDashboard(); return showToast('Reminder saved locally');
  }
  if (action === 'sync-demo') {
    syncDemoWearable();
    renderHealthFeature(document.querySelector('#featurePageTitle').textContent.toLowerCase());
    return showToast('Demo Watch data synced');
  }
  if (action === 'save-sleep') {
    const start=document.querySelector('#sleepStart').value, end=document.querySelector('#sleepEnd').value;
    if (!start||!end) return showToast('Enter sleep start and end times');
    let hours=(new Date(`2000-01-02T${end}`)-new Date(`2000-01-01T${start}`))/3600000; if(hours>24) hours-=24;
    state.sleepHistory.push({date:new Date().toISOString().slice(0,10),value:Number(hours.toFixed(1)),start,end,light:hours*.5,deep:hours*.22,rem:hours*.2,awake:hours*.08});
    localStorage.setItem('sleepHistory',JSON.stringify(state.sleepHistory)); renderHealthFeature('sleep'); return showToast('Sleep saved locally');
  }
  if (action === 'save-mood') {
    const mood=document.querySelector('input[name="mood"]:checked'); if(!mood) return showToast('Choose a mood first');
    state.stressHistory.push({date:new Date().toISOString().slice(0,10),mood:Number(mood.value),note:document.querySelector('#journalText').value.trim()});
    localStorage.setItem('stressHistory',JSON.stringify(state.stressHistory)); renderHealthFeature('stress'); return showToast('Mood and journal saved locally');
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
}

route(state.user ? 'home' : 'welcome');
