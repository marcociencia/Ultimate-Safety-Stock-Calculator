<?php
/**
 * Plugin Name: Security Calculator Pro
 * Description: Interactive Safety Stock Calculator with Distribution Chart
 * Version: 1.2
 * Author: Operations Research Strategy
 */

// Prevents direct access to the file
if (!defined('ABSPATH')) {
    exit;
}

// Enqueue styles and scripts
function ssc_enqueue_assets() {
    wp_enqueue_style('ssc-style', plugin_dir_url(__FILE__) . 'assets/css/style.css', array(), '1.2');
    wp_enqueue_script('ssc-script', plugin_dir_url(__FILE__) . 'assets/js/script.js', array(), '1.2', true);
}
add_action('wp_enqueue_scripts', 'ssc_enqueue_assets');

// Registers the calculator component
add_shortcode('safety_stock_calculator', 'render_safety_stock_calculator');

function render_safety_stock_calculator() {
    // Starts the PHP output buffer
    ob_start();
    ?>
    
    <div class="ss-calc-container" id="safetyStockCalc">
        <h3 class="ss-calc-title">Interactive Safety Stock Calculator</h3>
        <p class="ss-calc-subtitle">
            Adjust the parameters below. The tool computes safety stock using both the standard formula (demand variability only) and the combined formula (demand + lead time variability).
        </p>

        <div class="ss-calc-grid">
            <div class="ss-calc-field">
                <label class="ss-calc-label">Average Demand <span>(units / period)</span></label>
                <input type="number" id="inputAvgDemand" class="ss-calc-input" value="500" min="10" max="100000">
            </div>
            <div class="ss-calc-field">
                <label class="ss-calc-label">Demand Std. Deviation <span>(σ<sub>D</sub>)</span></label>
                <input type="number" id="inputStdDemand" class="ss-calc-input" value="120" min="1" max="50000">
            </div>
            <div class="ss-calc-field">
                <label class="ss-calc-label">Average Lead Time <span>(days)</span></label>
                <input type="number" id="inputAvgLeadTime" class="ss-calc-input" value="14" min="1" max="365">
            </div>
            <div class="ss-calc-field">
                <label class="ss-calc-label">Lead Time Std. Deviation <span>(σ<sub>LT</sub>)</span></label>
                <input type="number" id="inputStdLeadTime" class="ss-calc-input" value="3" min="0" max="100">
            </div>
        </div>

        <div class="ss-calc-slider-section">
            <div class="ss-calc-slider-header">
                <label class="ss-calc-label">Target Service Level</label>
                <span class="ss-calc-badge" id="serviceLevelBadge">95% &nbsp;·&nbsp; Z = 1.65</span>
            </div>
            <input type="range" id="serviceLevelSlider" class="ss-calc-slider" min="0" max="5" value="2">
            <div class="ss-calc-ticks" id="sliderTicks">
                <span>85%</span>
                <span>90%</span>
                <span class="ss-calc-tick-active">95%</span>
                <span>97.5%</span>
                <span>99%</span>
                <span>99.9%</span>
            </div>
        </div>

        <div class="ss-calc-results">
            <div class="ss-calc-card">
                <p class="ss-calc-card-label">Standard Formula</p>
                <p class="ss-calc-card-formula">SS = Z × σ<sub>D</sub> × √LT</p>
                <p class="ss-calc-card-value" id="valStandard">741</p>
                <p class="ss-calc-card-unit">units safety stock</p>
            </div>
            <div class="ss-calc-card ss-calc-card-combined">
                <p class="ss-calc-card-label">Combined Formula ★</p>
                <p class="ss-calc-card-formula">SS = Z × √(LT × σ<sub>D</sub>² + D² × σ<sub>LT</sub>²)</p>
                <p class="ss-calc-card-value" id="valCombined">2,584</p>
                <p class="ss-calc-card-unit">units safety stock</p>
            </div>
        </div>

        <div class="ss-calc-chart-box">
            <p class="ss-calc-chart-title" id="chartTitle">Probability Distribution · Cycle Service Level ≈ 95.1%</p>
            <div class="ss-calc-chart-container">
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style="overflow: visible;" id="bellCurveSvg">
                </svg>
                <div id="zScoreLabelOverlay" class="ss-calc-z-label">Z = 1.65</div>
            </div>
            <div class="ss-calc-chart-labels">
                <span id="safeZoneLabel">Safe Zone (95.1%)</span>
                <span class="risk" id="riskZoneLabel">Risk Zone (4.9%)</span>
            </div>
        </div>

        <details class="ss-calc-details">
            <summary class="ss-calc-summary">Show intermediate calculations</summary>
            <div class="ss-calc-details-content" id="calcDetails">
            </div>
        </details>
    </div>

    <?php
    return ob_get_clean();
}