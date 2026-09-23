/*
    Copyright (c) 2023 Alethea Katherine Flowers.
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { later } from "../../base/async";
import { DropTarget } from "../../base/dom/drag-drop";
import { FilePicker } from "../../base/dom/file-picker";
import { CSS, attribute, html, query } from "../../base/web-components";
import { KCUIElement, KCUIIconElement } from "../../kc-ui";
import { sprites_url } from "../icons/sprites";
import { Project } from "../project";
import type { IFileSystem } from "../services/vfs";
import { KCBoardAppElement } from "./kc-board/app";
import { KCSchematicAppElement } from "./kc-schematic/app";

import kc_ui_styles from "../../kc-ui/kc-ui.css";
import shell_styles from "./kicanvas-shell.css";

import "../icons/sprites";
import "./common/project-panel";

// Setup KCUIIconElement to use icon sprites.
KCUIIconElement.sprites_url = sprites_url;

/**
 * <kc-kicanvas-shell> is the main entrypoint for the standalone KiCanvas
 * application: It's the thing you see when you go to kicanvas.org.
 *
 * The shell is responsible for managing the currently loaded Project and
 * switching between the different viewer apps (<kc-schematic-app>,
 * <kc-board-app>).
 *
 * This is a simplified version of the subtree:
 *
 * <kc-kicanvas-shell>
 *   <kc-ui-app>
 *     <kc-project-panel>
 *     <kc-schematic-app>
 *       <kc-schematic-viewer>
 *       <kc-ui-activity-side-bar>
 *     <kc-board-app>
 *       <kc-board-viewer>
 *       <kc-ui-activity-side-bar>
 *
 */
class KiCanvasShellElement extends KCUIElement {
    static override styles = [
        ...KCUIElement.styles,
        // TODO: Find a better way to handle these two styles.
        new CSS(kc_ui_styles),
        new CSS(shell_styles),
    ];

    project: Project = new Project();

    #schematic_app: KCSchematicAppElement;
    #board_app: KCBoardAppElement;

    constructor() {
        super();
        this.provideContext("project", this.project);
    }

    @attribute({ type: Boolean })
    public loading: boolean;

    @attribute({ type: Boolean })
    public loaded: boolean;

    @query(`button[name="open_local"]`, true)
    public open_file_button: HTMLButtonElement;

    override initialContentCallback() {
        later(async () => {
            new DropTarget(this, async (fs) => {
                await this.setup_project(fs);
            });
        });

        this.open_file_button.addEventListener("click", async (e) => {
            FilePicker.pick(async (vfs) => {
                await this.setup_project(vfs);
            });
        });
    }

    private async setup_project(vfs: IFileSystem) {
        this.loaded = false;
        this.loading = true;

        try {
            await vfs.setup();
            await this.project.load(vfs);
            this.project.set_active_page(this.project.first_page);
            this.loaded = true;
        } catch (e) {
            console.error(e);
        } finally {
            this.loading = false;
        }
    }

    override render() {
        this.#schematic_app = html`
            <kc-schematic-app controls="full"></kc-schematic-app>
        ` as KCSchematicAppElement;
        this.#board_app = html`
            <kc-board-app controls="full"></kc-board-app>
        ` as KCBoardAppElement;

        return html`
            <kc-ui-app>
                <section class="overlay">
                    <h1>
                        <img src="icon.webp" alt="" />
                        kinvas
                    </h1>
                    <p>
                        A focused KiCad viewer for inspecting boards, replaying
                        layout progress, and exporting presentation-ready
                        graphics.
                    </p>
                    <p>
                        Drop your KiCad files here, or
                        <button name="open_local" class="link_button">
                            open from local
                        </button>
                    </p>
                    <p class="note">
                        Files stay in your browser.
                        <a href="https://github.com/Nigh/kinvas" target="_blank"
                            >kinvas is open source</a
                        >
                        under the MIT License.
                    </p>
                    <p class="github">
                        <a
                            href="https://github.com/Nigh/kinvas"
                            target="_blank"
                            title="kinvas on GitHub">
                            <img
                                src="images/github-mark-white.svg"
                                alt="GitHub" />
                        </a>
                    </p>
                </section>
                <main>${this.#schematic_app} ${this.#board_app}</main>
            </kc-ui-app>
        `;
    }
}

window.customElements.define("kc-kicanvas-shell", KiCanvasShellElement);
