from playwright.sync_api import sync_playwright
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Mock window.api
    page.add_init_script("""
        window.api = {
            getCatalogs: async () => ({ catalogs: ['Default'], current: 'Default' }),
            getAllTags: async () => ([{tag: 'Tag1'}, {tag: 'Tag2'}]),
            searchImages: async (params) => {
                console.log('searchImages called with:', params);
                return [];
            },
            switchCatalog: async () => ({ success: true })
        };
    """)

    # Load the file
    cwd = os.getcwd()
    page.goto(f"file://{cwd}/index.html")

    # Wait for the controls to be visible
    page.wait_for_selector("#sortOrderSelect")
    page.wait_for_selector("#limitInput")

    # Take screenshot
    page.screenshot(path="verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
