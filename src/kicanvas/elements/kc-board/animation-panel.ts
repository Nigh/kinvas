/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

/**
 * Panel for the layout process animation: play/pause, a scrubbable
 * timeline, and SVG/video export. Layer visibility is taken from the
 * regular Layers panel, so the export matches what's on screen.
 */

import { initiate_download } from "../../../base/dom/download";
import { delegate } from "../../../base/events";
import { BBox, Vec2 } from "../../../base/math";
import { html } from "../../../base/web-components";
import { KiCanvasLoadEvent } from "../../../viewers/base/events";
import { KCUIElement, type KCUIRangeElement } from "../../../kc-ui";
import type { LayoutAnimationController } from "../../../viewers/board/animation";
import {
    export_board_svg,
    export_layout_animation_svg,
} from "../../../viewers/board/export-svg";
import type { BoardViewer } from "../../../viewers/board/viewer";

export class KCBoardAnimationPanelElement extends KCUIElement {
    viewer: BoardViewer;
    animation: LayoutAnimationController | null = null;
    #export_bbox: BBox | null = null;
    #cancel_area_selection: (() => void) | null = null;
    #activity_observer: MutationObserver | null = null;

    override connectedCallback() {
        (async () => {
            this.viewer = await this.requestLazyContext("viewer");
            await this.viewer.loaded;
            super.connectedCallback();
            this.setup_events();
            const activity = this.closest("kc-ui-activity");
            if (activity) {
                this.#activity_observer = new MutationObserver(() => {
                    if (!activity.hasAttribute("active"))
                        this.reset_animation();
                });
                this.#activity_observer.observe(activity, {
                    attributes: true,
                    attributeFilter: ["active"],
                });
            }
        })();
    }
    override disconnectedCallback() {
        this.#cancel_area_selection?.();
        this.#activity_observer?.disconnect();
        this.reset_animation();
        super.disconnectedCallback();
    }

    private setup_events() {
        delegate(this.renderRoot, "kc-ui-button", "click", (e) => {
            const name = (e.target as HTMLElement).getAttribute("name");
            switch (name) {
                case "play":
                    this.toggle_animation();
                    break;
                case "export-svg":
                    this.export_svg();
                    break;
                case "export-static":
                    void this.export_static();
                    break;
                case "export-video":
                    void this.export_video();
                    break;
                case "select-area":
                    this.select_export_area();
                    break;
                case "clear-area":
                    this.#export_bbox = null;
                    this.viewer.set_export_bbox(null);
                    this.update_area_status();
                    break;
            }
        });

        this.viewer.addEventListener(KiCanvasLoadEvent.type, () => {
            this.reset_animation();
            this.#export_bbox = null;
            this.viewer.set_export_bbox(null);
            this.update_area_status();
        });

        delegate(this.renderRoot, "kc-ui-range", "kc-ui-range:input", (e) => {
            const control = e.target as KCUIRangeElement;
            if (control.name == "time") {
                const progress = control.valueAsNumber;
                this.ensure_animation()?.pause();
                this.animation?.seek_progress(progress);
            }
        });
    }

    private toggle_animation() {
        if (this.animation) {
            this.animation.toggle();
        } else {
            const animation = this.ensure_animation();
            if (!animation) {
                return;
            }
            animation.play();
        }
        this.update_ui();
    }

    private ensure_animation() {
        if (!this.animation) {
            this.animation = this.viewer.enable_layout_animation();
            if (this.animation) {
                this.animation.on_change = () => this.update_ui();
            }
        }
        return this.animation;
    }

    private reset_animation() {
        if (!this.animation) return;
        this.animation.on_change = null;
        this.viewer.disable_layout_animation();
        this.animation = null;
        this.update_ui();
    }

    private update_ui() {
        const play_button = this.renderRoot.querySelector<HTMLElement>(
            'kc-ui-button[name="play"]',
        );
        if (play_button) {
            // Note: we update the label text, not the `icon` attribute -
            // mutating icon after render hits a bug in kc-ui-button.
            const playing = this.animation?.playing ?? false;
            play_button.textContent = playing ? "Pause" : "Play";
            play_button.setAttribute(
                "title",
                playing ? "Pause" : "Play layout animation",
            );
        }

        const time_range = this.renderRoot.querySelector<KCUIRangeElement>(
            'kc-ui-range[name="time"]',
        );
        if (time_range) {
            time_range.value = (this.animation?.progress ?? 0).toString();
        }

        const status = this.renderRoot.querySelector(".status");
        if (status) {
            if (this.animation) {
                const t = this.animation.time;
                const d = this.animation.duration;
                const phase = this.animation.timeline.phases.find(
                    (p) => t >= p.start && t < p.end,
                );
                status.textContent =
                    `${t.toFixed(1)}s / ${d.toFixed(1)}s` +
                    (phase ? ` - ${phase.name}` : "");
            } else {
                status.textContent = "Not animating";
            }
        }
    }

    private export_svg() {
        const svg = export_layout_animation_svg(
            this.viewer.board,
            this.viewer.layers,
            this.viewer.theme,
            {
                bbox: this.export_bbox(),
                sketch_modes: this.viewer.sketch_modes,
            },
        );
        const file = new File([svg], "layout-animation.svg", {
            type: "image/svg+xml",
        });
        initiate_download(file);
    }

    private select_export_area() {
        this.#cancel_area_selection?.();

        const canvas = this.viewer.canvas;
        const old_cursor = canvas.style.cursor;
        let start: Vec2 | null = null;

        const point_for = (event: PointerEvent) => {
            const rect = canvas.getBoundingClientRect();
            return this.viewer.viewport.camera.screen_to_world(
                new Vec2(event.clientX - rect.left, event.clientY - rect.top),
            );
        };
        const stop_event = (event: PointerEvent) => {
            event.preventDefault();
            event.stopImmediatePropagation();
        };
        const on_down = (event: PointerEvent) => {
            stop_event(event);
            start = point_for(event);
            canvas.setPointerCapture(event.pointerId);
        };
        const on_move = (event: PointerEvent) => {
            if (!start) {
                return;
            }
            stop_event(event);
            this.viewer.set_export_bbox(
                BBox.from_points([start, point_for(event)]),
            );
        };
        const cleanup = () => {
            canvas.style.cursor = old_cursor;
            canvas.removeEventListener("pointerdown", on_down, true);
            canvas.removeEventListener("pointermove", on_move, true);
            canvas.removeEventListener("pointerup", on_up, true);
            canvas.removeEventListener("pointercancel", on_cancel, true);
            window.removeEventListener("keydown", on_key);
            this.#cancel_area_selection = null;
        };
        const on_up = (event: PointerEvent) => {
            if (!start) {
                return;
            }
            stop_event(event);
            const bbox = BBox.from_points([start, point_for(event)]);
            if (bbox.valid) {
                this.#export_bbox = bbox;
            }
            this.viewer.set_export_bbox(this.#export_bbox);
            cleanup();
            this.update_area_status();
        };
        const on_cancel = (event: PointerEvent) => {
            if (!start) {
                return;
            }
            stop_event(event);
            this.viewer.set_export_bbox(this.#export_bbox);
            cleanup();
        };
        const on_key = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                this.viewer.set_export_bbox(this.#export_bbox);
                cleanup();
            }
        };

        canvas.style.cursor = "crosshair";
        canvas.addEventListener("pointerdown", on_down, true);
        canvas.addEventListener("pointermove", on_move, true);
        canvas.addEventListener("pointerup", on_up, true);
        canvas.addEventListener("pointercancel", on_cancel, true);
        window.addEventListener("keydown", on_key);
        this.#cancel_area_selection = cleanup;
    }

    private update_area_status() {
        const status = this.renderRoot.querySelector(".area-status");
        if (!status) {
            return;
        }
        status.textContent = this.#export_bbox
            ? `${this.#export_bbox.w.toFixed(1)} × ${this.#export_bbox.h.toFixed(1)} mm`
            : "Full board";
    }

    private export_bbox() {
        if (this.#export_bbox) {
            return this.#export_bbox.copy();
        }
        let bbox = this.viewer.board.edge_cuts_bbox;
        if (!bbox.valid) {
            bbox = this.viewer.layers.bbox;
        }
        return bbox.grow(Math.max(bbox.w, bbox.h) * 0.05);
    }

    private async export_static() {
        const format =
            this.renderRoot.querySelector<HTMLSelectElement>(
                'select[name="static-format"]',
            )?.value ?? "svg";
        const bbox = this.export_bbox();
        const svg = export_board_svg(
            this.viewer.board,
            this.viewer.layers,
            this.viewer.theme,
            {
                bbox,
                sketch_modes: this.viewer.sketch_modes,
                transparent_background: format !== "jpg",
            },
            this.viewer.layout_animation?.timeline,
        );

        if (format === "svg") {
            initiate_download(
                new File([svg], "board.svg", { type: "image/svg+xml" }),
            );
            return;
        }

        const mime_type = format === "jpg" ? "image/jpeg" : `image/${format}`;
        const blob = new Blob([svg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        try {
            const image = new Image();
            await new Promise<void>((resolve, reject) => {
                image.onload = () => resolve();
                image.onerror = () => reject(new Error("Unable to render SVG"));
                image.src = url;
            });

            const canvas = document.createElement("canvas");
            const scale = 2048 / Math.max(bbox.w, bbox.h);
            canvas.width = Math.max(1, Math.round(bbox.w * scale));
            canvas.height = Math.max(1, Math.round(bbox.h * scale));
            const context = canvas.getContext("2d");
            if (!context) {
                throw new Error("Unable to create export canvas");
            }
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            const raster = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(
                    (result) =>
                        result
                            ? resolve(result)
                            : reject(new Error("Unable to encode image")),
                    mime_type,
                    0.92,
                );
            });
            initiate_download(
                new File([raster], `board.${format}`, { type: mime_type }),
            );
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    private async export_video() {
        const animation = this.viewer.layout_animation;
        if (!animation) {
            return;
        }
        const file = await animation.record_video();
        if (file) {
            initiate_download(file);
        }
    }

    override render() {
        return html`
            <kc-ui-panel>
                <kc-ui-panel-title title="Layout animation"></kc-ui-panel-title>
                <kc-ui-panel-body padded>
                    <kc-ui-control-list>
                        <kc-ui-control>
                            <label>Playback</label>
                            <kc-ui-button
                                name="play"
                                title="Play layout animation"
                                >Play</kc-ui-button
                            >
                        </kc-ui-control>
                        <kc-ui-control>
                            <label>Time</label>
                            <kc-ui-range
                                name="time"
                                min="0"
                                max="1"
                                step="0.001"
                                value="0"></kc-ui-range>
                        </kc-ui-control>
                        <kc-ui-control>
                            <label>Status</label>
                            <span class="status">Not animating</span>
                        </kc-ui-control>
                    </kc-ui-control-list>
                </kc-ui-panel-body>
                <kc-ui-panel-title title="Export area"></kc-ui-panel-title>
                <kc-ui-panel-body padded>
                    <kc-ui-control-list>
                        <kc-ui-control>
                            <label>Area</label>
                            <span class="area-status">Full board</span>
                            <kc-ui-button
                                name="select-area"
                                title="Drag on the board to select an export area"
                                >Select</kc-ui-button
                            >
                            <kc-ui-button
                                name="clear-area"
                                title="Export the full board"
                                >Full board</kc-ui-button
                            >
                        </kc-ui-control>
                    </kc-ui-control-list>
                </kc-ui-panel-body>
                <kc-ui-panel-title title="Export"></kc-ui-panel-title>
                <kc-ui-panel-body padded>
                    <kc-ui-control-list>
                        <kc-ui-control>
                            <label>Static image</label>
                            <select name="static-format" aria-label="Format">
                                <option value="svg">SVG</option>
                                <option value="png">PNG</option>
                                <option value="webp">WebP</option>
                                <option value="jpg">JPEG</option>
                            </select>
                            <kc-ui-button
                                name="export-static"
                                icon="image"
                                title="Export current visibility and opacity"></kc-ui-button>
                        </kc-ui-control>
                        <kc-ui-control>
                            <label>Animated SVG</label>
                            <kc-ui-button
                                name="export-svg"
                                icon="image"
                                title="Export layout animation as SVG"></kc-ui-button>
                        </kc-ui-control>
                        <kc-ui-control>
                            <label>Video</label>
                            <kc-ui-button
                                name="export-video"
                                icon="movie"
                                title="Record layout animation as video"></kc-ui-button>
                        </kc-ui-control>
                    </kc-ui-control-list>
                </kc-ui-panel-body>
            </kc-ui-panel>
        `;
    }
}

window.customElements.define(
    "kc-board-animation-panel",
    KCBoardAnimationPanelElement,
);
