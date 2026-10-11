'use strict';

(() => {
    const { DEVICE_POINTS, STATIONS, findBestStation } = window.NetworkStation;
    const stationColors = ['#c8e640', '#ef7655', '#4ea99d', '#7390d0', '#e6ae40'];
    const devices = DEVICE_POINTS.map((point, index) => ({
        id: `device-${index + 1}`,
        label: `DEVICE ${String(index + 1).padStart(2, '0')}`,
        x: point.x,
        y: point.y,
        preset: true,
    }));
    let selectedId = devices[0].id;
    let minimumSpeed = 0;
    let sortBySpeed = false;

    const elements = {
        deviceList: document.querySelector('#device-list'),
        coordinateForm: document.querySelector('#coordinate-form'),
        coordinateX: document.querySelector('#coordinate-x'),
        coordinateY: document.querySelector('#coordinate-y'),
        formError: document.querySelector('#form-error'),
        stationList: document.querySelector('#station-list'),
        selectedLabel: document.querySelector('#selected-label'),
        coordinateTitle: document.querySelector('#coordinate-title'),
        connectionStatus: document.querySelector('#connection-status'),
        canvas: document.querySelector('#coverage-map'),
        resultCard: document.querySelector('#result-card'),
        resultsBody: document.querySelector('#results-body'),
        stationCount: document.querySelector('#station-count'),
        pointCount: document.querySelector('#point-count'),
        minimumSignal: document.querySelector('#minimum-signal'),
        thresholdValue: document.querySelector('#threshold-value'),
        sortSpeed: document.querySelector('#sort-speed'),
        analyzeCta: document.querySelector('#analyze-cta'),
    };

    function selectedDevice() {
        return devices.find((device) => device.id === selectedId) || devices[0];
    }

    function selectedAnalysis() {
        const strongest = findBestStation(selectedDevice());
        const result = strongest && strongest.speed >= minimumSpeed ? strongest : null;
        return { strongest, result, belowThreshold: Boolean(strongest && !result) };
    }

    function formatCoordinate(value) {
        return Number.isInteger(value) ? String(value) : Number(value.toFixed(2)).toString();
    }

    function formatSpeed(speed) {
        if (speed >= 10) return speed.toFixed(2);
        if (speed >= 1) return speed.toFixed(2);
        return speed.toFixed(3);
    }

    function renderDeviceList() {
        elements.deviceList.innerHTML = devices.map((device, index) => `
            <button class="device-choice ${device.id === selectedId ? 'is-selected' : ''}" type="button" data-device-id="${device.id}" aria-pressed="${device.id === selectedId}">
                <span class="device-index">${String(index + 1).padStart(2, '0')}</span>
                <span class="device-coordinate">${formatCoordinate(device.x)} <i>/</i> ${formatCoordinate(device.y)}</span>
                <span class="device-arrow">↗</span>
            </button>
        `).join('');

        elements.deviceList.querySelectorAll('[data-device-id]').forEach((button) => {
            button.addEventListener('click', () => {
                selectedId = button.dataset.deviceId;
                elements.formError.textContent = '';
                render();
            });
        });
    }

    function renderStationRegister() {
        const device = selectedDevice();
        const best = selectedAnalysis().result;
        elements.stationList.innerHTML = STATIONS.map((station, index) => {
            const distance = window.NetworkStation.calculateDistance(device, station);
            const speed = window.NetworkStation.calculateSpeed(distance, station.reach);
            const isBest = best?.station === station;
            return `
            <div class="station-row ${isBest ? 'is-best' : ''}" style="--row-index:${index}">
                <span class="station-swatch" style="--station-color:${stationColors[index]}"></span>
                <span class="station-details"><span class="station-coordinate">${formatCoordinate(station.x)}, ${formatCoordinate(station.y)}</span><span class="station-metrics">${formatCoordinate(distance)} / ${speed > 0 ? formatSpeed(speed) : '—'}</span></span>
                ${isBest ? '<span class="best-tag">BEST</span>' : `<span class="station-reach">r ${formatCoordinate(station.reach)}</span>`}
            </div>
        `;
        }).join('');
    }

    function renderSelectedResult() {
        const device = selectedDevice();
        const { strongest, result, belowThreshold } = selectedAnalysis();
        elements.selectedLabel.textContent = device.label;
        elements.coordinateTitle.textContent = `(${formatCoordinate(device.x)}, ${formatCoordinate(device.y)})`;
        elements.coordinateX.value = device.x;
        elements.coordinateY.value = device.y;

        if (!result) {
            elements.connectionStatus.className = `connection-status ${belowThreshold ? 'is-filtered' : 'is-offline'}`;
            elements.connectionStatus.innerHTML = `<span></span> ${belowThreshold ? 'BELOW THRESHOLD' : 'NO COVERAGE'}`;
            elements.resultCard.className = `result-card ${belowThreshold ? 'is-filtered' : 'is-uncovered'}`;
            elements.resultCard.innerHTML = belowThreshold ? `
                <div class="result-icon" aria-hidden="true">⌁</div>
                <div class="result-copy"><p class="eyebrow">MATCH FILTERED</p><h3>Strongest signal is below threshold.</h3><p>Station ${formatCoordinate(strongest.station.x)}, ${formatCoordinate(strongest.station.y)} scores ${formatSpeed(strongest.speed)}.</p></div>
                <div class="result-value"><span>MINIMUM</span><strong>${formatSpeed(minimumSpeed)}</strong></div>
            ` : `
                <div class="result-icon" aria-hidden="true">×</div>
                <div class="result-copy"><p class="eyebrow">SIGNAL NOT FOUND</p><h3>No station in range.</h3><p>This coordinate falls outside every station’s positive-speed coverage radius.</p></div>
                <div class="result-value"><span>BEST SPEED</span><strong>—</strong></div>
            `;
            return result;
        }

        const stationIndex = STATIONS.indexOf(result.station);
        elements.connectionStatus.className = 'connection-status is-online';
        elements.connectionStatus.innerHTML = '<span></span> IN COVERAGE';
        elements.resultCard.className = 'result-card';
        elements.resultCard.innerHTML = `
            <div class="result-icon" style="--station-color:${stationColors[stationIndex]}" aria-hidden="true">↗</div>
            <div class="result-copy"><p class="eyebrow">STRONGEST AVAILABLE STATION</p><h3>Station ${formatCoordinate(result.station.x)}, ${formatCoordinate(result.station.y)}</h3><p>${formatCoordinate(result.distance)} units away <i>·</i> ${formatCoordinate(result.station.reach)} unit reach</p></div>
            <div class="result-value"><span>NETWORK SPEED</span><strong>${formatSpeed(result.speed)}</strong></div>
        `;
        return result;
    }

    function renderResultsTable() {
        const orderedDevices = [...devices];
        if (sortBySpeed) {
            orderedDevices.sort((first, second) => {
                const firstSpeed = selectedAnalysisFor(first).result?.speed ?? -1;
                const secondSpeed = selectedAnalysisFor(second).result?.speed ?? -1;
                return secondSpeed - firstSpeed;
            });
        }
        elements.sortSpeed.setAttribute('aria-label', sortBySpeed ? 'Sort by assignment order' : 'Sort by speed');
        elements.sortSpeed.querySelector('span').textContent = sortBySpeed ? '↓' : '↕';
        elements.resultsBody.innerHTML = orderedDevices.map((device, index) => {
            const analysis = selectedAnalysisFor(device);
            const { result, strongest, belowThreshold } = analysis;
            const active = device.id === selectedId;
            return `
                <tr class="${active ? 'is-active' : ''}" data-device-id="${device.id}" tabindex="0" aria-label="Inspect ${device.label.toLowerCase()} at ${formatCoordinate(device.x)}, ${formatCoordinate(device.y)}">
                    <td data-label="Device"><span class="table-device-index">${String(index + 1).padStart(2, '0')}</span>${device.label}</td>
                    <td data-label="Coordinate" class="coordinate-cell">${formatCoordinate(device.x)}, ${formatCoordinate(device.y)}</td>
                    <td data-label="Best station">${strongest ? `${formatCoordinate(strongest.station.x)}, ${formatCoordinate(strongest.station.y)}` : '<span class="muted">—</span>'}</td>
                    <td data-label="Distance">${strongest ? `${formatCoordinate(strongest.distance)} units` : '<span class="muted">—</span>'}</td>
                    <td data-label="Speed" class="speed-cell">${strongest ? formatSpeed(strongest.speed) : '<span class="muted">—</span>'}</td>
                    <td data-label="Status"><span class="table-status ${result ? 'is-covered' : belowThreshold ? 'is-filtered' : 'is-uncovered'}">${result ? 'COVERED' : belowThreshold ? 'BELOW THRESHOLD' : 'OUT OF RANGE'}</span></td>
                </tr>
            `;
        }).join('');

        elements.resultsBody.querySelectorAll('[data-device-id]').forEach((row) => {
            const select = () => {
                selectedId = row.dataset.deviceId;
                render();
            };
            row.addEventListener('click', select);
            row.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    select();
                }
            });
        });
    }

    function selectedAnalysisFor(device) {
        const strongest = findBestStation(device);
        const result = strongest && strongest.speed >= minimumSpeed ? strongest : null;
        return { strongest, result, belowThreshold: Boolean(strongest && !result) };
    }

    function drawMap(result) {
        const canvas = elements.canvas;
        const bounds = canvas.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;

        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.round(bounds.width * ratio);
        canvas.height = Math.round(bounds.height * ratio);
        const context = canvas.getContext('2d');
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.clearRect(0, 0, bounds.width, bounds.height);

        const padding = { left: 44, right: 28, top: 28, bottom: 38 };
        const minX = Math.min(...STATIONS.map((station) => station.x - station.reach), ...devices.map((device) => device.x)) - 4;
        const maxX = Math.max(...STATIONS.map((station) => station.x + station.reach), ...devices.map((device) => device.x)) + 4;
        const minY = Math.min(...STATIONS.map((station) => station.y - station.reach), ...devices.map((device) => device.y)) - 4;
        const maxY = Math.max(...STATIONS.map((station) => station.y + station.reach), ...devices.map((device) => device.y)) + 4;
        const unitScale = Math.min(
            (bounds.width - padding.left - padding.right) / (maxX - minX),
            (bounds.height - padding.top - padding.bottom) / (maxY - minY),
        );
        const plotWidth = (maxX - minX) * unitScale;
        const plotHeight = (maxY - minY) * unitScale;
        const originX = padding.left + (bounds.width - padding.left - padding.right - plotWidth) / 2;
        const originY = padding.top + (bounds.height - padding.top - padding.bottom - plotHeight) / 2;
        const mapPoint = (x, y) => ({
            x: originX + (x - minX) * unitScale,
            y: originY + (maxY - y) * unitScale,
        });

        context.font = '10px "SFMono-Regular", Consolas, monospace';
        context.textAlign = 'center';
        context.textBaseline = 'top';
        for (let value = Math.ceil(minX / 20) * 20; value <= maxX; value += 20) {
            const x = mapPoint(value, minY).x;
            context.beginPath();
            context.moveTo(x, originY);
            context.lineTo(x, originY + plotHeight);
            context.strokeStyle = '#26352e14';
            context.stroke();
            context.fillStyle = '#737e75';
            context.fillText(String(value), x, originY + plotHeight + 9);
        }
        context.textAlign = 'right';
        context.textBaseline = 'middle';
        for (let value = Math.ceil(minY / 20) * 20; value <= maxY; value += 20) {
            const y = mapPoint(minX, value).y;
            context.beginPath();
            context.moveTo(originX, y);
            context.lineTo(originX + plotWidth, y);
            context.strokeStyle = '#26352e14';
            context.stroke();
            context.fillStyle = '#737e75';
            context.fillText(String(value), originX - 9, y);
        }

        const device = selectedDevice();
        if (result) {
            const from = mapPoint(device.x, device.y);
            const to = mapPoint(result.station.x, result.station.y);
            context.beginPath();
            context.moveTo(from.x, from.y);
            context.lineTo(to.x, to.y);
            context.setLineDash([4, 5]);
            context.lineWidth = 1.5;
            context.strokeStyle = '#f18a64aa';
            context.stroke();
            context.setLineDash([]);
        }

        STATIONS.forEach((station, index) => {
            const center = mapPoint(station.x, station.y);
            const radius = station.reach * unitScale;
            context.beginPath();
            context.arc(center.x, center.y, radius, 0, Math.PI * 2);
            context.fillStyle = `${stationColors[index]}12`;
            context.fill();
            context.setLineDash([3, 5]);
            context.lineWidth = 1;
            context.strokeStyle = `${stationColors[index]}a8`;
            context.stroke();
            context.setLineDash([]);

            context.beginPath();
            context.arc(center.x, center.y, 5, 0, Math.PI * 2);
            context.fillStyle = stationColors[index];
            context.fill();
            context.lineWidth = 2;
            context.strokeStyle = '#f8f8f3';
            context.stroke();

            context.textAlign = 'left';
            context.textBaseline = 'bottom';
            context.font = '600 10px "SFMono-Regular", Consolas, monospace';
            context.fillStyle = '#304138';
            context.fillText(`S${index + 1}`, center.x + 8, center.y - 5);
        });

        const selected = mapPoint(device.x, device.y);
        context.beginPath();
        context.arc(selected.x, selected.y, 10, 0, Math.PI * 2);
        context.fillStyle = '#f18a6424';
        context.fill();
        context.beginPath();
        context.arc(selected.x, selected.y, 4.5, 0, Math.PI * 2);
        context.fillStyle = '#ed7953';
        context.fill();
        context.lineWidth = 2;
        context.strokeStyle = '#fffaf2';
        context.stroke();
        if (result && result.distance < 0.001) {
            const winningStationIndex = STATIONS.indexOf(result.station);
            context.beginPath();
            context.arc(selected.x, selected.y, 7.5, 0, Math.PI * 2);
            context.lineWidth = 2;
            context.strokeStyle = stationColors[winningStationIndex];
            context.stroke();
        }
        context.textAlign = 'left';
        context.textBaseline = 'top';
        context.font = '600 10px "SFMono-Regular", Consolas, monospace';
        context.fillStyle = '#aa543b';
        context.fillText('DEVICE', selected.x + 9, selected.y + 7);
    }

    function render() {
        elements.stationCount.textContent = String(STATIONS.length).padStart(2, '0');
        elements.pointCount.textContent = String(devices.length).padStart(2, '0');
        renderDeviceList();
        renderStationRegister();
        const result = renderSelectedResult();
        renderResultsTable();
        drawMap(result);
        elements.thresholdValue.textContent = minimumSpeed === 0 ? 'OFF' : `≥ ${formatSpeed(minimumSpeed)}`;
        requestAnimationFrame(() => elements.resultCard.classList.add('has-arrived'));
    }

    elements.coordinateForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const x = Number(elements.coordinateX.value);
        const y = Number(elements.coordinateY.value);
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            elements.formError.textContent = 'Enter finite numeric coordinates.';
            return;
        }

        const existing = devices.find((device) => !device.preset && device.x === x && device.y === y);
        if (existing) {
            selectedId = existing.id;
        } else {
            const device = { id: `custom-${Date.now()}`, label: 'CUSTOM POINT', x, y, preset: false };
            devices.push(device);
            selectedId = device.id;
        }
        elements.formError.textContent = '';
        render();
    });

    elements.minimumSignal.addEventListener('input', () => {
        minimumSpeed = Number(elements.minimumSignal.value);
        render();
    });
    elements.sortSpeed.addEventListener('click', () => {
        sortBySpeed = !sortBySpeed;
        renderResultsTable();
    });
    elements.analyzeCta.addEventListener('click', () => {
        document.querySelector('.workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.querySelector('.device-choice')?.focus({ preventScroll: true });
    });

    window.addEventListener('resize', () => drawMap(findBestStation(selectedDevice())));
    render();
})();