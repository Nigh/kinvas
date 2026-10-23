/*
    Copyright (c) 2022 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { html } from "../../../base/web-components";
import { BoardViewer } from "../../../viewers/board/viewer";
import { KiCanvasSelectEvent } from "../../../viewers/base/events";
import { KCViewerElement } from "../common/viewer";
import type { KCContextMenuElement } from "../common/context-menu";

import "../common/context-menu";

export class KCBoardViewerElement extends KCViewerElement<BoardViewer> {
    #contextMenu: KCContextMenuElement | null = null;
    #netTooltip: HTMLDivElement;
    #pointer: { x: number; y: number } | null = null;

    private update_net_tooltip() {
        const number = this.viewer.selected_net;
        const name = this.viewer.board?.nets.find(
            (net) => net.number === number,
        )?.name;
        this.#netTooltip.textContent = name ?? "";
        this.#netTooltip.hidden = !name || !this.#pointer;
        if (this.#netTooltip.hidden || !this.#pointer) return;
        const x = Math.max(
            0,
            Math.min(
                this.#pointer.x + 16,
                this.clientWidth - this.#netTooltip.offsetWidth,
            ),
        );
        const y = Math.max(
            0,
            Math.min(
                this.#pointer.y + 20,
                this.clientHeight - this.#netTooltip.offsetHeight,
            ),
        );
        this.#netTooltip.style.left = `${x}px`;
        this.#netTooltip.style.top = `${y}px`;
    }

    protected override update_theme(): void {
        this.viewer.theme = this.themeObject.board;
    }

    protected override make_viewer(): BoardViewer {
        const viewer = new BoardViewer(
            this.canvas,
            !this.disableinteraction,
            this.themeObject.board,
        );

        viewer.contextMenuCallback = (screenX, screenY, items, onSelect) => {
            if (!this.#contextMenu) {
                return;
            }

            this.#contextMenu.show(screenX, screenY, items, onSelect);
        };

        this.addDisposable(
            viewer.addEventListener(KiCanvasSelectEvent.type, () => {
                this.update_net_tooltip();
            }),
        );
        this.canvas.addEventListener("pointermove", (event) => {
            const bounds = this.getBoundingClientRect();
            this.#pointer = {
                x: event.clientX - bounds.left,
                y: event.clientY - bounds.top,
            };
            this.update_net_tooltip();
        });
        this.canvas.addEventListener("pointerleave", () => {
            this.#pointer = null;
            this.#netTooltip.hidden = true;
        });
        return viewer;
    }

    override render() {
        this.canvas = html`<canvas></canvas>` as HTMLCanvasElement;
        this.#contextMenu =
            html`<kc-context-menu></kc-context-menu>` as KCContextMenuElement;
        this.#netTooltip = html`<div
            role="status"
            hidden></div>` as HTMLDivElement;

        return html`<style>
                :host {
                    display: block;
                    touch-action: none;
                    width: 100%;
                    height: 100%;
                    position: relative;
                }

                canvas {
                    width: 100%;
                    height: 100%;
                }

                [role="status"] {
                    position: absolute;
                    pointer-events: none;
                    z-index: 1;
                    max-width: calc(100% - 16px);
                    overflow-wrap: anywhere;
                    padding: 0.35em 0.6em;
                    border: 1px solid var(--grid-outline);
                    border-radius: 4px;
                    background: var(--panel-bg);
                    color: var(--panel-fg);
                    font-size: 0.85rem;
                }
            </style>
            ${this.canvas} ${this.#contextMenu} ${this.#netTooltip}`;
    }
}

window.customElements.define("kc-board-viewer", KCBoardViewerElement);
