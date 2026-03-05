// === Constants ===
const STAGES = ['strategist', 'analyst', 'copywriter', 'skeptic', 'operator'];
const STAGE_LABELS = {
  strategist: 'Strategist',
  analyst: 'Analyst',
  copywriter: 'Copywriter',
  skeptic: 'Skeptic',
  operator: 'Operator'
};
const STAGE_CYCLE_MS = 5000;
const CARD_REVEAL_DELAY_MS = 700;
const REQUEST_TIMEOUT_MS = 120000;

// === DOM References ===
const webhookUrlInput = document.getElementById('webhook-url');
const promptTextarea = document.getElementById('master-prompt');
const runBtn = document.getElementById('run-btn');
const resetBtn = document.getElementById('reset-btn');
const errorMessage = document.getElementById('error-message');
const progressSection = document.getElementById('progress-section');
const progressText = document.getElementById('progress-text');
const resultsSection = document.getElementById('results-section');
const stageIndicators = document.querySelectorAll('.stage-indicator');
const stageConnectors = document.querySelectorAll('.stage-connector');
const resultCards = document.querySelectorAll('.result-card');

// === State ===
let progressIntervalId = null;

// === Init ===
document.addEventListener('DOMContentLoaded', function () {
  runBtn.addEventListener('click', handleRun);
  resetBtn.addEventListener('click', handleReset);

  // Card expand/collapse
  document.querySelectorAll('.card-header').forEach(function (header) {
    header.addEventListener('click', toggleCard);
    header.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCard.call(this, e);
      }
    });
  });
});

// === Main Handler ===
async function handleRun() {
  var webhookUrl = webhookUrlInput.value.trim();
  var prompt = promptTextarea.value.trim();

  if (!prompt) {
    showError('Please enter a prompt before running the chain.');
    return;
  }
  if (!webhookUrl) {
    showError('Please enter the n8n webhook URL.');
    return;
  }

  clearError();
  setLoadingState(true);
  showProgressSection();
  progressIntervalId = startProgressAnimation();

  try {
    var response = await fetchWithTimeout(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt })
    }, REQUEST_TIMEOUT_MS);

    if (!response.ok) {
      throw new Error('Server returned status ' + response.status + '. Check n8n execution logs for details.');
    }

    var data = await response.json();
    data = normalizeResponse(data);
    validateResponseData(data);

    stopProgressAnimation();
    markAllStagesComplete();
    await revealResults(data);
    resetBtn.disabled = false;

  } catch (error) {
    stopProgressAnimation();
    showError(formatError(error));
  } finally {
    setLoadingState(false);
  }
}

// === Fetch with Timeout ===
function fetchWithTimeout(url, options, timeoutMs) {
  var controller = new AbortController();
  var timeoutId = setTimeout(function () {
    controller.abort();
  }, timeoutMs);

  return fetch(url, Object.assign({}, options, { signal: controller.signal }))
    .then(function (response) {
      clearTimeout(timeoutId);
      return response;
    })
    .catch(function (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out after ' + Math.round(timeoutMs / 1000) + ' seconds.');
      }
      throw error;
    });
}

// === Progress Animation ===
function startProgressAnimation() {
  var currentIndex = 0;

  // Activate the first stage immediately
  activateStage(currentIndex);
  updateProgressText(currentIndex);

  return setInterval(function () {
    completeStage(currentIndex);
    currentIndex++;

    if (currentIndex >= STAGES.length) {
      // Cycle back around since we don't know exact timing
      currentIndex = 0;
      resetStageIndicators();
    }

    activateStage(currentIndex);
    updateProgressText(currentIndex);
  }, STAGE_CYCLE_MS);
}

function stopProgressAnimation() {
  if (progressIntervalId) {
    clearInterval(progressIntervalId);
    progressIntervalId = null;
  }
}

function activateStage(index) {
  var indicator = stageIndicators[index];
  if (indicator) {
    indicator.classList.add('active');
    indicator.classList.remove('completed');
  }
}

function completeStage(index) {
  var indicator = stageIndicators[index];
  if (indicator) {
    indicator.classList.remove('active');
    indicator.classList.add('completed');
  }
  // Color the connector after this stage
  if (index < stageConnectors.length) {
    stageConnectors[index].classList.add('completed');
  }
}

function markAllStagesComplete() {
  stageIndicators.forEach(function (indicator) {
    indicator.classList.remove('active');
    indicator.classList.add('completed');
  });
  stageConnectors.forEach(function (connector) {
    connector.classList.add('completed');
  });
  progressText.textContent = 'All stages complete!';
}

function resetStageIndicators() {
  stageIndicators.forEach(function (indicator) {
    indicator.classList.remove('active', 'completed');
  });
  stageConnectors.forEach(function (connector) {
    connector.classList.remove('completed');
  });
}

function updateProgressText(index) {
  var stage = STAGES[index];
  progressText.textContent = 'Stage ' + (index + 1) + ': ' + STAGE_LABELS[stage] + ' processing...';
}

// === Results ===
async function revealResults(data) {
  resultsSection.hidden = false;

  for (var i = 0; i < STAGES.length; i++) {
    var stage = STAGES[i];
    var card = document.querySelector('.result-card[data-stage="' + stage + '"]');
    var contentEl = document.getElementById('result-' + stage);

    if (!card || !contentEl) continue;

    var text = data[stage];
    if (text && text.trim()) {
      contentEl.innerHTML = marked.parse(text);
    } else {
      contentEl.innerHTML = '<p class="no-output">(No output from this stage)</p>';
    }

    card.hidden = false;
    card.classList.add('revealed', 'expanded');

    if (i < STAGES.length - 1) {
      await delay(CARD_REVEAL_DELAY_MS);
    }
  }
}

// === Card Toggle ===
function toggleCard(e) {
  var card = this.closest('.result-card');
  if (card) {
    card.classList.toggle('expanded');
  }
}

// === UI State ===
function setLoadingState(isLoading) {
  if (isLoading) {
    runBtn.disabled = true;
    runBtn.classList.add('loading');
    runBtn.textContent = 'Processing...';
    promptTextarea.disabled = true;
    webhookUrlInput.disabled = true;
    resetBtn.disabled = true;
  } else {
    runBtn.disabled = false;
    runBtn.classList.remove('loading');
    runBtn.textContent = 'Run Chain';
    promptTextarea.disabled = false;
    webhookUrlInput.disabled = false;
  }
}

function showProgressSection() {
  progressSection.hidden = false;
  resultsSection.hidden = true;
  resetStageIndicators();
  resultCards.forEach(function (card) {
    card.hidden = true;
    card.classList.remove('revealed', 'expanded');
  });
}

// === Reset ===
function handleReset() {
  progressSection.hidden = true;
  resultsSection.hidden = true;

  resultCards.forEach(function (card) {
    card.hidden = true;
    card.classList.remove('revealed', 'expanded');
  });

  STAGES.forEach(function (stage) {
    var el = document.getElementById('result-' + stage);
    if (el) el.innerHTML = '';
  });

  resetStageIndicators();
  clearError();
  resetBtn.disabled = true;
  promptTextarea.value = '';
  promptTextarea.focus();
}

// === Error Handling ===
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function clearError() {
  errorMessage.textContent = '';
  errorMessage.hidden = true;
}

function formatError(error) {
  var msg = error.message || String(error);

  if (error.name === 'TypeError' && msg.includes('Failed to fetch')) {
    return 'Could not connect to the webhook. Make sure n8n is running and the webhook URL is correct.';
  }
  if (msg.includes('timed out')) {
    return 'Request timed out. The chain may still be processing in n8n. Check the n8n execution log.';
  }
  if (msg.toLowerCase().includes('cors')) {
    return 'CORS error. Make sure n8n allows cross-origin requests, or open this page from the same origin as n8n.';
  }
  return 'Error: ' + msg;
}

// === Response Validation ===
function normalizeResponse(data) {
  // n8n may wrap the response in an array
  if (Array.isArray(data) && data.length > 0) {
    return data[0];
  }
  return data;
}

function validateResponseData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Unexpected response format. Expected a JSON object with stage outputs.');
  }

  var missing = [];
  STAGES.forEach(function (stage) {
    if (typeof data[stage] !== 'string') {
      missing.push(stage);
    }
  });

  if (missing.length === STAGES.length) {
    throw new Error('Response does not contain any stage outputs. Check the n8n workflow configuration.');
  }
  // Allow partial results — missing stages will show "(No output)" message
}

// === Utility ===
function delay(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}
