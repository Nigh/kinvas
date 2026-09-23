/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { attribute, css, html, query } from "../../../base/web-components";
import {
    KCUIElement,
    KCUIMenuElement,
    type KCUIMenuItemElement,
    type KCUIPanelBodyElement,
} from "../../../kc-ui";
import { Color } from "../../../base/color";
import {
    LayerSet,
    type LayerPreset,
    layer_theme_key,
    set_theme_color,
    theme_color_for,
} from "../../../viewers/board/layers";
import { BoardViewer } from "../../../viewers/board/viewer";
import { Preferences } from "../../preferences";

const prefs = Preferences.INSTANCE;

export class KCBoardLayersPanelElement extends KCUIElement {
    static override styles = [
        ...KCUIElement.styles,
        css`
            :host {
                display: block;
                height: 100%;
                overflow-y: auto;
                overflow-x: hidden;
                user-select: none;
            }

            kc-ui-panel-title button {
                all: unset;
                flex-shrink: 0;
                margin-left: 1em;
                color: white;
                border: 0 none;
                background: transparent;
                padding: 0 0.25em 0 0.25em;
                margin-right: -0.25em;
                display: flex;
                align-items: center;
            }
        `,
    ];

    viewer: BoardViewer;

    @query("kc-ui-panel-body", true)
    private panel_body!: KCUIPanelBodyElement;

    private get items(): KCBoardLayerControlElement[] {
        return Array.from(
            this.panel_body.querySelectorAll("kc-board-layer-control") ?? [],
        );
    }

    @query("#presets", true)
    private presets_menu!: KCUIMenuElement;

    #color_throttle = {
        last: 0,
        timer: 0,
        pending: null as (() => void) | null,
    };

    private apply_layer_color(detail: { layer_name: string; color: string }) {
        const key = layer_theme_key(detail.layer_name);
        const existing = theme_color_for(prefs.theme.board, key);
        set_theme_color(
            prefs.theme.board,
            key,
            Color.from_css(detail.color).with_alpha(existing?.a ?? 1),
        );
        prefs.save();
    }

    /** Run fn at most once per second, trailing the most recent call. */
    private throttle_color(fn: () => void) {
        const interval = 1000;
        const now = performance.now();
        const elapsed = now - this.#color_throttle.last;

        if (elapsed >= interval) {
            this.#color_throttle.last = now;
            this.#color_throttle.pending = null;
            fn();
            return;
        }

        this.#color_throttle.pending = fn;
        if (!this.#color_throttle.timer) {
            this.#color_throttle.timer = window.setTimeout(() => {
                this.#color_throttle.timer = 0;
                this.#color_throttle.last = performance.now();
                const pending = this.#color_throttle.pending;
                this.#color_throttle.pending = null;
                pending?.();
            }, interval - elapsed);
        }
    }

    override connectedCallback() {
        (async () => {
            this.viewer = await this.requestLazyContext("viewer");
            await this.viewer.loaded;
            super.connectedCallback();
        })();
    }

    override initialContentCallback() {
        // Highlight layer when its control list item is clicked
        this.panel_body.addEventListener(
            KCBoardLayerControlElement.select_event,
            (e: Event) => {
                const item = (e as CustomEvent)
                    .detail as KCBoardLayerControlElement;

                for (const n of this.items) {
                    n.layer_highlighted = false;
                }

                const layer = this.viewer.layers.by_name(item.layer_name!)!;

                // if this layer is already highlighted, de-highlight it.
                if (layer.highlighted) {
                    this.viewer.layers.highlight(null);
                }
                // otherwise mark it as highlighted.
                else {
                    this.viewer.layers.highlight(layer);
                    item.layer_highlighted = true;
                }

                this.viewer.draw();
            },
        );

        // Toggle layer visibility when its item's visibility control is clicked
        this.panel_body.addEventListener(
            KCBoardLayerControlElement.visibility_event,
            (e) => {
                const item = (e as CustomEvent)
                    .detail as KCBoardLayerControlElement;

                const layer = this.viewer.layers.by_name(item.layer_name!)!;

                // Toggle layer visibility
                layer.visible = !layer.visible;
                item.layer_visible = layer.visible;

                // Deselect any presets, as we're no longer showing preset layers.
                this.presets_menu.deselect();

                this.viewer.draw();
            },
        );

        // Recolor a layer when its color picker changes. Colors are baked
        // into the geometry, so applying a color triggers a full repaint via
        // the preferences change event. Dragging on the palette fires this at
        // a very high rate, so throttle the actual apply to 1 Hz (trailing
        // the latest value so the final color always lands).
        this.panel_body.addEventListener(
            KCBoardLayerControlElement.color_event,
            (e) => {
                const detail = (e as CustomEvent).detail as {
                    layer_name: string;
                    color: string;
                };
                this.throttle_color(() => this.apply_layer_color(detail));
            },
        );

        // Show/hide all layers
        this.renderRoot
            .querySelector("button")
            ?.addEventListener("click", (e) => {
                e.stopPropagation();

                const ui_layers = this.viewer.layers.in_ui_order();

                if (this.items.some((n) => n.layer_visible)) {
                    // hide all layers.
                    for (const l of ui_layers) {
                        l.visible = false;
                    }
                } else {
                    // show all layers
                    for (const l of ui_layers) {
                        l.visible = true;
                    }
                }

                this.viewer.draw();

                // Deselect any presets, as we're no longer showing preset layers.
                this.presets_menu.deselect();

                this.update_item_states();
            });

        // Presets
        this.presets_menu.addEventListener("kc-ui-menu:select", (e) => {
            const item = (e as CustomEvent).detail as KCUIMenuItemElement;
            (this.viewer.layers as LayerSet).apply_preset(
                item.name as LayerPreset,
            );

            this.viewer.draw();
            this.update_item_states();
        });
    }

    private update_item_states() {
        for (const item of this.items) {
            const layer = this.viewer.layers.by_name(item.layer_name!);
            item.layer_visible = layer?.visible ?? false;
            item.layer_highlighted = layer?.highlighted ?? false;
        }
    }

    override render() {
        const layers = this.viewer.layers as LayerSet;
        const items: ReturnType<typeof html>[] = [];

        for (const layer of layers.in_ui_order()) {
            const visible = layer.visible ? "" : undefined;
            const css_color = layer.color.to_css();
            items.push(
                html`<kc-board-layer-control
                    layer-name="${layer.name}"
                    layer-color="${css_color}"
                    layer-visible="${visible}"></kc-board-layer-control>`,
            );
        }

        return html`
            <kc-ui-panel>
                <kc-ui-panel-title title="Layers">
                    <button slot="actions" type="button">
                        <kc-ui-icon>visibility</kc-ui-icon>
                    </button>
                </kc-ui-panel-title>
                <kc-ui-panel-body>
                    ${items}
                    <kc-ui-panel-label>Presets</kc-ui-panel-label>
                    <kc-ui-menu id="presets" class="outline">
                        <kc-ui-menu-item name="all">All</kc-ui-menu-item>
                        <kc-ui-menu-item name="front">Front</kc-ui-menu-item>
                        <kc-ui-menu-item name="back">Back</kc-ui-menu-item>
                        <kc-ui-menu-item name="copper">Copper</kc-ui-menu-item>
                        <kc-ui-menu-item name="outer-copper">
                            Outer copper
                        </kc-ui-menu-item>
                        <kc-ui-menu-item name="inner-copper">
                            Inner copper
                        </kc-ui-menu-item>
                        <kc-ui-menu-item name="drawings">
                            Drawings
                        </kc-ui-menu-item>
                        <kc-ui-menu-item name="physical">
                            Physical
                        </kc-ui-menu-item>
                    </kc-ui-menu>
                </kc-ui-panel-body>
            </kc-ui-panel>
        `;
    }
}

class KCBoardLayerControlElement extends KCUIElement {
    static override styles = [
        ...KCUIElement.styles,
        css`
            :host {
                box-sizing: border-box;
                padding: 0.1em 0.4em;
                color: var(--list-item-fg);
                background: var(--list-item-bg);
                text-align: left;
                display: flex;
                width: 100%;
                align-items: center;
            }

            button {
                all: unset;
                box-sizing: border-box;
                cursor: pointer;
                display: flex;
                align-items: center;
                border-radius: 2px;
            }

            button:focus-visible {
                outline: var(--input-focus-outline);
            }

            .color {
                flex-shrink: 0;
                display: block;
                width: 1em;
                height: 1em;
                margin-right: 0.5em;
                padding: 0;
                border: none;
                background: none;
                cursor: pointer;
            }

            .color::-webkit-color-swatch {
                border: 1px solid var(--fg);
                border-radius: 2px;
            }

            .color::-webkit-color-swatch-wrapper {
                padding: 0;
            }

            .focus {
                flex: 1 1 auto;
                min-width: 0;
            }

            .name {
                display: block;
                width: 100%;
                padding: 0.1em 0.35em;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                transition:
                    color var(--transition-time-short) ease,
                    background-color var(--transition-time-short) ease;
            }

            .focus:hover .name {
                color: var(--list-item-hover-fg);
                background: var(--list-item-hover-bg);
            }

            :host([layer-highlighted]) .name {
                color: var(--list-item-active-fg);
                background: var(--list-item-active-bg);
            }

            .visibility {
                flex: 0 0 1.8em;
                height: 1.8em;
                justify-content: center;
                margin-left: 0.25em;
                color: var(--list-item-fg);
                transition:
                    color var(--transition-time-short) ease,
                    background-color var(--transition-time-short) ease;
            }

            :host(:not([layer-visible])) .visibility {
                color: var(--list-item-disabled-fg);
            }

            .visibility:hover {
                color: var(--list-item-hover-fg);
                background: var(--list-item-hover-bg);
            }

            .focus:active .name,
            .visibility:active {
                transform: translateY(1px);
            }

            :host kc-ui-icon.for-visible,
            :host([layer-visible]) kc-ui-icon.for-hidden {
                display: none;
            }

            :host kc-ui-icon.for-hidden,
            :host([layer-visible]) kc-ui-icon.for-visible {
                display: revert;
            }
        `,
    ];

    static select_event = "kicanvas:layer-control:select";
    static visibility_event = "kicanvas:layer-control:visibility";
    static color_event = "kicanvas:layer-control:color";

    override initialContentCallback() {
        super.initialContentCallback();

        this.renderRoot.addEventListener("click", (e) => {
            e.stopPropagation();

            const target = e.target as HTMLElement;

            // The color input handles its own interaction.
            if (target.closest("input[type=color]")) {
                return;
            }

            const visibility = target.closest("button.visibility");
            const focus = target.closest("button.focus");
            if (!visibility && !focus) {
                return;
            }

            const event_name = visibility
                ? KCBoardLayerControlElement.visibility_event
                : KCBoardLayerControlElement.select_event;

            this.dispatchEvent(
                new CustomEvent(event_name, {
                    detail: this,
                    bubbles: true,
                }),
            );
        });

        this.renderRoot.addEventListener("input", (e) => {
            const input = e.target as HTMLInputElement;
            if (input.type === "color") {
                this.dispatchEvent(
                    new CustomEvent(KCBoardLayerControlElement.color_event, {
                        detail: {
                            layer_name: this.layer_name,
                            color: input.value,
                        },
                        bubbles: true,
                    }),
                );
            }
        });
    }

    @attribute({ type: String })
    public layer_name: string;

    @attribute({ type: String })
    public layer_color: string;

    @attribute({ type: Boolean })
    public layer_highlighted: boolean;

    @attribute({ type: Boolean })
    public layer_visible: boolean;

    override render() {
        return html`<input
                class="color"
                type="color"
                aria-label="Color for ${this.layer_name}"
                value="${css_to_hex(this.layer_color)}" />
            <button
                class="focus"
                type="button"
                aria-label="Focus ${this.layer_name}"
                aria-pressed="${this.layer_highlighted}">
                <span class="name">${this.layer_name}</span>
            </button>
            <button
                class="visibility"
                type="button"
                aria-label="Toggle ${this.layer_name} visibility"
                aria-pressed="${this.layer_visible}">
                <kc-ui-icon class="for-visible">visibility</kc-ui-icon>
                <kc-ui-icon class="for-hidden">visibility_off</kc-ui-icon>
            </button>`;
    }
}

function css_to_hex(css: string): string {
    const c = Color.from_css(css);
    const h = (v: number) =>
        Math.round(v * 255)
            .toString(16)
            .padStart(2, "0");
    return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

window.customElements.define(
    "kc-board-layer-control",
    KCBoardLayerControlElement,
);

window.customElements.define(
    "kc-board-layers-panel",
    KCBoardLayersPanelElement,
);
