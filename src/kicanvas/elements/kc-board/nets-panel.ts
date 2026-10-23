/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { html, query } from "../../../base/web-components";
import {
    KCUIElement,
    KCUIFilteredListElement,
    KCUIMenuElement,
    KCUITextFilterInputElement,
    type KCUIMenuItemElement,
} from "../../../kc-ui";
import { BoardViewer } from "../../../viewers/board/viewer";
import { KiCanvasSelectEvent } from "../../../viewers/base/events";

export class KCBoardNetsPanelElement extends KCUIElement {
    viewer: BoardViewer;

    override connectedCallback() {
        (async () => {
            this.viewer = await this.requestLazyContext("viewer");
            await this.viewer.loaded;
            super.connectedCallback();
        })();
    }

    override initialContentCallback() {
        this.addEventListener("kc-ui-menu:select", (e) => {
            const item = (e as CustomEvent).detail as KCUIMenuItemElement;

            const number = parseInt(item?.name, 10);

            if (!Number.isFinite(number)) {
                return;
            }

            this.viewer.highlight_net(number);
        });

        this.addDisposable(
            this.viewer.addEventListener(KiCanvasSelectEvent.type, () => {
                this.menu.deselect();
                const number = this.viewer.selected_net;
                const selected =
                    number === null
                        ? null
                        : this.menu.item_by_name(String(number));
                if (selected) {
                    this.search_input_elm.value = "";
                    this.item_filter_elem.filter_text = null;
                    selected.selected = true;
                    selected.scrollIntoView({ block: "nearest" });
                }
            }),
        );

        // Wire up search to filter the list
        this.search_input_elm.addEventListener("input", (e) => {
            this.item_filter_elem.filter_text =
                this.search_input_elm.value ?? null;
        });
    }

    @query("kc-ui-menu", true)
    private menu!: KCUIMenuElement;

    @query("kc-ui-text-filter-input", true)
    private search_input_elm!: KCUITextFilterInputElement;

    @query("kc-ui-filtered-list", true)
    private item_filter_elem!: KCUIFilteredListElement;

    override render() {
        const board = this.viewer.board;

        const nets = [];

        for (const net of board.nets) {
            nets.push(
                html`<kc-ui-menu-item
                    name="${net.number}"
                    data-match-text="${net.number} ${net.name}">
                    <span class="very-narrow"> ${net.number} </span>
                    <span>${net.name}</span>
                </kc-ui-menu-item>`,
            );
        }

        return html`
            <kc-ui-panel>
                <kc-ui-panel-title title="Nets"></kc-ui-panel-title>
                <kc-ui-panel-body>
                    <kc-ui-text-filter-input></kc-ui-text-filter-input>
                    <kc-ui-filtered-list>
                        <kc-ui-menu class="outline">${nets}</kc-ui-menu>
                    </kc-ui-filtered-list>
                </kc-ui-panel-body>
            </kc-ui-panel>
        `;
    }
}

window.customElements.define("kc-board-nets-panel", KCBoardNetsPanelElement);
