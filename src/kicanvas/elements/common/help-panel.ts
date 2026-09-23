/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { css, html } from "../../../base/web-components";
import { KCUIElement } from "../../../kc-ui";

export class KCHelpPanel extends KCUIElement {
    static override styles = [
        ...KCUIElement.styles,
        css`
            p {
                margin: 0;
                padding: 0.5em;
            }

            a {
                color: var(--button-bg);
            }

            a:hover {
                color: var(--button-hover-bg);
            }
        `,
    ];

    override render() {
        return html`
            <kc-ui-panel>
                <kc-ui-panel-title title="Help"></kc-ui-panel-title>
                <kc-ui-panel-body>
                    <p>
                        You're using
                        <a href="https://nigh.github.io/kinvas/">kinvas</a>, an
                        interactive, browser-based viewer for KiCad schematics
                        and boards.
                    </p>
                    <p>
                        kinvas is in <strong>alpha</strong>, so please
                        <a
                            href="https://github.com/Nigh/kinvas/issues/new/choose"
                            target="_blank"
                            >file an issue on GitHub</a
                        >
                        if you run into any bugs.
                    </p>
                    <p>
                        kinvas is a fork of
                        <a
                            href="https://github.com/theacodes/kicanvas"
                            target="_blank"
                            >KiCanvas</a
                        >.
                    </p></kc-ui-panel-body
                >
            </kc-ui-panel>
        `;
    }
}

window.customElements.define("kc-help-panel", KCHelpPanel);
