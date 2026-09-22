/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { delegate } from "../../../base/events";
import { css, html } from "../../../base/web-components";
import { KCUIElement, type KCUIRangeElement } from "../../../kc-ui";
import type { BoardObjectType } from "../../../viewers/board/painter";
import { BoardViewer } from "../../../viewers/board/viewer";

export class KCBoardObjectsPanelElement extends KCUIElement {
    viewer: BoardViewer;
    static override styles = [
        ...KCUIElement.styles,
        css`
            .object-label,
            .sketch-toggle {
                display: flex;
                align-items: center;
            }

            .object-label {
                justify-content: space-between;
                gap: 0.75em;
            }

            .sketch-toggle {
                gap: 0.3em;
                color: var(--list-item-disabled-fg);
                font-size: 0.9em;
            }

            .sketch-toggle input {
                margin: 0;
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

        delegate(this.renderRoot, "input[data-sketch]", "change", (e) => {
            const control = e.target as HTMLInputElement;
            this.viewer.set_sketch_mode(
                control.name as BoardObjectType,
                control.checked,
            );
        });
    }

    override render() {
        return html`
            <kc-ui-panel>
                <kc-ui-panel-title title="Objects"></kc-ui-panel-title>
                <kc-ui-panel-body padded>
                    <kc-ui-control-list>
                        <kc-ui-control>
                            <label class="object-label">
                                <span>Tracks</span>
                                <span class="sketch-toggle">
                                    <input
                                        type="checkbox"
                                        data-sketch
                                        name="tracks"
                                        aria-label="Sketch tracks"
                                        checked="${this.viewer.sketch_mode_for(
                                            "tracks",
                                        )}" />
                                    Sketch
                                </span>
                            </label>
                            <kc-ui-range
                                min="0"
                                max="1.0"
                                step="0.01"
                                value="1"
                                name="tracks"></kc-ui-range>
                        </kc-ui-control>
                        <kc-ui-control>
                            <label class="object-label">
                                <span>Vias</span>
                                <span class="sketch-toggle">
                                    <input
                                        type="checkbox"
                                        data-sketch
                                        name="vias"
                                        aria-label="Sketch vias"
                                        checked="${this.viewer.sketch_mode_for(
                                            "vias",
                                        )}" />
                                    Sketch
                                </span>
                            </label>
                            <kc-ui-range
                                min="0"
                                max="1.0"
                                step="0.01"
                                value="1"
                                name="vias"></kc-ui-range>
                        </kc-ui-control>
                        <kc-ui-control>
                            <label class="object-label">
                                <span>Pads</span>
                                <span class="sketch-toggle">
                                    <input
                                        type="checkbox"
                                        data-sketch
                                        name="pads"
                                        aria-label="Sketch pads"
                                        checked="${this.viewer.sketch_mode_for(
                                            "pads",
                                        )}" />
                                    Sketch
                                </span>
                            </label>
                            <kc-ui-range
                                min="0"
                                max="1.0"
                                step="0.01"
                                value="1"
                                name="pads"></kc-ui-range>
                        </kc-ui-control>
                        <kc-ui-control>
                            <label class="object-label">
                                <span>Through holes</span>
                                <span class="sketch-toggle">
                                    <input
                                        type="checkbox"
                                        data-sketch
                                        name="holes"
                                        aria-label="Sketch through holes"
                                        checked="${this.viewer.sketch_mode_for(
                                            "holes",
                                        )}" />
                                    Sketch
                                </span>
                            </label>
                            <kc-ui-range
                                min="0"
                                max="1.0"
                                step="0.01"
                                value="1"
                                name="holes"></kc-ui-range>
                        </kc-ui-control>
                        <kc-ui-control>
                            <label class="object-label">
                                <span>Zones</span>
                                <span class="sketch-toggle">
                                    <input
                                        type="checkbox"
                                        data-sketch
                                        name="zones"
                                        aria-label="Sketch zones"
                                        checked="${this.viewer.sketch_mode_for(
                                            "zones",
                                        )}" />
                                    Sketch
                                </span>
                            </label>
                            <kc-ui-range
                                min="0"
                                max="1.0"
                                step="0.01"
                                value="1"
                                name="zones"></kc-ui-range>
                        </kc-ui-control>
                        <kc-ui-control>
                            <label>Grid</label>
                            <kc-ui-range
                                min="0"
                                max="1.0"
                                step="0.01"
                                value="1"
                                name="grid"></kc-ui-range>
                        </kc-ui-control>
                        <kc-ui-control>
                            <label>Page</label>
                            <kc-ui-range
                                min="0"
                                max="1.0"
                                step="0.01"
                                value="1"
                                name="page"></kc-ui-range>
                        </kc-ui-control>
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
