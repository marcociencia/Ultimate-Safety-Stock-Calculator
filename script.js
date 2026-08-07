document.addEventListener('DOMContentLoaded', function() {
    const Z_SCORES = {
        '85%': 1.04,
        '90%': 1.28,
        '95%': 1.65,
        '97.5%': 1.96,
        '99%': 2.33,
        '99.9%': 3.09
    };
    const SERVICE_LEVELS = Object.keys(Z_SCORES);

    function normalCdf(x) {
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;
        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x) / Math.sqrt(2);
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return 0.5 * (1.0 + sign * y);
    }

    const container = document.getElementById('safetyStockCalc');
    if (!container) return; // Exit if calculator is not on the page

    const inputAvgDemand = container.querySelector('#inputAvgDemand');
    const inputStdDemand = container.querySelector('#inputStdDemand');
    const inputAvgLeadTime = container.querySelector('#inputAvgLeadTime');
    const inputStdLeadTime = container.querySelector('#inputStdLeadTime');
    const slider = container.querySelector('#serviceLevelSlider');
    const badge = container.querySelector('#serviceLevelBadge');
    const ticks = container.querySelectorAll('#sliderTicks span');
    
    const valStandard = container.querySelector('#valStandard');
    const valCombined = container.querySelector('#valCombined');
    const chartTitle = container.querySelector('#chartTitle');
    const svg = container.querySelector('#bellCurveSvg');
    const zScoreOverlay = container.querySelector('#zScoreLabelOverlay');
    const safeZoneLabel = container.querySelector('#safeZoneLabel');
    const riskZoneLabel = container.querySelector('#riskZoneLabel');
    const calcDetails = container.querySelector('#calcDetails');

    function updateCalculator() {
        const avgDemand = parseFloat(inputAvgDemand.value) || 0;
        const stdDemand = parseFloat(inputStdDemand.value) || 0;
        const avgLeadTime = parseFloat(inputAvgLeadTime.value) || 0;
        const stdLeadTime = parseFloat(inputStdLeadTime.value) || 0;
        
        const serviceLevel = SERVICE_LEVELS[slider.value];
        const z = Z_SCORES[serviceLevel];

        ticks.forEach((tick, idx) => {
            if(idx == slider.value) {
                tick.className = 'ss-calc-tick-active';
            } else {
                tick.className = '';
            }
        });

        badge.innerHTML = `${serviceLevel} &nbsp;·&nbsp; Z = ${z.toFixed(2)}`;

        const sigmaDDLT = stdDemand * Math.sqrt(avgLeadTime);
        const ssStandard = Math.round(z * sigmaDDLT);
        valStandard.innerText = ssStandard.toLocaleString();

        const varianceCombined = (avgLeadTime * stdDemand * stdDemand) + (avgDemand * avgDemand * stdLeadTime * stdLeadTime);
        const sigmaCombined = Math.sqrt(varianceCombined);
        const ssCombined = Math.round(z * sigmaCombined);
        valCombined.innerText = ssCombined.toLocaleString();

        const csl = normalCdf(z);
        const cslPct = (csl * 100).toFixed(1);
        const riskPct = (100 - parseFloat(cslPct)).toFixed(1);

        chartTitle.innerText = `Probability Distribution · Cycle Service Level ≈ ${cslPct}%`;
        safeZoneLabel.innerText = `Safe Zone (${cslPct}%)`;
        riskZoneLabel.innerText = `Risk Zone (${riskPct}%)`;

        const mean = 0;
        const totalStd = sigmaCombined || 1;
        const chartMin = mean - 4 * totalStd;
        const chartMax = mean + 4 * totalStd;
        const step = (chartMax - chartMin) / 200;
        
        let bellPoints = [];
        for (let x = chartMin; x <= chartMax; x += step) {
            const y = (1 / (totalStd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / totalStd, 2));
            bellPoints.push({ x, y });
        }
        
        const maxY = Math.max(...bellPoints.map(p => p.y));
        const cutoffX = z * totalStd;
        const pctX = ((cutoffX - chartMin) / (chartMax - chartMin)) * 100;

        let fullCurveD = '';
        let safeZoneD = '';
        let riskZoneD = '';

        const safePoints = bellPoints.filter(p => p.x <= cutoffX);
        const riskPoints = bellPoints.filter(p => p.x >= cutoffX);

        bellPoints.forEach((p, i) => {
            const sx = ((p.x - chartMin) / (chartMax - chartMin)) * 100;
            const sy = 100 - (p.y / maxY) * 95;
            fullCurveD += `${i === 0 ? 'M' : 'L'} ${sx} ${sy} `;
        });

        safePoints.forEach((p, i) => {
            const sx = ((p.x - chartMin) / (chartMax - chartMin)) * 100;
            const sy = 100 - (p.y / maxY) * 95;
            safeZoneD += `${i === 0 ? 'M' : 'L'} ${sx} ${sy} `;
        });
        if(safePoints.length > 0) {
            safeZoneD += `L ${pctX} 100 L 0 100 Z`;
        }

        riskPoints.forEach((p, i) => {
            const sx = ((p.x - chartMin) / (chartMax - chartMin)) * 100;
            const sy = 100 - (p.y / maxY) * 95;
            riskZoneD += `${i === 0 ? 'M' : 'L'} ${sx} ${sy} `;
        });
        if(riskPoints.length > 0) {
            riskZoneD += `L 100 100 Z`;
        }

        svg.innerHTML = `
            <path d="${safeZoneD}" fill="#3B82F6" fill-opacity="0.2" />
            <path d="${riskZoneD}" fill="#EF4444" fill-opacity="0.15" />
            <path d="${fullCurveD}" fill="none" stroke="#3B82F6" stroke-width="1.5" vector-effect="non-scaling-stroke" />
            <line x1="${pctX}" y1="5" x2="${pctX}" y2="100" stroke="#EF4444" stroke-width="1.5" stroke-dasharray="3,3" vector-effect="non-scaling-stroke" />
        `;

        zScoreOverlay.innerText = `Z = ${z.toFixed(2)}`;
        if (pctX > 50) {
            zScoreOverlay.style.left = `calc(${pctX}% - 6px)`;
            zScoreOverlay.style.transform = 'translateX(-100%)';
        } else {
            zScoreOverlay.style.left = `calc(${pctX}% + 6px)`;
            zScoreOverlay.style.transform = 'none';
        }

        calcDetails.innerHTML = `
            <p>σ<sub>DDLT</sub> = σ<sub>D</sub> × √LT = ${stdDemand} × √${avgLeadTime} = ${sigmaDDLT.toFixed(1)}</p>
            <p>σ<sub>Combined</sub> = √(${avgLeadTime} × ${stdDemand}² + ${avgDemand}² × ${stdLeadTime}²) = ${sigmaCombined.toFixed(1)}</p>
            <p>Z-score (${serviceLevel}) = ${z.toFixed(2)}</p>
            <p class="ss-calc-border-t">SS (Standard) = ${z.toFixed(2)} × ${sigmaDDLT.toFixed(1)} = <strong>${ssStandard.toLocaleString()}</strong></p>
            <p>SS (Combined) = ${z.toFixed(2)} × ${sigmaCombined.toFixed(1)} = <strong>${ssCombined.toLocaleString()}</strong></p>
        `;
    }

    [inputAvgDemand, inputStdDemand, inputAvgLeadTime, inputStdLeadTime].forEach(input => {
        input.addEventListener('input', updateCalculator);
    });
    slider.addEventListener('input', updateCalculator);

    updateCalculator();
});