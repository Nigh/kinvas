/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { delegate } from "../../../base/events";
import { css, html } from "../../../base/web-components";
import { KCUIElement, type KCUIRangeElement } from "../../../kc-ui";
import type {
    BoardObjectType,
    BoardVisibleType,
} from "../../../viewers/board/painter";
import { BoardViewer } from "../../../viewers/board/viewer";

export class KCBoardObjectsPanelElement extends KCUIElement {
    viewer: BoardViewer;
    static override styles = [
        ...KCUIElement.styles,
        css`
            .object-row,
            .switches,
            .switch-control {
                display: flex;
                align-items: center;
            }

            .object-row {
                flex-wrap: wrap;
                justify-content: space-between;
                gap: 0.5em;
                min-width: 0;
            }

            .switches {
                flex: 0 0 auto;
                flex-wrap: wrap;
                justify-content: flex-end;
                gap: 0.65em;
                margin-left: auto;
            }

            .switch-control {
                width: auto;
                gap: 0.3em;
                margin: 0;
                cursor: pointer;
                font-size: 0.85em;
            }

            input[type="checkbox"][role="switch"] {
                appearance: none;
                box-sizing: border-box;
                position: relative;
                display: inline-block;
                flex: 0 0 auto;
                width: 2em;
                height: 1.15em;
                margin: 0;
                padding: 0;
                border: 1px solid var(--color-base-300);
                border-radius: 999px;
                background: var(--input-disabled-bg);
                cursor: pointer;
                transition: background var(--transition-time-short) ease;
            }

            input[type="checkbox"][role="switch"]::before {
                content: "";
                position: absolute;
                top: 0.13em;
                left: 0.13em;
                width: 0.75em;
                height: 0.75em;
                border-radius: 50%;
                background: var(--input-fg);
                transition: transform var(--transition-time-short) ease;
            }

            input[type="checkbox"][role="switch"]:checked {
                background: var(--input-accent);
            }

            input[type="checkbox"][role="switch"]:checked::before {
                transform: translateX(0.82em);
                background: var(--color-primary-content);
            }

            input[type="checkbox"][role="switch"]:focus-visible {
                outline: var(--input-focus-outline);
                outline-offset: 2px;
            }

            input[type="checkbox"][role="switch"]:disabled {
                cursor: not-allowed;
                opacity: 0.6;
            }

            @media (max-width: 360px) {
                .switches {
                    gap: 0.35em;
                }
            }
        `,
    ];

    override connectedCallback() {
        (async () => {
            this.viewer = await this.requestLazyContext("viewer");
            await this.viewer.loaded;
            super.connectedCallback();
            this.setup_events();
        })();
    }

    private setup_events() {
        delegate(this.renderRoot, "kc-ui-range", "kc-ui-range:input", (e) => {
            const control = e.target as KCUIRangeElement;
            const opacity = control.valueAsNumber;
            switch (control.name) {
                case "tracks":
                    this.viewer.track_opacity = opacity;
                    break;
                case "vias":
                    this.viewer.via_opacity = opacity;
                    break;
                case "pads":
                    this.viewer.pad_opacity = opacity;
                    break;
                case "holes":
                    this.viewer.pad_hole_opacity = opacity;
                    break;
                case "zones":
                    this.viewer.zone_opacity = opacity;
                    break;
                case "grid":
                    this.viewer.grid_opacity = opacity;
                    break;
                case "page":
                    this.viewer.page_opacity = opacity;
                    break;
            }
        });

        delegate(this.renderRoot, "input[data-toggle]", "change", (e) => {
            const control = e.target as HTMLInputElement;
            if (control.dataset["toggle"] === "sketch") {
                this.viewer.set_sketch_mode(
                    control.name as BoardObjectType,
                    control.checked,
                );
            } else {
                this.viewer.set_visible(
                    control.name as BoardVisibleType,
                    control.checked,
                );
            }
        });
    }

    private render_switch(
        object: BoardVisibleType,
        kind: "visible" | "sketch",
        checked: boolean,
    ) {
        const text = kind === "visible" ? "Visible" : "Sketch";
        return html`<label class="switch-control">
            <input
                type="checkbox"
                role="switch"
                data-toggle="${kind}"
                name="${object}"
                aria-label="${text} ${object}"
                checked="${checked}" />
            ${text}
        </label>`;
    }

    override render() {
        const objects: {
            name: BoardObjectType;
            label: string;
            opacity: string;
        }[] = [
            { name: "tracks", label: "Tracks", opacity: "tracks" },
            { name: "vias", label: "Vias", opacity: "vias" },
            { name: "pads", label: "Pads", opacity: "pads" },
            { name: "holes", label: "Through holes", opacity: "holes" },
            { name: "zones", label: "Zones", opacity: "zones" },
        ];
        const context = [
            { name: "grid" as const, label: "Grid" },
            { name: "page" as const, label: "Page" },
        ];

        return html`
            <kc-ui-panel>
                <kc-ui-panel-title title="Objects"></kc-ui-panel-title>
                <kc-ui-panel-body padded>
                    <kc-ui-control-list>
                        ${objects.map(
                            ({ name, label, opacity }) => html`
                                <kc-ui-control>
                                    <div class="object-row">
                                        <span>${label}</span>
                                        <span class="switches">
                                            ${this.render_switch(
                                                name,
                                                "visible",
                                                this.viewer.visible_for(name),
                                            )}
                                            ${this.render_switch(
                                                name,
                                                "sketch",
                                                this.viewer.sketch_mode_for(
                                                    name,
                                                ),
                                            )}
                                        </span>
                                    </div>
                                    <kc-ui-range
                                        min="0"
                                        max="1.0"
                                        step="0.01"
                                        value="1"
                                        name="${opacity}"></kc-ui-range>
                                </kc-ui-control>
                            `,
                        )}
                        ${context.map(
                            ({ name, label }) => html`
                                <kc-ui-control>
                                    <div class="object-row">
                                        <span>${label}</span>
                                        <span class="switches">
                                            ${this.render_switch(
                                                name,
                                                "visible",
                                                this.viewer.visible_for(name),
                                            )}
                                        </span>
                                    </div>
                                    <kc-ui-range
                                        min="0"
                                        max="1.0"
                                        step="0.01"
                                        value="1"
                                        name="${name}"></kc-ui-range>
                                </kc-ui-control>
                            `,
                        )}
                    </kc-ui-control-list>
                </kc-ui-panel-body>
            </kc-ui-panel>
        `;
    }
}

window.customElements.define(
    "kc-board-objects-panel",
    KCBoardObjectsPanelElement,
);
