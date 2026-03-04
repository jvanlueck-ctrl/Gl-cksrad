const segments = [
  { label: 'Feld 1', color: '#ff6b6b', weight: 25 },
  { label: 'Feld 2', color: '#ffd166', weight: 25 },
  { label: 'Feld 3', color: '#06d6a0', weight: 25 },
  { label: 'Feld 4', color: '#4cc9f0', weight: 25 },
];

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const sizeControls = document.getElementById('sizeControls');
const latestResult = document.getElementById('latestResult');
const resultLog = document.getElementById('resultLog');
const spinButton = document.getElementById('spinButton');

let currentRotation = 0;
let isSpinning = false;

function totalWeight() {
  return segments.reduce((sum, segment) => sum + Number(segment.weight), 0);
}

function buildSizeControls() {
  segments.forEach((segment, index) => {
    const control = document.createElement('div');
    control.className = 'control';

    const label = document.createElement('label');
    label.setAttribute('for', `segment-${index}`);
    label.textContent = `${segment.label} (${segment.weight})`;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '5';
    slider.max = '80';
    slider.value = String(segment.weight);
    slider.id = `segment-${index}`;

    slider.addEventListener('input', (event) => {
      segment.weight = Number(event.target.value);
      label.textContent = `${segment.label} (${segment.weight})`;
      drawWheel(currentRotation);
    });

    control.append(label, slider);
    sizeControls.append(control);
  });
}

function drawWheel(rotation = 0) {
  const { width, height } = canvas;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 8;

  ctx.clearRect(0, 0, width, height);

  let startAngle = rotation - Math.PI / 2;
  const sumWeights = totalWeight();

  segments.forEach((segment) => {
    const sliceAngle = (segment.weight / sumWeights) * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = segment.color;
    ctx.fill();

    ctx.strokeStyle = '#10223a';
    ctx.lineWidth = 2;
    ctx.stroke();

    const textAngle = startAngle + sliceAngle / 2;
    const textRadius = radius * 0.63;
    const textX = centerX + Math.cos(textAngle) * textRadius;
    const textY = centerY + Math.sin(textAngle) * textRadius;

    ctx.save();
    ctx.translate(textX, textY);
    ctx.rotate(textAngle + Math.PI / 2);
    ctx.fillStyle = '#10223a';
    ctx.font = '700 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(segment.label, 0, 0);
    ctx.restore();

    startAngle = endAngle;
  });

  ctx.beginPath();
  ctx.arc(centerX, centerY, 26, 0, Math.PI * 2);
  ctx.fillStyle = '#10223a';
  ctx.fill();
}

function getResultByAngle(rotation) {
  const normalized = ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const pointerAngle = (Math.PI * 1.5 - normalized + Math.PI * 2) % (Math.PI * 2);

  let cumulative = 0;
  const sumWeights = totalWeight();

  for (const segment of segments) {
    cumulative += (segment.weight / sumWeights) * Math.PI * 2;
    if (pointerAngle <= cumulative) {
      return segment.label;
    }
  }

  return segments[segments.length - 1].label;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function spinWheel() {
  if (isSpinning) return;

  isSpinning = true;
  spinButton.disabled = true;

  const startRotation = currentRotation;
  const randomExtra = Math.random() * Math.PI * 2;
  const fullSpins = (4 + Math.random() * 2) * Math.PI * 2;
  const targetRotation = startRotation + fullSpins + randomExtra;

  const duration = 4200;
  const startTime = performance.now();

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);

    currentRotation = startRotation + (targetRotation - startRotation) * eased;
    drawWheel(currentRotation);

    if (progress < 1) {
      requestAnimationFrame(animate);
      return;
    }

    const result = getResultByAngle(currentRotation);
    latestResult.textContent = result;

    const logEntry = document.createElement('li');
    const time = new Date().toLocaleTimeString('de-DE');
    logEntry.textContent = `${time}: ${result}`;
    resultLog.prepend(logEntry);

    isSpinning = false;
    spinButton.disabled = false;
  }

  requestAnimationFrame(animate);
}

spinButton.addEventListener('click', spinWheel);

buildSizeControls();
drawWheel();
