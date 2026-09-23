/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { css, html } from "../base/web-components";
import { KCUIElement } from "./element";

/**
 * kc-ui-panel and kc-ui-panel-body encompass basic
 * scrollable panels
 */

export class KCUIPanelElement extends KCUIElement {
    static override styles = [
        ...KCUIElement.styles,
        css`
            :host {
                width: 100%;
                height: 100%;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                background: var(--panel-bg);
                color: var(--panel-fg);
                --bg: var(--panel-bg);
            }

            :host(:last-child) {
                flex-grow: 1;
            }
        `,
    ];

    override render() {
        return html`<slot></slot>`;
    }
}

window.customElements.define("kc-ui-panel", KCUIPanelElement);

export class KCUIPanelTitleElement extends KCUIElement {
    static override styles = [
        ...KCUIElement.styles,
        css`
            :host {
                flex: 0;
                width: 100%;
                box-sizing: border-box;
                min-height: 2.6rem;
                text-align: left;
                padding: 0.55em 0.75em;
                display: flex;
                align-items: center;
                background: var(--panel-title-bg);
                color: var(--panel-title-fg);
                border-top: var(--panel-title-border);
                border-bottom: var(--panel-title-border);
                font-weight: 600;
                line-height: 1.25;
                user-select: none;
            }

            div.title {
                flex: 1;
            }

            div.actions {
                flex: 0 0 auto;
                display: flex;
                align-items: center;
                gap: 0.25em;
                flex-direction: row;
                /* cheeky hack to work around scrollbar causing placement to be off. */
                padding-right: 6px;
            }
        `,
    ];

    override render() {
        return html`<div class="title">${this.title}</div>
            <div class="actions">
                <slot name="actions"></slot>
            </div>`;
    }
}

window.customElements.define("kc-ui-panel-title", KCUIPanelTitleElement);

export class KCUIPanelBodyElement extends KCUIElement {
    static override styles = [
        ...KCUIElement.styles,
        css`
            :host {
                box-sizing: border-box;
                width: 100%;
                min-width: 0;
                min-height: 0;
                overflow-y: auto;
                overflow-x: hidden;
                flex: 1 1 auto;
                padding: 0.45em 0.6em;
                font-weight: 300;
                font-size: 1em;
            }

            :host([padded]) {
                padding: 0.65em 0.75em;
            }
        `,
    ];

    override render() {
        return html`<slot></slot>`;
    }
}

window.customElements.define("kc-ui-panel-body", KCUIPanelBodyElement);

export class KCUIPanelLabelElement extends KCUIElement {
    static override styles = [
        ...KCUIElement.styles,
        css`
            :host {
                width: 100%;
                display: flex;
                flex-wrap: nowrap;
                padding: 0.35em 0.5em;
                font-size: 0.85em;
                font-weight: 600;
                line-height: 1.25;
                background: var(--panel-subtitle-bg);
                color: var(--panel-subtitle-fg);
            }
        `,
    ];

    override render() {
        return html`<slot></slot>`;
    }
}

window.customElements.define("kc-ui-panel-label", KCUIPanelLabelElement);
